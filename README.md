\# AI Smart Analysis Dashboard



\## 1. Project Overview



The AI Smart Analysis Dashboard is a full-stack web application that performs sentiment analysis on text and presents analysis results through a dashboard. It uses React and Vite for the frontend, Flask for the backend REST API, MongoDB for storing analysis history, and VADER for sentiment analysis.



\## 2. Features



\* Text sentiment analysis

\* Positive, negative, and neutral sentiment classification

\* REST API integration between React and Flask

\* MongoDB storage for analysis results

\* Analysis history

\* Dashboard statistics and trends

\* Data visualization using charts

\* PDF report generation

\* Frontend and backend health-check endpoints



\## 3. Technologies Used



| Technology      | Purpose                                    |

| --------------- | ------------------------------------------ |

| React           | Frontend user interface                    |

| Vite            | Frontend development server and build tool |

| Python          | Backend programming                        |

| Flask           | REST API development                       |

| Flask-CORS      | Cross-origin API communication             |

| VADER Sentiment | Text sentiment analysis                    |

| MongoDB         | Database                                   |

| PyMongo         | MongoDB integration                        |

| Axios           | HTTP requests from frontend                |

| ReportLab       | PDF report generation                      |

| Git and GitHub  | Version control and collaboration          |



\## 4. Project Structure



```text

fullstack-ai-app/

├── backend/

│   ├── app.py

│   ├── db.py

│   ├── requirements.txt

│   └── .env

├── frontend/

│   ├── src/

│   ├── public/

│   ├── package.json

│   └── README.md

├── .gitignore

└── README.md

```



Note: The `.env` file contains local configuration and must not be committed to GitHub. It is shown above only to explain the local project structure.



\## 5. Prerequisites



Install the following software:



\* Python

\* Node.js and npm

\* MongoDB, either locally or through MongoDB Atlas

\* Git



\## 6. Backend Setup



Open a terminal in the project root directory.



Create a Python virtual environment:



```powershell

cd backend

python -m venv .venv

```



Activate the virtual environment:



```powershell

.\\.venv\\Scripts\\Activate.ps1

```



Install the backend dependencies:



```powershell

pip install -r requirements.txt

```



\### Environment Configuration



Create a `.env` file inside the `backend` directory and configure your MongoDB connection:



```env

MONGO\_URI=mongodb://127.0.0.1:27017/

DB\_NAME=ai\_smart\_dashboard

```



Use your actual MongoDB connection settings if you are using MongoDB Atlas. Never publish database credentials or connection strings containing passwords.



\### Run the Backend



```powershell

python app.py

```



Keep the backend terminal running.



\## 7. Frontend Setup



Open a second terminal and navigate to the frontend directory:



```powershell

cd frontend

npm install

npm run dev

```



Open the local URL printed by Vite in your terminal, usually:



```text

http://localhost:5173

```



\## 8. Backend API Endpoints



| Method | Endpoint          | Purpose                           |

| ------ | ----------------- | --------------------------------- |

| GET    | `/`               | Backend home endpoint             |

| GET    | `/api/health`     | Check backend health              |

| POST   | `/api/sentiment`  | Analyze text sentiment            |

| GET    | `/api/history`    | Retrieve analysis history         |

| GET    | `/api/stats`      | Retrieve dashboard statistics     |

| GET    | `/api/trends`     | Retrieve analysis trends          |

| GET    | `/api/report/pdf` | Generate or download a PDF report |



The exact request format and response fields depend on the implementation in `backend/app.py`.



\## 9. Database



The application uses MongoDB to store analysis results.



\* Database: `ai\_smart\_dashboard` by default

\* Collection: `analysis\_results`



The database name can be changed using the `DB\_NAME` environment variable.



\## 10. Testing



Verify the following:



1\. The Flask backend starts without errors.

2\. The MongoDB connection succeeds.

3\. The backend health endpoint returns a successful response.

4\. The frontend starts using Vite.

5\. The frontend can communicate with the Flask API.

6\. Text sentiment analysis returns a result.

7\. Analysis history and dashboard statistics load correctly.

8\. PDF report generation works.



\## 11. Version Control



Git is used to track source-code changes, and GitHub hosts the repository.



The project uses a feature branch for documentation changes before those changes are submitted for review and merged into the main development branch.



\## 12. Security Notes



\* Never commit `.env` files or database credentials.

\* Keep virtual environments and dependency folders out of Git.

\* Validate incoming API data.

\* Configure CORS for trusted frontend origins.

\* Store production secrets in environment variables.



\## 13. Future Enhancements



\* Image classification

\* Speech-to-text input

\* Additional model evaluation metrics

\* Docker-based deployment

\* Production deployment and monitoring



