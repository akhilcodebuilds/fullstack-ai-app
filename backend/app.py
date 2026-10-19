from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import joblib
import json

from pathlib import Path
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from io import BytesIO

from db import analysis_collection

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


# ============================================================
# 1. FLASK APPLICATION
# ============================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
            ]
        }
    }
)


# ============================================================
# 2. PATHS AND MACHINE LEARNING MODEL
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent

MODEL_PATH = PROJECT_DIR / "models" / "sentiment_model.joblib"

METRICS_PATH = PROJECT_DIR / "models" / "evaluation_metrics.json"

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Trained model not found: {MODEL_PATH}. "
        "Please run train_model.py first."
    )

ml_model = joblib.load(MODEL_PATH)

print("Trained ML model loaded successfully!")
print("Model path:", MODEL_PATH)

IST = ZoneInfo("Asia/Kolkata")


# ============================================================
# 3. HELPER FUNCTIONS
# ============================================================

def serialize_result(document):
    """
    Convert MongoDB documents into JSON-safe dictionaries.
    """

    result = dict(document)

    if "_id" in result:
        result["_id"] = str(result["_id"])

    created_at = result.get("created_at")

    if isinstance(created_at, datetime):

        if created_at.tzinfo is None:
            created_at = created_at.replace(
                tzinfo=timezone.utc
            )

        result["created_at"] = (
            created_at
            .astimezone(timezone.utc)
            .isoformat()
        )

    return result


def get_sentiment_label(value):
    """
    Normalize sentiment labels for API responses.
    """

    return str(value).strip().capitalize()


def get_all_results():
    """
    Retrieve analysis records from MongoDB.
    """

    return list(
        analysis_collection.find().sort(
            "created_at", -1
        )
    )


def get_sentiment_counts(documents):
    """
    Count positive, negative and neutral predictions.
    """

    counts = {
        "Positive": 0,
        "Negative": 0,
        "Neutral": 0
    }

    for document in documents:

        label = get_sentiment_label(
            document.get(
                "sentiment",
                document.get("prediction", "Unknown")
            )
        )

        if label in counts:
            counts[label] += 1

    return counts


# ============================================================
# 4. HOME ROUTE
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "status": "success",
        "message": (
            "AI Smart Analysis Dashboard Backend is running"
        )
    }), 200


# ============================================================
# 5. HEALTH CHECK API
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    return jsonify({
        "status": "success",
        "message": "Backend connected successfully!",
        "model": "TF-IDF + Logistic Regression"
    }), 200


# ============================================================
# 6. SENTIMENT ANALYSIS API
# ============================================================

@app.route(
    "/api/sentiment",
    methods=["POST"],
    strict_slashes=False
)
def sentiment_analysis():

    try:

        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": (
                    "Send a valid JSON object "
                    "in the request body."
                )
            }), 400

        text = data.get("text", "")

        if not isinstance(text, str):
            return jsonify({
                "status": "error",
                "message": (
                    "The text field must contain a string."
                )
            }), 400

        text = text.strip()

        if not text:
            return jsonify({
                "status": "error",
                "message": "Please enter some text to analyze."
            }), 400

        # Predict sentiment using the trained ML model.
        predicted_label = get_sentiment_label(
            ml_model.predict([text])[0]
        )

        # Obtain class probabilities when supported.
        probabilities = {}

        if hasattr(ml_model, "predict_proba"):

            classes = ml_model.classes_
            values = ml_model.predict_proba([text])[0]

            probabilities = {
                get_sentiment_label(label): round(
                    float(score), 4
                )
                for label, score in zip(classes, values)
            }

        created_at = datetime.now(timezone.utc)

        # Store the analysis in MongoDB.
        result = {
            "text": text,
            "sentiment": predicted_label,
            "prediction": predicted_label,
            "label": predicted_label,
            "model": "TF-IDF + Logistic Regression",
            "probabilities": probabilities,
            "created_at": created_at
        }

        insert_result = analysis_collection.insert_one(
            result
        )

        response_result = serialize_result({
            **result,
            "_id": insert_result.inserted_id
        })

        return jsonify({
            "status": "success",
            "message": (
                "ML sentiment prediction completed successfully."
            ),
            "text": text,
            "sentiment": predicted_label,
            "prediction": predicted_label,
            "label": predicted_label,
            "model": "TF-IDF + Logistic Regression",
            "probabilities": probabilities,
            "created_at": created_at.isoformat(),
            "result": response_result
        }), 200

    except Exception:

        app.logger.exception(
            "ML sentiment prediction failed"
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to analyze the text. "
                "Check the backend terminal for details."
            )
        }), 500


