import logging

from flask import Flask, render_template, request, jsonify


class App(Flask):
    def __init__(self):
        super().__init__(__name__)
        self._logger = logging.getLogger(__name__)  # logger field is already used by Flask, not overwriting
        self.init_logger()
        self.add_routes()

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
        def search():
            return self.query(request.form.to_dict())

    def query(self, params: dict):
        self.logger.info("Search Parameters: %s", params)

        results = [
            {"Name": "Result 1 - Param 1", "Outcome": "Success", "OCP version": "v1.0"},
            {"Name": "Result 2 - Param 2", "Outcome": "Failure", "OCP version": "v2.0"}
        ]

        # Return the results as JSON
        return jsonify(results)


if __name__ == "__main__":
    App().run(debug=True)
