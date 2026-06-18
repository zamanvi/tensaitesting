@php
    $record->load('fieldGroups.boxes.fields');
    $groups = $record->fieldGroups->sortBy('sort_order');
@endphp

<div class="space-y-6 p-2">

    {{-- Form header --}}
    <div class="bg-gradient-to-r from-green-50 to-slate-50 border border-green-200 rounded-xl p-5">
        <div class="flex items-center gap-3 mb-1">
            <span class="text-2xl">🌏</span>
            <h2 class="text-xl font-bold text-gray-800">{{ $record->name }}</h2>
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-500 ml-9">
            <span>🏳️ {{ $record->country }}</span>
            @if($record->visa_type)
                <span>🪪 {{ $record->visa_type }}</span>
            @endif
            @if($record->intake_options)
                <span>📅 Intakes: {{ implode(', ', $record->intake_options ?? []) }}</span>
            @endif
        </div>
    </div>

    @if($groups->isEmpty())
        <div class="text-center py-12 text-gray-400 italic">
            No fields saved yet. Add fields using "Add Data and Document" below.
        </div>
    @else
        @foreach($groups as $group)
            <div class="border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                {{-- Group header --}}
                <div class="bg-gray-50 border-b border-gray-200 px-5 py-3">
                    <h3 class="font-semibold text-gray-800 text-base">
                        {{ $group->label ?: 'Untitled Section' }}
                    </h3>
                </div>

                <div class="p-5 space-y-5">
                    @foreach($group->boxes->sortBy('sort_order') as $box)
                        @if($box->fields->isNotEmpty())
                            <div class="space-y-3">
                                {{-- Box separator if multiple boxes --}}
                                @if(!$loop->first)
                                    <hr class="border-gray-100"/>
                                @endif

                                <div class="flex flex-wrap gap-4">
                                    @foreach($box->fields->sortBy('sort_order') as $field)
                                        @php
                                            $width = match($field->box_size) {
                                                'full'   => '100%',
                                                'middle' => 'calc(50% - 8px)',
                                                default  => 'calc(25% - 12px)',
                                            };
                                        @endphp
                                        <div style="width: {{ $width }}; min-width: 140px;" class="flex flex-col gap-1">
                                            <label class="text-sm font-medium text-gray-700">
                                                {{ $field->label ?: 'Untitled' }}
                                                @if($field->is_required)
                                                    <span class="text-red-500 ml-0.5">*</span>
                                                @endif
                                            </label>

                                            @if($field->field_type === 'textarea')
                                                <textarea
                                                    placeholder="{{ $field->placeholder ?: '' }}"
                                                    rows="3"
                                                    disabled
                                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 resize-none cursor-not-allowed"></textarea>

                                            @elseif($field->field_type === 'select')
                                                <select disabled
                                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed">
                                                    <option>{{ $field->placeholder ?: 'Select...' }}</option>
                                                    @foreach($field->options ?? [] as $opt)
                                                        <option>{{ $opt }}</option>
                                                    @endforeach
                                                </select>

                                            @elseif($field->field_type === 'file' || $field->requires_document)
                                                <div class="border-2 border-dashed border-gray-300 rounded-lg px-3 py-3 bg-gray-50 text-center">
                                                    <div class="text-gray-400 text-xs">
                                                        📎 Upload document
                                                        @if($field->document_required ?? false)
                                                            <span class="text-red-400 font-medium ml-1">(Mandatory)</span>
                                                        @else
                                                            <span class="text-gray-400 ml-1">(Optional)</span>
                                                        @endif
                                                    </div>
                                                </div>

                                            @else
                                                <input
                                                    type="{{ $field->field_type === 'number' ? 'number' : ($field->field_type === 'date' ? 'date' : 'text') }}"
                                                    placeholder="{{ $field->placeholder ?: '' }}"
                                                    disabled
                                                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"/>
                                            @endif

                                            @if($field->helper_text)
                                                <p class="text-xs text-gray-400">{{ $field->helper_text }}</p>
                                            @endif

                                            @if($field->requires_document && $field->field_type !== 'file')
                                                <div class="border border-dashed border-amber-300 rounded-lg px-2 py-2 bg-amber-50 text-center mt-1">
                                                    <span class="text-xs text-amber-600">
                                                        📎 Document upload
                                                        {{ ($field->document_required ?? false) ? '(Mandatory)' : '(Optional)' }}
                                                    </span>
                                                </div>
                                            @endif
                                        </div>
                                    @endforeach
                                </div>
                            </div>
                        @endif
                    @endforeach
                </div>
            </div>
        @endforeach

        {{-- Submit button preview --}}
        <div class="flex justify-end pt-2">
            <button disabled
                class="bg-green-600 text-white font-semibold text-sm px-8 py-2.5 rounded-xl opacity-70 cursor-not-allowed">
                Submit Application
            </button>
        </div>
    @endif
</div>