# ============================================================
# 7. ANALYSIS HISTORY API
# ============================================================

@app.route("/api/history", methods=["GET"])
def history():

    try:

        # Optional pagination parameters.
        try:
            limit = int(request.args.get("limit", 100))
            limit = max(1, min(limit, 500))
        except (TypeError, ValueError):
            limit = 100

        try:
            skip = int(request.args.get("skip", 0))
            skip = max(0, skip)
        except (TypeError, ValueError):
            skip = 0

        total = analysis_collection.count_documents({})

        documents = list(
            analysis_collection.find()
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )

        results = [
            serialize_result(document)
            for document in documents
        ]

        return jsonify({
            "status": "success",
            "total": total,
            "count": len(results),
            "results": results
        }), 200

    except Exception:

        app.logger.exception(
            "Unable to retrieve analysis history"
        )

        return jsonify({
            "status": "error",
            "message": "Unable to retrieve analysis history."
        }), 500


# ============================================================
# 8. STATISTICS API
# ============================================================

@app.route("/api/stats", methods=["GET"])
def stats():

    try:

        documents = get_all_results()
        counts = get_sentiment_counts(documents)
        total = len(documents)

        return jsonify({
            "status": "success",
            "total": total,
            "total_analyses": total,
            "positive": counts["Positive"],
            "negative": counts["Negative"],
            "neutral": counts["Neutral"],
            "sentiment_counts": counts
        }), 200

    except Exception:

        app.logger.exception(
            "Unable to calculate statistics"
        )

        return jsonify({
            "status": "error",
            "message": "Unable to calculate statistics."
        }), 500


# ============================================================
# 9. SENTIMENT TRENDS API
# ============================================================

@app.route("/api/trends", methods=["GET"])
def trends():

    try:

        documents = get_all_results()
        daily_counts = {}

        for document in documents:

            created_at = document.get("created_at")

            if not isinstance(created_at, datetime):
                continue

            if created_at.tzinfo is None:
                created_at = created_at.replace(
                    tzinfo=timezone.utc
                )

            local_date = (
                created_at.astimezone(IST)
                .strftime("%Y-%m-%d")
            )

            if local_date not in daily_counts:

                daily_counts[local_date] = {
                    "date": local_date,
                    "positive": 0,
                    "negative": 0,
                    "neutral": 0,
                    "total": 0
                }

            label = get_sentiment_label(
                document.get(
                    "sentiment",
                    document.get("prediction", "Unknown")
                )
            )

            if label == "Positive":
                daily_counts[local_date]["positive"] += 1

            elif label == "Negative":
                daily_counts[local_date]["negative"] += 1

            elif label == "Neutral":
                daily_counts[local_date]["neutral"] += 1

            daily_counts[local_date]["total"] += 1

        trend_data = sorted(
            daily_counts.values(),
            key=lambda item: item["date"]
        )

        return jsonify({
            "status": "success",
            "count": len(trend_data),
            "trends": trend_data
        }), 200

    except Exception:

        app.logger.exception(
            "Unable to calculate sentiment trends"
        )

        return jsonify({
            "status": "error",
            "message": "Unable to calculate sentiment trends."
        }), 500


# ============================================================
# 10. MODEL PERFORMANCE API
# ============================================================

@app.route("/api/model-performance", methods=["GET"])
def model_performance():

    try:

        if not METRICS_PATH.exists():
            return jsonify({
                "status": "error",
                "message": (
                    "Evaluation metrics not found. "
                    "Please run train_model.py first."
                )
            }), 404

        with open(
            METRICS_PATH,
            "r",
            encoding="utf-8"
        ) as file:
            metrics = json.load(file)

        report = metrics.get(
            "classification_report",
            {}
        )

        labels = metrics.get(
            "labels",
            ["negative", "neutral", "positive"]
        )

        class_metrics = {}

        for label in labels:

            values = report.get(label, {})

            class_metrics[label.capitalize()] = {
                "precision": values.get("precision", 0),
                "recall": values.get("recall", 0),
                "f1_score": values.get("f1-score", 0),
                "support": values.get("support", 0)
            }

        return jsonify({
            "status": "success",
            "model": "TF-IDF + Logistic Regression",
            "accuracy": metrics.get("accuracy", 0),
            "training_records": metrics.get(
                "training_records", 0
            ),
            "labeled_test_records": metrics.get(
                "labeled_test_records", 0
            ),
            "labels": [
                label.capitalize()
                for label in labels
            ],
            "classification_report": class_metrics,
            "confusion_matrix": metrics.get(
                "confusion_matrix", []
            )
        }), 200

    except Exception:

        app.logger.exception(
            "Unable to retrieve model performance"
        )

        return jsonify({
            "status": "error",
            "message": (
                "Unable to retrieve model performance."
            )
        }), 500


