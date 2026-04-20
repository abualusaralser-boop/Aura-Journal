'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, X, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type AIAction = 'enhance' | 'summarize' | 'rephrase' | 'discuss';

interface AIAssistantProps {
  content: string;
  onResult: (result: string) => void;
}

export default function AIAssistant({ content, onResult }: AIAssistantProps) {
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [discussion, setDiscussion] = useState<string | null>(null);

  const actions: { key: AIAction; label: string }[] = [
    { key: 'enhance',   label: t('aiEnhance')   },
    { key: 'summarize', label: t('aiSummarize') },
    { key: 'rephrase',  label: t('aiRephrase')  },
    { key: 'discuss',   label: t('aiDiscuss')   },
  ];

  const run = async (action: AIAction) => {
    if (!content.trim()) { alert(t('aiNoContent')); return; }
    setOpen(false);
    setLoading(action);
    setDiscussion(null);
    const apiKey = localStorage.getItem('aura-api-key');
    try {
      const res = await fetch('/api/enhance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-api-key': apiKey } : {})
        },
        body: JSON.stringify({ content, action }),
      });
      if (!res.ok) throw new Error('AI request failed');
      const data = await res.json();
      
      if (action === 'discuss') {
        setDiscussion(data.result);
      } else {
        onResult(data.result);
      }
    } catch (e) {
      console.error(e);
      alert(t('aiError'));
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Main AI Button */}
      <button
        id="btn-ai-assistant"
        onClick={() => !isLoading && setOpen(o => !o)}
        disabled={isLoading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '10px',
          border: '1.5px solid rgba(168,85,247,0.4)',
          background: isLoading
            ? 'rgba(168,85,247,0.08)'
            : open
            ? 'rgba(168,85,247,0.15)'
            : 'rgba(168,85,247,0.06)',
          color: '#7c3aed',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: isLoading ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
      >
        <Sparkles size={18} style={{ flexShrink: 0 }} />
        <span>
          {isLoading
            ? `${t('aiProcessing')} (${t(loading === 'enhance' ? 'aiEnhance' : loading === 'summarize' ? 'aiSummarize' : loading === 'rephrase' ? 'aiRephrase' : 'aiDiscuss' as any).replace(/^[^\s]+\s/, '')})`
            : t('aiButton')}
        </span>
        {!isLoading && (
          <ChevronDown
            size={16}
            style={{
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        )}
      </button>

      {/* Discussion Modal/Card */}
      {discussion && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          [isRTL ? 'left' : 'right']: '2rem',
          zIndex: 100,
          width: '320px',
          maxWidth: '90vw',
        }}>
          <div className="glass-panel" style={{
            padding: '1.5rem',
            border: '2px solid var(--primary)',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
                <MessageCircle size={18} />
                {t('aiDiscussionTitle')}
              </div>
              <button 
                onClick={() => setDiscussion(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ 
              fontSize: '0.95rem', 
              lineHeight: '1.6', 
              color: 'var(--text-main)',
              maxHeight: '200px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {discussion}
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {open && (
        <>
          {/* backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: 'absolute',
              [isRTL ? 'right' : 'left']: 0,
              top: 'calc(100% + 8px)',
              zIndex: 20,
              background: 'white',
              borderRadius: '12px',
              border: '1.5px solid rgba(168,85,247,0.2)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              minWidth: 200,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '10px 16px',
              background: 'rgba(168,85,247,0.05)',
              borderBottom: '1px solid rgba(168,85,247,0.12)',
              fontSize: '0.78rem',
              color: '#7c3aed',
              fontWeight: 600,
            }}>
              {t('aiTitle')}
            </div>

            {/* Actions */}
            {actions.map((a) => (
              <button
                key={a.key}
                onClick={() => run(a.key)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: isRTL ? 'right' : 'left',
                  padding: '11px 18px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
