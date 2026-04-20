'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { Mail, Lock, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage({ 
          type: 'success', 
          text: lang === 'ar' ? 'تفحص بريدك الإلكتروني لتأكيد الحساب!' : 'Check your email to confirm your account!' 
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl text-white mb-4 shadow-lg">
          <BookOpen size={32} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          {isSignUp ? (lang === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account') : t.signInTitle}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isSignUp 
            ? (lang === 'ar' ? 'انضم لمجتمع أورا وابدأ تدوين يومياتك بأمان' : 'Join Aura and start journaling securely')
            : t.signInDescription}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-3xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleAuth}>
            {message && (
              <div className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all font-bold"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? (lang === 'ar' ? 'سجل الآن' : 'Sign Up') : t.signInButton)}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t.orContinueWith}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.94 0 3.51.68 4.75 1.72l3.48-3.48C18.11 1.34 15.28 0 12 0 7.31 0 3.32 2.67 1.31 6.58l3.92 3.03c.92-2.78 3.53-4.57 6.77-4.57z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.89 3c2.26-2.09 3.53-5.17 3.53-8.82z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.09 7.96-2.96l-3.89-3c-1.11.75-2.53 1.21-4.07 1.21-3.24 0-5.85-2.13-6.83-5.06l-3.92 3.03C3.32 21.33 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.17 14.19c-.25-.76-.39-1.57-.39-2.42 0-.85.14-1.66.39-2.42L1.25 6.32C.45 7.99 0 9.87 0 11.77c0 1.9.45 3.78 1.25 5.45l3.92-3.03z"
                  />
                </svg>
                {t.googleSignIn}
              </button>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {isSignUp ? t.signInButton : (lang === 'ar' ? 'إنشاء حساب جديد' : 'Create Account')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
