'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Globe, Mic2, Palette, Key, ShieldCheck, Info,
  ArrowLeft, ArrowRight, Check, Trash2, ChevronDown, Cloud
} from 'lucide-react';

type Dialect = 'sudanese' | 'egyptian' | 'gulf' | 'fusha';
type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';

export default function SettingsPage() {
  const { lang, setLang, t, isRTL } = useLanguage();
  const router = useRouter();

  const [dialect, setDialect] = useState<Dialect>('sudanese');
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [apiKey, setApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [autoSave, setAutoSave] = useState(true);
  const [localOnly, setLocalOnly] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('aura-settings');
    if (s) {
      const parsed = JSON.parse(s);
      setDialect(parsed.dialect ?? 'sudanese');
      setTheme(parsed.theme ?? 'light');
      setFontSize(parsed.fontSize ?? 'medium');
      setAutoSave(parsed.autoSave ?? true);
      setLocalOnly(parsed.localOnly ?? false);
      setSupabaseUrl(parsed.supabaseUrl ?? '');
      setSupabaseKey(parsed.supabaseKey ?? '');
    }
    const key = localStorage.getItem('aura-api-key');
    if (key) setApiKey(key);
  }, []);

  const handleSave = () => {
    localStorage.setItem('aura-settings', JSON.stringify({ 
      dialect, theme, fontSize, autoSave, localOnly, supabaseUrl, supabaseKey 
    }));
    localStorage.setItem('aura-api-key', apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      // Force reload to update supabase client state
      window.location.reload();
    }, 1500);
  };

  const handleClearData = () => {
    if (confirm(t('clearDataConfirm'))) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const sectionStyle: React.CSSProperties = {
    background: 'var(--surface)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--surface-border)',
    borderRadius: 'var(--radius)',
    padding: '1.75rem',
    marginBottom: '1.25rem',
    boxShadow: 'var(--shadow-lg)',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '1.25rem', paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(79,70,229,0.12)',
    color: 'var(--primary)', fontWeight: 700, fontSize: '1rem',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem',
  };

  const labelStyle: React.CSSProperties = { fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem' };
  const hintStyle: React.CSSProperties = { color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' };

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: '20px',
    border: `1.5px solid ${active ? 'var(--primary)' : 'rgba(0,0,0,0.12)'}`,
    background: active ? 'rgba(79,70,229,0.1)' : 'rgba(255,255,255,0.7)',
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    fontWeight: active ? 600 : 400, cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s',
  });

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    width: 48, height: 26, borderRadius: 13,
    background: active ? 'var(--primary)' : '#cbd5e1',
    position: 'relative', cursor: 'pointer', transition: 'background 0.2s', border: 'none', flexShrink: 0,
  });

  const thumbStyle = (active: boolean): React.CSSProperties => ({
    position: 'absolute', top: 3, left: active ? 24 : 3, width: 20, height: 20,
    borderRadius: '50%', background: 'white', transition: 'left 0.2s',
  });

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/')} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '50%', padding: '10px', cursor: 'pointer', color: 'var(--text-main)' }}>
          <BackIcon size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('settingsTitle')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('settingsSubtitle')}</p>
        </div>
      </header>

      {/* Language Section */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}><Globe size={20} />{t('languageSection')}</div>
        <div style={rowStyle}>
          <div style={labelStyle}>{t('languageLabel')}</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setLang('ar')} style={chipStyle(lang === 'ar')}>{t('arabicOption')}</button>
            <button onClick={() => setLang('en')} style={chipStyle(lang === 'en')}>{t('englishOption')}</button>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}><Key size={20} />{t('apiSection')}</div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ ...labelStyle, marginBottom: '6px' }}>{t('apiKeyLabel')}</div>
          <div style={{ position: 'relative' }}>
            <input type={showApiKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={t('apiKeyPlaceholder')} className="input-field" style={{ paddingInlineEnd: '48px' }} />
            <button onClick={() => setShowApiKey(!showApiKey)} style={{ position: 'absolute', insetInlineEnd: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>{showApiKey ? '🙈' : '👁'}</button>
          </div>
          <div style={hintStyle}>{t('apiKeyHint')}</div>
        </div>
      </section>



      {/* Privacy Section */}
      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}><ShieldCheck size={20} />{t('privacySection')}</div>
        <div style={rowStyle}>
          <div><div style={labelStyle}>{t('autoSave')}</div><div style={hintStyle}>{t('autoSaveHint')}</div></div>
          <button style={toggleStyle(autoSave)} onClick={() => setAutoSave(!autoSave)}><span style={thumbStyle(autoSave)} /></button>
        </div>
        <button onClick={handleClearData} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
          <Trash2 size={16} />{t('clearData')}
        </button>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '3rem' }}>
        <button className="button-primary" onClick={handleSave} style={{ minWidth: 200, justifyContent: 'center' }}>
          {saved ? <><Check size={18} />{t('settingsSaved')}</> : t('saveSettings')}
        </button>
      </div>
    </div>
  );
}
