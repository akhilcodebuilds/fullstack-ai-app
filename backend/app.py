from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from datetime import datetime
from io import BytesIO
from bson import ObjectId
from db import analysis_collection
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

app = Flask(__name__)

# Updated CORS configuration
# Allows the React frontend on ports 5173 and 5174
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

analyzer = SentimentIntensityAnalyzer()


# Convert MongoDB ObjectId and datetime values to JSON-safe values
def serialize_result(document):
    document["_id"] = str(document["_id"])

    if isinstance(document.get("created_at"), datetime):
        document["created_at"] = document["created_at"].isoformat()

    return document


# Home route
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Smart Analysis Dashboard Backend is running",
        "status": "success"
    })


# Health check
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "success",
        "message": "Backend connected successfully!"
    })


# Sentiment analysis
@app.route("/api/sentiment", methods=["POST"])
def sentiment_analysis():
    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "").strip()

        if not text:
            return jsonify({
                "error": "Please enter some text to analyze."
            }), 400

        scores = analyzer.polarity_scores(text)
        compound = scores["compound"]

        if compound >= 0.05:
            sentiment = "Positive"
        elif compound <= -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        result = {
            "text": text,
            "sentiment": sentiment,
            "compound": compound,
            "positive": scores["pos"],
            "negative": scores["neg"],
            "neutral": scores["neu"],
            "created_at": datetime.utcnow()
        }

        # Save the result to MongoDB
        insert_result = analysis_collection.insert_one(result)
        result["_id"] = str(insert_result.inserted_id)
        result["created_at"] = result["created_at"].isoformat()

        return jsonify({
            "status": "success",
            "message": "Sentiment analysis completed successfully.",
            "result": result
        }), 200

    except Exception as error:
        app.logger.exception("Sentiment analysis failed")
        return jsonify({
            "status": "error",
            "message": "Unable to analyze the text.",
            "details": str(error)
        }), 500


# Analysis history
@app.route("/api/history", methods=["GET"])
def history():
    try:
        documents = list(
            analysis_collection.find().sort("_id", -1).limit(100)
        )

        results = [serialize_result(doc) for doc in documents]

        return jsonify({
            "status": "success",
            "history": results,
            "results": results,
            "count": len(results)
        }), 200

    except Exception as error:
        app.logger.exception("History fetch failed")
        return jsonify({
            "status": "error",
            "message": "Unable to fetch analysis history.",
            "details": str(error)
        }), 500


# Dashboard statistics
@app.route("/api/stats", methods=["GET"])
def stats():
    try:
        total = analysis_collection.count_documents({})

        positive = analysis_collection.count_documents({
            "sentiment": "Positive"
        })

        negative = analysis_collection.count_documents({
            "sentiment": "Negative"
        })

        neutral = analysis_collection.count_documents({
            "sentiment": "Neutral"
        })

        return jsonify({
            "status": "success",
            "total": total,
            "total_analyses": total,
            "positive": positive,
            "negative": negative,
            "neutral": neutral
        }), 200

    except Exception as error:
        app.logger.exception("Statistics fetch failed")
        return jsonify({
            "status": "error",
            "message": "Unable to fetch statistics.",
            "details": str(error)
        }), 500


# Sentiment trends
@app.route("/api/trends", methods=["GET"])
def trends():
    try:
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "positive": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$sentiment", "Positive"]},
                                1,
                                0
                            ]
                        }
                    },
                    "negative": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$sentiment", "Negative"]},
                                1,
                                0
                            ]
                        }
                    },
                    "neutral": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$sentiment", "Neutral"]},
                                1,
                                0
                            ]
                        }
                    },
                    "total": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]

        trend_data = list(analysis_collection.aggregate(pipeline))

        for item in trend_data:
            item["date"] = item.pop("_id")

        return jsonify({
            "status": "success",
            "trends": trend_data,
            "data": trend_data
        }), 200

    except Exception as error:
        app.logger.exception("Trend fetch failed")
        return jsonify({
            "status": "error",
            "message": "Unable to fetch trends.",
            "details": str(error)
        }), 500


# Generate PDF report
@app.route("/api/report/pdf", methods=["GET"])
def download_pdf_report():
    try:
        documents = list(
            analysis_collection.find().sort("_id", -1).limit(100)
        )

        pdf_buffer = BytesIO()
        pdf = canvas.Canvas(pdf_buffer, pagesize=letter)
        page_width, page_height = letter

        y = page_height - 50

        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(40, y, "AI Smart Analysis Dashboard Report")
        y -= 30

        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            40,
            y,
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        )
        y -= 30

        pdf.drawString(40, y, f"Total records in report: {len(documents)}")
        y -= 30

        for index, doc in enumerate(documents, start=1):
            if y < 100:
                pdf.showPage()
                y = page_height - 50
                pdf.setFont("Helvetica", 10)

            pdf.setFont("Helvetica-Bold", 10)
            pdf.drawString(
                40, y,
                f"{index}. Sentiment: {doc.get('sentiment', 'N/A')}"
            )
            y -= 16

            pdf.setFont("Helvetica", 9)
            text = str(doc.get("text", "")).replace("\n", " ")
            text = text.encode("latin-1", "replace").decode("latin-1")

            # Keep each text entry short enough for the PDF page
            pdf.drawString(50, y, text[:100])
            y -= 15

            pdf.drawString(
                50,
                y,
                f"Compound score: {doc.get('compound', 'N/A')}"
            )
            y -= 25

        pdf.save()
        pdf_buffer.seek(0)

        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="ai_smart_analysis_report.pdf"
        )

    except Exception as error:
        app.logger.exception("PDF report generation failed")
        return jsonify({
            "status": "error",
            "message": "Unable to generate PDF report.",
            "details": str(error)
        }), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)