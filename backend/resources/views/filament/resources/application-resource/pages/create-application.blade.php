<x-filament-panels::page>

<style>
/* ── Page-level resets ───────────────────────────────────────────── */
.ca-page { font-family: 'Inter', system-ui, sans-serif; }

/* ── Hero banner ─────────────────────────────────────────────────── */
.ca-hero {
    background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
    border-radius: 16px;
    padding: 28px 32px;
    margin-bottom: 24px;
    position: relative;
    overflow: hidden;
    color: #fff;
}
.ca-hero::before {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,.05);
}
.ca-hero::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -20px;
    width: 160px; height: 160px;
    border-radius: 50%;
    background: rgba(255,255,255,.04);
}
.ca-hero-content { position: relative; z-index: 1; }
.ca-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.15);
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 99px;
    padding: 4px 14px;
    font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: .07em;
    margin-bottom: 10px;
}
.ca-hero h1 {
    font-size: 24px; font-weight: 800;
    line-height: 1.2; margin: 0 0 6px;
    color: #fff;
}
.ca-hero p {
    font-size: 13.5px; color: rgba(255,255,255,.75);
    margin: 0; max-width: 520px; line-height: 1.5;
}
.ca-hero-steps {
    display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap;
}
.ca-step {
    display: flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 8px; padding: 7px 14px;
    font-size: 12px; font-weight: 500; color: rgba(255,255,255,.9);
}
.ca-step-num {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(255,255,255,.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; flex-shrink: 0;
}

/* ── Section card styling overrides ─────────────────────────────── */
.ca-page .fi-section {
    border-radius: 14px !important;
    border: 1.5px solid #e5e7eb !important;
    box-shadow: 0 1px 4px rgba(0,0,0,.04) !important;
    overflow: hidden !important;
    margin-bottom: 0 !important;
}
.ca-page .fi-section-header-ctn {
    background: #f9fafb !important;
    border-bottom: 1px solid #e5e7eb !important;
    padding: 14px 20px !important;
}
.ca-page .fi-section-content-ctn {
    padding: 20px !important;
}
.ca-page .fi-section-header-heading {
    font-size: 14.5px !important;
    font-weight: 700 !important;
    color: #111827 !important;
}

/* ── Input field polish ──────────────────────────────────────────── */
.ca-page .fi-input {
    border-radius: 8px !important;
    border-color: #d1d5db !important;
    font-size: 14px !important;
    transition: border-color .15s, box-shadow .15s !important;
}
.ca-page .fi-input:focus-within {
    border-color: #16a34a !important;
    box-shadow: 0 0 0 3px rgba(22,163,74,.1) !important;
}
.ca-page .fi-select-input {
    border-radius: 8px !important;
    border-color: #d1d5db !important;
    font-size: 14px !important;
}
.ca-page .fi-fo-field-wrp-label {
    font-size: 12.5px !important;
    font-weight: 600 !important;
    color: #374151 !important;
}
.ca-page .fi-fo-textarea textarea {
    border-radius: 8px !important;
}

/* ── Form action area ────────────────────────────────────────────── */
.ca-footer {
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 14px;
    padding: 18px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin-top: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.ca-footer-note {
    display: flex; align-items: center; gap: 8px;
    font-size: 12.5px; color: #6b7280;
}
.ca-footer-actions { display: flex; gap: 10px; }

/* ── Filament form actions override ─────────────────────────────── */
.ca-page [wire\:submit] .fi-ac-btn-action:first-child {
    background: #16a34a !important;
    border-radius: 10px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    padding: 10px 28px !important;
    box-shadow: 0 2px 8px rgba(22,163,74,.25) !important;
}
.ca-page [wire\:submit] .fi-ac-btn-action:first-child:hover {
    background: #15803d !important;
}

/* ── Country Form select special styling ─────────────────────────── */
.ca-page .fi-section:first-of-type {
    border-color: #bbf7d0 !important;
    background: #f0fdf4 !important;
}
.ca-page .fi-section:first-of-type .fi-section-header-ctn {
    background: #dcfce7 !important;
    border-bottom-color: #bbf7d0 !important;
}

/* ── Mobile responsive ───────────────────────────────────────────── */
@media (max-width: 768px) {
    .ca-hero { padding: 20px 18px; border-radius: 12px; }
    .ca-hero h1 { font-size: 19px; }
    .ca-hero p { font-size: 12.5px; }
    .ca-hero-steps { gap: 6px; }
    .ca-step { padding: 6px 10px; font-size: 11px; }
    .ca-footer { flex-direction: column; align-items: stretch; padding: 14px 16px; }
    .ca-footer-actions { flex-direction: column; }
    .ca-page .fi-section-content-ctn { padding: 14px !important; }
    .ca-page .fi-section-header-ctn { padding: 12px 14px !important; }
}
@media (max-width: 480px) {
    .ca-hero h1 { font-size: 17px; }
    .ca-hero-badge { font-size: 10px; }
    .ca-page .fi-section { border-radius: 10px !important; }
}
</style>

<div class="ca-page">

    {{-- ── Hero Banner ─────────────────────────────────────────── --}}
    <div class="ca-hero">
        <div class="ca-hero-content">
            <div class="ca-hero-badge">
                <svg style="width:12px;height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                New Application
            </div>
            <h1>Create a New Student Application</h1>
            <p>Select a country form, fill in the student's details, and submit. All information will be saved securely and visible to the assigned branch.</p>

            <div class="ca-hero-steps">
                <div class="ca-step">
                    <span class="ca-step-num">1</span>
                    Select Country Form
                </div>
                <div style="display:flex;align-items:center;color:rgba(255,255,255,.3);font-size:16px;">›</div>
                <div class="ca-step">
                    <span class="ca-step-num">2</span>
                    Fill Student Info
                </div>
                <div style="display:flex;align-items:center;color:rgba(255,255,255,.3);font-size:16px;">›</div>
                <div class="ca-step">
                    <span class="ca-step-num">3</span>
                    Add Education & Documents
                </div>
                <div style="display:flex;align-items:center;color:rgba(255,255,255,.3);font-size:16px;">›</div>
                <div class="ca-step">
                    <span class="ca-step-num">4</span>
                    Save & Continue
                </div>
            </div>
        </div>
    </div>

    {{-- ── Filament Form ────────────────────────────────────────── --}}
    <div style="display:flex;flex-direction:column;gap:16px;">
        <x-filament-panels::form wire:submit="create">
            {{ $this->form }}

            <x-filament-panels::form.actions
                :actions="$this->getCachedFormActions()"
                :full-width="$this->hasFullWidthFormActions()"
            />
        </x-filament-panels::form>
    </div>

</div>

</x-filament-panels::page>
