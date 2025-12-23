import asyncio
import json
import logging
import os
import subprocess
from datetime import datetime, timedelta
import re

from artcommonlib import redis, bigquery
from google.cloud import bigquery as gcp_bigquery
from artcommonlib.constants import TASKRUN_TABLE_ID
from artcommonlib.konflux.konflux_build_record import KonfluxBuildRecord, KonfluxBundleBuildRecord, KonfluxFbcBuildRecord
from artcommonlib.konflux.konflux_db import KonfluxDb
from flask import Flask, render_template, request, jsonify
from sqlalchemy import Column, DateTime, String

# How far back should we search for builds?
DELTA_SEARCH = timedelta(days=180)
# How long before cached Redis keys are cleared
CACHE_EXPIRY = 60 * 60 * 24 * 7  # 1 week
# How many build results can we handle?
MAX_BUILDS = 1000
# Dev mode: bypass Redis if unavailable (set ART_DASH_DEV=1)
DEV_MODE = os.environ.get('ART_DASH_DEV', '').lower() in ('1', 'true', 'yes')


class KonfluxBuildHistory(Flask):
    def __init__(self):
        super().__init__(__name__)
        self._logger = logging.getLogger(__name__)  # logger field is already used by Flask, not overwriting
        self.init_logger()
        self.add_routes()

        self.konflux_db = KonfluxDb()
        self._logger.info('Konflux DB initialized')
        self._redis_available = True  # Assume Redis is available until proven otherwise
        self._memory_cache = {}  # In-memory fallback cache when Redis unavailable
        if DEV_MODE:
            self._logger.warning('Dev mode enabled (ART_DASH_DEV=1) - Redis errors will be bypassed')

    def init_logger(self):
        formatter = logging.Formatter('%(asctime)s %(name)s:%(levelname)s %(message)s')
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)
        self._logger.propagate = False
        self._logger.level = logging.INFO

    async def safe_redis_get(self, key: str):
        """Get value from Redis, falling back to memory cache if unavailable (in dev mode)."""
        if not self._redis_available:
            # Use in-memory cache as fallback
            return self._memory_cache.get(key)
        try:
            return await redis.get_value(key)
        except Exception as e:
            if DEV_MODE:
                self._logger.warning('Redis unavailable (dev mode), using in-memory cache: %s', e)
                self._redis_available = False
                return self._memory_cache.get(key)
            raise

    async def safe_redis_set(self, key: str, value: str, expiry: int = CACHE_EXPIRY):
        """Set value in Redis and memory cache, silently failing Redis if unavailable (in dev mode)."""
        if not self._redis_available:
            # Use in-memory cache as fallback
            self._memory_cache[key] = value
            return
        try:
            await redis.set_value(key, value, expiry=expiry)
            # Also store in memory cache for faster subsequent access
            self._memory_cache[key] = value
        except Exception as e:
            if DEV_MODE:
                self._logger.warning('Redis unavailable (dev mode), using in-memory cache: %s', e)
                self._redis_available = False
                self._memory_cache[key] = value
            else:
                raise

    def add_routes(self):
        @self.route("/")
        def index():
            return render_template(
                "index.html",
                query_params={},
                search_results=[]
            )

        @self.route("/search", methods=["GET"])
        async def search():
            query_params = request.args.to_dict()
            # Handle multi-select outcome values
            outcomes = request.args.getlist('outcome')
            search_results = await self.query(query_params, outcomes=outcomes)

            # Check if the request is an AJAX request
            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return jsonify(search_results)  # Respond with JSON for AJAX requests

            # For direct URL access, render template with results
            return render_template(
                "index.html",
                query_params=query_params,
                initial_results=search_results,  # Pass results to template
                is_search_page=True  # Add flag to indicate this is a search result page
            )

        @self.route("/get_groups", methods=["GET"])
        async def get_groups():
            """Fetch distinct group names from BigQuery using efficient DISTINCT query."""
            cache_key = self.redis_groups_key()

            # Try to get from cache first
            cached = await self.safe_redis_get(cache_key)
            if cached:
                self._logger.info('Returning cached group names')
                return jsonify(json.loads(cached))

            # Query BigQuery for distinct groups from last 180 days using efficient DISTINCT query
            try:
                self._logger.info('Fetching distinct group names from BigQuery')
                start_date = datetime.now() - DELTA_SEARCH
                start_timestamp = start_date.strftime('%Y-%m-%d')

                # Use Google Cloud BigQuery client directly for raw SQL query
                client = gcp_bigquery.Client()
                query = f"""
                    SELECT DISTINCT `group`
                    FROM `openshift-art.events.builds`
                    WHERE start_time >= TIMESTAMP('{start_timestamp}')
                    AND `group` IS NOT NULL
                """
                query_job = client.query(query)
                rows = query_job.result()
                all_groups = {row['group'] for row in rows if row.group}

                # Sort groups: openshift-X.Y at the top (descending), then alphabetically
                def sort_key(group):
                    openshift_pattern = re.match(r"openshift-(\d+)\.(\d+)$", group)
                    if openshift_pattern:
                        major, minor = map(int, openshift_pattern.groups())
                        return (0, -major, -minor)  # 0 for priority, negative for reverse order
                    return (1, group.lower())  # everything else alphabetically

                sorted_groups = sorted(all_groups, key=sort_key)
                self._logger.info('Found %d distinct groups, first 10: %s',
                                  len(sorted_groups), ', '.join(sorted_groups[:10]))

                # Cache for 1 hour (groups don't change frequently)
                await self.safe_redis_set(cache_key, json.dumps(sorted_groups), expiry=60 * 60)

                return jsonify(sorted_groups)

            except Exception as e:
                self._logger.error('Failed to fetch group names: %s', e)
                return jsonify([])

        @self.route("/build")
        async def show_build():
            default_result = {}
            nvr = request.args.get('nvr')
            outcome = request.args.get('outcome')
            build_type = request.args.get('type')
            redis_key = self.redis_build_key(nvr)

            if not nvr:
                # nvr param was not passed in
                nvr = '<undefined>'
                result = default_result

            elif redis_value := await self.safe_redis_get(redis_key):
                # nvr param was passed in, and there is a cached entry for it
                result = json.loads(redis_value)

            else:
                # nvr param was passed in, but there is no cached entry for it
                # fetch the build record from Konflux DB
                try:
                    match build_type:
                        case 'image':
                            self.konflux_db.bind(KonfluxBuildRecord)
                        case 'bundle':
                            self.konflux_db.bind(KonfluxBundleBuildRecord)
                        case 'fbc':
                            self.konflux_db.bind(KonfluxFbcBuildRecord)
                        case _:
                            raise ValueError(f"Unknown build type: {build_type}")

                    builds = [build async for build in self.konflux_db.search_builds_by_fields(
                        where={'nvr': nvr, 'outcome': outcome},
                        limit=1
                    )]

                    if not builds:
                        self._logger.warning('No builds found for NVR %s with state %s', nvr, outcome)
                        result = default_result

                    else:
                        # We expect only one build for a given NVR and outcome
                        self._logger.info('Found %d builds for NVR %s with state %s', len(builds), nvr, outcome)
                        build = builds[0]
                        if getattr(build, 'embargoed', False):
                            self._logger.warning('Build %s is embargoed, not displaying details', nvr)
                            result = default_result

                        else:
                            result = build.to_dict() if build else default_result

                            # Update the cache
                            await self.safe_redis_set(redis_key, json.dumps(result))

                except Exception as e:
                    self._logger.error(
                        'Failed fetching information for build %s with state %s: %s', nvr, outcome, e)
                    result = default_result

            # FBCs are tagged to quay.io/redhat-user-workloads/ocp-art-tenant/art-fbc which is already public,
            # so no need for art-images-share pullspec
            if result and build_type != 'fbc':
                result["art_images_share_pullspec"] = result["image_pullspec"].replace("art-images", "art-images-share")

            return render_template("build.html",
                                   nvr=nvr,
                                   build=result)

        @self.route("/logs")
        async def show_logs():
            nvr = request.args.get('nvr')
            record_id = request.args.get('record_id')
            after = datetime.strptime(request.args.get('after'), "%a, %d %b %Y %H:%M:%S %Z")

            # Fetch task runs
            bq_client = bigquery.BigQueryClient()
            bq_client.bind(TASKRUN_TABLE_ID)
            where_clauses = [
                    Column('start_time', DateTime) >= after,
                    Column('record_id', String) == record_id,
            ]
            rows = await bq_client.select(where_clauses)

            # Gather container logs
            containers = [container for row in rows for container in row.get('containers', []) if container.get('log_output')]
            return render_template("logs.html", nvr=nvr, containers=containers)

        @self.route("/packages")
        async def show_packages():
            nvr = request.args.get("nvr")
            default_result = []

            if not nvr:
                # nvr param was not passed in
                nvr = '<undefined>'
                result = default_result


            elif (raw_value := await self.safe_redis_get(self.redis_packages_key(nvr))) and (parsed := json.loads(raw_value)):
                # nvr param was passed in, and there is a cached entry for it,
                # and the cached entry is not an empty list
                result = parsed

            else:
                # nvr param was passed in, but there is no cached entry for it,
                # or the cached entry is an empty list
                # fetch the build record from Konflux DB
                try:
                    self.konflux_db.bind(KonfluxBuildRecord)
                    build = [build async for build in self.konflux_db.search_builds_by_fields(
                        where={'nvr': nvr, 'outcome': ['success', 'failure']},
                        limit=1
                    )]
                    result = build[0].installed_packages if build else []

                    # Update the cache
                    await self.safe_redis_set(self.redis_packages_key(nvr), json.dumps(result))

                except Exception as e:
                    self._logger.error('Failed fetching installed params for %s: %s', nvr, e)
                    result = default_result

            return render_template("packages.html",
                                   nvr=nvr,
                                   packages=result)

    async def query(self, params: dict, outcomes: list = None):
        self._logger.info("Search Parameters: %s, Outcomes: %s", params, outcomes)

        where_clauses = {}

        group = params.get('group', '')
        if group:
            where_clauses['group'] = group

        commitish = params.get('commitish', '').strip()
        if commitish:
            where_clauses['commitish'] = commitish

        assembly = params.get('assembly', '').strip()
        if assembly and assembly != '*':
            where_clauses['assembly'] = assembly

        # Handle multi-select outcomes
        if outcomes and len(outcomes) > 0:
            # If all three are selected, don't filter (equivalent to "completed")
            all_outcomes = {'success', 'failure', 'pending'}
            if set(outcomes) != all_outcomes:
                where_clauses['outcome'] = outcomes

        engine = params.get('engine', 'both')
        if engine != 'both':
            where_clauses['engine'] = engine

        extra_patterns = {}

        name = params.get('name', '').strip()
        if name:
            extra_patterns['name'] = name

        nvr = params.get('nvr', '').strip()
        if nvr:
            extra_patterns['nvr'] = nvr

        art_job_url = params.get('art-job-url', '').strip()
        if art_job_url:
            extra_patterns['art_job_url'] = art_job_url

        after = params.get('after', '').strip()
        if after:
            try:
                start_search = datetime.strptime(after, '%Y-%m-%d')
            except Exception as e:
                self._logger.warning('Failed parsing date string %s: %s', after, e)
                start_search = None

        else:
            start_search = datetime.now() - DELTA_SEARCH

        async def search_for_build_type(record_class, filter_embargoed=False):
            # Create separate KonfluxDb instance to avoid bind() race condition when running queries in parallel
            db = KonfluxDb()
            db.bind(record_class)
            builds = [build async for build in db.search_builds_by_fields(
                start_search=start_search,
                where=where_clauses,
                extra_patterns=extra_patterns,
                order_by='end_time',
                limit=MAX_BUILDS
            )]
            if filter_embargoed:
                return [b for b in builds if not b.embargoed]
            return builds

        tasks = [
            search_for_build_type(KonfluxBuildRecord, filter_embargoed=True),
            search_for_build_type(KonfluxBundleBuildRecord),
            search_for_build_type(KonfluxFbcBuildRecord)
        ]
        image_builds, bundle_builds, fbc_builds = await asyncio.gather(*tasks)

        # Combine all builds, sort by end time if available (for completed builds), or by start time if not
        all_builds = image_builds + bundle_builds + fbc_builds
        all_builds = sorted(all_builds, key=lambda record: record.end_time if record.end_time else record.start_time, reverse=True)
        all_builds = all_builds[:MAX_BUILDS]  # Limit to MAX_BUILDS

        def get_build_type(build):
            if isinstance(build, KonfluxFbcBuildRecord):
                return "fbc"
            elif isinstance(build, KonfluxBundleBuildRecord):
                return "bundle"
            elif isinstance(build, KonfluxBuildRecord):
                return "image"
            raise ValueError(f"Unknown build type: {type(build)}")

        results = [
            {
                "name": b.name,
                "nvr": b.nvr,
                "outcome": str(b.outcome),
                "assembly": b.assembly,
                "group": b.group,
                "commitish": b.commitish,
                "time": b.end_time.strftime("%B %d, %Y, %I:%M:%S %p") if b.end_time else b.start_time.strftime("%B %d, %Y, %I:%M:%S %p"),
                "engine": str(b.engine),
                "source": f'{b.source_repo}/tree/{b.commitish}',
                "pipeline URL": b.build_pipeline_url,
                "art-job-url": b.art_job_url,
                "type": get_build_type(b),
                "record_id": b.record_id,
                "start_time": b.start_time,
            } for b in all_builds
        ]

        # Return the results as JSON
        return results

    @staticmethod
    def redis_packages_key(nvr: str):
        return f'appdata:art-build-history:installed-packages:{nvr}'

    @staticmethod
    def redis_build_key(nvr: str):
        return f'appdata:art-build-history:build:{nvr}'

    @staticmethod
    def redis_groups_key():
        return 'appdata:art-build-history:distinct-groups'


app = KonfluxBuildHistory()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
