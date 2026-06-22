@php
    $record->load('fieldGroups.boxes.fields');
    $groups = $record->fieldGroups->sortBy('sort_order');
    $totalGroups = $groups->count();
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
</style>

<div class="tpf-root" style="font-family:'Inter',system-ui,sans-serif;background:#f8fafc;border-radius:16px;overflow:hidden;min-width:0;">

    {{-- ══ HERO HEADER ══ --}}
    <div style="background:linear-gradient(135deg,#064e3b 0%,#065f46 40%,#047857 100%);padding:32px 32px 28px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.06);pointer-events:none;"></div>
        <div style="position:absolute;bottom:-20px;left:60px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.04);pointer-events:none;"></div>

        <div style="position:relative;z-index:1;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
                <div style="width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🌏</div>
                <div>
                    <p style="color:rgba(255,255,255,.55);font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0;">Application Form</p>
                    <h1 style="color:#fff;font-size:21px;font-weight:700;margin:3px 0 0;line-height:1.2;">{{ $record->name ?: 'Untitled Form' }}</h1>
                </div>
            </div>

            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                @if($record->country)
                <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.9);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:500;">🏳️ {{ $record->country }}</span>
                @endif
                @if($record->visa_type)
                <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.9);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:500;">🪪 {{ $record->visa_type }}</span>
                @endif
                @if($record->intake_options)
                <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);color:rgba(255,255,255,.9);border-radius:20px;padding:4px 12px;font-size:12px;font-weight:500;">📅 {{ implode(', ', $record->intake_options ?? []) }}</span>
                @endif
            </div>
        </div>

        @if($totalGroups > 1)
        <div style="margin-top:20px;">
            <div style="display:flex;align-items:center;gap:4px;">
                @foreach($groups as $i => $g)
                <div style="flex:1;height:3px;border-radius:2px;background:{{ $i === 0 ? '#6ee7b7' : 'rgba(255,255,255,.2)' }};"></div>
                @endforeach
            </div>
            <p style="color:rgba(255,255,255,.45);font-size:11px;margin:5px 0 0;">{{ $totalGroups }} sections to complete</p>
        </div>
        @endif
    </div>

    {{-- ══ BODY ══ --}}
    <div style="padding:24px 28px 32px;">

        @if($groups->isEmpty())
        <div style="text-align:center;padding:48px 24px;color:#94a3b8;">
            <div style="font-size:42px;margin-bottom:12px;opacity:.35;">📋</div>
            <p style="font-size:14px;font-weight:600;color:#64748b;margin:0;">No fields added yet</p>
            <p style="font-size:13px;color:#94a3b8;margin:4px 0 0;">Use the form builder to add sections and fields.</p>
        </div>

        @else
        <div style="display:flex;flex-direction:column;gap:20px;">
            @foreach($groups as $gi => $group)
            <div style="background:#fff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);">

                {{-- Section header --}}
                <div style="display:flex;align-items:center;gap:10px;padding:14px 20px;background:linear-gradient(90deg,#f0fdf4,#f8fafc);border-bottom:1px solid #e2e8f0;">
                    <span style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{{ $gi + 1 }}</span>
                    <h3 style="font-size:14px;font-weight:700;color:#1e293b;margin:0;">{{ $group->label ?: 'Section ' . ($gi + 1) }}</h3>
                </div>

                <div style="padding:20px;display:flex;flex-direction:column;gap:16px;">
                    @foreach($group->boxes->sortBy('sort_order') as $box)
                    @php
                        $fields = $box->fields->sortBy('sort_order')->where('is_active', true);
                        $hasDoc = $box->requires_document;
                    @endphp
                    @if($fields->isNotEmpty() || $hasDoc)
                    <div>
                        @if($fields->isNotEmpty())
                        <div style="display:flex;flex-wrap:wrap;gap:12px;">
                            @foreach($fields as $field)
                            @php
                                $w = match($field->box_size) {
                                    'full'   => '100%',
                                    'middle' => 'calc(50% - 6px)',
                                    default  => 'calc(25% - 9px)',
                                };
                            @endphp
                            <div style="width:{{ $w }};min-width:120px;display:flex;flex-direction:column;gap:5px;">
                                <label style="font-size:12px;font-weight:600;color:#374151;display:flex;align-items:center;gap:3px;">
                                    {{ $field->label ?: 'Untitled' }}
                                    @if($field->is_required)<span style="color:#ef4444;font-size:14px;line-height:1;">*</span>@endif
                                </label>

                                @if($field->field_type === 'textarea')
                                <textarea placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label ?: 'text') . '…' }}" rows="3"
                                    style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;color:#374151;background:#fafafa;resize:vertical;font-family:inherit;"></textarea>

                                @elseif($field->field_type === 'select')
                                <select style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;color:#374151;background:#fafafa;cursor:pointer;">
                                    <option value="" disabled selected>{{ $field->placeholder ?: 'Select ' . strtolower($field->label ?: 'option') . '…' }}</option>
                                    @foreach($field->options ?? [] as $opt)
                                    <option value="{{ $opt }}">{{ $opt }}</option>
                                    @endforeach
                                </select>

                                @elseif($field->field_type === 'file')
                                <div class="tpf-file-drop" style="border:2px dashed #cbd5e1;border-radius:10px;padding:16px;text-align:center;background:#f8fafc;cursor:pointer;transition:all .2s;">
                                    <div style="font-size:22px;margin-bottom:4px;">📎</div>
                                    <p style="font-size:12px;font-weight:600;color:#64748b;margin:0;">{{ $field->placeholder ?: 'Click to upload' }}</p>
                                    @if($field->helper_text)<p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">{{ $field->helper_text }}</p>@endif
                                </div>

                                @else
                                <input type="{{ in_array($field->field_type, ['number','date','email','tel']) ? $field->field_type : 'text' }}"
                                    placeholder="{{ $field->placeholder ?: 'Enter ' . strtolower($field->label ?: 'value') . '…' }}"
                                    style="width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:13px;color:#374151;background:#fafafa;"/>
                                @endif

                                @if($field->helper_text && $field->field_type !== 'file')
                                <p style="font-size:11px;color:#94a3b8;margin:0;">{{ $field->helper_text }}</p>
                                @endif

                                @if($field->requires_document && $field->field_type !== 'file')
                                <div style="border:1.5px dashed {{ $field->document_required ? '#fca5a5' : '#fcd34d' }};border-radius:8px;padding:8px 10px;background:{{ $field->document_required ? '#fff7f7' : '#fffbeb' }};display:flex;align-items:center;gap:6px;margin-top:2px;">
                                    <span style="font-size:13px;">📎</span>
                                    <span style="font-size:11px;color:{{ $field->document_required ? '#dc2626' : '#d97706' }};font-weight:500;">
                                        Document upload {{ $field->document_required ? '(Required)' : '(Optional)' }}
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
        </div>

        {{-- ══ SUBMIT ══ --}}
        <div style="margin-top:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:20px;border-top:1px solid #e2e8f0;">
            <p style="font-size:12px;color:#94a3b8;margin:0;">
                <span style="color:#ef4444;">*</span> Required fields must be completed before submitting.
            </p>
            <button type="button"
                style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#16a34a,#059669);color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,.3);letter-spacing:.01em;"
                onmouseover="this.style.opacity='.88'" onmouseout="this.style.opacity='1'">
                <svg style="width:16px;height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Submit Application
            </button>
        </div>
        @endif
    </div>
</div>
