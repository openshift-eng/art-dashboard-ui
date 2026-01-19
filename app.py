import asyncio
import json
from urllib.parse import unquote
import logging
import os
import subprocess
from datetime import datetime, timedelta, timezone
import re

from artcommonlib import redis, bigquery
from google.cloud import bigquery as gcp_bigquery
from artcommonlib.constants import TASKRUN_TABLE_ID, GOOGLE_CLOUD_PROJECT
from artcommonlib.konflux.konflux_build_record import (
    KonfluxBuildRecord,
    KonfluxBundleBuildRecord,
    KonfluxFbcBuildRecord,
    KonfluxBuildOutcome,
)
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

        self.konflux_db = KonfluxDb()
        self._logger.info('Konflux DB initialized')
        self._redis_available = True  # Assume Redis is available until proven otherwise
        self._memory_cache = {}  # In-memory fallback cache when Redis unavailable
        if DEV_MODE:
            self._logger.warning('Dev mode enabled (ART_DASH_DEV=1) - Redis errors will be bypassed')
        self.add_routes()

    def init_logger(self):
        formatter = logging.Formatter('%(asctime)s %(name)s:%(levelname)s %(message)s')
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)
        self._logger.propagate = False
        self._logger.level = logging.INFO

    async def safe_redis_get(self, key: str):
        """Get value from Redis, falling back to memory cache if unavailable.
        
        In dev mode, silently falls back to in-memory cache.
        In production, logs warning but still falls back to keep app functional.
        """
        if not self._redis_available:
            return self._memory_cache.get(key)
        try:
            return await redis.get_value(key)
        except Exception as e:
            if self._redis_available:  # Only log on first failure
                if DEV_MODE:
                    self._logger.warning('Redis unavailable (dev mode), using in-memory cache: %s', e)
                else:
                    self._logger.error('Redis unavailable, falling back to in-memory cache: %s', e)
                self._redis_available = False
            return self._memory_cache.get(key)

    async def safe_redis_set(self, key: str, value: str, expiry: int = CACHE_EXPIRY):
        """Set value in Redis and memory cache, with graceful fallback if Redis unavailable.
        
        Always stores in memory cache. Redis failures are logged but don't break the app.
        """
        # Always store in memory cache
        self._memory_cache[key] = value
        
        if not self._redis_available:
            return
        try:
            await redis.set_value(key, value, expiry=expiry)
        except Exception as e:
            if self._redis_available:  # Only log on first failure
                if DEV_MODE:
                    self._logger.warning('Redis unavailable (dev mode), using in-memory cache: %s', e)
                else:
                    self._logger.error('Redis unavailable, falling back to in-memory cache: %s', e)
                self._redis_available = False

    @staticmethod
    def extract_nvr_start_time(nvr_value: str):
        """Extract datetime from NVR string (format YYYYMMDDHHMM embedded in NVR)."""
        if not nvr_value:
            return None
        match = re.search(r'-(\d{12})\.', nvr_value)
        if not match:
            return None
        try:
            return datetime.strptime(match.group(1), '%Y%m%d%H%M')
        except ValueError:
            return None

    def add_routes(self):
        extract_nvr_start_time = self.extract_nvr_start_time
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
                search_results=search_results,  # Pass results to template
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
                client = gcp_bigquery.Client(project=GOOGLE_CLOUD_PROJECT)
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

        @self.route("/get_source_repos", methods=["GET"])
        async def get_source_repos():
            """Fetch distinct source repository URLs from BigQuery using efficient DISTINCT query."""
            cache_key = self.redis_source_repos_key()

            # Try to get from cache first
            cached = await self.safe_redis_get(cache_key)
            if cached:
                self._logger.info('Returning cached source repos')
                return jsonify(json.loads(cached))

            # Query BigQuery for distinct source repos from last 180 days
            try:
                self._logger.info('Fetching distinct source repos from BigQuery')
                start_date = datetime.now() - DELTA_SEARCH
                start_timestamp = start_date.strftime('%Y-%m-%d')

                # Use Google Cloud BigQuery client directly for raw SQL query
                client = gcp_bigquery.Client(project=GOOGLE_CLOUD_PROJECT)
                query = f"""
                    SELECT DISTINCT source_repo
                    FROM `openshift-art.events.builds`
                    WHERE start_time >= TIMESTAMP('{start_timestamp}')
                    AND source_repo IS NOT NULL
                """
                query_job = client.query(query)
                rows = query_job.result()

                # Strip https://github.com/ prefix for cleaner display
                github_prefix = 'https://github.com/'
                all_repos = set()
                for row in rows:
                    if row.source_repo:
                        repo = row.source_repo
                        if repo.startswith(github_prefix):
                            repo = repo[len(github_prefix):]
                        all_repos.add(repo)
                all_repos = sorted(all_repos)

                self._logger.info('Found %d distinct source repos', len(all_repos))

                # Cache for 1 week
                await self.safe_redis_set(cache_key, json.dumps(all_repos), expiry=CACHE_EXPIRY)

                return jsonify(all_repos)

            except Exception as e:
                self._logger.error('Failed to fetch source repos: %s', e)
                return jsonify([])

        @self.route("/build")
        async def show_build():
            default_result = {}
            nvr = request.args.get('nvr')
            outcome = request.args.get('outcome')
            build_type = request.args.get('type')
            record_id = request.args.get('record_id')
            group = request.args.get('group')
            redis_key = self.redis_build_record_key(record_id) if record_id else self.redis_build_key(nvr)
            search_outcomes = [outcome] if outcome else ['success', 'failure', 'pending']

            if not nvr or not record_id:
                error_message = 'Both nvr and record_id are required to view build details.'
                return render_template(
                    "build.html",
                    nvr=nvr or '<undefined>',
                    build_type=build_type,
                    build=default_result,
                    logs_after=None,
                    group=group,
                    error_message=error_message
                )

            elif redis_value := await self.safe_redis_get(redis_key):
                # nvr param was passed in, and there is a cached entry for it
                result = json.loads(redis_value)

            else:
                # nvr param was passed in, but there is no cached entry for it
                # fetch the build record from Konflux DB
                try:
                    async def fetch_build(record_class):
                        db = KonfluxDb()
                        db.bind(record_class)
                        if record_id:
                            where = {'record_id': record_id, 'outcome': ['success', 'failure', 'pending']}
                        else:
                            where = {'nvr': nvr, 'outcome': search_outcomes}
                        if group:
                            where['group'] = group
                        return [build async for build in db.search_builds_by_fields(where=where, limit=1)]

                    builds = []
                    if build_type:
                        match build_type:
                            case 'image':
                                builds = await fetch_build(KonfluxBuildRecord)
                            case 'bundle':
                                builds = await fetch_build(KonfluxBundleBuildRecord)
                            case 'fbc':
                                builds = await fetch_build(KonfluxFbcBuildRecord)
                            case _:
                                raise ValueError(f"Unknown build type: {build_type}")
                    else:
                        for record_class in (KonfluxBuildRecord, KonfluxBundleBuildRecord, KonfluxFbcBuildRecord):
                            builds = await fetch_build(record_class)
                            if builds:
                                break

                    if not builds:
                        self._logger.warning('No builds found for NVR %s record_id %s with state %s', nvr, record_id, outcome)
                        result = default_result

                    else:
                        # We expect only one build for a given NVR and outcome
                        self._logger.info('Found %d builds for NVR %s with state %s', len(builds), nvr, outcome)
                        build = builds[0]
                        # Consider build embargoed only if embargoed flag is True AND group doesn't contain "golang"
                        # (golang builder images are incorrectly flagged as embargoed)
                        is_embargoed = getattr(build, 'embargoed', False) and 'golang' not in (getattr(build, 'group', '') or '').lower()
                        if is_embargoed:
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

            # Support JSON download via Accept header or format query param
            if request.args.get('format') == 'json' or request.accept_mimetypes.best == 'application/json':
                return jsonify(result)

            logs_after = extract_nvr_start_time(nvr)
            logs_after = logs_after.isoformat() if logs_after else None

            return render_template("build.html",
                                   nvr=nvr,
                                   build_type=build_type,
                                   build=result,
                                   logs_after=logs_after,
                                   group=group or (result.get('group') if result else None),
                                   error_message=None)

        @self.route("/logs")
        async def show_logs():
            nvr = request.args.get('nvr')
            record_id = request.args.get('record_id')
            group = request.args.get('group')
            after = request.args.get('after')
            start_after = None
            nvr_after = extract_nvr_start_time(nvr)
            if nvr_after:
                start_after = nvr_after
            elif after:
                try:
                    start_after = datetime.strptime(after, "%a, %d %b %Y %H:%M:%S %Z")
                except ValueError:
                    try:
                        start_after = datetime.fromisoformat(after)
                    except ValueError:
                        self._logger.warning('Failed parsing logs "after" value: %s', after)

            build_outcome = None
            build_pipeline_url = None
            art_job_url = None
            build_identity = None
            error_message = None

            if not nvr or not record_id:
                error_message = 'Both nvr and record_id are required to view logs.'
                return render_template(
                    "logs.html",
                    nvr=nvr or '<undefined>',
                    containers=[],
                    logs_available=False,
                    build_outcome=None,
                    build_pipeline_url=None,
                    art_job_url=None,
                    build_identity=None,
                    error_message=error_message
                )

            if record_id or nvr:
                for record_class in (KonfluxBuildRecord, KonfluxBundleBuildRecord, KonfluxFbcBuildRecord):
                    try:
                        db = KonfluxDb()
                        db.bind(record_class)
                        where = {'outcome': ['success', 'failure', 'pending']}
                        if record_id:
                            where['record_id'] = record_id
                        else:
                            where['nvr'] = nvr
                        if group:
                            where['group'] = group
                        builds = [build async for build in db.search_builds_by_fields(where=where, limit=1)]
                        if builds:
                            build = builds[0]
                            build_outcome = getattr(build, 'outcome', None)
                            build_pipeline_url = getattr(build, 'build_pipeline_url', None)
                            art_job_url = getattr(build, 'art_job_url', None)
                            build_identity = {
                                'nvr': getattr(build, 'nvr', None),
                                'name': getattr(build, 'name', None),
                                'version': getattr(build, 'version', None),
                                'release': getattr(build, 'release', None),
                                'el_target': getattr(build, 'el_target', None),
                                'group': getattr(build, 'group', None),
                                'assembly': getattr(build, 'assembly', None),
                                'component': getattr(build, 'component', None),
                            }
                            break
                    except Exception as e:
                        self._logger.warning('Failed looking up build details for logs (%s): %s', record_class, e)

            containers = []
            if record_id and start_after:
                end_after = start_after + timedelta(days=2)
                # Fetch task runs
                bq_client = bigquery.BigQueryClient()
                bq_client.bind(TASKRUN_TABLE_ID)
                where_clauses = [
                        Column('creation_time', DateTime) >= start_after,
                        Column('creation_time', DateTime) < end_after,
                        Column('record_id', String) == record_id,
                ]
                rows = await bq_client.select(where_clauses)

                # Gather container logs (include containers even when log_output is empty)
                containers = [container for row in rows for container in (row.get('containers', []) or [])]

            # Support JSON download via Accept header or format query param
            if request.args.get('format') == 'json' or request.accept_mimetypes.best == 'application/json':
                return jsonify({
                    'nvr': nvr,
                    'record_id': record_id,
                    'group': group or (build_identity.get('group') if build_identity else None),
                    'build_identity': build_identity,
                    'build_pipeline_url': build_pipeline_url,
                    'art_job_url': art_job_url,
                    'containers': containers,
                })

            return render_template(
                "logs.html",
                nvr=nvr,
                record_id=record_id,
                group=group or (build_identity.get('group') if build_identity else None),
                containers=containers,
                build_pipeline_url=build_pipeline_url,
                art_job_url=art_job_url,
                build_identity=build_identity,
                error_message=error_message,
            )

        @self.route("/diff")
        async def show_diff():
            """Show package differences between a build and a comparison build."""
            nvr = request.args.get('nvr')
            record_id = request.args.get('record_id')
            group = request.args.get('group')
            compare_nvr = request.args.get('compare')
            
            error_message = None
            build_identity = None
            compare_identity = None
            replaced_packages = []
            shared_packages = []
            build_packages_map = {}
            compare_packages_map = {}

            if not nvr or not record_id:
                error_message = 'Both nvr and record_id are required to view package diff.'
                return render_template(
                    "diff.html",
                    nvr=nvr or '<undefined>',
                    compare_nvr=compare_nvr,
                    group=group,
                    build_identity=None,
                    compare_identity=None,
                    replaced_packages=[],
                    shared_packages=[],
                    error_message=error_message
                )
            
            if not compare_nvr:
                error_message = 'A compare NVR is required to view package diff.'
                return render_template(
                    "diff.html",
                    nvr=nvr,
                    compare_nvr=None,
                    group=group,
                    build_identity=None,
                    compare_identity=None,
                    replaced_packages=[],
                    shared_packages=[],
                    error_message=error_message
                )

            # Fetch the main build by record_id
            main_build = None
            for record_class in (KonfluxBuildRecord, KonfluxBundleBuildRecord, KonfluxFbcBuildRecord):
                try:
                    db = KonfluxDb()
                    db.bind(record_class)
                    where = {'record_id': record_id, 'outcome': ['success', 'failure', 'pending']}
                    if group:
                        where['group'] = group
                    builds = [build async for build in db.search_builds_by_fields(where=where, limit=1)]
                    if builds:
                        main_build = builds[0]
                        break
                except Exception as e:
                    self._logger.warning('Failed fetching main build for diff (%s): %s', record_class, e)

            if not main_build:
                error_message = f'Unable to find build with record_id: {record_id}'
                return render_template(
                    "diff.html",
                    nvr=nvr,
                    compare_nvr=compare_nvr,
                    group=group,
                    build_identity=None,
                    compare_identity=None,
                    replaced_packages=[],
                    shared_packages=[],
                    error_message=error_message
                )

            build_identity = {
                'nvr': getattr(main_build, 'nvr', None),
                'name': getattr(main_build, 'name', None),
                'version': getattr(main_build, 'version', None),
                'release': getattr(main_build, 'release', None),
                'group': getattr(main_build, 'group', None),
                'assembly': getattr(main_build, 'assembly', None),
                'record_id': getattr(main_build, 'record_id', None),
            }

            # Get installed packages from main build
            main_packages = getattr(main_build, 'installed_packages', None) or []
            if isinstance(main_packages, str):
                main_packages = [p.strip() for p in main_packages.split('\n') if p.strip()]

            # Parse main packages into name -> version map
            for pkg in main_packages:
                # Package format is typically "name-version" or "name-version-release.arch"
                # We'll use the full package as the key for simplicity
                # Try to extract name portion (everything before the version)
                parts = pkg.rsplit('-', 2)
                if len(parts) >= 2:
                    # Assume name is parts[0] for comparison
                    pkg_name = parts[0]
                    build_packages_map[pkg_name] = pkg
                else:
                    build_packages_map[pkg] = pkg

            # Search for comparison build by NVR
            # Extract datetime from compare_nvr for search range
            compare_datetime = extract_nvr_start_time(compare_nvr)
            if compare_datetime:
                compare_datetime = compare_datetime.replace(tzinfo=timezone.utc)
                compare_start_search = compare_datetime - timedelta(days=2)
                compare_end_search = compare_datetime + timedelta(days=2)
            else:
                # No datetime in NVR - use a wider window
                compare_start_search = datetime.now(timezone.utc) - DELTA_SEARCH
                compare_end_search = datetime.now(timezone.utc)

            # Extract name from compare_nvr (strip -container suffix if present)
            compare_name = compare_nvr.split('-')[0] if '-' in compare_nvr else compare_nvr
            # Try to get a better name by finding the pattern before version
            nvr_match = re.match(r'^(.+?)-v?\d', compare_nvr)
            if nvr_match:
                compare_name = nvr_match.group(1)
                if compare_name.endswith('-container'):
                    compare_name = compare_name[:-10]

            compare_build = None
            compare_search_url = None
            for record_class in (KonfluxBuildRecord, KonfluxBundleBuildRecord, KonfluxFbcBuildRecord):
                try:
                    db = KonfluxDb()
                    db.bind(record_class)
                    where = {
                        'outcome': ['success'],  # Only successful builds have reliable packages
                    }
                    extra_patterns = {'nvr': compare_nvr}
                    if compare_name:
                        extra_patterns['name'] = compare_name
                    builds = [build async for build in db.search_builds_by_fields(
                        start_search=compare_start_search,
                        end_search=compare_end_search,
                        where=where,
                        extra_patterns=extra_patterns,
                        order_by='end_time',
                        limit=1
                    )]
                    if builds:
                        compare_build = builds[0]
                        break
                except Exception as e:
                    self._logger.warning('Failed fetching comparison build for diff (%s): %s', record_class, e)

            # Build search URL for error message
            compare_search_url = f"/?name={compare_name}&nvr={compare_nvr}&outcome=success"

            if not compare_build:
                error_message = f'Unable to find successful build for comparison NVR: {compare_nvr}'
                return render_template(
                    "diff.html",
                    nvr=nvr,
                    compare_nvr=compare_nvr,
                    group=group,
                    build_identity=build_identity,
                    compare_identity=None,
                    replaced_packages=[],
                    shared_packages=[],
                    error_message=error_message,
                    compare_search_url=compare_search_url
                )

            compare_identity = {
                'nvr': getattr(compare_build, 'nvr', None),
                'name': getattr(compare_build, 'name', None),
                'version': getattr(compare_build, 'version', None),
                'release': getattr(compare_build, 'release', None),
                'group': getattr(compare_build, 'group', None),
                'assembly': getattr(compare_build, 'assembly', None),
                'record_id': getattr(compare_build, 'record_id', None),
            }

            # Get installed packages from comparison build
            compare_packages = getattr(compare_build, 'installed_packages', None) or []
            if isinstance(compare_packages, str):
                compare_packages = [p.strip() for p in compare_packages.split('\n') if p.strip()]

            # Parse comparison packages into name -> version map
            for pkg in compare_packages:
                parts = pkg.rsplit('-', 2)
                if len(parts) >= 2:
                    pkg_name = parts[0]
                    compare_packages_map[pkg_name] = pkg
                else:
                    compare_packages_map[pkg] = pkg

            # Compare packages
            all_pkg_names = set(build_packages_map.keys()) | set(compare_packages_map.keys())
            for pkg_name in sorted(all_pkg_names):
                build_pkg = build_packages_map.get(pkg_name)
                compare_pkg = compare_packages_map.get(pkg_name)
                
                if build_pkg and compare_pkg:
                    if build_pkg != compare_pkg:
                        # Package exists in both but version differs
                        replaced_packages.append({
                            'name': pkg_name,
                            'build_version': build_pkg,
                            'compare_version': compare_pkg
                        })
                    else:
                        # Package is identical
                        shared_packages.append(build_pkg)
                elif build_pkg:
                    # Package only in build (new package)
                    replaced_packages.append({
                        'name': pkg_name,
                        'build_version': build_pkg,
                        'compare_version': None
                    })
                else:
                    # Package only in comparison (removed package)
                    replaced_packages.append({
                        'name': pkg_name,
                        'build_version': None,
                        'compare_version': compare_pkg
                    })

            # Support JSON download
            if request.args.get('format') == 'json' or request.accept_mimetypes.best == 'application/json':
                return jsonify({
                    'nvr': nvr,
                    'compare_nvr': compare_nvr,
                    'build_identity': build_identity,
                    'compare_identity': compare_identity,
                    'replaced_packages': replaced_packages,
                    'shared_packages': shared_packages,
                })

            return render_template(
                "diff.html",
                nvr=nvr,
                compare_nvr=compare_nvr,
                group=group,
                build_identity=build_identity,
                compare_identity=compare_identity,
                replaced_packages=replaced_packages,
                shared_packages=shared_packages,
                error_message=error_message
            )

    async def query(self, params: dict, outcomes: list = None):
        self._logger.info("Search Parameters: %s, Outcomes: %s", params, outcomes)

        where_clauses = {}

        group = params.get('group', '')
        if group:
            where_clauses['group'] = group

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
        warnings = []

        name = params.get('name', '').strip()
        original_name = name
        if name:
            # NVRs often have "-container" suffix, but the "name" column in the database does not
            if name.endswith('-container'):
                name = name[:-10]  # Remove "-container" suffix
                warnings.append(f'The "-container" suffix was removed from the name for searching. Using: "{name}"')
            extra_patterns['name'] = name

        source_repo = params.get('source_repo', '').strip()
        if source_repo:
            # Use pattern matching since we strip https://github.com/ from displayed options
            extra_patterns['source_repo'] = source_repo

        commitish = params.get('commitish', '').strip().lower()
        if commitish:
            # Use pattern matching with starts-with logic
            extra_patterns['commitish'] = f'^{commitish}'

        nvr = params.get('nvr', '').strip()
        if nvr:
            extra_patterns['nvr'] = nvr

        record_id = params.get('record_id', '').strip()
        if record_id:
            where_clauses['record_id'] = record_id

        # image_sha_tag is handled specially as it needs OR logic between image_pullspec and image_tag
        image_sha_tag = params.get('image_sha_tag', '').strip()

        art_job_url = params.get('art-job-url', '').strip()
        art_job_url_variants = None
        if art_job_url:
            # ART job URLs can be encoded multiple times in records (e.g. %252F).
            # Build normalized variants and apply filtering in Python to avoid
            # BigQuery regex mismatches.
            variants = set()
            current = art_job_url
            for _ in range(4):
                if current in variants:
                    break
                variants.add(current)
                current = unquote(current)
            art_job_url_variants = {v.lower() for v in variants}

        # Parse date range "YYYY-MM-DD to YYYY-MM-DD" or just "YYYY-MM-DD"
        date_range = params.get('dateRange', '').strip()
        start_search = None
        end_search = None
        
        if date_range:
            dates = date_range.split(' to ')
            try:
                if dates[0]:
                    start_search = datetime.strptime(dates[0].strip(), '%Y-%m-%d').replace(tzinfo=timezone.utc)
                if len(dates) > 1 and dates[1]:
                    # Set end date to end of day (UTC)
                    end_search = datetime.strptime(dates[1].strip(), '%Y-%m-%d').replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                elif start_search:
                    # Single date provided - treat as one-day range
                    end_search = start_search.replace(hour=23, minute=59, second=59)
            except Exception as e:
                self._logger.warning('Failed parsing date range %s: %s', date_range, e)
        
        # Check if NVR has an embedded datetime
        nvr_datetime = self.extract_nvr_start_time(nvr) if nvr else None
        if nvr_datetime:
            nvr_datetime = nvr_datetime.replace(tzinfo=timezone.utc)
        
        if not start_search:
            # If NVR contains a datetime, use it to set a narrow search window
            if nvr_datetime:
                start_search = nvr_datetime - timedelta(days=2)
                end_search = nvr_datetime + timedelta(days=2)
            else:
                # Require either a date range or an NVR with a datetime
                return {
                    'error': 'A date range or an NVR with an embedded datetime is required for search.',
                    'builds': []
                }
        elif nvr_datetime:
            # Both explicit date range and NVR datetime provided - check for contradiction
            nvr_date_str = nvr_datetime.strftime('%Y-%m-%d')
            if nvr_datetime < start_search or nvr_datetime > end_search:
                warnings.append(f'The NVR contains datetime {nvr_date_str}, which is outside the specified date range. Results may be empty.')

        # Exclude large columns from search results to reduce data transfer and BigQuery costs
        # These columns are only needed when viewing specific build details
        # Only the 'builds' table (KonfluxBuildRecord) has these columns
        IMAGE_BUILD_EXCLUDE_COLUMNS = ['installed_packages', 'installed_rpms']

        async def search_for_build_type(record_class, filter_embargoed=False, exclude_columns=None):
            # Create separate KonfluxDb instance to avoid bind() race condition when running queries in parallel
            db = KonfluxDb()
            db.bind(record_class)
            builds = [build async for build in db.search_builds_by_fields(
                start_search=start_search,
                end_search=end_search,
                where=where_clauses,
                extra_patterns=extra_patterns,
                order_by='end_time',
                limit=MAX_BUILDS,
                exclude_columns=exclude_columns
            )]
            if filter_embargoed:
                # Consider build embargoed only if embargoed flag is True AND group doesn't contain "golang"
                # (golang builder images are incorrectly flagged as embargoed)
                return [b for b in builds if not b.embargoed or 'golang' in (b.group or '').lower()]
            return builds

        tasks = [
            search_for_build_type(KonfluxBuildRecord, filter_embargoed=True, exclude_columns=IMAGE_BUILD_EXCLUDE_COLUMNS),
            search_for_build_type(KonfluxBundleBuildRecord),
            search_for_build_type(KonfluxFbcBuildRecord)
        ]
        image_builds, bundle_builds, fbc_builds = await asyncio.gather(*tasks)

        # Combine all builds, sort by end time if available (for completed builds), or by start time if not
        all_builds = image_builds + bundle_builds + fbc_builds

        # Filter by ART job URL if specified (match any encoded variant as substring)
        if art_job_url_variants:
            def matches_art_job_url(build):
                value = getattr(build, 'art_job_url', None)
                if not value:
                    return False
                lower_value = value.lower()
                return any(variant in lower_value for variant in art_job_url_variants)

            all_builds = [b for b in all_builds if matches_art_job_url(b)]

        # Filter by image_sha_tag if specified (OR logic: matches image_pullspec sha256 OR image_tag substring OR nvr substring)
        if image_sha_tag:
            sha_pattern = re.compile(f'.*sha256:{re.escape(image_sha_tag)}.*', re.IGNORECASE)
            tag_pattern = re.compile(f'.*{re.escape(image_sha_tag)}.*', re.IGNORECASE)
            all_builds = [
                b for b in all_builds
                if (hasattr(b, 'image_pullspec') and b.image_pullspec and sha_pattern.match(b.image_pullspec))
                or (hasattr(b, 'image_tag') and b.image_tag and tag_pattern.match(b.image_tag))
                or (hasattr(b, 'nvr') and b.nvr and tag_pattern.match(b.nvr))
            ]

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
                "source": f'{b.source_repo}/tree/{b.commitish}' if b.source_repo else '',
                "source_repo": b.source_repo or '',
                "image_pullspec": getattr(b, 'image_pullspec', '') or '',
                "image_tag": getattr(b, 'image_tag', '') or '',
                "pipeline URL": b.build_pipeline_url,
                "art-job-url": b.art_job_url,
                "type": get_build_type(b),
                "record_id": b.record_id,
                "start_time": b.start_time,
            } for b in all_builds
        ]

        # Return the results along with any warnings
        return {'builds': results, 'warnings': warnings}

    @staticmethod
    def redis_build_key(nvr: str):
        return f'appdata:art-build-history:build:{nvr}'

    @staticmethod
    def redis_build_record_key(record_id: str):
        return f'appdata:art-build-history:build-record:{record_id}'

    @staticmethod
    def redis_groups_key():
        return 'appdata:art-build-history:distinct-groups'

    @staticmethod
    def redis_source_repos_key():
        return 'appdata:art-build-history:distinct-source-repos'


app = KonfluxBuildHistory()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
