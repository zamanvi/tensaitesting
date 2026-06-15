'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SelectedApplication {
  id: number;
  lead_code: string;
  target_country: string;
  target_city: string | null;
  target_course: string | null;
  target_intake: string | null;
  last_education: string | null;
  gpa: string | null;
  age: number | null;
  selected_at: string;
  connected: boolean;
  connect_name: string | null;
  connect_email: string | null;
  connect_whatsapp: string | null;
  connect_phone: string | null;
}

interface ConnectForm {
  name: string;
  email: string;
  whatsapp: string;
  phone: string;
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400';

export default function InstitutionSelectedPage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  const [connectingId, setConnectingId] = useState<number | null>(null);
  const [form, setForm] = useState<ConnectForm>({ name: '', email: '', whatsapp: '', phone: '' });
  const [formError, setFormError] = useState('');
  const [doneId, setDoneId] = useState<number | null>(null);
  const [unselectingId, setUnselectingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['institution-selected'],
    queryFn: () => api.get('/institution/selected-applications').then(r => r.data),
    staleTime: 30_000,
  });

  const selected: SelectedApplication[] = data?.data ?? [];

  const unselect = useMutation({
    mutationFn: (id: number) => api.post(`/institution/unselect-application/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setUnselectingId(null);
    },
  });

  const connect = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ConnectForm }) =>
      api.post(`/institution/connect/${id}`, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['institution-selected'] });
      setConnectingId(null);
      setForm({ name: '', email: '', whatsapp: '', phone: '' });
      setFormError('');
      setDoneId(id);
      setTimeout(() => setDoneId(null), 5000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setFormError(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed.');
    },
  });

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!connectingId) return;
    if (!form.name || !form.email) {
      setFormError(ja ? '名前とメールアドレスは必須です。' : bn ? 'নাম ও ইমেইল আবশ্যক।' : 'Name and email are required.');
      return;
    }
    setFormError('');
    connect.mutate({ id: connectingId, payload: form });
  }

  const title = ja ? '選択済み申請' : bn ? 'নির্বাচিত আবেদন' : 'Selected Applications';

  return (
    <DashboardLayout title={title}>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}
        </div>
      ) : selected.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
          <div className="text-4xl mb-3">📂</div>
          <p className="font-medium text-slate-500 mb-1">
            {ja ? '選択済み申請はありません' : bn ? 'কোনো নির্বাচিত আবেদন নেই' : 'No selected applications yet'}
          </p>
          <p className="text-xs">
            {ja ? '申請一覧から学生を選択してください。' : bn ? 'Applications পেজ থেকে আবেদন নির্বাচন করুন।' : 'Go to Applications and select candidates you\'re interested in.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selected.map(app => (
            <div key={app.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${app.connected ? 'border-emerald-200' : 'border-slate-100'}`}>

              {/* Card header */}
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-slate-400">{app.lead_code}</span>
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

                    {/* Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs mb-2">
                      <InfoRow label={ja ? '国' : bn ? 'দেশ' : 'Country'} value={app.target_country} />
                      {app.target_city && <InfoRow label={ja ? '都市' : bn ? 'শহর' : 'City'} value={app.target_city} />}
                      {app.target_course && <InfoRow label={ja ? 'コース' : bn ? 'কোর্স' : 'Course'} value={app.target_course} />}
                      {app.target_intake && <InfoRow label={ja ? '入学' : bn ? 'ইনটেক' : 'Intake'} value={new Date(app.target_intake).toLocaleDateString(undefined, { dateStyle: 'medium' })} />}
                      {app.last_education && <InfoRow label={ja ? '学歴' : bn ? 'শিক্ষা' : 'Education'} value={app.last_education} />}
                      {app.gpa && <InfoRow label="GPA" value={app.gpa} />}
                    </div>

                    <p className="text-[10px] text-slate-400">
                      {ja ? '選択日：' : bn ? 'নির্বাচন তারিখ: ' : 'Selected: '}
                      {new Date(app.selected_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 self-center">
                    {app.connected ? (
                      <div className="text-xs text-emerald-600 font-semibold">
                        ✓ {ja ? 'Tensaiが対応します' : bn ? 'Tensai যোগাযোগ করবে' : 'Tensai will contact'}
                      </div>
                    ) : (
                      <button
                        onClick={() => { setConnectingId(app.id); setForm({ name: '', email: '', whatsapp: '', phone: '' }); setFormError(''); }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                      >
                        {ja ? 'Tensaiと接続' : bn ? 'Tensai-এর সাথে কানেক্ট' : 'Connect with Tensai'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Connected info summary */}
                {app.connected && (app.connect_name || app.connect_email) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    {app.connect_name && <InfoRow label={ja ? '担当者' : bn ? 'যোগাযোগকারী' : 'Contact'} value={app.connect_name} />}
                    {app.connect_email && <InfoRow label="Email" value={app.connect_email} />}
                    {app.connect_whatsapp && <InfoRow label="WhatsApp" value={app.connect_whatsapp} />}
                    {app.connect_phone && <InfoRow label={ja ? '電話' : bn ? 'ফোন' : 'Phone'} value={app.connect_phone} />}
                  </div>
                )}

                {/* Unselect */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    {ja
                      ? '選択解除すると、この申請はプールに戻ります。'
                      : bn
                      ? 'আনসিলেক্ট করলে এই আবেদন পুলে ফিরে যাবে।'
                      : 'Unselecting returns this application to the pool.'}
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
                      <button onClick={() => setUnselectingId(null)} className="px-3 py-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:border-slate-300">
                        {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setUnselectingId(app.id)}
                      className="shrink-0 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 rounded-lg transition-colors"
                    >
                      {ja ? '選択解除' : bn ? 'আনসিলেক্ট' : 'Unselect'}
                    </button>
                  )}
                </div>

                {/* Success message */}
                {doneId === app.id && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
                    ✓ {ja ? 'ご連絡ありがとうございます。Tensaiのマネージャーが近日中にご連絡いたします。' : bn ? 'ধন্যবাদ! Tensai-এর একজন ম্যানেজার শীঘ্রই আপনার সাথে যোগাযোগ করবেন।' : 'Thank you! A Tensai manager will contact you soon regarding next steps.'}
                  </div>
                )}
              </div>

              {/* Connect form (inline drawer) */}
              {connectingId === app.id && (
                <div className="border-t border-indigo-100 bg-indigo-50/40 p-4 sm:p-5">
                  <h4 className="font-bold text-slate-800 text-sm mb-4">
                    {ja ? 'Tensaiに連絡先を共有する' : bn ? 'Tensai-কে যোগাযোগের তথ্য দিন' : 'Share your contact with Tensai'}
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    {ja ? 'Tensaiのマネージャーが次のステップについてご連絡いたします。' : bn ? 'Tensai ম্যানেজার পরবর্তী পদক্ষেপের জন্য আপনার সাথে যোগাযোগ করবেন।' : 'A Tensai manager will reach out to you with the next steps for this candidate.'}
                  </p>

                  <form onSubmit={handleConnect} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {ja ? '担当者名 *' : bn ? 'যোগাযোগকারীর নাম *' : 'Contact Person Name *'}
                        </label>
                        <input className={inputCls} placeholder={ja ? '例: 山田 太郎' : bn ? 'যেমন: রহিম উদ্দিন' : 'e.g. John Smith'}
                          value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {ja ? 'メールアドレス *' : bn ? 'ইমেইল *' : 'Email Address *'}
                        </label>
                        <input type="email" className={inputCls} placeholder="contact@yourschool.com"
                          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">WhatsApp</label>
                        <input type="tel" className={inputCls} placeholder="+81 90-0000-0000"
                          value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                          {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                        </label>
                        <input type="tel" className={inputCls} placeholder="+81 3-0000-0000"
                          value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                    </div>

                    {formError && (
                      <p className="text-xs text-red-600 font-medium">⚠️ {formError}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={connect.isPending}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                        {connect.isPending
                          ? (ja ? '送信中...' : bn ? 'পাঠানো হচ্ছে...' : 'Sending...')
                          : (ja ? '送信する' : bn ? 'পাঠান' : 'Send to Tensai')}
                      </button>
                      <button type="button" onClick={() => { setConnectingId(null); setFormError(''); }}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                        {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
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
