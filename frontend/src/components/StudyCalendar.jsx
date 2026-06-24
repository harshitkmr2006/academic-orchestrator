import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function StudyCalendar({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Format date helper: YYYY-MM-DD (local timezone matching)
  const formatDateKey = (dayNum) => {
    const d = dayNum < 10 ? `0${dayNum}` : dayNum;
    const m = (month + 1) < 10 ? `0${month + 1}` : month + 1;
    return `${year}-${m}-${d}`;
  };

  const getTasksForDate = (dateKey) => {
    return tasks.filter((t) => t.deadline === dateKey);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingTasks = tasks
    .filter((t) => {
      if (t.status === 'Completed') return false;
      const d = new Date(t.deadline);
      d.setHours(0, 0, 0, 0);
      return d >= today && d <= sevenDaysLater;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const getPriorityDotColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#f43f5e';
      case 'medium': return '#f59e0b';
      case 'low': return '#06b6d4';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="card glass-card calendar-component-card">
      <div className="calendar-grid-container">
        
        {/* Left pane: The Month Grid */}
        <div className="calendar-pane">
          <div className="calendar-ctrl-header">
            <div className="calendar-title-wrap">
              <Calendar className="icon-primary" size={24} />
              <h3>{months[month]} {year}</h3>
            </div>
            <div className="calendar-nav-buttons">
              <button onClick={prevMonth} className="btn-icon" title="Previous Month"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="btn-icon" title="Next Month"><ChevronRight size={20} /></button>
            </div>
          </div>

          <div className="calendar-grid">
            {daysOfWeek.map((day) => (
              <div key={day} className="calendar-day-header">{day}</div>
            ))}

            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;
              }

              const dateKey = formatDateKey(day);
              const dayTasks = getTasksForDate(dateKey);
              
              const cellDate = new Date(year, month, day);
              cellDate.setHours(0, 0, 0, 0);
              const isTodayCell = cellDate.getTime() === today.getTime();

              return (
                <div key={`day-${day}`} className={`calendar-cell ${isTodayCell ? 'is-today' : ''}`}>
                  <span className="day-number">{day}</span>
                  {dayTasks.length > 0 && (
                    <div className="day-task-indicators">
                      {dayTasks.map((t) => (
                        <div 
                          key={t.id} 
                          className={`day-task-dot ${t.status.toLowerCase() === 'completed' ? 'completed-dot' : ''}`}
                          style={t.status.toLowerCase() !== 'completed' ? { backgroundColor: getPriorityDotColor(t.priority) } : {}}
                          title={`[${t.priority}] ${t.title} (${t.subject})`}
                        ></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right pane: Upcoming Deadlines */}
        <div className="upcoming-pane">
          <h4 className="upcoming-title">
            <Clock size={16} style={{ marginRight: '6px', color: 'var(--primary)' }} />
            Upcoming (7 Days)
          </h4>
          
          {upcomingTasks.length === 0 ? (
            <p className="no-upcoming-text">No upcoming deadlines.</p>
          ) : (
            <div className="upcoming-list">
              {upcomingTasks.map((t) => (
                <div key={t.id} className="upcoming-item">
                  <div className="upcoming-item-color" style={{ backgroundColor: getPriorityDotColor(t.priority) }}></div>
                  <div className="upcoming-item-content">
                    <span className="upcoming-item-title">{t.title}</span>
                    <div className="upcoming-item-meta">
                      <span className="subject">{t.subject}</span>
                      <span>•</span>
                      <span className="date">Due {new Date(t.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
