from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/search", methods=["POST"])
def search():
    # Retrieve parameters from the request
    params = request.form.to_dict()
    print("Search Parameters:", params)  # Debugging

    # Perform your search logic here (replace with actual backend logic)
    results = [
        {"Name": "Result 1 - Param 1", "Outcome": "Success", "OCP version": "v1.0"},
        {"Name": "Result 2 - Param 2", "Outcome": "Failure", "OCP version": "v2.0"}
    ]

    # Return the results as JSON
    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)
