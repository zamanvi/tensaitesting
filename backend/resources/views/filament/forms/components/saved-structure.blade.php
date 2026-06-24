@php
    $record = $getRecord();
@endphp

@if($record && $record->exists)
    @php
        $record->load('fieldGroups.boxes.fields');
        $groups = $record->fieldGroups->sortBy('sort_order');
        $isPublished = $record->status === 'published';
    @endphp

    @if($groups->isEmpty())
        <div class="text-sm text-gray-400 italic py-6 text-center">
            No fields saved yet. Use "Add Data and Document" below to add fields.
        </div>
    @else
        <div class="space-y-3">
            @foreach($groups as $group)
                @php $isAppFormInfo = $loop->first && in_array($group->label, ['Application Form Info', '']); @endphp
                @php $editing = $this->inlineEditGroupId === $group->id; @endphp

                <div class="border rounded-xl bg-white shadow-sm overflow-hidden {{ $editing ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200' }}">

                    {{-- Header --}}
                    <div class="px-4 py-2.5 flex items-center justify-between {{ $editing ? 'bg-blue-50 border-b border-blue-200' : 'bg-gray-50 border-b border-gray-200' }}">

                        {{-- Title: editable or static --}}
                        @if($editing && !$isAppFormInfo)
                            <input type="text" wire:model="inlineEditLabel"
                                class="flex-1 mr-3 border border-blue-300 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                                placeholder="Group title" />
                        @else
                            <span class="font-semibold text-sm {{ $editing ? 'text-blue-800' : 'text-gray-800' }}">
                                {{ $group->label ?: 'Application Form Info' }}
                            </span>
                        @endif

                        <div class="flex items-center gap-2 shrink-0">
                            @if($editing)
                                <button wire:click="saveInlineGroup" type="button"
                                    class="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded-lg transition-colors">
                                    Save
                                </button>
                                <button wire:click="cancelInlineEdit" type="button"
                                    class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                                    Cancel
                                </button>
                            @else
                                <span class="text-xs text-gray-400">
                                    {{ $group->boxes->sum(fn($b) => $b->fields->count()) }} field(s)
                                </span>
                                @if($isAppFormInfo)
                                    <button onclick="window.scrollTo({top:0,behavior:'smooth'})" type="button"
                                        class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50">
                                        ✏ Edit
                                    </button>
                                @else
                                    <button wire:click="openEditFieldGroup({{ $group->id }})" type="button"
                                        class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50">
                                        ✏ Edit
                                    </button>
                                @endif
                                <button wire:click="deleteFieldGroup({{ $group->id }})"
                                    wire:confirm="Delete this group and all its fields?"
                                    type="button"
                                    class="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50">
                                    ✕ Delete
                                </button>
                            @endif
                        </div>
                    </div>

                    {{-- Body --}}
                    <div class="p-3">

                        {{-- VIEW mode: show field chips --}}
                        @if(!$editing)
                            @php $allFields = $group->boxes->flatMap(fn($b) => $b->fields)->sortBy('sort_order'); @endphp
                            @if($allFields->isEmpty())
                                <p class="text-xs text-gray-400 italic">No input fields in this group.</p>
                            @else
                                <div class="flex flex-wrap gap-2">
                                    @foreach($allFields as $field)
                                        @php $width = match($field->box_size) { 'full' => '100%', 'middle' => 'calc(50% - 4px)', default => 'calc(25% - 6px)' }; @endphp
                                        <div style="width:{{ $width }}" class="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                            <div class="text-xs font-semibold text-gray-700 truncate">{{ $field->label ?: 'Untitled' }}</div>
                                            <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                <span class="text-[10px] text-gray-400">{{ $field->field_type }}</span>
                                                @if($field->is_required) <span class="text-[10px] bg-red-100 text-red-500 px-1 rounded">req</span> @endif
                                                @if($field->requires_document) <span class="text-[10px] bg-amber-100 text-amber-600 px-1 rounded">📎</span> @endif
                                            </div>
                                        </div>
                                    @endforeach
                                </div>
                            @endif

                        {{-- EDIT mode: same chips but editable + add button --}}
                        @else
                            <div class="space-y-2">
                                @foreach($this->inlineEditFields as $fi => $fData)
                                    <div class="border border-gray-200 rounded-lg p-2.5 bg-gray-50">
                                        <div class="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <div class="text-[10px] text-gray-400 mb-0.5">Label</div>
                                                <input type="text" wire:model="inlineEditFields.{{ $fi }}.label"
                                                    class="w-full border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                                                    placeholder="Field name" />
                                            </div>
                                            <div>
                                                <div class="text-[10px] text-gray-400 mb-0.5">Type</div>
                                                <select wire:model="inlineEditFields.{{ $fi }}.field_type"
                                                    class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white">
                                                    <option value="text">Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="date">Date</option>
                                                    <option value="select">Dropdown</option>
                                                    <option value="textarea">Textarea</option>
                                                    <option value="file">File Upload</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <div class="text-[10px] text-gray-400 mb-0.5">Width</div>
                                                <select wire:model="inlineEditFields.{{ $fi }}.box_size"
                                                    class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white">
                                                    <option value="small">Small 25%</option>
                                                    <option value="middle">Half 50%</option>
                                                    <option value="full">Full 100%</option>
                                                </select>
                                            </div>
                                            <div>
                                                <div class="text-[10px] text-gray-400 mb-0.5">Placeholder</div>
                                                <input type="text" wire:model="inlineEditFields.{{ $fi }}.placeholder"
                                                    class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                                                    placeholder="e.g. Enter value" />
                                            </div>
                                        </div>
                                        @if(($fData['field_type'] ?? '') === 'select')
                                            <div class="mb-2">
                                                <div class="text-[10px] text-gray-400 mb-0.5">Options (comma separated)</div>
                                                <input type="text" wire:model="inlineEditFields.{{ $fi }}.options"
                                                    class="w-full border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                                                    placeholder="Male, Female, Other" />
                                            </div>
                                        @endif
                                        <div class="flex items-center justify-between">
                                            <div class="flex gap-3">
                                                <label class="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                                                    <input type="checkbox" wire:model="inlineEditFields.{{ $fi }}.is_required" class="rounded border-gray-300 w-3 h-3" />
                                                    Required
                                                </label>
                                                <label class="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                                                    <input type="checkbox" wire:model="inlineEditFields.{{ $fi }}.requires_document" class="rounded border-gray-300 w-3 h-3" />
                                                    Has Doc
                                                </label>
                                                @if($fData['requires_document'] ?? false)
                                                    <label class="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer">
                                                        <input type="checkbox" wire:model="inlineEditFields.{{ $fi }}.document_required" class="rounded border-gray-300 w-3 h-3" />
                                                        Mandatory
                                                    </label>
                                                @endif
                                            </div>
                                            <button wire:click="removeInlineField({{ $fi }})" type="button"
                                                class="text-[10px] text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50">
                                                ✕ Remove
                                            </button>
                                        </div>
                                    </div>
                                @endforeach

                                <button wire:click="addInlineField" type="button"
                                    class="w-full border-2 border-dashed border-gray-300 hover:border-green-400 text-xs text-gray-400 hover:text-green-600 py-2 rounded-lg transition-colors font-medium">
                                    + Add Field
                                </button>
                            </div>
                        @endif
                    </div>
                </div>
            @endforeach

            {{-- Publish --}}
            <div class="pt-2 border-t border-gray-200">
                @if($isPublished)
                    <div class="flex items-center gap-2 text-sm text-green-600 font-medium py-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Form is Published — Live to branches
                    </div>
                @else
                    <button wire:click="publishTemplate()"
                        wire:confirm="Submit and publish this form? Branches will be able to use it."
                        type="button"
                        class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors">
                        Submit &amp; Publish Form
                    </button>
                @endif
            </div>
        </div>
    @endif
@endif
