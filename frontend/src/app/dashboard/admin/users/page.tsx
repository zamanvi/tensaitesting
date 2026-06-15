'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  gateway_type: string;
  status: string;
  affiliate_code: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  pending:   'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<string, string> = {
  student:     'bg-blue-100 text-blue-700',
  agency:      'bg-purple-100 text-purple-700',
  institution: 'bg-indigo-100 text-indigo-700',
  affiliate:   'bg-green-100 text-green-700',
  branch:      'bg-teal-100 text-teal-700',
};

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { lang } = useLang();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const isAdmin = user?.roles?.some(r => r === 'admin' || r === 'super_admin');

  useEffect(() => {
    if (user && !isAdmin) router.replace('/dashboard/' + user.gateway_type);
  }, [user, isAdmin, router]);

  const { data, isLoading } = useQuery<UserRow[] | { data: UserRow[] }>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
    enabled: !!isAdmin,
    staleTime: 30_000,
  });

  const users: UserRow[] = Array.isArray(data) ? data : (data as { data: UserRow[] })?.data ?? [];

  const filtered = users.filter(u => {
    if (filterType !== 'all' && u.gateway_type !== filterType) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
    }
    return true;
  });

  const title = lang === 'ja' ? 'ユーザー管理' : lang === 'bn' ? 'ইউজার ম্যানেজমেন্ট' : 'User Management';

  return (
    <DashboardLayout title={title}>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5 space-y-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={lang === 'ja' ? '名前またはメールで検索...' : lang === 'bn' ? 'নাম বা ইমেইল খুঁজুন...' : 'Search by name or email...'}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300"
        />
        <div className="flex gap-2 flex-wrap">
          {/* Type filter */}
          {['all', 'student', 'agency', 'institution', 'affiliate', 'branch'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterType === t ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? (lang === 'ja' ? '全種別' : lang === 'bn' ? 'সব ধরন' : 'All Types') : t}
            </button>
          ))}
          <div className="w-px bg-slate-200 mx-1" />
          {/* Status filter */}
          {['all', 'active', 'pending', 'suspended'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? (lang === 'ja' ? '全ステータス' : lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Status') : s}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-slate-500 mb-3 px-1">
        {lang === 'ja'
          ? `${filtered.length} 件のユーザー`
          : lang === 'bn'
          ? `${filtered.length} জন ইউজার`
          : `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {lang === 'ja' ? '読み込み中...' : lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {lang === 'ja' ? 'ユーザーが見つかりません' : lang === 'bn' ? 'কোনো ইউজার পাওয়া যায়নি' : 'No users found'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">
                    {lang === 'ja' ? '名前' : lang === 'bn' ? 'নাম' : 'Name'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs hidden sm:table-cell">
                    {lang === 'ja' ? 'メール' : lang === 'bn' ? 'ইমেইল' : 'Email'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">
                    {lang === 'ja' ? '種別' : lang === 'bn' ? 'ধরন' : 'Type'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs">
                    {lang === 'ja' ? 'ステータス' : lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs hidden md:table-cell">
                    {lang === 'ja' ? '登録日' : lang === 'bn' ? 'যোগদান' : 'Joined'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-400 sm:hidden truncate">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                      <div className="truncate max-w-[200px]">{u.email}</div>
                      {u.phone && <div className="text-xs text-slate-400">{u.phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[u.gateway_type] ?? 'bg-slate-100 text-slate-600'}`}>
                        {u.gateway_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
