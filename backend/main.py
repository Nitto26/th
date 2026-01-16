from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import csv
import os
from datetime import datetime

app = FastAPI()

# ==================================================
# CORS CONFIGURATION (VALID & SAFE)
# ==================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"]
)

# ==================================================
# FILE PATHS
# ==================================================
QUESTIONS_FILE = "questions.csv"
RESULTS_FILE = "results.csv"

# ==================================================
# LOAD QUESTIONS FROM CSV
# ==================================================
questions = []

with open(QUESTIONS_FILE, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        questions.append({
            "question": row["question"],
            "answer": row["answer"].strip().lower()
        })

# ==================================================
# CREATE results.csv IF NOT EXISTS
# ==================================================
if not os.path.exists(RESULTS_FILE):
    with open(RESULTS_FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["question_id", "time_taken", "timestamp"])

# ==================================================
# REQUEST MODEL
# ==================================================
class AnswerPayload(BaseModel):
    qid: int
    answer: str
    time_taken: int

# ==================================================
# ROUTES
# ==================================================

@app.get("/")
def root():
    return {"status": "FastAPI backend running"}

@app.get("/questions")
def get_questions():
    """
    Send questions ONLY (answers are hidden)
    """
    return {
        "questions": [
            {"id": i, "question": q["question"]}
            for i, q in enumerate(questions)
        ]
    }

@app.post("/check-answer")
def check_answer(payload: AnswerPayload):
    """
    Validate answer and store time if correct
    """
    if payload.qid < 0 or payload.qid >= len(questions):
        return {"correct": False}

    correct_answer = questions[payload.qid]["answer"]
    is_correct = payload.answer.strip().lower() == correct_answer

    if is_correct:
        with open(RESULTS_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                payload.qid,
                payload.time_taken,
                datetime.now().isoformat()
            ])

    return {"correct": is_correct}

@app.get("/results")
def get_results():
    """
    View stored timer results
    """
    results = []
    with open(RESULTS_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            results.append(row)
    return results
