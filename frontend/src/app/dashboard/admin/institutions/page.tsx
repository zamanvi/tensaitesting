'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Institution {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  affiliate_code: string;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  profile: {
    institution_name: string | null;
    institution_type: string | null;
    country: string | null;
    city: string | null;
    website: string | null;
    contact_person: string | null;
    verified: boolean;
  } | null;
  leads_count: number;
  referrals_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

const inputCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

export default function AdminInstitutionsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isAdmin = user?.roles?.some(r => r === 'admin' || r === 'super_admin');
  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard');
  }, [user, isAdmin, router]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [actionOk, setActionOk] = useState<number | null>(null);
  const [actionErr, setActionErr] = useState('');

  const { data, isLoading } = useQuery<Institution[] | { data: Institution[] }>({
    queryKey: ['admin-institutions'],
    queryFn: () => api.get('/admin/institutions').then(r => r.data),
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const institutions: Institution[] = Array.isArray(data) ? data : (data as { data: Institution[] })?.data ?? [];

  const filtered = institutions.filter(i => {
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return i.name.toLowerCase().includes(s) || i.email.toLowerCase().includes(s) ||
        (i.profile?.country ?? '').toLowerCase().includes(s);
    }
    return true;
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/institutions/${id}/status`, { status }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-institutions'] });
      setActionOk(id);
      setActionErr('');
      setTimeout(() => setActionOk(null), 3000);
    },
    onError: () => setActionErr(ja ? '操作に失敗しました。' : bn ? 'ব্যর্থ হয়েছে।' : 'Action failed.'),
  });

  const toggleVerify = useMutation({
    mutationFn: ({ id, verified }: { id: number; verified: boolean }) =>
      api.patch(`/admin/institutions/${id}/verify`, { verified }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-institutions'] }),
    onError: () => setActionErr(ja ? '操作に失敗しました。' : bn ? 'ব্যর্থ হয়েছে।' : 'Action failed.'),
  });

  if (!user || !isAdmin) return null;

  const title = ja ? '機関管理' : bn ? 'ইনস্টিটিউশন ম্যানেজমেন্ট' : 'Institution Management';

  return (
    <DashboardLayout title={title}>

      {/* Search + filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={ja ? '名前・メール・国で検索...' : bn ? 'নাম, ইমেইল বা দেশ খুঁজুন...' : 'Search by name, email or country...'}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'pending', 'suspended'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {s === 'all' ? (ja ? 'すべて' : bn ? 'সব' : 'All') : s}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-3 px-1">
        {filtered.length} {ja ? '機関' : bn ? 'টি প্রতিষ্ঠান' : `institution${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {actionErr && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {actionErr}</div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '機関が見つかりません。' : bn ? 'কোনো প্রতিষ্ঠান পাওয়া যায়নি।' : 'No institutions found.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inst => {
            const isOpen = expanded === inst.id;
            const isVerified = inst.profile?.verified ?? false;
            return (
              <div key={inst.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Row */}
                <div
                  className="flex flex-wrap items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : inst.id)}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {inst.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{inst.name}</span>
                      {isVerified && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">✓ Verified</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[inst.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {inst.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {inst.email}
                      {inst.profile?.country && ` · ${inst.profile.country}`}
                      {inst.profile?.institution_type && ` · ${inst.profile.institution_type}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                    <div className="text-center hidden sm:block">
                      <div className="font-bold text-slate-700">{inst.leads_count ?? 0}</div>
                      <div>{ja ? '申請' : bn ? 'আবেদন' : 'Applications'}</div>
                    </div>
                    <div className="text-center hidden sm:block">
                      <div className="font-bold text-slate-700">{inst.referrals_count ?? 0}</div>
                      <div>{ja ? '紹介者' : bn ? 'রেফারেল' : 'Referrals'}</div>
                    </div>
                    <span className="text-slate-300">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4">

                    {/* Profile info */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {[
                        { label: ja ? 'メール' : bn ? 'ইমেইল' : 'Email', value: inst.email },
                        { label: ja ? '電話' : bn ? 'ফোন' : 'Phone', value: inst.phone },
                        { label: ja ? '紹介コード' : bn ? 'রেফারেল কোড' : 'Ref Code', value: inst.affiliate_code },
                        { label: ja ? '国' : bn ? 'দেশ' : 'Country', value: inst.profile?.country },
                        { label: ja ? '都市' : bn ? 'শহর' : 'City', value: inst.profile?.city },
                        { label: ja ? 'ウェブサイト' : bn ? 'ওয়েবসাইট' : 'Website', value: inst.profile?.website },
                        { label: ja ? '担当者' : bn ? 'যোগাযোগ ব্যক্তি' : 'Contact Person', value: inst.profile?.contact_person },
                        { label: ja ? '種別' : bn ? 'ধরন' : 'Type', value: inst.profile?.institution_type },
                        { label: ja ? '登録日' : bn ? 'যোগদান' : 'Joined', value: new Date(inst.created_at).toLocaleDateString() },
                      ].map(row => row.value ? (
                        <div key={row.label}>
                          <div className="text-slate-400 font-medium mb-0.5">{row.label}</div>
                          <div className="text-slate-700 font-semibold truncate">{row.value}</div>
                        </div>
                      ) : null)}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Verify toggle */}
                      <button
                        onClick={() => toggleVerify.mutate({ id: inst.id, verified: !isVerified })}
                        disabled={toggleVerify.isPending}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                          isVerified
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isVerified
                          ? (ja ? '✓ 認証済み — 取消す' : bn ? '✓ ভেরিফাইড — বাতিল করুন' : '✓ Verified — Unverify')
                          : (ja ? '認証する' : bn ? 'ভেরিফাই করুন' : 'Verify')}
                      </button>

                      {/* Activate */}
                      {inst.status !== 'active' && (
                        <button
                          onClick={() => updateStatus.mutate({ id: inst.id, status: 'active' })}
                          disabled={updateStatus.isPending}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
                        >
                          {ja ? 'アクティブにする' : bn ? 'সক্রিয় করুন' : 'Activate'}
                        </button>
                      )}

                      {/* Suspend */}
                      {inst.status !== 'suspended' && (
                        <button
                          onClick={() => {
                            if (!window.confirm(ja ? `「${inst.name}」を停止しますか？` : bn ? `"${inst.name}" সাসপেন্ড করবেন?` : `Suspend "${inst.name}"?`)) return;
                            updateStatus.mutate({ id: inst.id, status: 'suspended' });
                          }}
                          disabled={updateStatus.isPending}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                        >
                          {ja ? '停止する' : bn ? 'সাসপেন্ড করুন' : 'Suspend'}
                        </button>
                      )}

                      {actionOk === inst.id && (
                        <span className="text-xs text-emerald-600 font-semibold self-center">✓ {ja ? '更新しました' : bn ? 'আপডেট হয়েছে' : 'Updated'}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
