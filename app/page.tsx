'use client';

import { useState, useEffect, useCallback } from 'react';
import VoiceRecorder from '@/components/VoiceRecorder';
import AIAssistant from '@/components/AIAssistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, User, Search, Share2, Settings, Save, Loader2, Bell, X, Clock, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { t, lang, isRTL } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const today = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SD' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [shareStatus, setShareStatus] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('aura-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('aura-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleTranscription = (text: string) => {
    setContent(prev => prev ? prev + ' ' + text : text);
  };

  const handleAIResult = (result: string) => {
    setContent(result);
  };

  // Fetch notifications (visits and edits) belonging to the user's journals
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    // 1. Fetch user's journals
    const { data: userJournals } = await supabase
      .from('journals')
      .select('id')
      .eq('user_id', user.id);
    
    const journalIds = userJournals?.map(j => j.id) || [];
    if (journalIds.length === 0) return;

    // 2. Fetch visits for those journals
    const { data: visits } = await supabase
      .from('access_logs')
      .select('*')
      .in('journal_id', journalIds)
      .order('visited_at', { ascending: false })
      .limit(10);
    
    // 3. Fetch edits (journals with parent_id being one of user's journals)
    const { data: edits } = await supabase
      .from('journals')
      .select('*')
      .in('parent_id', journalIds)
      .order('created_at', { ascending: false })
      .limit(10);

    const all = [
      ...(visits || []).map(v => ({ ...v, type: 'visit', time: v.visited_at })),
      ...(edits || []).map(e => ({ ...e, type: 'edit', time: e.created_at }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    setNotifications(all);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleShare = async () => {
    if (!content.trim()) return;
    setIsSharing(true);
    
    try {
      const { data, error } = await supabase
        .from('journals')
        .insert({ 
          content,
          user_id: user?.id || null 
        })
        .select()
        .single();
      
      if (error) throw error;
      const shareUrl = `${window.location.origin}/journal/${data.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus(true);
      setTimeout(() => setShareStatus(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSharing(false);
    }
  };

  const [currentJournalId, setCurrentJournalId] = useState<string | null>(null);

  // ─── Modified Save Function for Auth ───
  const handleSave = useCallback(async () => {
    if (!content.trim()) return;
    setSaveStatus('saving');

    if (user) {
      if (currentJournalId) {
        // Update existing journal in this session
        const { error } = await supabase
          .from('journals')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', currentJournalId);
          
        if (!error) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2500);
        } else {
          setSaveStatus('idle');
          alert('Failed to update journal.');
        }
      } else {
        // Save new journal to Supabase
        const { data, error } = await supabase.from('journals')
          .insert({
            content,
            user_id: user.id
          })
          .select()
          .single();
          
        if (!error && data) {
          setCurrentJournalId(data.id);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2500);
        } else {
          setSaveStatus('idle');
          alert('Failed to save to cloud.');
        }
      }
    } else {
      // Save to LocalStorage for guests
      const entries = JSON.parse(localStorage.getItem('aura-journals') || '[]');
      entries.unshift({ id: Date.now(), content, date: new Date().toISOString(), lang });
      localStorage.setItem('aura-journals', JSON.stringify(entries));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  }, [content, user, lang, currentJournalId]);

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* ─── Header ─── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'var(--primary)', padding: '10px', borderRadius: '12px', color: 'white', display: 'flex' }}>
            <BookOpen size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('appName')} — {t('appTagline')}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>{today}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/my-journals" title={t('myJournals')} style={{ textDecoration: 'none' }}>
                <button className="glass-panel" style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 600 }}>
                  <Clock size={18} />
                  {lang === 'ar' ? 'سجل اليوميات' : 'My Journals'}
                </button>
              </Link>
              <button 
                onClick={() => signOut()}
                className="glass-panel" 
                style={{ padding: '8px 16px', border: 'none', cursor: 'pointer', borderRadius: '12px', fontSize: '0.8rem', color: '#ef4444' }}
              >
                {lang === 'ar' ? 'خروج' : 'Logout'}
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-indigo-600 text-white" style={{ padding: '8px 20px', border: 'none', cursor: 'pointer', borderRadius: '12px', fontSize: '0.85rem' }}>
                {t('signInButton')}
              </button>
            </Link>
          )}
          
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="glass-panel"
            style={{ padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '50%', position: 'relative' }}
          >
            <Bell size={20} color={notifications.length > 0 ? 'var(--primary)' : 'var(--text-main)'} />
            {notifications.length > 0 && <span style={{ position: 'absolute', top: 5, right: 5, width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: '50%' }}></span>}
          </button>
          
          <button
            onClick={toggleTheme}
            className="glass-panel"
            style={{ padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '50%' }}
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} color="var(--primary)" /> : <Sun size={20} color="#fbbf24" />}
          </button>
          <Link href="/settings">
            <button className="glass-panel" style={{ padding: '10px', border: 'none', cursor: 'pointer', borderRadius: '50%' }}><Settings size={20} color="var(--text-main)" /></button>
          </Link>
        </div>
      </header>

      {/* Notifications Popup */}
      {showNotifications && (
        <div className="glass-panel" style={{
          position: 'absolute', top: '5rem', [isRTL ? 'left' : 'right']: '2rem',
          zIndex: 1000, width: '320px', padding: '1.25rem', background: 'white',
          maxHeight: '400px', overflowY: 'auto', border: '2px solid var(--primary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('notifications')}</h3>
            <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowNotifications(false)} />
          </div>
          {notifications.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>{t('noNotifications')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((n) => (
                <div key={n.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                    {n.type === 'visit' ? n.visitor_name : n.last_edited_by} 
                    {' '}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
                      {n.type === 'visit' ? t('visitedYourJournal') : t('editedYourJournal')}
                    </span>
                  </p>
                  
                  {n.type === 'edit' && (
                    <Link 
                      href={`/journal/${n.id}`} 
                      target="_blank"
                      style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline', display: 'block', marginTop: '4px' }}
                    >
                      {t('home')} (النسخة المعدلة)
                    </Link>
                  )}

                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Clock size={12} /> {new Date(n.time).toLocaleTimeString(lang === 'ar' ? 'ar-SD' : 'en-US')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Editor ─── */}
      <main>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{t('newJournal')}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {shareStatus && <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>{t('shareSuccess')}</span>}
              <button onClick={handleShare} disabled={isSharing} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, opacity: isSharing ? 0.6 : 1 }}>
                {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                {isSharing ? t('shareLinkStatus') : t('share')}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', padding: '1rem', background: 'rgba(79,70,229,0.04)', borderRadius: '12px', border: '1px dashed rgba(79,70,229,0.15)' }}>
            <div style={{ flex: '1', minWidth: 220 }}><VoiceRecorder onTranscription={handleTranscription} /></div>
            <div style={{ width: '1px', height: 36, background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
            <AIAssistant content={content} onResult={handleAIResult} />
          </div>

          <textarea className="input-field" placeholder={t('writeHere')} value={content} onChange={e => setContent(e.target.value)} style={{ minHeight: '380px', resize: 'vertical', fontSize: '1.1rem', lineHeight: '1.9', direction: isRTL ? 'rtl' : 'ltr' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{content.trim() ? content.trim().split(/\s+/).length : 0} {t('wordCount')} · {content.length} {t('charCount')}</span>
            <button className="button-primary" onClick={handleSave} disabled={!content.trim() || saveStatus === 'saving'} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} />
              {saveStatus === 'saving' ? t('saving') : saveStatus === 'saved' ? t('saved') : t('save')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
