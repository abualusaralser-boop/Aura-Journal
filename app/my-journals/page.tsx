'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Book, Calendar, ChevronRight, Search, Trash2, Plus, Bell, Eye } from 'lucide-react';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  parent_id?: string | null;
  last_edited_by?: string | null;
}

interface AccessLog {
  id: number;
  journal_id: string;
  visitor_name: string;
  visitor_email: string;
  visited_at: string;
}

export default function MyJournals() {
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const { user } = useAuth();

  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [branchedJournals, setBranchedJournals] = useState<JournalEntry[]>([]);
  const [notifications, setNotifications] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // 1. Fetch user's own journals
      const { data: myData, error: myError } = await supabase
        .from('journals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (myError) throw myError;
      const myJournals = myData || [];
      setJournals(myJournals);

      // 2. Fetch branched journals (edited by visitors)
      if (myJournals.length > 0) {
        const parentIds = myJournals.map(j => j.id);
        const { data: branchData } = await supabase
          .from('journals')
          .select('*')
          .in('parent_id', parentIds)
          .order('updated_at', { ascending: false });
        
        setBranchedJournals(branchData || []);
      }

      // 3. Fetch access logs (notifications)
      const { data: logsData } = await supabase
        .from('access_logs')
        .select('*')
        .eq('owner_id', user.id)
        .order('visited_at', { ascending: false })
        .limit(20);
      
      setNotifications(logsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteJournal = async (id: string, isBranch = false) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه اليومية؟' : 'Are you sure you want to delete this journal?')) {
      return;
    }

    try {
      const { error } = await supabase.from('journals').delete().eq('id', id);
      if (error) throw error;
      
      if (isBranch) {
        setBranchedJournals(branchedJournals.filter(j => j.id !== id));
      } else {
        setJournals(journals.filter(j => j.id !== id));
      }
    } catch (error) {
      console.error('Error deleting journal:', error);
    }
  };

  const cleanSearchContent = (content: string) => {
    // Basic clean up of markdown and html tags for searching
    return content.replace(/<[^>]*>?/gm, '').replace(/(\*\*|__)(.*?)\1/g, '$2');
  };

  const allJournals = [...journals, ...branchedJournals];
  const filteredJournals = allJournals.filter(j => {
    const searchContent = (cleanSearchContent(j.content) + (j.title || '')).toLowerCase();
    return searchContent.includes(searchQuery.toLowerCase());
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && journals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Book className="text-indigo-600" />
            {t.myJournals}
          </h1>
          <p className="text-gray-500 mt-2">
            {lang === 'ar' ? 'تاريخ مسوداتك وخواطرك' : 'History of your drafts and thoughts'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="bg-white hover:bg-gray-50 text-indigo-600 border border-indigo-100 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                {notifications.length}
              </span>
            )}
          </button>
          <Link
            href="/"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} />
            {t.newEntry}
          </Link>
        </div>
      </div>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8 max-h-[300px] overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
            <Eye size={18} className="text-indigo-600" />
            {lang === 'ar' ? 'إشعارات المشاهدة والزيارات' : 'View Notifications & Visits'}
          </h3>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              {lang === 'ar' ? 'لا توجد إشعارات حالياً' : 'No notifications currently'}
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map(log => (
                <div key={log.id} className="bg-gray-50 rounded-xl p-3 text-sm flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-gray-800">{log.visitor_name}</span>
                    <span className="text-gray-500 mx-1">({log.visitor_email})</span>
                    <span className="text-gray-600">
                      {lang === 'ar' ? 'قام بفتح يوميتك' : 'opened your journal'}
                    </span>
                  </div>
                  <span className="text-xs text-indigo-500 font-medium whitespace-nowrap bg-indigo-50 px-2 py-1 rounded">
                    {formatDate(log.visited_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={t.search + '...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-12 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      {filteredJournals.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-medium text-gray-900">{t.noJournals}</h3>
          <p className="text-gray-500 mt-2">{t.noJournalsHint}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJournals.map((journal) => {
            const isBranch = !!journal.parent_id;
            return (
              <div
                key={journal.id}
                className={`group bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                  isBranch ? 'border-amber-200 bg-amber-50/30' : 'border-gray-50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
                    <Calendar size={14} />
                    {formatDate(journal.created_at)}
                  </div>

                  <button
                    onClick={() => deleteJournal(journal.id, isBranch)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <Link href={`/journal/${journal.id}`} className="block">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                    {journal.title || (lang === 'ar' ? 'يومية بدون عنوان' : 'Untitled Journal')}
                    {isBranch && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full whitespace-nowrap inline-block font-normal">
                        {lang === 'ar' ? `نسخة معدلة من: ${journal.last_edited_by}` : `Edited by: ${journal.last_edited_by}`}
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-600 line-clamp-2 text-sm leading-relaxed mb-4">
                    {cleanSearchContent(journal.content).substring(0, 150)}...
                  </p>
                  <div className="flex items-center text-indigo-600 font-medium text-sm">
                    {lang === 'ar' ? 'اقرأ المزيد' : 'Read more'}
                    <ChevronRight size={16} className={`${isRTL ? 'rotate-180' : ''} mx-1`} />
                  </div>
                </Link>

                {/* Vertical Branch Indicator */}
                {isBranch && (
                  <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-1 bg-amber-400`} title="Branch/Version" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
