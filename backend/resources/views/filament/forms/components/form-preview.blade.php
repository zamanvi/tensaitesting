@php
    $record->load('fieldGroups.boxes.fields');
    $groups     = $record->fieldGroups->sortBy('sort_order')
                      ->filter(fn($g) => $g->label !== 'Application Form Info' && $g->is_active)
                      ->values();
    $intakes    = $record->intake_options ?? [];
    $educations = $record->educations ?? [];
@endphp

<style>
.pf *{box-sizing:border-box;margin:0;padding:0;}
.pf{font-family:'Inter',system-ui,sans-serif;color:#111827;background:#fff;font-size:14px;}

/* Inputs */
.pf-inp{width:100%;border:1px solid #d1d5db;border-radius:6px;padding:9px 12px;font-size:14px;color:#111827;background:#fff;font-family:inherit;-webkit-appearance:none;appearance:none;transition:border-color .15s;}
.pf-inp:focus{outline:none;border-color:#16a34a;box-shadow:0 0 0 3px rgba(22,163,74,.1);}
.pf-inp::placeholder{color:#9ca3af;}
.pf-ro{background:#f3f4f6!important;color:#6b7280!important;cursor:not-allowed;}
select.pf-inp{cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;background-size:16px;padding-right:32px;}
textarea.pf-inp{resize:vertical;}

/* Labels */
.pf-label{display:block;font-size:12.5px;font-weight:600;color:#374151;margin-bottom:5px;}
.pf-hint{font-size:11px;color:#6b7280;margin-top:3px;}
.pf-req{color:#dc2626;}
.pf-opt{font-weight:400;font-size:11px;color:#9ca3af;margin-left:3px;}
.pf-field{display:flex;flex-direction:column;}

/* Grid */
.pf-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.pf-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.pf-full{grid-column:1/-1;}

/* Sections */
.pf-section{border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:14px;}
.pf-section:last-of-type{margin-bottom:0;}
.pf-sec-head{padding:11px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:10px;}
.pf-sec-num{width:26px;height:26px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pf-sec-title{font-size:14px;font-weight:600;color:#111827;}
.pf-sec-body{padding:16px;}

/* Upload */
.pf-upload{border:1.5px dashed #d1d5db;border-radius:6px;padding:16px;text-align:center;background:#f9fafb;color:#6b7280;font-size:13px;}

/* Edu card */
.pf-edu{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:10px;}
.pf-edu:last-child{margin-bottom:0;}
.pf-edu-head{padding:8px 14px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;}
.pf-edu-head.req{background:#fef2f2;border-bottom-color:#fecaca;}
.pf-edu-body{padding:12px 14px;}

/* Submit area */
.pf-submit-bar{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.pf-btn-draft{background:#fff;color:#374151;border:1.5px solid #d1d5db;font-size:13.5px;font-weight:600;padding:9px 20px;border-radius:7px;cursor:pointer;font-family:inherit;}
.pf-btn-submit{background:#16a34a;color:#fff;border:none;font-size:13.5px;font-weight:700;padding:10px 26px;border-radius:7px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:7px;}
.pf-btn-submit:hover{background:#15803d;}

/* Mobile responsive */
@media(max-width:600px){
    .pf-grid,.pf-grid3{grid-template-columns:1fr!important;}
    .pf-full{grid-column:1;}
    .pf-head-inner{flex-direction:column!important;align-items:flex-start!important;}
    .pf-head-intakes{text-align:left!important;margin-top:10px;}
    .pf-head-intakes .pf-intake-pills{justify-content:flex-start!important;}
    .pf-submit-bar{flex-direction:column;align-items:stretch;}
    .pf-btn-draft,.pf-btn-submit{width:100%;justify-content:center;}
    .pf-sec-body{padding:12px;}
    [style*="padding:18px 22px"]{padding:14px 16px!important;}
    .pf-edu-body .pf-grid3{grid-template-columns:1fr!important;}
}
@media(max-width:380px){
    .pf-inp{font-size:13px;padding:8px 10px;}
    .pf-sec-title{font-size:13px;}
}
</style>

<div class="pf">

{{-- ── Headline ─────────────────────────────────────────────────── --}}
<div style="border-bottom:1px solid #e5e7eb;overflow:hidden;">
    <div style="height:4px;background:linear-gradient(90deg,#16a34a,#22c55e 60%,#4ade80);"></div>
    <div style="padding:18px 22px 16px;background:#fff;">
        <div class="pf-head-inner" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">

            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px;flex-wrap:wrap;">
                    <span style="background:#dcfce7;color:#15803d;font-size:10px;font-weight:700;padding:2px 9px;border-radius:99px;text-transform:uppercase;letter-spacing:.07em;">Application Form</span>
                    @if($record->status === 'published')
                    <span style="background:#f0fdf4;color:#16a34a;font-size:10px;font-weight:600;padding:2px 9px;border-radius:99px;border:1px solid #bbf7d0;">● Live</span>
                    @endif
                </div>

                <h2 style="font-size:19px;font-weight:800;color:#111827;line-height:1.25;margin-bottom:0;word-break:break-word;">{{ $record->name ?: 'Application Form' }}</h2>
                <div style="height:2px;background:linear-gradient(90deg,#16a34a,#bbf7d0);width:100%;margin:7px 0 8px;border-radius:2px;"></div>

                @if($record->country || $record->visa_type)
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    @if($record->country)
                    <span style="font-size:12px;font-weight:600;color:#374151;">🌏 {{ $record->country }}</span>
                    @endif
                    @if($record->country && $record->visa_type)<span style="color:#d1d5db;font-size:12px;">·</span>@endif
                    @if($record->visa_type)
                    <span style="font-size:12px;color:#6b7280;">{{ $record->visa_type }}</span>
                    @endif
                </div>
                @endif
            </div>

            @if(count($intakes))
            <div class="pf-head-intakes" style="text-align:right;flex-shrink:0;">
                <p style="font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Available Intakes</p>
                <div class="pf-intake-pills" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;">
                    @foreach(array_slice((array)$intakes,0,4) as $intake)
                    <span style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:500;padding:3px 9px;border-radius:99px;border:1px solid #bfdbfe;">{{ $intake }}</span>
                    @endforeach
                    @if(count($intakes)>4)<span style="font-size:11px;color:#9ca3af;align-self:center;">+{{ count($intakes)-4 }} more</span>@endif
                </div>
            </div>
            @endif

        </div>
    </div>
</div>

{{-- ── Form body ────────────────────────────────────────────────── --}}
<div style="padding:16px 20px 20px;display:flex;flex-direction:column;gap:14px;">

    {{-- 1. Personal Information --}}
    <div class="pf-section">
        <div class="pf-sec-head">
            <span class="pf-sec-num">1</span>
            <span class="pf-sec-title">Personal Information</span>
        </div>
        <div class="pf-sec-body">
            <div class="pf-grid">

                <div class="pf-field">
                    <label class="pf-label">Full Name <span class="pf-req">*</span></label>
                    <input class="pf-inp pf-ro" type="text" value="{{ $record->student_name ?: 'Student Name' }}" readonly />
                    <span class="pf-hint">Auto-filled from profile</span>
                </div>

                <div class="pf-field">
                    <label class="pf-label">Email Address</label>
                    <input class="pf-inp pf-ro" type="email" value="student@email.com" readonly />
                    <span class="pf-hint">Auto-filled from account</span>
                </div>

                <div class="pf-field">
                    <label class="pf-label">Contact Number <span class="pf-req">*</span></label>
                    <input class="pf-inp" type="tel" placeholder="+880 1XXXXXXXXX" />
                </div>

                <div class="pf-field">
                    <label class="pf-label">WhatsApp Number <span class="pf-opt">optional</span></label>
                    <input class="pf-inp" type="tel" placeholder="+880 1XXXXXXXXX" />
                </div>

                <div class="pf-field">
                    <label class="pf-label">Date of Birth</label>
                    <input class="pf-inp{{ $record->birth_date ? ' pf-ro' : '' }}" type="date"
                        value="{{ $record->birth_date ?? '' }}"
                        {{ $record->birth_date ? 'readonly' : '' }} />
                </div>

                <div class="pf-field">
                    <label class="pf-label">Passport Number</label>
                    <input class="pf-inp{{ $record->passport_no ? ' pf-ro' : '' }}" type="text"
                        value="{{ $record->passport_no ?? '' }}"
                        placeholder="e.g. AB1234567"
                        {{ $record->passport_no ? 'readonly' : '' }} />
                </div>

                @if(count($intakes))
                <div class="pf-field pf-full">
                    <label class="pf-label">Select Intake <span class="pf-req">*</span></label>
                    <select class="pf-inp">
                        <option value="" disabled selected>— Choose your intake —</option>
                        @foreach((array)$intakes as $i)
                        <option value="{{ $i }}">{{ $i }}</option>
                        @endforeach
                    </select>
                </div>
                @endif

                <div class="pf-field pf-full">
                    <label class="pf-label">Permanent Address <span class="pf-req">*</span></label>
                    <textarea class="pf-inp" rows="2" placeholder="House, Road, Area, City, Postcode"></textarea>
                </div>

            </div>

            {{-- Education Certificates --}}
            @if(count($educations))
            <div style="margin-top:18px;padding-top:16px;border-top:1px solid #e5e7eb;">
                <p style="font-size:12px;font-weight:700;color:#374151;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;">Education Certificates</p>
                @foreach($educations as $edu)
                @php
                    $req       = ($edu['requirement'] ?? '') === 'mandatory';
                    $levelMap  = ['ssc'=>'SSC / O-Level','hsc'=>'HSC / A-Level','diploma'=>'Diploma','bachelors'=>"Bachelor's",'masters'=>"Master's",'phd'=>'PhD','other'=>'Other'];
                    $lvlLabel  = $levelMap[$edu['level'] ?? ''] ?? ucwords($edu['level'] ?? 'Certificate');
                @endphp
                <div class="pf-edu">
                    <div class="pf-edu-head {{ $req ? 'req' : '' }}">
                        <span style="font-size:13px;font-weight:600;color:#111827;">
                            {{ $lvlLabel }}@if($req)<span class="pf-req"> *</span>@endif
                        </span>
                        <span style="font-size:11px;font-weight:500;color:{{ $req ? '#dc2626' : '#6b7280' }};">{{ $req ? 'Required' : 'Optional' }}</span>
                    </div>
                    <div class="pf-edu-body">
                        <div class="pf-grid3" style="margin-bottom:10px;">
                            <div class="pf-field"><label class="pf-label">Institution</label><input class="pf-inp" type="text" placeholder="e.g. Dhaka College" /></div>
                            <div class="pf-field"><label class="pf-label">Result / GPA</label><input class="pf-inp" type="text" placeholder="e.g. 5.00" /></div>
                            <div class="pf-field"><label class="pf-label">Passing Year</label><input class="pf-inp" type="number" placeholder="e.g. 2022" /></div>
                        </div>
                        <div class="pf-upload">
                            📎 Upload Certificate{{ $req ? ' <strong style="color:#dc2626;">(Required)</strong>' : ' (Optional)' }}
                            <br><span style="font-size:11px;color:#9ca3af;">PDF or image · Max 5 MB</span>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
            @endif
        </div>
    </div>

    {{-- Dynamic Sections --}}
    @foreach($groups as $group)
    <div class="pf-section">
        <div class="pf-sec-head">
            <span class="pf-sec-num" style="background:#2563eb;">{{ $loop->iteration + 1 }}</span>
            <div>
                <span class="pf-sec-title">{{ $group->label }}</span>
                @if($group->hint)<p style="font-size:11px;color:#6b7280;margin-top:1px;">{{ $group->hint }}</p>@endif
            </div>
        </div>

        <div class="pf-sec-body" style="display:flex;flex-direction:column;gap:14px;">
            @foreach($group->boxes->sortBy('sort_order') as $box)
            @php $fields = $box->fields->where('is_active', true)->sortBy('sort_order'); @endphp

            @if($box->name)
            <p style="font-size:11.5px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;padding-bottom:6px;border-bottom:1px solid #f3f4f6;">{{ $box->name }}</p>
            @endif

            @if($fields->isNotEmpty())
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                @foreach($fields as $field)
                @php
                    $span = $field->box_size === 'full' ? 'grid-column:1/-1;' : '';
                @endphp
                <div class="pf-field" style="{{ $span }}">
                    <label class="pf-label">
                        {{ $field->label }}
                        @if($field->is_required)<span class="pf-req"> *</span>@else<span class="pf-opt">optional</span>@endif
                    </label>
                    @if($field->field_type === 'textarea')
                        <textarea class="pf-inp" rows="3" placeholder="{{ $field->placeholder ?: 'Enter '.strtolower($field->label).'…' }}"></textarea>
                    @elseif($field->field_type === 'select')
                        <select class="pf-inp">
                            <option value="" disabled selected>{{ $field->placeholder ?: 'Choose…' }}</option>
                            @foreach($field->options ?? [] as $opt)<option>{{ $opt }}</option>@endforeach
                        </select>
                    @elseif($field->field_type === 'file')
                        <div class="pf-upload">📎 {{ $field->placeholder ?: 'Click to upload' }}<br><span style="font-size:11px;color:#9ca3af;">{{ $field->helper_text ?: 'PDF or image · Max 5 MB' }}</span></div>
                    @else
                        <input class="pf-inp" type="{{ in_array($field->field_type,['number','date','email','tel'])?$field->field_type:'text' }}" placeholder="{{ $field->placeholder ?: 'Enter '.strtolower($field->label).'…' }}" />
                    @endif
                    @if($field->helper_text && $field->field_type !== 'file')<span class="pf-hint">{{ $field->helper_text }}</span>@endif
                </div>
                @endforeach
            </div>
            @endif

            @if($box->requires_document)
            <div class="pf-upload" style="border-color:{{ $box->document_required?'#fca5a5':'#d1d5db' }};background:{{ $box->document_required?'#fef2f2':'#f9fafb' }};">
                📂 {{ $box->doc_label ?: 'Upload Document' }}{{ $box->document_required?' *':'' }}
                <br><span style="font-size:11px;color:#9ca3af;">{{ $box->document_required?'Required':'Optional' }} · PDF or image · Max 5 MB</span>
            </div>
            @endif
            @endforeach
        </div>
    </div>
    @endforeach

    {{-- ── Submit Bar ─────────────────────────────────────────────── --}}
    <div class="pf-submit-bar">
        <p style="font-size:12px;color:#6b7280;"><span class="pf-req">*</span> Required fields must be filled before submitting.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="pf-btn-draft">💾 Save Draft</button>
            <button type="button" class="pf-btn-submit">
                <svg style="width:15px;height:15px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                Submit Application
            </button>
        </div>
    </div>

    <p style="text-align:center;font-size:11px;color:#d1d5db;margin-top:4px;">Preview only — no data is saved</p>
</div>
</div>
