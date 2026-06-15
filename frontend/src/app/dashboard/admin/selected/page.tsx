'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SelectedApp {
  id: number;
  lead_code: string;
  target_country: string;
  target_city: string | null;
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  selected_at: string;
  connected: boolean;
  institution: {
    id: number;
    name: string;
    country: string | null;
    email: string;
  };
}

export default function AdminSelectedPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isAdmin = user?.roles?.some(r => r === 'admin' || r === 'super_admin');
  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  const [search, setSearch] = useState('');
  const [connectedFilter, setConnectedFilter] = useState<'all' | 'connected' | 'pending'>('all');
  const [unselectingId, setUnselectingId] = useState<number | null>(null);
  const [actionOk, setActionOk] = useState('');
  const [actionErr, setActionErr] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-selected'],
    queryFn: () => api.get('/admin/selected-applications').then(r => r.data),
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const apps: SelectedApp[] = Array.isArray(data) ? data : data?.data ?? [];

  const filtered = apps.filter(a => {
    if (connectedFilter === 'connected' && !a.connected) return false;
    if (connectedFilter === 'pending' && a.connected) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        a.lead_code.toLowerCase().includes(s) ||
        a.target_country.toLowerCase().includes(s) ||
        a.institution.name.toLowerCase().includes(s) ||
        a.institution.email.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const unselect = useMutation({
    mutationFn: (id: number) => api.post(`/admin/selected-applications/${id}/unselect`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-selected'] });
      setUnselectingId(null);
      setActionOk(ja ? '申請を選択解除し、プールに戻しました。' : bn ? 'আবেদন আনসিলেক্ট করা হয়েছে, পুলে ফেরত গেছে।' : 'Application unselected and returned to the pool.');
      setActionErr('');
      setTimeout(() => setActionOk(''), 4000);
    },
    onError: () => {
      setActionErr(ja ? '操作に失敗しました。' : bn ? 'ব্যর্থ হয়েছে।' : 'Action failed.');
      setTimeout(() => setActionErr(''), 4000);
    },
  });

  if (!user || !isAdmin) return null;

  const title = ja ? '選択済み申請' : bn ? 'নির্বাচিত আবেদন' : 'Selected Applications';

  return (
    <DashboardLayout title={title}>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={ja ? 'コード・国・機関名で検索...' : bn ? 'কোড, দেশ বা প্রতিষ্ঠান খুঁজুন...' : 'Search by code, country or institution...'}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { k: 'all',       label: ja ? 'すべて'    : bn ? 'সব'          : 'All' },
            { k: 'pending',   label: ja ? '未接続'    : bn ? 'পেন্ডিং'    : 'Pending Connect' },
            { k: 'connected', label: ja ? '接続済み'  : bn ? 'কানেক্টেড'  : 'Connected' },
          ].map(({ k, label }) => (
            <button key={k}
              onClick={() => setConnectedFilter(k as typeof connectedFilter)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                connectedFilter === k ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {actionOk && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
          ✓ {actionOk}
        </div>
      )}
      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          ⚠️ {actionErr}
        </div>
      )}

      <div className="text-xs text-slate-500 mb-3 px-1">
        {filtered.length} {ja ? '件' : bn ? 'টি' : `application${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">📂</div>
          <p className="font-medium text-slate-500 mb-1">
            {ja ? '選択済み申請はありません' : bn ? 'কোনো নির্বাচিত আবেদন নেই' : 'No selected applications'}
          </p>
          <p className="text-xs">
            {ja ? '機関が申請を選択すると、ここに表示されます。' : bn ? 'প্রতিষ্ঠান আবেদন নির্বাচন করলে এখানে দেখাবে।' : 'Applications selected by institutions will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${app.connected ? 'border-emerald-200' : 'border-slate-100'}`}>
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-4">

                  {/* Application info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{app.lead_code}</span>
                      {app.connected ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          ✓ {ja ? '接続済み' : bn ? 'কানেক্টেড' : 'Connected'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {ja ? '未接続' : bn ? 'কানেক্ট বাকি' : 'Pending Connect'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs mb-3">
                      <InfoRow label={ja ? '国' : bn ? 'দেশ' : 'Country'} value={app.target_country} />
                      {app.target_city && <InfoRow label={ja ? '都市' : bn ? 'শহর' : 'City'} value={app.target_city} />}
                      {app.target_course && <InfoRow label={ja ? 'コース' : bn ? 'কোর্স' : 'Course'} value={app.target_course} />}
                      {app.last_education && <InfoRow label={ja ? '学歴' : bn ? 'শিক্ষা' : 'Education'} value={app.last_education} />}
                      {app.gpa && <InfoRow label="GPA" value={app.gpa} />}
                      {app.target_intake && <InfoRow label={ja ? 'インテーク' : bn ? 'ইনটেক' : 'Intake'} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      {ja ? '選択日：' : bn ? 'নির্বাচন: ' : 'Selected: '}
                      {new Date(app.selected_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>

                  {/* Institution info */}
                  <div className="shrink-0 min-w-[160px] bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">
                      {ja ? '選択した機関' : bn ? 'নির্বাচনকারী প্রতিষ্ঠান' : 'Selected by'}
                    </p>
                    <p className="font-bold text-slate-800 truncate">{app.institution.name}</p>
                    {app.institution.country && <p className="text-slate-500 mt-0.5">{app.institution.country}</p>}
                    <p className="text-slate-400 truncate mt-0.5">{app.institution.email}</p>
                  </div>
                </div>

                {/* Unselect action */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    {ja
                      ? '選択解除すると、この申請はプールに戻り他の機関が選択できるようになります。'
                      : bn
                      ? 'আনসিলেক্ট করলে এই আবেদন পুনরায় পুলে ফিরে যাবে এবং অন্য প্রতিষ্ঠান নির্বাচন করতে পারবে।'
                      : 'Unselecting returns this application to the pool so other institutions can select it.'}
                  </p>
                  {unselectingId === app.id ? (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => unselect.mutate(app.id)}
                        disabled={unselect.isPending}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {unselect.isPending ? '...' : (ja ? '確認' : bn ? 'নিশ্চিত' : 'Confirm')}
                      </button>
                      <button
                        onClick={() => setUnselectingId(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                      >
                        {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUnselectingId(app.id)}
                      className="shrink-0 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
                    >
                      {ja ? '選択解除' : bn ? 'আনসিলেক্ট' : 'Unselect'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span className="font-semibold text-slate-700 truncate">{value}</span>
    </div>
  );
}