# ============================================================
# 11. PDF REPORT API
# ============================================================

@app.route("/api/report/pdf", methods=["GET"])
def report_pdf():

    try:

        documents = get_all_results()
        counts = get_sentiment_counts(documents)
        total = len(documents)

        pdf_buffer = BytesIO()

        pdf = canvas.Canvas(
            pdf_buffer,
            pagesize=letter
        )

        _, page_height = letter

        # Report title.
        pdf.setTitle("AI Smart Analysis Dashboard Report")

        pdf.setFont("Helvetica-Bold", 18)

        pdf.drawString(
            50,
            page_height - 55,
            "AI Smart Analysis Dashboard"
        )

        pdf.setFont("Helvetica", 11)

        pdf.drawString(
            50,
            page_height - 80,
            "Sentiment Analysis Report"
        )

        pdf.drawString(
            50,
            page_height - 105,
            "Model: TF-IDF + Logistic Regression"
        )

        pdf.drawString(
            50,
            page_height - 125,
            "Generated: "
            + datetime.now(IST).strftime(
                "%Y-%m-%d %H:%M:%S IST"
            )
        )

        # Summary section.
        y = page_height - 175

        pdf.setFont("Helvetica-Bold", 14)

        pdf.drawString(
            50,
            y,
            "Summary Statistics"
        )

        y -= 25

        pdf.setFont("Helvetica", 11)

        summary_lines = [
            f"Total analyses: {total}",
            f"Positive predictions: {counts['Positive']}",
            f"Negative predictions: {counts['Negative']}",
            f"Neutral predictions: {counts['Neutral']}"
        ]

        for line in summary_lines:

            pdf.drawString(60, y, line)
            y -= 20

        # Recent analysis section.
        y -= 15

        pdf.setFont("Helvetica-Bold", 14)

        pdf.drawString(
            50,
            y,
            "Recent Analysis Results"
        )

        y -= 25

        pdf.setFont("Helvetica-Bold", 9)

        pdf.drawString(50, y, "Date")
        pdf.drawString(155, y, "Sentiment")
        pdf.drawString(245, y, "Text")

        y -= 15

        pdf.setFont("Helvetica", 8)

        for document in documents[:30]:

            if y < 60:

                pdf.showPage()

                y = page_height - 50

                pdf.setFont("Helvetica-Bold", 9)

                pdf.drawString(50, y, "Date")
                pdf.drawString(155, y, "Sentiment")
                pdf.drawString(245, y, "Text")

                y -= 15

                pdf.setFont("Helvetica", 8)

            created_at = document.get("created_at")

            if isinstance(created_at, datetime):

                if created_at.tzinfo is None:
                    created_at = created_at.replace(
                        tzinfo=timezone.utc
                    )

                date_text = (
                    created_at.astimezone(IST)
                    .strftime("%Y-%m-%d %H:%M")
                )

            else:
                date_text = "N/A"

            sentiment = get_sentiment_label(
                document.get(
                    "sentiment",
                    document.get("prediction", "Unknown")
                )
            )

            text = str(document.get("text", ""))

            # Keep each row readable in the PDF.
            if len(text) > 55:
                text = text[:52] + "..."

            pdf.drawString(50, y, date_text)
            pdf.drawString(155, y, sentiment)
            pdf.drawString(245, y, text)

            y -= 17

        pdf.save()
        pdf_buffer.seek(0)

        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="sentiment_analysis_report.pdf"
        )

    except Exception:

        app.logger.exception(
            "Unable to generate PDF report"
        )

        return jsonify({
            "status": "error",
            "message": "Unable to generate the PDF report."
        }), 500


# ============================================================
# 12. START FLASK SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )