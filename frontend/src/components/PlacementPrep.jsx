import React, { useState, useEffect } from 'react';
import { Award, Save } from 'lucide-react';

export default function PlacementPrep() {
  const [progress, setProgress] = useState({
    dsa_progress: 0,
    dbms_progress: 0,
    os_progress: 0,
    cn_progress: 0,
    aptitude_progress: 0
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchPrep();
  }, []);

  const fetchPrep = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/placement-prep', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to load placement progress');
      const data = await response.json();
      setProgress({
        dsa_progress: data.dsa_progress || 0,
        dbms_progress: data.dbms_progress || 0,
        os_progress: data.os_progress || 0,
        cn_progress: data.cn_progress || 0,
        aptitude_progress: data.aptitude_progress || 0
      });
    } catch (err) {
      console.error('Error fetching placement progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (topic, value) => {
    setProgress((prev) => ({
      ...prev,
      [topic]: parseInt(value)
    }));
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setMessage({ text: '', type: '' });
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/placement-prep', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(progress),
      });

      if (!response.ok) throw new Error('Failed to update progress');
      
      setMessage({ text: 'Placement progress saved!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Error saving progress.', type: 'danger' });
    } finally {
      setSaveLoading(false);
    }
  };

  const topics = [
    { key: 'dsa_progress', label: 'DSA (Data Structures)' },
    { key: 'dbms_progress', label: 'DBMS (SQL / NoSQL)' },
    { key: 'os_progress', label: 'OS (Operating Systems)' },
    { key: 'cn_progress', label: 'CN (Computer Networks)' },
    { key: 'aptitude_progress', label: 'Aptitude & Reasoning' }
  ];

  if (loading) {
    return <div className="dashboard-loading"><div className="spinner"></div><p>Fetching placement metrics...</p></div>;
  }

  return (
    <div className="card glass-card placement-tracker-card">
      <div className="ai-header">
        <div className="ai-title-wrap">
          <Award className="icon-accent" size={24} />
          <h3>Placement Preparation</h3>
        </div>
        <button 
          onClick={handleSave} 
          className="btn btn-accent btn-sm" 
          disabled={saveLoading}
          style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
        >
          <Save size={14} style={{ marginRight: '4px' }} />
          {saveLoading ? 'Saving...' : 'Save'}
        </button>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ padding: '0.5rem', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
          {message.text}
        </div>
      )}

      <div className="placement-list">
        {topics.map((topic) => (
          <div key={topic.key} className="placement-item">
            <div className="placement-meta-row">
              <span className="placement-label-text">{topic.label}</span>
              <span className="placement-value-text">{progress[topic.key]}%</span>
            </div>
            <div className="placement-slider-row">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress[topic.key]}
                onChange={(e) => handleSliderChange(topic.key, e.target.value)}
                className="placement-slider"
              />
              <div className="placement-bar-track">
                <div 
                  className="placement-bar-fill" 
                  style={{ width: `${progress[topic.key]}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
