require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_academic_key_12345';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    migrateAndInitialize();
  }
});

// Database Migration & Initialization
function migrateAndInitialize() {
  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");

    // Check if the old tasks table exists and lacks the user_id column
    db.all("PRAGMA table_info(tasks)", (err, columns) => {
      if (err) return;
      const hasUserId = columns && columns.some(c => c.name === 'user_id');
      if (columns && columns.length > 0 && !hasUserId) {
        console.log("Upgrading database schema: dropping old tasks/goals tables...");
        db.run("DROP TABLE IF EXISTS tasks;");
        db.run("DROP TABLE IF EXISTS goals;");
      }
      initializeDatabase();
    });
  });
}

function initializeDatabase() {
  db.serialize(() => {
    // 1. Create Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('Error creating users table:', err.message);
    });

    // 2. Create Tasks Table
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        deadline TEXT NOT NULL,
        priority TEXT CHECK(priority IN ('Low', 'Medium', 'High')) NOT NULL,
        status TEXT CHECK(status IN ('Pending', 'Completed')) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating tasks table:', err.message);
    });

    // 3. Create Goals Table
    db.run(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        target_date TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating goals table:', err.message);
    });

    // 4. Create Study Sessions Table (new)
    db.run(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        duration INTEGER NOT NULL,
        study_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating study_sessions table:', err.message);
    });

    // 5. Create Placement Prep Progress Table (new)
    db.run(`
      CREATE TABLE IF NOT EXISTS placement_prep (
        user_id INTEGER PRIMARY KEY,
        dsa_progress INTEGER DEFAULT 0,
        dbms_progress INTEGER DEFAULT 0,
        os_progress INTEGER DEFAULT 0,
        cn_progress INTEGER DEFAULT 0,
        aptitude_progress INTEGER DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('Error creating placement_prep table:', err.message);
    });
  });
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or expired.' });
    }
    req.user = user;
    next();
  });
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// User Registration
app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Please provide username and password.' });
  }

  const checkSql = 'SELECT id FROM users WHERE username = ?';
  db.get(checkSql, [username.trim()], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (row) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
      
      db.run(insertSql, [username.trim(), hashedPassword], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const userId = this.lastID;
        
        // Initialize placement prep for this user
        db.run('INSERT INTO placement_prep (user_id) VALUES (?)', [userId], (prepErr) => {
          if (prepErr) console.error('Error initializing placement prep:', prepErr.message);
        });

        // Generate JWT Token
        const token = jwt.sign({ id: userId, username: username.trim() }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: { id: userId, username: username.trim() }
        });
      });
    } catch (hashErr) {
      res.status(500).json({ error: 'Encryption failed.' });
    }
  });
});

// User Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Please provide username and password.' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.get(sql, [username.trim()], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    try {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Generate Token
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (cryptErr) {
      res.status(500).json({ error: 'Verification failed.' });
    }
  });
});

// Verify Current User Session
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ==========================================
// TASKS API ENDPOINTS (SCOPED)
// ==========================================

// Get all tasks for logged in user
app.get('/api/tasks', authenticateToken, (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create a task associated with user
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, subject, deadline, priority, status = 'Pending' } = req.body;
  if (!title || !subject || !deadline || !priority) {
    return res.status(400).json({ error: 'Please provide title, subject, deadline, and priority.' });
  }

  const sql = 'INSERT INTO tasks (user_id, title, subject, deadline, priority, status) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [req.user.id, title, subject, deadline, priority, status], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      user_id: req.user.id,
      title,
      subject,
      deadline,
      priority,
      status
    });
  });
});

// Update a task (scoped)
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, subject, deadline, priority, status } = req.body;

  const fields = [];
  const params = [];

  if (title !== undefined) { fields.push('title = ?'); params.push(title); }
  if (subject !== undefined) { fields.push('subject = ?'); params.push(subject); }
  if (deadline !== undefined) { fields.push('deadline = ?'); params.push(deadline); }
  if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  params.push(req.user.id, id);
  const sql = `UPDATE tasks SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`;

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }
    res.json({ message: 'Task updated successfully', id });
  });
});

// Delete a task (scoped)
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM tasks WHERE user_id = ? AND id = ?', [req.user.id, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized.' });
    }
    res.json({ message: 'Task deleted successfully', id });
  });
});

// ==========================================
// GOALS API ENDPOINTS (SCOPED)
// ==========================================

// Get all goals (scoped)
app.get('/api/goals', authenticateToken, (req, res) => {
  db.all('SELECT * FROM goals WHERE user_id = ? ORDER BY target_date ASC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create a goal (scoped)
app.post('/api/goals', authenticateToken, (req, res) => {
  const { title, target_date } = req.body;
  if (!title || !target_date) {
    return res.status(400).json({ error: 'Please provide title and target date.' });
  }

  const sql = 'INSERT INTO goals (user_id, title, target_date) VALUES (?, ?, ?)';
  db.run(sql, [req.user.id, title, target_date], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      user_id: req.user.id,
      title,
      target_date,
      completed: 0
    });
  });
});

// Update a goal (scoped)
app.put('/api/goals/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, target_date, completed } = req.body;

  const fields = [];
  const params = [];

  if (title !== undefined) { fields.push('title = ?'); params.push(title); }
  if (target_date !== undefined) { fields.push('target_date = ?'); params.push(target_date); }
  if (completed !== undefined) { fields.push('completed = ?'); params.push(completed); }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update.' });
  }

  params.push(req.user.id, id);
  const sql = `UPDATE goals SET ${fields.join(', ')} WHERE user_id = ? AND id = ?`;

  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Goal not found or unauthorized.' });
    }
    res.json({ message: 'Goal updated successfully', id });
  });
});

// Delete a goal (scoped)
app.delete('/api/goals/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM goals WHERE user_id = ? AND id = ?', [req.user.id, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Goal not found or unauthorized.' });
    }
    res.json({ message: 'Goal deleted successfully', id });
  });
});

// ==========================================
// STUDY SESSIONS / HOURS ENDPOINTS (NEW)
// ==========================================

// Get all study sessions logged for the user
app.get('/api/study-sessions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM study_sessions WHERE user_id = ? ORDER BY study_date DESC', [req.user.id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Log a new study session
app.post('/api/study-sessions', authenticateToken, (req, res) => {
  const { subject, duration, study_date } = req.body;
  if (!subject || !duration || !study_date) {
    return res.status(400).json({ error: 'Please provide subject, duration (mins), and date.' });
  }

  const sql = 'INSERT INTO study_sessions (user_id, subject, duration, study_date) VALUES (?, ?, ?, ?)';
  db.run(sql, [req.user.id, subject, parseInt(duration), study_date], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      id: this.lastID,
      user_id: req.user.id,
      subject,
      duration,
      study_date
    });
  });
});

// Delete a study session
app.delete('/api/study-sessions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM study_sessions WHERE user_id = ? AND id = ?', [req.user.id, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Session not found or unauthorized.' });
    }
    res.json({ message: 'Study session deleted successfully', id });
  });
});

// ==========================================
// PLACEMENT PREPARATION TRACKER ENDPOINTS (NEW)
// ==========================================

// Get placement prep details
app.get('/api/placement-prep', authenticateToken, (req, res) => {
  db.get('SELECT * FROM placement_prep WHERE user_id = ?', [req.user.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      // If row doesn't exist, create and return a default one
      db.run('INSERT OR IGNORE INTO placement_prep (user_id) VALUES (?)', [req.user.id], () => {
        db.get('SELECT * FROM placement_prep WHERE user_id = ?', [req.user.id], (retryErr, newRow) => {
          return res.json(newRow || { dsa_progress: 0, dbms_progress: 0, os_progress: 0, cn_progress: 0, aptitude_progress: 0 });
        });
      });
    } else {
      res.json(row);
    }
  });
});

// Update placement prep progress
app.put('/api/placement-prep', authenticateToken, (req, res) => {
  const { dsa_progress, dbms_progress, os_progress, cn_progress, aptitude_progress } = req.body;
  
  const sql = `
    INSERT INTO placement_prep (user_id, dsa_progress, dbms_progress, os_progress, cn_progress, aptitude_progress)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      dsa_progress = excluded.dsa_progress,
      dbms_progress = excluded.dbms_progress,
      os_progress = excluded.os_progress,
      cn_progress = excluded.cn_progress,
      aptitude_progress = excluded.aptitude_progress
  `;

  db.run(sql, [
    req.user.id, 
    dsa_progress ?? 0, 
    dbms_progress ?? 0, 
    os_progress ?? 0, 
    cn_progress ?? 0, 
    aptitude_progress ?? 0
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Placement tracker updated successfully.' });
  });
});

// ==========================================
// LOCAL AI PRIORITIES & SUGGESTIONS (SCOPED)
// ==========================================
app.get('/api/ai/suggestions', authenticateToken, (req, res) => {
  db.all('SELECT * FROM tasks WHERE user_id = ? AND status = "Pending"', [req.user.id], (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (tasks.length === 0) {
      return res.json({
        suggestions: [],
        primarySuggestion: null,
        message: 'Excellent job! No pending tasks remaining in your orchestrator. Ready for your next goals.'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scoredTasks = tasks.map(task => {
      let priorityScore = 0;
      if (task.priority === 'High') priorityScore = 30;
      else if (task.priority === 'Medium') priorityScore = 20;
      else priorityScore = 10;

      const deadlineDate = new Date(task.deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      const diffTime = deadlineDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let urgencyScore = 0;
      let urgencyReason = '';

      if (diffDays < 0) {
        urgencyScore = 50;
        urgencyReason = `overdue by ${Math.abs(diffDays)} day(s)`;
      } else if (diffDays === 0) {
        urgencyScore = 40;
        urgencyReason = 'due today';
      } else if (diffDays === 1) {
        urgencyScore = 30;
        urgencyReason = 'due tomorrow';
      } else if (diffDays <= 3) {
        urgencyScore = 20;
        urgencyReason = `due in ${diffDays} days`;
      } else if (diffDays <= 7) {
        urgencyScore = 10;
        urgencyReason = `due in ${diffDays} days`;
      } else {
        urgencyScore = 5;
        urgencyReason = `due in ${diffDays} days`;
      }

      const totalScore = priorityScore + urgencyScore;

      let explanation = '';
      if (diffDays < 0) {
        explanation = `⚠️ OVERDUE: This task was due on ${task.deadline}. Focus on this immediately to prevent falling behind.`;
      } else if (diffDays === 0) {
        explanation = `🔥 DUE TODAY: The deadline is today! Push this to the top of your list to finish on time.`;
      } else if (diffDays === 1) {
        explanation = `⏳ DUE TOMORROW: Tomorrow is the deadline. Finish it now to avoid last-minute stress.`;
      } else if (task.priority === 'High') {
        explanation = `⭐ HIGH PRIORITY: This is a major subject milestone due in ${diffDays} days. Starting early is highly recommended.`;
      } else if (diffDays <= 3) {
        explanation = `📅 URGENT: Approaching deadline in ${diffDays} days. Get a head start on this today.`;
      } else {
        explanation = `💡 STANDBY: This task has a ${diffDays}-day buffer. You can schedule this after your urgent priorities.`;
      }

      return {
        ...task,
        score: totalScore,
        diffDays,
        urgencyReason,
        explanation
      };
    });

    scoredTasks.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    const primarySuggestion = scoredTasks[0];
    const suggestions = scoredTasks.slice(0, 3);

    res.json({
      suggestions,
      primarySuggestion,
      message: primarySuggestion.score >= 60 
        ? `🚨 Attention! Urgent deadlines or high-priority items require immediate action.`
        : `📅 Dashboard analysis active! Here are the optimal study options sorted by importance.`
    });
  });
});

// ==========================================
// GEMINI AI CUSTOM STUDY PLAN GENERATION (NEW)
// ==========================================
app.post('/api/ai/generate-plan', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const username = req.user.username;

  try {
    // 1. Gather all statistics for context
    const tasks = await new Promise((resolve) => {
      db.all("SELECT * FROM tasks WHERE user_id = ? AND status = 'Pending'", [userId], (err, rows) => resolve(rows || []));
    });
    const goals = await new Promise((resolve) => {
      db.all("SELECT * FROM goals WHERE user_id = ? AND completed = 0", [userId], (err, rows) => resolve(rows || []));
    });
    const sessions = await new Promise((resolve) => {
      db.all("SELECT * FROM study_sessions WHERE user_id = ? ORDER BY study_date DESC LIMIT 10", [userId], (err, rows) => resolve(rows || []));
    });
    const prep = await new Promise((resolve) => {
      db.get("SELECT * FROM placement_prep WHERE user_id = ?", [userId], (err, row) => resolve(row || { dsa_progress: 0, dbms_progress: 0, os_progress: 0, cn_progress: 0, aptitude_progress: 0 }));
    });

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      // Intelligent fallback study plan based on user statistics
      const lowestSubEntry = Object.entries({
        'DSA (Data Structures)': prep.dsa_progress || 0,
        'DBMS (Database Systems)': prep.dbms_progress || 0,
        'OS (Operating Systems)': prep.os_progress || 0,
        'CN (Computer Networks)': prep.cn_progress || 0,
        'Aptitude': prep.aptitude_progress || 0
      }).sort((a, b) => a[1] - b[1])[0];

      const lowestSub = lowestSubEntry[0];
      const lowestVal = lowestSubEntry[1];

      const totalStudyHours = Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / 60);

      const fallbackPlan = `# 📚 Gemini AI Custom Study Plan (Local Fallback Mode)

> **API Key Notice**: No \`GEMINI_API_KEY\` was found in backend \`.env\`. The engine has compiled this plan locally using rule-based metrics based on your actual study activities.

## 🎯 Strategic Recommendation
Based on your progress bars, your lowest topic is **${lowestSub}** at **${lowestVal}%** completion.
- We recommend dedicating **45%** of your next study session entirely to **${lowestSub}**.
- You have logged **${totalStudyHours} hours** of total study sessions across all subjects.

## 📅 7-Day Study Schedule
* **Day 1: Theory Core** - Read 1 comprehensive guide or watch a lectures topic on **${lowestSub}**. Solve 2 basic practice sets.
* **Day 2: Tasks Sprint** - Focus on completing pending task deadlines: ${tasks.length > 0 ? tasks.slice(0, 2).map(t => `"${t.title}" (Due: ${t.deadline})`).join(', ') : 'no critical tasks due'}.
* **Day 3: Practice Code** - Code out 2 medium problems on **${lowestSub}** (e.g. basic structures or queries).
* **Day 4: Goals Milestone** - Work towards resolving study goal: ${goals.length > 0 ? `"${goals[0].title}"` : '"Complete homework reviews"'}.
* **Day 5: Broad Review** - Study hours review: distribute time between core academic tasks and DSA/OS/DBMS concepts.
* **Day 6: Mock Prep** - Spend 1 hour solving general placement aptitude questions. Try to bump Aptitude bar above its current level.
* **Day 7: Rest & Log** - Log study hours for the week and recalculate progress. Ensure all tasks completed this week are checked off.

## 💡 Top Coaching Tips
1. **Consistency**: Log your study sessions daily in the hour tracker. Visualizing charts reinforces study habits.
2. **Subject Diversity**: Spend at least **2 hours** this week on subjects with pending deadlines to reduce academic pressure.
`;
      return res.json({ plan: fallbackPlan });
    }

    // Call Gemini API using native global fetch
    const prompt = `You are an expert AI Academic Coach.
Here is the student's current profile:
Username: ${username}
Tasks: ${JSON.stringify(tasks)}
Goals: ${JSON.stringify(goals)}
Study Sessions: ${JSON.stringify(sessions)}
Placement Preparation Progress: DSA: ${prep.dsa_progress}%, DBMS: ${prep.dbms_progress}%, OS: ${prep.os_progress}%, CN: ${prep.cn_progress}%, Aptitude: ${prep.aptitude_progress}%

Based on this profile, create a highly personalized, structured study plan.
1. Recommend which subject to focus on next.
2. Outline a 7-day study plan with specific daily goals.
3. Suggest concrete steps to improve their lowest placement prep subjects.
4. Keep the plan professional, motivating, and output it in markdown format. Do not include excessive introductory or concluding filler text. Go straight into the plan header.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error: ${errorText}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('Gemini API did not return any candidates.');
    }

    const plan = data.candidates[0].content.parts[0].text;
    res.json({ plan });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate study plan: ' + err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Academic Orchestrator Backend is running.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
