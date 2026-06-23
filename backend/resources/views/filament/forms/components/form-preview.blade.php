@php
    $record->load('fieldGroups.boxes.fields');
    $groups    = $record->fieldGroups->sortBy('sort_order');
    $totalSecs = $groups->count() + 1; // +1 for Student Info
    $intakes   = $record->intake_options ?? [];
    $educations = $record->educations ?? [];
@endphp

<style>
    .tpf-root * { box-sizing: border-box; }
    .tpf-root input, .tpf-root select, .tpf-root textarea {
        font-family: inherit;
        transition: border-color .15s, box-shadow .15s;
    }
    .tpf-root input:focus, .tpf-root select:focus, .tpf-root textarea:focus {
        outline: none;
        border-color: #16a34a !important;
        box-shadow: 0 0 0 3px rgba(22,163,74,.12) !important;
    }
    .tpf-root input::placeholder, .tpf-root textarea::placeholder { color: #94a3b8; }
    .tpf-file-drop:hover { border-color: #16a34a !important; background: #f0fdf4 !important; }
    .tpf-field label { font-size:12px; font-weight:600; color:#374151; display:flex; align-items:center; gap:3px; margin-bottom:5px; }
    .tpf-inp { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:13px; color:#374151; background:#fafafa; }
    .tpf-inp-ro { background:#f1f5f9 !important; color:#64748b !important; cursor:default; }
    .tpf-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .tpf-grid-full { grid-column: 1 / -1; }
    @media(max-width:560px) { .tpf-grid { grid-template-columns:1fr; } }
</style>

<div class="tpf-root" style="font-family:'Inter',system-ui,sans-serif;background:#f8fafc;border-radius:16px;overflow:hidden;min-width:0;">

    {{-- ══ HERO HEADER ══ --}}
    <div style="background:linear-gradient(135deg,#064e3b 0%,#065f46 40%,#047857 100%);padding:28px 28px 24px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none;"></div>

        <div style="position:relative;z-index:1;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <div style="width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🌏</div>
                <div>
                    <p style="color:rgba(255,255,255,.55);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0;">Application Form</p>
                    <h1 style="color:#fff;font-size:20px;font-weight:700;margin:3px 0 0;line-height:1.2;">{{ $record->name ?: 'Untitled Form' }}</h1>
                </div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                @if($record->country)
                <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.9);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:500;">🏳️ {{ $record->country }}</span>
                @endif
                @if($record->visa_type)
                <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.9);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:500;">🪪 {{ $record->visa_type }}</span>
                @endif
                @if(count($intakes))
                <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.9);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:500;">📅 {{ implode(', ', $intakes) }}</span>
                @endif
            </div>
        </div>

        @if($totalSecs > 1)
        <div style="margin-top:18px;">
            <div style="display:flex;align-items:center;gap:3px;">
                @for($i = 0; $i < $totalSecs; $i++)
                <div style="flex:1;height:3px;border-radius:2px;background:{{ $i === 0 ? '#6ee7b7' : 'rgba(255,255,255,.2)' }};"></div>
                @endfor
            </div>
            <p style="color:rgba(255,255,255,.45);font-size:11px;margin:5px 0 0;">{{ $totalSecs }} section{{ $totalSecs > 1 ? 's' : '' }} to complete</p>
        </div>
        @endif
    </div>

    {{-- ══ BODY ══ --}}
    <div style="padding:24px 28px 32px;display:flex;flex-direction:column;gap:16px;">

        {{-- ── SECTION 1: Student Information (always shown) ── --}}
        <div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);">
            <div style="display:flex;align-items:center;gap:10px;padding:14px 20px;background:linear-gradient(90deg,#f0fdf4,#f8fafc);border-bottom:1px solid #e2e8f0;">
                <span style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</span>
                <div>
                    <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0;">Student Information</h3>
                    <p style="font-size:11px;color:#94a3b8;margin:2px 0 0;">Personal details of the applicant</p>
                </div>
            </div>

            <div style="padding:20px;">
                <div class="tpf-grid">
                    {{-- Full Name --}}
                    <div class="tpf-field">
                        <label>Full Name <span style="color:#ef4444;">*</span></label>
                        <input class="tpf-inp tpf-inp-ro" type="text" value="{{ $record->student_name ?: '' }}" placeholder="e.g. Ahmed Rahman" readonly />
                        <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">Pre-filled from student profile</p>
                    </div>

                    {{-- Email --}}
                    <div class="tpf-field">
                        <label>Email Address</label>
                        <input class="tpf-inp tpf-inp-ro" type="email" placeholder="student@email.com" readonly />
                        <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">Pre-filled from account</p>
                    </div>

                    {{-- Contact Phone --}}
                    <div class="tpf-field">
                        <label>Contact Phone <span style="color:#ef4444;">*</span></label>
                        <input class="tpf-inp" type="tel" placeholder="+880 1XXXXXXXXX" />
                    </div>

                    {{-- WhatsApp --}}
                    <div class="tpf-field">
                        <label>WhatsApp Number</label>
                        <input class="tpf-inp" type="tel" placeholder="+880 1XXXXXXXXX" />
                        <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">For direct WhatsApp communication</p>
                    </div>

                    {{-- Date of Birth --}}
                    @if($record->birth_date)
                    <div class="tpf-field">
                        <label>Date of Birth</label>
                        <input class="tpf-inp tpf-inp-ro" type="date" value="{{ $record->birth_date }}" readonly />
                    </div>
                    @else
                    <div class="tpf-field">
                        <label>Date of Birth</label>
                        <input class="tpf-inp" type="date" placeholder="Select date" />
                    </div>
                    @endif

                    {{-- Passport Number --}}
                    <div class="tpf-field">
                        <label>Passport Number</label>
                        <input class="tpf-inp{{ $record->passport_no ? ' tpf-inp-ro' : '' }}" type="text"
                            value="{{ $record->passport_no ?: '' }}"
                            placeholder="{{ $record->passport_no ?: 'e.g. BD1234567' }}"
                            {{ $record->passport_no ? 'readonly' : '' }} />
                    </div>

                    {{-- Target Country (read-only, from template) --}}
                    <div class="tpf-field">
                        <label>Target Country</label>
                        <input class="tpf-inp tpf-inp-ro" type="text" value="{{ $record->country ?: '' }}" readonly />
                    </div>

                    {{-- Intake --}}
                    @if(count($intakes))
                    <div class="tpf-field">
                        <label>Select Intake <span style="color:#ef4444;">*</span></label>
                        <select class="tpf-inp">
                            <option value="" disabled selected>Choose intake…</option>
                            @foreach($intakes as $intake)
                            <option>{{ $intake }}</option>
                            @endforeach
                        </select>
                    </div>
                    @endif

                    {{-- Permanent Address --}}
                    <div class="tpf-field tpf-grid-full">
                        <label>Permanent Address <span style="color:#ef4444;">*</span></label>
                        <textarea class="tpf-inp" rows="2" placeholder="House, Road, Area, City, Postcode"></textarea>
                    </div>
                </div>

                {{-- Education Certificates --}}
                @if(count($educations))
                <div style="margin-top:16px;border-top:1px solid #f1f5f9;padding-top:16px;">
                    <p style="font-size:12px;font-weight:700;color:#374151;margin:0 0 10px;">Education Certificates</p>
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        @foreach($educations as $edu)
                        @php $mandatory = ($edu['mandatory'] ?? false) || ($edu['is_mandatory'] ?? false); @endphp
                        <div style="border:1.5px solid {{ $mandatory ? '#fca5a5' : '#e2e8f0' }};border-radius:10px;padding:12px 14px;background:{{ $mandatory ? '#fff7f7' : '#f8fafc' }};">
                            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                                <span style="font-size:12px;font-weight:700;color:{{ $mandatory ? '#dc2626' : '#374151' }};">
                                    {{ ucwords(str_replace('_', ' ', $edu['level'] ?? 'Certificate')) }}
                                    @if($mandatory)<span style="color:#ef4444;margin-left:3px;">*</span>@endif
                                </span>
                                <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;background:{{ $mandatory ? '#fee2e2' : '#f1f5f9' }};color:{{ $mandatory ? '#dc2626' : '#64748b' }};">
                                    {{ $mandatory ? 'Required' : 'Optional' }}
                                </span>
                            </div>
                            <div class="tpf-grid" style="margin-bottom:10px;">
                                <div class="tpf-field">
                                    <label>Institution Name</label>
                                    <input class="tpf-inp" type="text" placeholder="e.g. Dhaka College" />
                                </div>
                                <div class="tpf-field">
                                    <label>Result / GPA</label>
                                    <input class="tpf-inp" type="text" placeholder="e.g. 5.00 / A+" />
                                </div>
                                <div class="tpf-field">
                                    <label>Passing Year</label>
                                    <input class="tpf-inp" type="number" placeholder="e.g. 2022" />
                                </div>
                            </div>
                            <div class="tpf-file-drop" style="border:2px dashed {{ $mandatory ? '#fca5a5' : '#cbd5e1' }};border-radius:10px;padding:12px;text-align:center;background:{{ $mandatory ? '#fff7f7' : '#f8fafc' }};cursor:pointer;transition:all .2s;">
                                <p style="font-size:12px;font-weight:600;color:{{ $mandatory ? '#dc2626' : '#64748b' }};margin:0;">📎 Upload Certificate{{ $mandatory ? ' (Required)' : ' (Optional)' }}</p>
                                <p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">PDF or image, max 5 MB</p>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </div>
        </div>

        {{-- ── DYNAMIC SECTIONS ── --}}
        @foreach($groups as $gi => $group)
        <div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);">
            <div style="display:flex;align-items:center;gap:10px;padding:14px 20px;background:linear-gradient(90deg,#f0fdf4,#f8fafc);border-bottom:1px solid #e2e8f0;">
                <span style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ $gi + 2 }}</span>
                <div>
                    <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0;">{{ $group->label ?: 'Section ' . ($gi + 2) }}</h3>
                    @if($group->hint)<p style="font-size:11px;color:#94a3b8;margin:2px 0 0;">{{ $group->hint }}</p>@endif
                </div>
            </div>

            <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">
                @foreach($group->boxes->sortBy('sort_order') as $box)
                @php
                    $fields = $box->fields->sortBy('sort_order')->where('is_active', true);
                    $hasDoc = $box->requires_document;
                @endphp
                @if($fields->isNotEmpty() || $hasDoc)
                <div>
                    @if($box->name)
                    <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px;">{{ $box->name }}</p>
                    @endif
                    @if($fields->isNotEmpty())
                    <div style="display:flex;flex-wrap:wrap;gap:12px;">
                        @foreach($fields as $field)
                        @php
                            $w = match($field->box_size) {
                                'full'   => '100%',
                                'middle' => 'calc(50% - 6px)',
                                default  => 'calc(33.333% - 8px)',
                            };
                        @endphp
                        <div style="width:{{ $w }};min-width:120px;display:flex;flex-direction:column;gap:5px;" class="tpf-field">
                            <label>
                                {{ $field->label ?: 'Untitled' }}
                                @if($field->is_required)<span style="color:#ef4444;font-size:14px;line-height:1;">*</span>@endif
                                @if(!$field->is_required)<span style="font-weight:400;color:#cbd5e1;font-size:10px;">(optional)</span>@endif
                            </label>

                            @if($field->field_type === 'textarea')
                            <textarea class="tpf-inp" placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label ?: 'text') . '…' }}" rows="3" style="resize:vertical;"></textarea>
                            @elseif($field->field_type === 'select')
                            <select class="tpf-inp">
                                <option value="" disabled selected>{{ $field->placeholder ?: 'Select…' }}</option>
                                @foreach($field->options ?? [] as $opt)
                                <option>{{ $opt }}</option>
                                @endforeach
                            </select>
                            @elseif($field->field_type === 'file')
                            <div class="tpf-file-drop" style="border:2px dashed #cbd5e1;border-radius:10px;padding:16px;text-align:center;background:#f8fafc;cursor:pointer;transition:all .2s;">
                                <div style="font-size:22px;margin-bottom:4px;">📎</div>
                                <p style="font-size:12px;font-weight:600;color:#64748b;margin:0;">{{ $field->placeholder ?: 'Click to upload' }}</p>
                                @if($field->helper_text)<p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">{{ $field->helper_text }}</p>@endif
                            </div>
                            @else
                            <input class="tpf-inp"
                                type="{{ in_array($field->field_type, ['number','date','email','tel']) ? $field->field_type : 'text' }}"
                                placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label ?: 'value') . '…' }}" />
                            @endif

                            @if($field->helper_text && $field->field_type !== 'file')
                            <p style="font-size:11px;color:#94a3b8;margin:0;">{{ $field->helper_text }}</p>
                            @endif

                            @if($field->requires_document && $field->field_type !== 'file')
                            <div style="border:1.5px dashed {{ $field->document_required ? '#fca5a5' : '#fcd34d' }};border-radius:8px;padding:8px 10px;background:{{ $field->document_required ? '#fff7f7' : '#fffbeb' }};display:flex;align-items:center;gap:6px;margin-top:2px;">
                                <span style="font-size:13px;">📎</span>
                                <span style="font-size:11px;color:{{ $field->document_required ? '#dc2626' : '#d97706' }};font-weight:500;">
                                    Document {{ $field->document_required ? '(Required)' : '(Optional)' }}
                                </span>
                            </div>
                            @endif
                        </div>
                        @endforeach
                    </div>
                    @endif

                    @if($hasDoc)
                    <div class="tpf-file-drop" style="margin-top:{{ $fields->isNotEmpty() ? '12px' : '0' }};border:2px dashed {{ $box->document_required ? '#fca5a5' : '#cbd5e1' }};border-radius:10px;padding:16px;text-align:center;background:{{ $box->document_required ? '#fff7f7' : '#f8fafc' }};cursor:pointer;transition:all .2s;">
                        <div style="font-size:24px;margin-bottom:4px;">📂</div>
                        <p style="font-size:13px;font-weight:600;color:{{ $box->document_required ? '#dc2626' : '#64748b' }};margin:0;">
                            {{ $box->doc_label ?: 'Upload Document' }}
                            @if($box->document_required)<span style="color:#dc2626;margin-left:3px;">*</span>@endif
                        </p>
                        <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">
                            {{ $box->document_required ? 'Required — must upload before submitting' : 'Optional — attach a supporting document' }}
                        </p>
                    </div>
                    @endif
                </div>
                @endif
                @endforeach
            </div>
        </div>
        @endforeach

        {{-- ══ SUBMIT ══ --}}
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding:20px 0 4px;border-top:1px solid #e2e8f0;margin-top:4px;">
            <p style="font-size:12px;color:#94a3b8;margin:0;">
                <span style="color:#ef4444;">*</span> Required fields must be completed before submitting.
            </p>
            <button type="button"
                style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,.3);"
                onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                <svg style="width:16px;height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Submit Application
            </button>
        </div>

    </div>
</div>
