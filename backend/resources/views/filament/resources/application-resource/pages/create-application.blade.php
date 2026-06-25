<x-filament-panels::page>
<style>
/* ── Force Filament 2-col grid → 1-col on mobile ─────── */
@media (max-width: 640px) {
    .cap-form .fi-fo-grid.grid { grid-template-columns: 1fr !important; }
    .cap-form .fi-fo-grid.grid > * { grid-column: span 1 !important; }
    /* Filament uses CSS vars for columns */
    .cap-form .fi-section-content .grid {
        --cols-default: 1 !important;
        --cols-lg: 1 !important;
        grid-template-columns: 1fr !important;
    }
    .cap-form .fi-section-content .grid > * {
        --col-span-default: 1 !important;
        grid-column: span 1 / span 1 !important;
    }
}
</style>
<style>
/* ── Reset & base ───────────────────────────────────── */
.cap * { box-sizing: border-box; }
.cap { font-family: 'Inter', system-ui, sans-serif; max-width: 860px; margin: 0 auto; }

/* ── Hero card ─────────────────────────────────────── */
.cap-hero {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%);
    border-radius: 20px;
    padding: 32px 36px 28px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
}
.cap-hero::before {
    content: '';
    position: absolute; top: -50px; right: -50px;
    width: 220px; height: 220px; border-radius: 50%;
    background: rgba(255,255,255,.06);
    pointer-events: none;
}
.cap-hero::after {
    content: '';
    position: absolute; bottom: -70px; left: -30px;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(255,255,255,.04);
    pointer-events: none;
}
.cap-hero-inner { position: relative; z-index: 1; }
.cap-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.18); border: 1px solid rgba(255,255,255,.25);
    border-radius: 99px; padding: 4px 13px;
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em;
    color: rgba(255,255,255,.95); margin-bottom: 12px;
}
.cap-hero h1 {
    font-size: 26px; font-weight: 800; color: #fff;
    line-height: 1.2; margin: 0 0 8px;
}
.cap-hero p {
    font-size: 13px; color: rgba(255,255,255,.72);
    line-height: 1.6; margin: 0 0 20px; max-width: 480px;
}
.cap-steps {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.cap-step {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.13);
    border: 1px solid rgba(255,255,255,.18);
    border-radius: 8px; padding: 6px 13px;
    font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,.88);
}
.cap-step-n {
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(255,255,255,.28);
    font-size: 10px; font-weight: 800; color: #fff;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
}
.cap-arr { color: rgba(255,255,255,.3); font-size: 14px; line-height: 1; }

/* ── Form wrapper ──────────────────────────────────── */
.cap-form { display: flex; flex-direction: column; gap: 14px; }

/* ── Section cards ─────────────────────────────────── */
.cap-form .fi-section {
    border-radius: 14px !important;
    border: 1.5px solid #e5e7eb !important;
    box-shadow: 0 1px 3px rgba(0,0,0,.05) !important;
    overflow: hidden !important;
    background: #fff !important;
}
.cap-form .fi-section-header-ctn {
    background: #f8fafc !important;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 13px 20px !important;
}
.cap-form .fi-section-header-heading {
    font-size: 14px !important; font-weight: 700 !important; color: #111827 !important;
}
.cap-form .fi-section-header-description {
    font-size: 12px !important; color: #6b7280 !important; margin-top: 1px !important;
}
.cap-form .fi-section-content-ctn { padding: 20px !important; }

/* Country Form section — special highlight */
.cap-form .fi-section:first-child {
    border-color: #a7f3d0 !important;
    background: #f0fdf4 !important;
}
.cap-form .fi-section:first-child .fi-section-header-ctn {
    background: #dcfce7 !important;
    border-bottom-color: #a7f3d0 !important;
}

/* ── Input polish ──────────────────────────────────── */
.cap-form .fi-input {
    border-radius: 8px !important; font-size: 13.5px !important;
    border-color: #d1d5db !important;
    transition: border-color .15s, box-shadow .15s !important;
}
.cap-form .fi-input:focus-within {
    border-color: #16a34a !important;
    box-shadow: 0 0 0 3px rgba(22,163,74,.1) !important;
}
.cap-form .fi-select-input {
    border-radius: 8px !important; font-size: 13.5px !important;
}
.cap-form .fi-fo-field-wrp-label {
    font-size: 12px !important; font-weight: 600 !important; color: #374151 !important;
}
.cap-form .fi-fo-textarea textarea { border-radius: 8px !important; }
.cap-form .fi-fo-file-upload { border-radius: 10px !important; }

