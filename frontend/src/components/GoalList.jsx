import React from 'react';
import { CheckSquare, Square, Trash2, Calendar } from 'lucide-react';

export default function GoalList({ goals, onToggleGoal, onDeleteGoal }) {
  if (goals.length === 0) {
    return (
      <div className="empty-state">
        <p>No goals defined yet. Set some learning milestones to track!</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="goal-list">
      {goals.map((goal) => {
        const isCompleted = goal.completed === 1;
        return (
          <div key={goal.id} className={`goal-item ${isCompleted ? 'goal-completed' : ''}`}>
            <button
              onClick={() => onToggleGoal(goal)}
              className="btn-icon"
              title={isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
            >
              {isCompleted ? (
                <CheckSquare className="icon-accent" size={20} />
              ) : (
                <Square className="icon-pending" size={20} />
              )}
            </button>
            
            <div className="goal-content">
              <span className={`goal-title ${isCompleted ? 'strike-through' : ''}`}>
                {goal.title}
              </span>
              <span className="goal-date">
                <Calendar size={12} style={{ marginRight: '4px' }} />
                Target: {formatDate(goal.target_date)}
              </span>
            </div>

            <button
              onClick={() => onDeleteGoal(goal.id)}
              className="btn-icon btn-delete"
              title="Delete Goal"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
