'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface GalleryItem {
  id: number;
  title: string | null;
  description: string | null;
  caption: string | null;
  display_image_url: string;
  is_active: boolean;
  sort_order: number;
}

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

export default function BranchGalleryPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive]   = useState(true);
  const [file, setFile]   = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview]   = useState('');
  const [err, setErr] = useState('');
  const [actionErr, setActionErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['branch-gallery'],
    queryFn: () => api.get('/branch-admin/gallery').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const save = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (title)    fd.append('title', title);
      if (desc)     fd.append('description', desc);
      fd.append('sort_order', String(sortOrder));
      fd.append('is_active', isActive ? '1' : '0');
      if (file)          fd.append('image', file);
      else if (imageUrl) fd.append('image_url', imageUrl);
      const url = editing ? `/branch-admin/gallery/${editing.id}` : '/branch-admin/gallery';
      return api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branch-gallery'] }); closeModal(); },
    onError: (e: unknown) => {
      const ax = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      setErr(errs ? Object.values(errs).flat().join(' ') : ax.response?.data?.message ?? 'Failed to save.');
    },
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/branch-admin/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branch-gallery'] }),
    onError: () => setActionErr('Failed to delete.'),
  });

  function openAdd() {
    setEditing(null); setTitle(''); setDesc(''); setSortOrder(items.length); setIsActive(true);
    setFile(null); setImageUrl(''); setPreview(''); setErr(''); setModal('add');
  }
  function openEdit(item: GalleryItem) {
    setEditing(item);
    setTitle(item.title ?? item.caption ?? '');
    setDesc(item.description ?? '');
    setSortOrder(item.sort_order);
    setIsActive(item.is_active);
    setFile(null); setImageUrl(''); setPreview(item.display_image_url); setErr(''); setModal('edit');
  }
  function closeModal() { setModal(null); setEditing(null); setFile(null); setPreview(''); setErr(''); }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setPreview(URL.createObjectURL(f)); setImageUrl('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!file && !imageUrl && !editing) { setErr('Upload an image or paste a URL.'); return; }
    save.mutate();
  }

  if (!user || !isBranchAdmin) return null;

  return (
    <BranchLayout title="Gallery">

      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-1.5">Branch Portal</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Gallery</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {isLoading ? '…' : `${items.length} image${items.length !== 1 ? 's' : ''}`} in your branch gallery
          </p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Image
        </button>
      </div>

      {actionErr && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">⚠ {actionErr}</div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-slate-50 border border-slate-100 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No gallery images yet</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs leading-relaxed">Upload photos of your branch office, team, and facilities to build trust with prospective students.</p>
          <button onClick={openAdd}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            Upload First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:border-slate-200 transition-all duration-200">
              {/* Image */}
              <div className="aspect-square bg-slate-50 relative overflow-hidden group">
                {item.display_image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.display_image_url} alt={item.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center"><svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                {!item.is_active && (
                  <span className="absolute top-3 left-3 text-xs font-semibold bg-slate-800/90 text-white px-2.5 py-1 rounded-full">Hidden</span>
                )}
              </div>
              {/* Info + always-visible actions */}
              <div className="p-4">
                {(item.title ?? item.caption) && (
                  <p className="text-xs font-semibold text-slate-900 truncate mb-0.5">{item.title ?? item.caption}</p>
                )}
                {item.description && <p className="text-xs text-slate-500 truncate">{item.description}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => openEdit(item)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-green-50 hover:text-green-700 text-slate-600 text-xs font-semibold rounded-lg transition-colors">
                    Edit
                  </button>
                  <button onClick={() => { if (confirm('Delete this image?')) del.mutate(item.id); }}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:px-4">
          <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[95vh] overflow-y-auto shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {modal === 'add' ? 'Add Image' : 'Edit Image'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the details below and upload a photo</p>
              </div>
              <button onClick={closeModal}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
              {err && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">⚠️ {err}</div>
              )}

              {/* Upload zone — full width, taller */}
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-green-400 hover:bg-green-50/40 transition-all cursor-pointer flex items-center justify-center overflow-hidden"
                style={{ minHeight: '220px' }}
              >
                {preview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={preview} alt="preview" className="w-full h-full object-cover absolute inset-0" style={{ minHeight: '220px' }} />
                  : (
                    <div className="text-center py-10 px-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mb-1">Click to upload image</p>
                      <p className="text-xs text-slate-400">JPG, PNG, WebP — max 8MB</p>
                    </div>
                  )}
                {preview && (
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center">
                    <p className="text-white text-sm font-semibold opacity-0 hover:opacity-100 bg-black/50 px-4 py-2 rounded-full transition-opacity">Click to change</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

              {!file && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Or paste image URL</label>
                  <input className={inp} type="url" placeholder="https://…" value={imageUrl}
                    onChange={e => { setImageUrl(e.target.value); if (e.target.value) setPreview(e.target.value); }} />
                </div>
              )}

              {/* Title + Description side by side on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Title</label>
                  <input className={inp} placeholder="e.g. Our Dhaka Office" value={title}
                    onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Description <span className="font-normal text-slate-400">optional</span>
                  </label>
                  <input className={inp} placeholder="Short description…" value={desc}
                    onChange={e => setDesc(e.target.value)} />
                </div>
              </div>

              {/* Sort order + Visible */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Sort Order <span className="font-normal text-slate-400">lower = first</span>
                  </label>
                  <input className={inp} type="number" min="0" value={sortOrder}
                    onChange={e => setSortOrder(Number(e.target.value))} />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer pb-2">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-green-600" />
                  <span className="text-sm font-medium text-slate-700">Visible to public</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={save.isPending}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
                  {save.isPending ? 'Saving…' : modal === 'add' ? 'Upload & Save' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </BranchLayout>
  );
}
