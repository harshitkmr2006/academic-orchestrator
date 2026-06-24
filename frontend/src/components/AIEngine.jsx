import React, { useState, useEffect } from 'react';
import { BrainCircuit, RefreshCw, Sparkles } from 'lucide-react';

export default function AIEngine({ tasks }) {
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPlan = async (forceGenerate = false) => {
    const cachedPlan = localStorage.getItem('ai_study_plan');
    if (cachedPlan && !forceGenerate) {
      setPlan(cachedPlan);
      return;
    }

    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate AI plan');
      }

      setPlan(data.plan);
      localStorage.setItem('ai_study_plan', data.plan);
    } catch (err) {
      setError(err.message || 'Could not compile study plan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleGenerate = () => {
    fetchPlan(true);
  };

  const renderBoldText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ color: 'var(--accent)' }}>{part}</strong> : part));
  };

  const parseMarkdown = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="ai-plan-h1" style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginTop: '1.25rem', marginBottom: '0.75rem' }}>{line.replace('# ', '')}</h2>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="ai-plan-h2" style={{ fontSize: '1.25rem', color: 'var(--primary)', marginTop: '1.25rem', marginBottom: '0.5rem' }}>{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="ai-plan-h3" style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '1rem', marginBottom: '0.5rem' }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.substring(2);
        return <li key={idx} className="ai-plan-li" style={{ marginLeft: '1rem', listStyleType: 'disc', fontSize: '0.9rem', marginBottom: '0.35rem' }}>{renderBoldText(content)}</li>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="ai-plan-quote" style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: '0.75rem 0' }}>{line.replace('> ', '')}</blockquote>;
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '0.4rem' }}></div>;
      }
      return <p key={idx} className="ai-plan-p" style={{ fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '0.5rem' }}>{renderBoldText(line)}</p>;
    });
  };

  return (
    <div className="card glass-card ai-planner-card glowing-border">
      <div className="ai-header">
        <div className="ai-title-wrap">
          <BrainCircuit className="icon-ai pulsing" size={28} />
          <div>
            <h3>Gemini Study Planner</h3>
            <span className="ai-status">AI Academic Orchestrator Active</span>
          </div>
        </div>
        <button 
          onClick={handleGenerate} 
          className="btn btn-primary btn-sm" 
          disabled={loading}
          style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
        >
          <RefreshCw size={14} style={{ marginRight: '4px' }} className={loading ? 'spin' : ''} />
          {plan ? 'Regenerate Plan' : 'Generate Plan'}
        </button>
      </div>

      {error && <div className="alert alert-danger" style={{ fontSize: '0.8rem', padding: '0.5rem' }}>{error}</div>}

      <div className="ai-plan-display" style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '1rem', minHeight: '150px' }}>
        {loading ? (
          <div className="dashboard-loading" style={{ padding: '2rem 0' }}>
            <div className="spinner"></div>
            <p>Gemini is compiling custom study plans...</p>
          </div>
        ) : plan ? (
          <div className="markdown-body" style={{ color: 'var(--text-main)' }}>
            {parseMarkdown(plan)}
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <Sparkles size={36} className="icon-primary pulsing" style={{ marginBottom: '1rem' }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Generate a custom study plan customized to your deadlines, goals, and placement subjects.</p>
            <button onClick={handleGenerate} className="btn btn-primary" style={{ width: 'auto', marginTop: '1rem', display: 'inline-flex' }}>
              Create Custom Study Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
