'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { BookOpen, User, Mail, Save, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SharedJournalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, isRTL } = useLanguage();
  const router = useRouter();

  const [content, setContent] = useState('');
  const [journal, setJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visitor, setVisitor] = useState<{ name: string; email: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Initial Load & Visitor Check
  useEffect(() => {
    const savedVisitor = localStorage.getItem('aura-visitor');
    if (savedVisitor) {
      const v = JSON.parse(savedVisitor);
      setVisitor(v);
      fetchJournal(v);
    } else {
      setShowModal(true);
      setLoading(false);
    }
  }, [id]);

  const fetchJournal = async (v: any) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setJournal(data);
      setContent(data.content);
      // Log this visit once
      logVisit(v, data);
    }
    setLoading(false);
  };

  const logVisit = async (v: any, journalData: any) => {
    await supabase.from('access_logs').insert({
      journal_id: id,
      visitor_name: v.name,
      visitor_email: v.email,
      owner_id: journalData.user_id // Capture the owner to notify them
    });
  };

  const handleVisitorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const v = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    };
    if (v.name && v.email) {
      localStorage.setItem('aura-visitor', JSON.stringify(v));
      setVisitor(v);
      setShowModal(false);
      fetchJournal(v);
    }
  };

  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!journal || !visitor) return;
    setIsSaving(true);
    
    try {
      if (editId) {
        // Update existing guest-branch
        await supabase
          .from('journals')
          .update({ 
            content, 
            last_edited_by: visitor.name, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', editId);
      } else {
        // Create a NEW row (the branched version)
        const { data, error } = await supabase
          .from('journals')
          .insert({ 
            content, 
            last_edited_by: visitor.name,
            parent_id: id // Link back to original
          })
          .select()
          .single();
        
        if (data) setEditId(data.id);
      }
      alert(t('saved'));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '10rem' }}><Loader2 className="animate-spin" size={40} color="var(--primary)" /></div>;

  return (
    <div className="container" style={{ maxWidth: 800 }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            {isRTL ? <ArrowRight color="var(--text-muted)" /> : <ArrowLeft color="var(--text-muted)" />}
          </button>
          <div style={{ backgroundColor: 'var(--primary)', padding: '8px', borderRadius: '10px', color: 'white' }}>
            <BookOpen size={20} />
          </div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('appName')} — {t('appTagline')}</h1>
        </div>
      </header>

      {/* Editor Case */}
      {journal && (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('newJournal')}</h2>
                {journal.last_edited_by && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t('lastEditedBy')} {journal.last_edited_by}
                  </p>
                )}
             </div>
             <button 
               className="button-primary" 
               onClick={handleSave} 
               disabled={isSaving}
               style={{ padding: '8px 16px', fontSize: '0.9rem' }}
             >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? t('saving') : t('save')}
             </button>
          </div>

          <textarea
            className="input-field"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ 
              minHeight: '450px', 
              direction: isRTL ? 'rtl' : 'ltr',
              lineHeight: '1.8',
              fontSize: '1.05rem' 
            }}
          />
        </div>
      )}

      {/* Visitor Identification Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, 
          backgroundColor: 'rgba(0,0,0,0.4)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <form 
            onSubmit={handleVisitorSubmit}
            className="glass-panel" 
            style={{ padding: '2.5rem', maxWidth: 400, width: '90%', background: 'white' }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
              {t('guestNameTitle')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', textAlign: 'center' }}>
              {t('guestNameDesc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>{t('visitorName')}</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRTL ? 'right' : 'left']: '12px', color: 'var(--text-muted)' }} />
                  <input name="name" required className="input-field" style={{ paddingInlineStart: '40px' }} placeholder="John Doe" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>{t('visitorEmail')}</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRTL ? 'right' : 'left']: '12px', color: 'var(--text-muted)' }} />
                  <input name="email" type="email" required className="input-field" style={{ paddingInlineStart: '40px' }} placeholder="john@example.com" />
                </div>
              </div>

              <button className="button-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                {t('enterApp')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
