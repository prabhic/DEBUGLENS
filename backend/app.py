from flask import Flask, jsonify, request
from flask_cors import CORS
from services.llm.pseudogen import PseudoFileHandler

app = Flask(__name__)
CORS(app)


@app.route("/api/pseudo/load", methods=["POST"])
def load_pseudo_file():
    try:
        file_content = request.json.get("content")
        pseudo_handler = PseudoFileHandler()
        parsed_content = pseudo_handler.parse_file_content(file_content)
        return jsonify({"success": True, "content": parsed_content})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/test/ping", methods=["GET"])
def test_ping():
    """Simple ping endpoint to verify API is responding"""
    return jsonify({"success": True, "message": "pong"})


@app.route("/api/test/echo", methods=["POST"])
def test_echo():
    """Echo endpoint that returns whatever JSON is sent to it"""
    try:
        data = request.get_json()
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/debug/breakpoint", methods=["POST"])
def set_breakpoint():
    try:
        data = request.get_json()
        file_id = data.get("fileId")
        line_number = data.get("lineNumber")
        abstraction_level = data.get("abstractionLevel")

        # TODO: Implement actual breakpoint logic here
        # This is a placeholder that just acknowledges the breakpoint
        return jsonify(
            {
                "success": True,
                "message": f"Breakpoint set at line {line_number} in abstraction level {abstraction_level}",
                "breakpoint": {
                    "fileId": file_id,
                    "lineNumber": line_number,
                    "abstractionLevel": abstraction_level,
                },
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)
