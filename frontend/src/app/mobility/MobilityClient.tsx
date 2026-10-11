'use client';
import { useLang } from '@/context/LanguageContext';
import FooterSocialLinks from '@/components/shared/FooterSocialLinks';
import SiteHeader from '@/components/shared/SiteHeader';
import { PUBLIC_API } from '@/lib/publicApi';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Lang = 'en' | 'bn' | 'ja';

// One answer per step. `opt` is the index of a tapped option so the transcript
// follows the language toggle; `text` is something the visitor typed.
type Answer = { opt?: number; text?: string };

interface Step { q: string; o: string[] }
interface Copy {
  hi: string; sub: string; ph: string; send: string; newChat: string;
  roles: string[]; steps: Step[]; labels: string[];
  err: string; dis: string; title: string; note: string;
  branch: string; again: string; disclaimer: string;
  contactTitle: string; nameLabel: string; phoneLabel: string; phonePh: string;
  consent: string; privacy: string; save: string; saving: string;
  eName: string; ePhone: string; eConsent: string; eFail: string; eLimit: string;
  savedTitle: string; savedNote: string; refLabel: string;
}

// The questions are scripted; the answers are saved on the server at the end
// (POST /mobility/chat) once the visitor gives a name, a phone number and ticks
// the consent box. No AI is called yet.
const COPY: Record<Lang, Copy> = {
  en: {
    hi: "Hi, I'm the Tensai assistant",
    sub: "Tell me about your work and I'll help build your profile.",
    ph: 'Type here, or tap an option',
    send: 'Send', newChat: 'New chat',
    roles: ["I'm a driver", "I'm a caregiver", "I'm a technician"],
    steps: [
      { q: 'Thanks. How many years of experience do you have?', o: ['Under 2 years', '2 to 5 years', 'More than 5 years'] },
      { q: 'Which licence or certificate do you hold?', o: ['Heavy vehicle licence', 'Light vehicle licence', 'Caregiver certificate', 'None yet'] },
      { q: 'Which languages can you speak?', o: ['Bangla only', 'Bangla and English', 'Bangla and Japanese'] },
      { q: 'Which country interests you most?', o: ['Japan', 'Gulf countries', 'Europe', 'Not sure yet'] },
    ],
    labels: ['Work', 'Experience', 'Licence', 'Languages', 'Country'],
    err: 'Type a message or tap an option first',
    dis: 'Our staff check every profile. We never guarantee jobs or visas.',
    title: 'Your draft profile',
    note: 'Next step: visit our Dhaka or Pabna office. Our staff will check your documents and record your skill video.',
    branch: 'Find the nearest branch', again: 'Start over',
    disclaimer: 'Tensai is a consultancy and technology platform. We do not guarantee jobs or visas. Employment and visa processing are handled by licensed partner agencies.',
    contactTitle: 'Almost done. How can our team reach you?',
    nameLabel: 'Your name', phoneLabel: 'Phone number', phonePh: '01XXXXXXXXX',
    consent: 'I agree that Tensai may save my answers and contact me on this number.',
    privacy: 'Privacy policy', save: 'Save my profile', saving: 'Saving…',
    eName: 'Enter your name', ePhone: 'Enter a valid phone number', eConsent: 'Please tick the box to continue',
    eFail: "Couldn't save your profile. Check your connection and try again.",
    eLimit: 'Too many attempts. Please wait a minute and try again.',
    savedTitle: 'Saved. Thank you.', savedNote: 'Our team will contact you on this number.', refLabel: 'Your reference code',
  },
  bn: {
    hi: 'হ্যালো, আমি টেনসাই সহকারী',
    sub: 'আপনার কাজ সম্পর্কে বলুন, আমি আপনার প্রোফাইল তৈরিতে সাহায্য করব।',
    ph: 'এখানে লিখুন বা অপশন চাপুন',
    send: 'পাঠান', newChat: 'নতুন চ্যাট',
    roles: ['আমি ড্রাইভার', 'আমি কেয়ারগিভার', 'আমি টেকনিশিয়ান'],
    steps: [
      { q: 'ধন্যবাদ। আপনার কত বছরের অভিজ্ঞতা আছে?', o: ['২ বছরের কম', '২ থেকে ৫ বছর', '৫ বছরের বেশি'] },
      { q: 'আপনার কোন লাইসেন্স বা সার্টিফিকেট আছে?', o: ['ভারী যানবাহনের লাইসেন্স', 'হালকা যানবাহনের লাইসেন্স', 'কেয়ারগিভার সার্টিফিকেট', 'এখনো নেই'] },
      { q: 'আপনি কোন কোন ভাষা বলতে পারেন?', o: ['শুধু বাংলা', 'বাংলা ও ইংরেজি', 'বাংলা ও জাপানি'] },
      { q: 'কোন দেশে কাজ করতে বেশি আগ্রহী?', o: ['জাপান', 'মধ্যপ্রাচ্য', 'ইউরোপ', 'এখনো ঠিক করিনি'] },
    ],
    labels: ['পেশা', 'অভিজ্ঞতা', 'লাইসেন্স', 'ভাষা', 'দেশ'],
    err: 'আগে কিছু লিখুন বা একটি অপশন চাপুন',
    dis: 'আমাদের স্টাফ প্রতিটি প্রোফাইল যাচাই করেন। আমরা চাকরি বা ভিসার নিশ্চয়তা দিই না।',
    title: 'আপনার খসড়া প্রোফাইল',
    note: 'পরের ধাপ: ঢাকা বা পাবনা অফিসে আসুন। আমাদের স্টাফ আপনার কাগজপত্র যাচাই করে স্কিল ভিডিও তুলবেন।',
    branch: 'নিকটতম শাখা দেখুন', again: 'আবার শুরু করুন',
    disclaimer: 'টেনসাই একটি পরামর্শ ও প্রযুক্তি প্ল্যাটফর্ম। আমরা চাকরি বা ভিসার নিশ্চয়তা দিই না। চাকরি ও ভিসা প্রক্রিয়া লাইসেন্সপ্রাপ্ত পার্টনার এজেন্সি সম্পন্ন করে।',
    contactTitle: 'প্রায় শেষ। আমাদের টিম আপনার সাথে কীভাবে যোগাযোগ করবে?',
    nameLabel: 'আপনার নাম', phoneLabel: 'ফোন নম্বর', phonePh: '01XXXXXXXXX',
    consent: 'আমি সম্মতি দিচ্ছি যে টেনসাই আমার উত্তর সংরক্ষণ করতে এবং এই নম্বরে আমার সাথে যোগাযোগ করতে পারে।',
    privacy: 'প্রাইভেসি পলিসি', save: 'আমার প্রোফাইল সংরক্ষণ করুন', saving: 'সংরক্ষণ হচ্ছে…',
    eName: 'আপনার নাম লিখুন', ePhone: 'সঠিক ফোন নম্বর দিন', eConsent: 'এগিয়ে যেতে বক্সে টিক দিন',
    eFail: 'প্রোফাইল সংরক্ষণ করা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।',
    eLimit: 'অনেকবার চেষ্টা হয়েছে। এক মিনিট পরে আবার চেষ্টা করুন।',
    savedTitle: 'সংরক্ষণ হয়েছে। ধন্যবাদ।', savedNote: 'আমাদের টিম এই নম্বরে আপনার সাথে যোগাযোগ করবে।', refLabel: 'আপনার রেফারেন্স কোড',
  },
  ja: {
    hi: 'こんにちは、Tensaiアシスタントです',
    sub: 'お仕事について教えてください。プロフィール作成をお手伝いします。',
    ph: 'ここに入力、または選択肢をタップ',
    send: '送信', newChat: '新しいチャット',
    roles: ['ドライバーです', '介護職です', '技術者です'],
    steps: [
      { q: 'ありがとうございます。経験年数を教えてください。', o: ['2年未満', '2〜5年', '5年以上'] },
      { q: 'お持ちの免許・資格は何ですか？', o: ['大型車両免許', '普通車両免許', '介護資格', 'まだありません'] },
      { q: '話せる言語は何ですか？', o: ['ベンガル語のみ', 'ベンガル語と英語', 'ベンガル語と日本語'] },
      { q: '最も関心のある国はどこですか？', o: ['日本', '湾岸諸国', 'ヨーロッパ', 'まだ決めていません'] },
    ],
    labels: ['職種', '経験', '免許・資格', '言語', '国'],
    err: 'メッセージを入力するか、選択肢をタップしてください',
    dis: 'スタッフがすべてのプロフィールを確認します。就職やビザの保証はいたしません。',
    title: 'プロフィールの下書き',
    note: '次のステップ：ダッカまたはパブナのオフィスにお越しください。スタッフが書類を確認し、スキル動画を撮影します。',
    branch: '最寄りの支局を見る', again: '最初からやり直す',
    disclaimer: '天才はコンサルティングおよびテクノロジープラットフォームです。就職やビザは保証しません。就労・ビザ手続きは認可を受けたパートナー機関が行います。',
    contactTitle: 'もう少しです。ご連絡先を教えてください。',
    nameLabel: 'お名前', phoneLabel: '電話番号', phonePh: '01XXXXXXXXX',
    consent: '回答を保存し、この番号に連絡することに同意します。',
    privacy: 'プライバシーポリシー', save: 'プロフィールを保存', saving: '保存中…',
    eName: 'お名前を入力してください', ePhone: '有効な電話番号を入力してください', eConsent: '続けるにはチェックを入れてください',
    eFail: '保存できませんでした。接続を確認してもう一度お試しください。',
    eLimit: '試行回数が多すぎます。1分後にもう一度お試しください。',
    savedTitle: '保存しました。ありがとうございます。', savedNote: 'チームがこの番号にご連絡します。', refLabel: '参照コード',
  },
};

