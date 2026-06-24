import React, { useState, useEffect } from 'react';
import { ListTodo, Target, AlertTriangle, GraduationCap, Calendar, BarChart2, Award, BrainCircuit, LogOut, User } from 'lucide-react';
import Login from './components/Login';
import Signup from './components/Signup';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import GoalForm from './components/GoalForm';
import GoalList from './components/GoalList';
import AISuggestions from './components/AISuggestions';
import PlacementPrep from './components/PlacementPrep';
import StudyCalendar from './components/StudyCalendar';
import StudyTracker from './components/StudyTracker';
import AIEngine from './components/AIEngine';

export default function App() {
  const [user, setUser] = useState(null);
  const [authScreen, setAuthScreen] = useState('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [taskFilter, setTaskFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Session expired');
      }
      const data = await response.json();
      setUser(data.user);
      fetchUserData(token);
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  };

  const fetchUserData = async (token) => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [tasksRes, goalsRes, sessionsRes] = await Promise.all([
        fetch('/api/tasks', { headers }),
        fetch('/api/goals', { headers }),
        fetch('/api/study-sessions', { headers })
      ]);

      if (!tasksRes.ok || !goalsRes.ok || !sessionsRes.ok) {
        throw new Error('Failed to load portal data.');
      }

      const tasksData = await tasksRes.json();
      const goalsData = await goalsRes.json();
      const sessionsData = await sessionsRes.json();

      setTasks(tasksData);
      setGoals(goalsData);
      setSessions(sessionsData);
    } catch (err) {
      setError(err.message || 'An error occurred loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    const token = localStorage.getItem('token');
    fetchUserData(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('ai_study_plan');
    setUser(null);
    setTasks([]);
    setGoals([]);
    setSessions([]);
    setActiveTab('dashboard');
  };

  const handleTaskAdded = (newTask) => {
    setTasks((prev) => [newTask, ...prev].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
  };

  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      console.error(err);
      alert('Could not update task.');
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete task');
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error(err);
      alert('Could not delete task.');
    }
  };

  const handleGoalAdded = (newGoal) => {
    setGoals((prev) => [...prev, newGoal]);
  };

  const handleToggleGoal = async (goal) => {
    const nextCompleted = goal.completed === 1 ? 0 : 1;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: nextCompleted }),
      });

      if (!response.ok) throw new Error('Failed to update goal');
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, completed: nextCompleted } : g))
      );
    } catch (err) {
      console.error(err);
      alert('Could not update goal.');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study goal?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete goal');
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error(err);
      alert('Could not delete goal.');
    }
  };

  const handleSessionLogged = (newSession) => {
    setSessions((prev) => [newSession, ...prev]);
  };

  const handleSessionDeleted = async (id) => {
    if (!window.confirm('Delete this study log entry?')) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/study-sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete session');
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      alert('Could not delete study entry.');
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const taskProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed === 1).length;
  const activeGoalsCount = totalGoals - completedGoals;
  const goalProgressPercent = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueCount = tasks.filter((t) => {
    if (t.status === 'Completed') return false;
    const d = new Date(t.deadline);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }).length;

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'All') return true;
    return task.status === taskFilter;
  });

  if (loading && !user) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your study portal...</p>
      </div>
    );
  }

  if (!user) {
    return authScreen === 'login' ? (
      <Login onLoginSuccess={handleLoginSuccess} switchToSignup={() => setAuthScreen('signup')} />
    ) : (
      <Signup onSignupSuccess={handleLoginSuccess} switchToLogin={() => setAuthScreen('login')} />
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-title-area">
          <GraduationCap className="app-logo" size={40} />
          <div>
            <h1>Academic Orchestrator</h1>
            <p className="subtitle">AI Study Portal</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="user-profile-tag">
            <User size={14} style={{ marginRight: '4px' }} />
            <span>{user.username}</span>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Log Out" style={{ marginLeft: '12px' }}>
            <LogOut size={20} className="icon-danger" />
          </button>
        </div>
      </header>

      <nav className="nav-tabs-bar">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Calendar },
          { id: 'planner', label: 'Study Planner', icon: ListTodo },
          { id: 'tracker', label: 'Hours Tracker', icon: BarChart2 },
          { id: 'placement', label: 'Placement Prep', icon: Award },
          { id: 'ai', label: 'Gemini Advisor', icon: BrainCircuit }
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab-link ${activeTab === tab.id ? 'active' : ''}`}
            >
              <TabIcon size={16} style={{ marginRight: '6px' }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {error && <div className="alert alert-danger global-alert">{error}</div>}

      <main className="portal-workspace-main">
        {activeTab === 'dashboard' && (
          <div className="workspace-tab-fade">
            <section className="stats-grid">
              <div className="card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Study Investment</span>
                  <BarChart2 className="stat-icon icon-primary" size={24} />
                </div>
                <div className="stat-value">{totalHours} <span className="stat-value-sub">Hours</span></div>
                <div className="progress-bar-container">
                  <div className="progress-bar fill-primary" style={{ width: '100%' }}></div>
                </div>
                <span className="stat-desc">Total logged study duration</span>
              </div>

              <div className="card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Goal Milestones</span>
                  <Target className="stat-icon icon-accent" size={24} />
                </div>
                <div className="stat-value">{completedGoals} / {totalGoals}</div>
                <div className="progress-bar-container">
                  <div className="progress-bar fill-accent" style={{ width: `${goalProgressPercent}%` }}></div>
                </div>
                <span className="stat-desc">{activeGoalsCount} study goals remaining</span>
              </div>

              <div className="card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Overdue Alerts</span>
                  <AlertTriangle className={`stat-icon ${overdueCount > 0 ? 'icon-danger pulsing' : 'icon-muted'}`} size={24} />
                </div>
                <div className={`stat-value ${overdueCount > 0 ? 'text-danger' : ''}`}>{overdueCount}</div>
                <div className="overdue-status-text">
                  {overdueCount > 0 ? 'Action required!' : 'No overdue items'}
                </div>
                <span className="stat-desc">Pending tasks past due date</span>
              </div>
            </section>

            <div className="dashboard-layout">
              <div className="column-left">
                <AISuggestions tasks={tasks} />
              </div>
              <div className="column-right">
                <StudyCalendar tasks={tasks} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="workspace-tab-fade">
            <div className="tasks-management-header">
              <div className="section-header">
                <h2>Study Planner</h2>
              </div>
              <div className="filter-tabs">
                {['All', 'Pending', 'Completed'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`filter-tab ${taskFilter === filter ? 'active' : ''}`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="task-workspace-grid">
              <div className="planner-forms-col">
                <TaskForm onTaskAdded={handleTaskAdded} />
                <div style={{ height: '1.5rem' }}></div>
                <div className="card glass-card">
                  <h3 className="card-title" style={{ marginBottom: '1rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>Study Milestones</h3>
                  <GoalForm onGoalAdded={handleGoalAdded} />
                  <div style={{ marginTop: '1.5rem' }}>
                    <GoalList 
                      goals={goals} 
                      onToggleGoal={handleToggleGoal} 
                      onDeleteGoal={handleDeleteGoal} 
                    />
                  </div>
                </div>
              </div>
              <div className="card glass-card task-list-card">
                <TaskList 
                  tasks={filteredTasks} 
                  onToggleComplete={handleToggleComplete} 
                  onDeleteTask={handleDeleteTask} 
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="workspace-tab-fade">
            <div className="section-header">
              <h2>Study Hours Tracker</h2>
            </div>
            <div style={{ height: '1rem' }}></div>
            <StudyTracker 
              sessions={sessions} 
              onSessionLogged={handleSessionLogged} 
              onSessionDeleted={handleSessionDeleted} 
            />
          </div>
        )}

        {activeTab === 'placement' && (
          <div className="workspace-tab-fade" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="section-header">
              <h2>Placement Readiness</h2>
            </div>
            <div style={{ height: '1rem' }}></div>
            <PlacementPrep />
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="workspace-tab-fade" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="section-header">
              <h2>Gemini Study Coach</h2>
            </div>
            <div style={{ height: '1rem' }}></div>
            <AIEngine tasks={tasks} />
          </div>
        )}
      </main>
    </div>
  );
}
