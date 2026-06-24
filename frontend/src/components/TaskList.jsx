import React from 'react';
import { CheckCircle2, Circle, Trash2, Calendar, BookOpen } from 'lucide-react';

export default function TaskList({ tasks, onToggleComplete, onDeleteTask }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No tasks found. Add a task to start organizing your study schedule!</p>
      </div>
    );
  }

  const getPriorityBadgeClass = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'badge badge-high';
      case 'medium':
        return 'badge badge-medium';
      case 'low':
        return 'badge badge-low';
      default:
        return 'badge';
    }
  };

  const getStatusBadgeClass = (status) => {
    return status.toLowerCase() === 'completed' ? 'badge badge-success' : 'badge badge-pending';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="task-list-container">
      {/* Table view for larger screens */}
      <div className="table-responsive">
        <table className="task-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>Task</th>
              <th>Subject</th>
              <th>Deadline</th>
              <th>Priority</th>
              <th>Status</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className={task.status.toLowerCase() === 'completed' ? 'task-row-completed' : ''}>
                <td>
                  <button
                    onClick={() => onToggleComplete(task)}
                    className="btn-icon"
                    title={task.status.toLowerCase() === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
                  >
                    {task.status.toLowerCase() === 'completed' ? (
                      <CheckCircle2 className="icon-success" size={20} />
                    ) : (
                      <Circle className="icon-pending" size={20} />
                    )}
                  </button>
                </td>
                <td>
                  <div className={`task-title-text ${task.status.toLowerCase() === 'completed' ? 'strike-through' : ''}`}>
                    {task.title}
                  </div>
                </td>
                <td>
                  <span className="subject-tag">
                    <BookOpen size={12} style={{ marginRight: '4px' }} />
                    {task.subject}
                  </span>
                </td>
                <td>
                  <span className="deadline-text">
                    <Calendar size={12} style={{ marginRight: '4px' }} />
                    {formatDate(task.deadline)}
                  </span>
                </td>
                <td>
                  <span className={getPriorityBadgeClass(task.priority)}>
                    {task.priority}
                  </span>
                </td>
                <td>
                  <span className={getStatusBadgeClass(task.status)}>
                    {task.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="btn-icon btn-delete"
                    title="Delete Task"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card view for mobile screens */}
      <div className="task-cards-grid">
        {tasks.map((task) => (
          <div key={task.id} className={`card glass-card task-card ${task.status.toLowerCase() === 'completed' ? 'completed' : ''}`}>
            <div className="task-card-header">
              <span className="subject-tag">
                <BookOpen size={12} style={{ marginRight: '4px' }} />
                {task.subject}
              </span>
              <span className={getPriorityBadgeClass(task.priority)}>{task.priority}</span>
            </div>
            
            <h4 className={`task-card-title ${task.status.toLowerCase() === 'completed' ? 'strike-through' : ''}`}>
              {task.title}
            </h4>

            <div className="task-card-meta">
              <span className="deadline-text">
                <Calendar size={12} style={{ marginRight: '4px' }} />
                {formatDate(task.deadline)}
              </span>
              <span className={getStatusBadgeClass(task.status)}>{task.status}</span>
            </div>

            <div className="task-card-actions">
              <button
                onClick={() => onToggleComplete(task)}
                className="btn btn-secondary btn-sm"
              >
                {task.status.toLowerCase() === 'completed' ? 'Mark Pending' : 'Mark Complete'}
              </button>
              <button
                onClick={() => onDeleteTask(task.id)}
                className="btn-icon btn-delete"
                title="Delete Task"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
