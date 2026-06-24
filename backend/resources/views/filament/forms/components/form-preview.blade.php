@php
    $record->load('fieldGroups.boxes.fields');
    $groups      = $record->fieldGroups->sortBy('sort_order')
                       ->filter(fn($g) => $g->label !== 'Application Form Info' && $g->is_active);
    $intakes     = $record->intake_options ?? [];
    $educations  = $record->educations ?? [];
    $totalSteps  = 1 + $groups->count();
@endphp

<style>
.apf *{box-sizing:border-box;}
.apf-inp{
    width:100%;border:1.5px solid #e2e8f0;border-radius:10px;
    padding:10px 14px;font-size:13.5px;color:#1e293b;background:#fafafa;
    font-family:inherit;transition:border-color .18s,box-shadow .18s,background .18s;
    -webkit-appearance:none;appearance:none;
}
.apf-inp:focus{
    outline:none;border-color:#16a34a;background:#fff;
    box-shadow:0 0 0 3.5px rgba(22,163,74,.13);
}
.apf-inp::placeholder{color:#b0bec5;font-size:13px;}
.apf-inp-ro{background:#f1f5f9!important;color:#64748b!important;cursor:default;}
.apf-label{font-size:12.5px;font-weight:600;color:#374151;display:flex;align-items:center;gap:4px;margin-bottom:6px;}
.apf-hint{font-size:11px;color:#94a3b8;margin:4px 0 0;}
.apf-field{display:flex;flex-direction:column;}
.apf-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.apf-grid-full{grid-column:1/-1;}
.apf-grid-third{grid-template-columns:1fr 1fr 1fr;}
.apf-drop{border:2px dashed #cbd5e1;border-radius:10px;padding:16px 12px;text-align:center;background:#f8fafc;cursor:pointer;transition:all .2s;}
.apf-drop:hover{border-color:#16a34a;background:#f0fdf4;}
.apf-required{color:#ef4444;font-size:14px;line-height:1;}
.apf-opt{font-weight:400;color:#cbd5e1;font-size:10.5px;}
.apf-section{background:#fff;border-radius:16px;border:1px solid #e8edf3;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05);}
.apf-section-hd{display:flex;align-items:center;gap:12px;padding:16px 22px;background:linear-gradient(90deg,#f0fdf4 0%,#f8fafc 100%);border-bottom:1px solid #e8edf3;}
.apf-section-body{padding:22px;}
.apf-tag{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.14);color:rgba(255,255,255,.92);border-radius:20px;padding:4px 13px;font-size:11.5px;font-weight:500;backdrop-filter:blur(4px);}
select.apf-inp{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%2394a3b8' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
@media(max-width:540px){.apf-grid{grid-template-columns:1fr;}.apf-grid-third{grid-template-columns:1fr 1fr;}}
</style>

<div class="apf" style="font-family:'Inter',system-ui,sans-serif;background:#f1f5f9;border-radius:18px;overflow:hidden;min-width:0;">

    {{-- ════ HERO HEADER ════ --}}
    <div style="background:linear-gradient(135deg,#064e3b 0%,#065f46 45%,#0d9488 100%);padding:30px 28px 26px;position:relative;overflow:hidden;">
        {{-- decorative blobs --}}
        <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:rgba(255,255,255,.05);pointer-events:none;"></div>
        <div style="position:absolute;bottom:-30px;left:60px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none;"></div>

        <div style="position:relative;z-index:1;">
            {{-- brand + title --}}
            <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">
                <div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;backdrop-filter:blur(4px);">🌏</div>
                <div>
                    <p style="color:rgba(255,255,255,.5);font-size:10.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin:0 0 4px;">Student Application Form</p>
                    <h1 style="color:#fff;font-size:21px;font-weight:800;margin:0;line-height:1.2;letter-spacing:-.01em;">{{ $record->name ?: 'Application Form' }}</h1>
                </div>
            </div>

            {{-- chips --}}
            <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:18px;">
                @if($record->country)
                <span class="apf-tag">🏳️ {{ $record->country }}</span>
                @endif
                @if($record->visa_type)
                <span class="apf-tag">🪪 {{ $record->visa_type }}</span>
                @endif
                @if(count($intakes))
                <span class="apf-tag">📅 {{ count($intakes) }} intake{{ count($intakes) > 1 ? 's' : '' }} available</span>
                @endif
            </div>

            {{-- progress bar --}}
            <div>
                <div style="display:flex;align-items:center;gap:3px;margin-bottom:6px;">
                    @for($i = 0; $i < $totalSteps; $i++)
                    <div style="flex:1;height:3.5px;border-radius:3px;background:{{ $i === 0 ? '#6ee7b7' : 'rgba(255,255,255,.18)' }};transition:background .3s;"></div>
                    @endfor
                </div>
                <p style="color:rgba(255,255,255,.45);font-size:11px;margin:0;">Step 1 of {{ $totalSteps }} &nbsp;·&nbsp; Fill in all required fields marked with <span style="color:#fca5a5;">✱</span></p>
            </div>
        </div>
    </div>

    {{-- ════ FORM BODY ════ --}}
    <div style="padding:20px 20px 28px;display:flex;flex-direction:column;gap:14px;">

        {{-- ──── SECTION 1: Personal Information ──── --}}
        <div class="apf-section">
            <div class="apf-section-hd">
                <span style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(22,163,74,.3);">1</span>
                <div>
                    <h3 style="font-size:14.5px;font-weight:700;color:#1e293b;margin:0;">Personal Information</h3>
                    <p style="font-size:11px;color:#94a3b8;margin:2px 0 0;">Your basic details as the applicant</p>
                </div>
            </div>

            <div class="apf-section-body">
                <div class="apf-grid">
                    {{-- Full Name --}}
                    <div class="apf-field">
                        <label class="apf-label">Full Name <span class="apf-required">✱</span></label>
                        <input class="apf-inp apf-inp-ro" type="text" value="{{ $record->student_name ?: 'Ahmed Rahman' }}" readonly />
                        <p class="apf-hint">Auto-filled from your profile</p>
                    </div>

                    {{-- Email --}}
                    <div class="apf-field">
                        <label class="apf-label">Email Address</label>
                        <input class="apf-inp apf-inp-ro" type="email" value="student@email.com" readonly />
                        <p class="apf-hint">Auto-filled from your account</p>
                    </div>

                    {{-- Phone --}}
                    <div class="apf-field">
                        <label class="apf-label">Contact Number <span class="apf-required">✱</span></label>
                        <input class="apf-inp" type="tel" placeholder="+880 1XXXXXXXXX" />
                    </div>

                    {{-- WhatsApp --}}
                    <div class="apf-field">
                        <label class="apf-label">WhatsApp Number <span class="apf-opt">(optional)</span></label>
                        <input class="apf-inp" type="tel" placeholder="+880 1XXXXXXXXX" />
                        <p class="apf-hint">For direct communication via WhatsApp</p>
                    </div>

                    {{-- Date of Birth --}}
                    <div class="apf-field">
                        <label class="apf-label">Date of Birth</label>
                        <input class="apf-inp{{ $record->birth_date ? ' apf-inp-ro' : '' }}" type="date"
                            value="{{ $record->birth_date ?? '' }}"
                            {{ $record->birth_date ? 'readonly' : '' }} />
                        @if($record->birth_date)<p class="apf-hint">Auto-filled from your profile</p>@endif
                    </div>

                    {{-- Passport --}}
                    <div class="apf-field">
                        <label class="apf-label">Passport Number</label>
                        <input class="apf-inp{{ $record->passport_no ? ' apf-inp-ro' : '' }}" type="text"
                            value="{{ $record->passport_no ?? '' }}"
                            placeholder="e.g. AB1234567"
                            {{ $record->passport_no ? 'readonly' : '' }} />
                        @if($record->passport_no)<p class="apf-hint">Auto-filled from your profile</p>@endif
                    </div>

                    {{-- Intake --}}
                    @if(count($intakes))
                    <div class="apf-field">
                        <label class="apf-label">Preferred Intake <span class="apf-required">✱</span></label>
                        <select class="apf-inp">
                            <option value="" disabled selected>Select your intake…</option>
                            @foreach($intakes as $intake)
                            <option>{{ $intake }}</option>
                            @endforeach
                        </select>
                    </div>
                    @endif

                    {{-- Permanent Address --}}
                    <div class="apf-field {{ count($intakes) ? '' : 'apf-grid-full' }}" style="{{ count($intakes) ? 'grid-column:1/-1;' : '' }}">
                        <label class="apf-label">Permanent Address <span class="apf-required">✱</span></label>
                        <textarea class="apf-inp" rows="2" placeholder="House no., Road, Area, City, Postcode" style="resize:vertical;"></textarea>
                    </div>
                </div>

                {{-- ── Education Certificates ── --}}
                @if(count($educations))
                <div style="margin-top:20px;border-top:1px solid #f1f5f9;padding-top:20px;">
                    <p style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.06em;margin:0 0 12px;">Education Certificates</p>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        @foreach($educations as $edu)
                        @php $mandatory = ($edu['mandatory'] ?? false) || ($edu['is_mandatory'] ?? false); @endphp
                        <div style="border:1.5px solid {{ $mandatory ? '#fca5a5' : '#e8edf3' }};border-radius:12px;overflow:hidden;background:#fff;">
                            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:{{ $mandatory ? '#fff5f5' : '#f8fafc' }};border-bottom:1px solid {{ $mandatory ? '#fecaca' : '#f1f5f9' }};">
                                <span style="font-size:13px;font-weight:700;color:{{ $mandatory ? '#dc2626' : '#374151' }};">
                                    {{ ucwords(str_replace('_', ' ', $edu['level'] ?? 'Certificate')) }}
                                    @if($mandatory) <span style="color:#ef4444;">✱</span>@endif
                                </span>
                                <span style="font-size:10.5px;font-weight:600;padding:3px 10px;border-radius:20px;background:{{ $mandatory ? '#fee2e2' : '#f1f5f9' }};color:{{ $mandatory ? '#dc2626' : '#64748b' }};">
                                    {{ $mandatory ? 'Required' : 'Optional' }}
                                </span>
                            </div>
                            <div style="padding:14px;">
                                <div class="apf-grid apf-grid-third" style="margin-bottom:12px;">
                                    <div class="apf-field">
                                        <label class="apf-label">Institution</label>
                                        <input class="apf-inp" type="text" placeholder="e.g. Dhaka College" />
                                    </div>
                                    <div class="apf-field">
                                        <label class="apf-label">Result / GPA</label>
                                        <input class="apf-inp" type="text" placeholder="e.g. 5.00 / A+" />
                                    </div>
                                    <div class="apf-field">
                                        <label class="apf-label">Passing Year</label>
                                        <input class="apf-inp" type="number" placeholder="e.g. 2022" />
                                    </div>
                                </div>
                                <div class="apf-drop">
                                    <div style="font-size:26px;margin-bottom:5px;">📎</div>
                                    <p style="font-size:12.5px;font-weight:600;color:{{ $mandatory ? '#dc2626' : '#64748b' }};margin:0;">Upload Certificate{{ $mandatory ? ' (Required)' : ' (Optional)' }}</p>
                                    <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;">PDF or image · Max 5 MB</p>
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </div>
        </div>

        {{-- ──── DYNAMIC SECTIONS ──── --}}
        @foreach($groups as $gi => $group)
        @php
            $stepNo = $gi + 2;
            $allFields = $group->boxes->sortBy('sort_order')
                ->flatMap(fn($b) => $b->fields->where('is_active', true)->sortBy('sort_order'));
            $hasDocs = $group->boxes->where('requires_document', true)->isNotEmpty();
        @endphp
        <div class="apf-section">
            <div class="apf-section-hd">
                <span style="width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(14,165,233,.25);">{{ $stepNo }}</span>
                <div>
                    <h3 style="font-size:14.5px;font-weight:700;color:#1e293b;margin:0;">{{ $group->label }}</h3>
                    @if($group->hint)
                    <p style="font-size:11px;color:#94a3b8;margin:2px 0 0;">{{ $group->hint }}</p>
                    @endif
                </div>
            </div>

            <div class="apf-section-body">
                @foreach($group->boxes->sortBy('sort_order') as $box)
                @php
                    $fields = $box->fields->where('is_active', true)->sortBy('sort_order');
                @endphp
                @if($fields->isNotEmpty() || $box->requires_document)
                <div style="{{ !$loop->first ? 'margin-top:16px;padding-top:16px;border-top:1px solid #f1f5f9;' : '' }}">
                    @if($box->name)
                    <p style="font-size:10.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;margin:0 0 12px;">{{ $box->name }}</p>
                    @endif

                    @if($fields->isNotEmpty())
                    <div style="display:flex;flex-wrap:wrap;gap:14px;">
                        @foreach($fields as $field)
                        @php
                            $w = match($field->box_size) {
                                'full'   => '100%',
                                'middle' => 'calc(50% - 7px)',
                                default  => 'calc(33.333% - 10px)',
                            };
                        @endphp
                        <div class="apf-field" style="width:{{ $w }};min-width:160px;flex:1 1 {{ $w }};">
                            <label class="apf-label">
                                {{ $field->label ?: 'Field' }}
                                @if($field->is_required)
                                    <span class="apf-required">✱</span>
                                @else
                                    <span class="apf-opt">(optional)</span>
                                @endif
                            </label>

                            @if($field->field_type === 'textarea')
                                <textarea class="apf-inp" rows="3" style="resize:vertical;"
                                    placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label ?: 'details') . '…' }}"></textarea>
                            @elseif($field->field_type === 'select')
                                <select class="apf-inp">
                                    <option value="" disabled selected>{{ $field->placeholder ?: 'Choose an option…' }}</option>
                                    @foreach($field->options ?? [] as $opt)
                                    <option>{{ $opt }}</option>
                                    @endforeach
                                </select>
                            @elseif($field->field_type === 'file')
                                <div class="apf-drop">
                                    <div style="font-size:24px;margin-bottom:5px;">📎</div>
                                    <p style="font-size:12.5px;font-weight:600;color:#475569;margin:0;">{{ $field->placeholder ?: 'Click to upload' }}</p>
                                    @if($field->helper_text)
                                    <p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">{{ $field->helper_text }}</p>
                                    @else
                                    <p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">PDF or image · Max 5 MB</p>
                                    @endif
                                </div>
                            @else
                                <input class="apf-inp"
                                    type="{{ in_array($field->field_type, ['number','date','email','tel']) ? $field->field_type : 'text' }}"
                                    placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label ?: 'value') . '…' }}" />
                            @endif

                            @if($field->helper_text && $field->field_type !== 'file')
                            <p class="apf-hint">{{ $field->helper_text }}</p>
                            @endif

                            @if($field->requires_document && $field->field_type !== 'file')
                            <div style="margin-top:6px;border:1.5px dashed {{ $field->document_required ? '#fca5a5' : '#fcd34d' }};border-radius:8px;padding:8px 10px;background:{{ $field->document_required ? '#fff5f5' : '#fffbeb' }};display:flex;align-items:center;gap:6px;">
                                <span style="font-size:14px;">📎</span>
                                <span style="font-size:11.5px;color:{{ $field->document_required ? '#dc2626' : '#d97706' }};font-weight:600;">
                                    Supporting document {{ $field->document_required ? '(Required)' : '(Optional)' }}
                                </span>
                            </div>
                            @endif
                        </div>
                        @endforeach
                    </div>
                    @endif

                    @if($box->requires_document)
                    <div class="apf-drop" style="margin-top:{{ $fields->isNotEmpty() ? '14px' : '0' }};border-color:{{ $box->document_required ? '#fca5a5' : '#cbd5e1' }};background:{{ $box->document_required ? '#fff5f5' : '#f8fafc' }};">
                        <div style="font-size:28px;margin-bottom:6px;">📂</div>
                        <p style="font-size:13px;font-weight:700;color:{{ $box->document_required ? '#dc2626' : '#475569' }};margin:0;">
                            {{ $box->doc_label ?: 'Upload Document' }}
                            @if($box->document_required)<span style="color:#dc2626;margin-left:2px;">✱</span>@endif
                        </p>
                        <p style="font-size:11px;color:#94a3b8;margin:5px 0 0;">
                            {{ $box->document_required ? 'Required — must upload before submitting' : 'Optional — attach a supporting document if available' }}
                        </p>
                        <p style="font-size:10.5px;color:#cbd5e1;margin:3px 0 0;">PDF, JPG, PNG · Max 5 MB</p>
                    </div>
                    @endif
                </div>
                @endif
                @endforeach

                @if($allFields->isEmpty() && !$hasDocs)
                <p style="font-size:13px;color:#94a3b8;text-align:center;padding:16px 0;margin:0;">No fields configured for this section.</p>
                @endif
            </div>
        </div>
        @endforeach

        {{-- ════ SUBMIT BAR ════ --}}
        <div style="background:#fff;border-radius:16px;border:1px solid #e8edf3;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 2px 8px rgba(0,0,0,.04);">
            <div>
                <p style="font-size:12.5px;color:#475569;font-weight:500;margin:0;">
                    <span style="color:#ef4444;">✱</span> Required fields must be completed before submission.
                </p>
                <p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">Your information is encrypted and securely stored.</p>
            </div>
            <button type="button"
                style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:14px;font-weight:700;padding:13px 30px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 4px 16px rgba(22,163,74,.32);letter-spacing:.01em;"
                onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(22,163,74,.38)'"
                onmouseout="this.style.transform='';this.style.boxShadow='0 4px 16px rgba(22,163,74,.32)'">
                <svg style="width:16px;height:16px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Submit Application
            </button>
        </div>

        {{-- preview watermark --}}
        <p style="text-align:center;font-size:11px;color:#cbd5e1;margin:0;padding-bottom:4px;">
            🔍 Preview only — no data is saved or submitted
        </p>
    </div>
</div>
