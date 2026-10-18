# AI Smart Analysis Dashboard

## 1. Project Overview

The AI Smart Analysis Dashboard is a full-stack web application that performs sentiment analysis on text and displays the results through an interactive dashboard.

The application uses React and Vite for the frontend, Flask for the backend REST API, MongoDB for storing analysis history, and VADER for sentiment analysis.

Users can submit text for sentiment analysis, view the predicted sentiment, explore previous analyses, review statistics and trends, and download reports.

## 2. Features

* Text-based sentiment analysis.
* Positive, Negative, and Neutral sentiment classification.
* Sentiment compound score and individual sentiment scores.
* React frontend integrated with a Flask REST API.
* MongoDB storage for analysis results.
* Analysis history with timestamps.
* Dashboard statistics for sentiment categories.
* Sentiment trend visualization.
* Interactive charts.
* PDF report generation.
* CSV export of analysis data.
* Backend health-check endpoint.
* Date and time display configured for Indian Standard Time (IST).

## 3. Technologies Used

| Technology      | Purpose                                    |
| --------------- | ------------------------------------------ |
| React           | Frontend user interface                    |
| Vite            | Frontend development server and build tool |
| JavaScript      | Frontend programming                       |
| Python          | Backend programming                        |
| Flask           | REST API development                       |
| Flask-CORS      | Cross-origin API communication             |
| VADER Sentiment | Rule-based sentiment analysis              |
| MongoDB         | Database                                   |
| PyMongo         | MongoDB integration                        |
| Axios           | HTTP requests from the frontend            |
| Recharts        | Dashboard charts and visualizations        |
| ReportLab       | PDF report generation                      |
| Git             | Version control                            |
| GitHub          | Source-code hosting                        |

## 4. Project Structure

```text
fullstack-ai-app/
├── backend/
│   ├── app.py
│   ├── db.py
│   ├── requirements.txt
│   ├── .env
│   └── .venv/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
├── .gitignore
└── README.md
```

Note: The structure above illustrates the main project files. Your actual directory may contain additional files.

The `.env` file contains local configuration and must not be committed to GitHub. The virtual environment should also remain excluded from version control.

## 5. Prerequisites

Install the following software before running the project:

* Python 3.9 or later.
* Node.js and npm.
* MongoDB installed locally or a MongoDB Atlas account.
* Git.
* A code editor such as Visual Studio Code.

## 6. Backend Setup

### Step 1: Open the Project

Open a terminal in the project root directory:

```powershell
cd fullstack-ai-app
```

Navigate to the backend directory:

```powershell
cd backend
```

### Step 2: Create a Virtual Environment

```powershell
python -m venv .venv
```

### Step 3: Activate the Virtual Environment

On Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### Step 4: Install Dependencies

```powershell
python -m pip install -r requirements.txt
```

The requirements file should include the packages needed by the application, including `tzdata` for timezone support on Windows.

### Step 5: Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Example configuration for a local MongoDB instance:

```env
MONGO_URI=mongodb://127.0.0.1:27017/
DB_NAME=ai_smart_dashboard
```

Use your actual connection settings if you use MongoDB Atlas.

Never publish database passwords, credentials, or private connection strings.

### Step 6: Start the Backend

Run:

```powershell
python app.py
```

The backend normally runs at:

```text
http://127.0.0.1:5000
```

Keep the backend terminal open while using the application.

## 7. Frontend Setup

Open a second terminal in Visual Studio Code.

Navigate to the frontend directory from the project root:

```powershell
cd frontend
```

Install the frontend dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Open the local URL displayed by Vite. It is usually:

```text
http://localhost:5173
```

Keep both frontend and backend terminals running during development.

## 8. Backend API Endpoints

| Method | Endpoint          | Purpose                            |
| ------ | ----------------- | ---------------------------------- |
| GET    | `/`               | Check the backend home endpoint    |
| GET    | `/api/health`     | Check backend health               |
| POST   | `/api/sentiment`  | Analyze text sentiment             |
| GET    | `/api/history`    | Retrieve analysis history          |
| GET    | `/api/stats`      | Retrieve dashboard statistics      |
| GET    | `/api/trends`     | Retrieve sentiment trends          |
| GET    | `/api/report/pdf` | Generate and download a PDF report |

### Example Sentiment Analysis Request

Endpoint:

```text
POST http://127.0.0.1:5000/api/sentiment
```

Request body:

```json
{
  "text": "I am very happy today!"
}
```

Example of the relevant response fields:

```json
{
  "status": "success",
  "sentiment": "Positive",
  "compound": 0.6696,
  "text": "I am very happy today!"
}
```

The actual response also includes additional fields, including a nested `result` object and sentiment scores.

## 9. Database

The application uses MongoDB to store sentiment analysis results.

| Item       | Value                |
| ---------- | -------------------- |
| Database   | `ai_smart_dashboard` |
| Collection | `analysis_results`   |

The database name can be configured using the `DB_NAME` environment variable.

The MongoDB connection URI is configured through `MONGO_URI`.

Analysis records include the input text, predicted sentiment, compound score, sentiment scores, and creation timestamp.

## 10. Testing

Perform the following checks before submitting or demonstrating the project:

1. Verify that the Flask backend starts without errors.
2. Verify that MongoDB connects successfully.
3. Open `/api/health` and confirm the successful response.
4. Verify that the React frontend starts successfully.
5. Confirm that the frontend communicates with the backend.
6. Test Positive sentiment using clearly positive text.
7. Test Negative sentiment using clearly negative text.
8. Test Neutral sentiment using neutral text.
9. Verify that analysis history displays the results.
10. Check dashboard statistics and charts.
11. Verify that timestamps display correctly.
12. Download and open the PDF report.
13. Export the analysis data to CSV.
14. Test API endpoints using Postman, if required for submission.

Actual test results and screenshots should be recorded separately for project documentation.

## 11. Version Control

Git is used to track source-code changes, and GitHub hosts the repository.

The repository is maintained on the `master` branch.

Example Git commands:

```powershell
git status
git add .
git commit -m "Update project files"
git push origin master
```

Review the changes before committing. Do not commit environment files, credentials, or virtual environments.

## 12. Security Notes

* Never commit `.env` files or database credentials.
* Keep virtual environments and dependency folders out of Git.
* Validate incoming API data.
* Configure CORS to allow only trusted frontend origins.
* Store production secrets in environment variables.
* Use appropriate authentication and access controls before exposing sensitive endpoints publicly.
* Do not expose database credentials in frontend code or public documentation.

## 13. Limitations

* VADER is a rule-based sentiment analyzer and may not correctly interpret every sentence.
* Sarcasm, context-dependent language, slang, and complex expressions can affect predictions.
* Sentiment predictions should not be treated as guaranteed or universally accurate.
* Reliable accuracy, precision, recall, and F1-score measurements require an appropriately labeled evaluation dataset.

## 14. Future Enhancements

* Evaluate sentiment performance using labeled datasets.
* Add additional sentiment analysis models.
* Improve input validation and error handling.
* Add authentication and user-specific analysis history.
* Support additional languages.
* Add Docker-based deployment.
* Deploy the application to a production environment.
* Add production monitoring and logging.

## 15. Conclusion

The AI Smart Analysis Dashboard demonstrates the integration of a React frontend, Flask REST API, MongoDB database, and VADER sentiment analysis.

The application supports sentiment classification, analysis history, dashboard statistics, trend visualization, and report export. It provides a foundation for further improvements, evaluation, and deployment.
