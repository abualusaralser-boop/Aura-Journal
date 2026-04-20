'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, User, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { t, isRTL, lang } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // If not logged in, redirect or show a message
  if (!user) {
    return (
      <div className="container" style={{ maxWidth: 500, textAlign: 'center', marginTop: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          {lang === 'ar' ? 'غير مسجل الدخول' : 'Not Logged In'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {lang === 'ar' ? 'يجب عليك تسجيل الدخول لعرض حسابك وتجنب تكرار الربط.' : 'You must log in to view your profile and avoid re-linking.'}
        </p>
        <Link href="/login" className="button-primary" style={{ padding: '12px 24px', display: 'inline-flex' }}>
          {lang === 'ar' ? 'الذهاب لتسجيل الدخول' : 'Go to Login'}
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 500 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '3rem' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'var(--surface)', border: '1px solid var(--surface-border)',
            borderRadius: '50%', padding: '10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', color: 'var(--text-main)'
          }}
        >
          <BackIcon size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('profileTitle')}</h1>
      </header>

      <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem', color: 'var(--primary)'
        }}>
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <User size={40} />
          )}
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          {user.email}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div style={{
            padding: '1rem',
            borderRadius: '12px',
            background: 'rgba(79, 70, 229, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            color: 'var(--primary)',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            {lang === 'ar' ? 'حسابك مربوط ومسجل بنجاح' : 'Account successfully linked and active'}
          </div>

          <button 
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="button-primary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              marginTop: '1rem', 
              padding: '12px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none'
            }}
          >
            <LogOut size={18} style={{ marginInlineEnd: '8px' }} />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
