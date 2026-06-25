# 🎓 Academic Orchestrator
> A Secure, AI-Powered Dashboard and Study Portal for Students

[![Node.js](https://img.shields.io/badge/Node.js-v18.0%2B-green?logo=nodedotjs)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.3-blue?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v4.19-lightgrey?logo=express)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-v3.x-blue?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen)](https://opensource.org/licenses/MIT)

Academic Orchestrator is a full-stack student planner and dashboard designed to streamline course loads, log study hours, and monitor placement readiness. It integrates a **Google Gemini AI** Study Coach to analyze student habits, tasks, and goals and generate structured weekly study guides.

---

## 📖 Overview

As academic requirements grow more complex, students struggle to balance daily assignments, placement preparation, and long-term milestones. Academic Orchestrator solves this by offering a centralized, secure study hub. The application features user authentication, custom CSS data visualization charts, a monthly study calendar, and a smart local recommendation scoring engine alongside Google Gemini integration.

---

## 🚀 Key Features

* **🔐 Multi-User Authentication**: Register new accounts or log in securely. Sessions are secured with JSON Web Tokens (JWT) and passwords hashed using `bcryptjs`. Session states persist on page reloads.
* **📅 Interactive Study Calendar**: A navigable monthly calendar grid mapping deadlines on their exact due days with priority-colored indicators, accompanied by an upcoming 7-day task list.
* **📈 Hours Tracker & Charts**: Log daily study duration (in minutes) per subject. View total hours invested and relative effort distributions represented in grid-aligned progress charts.
* **🏆 Placement Prep Tracker**: Interactive completion sliders tracking readiness for five core placement themes: DSA, DBMS, OS, Computer Networks, and Aptitude.
* **🧠 Gemini AI Academic Coach**: Sends study logs, placement stats, and task due dates to Gemini to query structured, markdown study schedules. Integrates an offline local fallback advisor if API keys are not specified.
* **📱 Responsive Glassmorphic UI**: High-fidelity dark mode designed using HSL colors, glassmorphism card containers, CSS animations, and swipable navigation tabs for mobile viewports.

---

## 💻 Tech Stack

* **Frontend**: React.js, Vite build system, Vanilla CSS, Lucide React (Icons).
* **Backend**: Node.js, Express.js.
- **Database**: SQLite (associated schemas for user-scoped tables).
- **Authentication**: JWT (JSON Web Tokens), Bcryptjs (Password Hashing).

---

## 📁 Directory Structure

```text
PROJECT/
├── backend/
│   ├── package.json         # Backend node packages & commands
│   ├── .env                 # Server variables (JWT Secret, Gemini Key)
│   ├── database.db          # SQLite local relational database file
│   └── server.js            # Express server, auth middleware, & SQLite queries
├── frontend/
│   ├── package.json         # Frontend packages
│   ├── vite.config.js       # Vite configuration with API proxy rules
│   ├── index.html           # Document template (Outfit & Inter fonts)
│   └── src/
│       ├── main.jsx         # App bootstrap entry
│       ├── App.jsx          # Hub managing state, routing, and stats
│       ├── App.css          # Central stylesheet (glassmorphic layout rules)
│       └── components/      # Modular interfaces
│           ├── Login.jsx            # Sign in form
│           ├── Signup.jsx           # Account creation form
│           ├── TaskForm.jsx         # Adds new study tasks
│           ├── TaskList.jsx         # Table view and responsive cards
│           ├── GoalForm.jsx         # Adds goals
│           ├── GoalList.jsx         # Goal checklist
│           ├── StudyCalendar.jsx    # Monthly navigable calendar
│           ├── StudyTracker.jsx     # Log session minutes & stats charts
│           ├── PlacementPrep.jsx    # Progress sliders
│           └── AIEngine.jsx         # Markdown planner layout
└── README.md                # Project documentation
```

---

## 🔧 Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed (v18.0.0 or higher recommended).

### 1. Configure the Backend Server
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment file:
   - Create a `.env` file in the `backend/` directory:
     ```env
     PORT=5000
     JWT_SECRET=your_jwt_signing_secret_here
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
4. Start the Express server:
   ```bash
   npm start
   ```
   *The backend will launch on `http://localhost:5000` and automatically create the SQLite database tables.*

### 2. Configure the Frontend App
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The client dev server will run on `http://localhost:3000`.*

4. Open your browser and navigate to `http://localhost:3000` to start tracking your studies!

---

## 🔑 Environment Variables

The backend requires the following variables configured inside `backend/.env`:

| Key | Type | Description | Required? |
| :--- | :--- | :--- | :---: |
| `PORT` | Number | Port on which the Express server listens (default: `5000`). | No |
| `JWT_SECRET` | String | Secret key used to sign and verify JSON Web Tokens. | Yes |
| `GEMINI_API_KEY` | String | Google AI Studio Gemini API Key. | No |

---

## 📡 API Reference Summary

All routes (excluding `/api/auth`) require the authorization header: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication Endpoints
- `POST /api/auth/signup` — Registers user, encrypts password, returns token.
- `POST /api/auth/login` — Verifies password hash, logs in user, returns token.
- `GET /api/auth/me` — Verifies token and returns profile data.

### Planner Endpoints
- `GET /api/tasks` — Fetches tasks for logged-in user.
- `POST /api/tasks` — Saves new task under user ID.
- `PUT /api/tasks/:id` — Edits task status or content.
- `DELETE /api/tasks/:id` — Deletes task.
- `GET /api/goals` — Fetches milestones.
- `POST /api/goals` — Saves milestone.
- `PUT /api/goals/:id` — Toggles milestone completed status.
- `DELETE /api/goals/:id` — Deletes milestone.

### Tracking Endpoints
- `GET /api/study-sessions` — Fetches hours log database.
- `POST /api/study-sessions` — Logs study session.
- `DELETE /api/study-sessions/:id` — Deletes study session log.
- `GET /api/placement-prep` — Fetches DSA/DBMS/OS/CN/Aptitude metrics.
- `PUT /api/placement-prep` — Saves slider progress percentages.

### AI Endpoints
- `GET /api/ai/suggestions` — Evaluates local priority weights for recommendations.
- `POST /api/ai/generate-plan` — Connects to Gemini API to return markdown study schedules.

---

## 📸 Screenshots

| Dashboard Tab | Hours Tracker Tab |
| :---: | :---: |
| ![Dashboard Placeholder](https://via.placeholder.com/600x350/1e293b/ffffff?text=Dashboard+Overview+Tab) | ![Hours Tracker Placeholder](https://via.placeholder.com/600x350/1e293b/ffffff?text=Hours+Log+and+Charts+Tab) |

| Study Planner Tab | Placement Readiness Tab |
| :---: | :---: |
| ![Study Planner Placeholder](https://via.placeholder.com/600x350/1e293b/ffffff?text=Planner+and+Milestones+Tab) | ![Placement Prep Placeholder](https://via.placeholder.com/600x350/1e293b/ffffff?text=Placement+Sliders+Tab) |

---

## 🔮 Future Enhancements

1. **Database Upgrades**: Migrate the database layer from local SQLite files to cloud-hosted Postgres services (e.g. Supabase, Neon) using Prisma ORM.
2. **HttpOnly Cookie Auth**: Store tokens inside HTTP-only secure cookies to increase security against XSS session theft.
3. **Pomodoro Timer Integration**: Add a Pomodoro study timer that directly links focus minutes to the hours tracker dashboard.
4. **Push Notifications**: Integrate web-push workers or email summaries to alert students of close deadlines.
5. **Token Invalidation**: Use Redis-backed token blacklist storage for secure logouts.

---

## ✍️ Author

* **Your Name** - *Initial Work & Architecture* - [@yourusername](https://github.com/yourusername)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
