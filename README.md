# 🎓 Academic Orchestrator (Upgraded)

An AI-powered academic dashboard and planner designed for students to manage tasks, milestones, and prioritize their studies using a smart neural-priority task orchestrator and Google Gemini AI.

## 🚀 Upgraded Features

- **Secure Multi-User Authentication**: Register new accounts or login to existing profiles. Persists credentials in JWT tokens for seamless refreshes.
- **Weekly & Total Study Investment**: Log daily study duration (in minutes) per subject. The advisor aggregates totals and displays relative subject effort distributions in CSS progress charts.
- **Interactive Monthly Study Calendar**: Navigable calendar grid mapping deadlined tasks onto their due dates. Displays an upcoming 7-day priority checklist.
- **Placement Readiness Dashboard**: Slider controls tracking progress on DSA, DBMS, OS, Computer Networks, and Aptitude.
- **Google Gemini API AI Coach**: Real-time integration generating personalized weekly study schedules, task recommendations, and coaching tips. Operates in an offline fallback model if API keys are not specified.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), Vanilla CSS, Lucide React (Icons).
- **Backend**: Node.js, Express.js.
- **Database**: SQLite (associated schemas for multi-user security).

---

## 🔧 Installation & Setup

Ensure you have [Node.js](https://nodejs.org/) installed (v18.0.0 or higher recommended).

### 1. Set Up the Backend
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Configure Environment variables:
   - Create or edit `backend/.env`.
   - Add your Gemini API Key if available:
     ```env
     PORT=5000
     JWT_SECRET=super_secret_academic_key_12345
     GEMINI_API_KEY=your_gemini_api_key_here
     ```
     *(Note: If you leave `GEMINI_API_KEY` empty, the system will use its built-in study scoring fallback generator).*
4. Start the Express server:
   ```bash
   npm start
   ```
   *The backend will run on `http://localhost:5000` and initialize/migrate the `database.db` file automatically.*

### 2. Set Up the Frontend
1. Open a new terminal window and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The development server will run on `http://localhost:3000`.*

4. Open your browser and navigate to `http://localhost:3000` to start tracking your progress!
