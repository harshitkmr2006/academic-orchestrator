import React, { useState } from 'react';
import { BookOpen, BarChart2, PlusCircle, Trash2, Calendar } from 'lucide-react';

export default function StudyTracker({ sessions, onSessionLogged, onSessionDeleted }) {
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !duration || !studyDate) {
      setError('Please fill in all fields.');
      return;
    }

    const durationInt = parseInt(duration);
    if (isNaN(durationInt) || durationInt <= 0) {
      setError('Please enter a valid study duration in minutes.');
      return;
    }

    setError('');
    setLoading(true);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject, duration: durationInt, study_date: studyDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log study session');
      }

      onSessionLogged(data);

      setSubject('');
      setDuration('');
      setStudyDate('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const subjectMap = {};
  let totalDurationMinutes = 0;

  sessions.forEach((s) => {
    subjectMap[s.subject] = (subjectMap[s.subject] || 0) + s.duration;
    totalDurationMinutes += s.duration;
  });

  const totalHours = (totalDurationMinutes / 60).toFixed(1);

  const sortedSubjects = Object.entries(subjectMap)
    .map(([subj, mins]) => ({
      name: subj,
      hours: (mins / 60).toFixed(1),
      minutes: mins,
      percentage: totalDurationMinutes > 0 ? Math.round((mins / totalDurationMinutes) * 100) : 0
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="study-tracker-container">
      <div className="tracker-split-grid">
        
        {/* Form and Stats Chart Column */}
        <div className="tracker-left">
          <div className="card glass-card form-card">
            <h3 className="card-title">Log Study Session</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="log-subject">Subject</label>
                <input
                  id="log-subject"
                  type="text"
                  placeholder="e.g., Mathematics, DBMS, DSA"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="log-duration">Duration (minutes)</label>
                  <input
                    id="log-duration"
                    type="number"
                    min="1"
                    placeholder="e.g., 60, 120"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="log-date">Study Date</label>
                  <input
                    id="log-date"
                    type="date"
                    value={studyDate}
                    onChange={(e) => setStudyDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                <PlusCircle size={18} style={{ marginRight: '4px' }} />
                {loading ? 'Logging...' : 'Log Session'}
              </button>
            </form>
          </div>

          <div className="card glass-card stats-chart-card">
            <div className="ai-header">
              <div className="ai-title-wrap">
                <BarChart2 className="icon-primary" size={24} />
                <h3>Subject-Wise Distribution</h3>
              </div>
              <span className="badge badge-pending">{totalHours} hrs total</span>
            </div>

            {sortedSubjects.length === 0 ? (
              <p className="empty-state">No study hours logged yet. Add sessions above to populate analytics.</p>
            ) : (
              <div className="chart-grid-container" style={{ position: 'relative', marginTop: '1rem' }}>
                <div className="chart-grid-lines">
                  <div className="chart-grid-line"><span className="chart-grid-line-label">0%</span></div>
                  <div className="chart-grid-line"><span className="chart-grid-line-label">25%</span></div>
                  <div className="chart-grid-line"><span className="chart-grid-line-label">50%</span></div>
                  <div className="chart-grid-line"><span className="chart-grid-line-label">75%</span></div>
                  <div className="chart-grid-line"><span className="chart-grid-line-label">100%</span></div>
                </div>

                <div className="subject-chart-list" style={{ marginTop: '0' }}>
                  {sortedSubjects.map((subj) => (
                    <div key={subj.name} className="chart-bar-item">
                      <div className="chart-bar-meta">
                        <span className="chart-subject-name">{subj.name}</span>
                        <span className="chart-subject-value">{subj.hours}h ({subj.percentage}%)</span>
                      </div>
                      <div className="chart-bar-track">
                        <div 
                          className="chart-bar-fill" 
                          style={{ width: `${subj.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Logger Column */}
        <div className="tracker-right">
          <div className="card glass-card history-card">
            <h3 className="card-title">Study Log History</h3>
            {sessions.length === 0 ? (
              <p className="empty-state">No study history recorded.</p>
            ) : (
              <div className="session-history-list">
                {sessions.map((session) => (
                  <div key={session.id} className="session-history-item">
                    <div className="session-item-icon">
                      <BookOpen size={16} />
                    </div>
                    <div className="session-item-content">
                      <div className="session-title-row">
                        <span className="session-subject">{session.subject}</span>
                        <span className="session-duration">{(session.duration / 60).toFixed(1)} hrs</span>
                      </div>
                      <div className="session-date-row">
                        <Calendar size={12} style={{ marginRight: '4px' }} />
                        <span>{formatDate(session.study_date)}</span>
                        <span style={{ margin: '0 4px' }}>•</span>
                        <span>{session.duration} mins</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onSessionDeleted(session.id)}
                      className="btn-icon btn-delete"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
