'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface StudentCard {
  id: number;
  student_id: number;
  student_name: string;
  full_name_japanese: string | null;
  gender: string | null;
  nationality: string | null;
  highest_qualification: string | null;
  gpa: number | null;
  passing_year: number | null;
  jlpt_level: string | null;
  nat_level: string | null;
  ielts_score: number | null;
  eligibility_score: number;
}

const JLPT_OPTIONS = ['N1', 'N2', 'N3', 'N4', 'N5'];
const NAT_OPTIONS = ['1', '2', '3', '4', '5'];

export default function BrowseStudents() {
  const { t } = useLang();
  const ib = t.institutionBrowse;

  const [filters, setFilters] = useState({ jlpt_level: '', nat_level: '', min_gpa: '', gender: '', qualification: '' });
  const [applied, setApplied] = useState(filters);
  const [shortlisting, setShortlisting] = useState<number | null>(null);
  const [shortlistMsg, setShortlistMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['browse-students', applied],
    queryFn: () => {
      const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v));
      return api.get('/institution/students', { params }).then((r) => r.data);
    },
    staleTime: 60_000,
  });

  const shortlist = useMutation({
    mutationFn: (studentId: number) => api.post(`/institution/shortlist/${studentId}`),
    onSuccess: (_, studentId) => {
      setShortlisting(null);
      setShortlistMsg(ib.shortlistedMsg(studentId));
      setTimeout(() => setShortlistMsg(''), 4000);
    },
  });

  const students: StudentCard[] = Array.isArray(data?.data) ? data.data : [];

  return (
    <DashboardLayout title={ib.title}>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        {ib.privacyBanner}
      </div>

      {shortlistMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">{shortlistMsg}</div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 mb-5 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <select
            value={filters.jlpt_level}
            onChange={(e) => setFilters({ ...filters, jlpt_level: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">{ib.jlptAny}</option>
            {JLPT_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select
            value={filters.nat_level}
            onChange={(e) => setFilters({ ...filters, nat_level: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">{ib.natAny}</option>
            {NAT_OPTIONS.map((l) => <option key={l} value={l}>NAT {l}</option>)}
          </select>
          <select
            value={filters.gender}
            onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">{ib.genderAny}</option>
            <option value="male">{ib.male}</option>
            <option value="female">{ib.female}</option>
            <option value="other">{ib.other}</option>
          </select>
          <input
            type="number" min="0" max="5" step="0.1" placeholder={ib.minGpa}
            value={filters.min_gpa}
            onChange={(e) => setFilters({ ...filters, min_gpa: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <input
            type="text" placeholder={ib.qualKeyword}
            value={filters.qualification}
            onChange={(e) => setFilters({ ...filters, qualification: e.target.value })}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={() => setApplied({ ...filters })}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors w-full"
          >
            {t.common.search}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400">
          <div className="text-4xl mb-3">🎓</div>
          <div className="font-medium">{ib.noStudents}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {students.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{s.student_name}</div>
                  {s.full_name_japanese && <div className="text-xs text-slate-400">{s.full_name_japanese}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-indigo-700">{s.eligibility_score}</div>
                  <div className="text-xs text-slate-400">{t.common.score}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {s.jlpt_level && <Chip label={`JLPT ${s.jlpt_level}`} color="indigo" />}
                {s.nat_level && <Chip label={`NAT ${s.nat_level}`} color="amber" />}
                {s.ielts_score && <Chip label={`IELTS ${s.ielts_score}`} color="emerald" />}
                {s.gpa && <Chip label={`GPA ${s.gpa}`} color="slate" />}
                {s.highest_qualification && <Chip label={s.highest_qualification} color="slate" />}
              </div>
              <button
                onClick={() => { setShortlisting(s.student_id); shortlist.mutate(s.student_id); }}
                disabled={shortlist.isPending && shortlisting === s.student_id}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {shortlist.isPending && shortlisting === s.student_id ? ib.shortlisting : ib.shortlistBtn}
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-600',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{label}</span>;
}
