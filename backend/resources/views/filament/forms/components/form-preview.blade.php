@php
    $record->load('fieldGroups.boxes.fields');
    $groups     = $record->fieldGroups->sortBy('sort_order')
                      ->filter(fn($g) => $g->label !== 'Application Form Info' && $g->is_active)
                      ->values(); // re-index so $loop->iteration works correctly
    $intakes    = $record->intake_options ?? [];
    $educations = $record->educations ?? [];
@endphp

<style>
.pf *{box-sizing:border-box;margin:0;padding:0;}
.pf{font-family:'Inter',system-ui,sans-serif;color:#111827;background:#fff;}
.pf-inp{
    width:100%;border:1px solid #d1d5db;border-radius:6px;
    padding:8px 11px;font-size:14px;color:#111827;background:#fff;
    font-family:inherit;-webkit-appearance:none;appearance:none;
}
.pf-inp:focus{outline:2px solid #16a34a;outline-offset:-1px;}
.pf-inp::placeholder{color:#9ca3af;}
.pf-ro{background:#f3f4f6!important;color:#6b7280!important;}
.pf-label{display:block;font-size:13px;font-weight:600;color:#111827;margin-bottom:5px;}
.pf-hint{font-size:11.5px;color:#6b7280;margin-top:3px;}
.pf-req{color:#dc2626;}
.pf-opt{font-weight:400;font-size:11.5px;color:#9ca3af;margin-left:3px;}
.pf-field{display:flex;flex-direction:column;gap:0;}
.pf-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.pf-grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.pf-full{grid-column:1/-1;}
.pf-section{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:16px;}
.pf-section:last-of-type{margin-bottom:0;}
.pf-sec-head{padding:12px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:10px;}
.pf-sec-num{width:26px;height:26px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pf-sec-title{font-size:14px;font-weight:600;color:#111827;}
.pf-sec-body{padding:16px;}
.pf-upload{border:1.5px dashed #d1d5db;border-radius:6px;padding:18px;text-align:center;background:#f9fafb;cursor:pointer;color:#6b7280;font-size:13px;}
.pf-upload:hover{border-color:#6b7280;background:#f3f4f6;}
select.pf-inp{cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;background-size:16px;padding-right:32px;}
textarea.pf-inp{resize:vertical;}
@media(max-width:540px){.pf-grid,.pf-grid3{grid-template-columns:1fr;}}
</style>

<div class="pf">

    {{-- Form headline --}}
    <div style="padding:0;border-bottom:1px solid #e5e7eb;overflow:hidden;">
        {{-- Green accent bar --}}
        <div style="height:4px;background:linear-gradient(90deg,#16a34a,#22c55e);"></div>
        <div style="padding:18px 22px 16px;background:#fff;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
                        <span style="background:#dcfce7;color:#15803d;font-size:10.5px;font-weight:700;padding:2px 9px;border-radius:99px;text-transform:uppercase;letter-spacing:.06em;">Application Form</span>
                        @if($record->status === 'published')
                        <span style="background:#f0fdf4;color:#16a34a;font-size:10.5px;font-weight:600;padding:2px 9px;border-radius:99px;border:1px solid #bbf7d0;">● Live</span>
                        @endif
                    </div>
                    <h2 style="font-size:20px;font-weight:800;color:#111827;line-height:1.2;margin-bottom:6px;padding-bottom:8px;border-bottom:2px solid #16a34a;display:block;width:100%;">{{ $record->name ?: 'Application Form' }}</h2>
                    @if($record->country || $record->visa_type)
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        @if($record->country)
                        <span style="display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:600;color:#374151;">
                            <svg style="width:13px;height:13px;color:#6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21l1.65-3.8a9 9 0 1113.4-13.4L21 3"/></svg>
                            {{ $record->country }}
                        </span>
                        @endif
                        @if($record->country && $record->visa_type)<span style="color:#d1d5db;">·</span>@endif
                        @if($record->visa_type)
                        <span style="font-size:12.5px;color:#6b7280;">{{ $record->visa_type }}</span>
                        @endif
                    </div>
                    @endif
                </div>
                @if(count($intakes))
                <div style="text-align:right;">
                    <p style="font-size:10.5px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Available Intakes</p>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;">
                        @foreach(array_slice($intakes,0,3) as $intake)
                        <span style="background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:500;padding:2px 8px;border-radius:99px;border:1px solid #bfdbfe;">{{ $intake }}</span>
                        @endforeach
                        @if(count($intakes)>3)<span style="font-size:11px;color:#9ca3af;">+{{ count($intakes)-3 }} more</span>@endif
                    </div>
                </div>
                @endif
            </div>
        </div>
    </div>

    <div style="padding:16px 20px 20px;display:flex;flex-direction:column;gap:16px;">

        {{-- ── Personal Information ── --}}
        <div class="pf-section">
            <div class="pf-sec-head">
                <span class="pf-sec-num">1</span>
                <span class="pf-sec-title">Personal Information</span>
            </div>
            <div class="pf-sec-body">
                <div class="pf-grid" style="gap:14px;">

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
                    <div class="pf-field">
                        <label class="pf-label">Select Intake <span class="pf-req">*</span></label>
                        <select class="pf-inp">
                            <option value="" disabled selected>Choose intake…</option>
                            @foreach($intakes as $i)
                            <option>{{ $i }}</option>
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
                    <p style="font-size:12.5px;font-weight:600;color:#374151;margin-bottom:12px;">Education Certificates</p>
                    <div style="display:flex;flex-direction:column;gap:12px;">
                        @foreach($educations as $edu)
                        @php $req = ($edu['mandatory'] ?? false) || ($edu['is_mandatory'] ?? false); @endphp
                        <div style="border:1px solid {{ $req ? '#fca5a5' : '#e5e7eb' }};border-radius:6px;overflow:hidden;">
                            <div style="padding:9px 14px;background:{{ $req ? '#fef2f2' : '#f9fafb' }};border-bottom:1px solid {{ $req ? '#fecaca' : '#e5e7eb' }};display:flex;justify-content:space-between;align-items:center;">
                                <span style="font-size:13px;font-weight:600;color:#111827;">
                                    {{ ucwords(str_replace('_', ' ', $edu['level'] ?? 'Certificate')) }}
                                    @if($req)<span class="pf-req"> *</span>@endif
                                </span>
                                <span style="font-size:11px;font-weight:500;color:{{ $req ? '#dc2626' : '#6b7280' }};">{{ $req ? 'Required' : 'Optional' }}</span>
                            </div>
                            <div style="padding:14px;">
                                <div class="pf-grid3" style="margin-bottom:12px;">
                                    <div class="pf-field">
                                        <label class="pf-label">Institution</label>
                                        <input class="pf-inp" type="text" placeholder="e.g. Dhaka College" />
                                    </div>
                                    <div class="pf-field">
                                        <label class="pf-label">Result / GPA</label>
                                        <input class="pf-inp" type="text" placeholder="e.g. 5.00" />
                                    </div>
                                    <div class="pf-field">
                                        <label class="pf-label">Passing Year</label>
                                        <input class="pf-inp" type="number" placeholder="e.g. 2022" />
                                    </div>
                                </div>
                                <div class="pf-upload">
                                    📎 Upload Certificate{{ $req ? ' (Required)' : ' (Optional)' }}
                                    <br><span style="font-size:11.5px;color:#9ca3af;">PDF or image · Max 5 MB</span>
                                </div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
                @endif
            </div>
        </div>

        {{-- ── Dynamic Sections ── --}}
        @foreach($groups as $group)
        <div class="pf-section">
            <div class="pf-sec-head">
                <span class="pf-sec-num" style="background:#2563eb;">{{ $loop->iteration + 1 }}</span>
                <div>
                    <span class="pf-sec-title">{{ $group->label }}</span>
                    @if($group->hint)
                    <p style="font-size:12px;color:#6b7280;margin-top:2px;">{{ $group->hint }}</p>
                    @endif
                </div>
            </div>

            <div class="pf-sec-body" style="display:flex;flex-direction:column;gap:14px;">
                @foreach($group->boxes->sortBy('sort_order') as $box)
                @php $fields = $box->fields->where('is_active', true)->sortBy('sort_order'); @endphp

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
                    <div class="pf-field" style="width:{{ $w }};min-width:140px;flex:1 1 {{ $w }};">
                        <label class="pf-label">
                            {{ $field->label }}
                            @if($field->is_required)
                                <span class="pf-req"> *</span>
                            @else
                                <span class="pf-opt">optional</span>
                            @endif
                        </label>

                        @if($field->field_type === 'textarea')
                            <textarea class="pf-inp" rows="3"
                                placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label) . '…' }}"></textarea>
                        @elseif($field->field_type === 'select')
                            <select class="pf-inp">
                                <option value="" disabled selected>{{ $field->placeholder ?: 'Choose…' }}</option>
                                @foreach($field->options ?? [] as $opt)
                                <option>{{ $opt }}</option>
                                @endforeach
                            </select>
                        @elseif($field->field_type === 'file')
                            <div class="pf-upload">
                                📎 {{ $field->placeholder ?: 'Click to upload' }}
                                @if($field->helper_text)
                                <br><span style="font-size:11.5px;color:#9ca3af;">{{ $field->helper_text }}</span>
                                @else
                                <br><span style="font-size:11.5px;color:#9ca3af;">PDF or image · Max 5 MB</span>
                                @endif
                            </div>
                        @else
                            <input class="pf-inp"
                                type="{{ in_array($field->field_type, ['number','date','email','tel']) ? $field->field_type : 'text' }}"
                                placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label) . '…' }}" />
                        @endif

                        @if($field->helper_text && $field->field_type !== 'file')
                        <span class="pf-hint">{{ $field->helper_text }}</span>
                        @endif
                    </div>
                    @endforeach
                </div>
                @endif

                @if($box->requires_document)
                <div class="pf-upload" style="border-color:{{ $box->document_required ? '#fca5a5' : '#d1d5db' }};background:{{ $box->document_required ? '#fef2f2' : '#f9fafb' }};color:{{ $box->document_required ? '#dc2626' : '#6b7280' }};">
                    📂 {{ $box->doc_label ?: 'Upload Document' }}{{ $box->document_required ? ' *' : '' }}
                    <br><span style="font-size:11.5px;color:#9ca3af;">{{ $box->document_required ? 'Required' : 'Optional' }} · PDF or image · Max 5 MB</span>
                </div>
                @endif

                @endforeach
            </div>
        </div>
        @endforeach

        {{-- ── Submit ── --}}
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:8px;">
            <p style="font-size:12.5px;color:#6b7280;"><span class="pf-req">*</span> Required fields</p>
            <button type="button"
                style="background:#16a34a;color:#fff;font-size:14px;font-weight:600;padding:10px 24px;border-radius:6px;border:none;cursor:pointer;font-family:inherit;">
                Submit Application
            </button>
        </div>

        <p style="text-align:center;font-size:11px;color:#d1d5db;">Preview only — no data is saved</p>
    </div>
</div>
