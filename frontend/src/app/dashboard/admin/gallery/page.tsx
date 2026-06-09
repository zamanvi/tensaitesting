'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface GalleryItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  image_path: string | null;
  display_image_url: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const CATEGORIES = ['students', 'japan', 'milestones', 'agencies', 'events', 'docs', 'departures', 'institutes'];

const blank = { title: '', description: '', category: 'students', image_url: '', sort_order: 0, is_featured: false, is_active: true };

export default function AdminGalleryPage() {
  const { user } = useAuthStore();
  const router   = useRouter();
  const qc       = useQueryClient();

  // ── All hooks MUST be declared before any conditional return ──
  const [modal, setModal]     = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm]       = useState(blank);
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [formErr, setFormErr] = useState('');
  const fileRef               = useRef<HTMLInputElement>(null);

  const isAdmin = user?.roles?.some((r: string) => r === 'admin' || r === 'super_admin');

  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['admin-gallery'],
    queryFn: () => api.get('/admin/gallery').then(r => r.data),
    enabled: !!isAdmin,
  });

  const save = useMutation({
    mutationFn: (fd: FormData) => editing
      ? api.post(`/admin/gallery/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post('/admin/gallery', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-gallery'] }); closeModal(); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      setFormErr(err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(' ')
        : err.response?.data?.message ?? 'Failed to save.');
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, field }: { id: number; field: string }) =>
      api.post(`/admin/gallery/${id}/toggle`, { field }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-gallery'] }),
  });

  const del = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-gallery'] }),
  });

  // ── Guard: don't render until we know the user ──
  if (!user) return null;
  if (!isAdmin) return null;

  function openAdd() {
    setEditing(null);
    setForm(blank);
    setFile(null);
    setPreview('');
    setFormErr('');
    setModal('add');
  }

  function openEdit(item: GalleryItem) {
    setEditing(item);
    setForm({
      title:       item.title,
      description: item.description ?? '',
      category:    item.category,
      image_url:   item.image_url ?? '',
      sort_order:  item.sort_order,
      is_featured: item.is_featured,
      is_active:   item.is_active,
    });
    setFile(null);
    setPreview(item.display_image_url);
    setFormErr('');
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditing(null);
    setFile(null);
    setPreview('');
    setFormErr('');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    // Reset URL field when a file is picked
    setForm(prev => ({ ...prev, image_url: '' }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    if (!file && !form.image_url) {
      setFormErr('Please upload an image or paste an image URL.');
      return;
    }
    const fd = new FormData();
    fd.append('title',       form.title);
    fd.append('category',    form.category);
    fd.append('sort_order',  String(form.sort_order));
    fd.append('is_featured', form.is_featured ? '1' : '0');
    fd.append('is_active',   form.is_active   ? '1' : '0');
    if (form.description) fd.append('description', form.description);
    if (file) {
      fd.append('image', file);
    } else if (form.image_url) {
      fd.append('image_url', form.image_url);
    }
    save.mutate(fd);
  }

  const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

  return (
    <DashboardLayout title="Gallery Management">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        <button onClick={openAdd} className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-semibold rounded-xl transition-colors">
          + Add Image
        </button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🖼️</div>
          <p className="text-slate-400 text-sm mb-4">No gallery items yet.</p>
          <button onClick={openAdd} className="px-5 py-2 bg-green-700 text-white text-sm font-semibold rounded-xl hover:bg-green-800">
            Upload First Image
          </button>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm">
              {/* Image */}
              <div className="aspect-square bg-slate-50">
                {item.display_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.display_image_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 text-3xl">🖼️</div>
                )}
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {item.is_featured && <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">★ Featured</span>}
                {!item.is_active  && <span className="text-[10px] font-bold bg-slate-600 text-white px-1.5 py-0.5 rounded-full">Hidden</span>}
              </div>

              {/* Info + Actions */}
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{item.category} · #{item.sort_order}</p>
                <div className="flex items-center gap-1 mt-2">
                  <button onClick={() => openEdit(item)}
                    className="flex-1 text-[10px] font-semibold py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => toggle.mutate({ id: item.id, field: 'is_active' })}
                    className={`flex-1 text-[10px] font-semibold py-1 rounded-lg transition-colors ${item.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                    {item.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => toggle.mutate({ id: item.id, field: 'is_featured' })}
                    className={`flex-1 text-[10px] font-semibold py-1 rounded-lg transition-colors ${item.is_featured ? 'bg-amber-100 text-amber-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    {item.is_featured ? '★' : '☆'}
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${item.title}"?`)) del.mutate(item.id); }}
                    className="text-[10px] font-semibold py-1 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">{modal === 'add' ? 'Add Gallery Image' : 'Edit Gallery Image'}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Image upload area */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                    Image <span className="text-red-400">*</span>
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="relative w-full aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer flex items-center justify-center overflow-hidden"
                  >
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="text-3xl mb-2">📷</div>
                        <p className="text-xs text-slate-400">Click to upload image</p>
                        <p className="text-[10px] text-slate-300 mt-1">JPG, PNG, WebP · max 8 MB</p>
                      </div>
                    )}
                    {preview && (
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-semibold">Click to change</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
                  {file && (
                    <p className="text-[11px] text-green-700 mt-1 font-medium">✓ {file.name} selected</p>
                  )}
                </div>

                {/* Or paste URL — only when no file selected */}
                {!file && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Or paste image URL</label>
                    <input className={inputCls} type="url" placeholder="https://..."
                      value={form.image_url}
                      onChange={e => {
                        setForm(f => ({ ...f, image_url: e.target.value }));
                        if (e.target.value) setPreview(e.target.value);
                      }} />
                  </div>
                )}

                {/* Clear image button when editing and already has one */}
                {file && (
                  <button type="button" onClick={() => { setFile(null); setPreview(editing?.display_image_url ?? ''); }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                    ✕ Remove selected file
                  </button>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Title <span className="text-red-400">*</span></label>
                  <input className={inputCls} required placeholder="e.g. Hana from Dhaka departed to Tokyo"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Description</label>
                  <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Optional caption..."
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Category <span className="text-red-400">*</span></label>
                    <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Sort Order</label>
                    <input className={inputCls} type="number" min="0" value={form.sort_order}
                      onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active}
                      onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-green-600" />
                    <span className="text-sm text-slate-700 font-medium">Active (visible)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_featured}
                      onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                      className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm text-slate-700 font-medium">Featured</span>
                  </label>
                </div>

                {formErr && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">⚠️ {formErr}</div>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={save.isPending}
                    className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                    {save.isPending ? 'Saving…' : (modal === 'add' ? 'Upload & Save' : 'Save Changes')}
                  </button>
                  <button type="button" onClick={closeModal}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
