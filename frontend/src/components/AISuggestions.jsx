import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, BrainCircuit, RefreshCw } from 'lucide-react';

export default function AISuggestions({ tasks, onRefresh }) {
  const [data, setData] = useState({ suggestions: [], primarySuggestion: null, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/suggestions');
      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestions');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Could not compile AI analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [tasks]);

  if (loading) {
    return (
      <div className="card glass-card ai-card loading-ai">
        <div className="shimmer-avatar"></div>
        <div className="shimmer-line header"></div>
        <div className="shimmer-line body"></div>
      </div>
    );
  }

  if (error || !data.primarySuggestion) {
    return (
      <div className="card glass-card ai-card error-ai">
        <div className="ai-header">
          <BrainCircuit className="icon-ai" size={28} />
          <h3>AI Study Advisor</h3>
        </div>
        <p className="ai-message">
          {data.message || 'No pending tasks left to organize! Add tasks with priorities and deadlines to trigger suggestions.'}
        </p>
      </div>
    );
  }

  const { primarySuggestion, suggestions, message } = data;

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'badge badge-high';
      case 'medium': return 'badge badge-medium';
      case 'low': return 'badge badge-low';
      default: return 'badge';
    }
  };

  return (
    <div className="card glass-card ai-card glowing-border">
      <div className="ai-header">
        <div className="ai-title-wrap">
          <BrainCircuit className="icon-ai pulsing" size={28} />
          <div>
            <h3>AI Study Advisor</h3>
            <span className="ai-status">Priority Engine Active</span>
          </div>
        </div>
        <button className="btn-icon text-muted" onClick={fetchSuggestions} title="Recalculate priorities">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="ai-insight-box">
        <p className="ai-alert-message">{message}</p>
        
        {primarySuggestion && (
          <div className="primary-suggestion-box">
            <div className="suggestion-badge-row">
              <span className="suggestion-label"><Sparkles size={12} style={{ marginRight: '4px' }} /> Top Priority</span>
              <span className={getPriorityBadgeClass(primarySuggestion.priority)}>{primarySuggestion.priority}</span>
            </div>
            
            <h4 className="primary-suggestion-title">{primarySuggestion.title}</h4>
            <div className="primary-suggestion-meta">
              <span className="subject-tag">{primarySuggestion.subject}</span>
              <span className="deadline-text">
                <Calendar size={12} style={{ marginRight: '4px' }} />
                Due {formatDate(primarySuggestion.deadline)}
              </span>
            </div>
            
            <div className="ai-reasoning">
              <p>{primarySuggestion.explanation}</p>
            </div>
          </div>
        )}
      </div>

      {suggestions.length > 1 && (
        <div className="secondary-suggestions-list">
          <h5>Next Up In Queue:</h5>
          <ul>
            {suggestions.slice(1).map((task, idx) => (
              <li key={task.id} className="secondary-suggestion-item">
                <div className="secondary-index">{idx + 2}</div>
                <div className="secondary-content">
                  <div className="secondary-title-row">
                    <span className="secondary-title">{task.title}</span>
                    <span className={getPriorityBadgeClass(task.priority)}>{task.priority}</span>
                  </div>
                  <div className="secondary-meta">
                    <span className="subject">{task.subject}</span>
                    <span>•</span>
                    <span className="deadline">Due {formatDate(task.deadline)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
