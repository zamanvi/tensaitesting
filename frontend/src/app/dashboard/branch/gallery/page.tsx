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

const inp = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

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

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {isLoading ? '…' : `${items.length} image${items.length !== 1 ? 's' : ''}`}
        </p>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Image
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium mb-1">No gallery images yet</p>
          <p className="text-slate-400 text-sm mb-4">Upload your first photo to get started</p>
          <button onClick={openAdd}
            className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-lg transition-colors">
            Upload First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="group relative bg-white border border-slate-100 rounded-xl overflow-hidden">
              {/* Image */}
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                {item.display_image_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={item.display_image_url} alt={item.title ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  : <div className="w-full h-full flex items-center justify-center text-slate-200 text-4xl">🖼️</div>}
                {!item.is_active && (
                  <span className="absolute top-2 left-2 text-[10px] font-bold bg-slate-700/80 text-white px-2 py-0.5 rounded-full">Hidden</span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-end p-2 opacity-0 group-hover:opacity-100">
                  <div className="flex gap-1 w-full">
                    <button onClick={() => openEdit(item)}
                      className="flex-1 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold rounded-md transition-colors">
                      Edit
                    </button>
                    <button onClick={() => { if (confirm('Delete this image?')) del.mutate(item.id); }}
                      className="py-1.5 px-2.5 bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold rounded-md transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
              {/* Info */}
              {(item.title ?? item.caption) && (
                <div className="px-3 py-2 border-t border-slate-50">
                  <p className="text-xs font-semibold text-slate-700 truncate">{item.title ?? item.caption}</p>
                  {item.description && <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {modal === 'add' ? 'Add Image' : 'Edit Image'}
              </h3>
              <button onClick={closeModal} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {err && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">⚠️ {err}</div>
              )}

              {/* Image upload area */}
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-green-400 hover:bg-green-50/50 transition-all cursor-pointer flex items-center justify-center overflow-hidden"
              >
                {preview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                  : (
                    <div className="text-center p-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs font-medium text-slate-500">Click to upload image</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP — max 8MB</p>
                    </div>
                  )}
                {preview && (
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full">Click to change</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

              {!file && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Or paste image URL</label>
                  <input className={inp} type="url" placeholder="https://…" value={imageUrl}
                    onChange={e => { setImageUrl(e.target.value); if (e.target.value) setPreview(e.target.value); }} />
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input className={inp} placeholder="e.g. Our Dhaka Office" value={title}
                  onChange={e => setTitle(e.target.value)} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description <span className="text-slate-300">(optional)</span></label>
                <textarea className={`${inp} resize-none`} rows={2}
                  placeholder="Short description of this image…"
                  value={desc} onChange={e => setDesc(e.target.value)} />
              </div>

              {/* Sort + Active */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Sort Order <span className="text-slate-300">(lower = first)</span></label>
                  <input className={inp} type="number" min="0" value={sortOrder}
                    onChange={e => setSortOrder(Number(e.target.value))} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-green-600" />
                  <span className="text-sm text-slate-700">Visible</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={save.isPending}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                  {save.isPending ? 'Saving…' : modal === 'add' ? 'Upload & Save' : 'Save Changes'}
                </button>
                <button type="button" onClick={closeModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">
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
