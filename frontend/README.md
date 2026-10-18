# 🤖 AI Smart Analysis Dashboard

A full-stack web application for sentiment analysis, interactive analytics, historical record management, and PDF report generation.

## 📌 Project Overview

The AI Smart Analysis Dashboard provides a user-friendly interface for analyzing text sentiment and viewing analytical insights. It integrates a React frontend, Flask REST API, and MongoDB database.

The dashboard allows users to submit text for analysis, review previous results, explore charts and trends, and generate PDF reports.

## 🎯 Objectives

* Perform sentiment analysis on user-provided text.
* Display sentiment predictions through an interactive dashboard.
* Store and retrieve analysis records using MongoDB.
* Visualize statistics and trends.
* Generate downloadable PDF reports.
* Provide REST API endpoints for application operations.

## ✨ Features

* **Sentiment Analysis:** Analyze text and display the predicted sentiment.
* **Analysis History:** Retrieve previously stored analysis records.
* **Analytics Dashboard:** View sentiment statistics and summaries.
* **Interactive Charts:** Visualize sentiment distribution and trends.
* **PDF Reports:** Generate and download reports.
* **REST API Integration:** Connect frontend components to backend services.
* **Database Integration:** Store and retrieve analysis data through MongoDB.

## 🛠️ Technologies Used

| Technology     | Purpose                                    |
| -------------- | ------------------------------------------ |
| React.js       | Frontend user interface                    |
| Vite           | Frontend development server and build tool |
| Python         | Backend programming                        |
| Flask          | REST API development                       |
| MongoDB        | Database                                   |
| Axios          | HTTP communication                         |
| Recharts       | Data visualization                         |
| Lucide React   | Icons                                      |
| Postman        | API testing                                |
| Git and GitHub | Version control and source code hosting    |

## 🏗️ System Architecture

The application follows a client-server architecture.

```text
User
  |
  v
React Frontend (Vite)
  |
  v
Axios HTTP Requests
  |
  v
Flask REST API
  |
  +------> Sentiment Analysis
  |
  +------> MongoDB Database
  |
  +------> PDF Report Generation
  |
  v
JSON Responses / PDF File
  |
  v
Dashboard and Analytics
```

## 🔄 Application Workflow

1. The user enters text in the dashboard.
2. The frontend sends the input to the Flask API.
3. The backend processes the request and generates the sentiment result.
4. The result is stored in MongoDB according to the backend implementation.
5. The frontend displays the prediction and updates the dashboard.
6. Users can view history, statistics, trends, and PDF reports.

## 📂 Project Structure

```text
AI-Smart-Analysis-Dashboard/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── other backend files
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── api.js
│   ├── package.json
│   └── other frontend files
├── screenshots/
├── README.md
└── Project_Report.pdf
```

*Update this example to match your actual project structure and filenames.*

## 🔌 API Endpoints

The following endpoints are implemented in the project.

| Method | Endpoint          | Description                    |
| ------ | ----------------- | ------------------------------ |
| GET    | `/api/health`     | Check backend health           |
| POST   | `/api/sentiment`  | Analyze text sentiment         |
| GET    | `/api/history`    | Retrieve analysis history      |
| GET    | `/api/stats`      | Retrieve analytical statistics |
| GET    | `/api/trends`     | Retrieve trend information     |
| GET    | `/api/report/pdf` | Generate a PDF report          |

## ⚙️ Installation and Setup

### Prerequisites

Install the following software before running the application:

* Python
* Node.js and npm
* MongoDB
* Visual Studio Code (recommended)
* Postman (for API testing)

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_PROJECT_FOLDER
```

Replace the placeholders with your actual GitHub repository URL and folder name.

### 2. Set Up the Backend

Open a terminal and navigate to the backend directory.

```bash
cd backend
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```bash
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask application using the command specified in your backend configuration. For example:

```bash
python app.py
```

The backend is expected to run at `http://127.0.0.1:5000` if configured with that address.

### 3. Set Up the Frontend

Open a second terminal.

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in the terminal, commonly `http://localhost:5173`.

### 4. Database Configuration

Ensure MongoDB is running and the backend is configured with the correct database connection settings.

Keep database credentials and connection strings in environment variables or a local configuration file excluded from Git. Never publish secrets in the repository.

## 🧪 Testing

The application APIs can be tested using Postman.

| Test                 | Expected Outcome              |
| -------------------- | ----------------------------- |
| Backend health check | Successful response           |
| Sentiment analysis   | Sentiment prediction returned |
| Analysis history     | Stored records returned       |
| Statistics API       | Statistics returned           |
| Trends API           | Trend information returned    |
| PDF report           | PDF response generated        |
| Frontend dashboard   | Data and charts displayed     |

Actual responses and status codes depend on the backend implementation and input validation.

## 📊 Results and Evaluation

The dashboard presents analysis results, historical records, statistical summaries, and visual trends.

If a machine learning model is used, report its actual evaluation metrics here, such as:

* Accuracy
* Precision
* Recall
* F1-score

Only include measured results from your experiments. Do not report assumed accuracy values.

## 🔒 Security Considerations

* Do not commit passwords, API keys, or database credentials.
* Validate and sanitize user input.
* Configure CORS for the intended frontend origin.
* Use appropriate access controls for production deployments.
* Keep private configuration files out of version control.

## 🚀 Future Enhancements

* User authentication and authorization.
* Bulk text sentiment analysis.
* Date-range filtering for history.
* Additional charts and analytical visualizations.
* Improved model evaluation.
* Cloud deployment.
* Automated testing and monitoring.

## ⚠️ Limitations

* Prediction quality depends on the sentiment analysis method and model used.
* Sarcasm, ambiguous expressions, and mixed sentiment may be difficult to classify.
* Database and dashboard functionality depends on the backend and database being available.
* Available features depend on the implemented application code.

## 🎓 Learning Outcomes

This project demonstrates practical experience with:

* Full-stack web application development.
* REST API design and integration.
* Database operations using MongoDB.
* Sentiment analysis workflows.
* Interactive data visualization.
* API testing with Postman.
* Version control using Git and GitHub.

## 🏁 Conclusion

The AI Smart Analysis Dashboard combines frontend development, backend API integration, database storage, sentiment analysis, and data visualization in one application. It provides a foundation for exploring text analytics and can be extended with additional machine learning capabilities and deployment features.

## 👨‍💻 Project Information

* **Project Name:** AI Smart Analysis Dashboard
* **Application Type:** Full-Stack Web Application
* **Frontend:** React.js and Vite
* **Backend:** Python and Flask
* **Database:** MongoDB
* **API Testing:** Postman
* **Repository:** A[dd your GitHub repository URL here](https://github.com/akhilcodebuilds/fullstack-ai-app)