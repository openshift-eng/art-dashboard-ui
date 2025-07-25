import json
import logging
import subprocess
from datetime import datetime, timedelta
import re

from artcommonlib import redis
from artcommonlib.konflux.konflux_build_record import KonfluxBuildRecord, KonfluxBundleBuildRecord
from artcommonlib.konflux.konflux_db import KonfluxDb
from flask import Flask, render_template, request, jsonify

# How far back should we search for builds?
DELTA_SEARCH = timedelta(days=180)
# How long before cached Redis keys are cleared
CACHE_EXPIRY = 60 * 60 * 24 * 7  # 1 week
# How many build results can we handle?
MAX_BUILDS = 1000


class KonfluxBuildHistory(Flask):
    def __init__(self):
        super().__init__(__name__)
        self._logger = logging.getLogger(__name__)  # logger field is already used by Flask, not overwriting
        self.init_logger()
        self.add_routes()

        self.konflux_db = KonfluxDb()
        self._logger.info('Konflux DB initialized ')

    def init_logger(self):
        formatter = logging.Formatter('%(asctime)s %(name)s:%(levelname)s %(message)s')
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)
        self._logger.propagate = False
        self._logger.level = logging.INFO

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
            search_results = await self.query(query_params)

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

        @self.route("/get_versions", methods=["GET"])
        def get_versions():
            url = "https://github.com/openshift-eng/ocp-build-data"
            command = ["git", "ls-remote", "--heads", url]
            result = subprocess.run(command, capture_output=True, text=True, check=True)

            if result.stdout:
                lines = result.stdout.splitlines()
                pattern = re.compile(r"refs/heads/openshift-(\d+)\.(\d+)$")
                versions = []

                for line in lines:
                    _, ref = line.split()
                    if pattern.match(ref):
                        versions.append(ref.replace("refs/heads/", ""))

                sorted_ocp_versions = sorted(
                    versions,
                    key=lambda x: tuple(map(int, x.replace("openshift-", "").split("."))),
                    reverse=True
                )
                self._logger.info('Found OCP versions: %s', ', '.join(sorted_ocp_versions))
                return jsonify(sorted_ocp_versions)

            else:
                if result.stderr:
                    self._logger.error("Error fetching OCP versions: %s", result.stderr.strip())
                raise RuntimeError('No matches found or an error occurred.')

        @self.route("/build")
        async def show_build():
            default_result = {}
            nvr = request.args.get('nvr')
            outcome = request.args.get('outcome')
            redis_key = self.redis_build_key(nvr)

            if not nvr:
                # nvr param was not passed in
                nvr = '<undefined>'
                result = default_result

            elif redis_value := await redis.get_value(redis_key):
                # nvr param was passed in, and there is a cached entry for it
                result = json.loads(redis_value)

            else:
                # nvr param was passed in, but there is no cached entry for it
                # fetch the build record from Konflux DB
                try:
                    if request.args.get('type', 'image') == 'image':
                        self.konflux_db.bind(KonfluxBuildRecord)
                    else:
                        self.konflux_db.bind(KonfluxBundleBuildRecord)

                    build = [build async for build in self.konflux_db.search_builds_by_fields(
                        where={'nvr': nvr, 'outcome': outcome},
                        limit=1
                    )]
                    result = build[0].to_dict() if build else {}

                    # Update the cache
                    if result:
                        await redis.set_value(redis_key,
                                              json.dumps(result),
                                              expiry=CACHE_EXPIRY)

                except Exception as e:
                    self._logger.error(
                        'Failed fetching information for build %s with state %s: %s', nvr, outcome, e)
                    result = default_result

            result["art_images_share_pullspec"] = result["image_pullspec"].replace("art-images", "art-images-share")

            return render_template("build.html",
                                   nvr=nvr,
                                   build=result)


        @self.route("/packages")
        async def show_packages():
            nvr = request.args.get("nvr")
            default_result = []

            if not nvr:
                # nvr param was not passed in
                nvr = '<undefined>'
                result = default_result


            elif (raw_value := await redis.get_value(self.redis_packages_key(nvr))) and (parsed := json.loads(raw_value)):
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
                    await redis.set_value(self.redis_packages_key(nvr),
                                          json.dumps(result),
                                          expiry=CACHE_EXPIRY)

                except Exception as e:
                    self._logger.error('Failed fetching installed params for %s: %s', nvr, e)
                    result = default_result

            return render_template("packages.html",
                                   nvr=nvr,
                                   packages=result)

    async def query(self, params: dict):
        self._logger.info("Search Parameters: %s", params)

        where_clauses = {}

        group = params.get('group', '')
        if group:
            where_clauses['group'] = group

        commitish = params.get('commitish', '').strip()
        if commitish:
            where_clauses['commitish'] = commitish

        assembly = params.get('assembly', 'stream').strip()
        if assembly:
            where_clauses['assembly'] = assembly

        outcome = params.get('outcome', 'completed')
        if outcome != 'completed':
            where_clauses['outcome'] = outcome

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

        # Fetch image builds
        self.konflux_db.bind(KonfluxBuildRecord)
        image_builds = [build async for build in self.konflux_db.search_builds_by_fields(
            start_search=start_search,
            where=where_clauses,
            extra_patterns=extra_patterns,
            order_by='end_time',
            limit=MAX_BUILDS
        )]

        # Fetch bundle builds
        self.konflux_db.bind(KonfluxBundleBuildRecord)
        bundle_builds = [build async for build in self.konflux_db.search_builds_by_fields(
            start_search=start_search,
            where=where_clauses,
            extra_patterns=extra_patterns,
            order_by='end_time',
            limit=MAX_BUILDS
        )]

        # Combine all builds, sort by end time
        all_builds = image_builds + bundle_builds
        all_builds = sorted(all_builds, key=lambda record: record.end_time, reverse=True)
        all_builds = all_builds[:MAX_BUILDS]  # Limit to MAX_BUILDS

        results = [
            {
                "name": b.name,
                "nvr": b.nvr,
                "outcome": str(b.outcome),
                "assembly": b.assembly,
                "group": b.group,
                "commitish": b.commitish,
                "completed": b.end_time.strftime("%B %d, %Y, %I:%M:%S %p") if b.end_time else '-',
                "engine": str(b.engine),
                "source": f'{b.source_repo}/tree/{b.commitish}',
                "pipeline URL": b.build_pipeline_url,
                "art-job-url": b.art_job_url,
                "type": "bundle" if isinstance(b, KonfluxBundleBuildRecord) else "image",
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


app = KonfluxBuildHistory()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