type SaveState = 'idle' | 'sending' | 'sent';
type FormError = 'name' | 'phone' | 'consent' | 'fail' | 'limit' | null;

export default function MobilityClient() {
  const { t, lang } = useLang();
  const l = t.landing;
  const a = t.about;
  const c = COPY[lang as Lang] ?? COPY.en;
  const tr = (en: string, ja: string, bn: string) => (lang === 'ja' ? ja : lang === 'bn' ? bn : en);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState(''); // honeypot, real visitors never see it
  const [save, setSave] = useState<SaveState>('idle');
  const [formError, setFormError] = useState<FormError>(null);
  const [reference, setReference] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);

  const total = 1 + c.steps.length; // role + each scripted question
  const done = answers.length >= total;
  const started = answers.length > 0;
  const pending = started && !done ? c.steps[answers.length - 1] : null;

  const show = (i: number, ans: Answer) => {
    if (ans.text !== undefined) return ans.text;
    const list = i === 0 ? c.roles : c.steps[i - 1]?.o;
    return list?.[ans.opt ?? 0] ?? '';
  };

  useEffect(() => {
    if (started) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [answers.length, started, save]);

  const push = (ans: Answer) => {
    setError(false);
    setAnswers((prev) => (prev.length >= total ? prev : [...prev, ans]));
  };
  const reset = () => {
    setAnswers([]); setDraft(''); setError(false);
    setName(''); setPhone(''); setConsent(false); setTrap('');
    setSave('idle'); setFormError(null); setReference(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = draft.trim();
    if (!v) { setError(true); return; }
    setDraft('');
    push({ text: v });
  };

  const errText: Record<Exclude<FormError, null>, string> = {
    name: c.eName, phone: c.ePhone, consent: c.eConsent, fail: c.eFail, limit: c.eLimit,
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (save !== 'idle') return;

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[\s\-().]+/g, '');
    if (cleanName.length < 2) { setFormError('name'); return; }
    if (!/^\+?[0-9]{8,15}$/.test(cleanPhone)) { setFormError('phone'); return; }
    if (!consent) { setFormError('consent'); return; }

    setFormError(null);
    setSave('sending');
    try {
      const res = await fetch(`${PUBLIC_API}/mobility/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          lang,
          full_name: cleanName,
          phone: cleanPhone,
          consent: true,
          website: trap,
          role: show(0, answers[0]),
          experience: show(1, answers[1]),
          licence: show(2, answers[2]),
          languages: show(3, answers[3]),
          target_country: show(4, answers[4]),
          answers: answers.map((ans, i) => ({
            question: c.labels[i] ?? '',
            answer: show(i, ans),
          })),
        }),
      });
      if (res.status === 429) { setFormError('limit'); setSave('idle'); return; }
      if (res.status === 422) { setFormError('phone'); setSave('idle'); return; }
      if (!res.ok) throw new Error(`mobility/chat ${res.status}`);
      const body = (await res.json()) as { reference?: string | null };
      setReference(body.reference ?? null);
      setSave('sent');
    } catch {
      setFormError('fail');
      setSave('idle');
    }
  };

  const chip =
    'text-sm px-4 py-2 rounded-full border border-white/20 text-white/85 hover:border-green-400 hover:bg-green-400/10 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400';
  const field =
    'w-full bg-[#0d1117] border border-white/[0.18] focus:border-green-400/60 rounded-xl px-4 h-11 text-[15px] text-white placeholder:text-white/30 outline-none transition-colors';

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117]">
      <SiteHeader active="mobility" />

      <main className="flex-1 flex flex-col pt-16">
        <div className="flex-1 w-full max-w-2xl mx-auto px-4 flex flex-col">
          {/* Conversation / greeting */}
          <div className="flex-1 flex flex-col justify-center py-8">
            {!started ? (
              <div className="text-center animate-fade-up">
                <div className="w-12 h-12 rounded-full bg-green-500/15 text-green-400 inline-flex items-center justify-center mb-5" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/><path d="M19 15l.8 1.9 1.9.8-1.9.8L19 20.4l-.8-1.9-1.9-.8 1.9-.8L19 15z"/></svg>
                </div>
                <h1 className="text-fluid-3xl font-bold text-white mb-2">{c.hi}</h1>
                <p className="text-fluid-lg text-white/55 max-w-md mx-auto mb-7">{c.sub}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {c.roles.map((r, i) => (
                    <button key={r} type="button" onClick={() => push({ opt: i })} className={chip}>{r}</button>
                  ))}
                </div>
              </div>
            ) : (
              <div role="log" aria-live="polite" aria-label={tr('Conversation', '会話', 'কথোপকথন')} className="w-full space-y-3">
                {answers.map((ans, i) => (
                  <div key={i} className="space-y-3">
                    {i > 0 && (
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.06] text-white/90 px-4 py-2.5 text-[15px] leading-relaxed">
                        {c.steps[i - 1].q}
                      </div>
                    )}
                    <div className="max-w-[85%] ml-auto rounded-2xl rounded-tr-sm bg-green-600 text-white px-4 py-2.5 text-[15px] leading-relaxed">
                      {show(i, ans)}
                    </div>
                  </div>
                ))}
                {pending && (
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.06] text-white/90 px-4 py-2.5 text-[15px] leading-relaxed">
                    {pending.q}
                  </div>
                )}

                {done && (
                  <div className="rounded-2xl border border-green-500/30 bg-white/[0.04] p-5">
                    <h2 className="text-base font-bold text-white mb-3">{c.title}</h2>
                    <dl className="divide-y divide-white/[0.06] text-sm">
                      {c.labels.map((label, i) => (
                        <div key={label} className="flex justify-between gap-4 py-1.5">
                          <dt className="text-white/45">{label}</dt>
                          <dd className="text-white text-right">{show(i, answers[i])}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {done && save !== 'sent' && (
                  <form onSubmit={saveProfile} noValidate className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 space-y-3">
                    <h2 className="text-base font-bold text-white">{c.contactTitle}</h2>
                    <div>
                      <label htmlFor="mob-name" className="block text-xs text-white/50 mb-1">{c.nameLabel}</label>
                      <input id="mob-name" value={name} onChange={(e) => { setName(e.target.value); setFormError(null); }}
                        autoComplete="name" maxLength={120} className={field} />
                    </div>
                    <div>
                      <label htmlFor="mob-phone" className="block text-xs text-white/50 mb-1">{c.phoneLabel}</label>
                      <input id="mob-phone" value={phone} onChange={(e) => { setPhone(e.target.value); setFormError(null); }}
                        type="tel" inputMode="tel" autoComplete="tel" placeholder={c.phonePh} maxLength={24} className={field} />
                    </div>
                    {/* Honeypot: off-screen, skipped by keyboard and screen readers */}
                    <input value={trap} onChange={(e) => setTrap(e.target.value)} name="website" tabIndex={-1}
                      autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" />
                    <label className="flex items-start gap-3 text-sm text-white/70 leading-relaxed cursor-pointer">
                      <input type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); setFormError(null); }}
                        className="mt-1 w-4 h-4 accent-green-500 shrink-0" />
                      <span>
                        {c.consent}{' '}
                        <Link href="/privacy" className="text-green-400 hover:underline whitespace-nowrap">{c.privacy}</Link>
                      </span>
                    </label>
                    <div role="alert" className="min-h-[18px] text-xs text-red-400">{formError ? errText[formError] : ''}</div>
                    <button type="submit" disabled={save === 'sending'}
                      className="w-full sm:w-auto text-sm px-6 py-3 rounded-full bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300">
                      {save === 'sending' ? c.saving : c.save}
                    </button>
                  </form>
                )}

                {done && save === 'sent' && (
                  <div className="rounded-2xl border border-green-500/40 bg-green-500/[0.07] p-5">
                    <h2 className="text-base font-bold text-white mb-1">{c.savedTitle}</h2>
                    {reference && (
                      <p className="text-sm text-white/60 mb-3">
                        {c.refLabel}: <span className="font-mono text-green-300 tracking-wider">{reference}</span>
                      </p>
                    )}
                    <p className="text-sm text-white/75 leading-relaxed">{c.savedNote}</p>
                    <p className="text-sm text-white/75 leading-relaxed mt-2">{c.note}</p>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="sticky bottom-0 bg-[#0d1117] pb-4 pt-2">
            {pending && (
              <div className="flex flex-wrap gap-2 mb-3">
                {pending.o.map((opt, i) => (
                  <button key={opt} type="button" onClick={() => push({ opt: i })} className={chip}>{opt}</button>
                ))}
              </div>
            )}
            {done ? (
              <div className="flex flex-wrap gap-2">
                {save === 'sent' && (
                  <Link href="/branches" className="text-sm px-5 py-2.5 rounded-full bg-green-600 hover:bg-green-500 text-white font-semibold transition-all">{c.branch}</Link>
                )}
                <button type="button" onClick={reset} className={chip}>{c.again}</button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex items-center gap-2 bg-[#161b22] border border-white/[0.18] focus-within:border-green-400/60 rounded-full pl-5 pr-1.5 py-1.5 transition-colors">
                <input
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); setError(false); }}
                  placeholder={c.ph}
                  aria-label={c.ph}
                  autoComplete="off"
                  className="flex-1 bg-transparent outline-none text-[15px] text-white placeholder:text-white/35 h-10 min-w-0"
                />
                <button
                  type="submit"
                  aria-label={c.send}
                  className="w-10 h-10 shrink-0 rounded-full bg-green-600 hover:bg-green-500 text-white inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-300"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </button>
              </form>
            )}
            <div className="min-h-[20px] px-5 pt-1.5 text-xs text-red-400" role="alert">{error ? c.err : ''}</div>
            <p className="text-[11px] text-white/40 text-center leading-relaxed">{c.dis}</p>
            {started && !done && (
              <div className="text-center mt-1">
                <button type="button" onClick={reset} className="text-xs text-white/40 hover:text-white/70 transition-colors">{c.newChat}</button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-8 px-4 bg-alt-section">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] text-white/45 text-center leading-relaxed mb-5 max-w-2xl mx-auto">{c.disclaimer}</p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/tensai-logo.png" alt="Tensai" width={28} height={28} className="rounded-full object-contain" />
              <span className="text-sm font-bold text-white/75">Tensai</span>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-white/50">
              <Link href="/about" className="hover:text-white/75 transition-colors">{a.navAbout}</Link>
              <Link href="/team" className="hover:text-white/75 transition-colors">{a.navTeam}</Link>
              <Link href="/gallery" className="hover:text-white/75 transition-colors">{a.navGallery}</Link>
              <Link href="/terms" className="hover:text-white/75 transition-colors">{tr('Terms', '利用規約', 'শর্তাবলী')}</Link>
              <Link href="/privacy" className="hover:text-white/75 transition-colors">{tr('Privacy', 'プライバシー', 'প্রাইভেসি')}</Link>
            </div>
            <div className="flex flex-col items-center sm:items-end gap-2">
              <FooterSocialLinks />
              <p className="text-xs text-white/30">{l.footer}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
