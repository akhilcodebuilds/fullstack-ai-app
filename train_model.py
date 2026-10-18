import pandas as pd
import json
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
accuracy_score,
classification_report,
confusion_matrix
)
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

MODEL_DIR.mkdir(exist_ok=True)

train_df = pd.read_csv(DATA_DIR / "train.csv")
test_df = pd.read_csv(DATA_DIR / "test.csv")

# Clean training data

train_df = train_df.dropna(subset=["text", "sentiment"]).copy()
train_df["text"] = train_df["text"].astype(str).str.strip()
train_df["sentiment"] = train_df["sentiment"].astype(str).str.strip().str.lower()
train_df = train_df[train_df["text"] != ""]

# Keep only records with known labels for evaluation

test_df = test_df.dropna(subset=["text", "sentiment"]).copy()
test_df["text"] = test_df["text"].astype(str).str.strip()
test_df["sentiment"] = test_df["sentiment"].astype(str).str.strip().str.lower()
test_df = test_df[test_df["text"] != ""]

valid_labels = {"positive", "negative", "neutral"}

train_df = train_df[train_df["sentiment"].isin(valid_labels)]
test_df = test_df[test_df["sentiment"].isin(valid_labels)]

if train_df.empty or test_df.empty:
    raise ValueError("Training or labeled test data is empty.")

X_train = train_df["text"]
y_train = train_df["sentiment"]

X_test = test_df["text"]
y_test = test_df["sentiment"]

print("Training records:", len(train_df))
print("Labeled test records:", len(test_df))

# TF-IDF + Logistic Regression

model = Pipeline([
(
"tfidf",
TfidfVectorizer(
max_features=50000,
ngram_range=(1, 2),
min_df=2,
sublinear_tf=True
)
),
(
"classifier",
LogisticRegression(
max_iter=1000,
class_weight="balanced",
random_state=42
)
)
])

print("\nTraining model...")
model.fit(X_train, y_train)

print("Model training completed.")

# Evaluate only on labeled test records

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nAccuracy:", round(accuracy * 100, 2), "%")
print("\nClassification Report:")
report = classification_report(
y_test,
predictions,
labels=["negative", "neutral", "positive"],
output_dict=True,
zero_division=0
)
print(classification_report(
y_test,
predictions,
labels=["negative", "neutral", "positive"],
zero_division=0
))

print("Confusion Matrix:")
matrix = confusion_matrix(
y_test,
predictions,
labels=["negative", "neutral", "positive"]
)
print(matrix)

# Save trained model

import joblib

model_path = MODEL_DIR / "sentiment_model.joblib"
joblib.dump(model, model_path)

# Save evaluation metrics

metrics = {
"accuracy": float(accuracy),
"training_records": int(len(train_df)),
"labeled_test_records": int(len(test_df)),
"classification_report": report,
"confusion_matrix": matrix.tolist(),
"labels": ["negative", "neutral", "positive"]
}

metrics_path = MODEL_DIR / "evaluation_metrics.json"
with open(metrics_path, "w", encoding="utf-8") as file:
    json.dump(metrics, file, indent=4)

print("\nSaved model:", model_path)
print("Saved metrics:", metrics_path)

# Example predictions

examples = [
"I love this product. It is excellent!",
"I hate this. It is terrible.",
"The meeting is scheduled for tomorrow."
]

print("\nSample Predictions:")
for text in examples:
    print(f"{text} -> {model.predict([text])[0]}")