/* ── Action buttons ────────────────────────────────── */
.cap-actions {
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    box-shadow: 0 1px 3px rgba(0,0,0,.05);
}
.cap-actions-note {
    display: flex; align-items: center; gap: 8px;
    font-size: 12.5px; color: #6b7280;
}
.cap-actions-note svg { flex-shrink: 0; color: #9ca3af; }
.cap-actions-btns { display: flex; gap: 10px; align-items: center; }
.cap-btn-cancel {
    padding: 9px 18px; border-radius: 9px;
    border: 1.5px solid #e5e7eb; background: #fff;
    font-size: 13.5px; font-weight: 600; color: #6b7280;
    cursor: pointer; font-family: inherit;
    transition: border-color .15s, color .15s;
    text-decoration: none; display: inline-flex; align-items: center;
}
.cap-btn-cancel:hover { border-color: #d1d5db; color: #374151; }
.cap-btn-create {
    padding: 10px 28px; border-radius: 9px;
    background: #16a34a; border: none;
    font-size: 14px; font-weight: 700; color: #fff;
    cursor: pointer; font-family: inherit;
    display: inline-flex; align-items: center; gap: 8px;
    box-shadow: 0 2px 8px rgba(22,163,74,.3);
    transition: background .15s, box-shadow .15s;
}
.cap-btn-create:hover { background: #15803d; box-shadow: 0 4px 14px rgba(22,163,74,.35); }

/* ── Hide default Filament form actions ────────────── */
.cap-form .fi-form-actions { display: none !important; }

/* ── Section reveal animation ──────────────────────── */
@keyframes capReveal {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
}
.cap-form .fi-section {
    animation: capReveal 0.35s ease-out both;
}
.cap-form .fi-section:nth-child(2)  { animation-delay: .04s; }
.cap-form .fi-section:nth-child(3)  { animation-delay: .08s; }
.cap-form .fi-section:nth-child(4)  { animation-delay: .12s; }
.cap-form .fi-section:nth-child(5)  { animation-delay: .16s; }
.cap-form .fi-section:nth-child(6)  { animation-delay: .20s; }

/* ── Green border on filled inputs ─────────────────── */
.cap-form .fi-input:not(:placeholder-shown) {
    border-color: #86efac !important;
}
.cap-form .fi-input-wrp:focus-within {
    border-color: #16a34a !important;
    box-shadow: 0 0 0 3px rgba(22,163,74,.1) !important;
}

/* ── Hide native intake select (pills replace it) ───── */
.cap-form [id*="intake"] select.cap-intake-hidden-select,
.cap-form .fi-fo-select:has(#cap-intake-select) { display: none !important; }

/* ── Pill hover ─────────────────────────────────────── */
.cap-pill:hover {
    background: #dcfce7 !important;
    border-color: #6ee7b7 !important;
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba(22,163,74,.15);
}

/* ── Placeholder Filament fix ───────────────────────── */
.cap-form .fi-fo-placeholder { padding: 0 !important; }

/* ── Mobile ≤ 768px ────────────────────────────────── */
@media (max-width: 768px) {
    .cap { max-width: 100%; padding: 0 2px; }
    .cap-hero { padding: 22px 18px 20px; border-radius: 14px; margin-bottom: 14px; }
    .cap-hero h1 { font-size: 20px; }
    .cap-hero p { font-size: 12.5px; margin-bottom: 14px; }
    .cap-steps { gap: 5px; }
    .cap-step { padding: 5px 10px; font-size: 11px; }
    .cap-arr { display: none; }
    .cap-form .fi-section-content-ctn { padding: 14px !important; }
    .cap-actions { flex-direction: column; align-items: stretch; padding: 14px 16px; }
    .cap-actions-btns { flex-direction: column; }
    .cap-btn-create, .cap-btn-cancel { width: 100%; justify-content: center; }
}

/* ── Mobile ≤ 520px ────────────────────────────────── */
@media (max-width: 520px) {
    .cap { padding: 0; }
    .cap-hero { padding: 18px 14px 16px; border-radius: 12px; }
    .cap-hero h1 { font-size: 17px; line-height: 1.25; }
    .cap-hero p { font-size: 12px; }
    .cap-badge { font-size: 9.5px; padding: 3px 10px; }
    /* Steps: 2×2 grid on small screens */
    .cap-steps {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
    }
    .cap-step { border-radius: 8px; padding: 6px 8px; font-size: 10.5px; justify-content: flex-start; }
    /* Form field columns collapse to 1 */
    .cap-form .fi-grid { grid-template-columns: 1fr !important; }
    .cap-form [class*="col-span"] { grid-column: span 1 !important; }
    .cap-form .fi-section { border-radius: 10px !important; }
    .cap-form .fi-section-content-ctn { padding: 12px !important; }
    /* Template info card → stack */
    .cap-tpl-card { flex-direction: column !important; gap: 10px !important; }
    /* Intake pills wrap */
    #cap-pill-row { gap: 5px !important; }
    .cap-pill { font-size: 11.5px !important; padding: 5px 10px !important; }
    .cap-actions { border-radius: 10px; gap: 10px; }
    .cap-actions-note { font-size: 11.5px; }
}

/* ── Mobile ≤ 390px (iPhone SE / small phones) ─────── */
@media (max-width: 390px) {
    .cap-hero { padding: 14px 10px 13px; border-radius: 10px; }
    .cap-hero h1 { font-size: 15px; }
    .cap-hero p { font-size: 11px; margin-bottom: 12px; }
    .cap-badge { font-size: 9px; padding: 3px 8px; }
    .cap-steps { grid-template-columns: 1fr 1fr; gap: 5px; }
    .cap-step { font-size: 9.5px; padding: 5px 6px; }
    .cap-step-n { width: 15px; height: 15px; font-size: 8.5px; }
    .cap-form .fi-section-header-ctn { padding: 10px 12px !important; }
    .cap-form .fi-section-header-heading { font-size: 12.5px !important; }
    .cap-form .fi-section-content-ctn { padding: 10px !important; }
    .cap-form .fi-input { font-size: 13px !important; }
    .cap-form .fi-fo-field-wrp-label { font-size: 11px !important; }
    .cap-btn-create { font-size: 13px; padding: 9px 20px; }
    .cap-btn-cancel { font-size: 13px; padding: 8px 16px; }
    .cap-actions { padding: 10px 12px; }
}
</style>

<div class="cap">

    {{-- Hero ──────────────────────────────────────────────────── --}}
    <div class="cap-hero">
        <div class="cap-hero-inner">
            <div class="cap-badge">
                <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                New Application
            </div>
            <h1>Create a New Student Application</h1>
            <p>Select a country form, fill in the student's details, and save to continue editing the full application.</p>
            <div class="cap-steps">
                <div class="cap-step"><span class="cap-step-n">1</span> Select Country Form</div>
                <span class="cap-arr">›</span>
                <div class="cap-step"><span class="cap-step-n">2</span> Fill Student Info</div>
                <span class="cap-arr">›</span>
                <div class="cap-step"><span class="cap-step-n">3</span> Education &amp; Documents</div>
                <span class="cap-arr">›</span>
                <div class="cap-step"><span class="cap-step-n">4</span> Save &amp; Continue</div>
            </div>
        </div>
    </div>

    {{-- Form ──────────────────────────────────────────────────── --}}
    <div class="cap-form">
        <x-filament-panels::form wire:submit="create">
            {{ $this->form }}
            <x-filament-panels::form.actions
                :actions="$this->getCachedFormActions()"
                :full-width="$this->hasFullWidthFormActions()"
            />
        </x-filament-panels::form>
    </div>

    {{-- Custom action bar ─────────────────────────────────────── --}}
    <div class="cap-actions" style="margin-top:14px;">
        <div class="cap-actions-note">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            After saving, you can fill in all remaining fields on the edit page.
        </div>
        <div class="cap-actions-btns">
            <a href="{{ \App\Filament\Resources\ApplicationResource::getUrl('index') }}" class="cap-btn-cancel">
                Cancel
            </a>
            <button type="button" class="cap-btn-create" onclick="document.querySelector('[wire\\:submit=create]').dispatchEvent(new Event('submit', {bubbles:true,cancelable:true}))">
                <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                </svg>
                Create Application
            </button>
        </div>
    </div>

</div>
</x-filament-panels::page>
