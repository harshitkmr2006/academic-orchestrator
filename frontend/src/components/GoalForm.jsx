import React, { useState } from 'react';
import { Target } from 'lucide-react';

export default function GoalForm({ onGoalAdded }) {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, target_date: targetDate }),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      const newGoal = await response.json();
      onGoalAdded(newGoal);

      setTitle('');
      setTargetDate('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card glass-card form-card">
      <h3 className="card-title">Add Study Goal</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="goal-title">Goal Description</label>
          <input
            id="goal-title"
            type="text"
            placeholder="e.g., Study 3 hours of Calculus"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="goal-date">Target Date</label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-accent" disabled={loading}>
          <Target size={18} />
          {loading ? 'Adding...' : 'Add Goal'}
        </button>
      </form>
    </div>
  );
}
