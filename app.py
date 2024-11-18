import logging
import subprocess
from datetime import datetime, timedelta

from artcommonlib.konflux.konflux_build_record import KonfluxBuildRecord, KonfluxBuildOutcome
from artcommonlib.konflux.konflux_db import KonfluxDb
from flask import Flask, render_template, request, jsonify

# How far back should we search for builds?
DELTA_SEARCH = timedelta(days=180)


class KonfluxBuildHistory(Flask):
    def __init__(self):
        super().__init__(__name__)
        self._logger = logging.getLogger(__name__)  # logger field is already used by Flask, not overwriting
        self.init_logger()
        self.add_routes()

        self.konflux_db = KonfluxDb()
        self.konflux_db.bind(KonfluxBuildRecord)
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
            return render_template("index.html")

        @self.route("/search", methods=["POST"])
        async def search():
            return await self.query(request.form.to_dict())

        @self.route("/get_versions", methods=["GET"])
        def get_versions():
            command = (
                "git ls-remote --heads https://github.com/openshift-eng/ocp-build-data | "
                "awk '/refs\\/heads\\/openshift-[1-9][0-9]*\\.[1-9][0-9]*/ {print $2}' | "
                "sed 's#refs/heads/##'"
            )

            result = subprocess.run(command, shell=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

            if result.stdout:
                ocp_versions = result.stdout.strip().splitlines()
                sorted_ocp_versions = sorted(
                    ocp_versions,
                    key=lambda x: tuple(map(int, x.replace("openshift-", "").split("."))),
                    reverse=True
                )
                self._logger.info('Found OCP versions: %s', ', '.join(sorted_ocp_versions))
                return jsonify(sorted_ocp_versions)

            else:
                if result.stderr:
                    self._logger.error("Error fetching OCP versions: %s", result.stderr.strip())
                raise RuntimeError('No matches found or an error occurred.')

    async def query(self, params: dict):
        self._logger.info("Search Parameters: %s", params)

        where_clauses = {
            'engine': params['engine'],
        }
        if params['group'] != '-':
            where_clauses['group'] = params['group']
        if params['assembly']:
            where_clauses['assembly'] = params['assembly']
        if params['name']:
            where_clauses['name'] = params['name']
        if params['outcome'] != 'both':
            where_clauses['outcome'] = params['outcome']

        if params['after']:
            try:
                start_search = datetime.strptime(params['after'], '%Y-%m-%d')
            except Exception as e:
                self._logger.warning('Failed parsing date string %s: %s', params['after'], e)
                start_search = None
        else:
            start_search = datetime.now() - DELTA_SEARCH

        builds = await self.konflux_db.search_builds_by_fields(
            start_search=start_search,
            where=where_clauses,
            order_by='end_time'
        )

        results = [
            {
                "name": b.name,
                "nvr": b.nvr,
                "outcome": str(b.outcome),
                "assembly": b.assembly,
                "group": b.group,
                "completed": b.end_time.strftime("%d %b %Y %H:%M:%S"),
                "engine": str(b.engine),
                "source": f'{b.source_repo}/tree/{b.commitish}',
                "pipeline URL": b.build_pipeline_url,
                "art job URL": b.art_job_url,
            } for b in filter(lambda b: b.outcome != KonfluxBuildOutcome.PENDING, builds)
        ]

        # Return the results as JSON
        return jsonify(results)


app = KonfluxBuildHistory()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8000)
