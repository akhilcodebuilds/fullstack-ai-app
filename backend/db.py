import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017/"
)

DB_NAME = os.getenv(
    "DB_NAME",
    "ai_smart_dashboard"
)

client = MongoClient(
    MONGO_URI,
    serverSelectionTimeoutMS=5000
)

# Verify the MongoDB connection
client.admin.command("ping")

db = client[DB_NAME]

# Collection for saving analysis results
analysis_collection = db["analysis_results"]

print("MongoDB connected successfully!")
print(f"Database: {DB_NAME}")