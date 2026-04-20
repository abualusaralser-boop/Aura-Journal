'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      setTimeout(() => {
        router.push('/');
      }, 500);
    };
    
    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <span className="font-medium text-gray-700">جاري إكمال تسجيل الدخول...</span>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
