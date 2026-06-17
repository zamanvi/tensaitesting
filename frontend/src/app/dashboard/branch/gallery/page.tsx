'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface GalleryItem {
  id: number;
  caption: string | null;
  display_image_url: string;
  is_active: boolean;
  sort_order: number;
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function BranchGalleryPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [caption, setCaption] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['branch-gallery'],
    queryFn: () => api.get('/branch-admin/gallery').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (caption)    fd.append('caption', caption);
      fd.append('sort_order', String(sortOrder));
      fd.append('is_active', isActive ? '1' : '0');
      if (file)          fd.append('image', file);
      else if (imageUrl) fd.append('image_url', imageUrl);
      const url = editing ? `/branch-admin/gallery/${editing.id}` : '/branch-admin/gallery';
      return api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-gallery'] }); closeModal(); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setErr(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? 'Failed.');
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/branch-admin/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branch-gallery'] }),
  });

  function openAdd() {
    setEditing(null); setCaption(''); setSortOrder(0); setIsActive(true);
    setFile(null); setImageUrl(''); setPreview(''); setErr(''); setModal('add');
  }
  function openEdit(item: GalleryItem) {
    setEditing(item); setCaption(item.caption ?? ''); setSortOrder(item.sort_order);
    setIsActive(item.is_active); setFile(null); setImageUrl(''); setPreview(item.display_image_url);
    setErr(''); setModal('edit');
  }
  function closeModal() { setModal(null); setEditing(null); setFile(null); setPreview(''); setErr(''); }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setImageUrl('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!file && !imageUrl && !editing) { setErr(ja ? '画像をアップロードするかURLを入力してください。' : bn ? 'ছবি আপলোড করুন বা URL দিন।' : 'Upload an image or paste a URL.'); return; }
    save.mutate();
  }

  if (!user || !isBranchAdmin) return null;

  const title = ja ? 'ギャラリー' : bn ? 'গ্যালারি' : 'Gallery';

  return (
    <BranchLayout title={title}>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-slate-500">{items.length} {ja ? '件' : bn ? 'টি ছবি' : `image${items.length !== 1 ? 's' : ''}`}</p>
        <button onClick={openAdd} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors">
          {ja ? '+ 画像を追加' : bn ? '+ ছবি যোগ করুন' : '+ Add Image'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="text-slate-400 text-sm">{ja ? 'ギャラリーにまだ画像がありません。' : bn ? 'এখনো কোনো ছবি নেই।' : 'No gallery images yet.'}</p>
          <button onClick={openAdd} className="mt-4 px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800">
            {ja ? '最初の画像をアップロード' : bn ? 'প্রথম ছবি আপলোড করুন' : 'Upload First Image'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm">
              <div className="aspect-square bg-slate-50">
                {item.display_image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.display_image_url} alt={item.caption ?? ''} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🖼️</div>}
              </div>
              {!item.is_active && (
                <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-600 text-white px-1.5 py-0.5 rounded-full">Hidden</span>
              )}
              <div className="p-2.5">
                {item.caption && <p className="text-xs text-slate-600 truncate mb-1.5">{item.caption}</p>}
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                    {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
                  </button>
                  <button onClick={() => { if (confirm('Delete this image?')) del.mutate(item.id); }}
                    className="text-[10px] font-semibold py-1 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">
                  {modal === 'add' ? (ja ? '画像を追加' : bn ? 'ছবি যোগ করুন' : 'Add Image') : (ja ? '画像を編集' : bn ? 'ছবি সম্পাদনা' : 'Edit Image')}
                </h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              {err && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {err}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer flex items-center justify-center overflow-hidden"
                >
                  {preview
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    : <div className="text-center"><div className="text-3xl mb-2">📷</div><p className="text-xs text-slate-400">{ja ? 'クリックして画像をアップロード' : bn ? 'ক্লিক করে ছবি আপলোড করুন' : 'Click to upload image'}</p></div>}
                  {preview && <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"><p className="text-white text-xs font-semibold">{ja ? 'クリックして変更' : bn ? 'পরিবর্তন করুন' : 'Click to change'}</p></div>}
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
                {!file && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? 'または画像URLを貼り付け' : bn ? 'অথবা URL দিন' : 'Or paste image URL'}</label>
                    <input className={inputCls} type="url" placeholder="https://..." value={imageUrl}
                      onChange={e => { setImageUrl(e.target.value); if (e.target.value) setPreview(e.target.value); }} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? 'キャプション' : bn ? 'ক্যাপশন' : 'Caption'}</label>
                  <input className={inputCls} placeholder={ja ? '説明文（任意）' : bn ? 'বর্ণনা (ঐচ্ছিক)' : 'Optional caption...'} value={caption} onChange={e => setCaption(e.target.value)} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '表示順' : bn ? 'ক্রম' : 'Sort Order'} <span className="font-normal text-slate-400">(lower = first)</span></label>
                    <input className={inputCls} type="number" min="0" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-green-600" />
                    <span className="text-sm text-slate-700">{ja ? '表示する' : bn ? 'সক্রিয়' : 'Active'}</span>
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={save.isPending} className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                    {save.isPending ? '…' : (modal === 'add' ? (ja ? 'アップロード' : bn ? 'আপলোড করুন' : 'Upload & Save') : (ja ? '保存する' : bn ? 'সংরক্ষণ করুন' : 'Save Changes'))}
                  </button>
                  <button type="button" onClick={closeModal} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                    {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </BranchLayout>
  );
}
