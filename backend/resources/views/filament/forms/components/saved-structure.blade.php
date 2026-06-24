@php
    $record = $getRecord();
@endphp

@if($record && $record->exists)
    @php
        $record->load('fieldGroups.boxes.fields');
        $groups     = $record->fieldGroups->sortBy('sort_order');
        $isPublished = $record->status === 'published';
        $allFields  = $groups->flatMap(fn($g) => $g->boxes->flatMap(fn($b) => $b->fields))->sortBy('sort_order');
    @endphp

    @if($allFields->isEmpty())
        <div class="text-sm text-gray-400 italic py-6 text-center">
            No fields saved yet. Use "Add Data and Document" below to add fields.
        </div>
    @else
        <div class="space-y-2">
            @foreach($allFields as $field)
                @php $editing = $this->inlineEditFieldId === $field->id; @endphp

                <div class="border rounded-xl overflow-hidden {{ $editing ? 'border-blue-300 ring-2 ring-blue-100 bg-white' : 'border-gray-200 bg-white' }}">

                    {{-- VIEW mode --}}
                    @if(!$editing)
                        <div class="px-3 py-2.5 flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <div class="text-sm font-semibold text-gray-800 truncate">
                                    {{ $field->label ?: 'Untitled' }}
                                </div>
                                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span class="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{{ $field->field_type }}</span>
                                    <span class="text-[10px] text-gray-400">{{ match($field->box_size) { 'full' => '100%', 'middle' => '50%', default => '25%' } }}</span>
                                    @if($field->is_required) <span class="text-[10px] bg-red-100 text-red-500 px-1 rounded">required</span> @endif
                                    @if($field->requires_document) <span class="text-[10px] bg-amber-100 text-amber-600 px-1 rounded">📎</span> @endif
                                </div>
                            </div>
                            <div class="flex items-center gap-1.5 ml-2 shrink-0">
                                <button wire:click="openEditField({{ $field->id }})" type="button"
                                    class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                    ✏ Edit
                                </button>
                                <button wire:click="deleteField({{ $field->id }})"
                                    wire:confirm="Delete this field?"
                                    type="button"
                                    class="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                    ✕
                                </button>
                            </div>
                        </div>

                    {{-- EDIT mode — inline, same card --}}
                    @else
                        <div class="px-3 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                            <span class="text-xs font-semibold text-blue-700">Editing field</span>
                            <div class="flex gap-2">
                                <button wire:click="saveInlineField" type="button"
                                    class="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded-lg">
                                    Save
                                </button>
                                <button wire:click="cancelEditField" type="button"
                                    class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
                                    Cancel
                                </button>
                            </div>
                        </div>
                        <div class="p-3 space-y-2">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <div class="text-[10px] text-gray-500 mb-0.5">Label</div>
                                    <input type="text" wire:model="inlineEditFieldData.label"
                                        class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                                        placeholder="Field name" />
                                </div>
                                <div>
                                    <div class="text-[10px] text-gray-500 mb-0.5">Type</div>
                                    <select wire:model="inlineEditFieldData.field_type"
                                        class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white">
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                        <option value="select">Dropdown</option>
                                        <option value="textarea">Textarea</option>
                                        <option value="file">File Upload</option>
                                    </select>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <div class="text-[10px] text-gray-500 mb-0.5">Width</div>
                                    <select wire:model="inlineEditFieldData.box_size"
                                        class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white">
                                        <option value="small">Small 25%</option>
                                        <option value="middle">Half 50%</option>
                                        <option value="full">Full 100%</option>
                                    </select>
                                </div>
                                <div>
                                    <div class="text-[10px] text-gray-500 mb-0.5">Placeholder</div>
                                    <input type="text" wire:model="inlineEditFieldData.placeholder"
                                        class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                                        placeholder="e.g. Enter value" />
                                </div>
                            </div>
                            @if(($this->inlineEditFieldData['field_type'] ?? '') === 'select')
                                <div>
                                    <div class="text-[10px] text-gray-500 mb-0.5">Options (comma separated)</div>
                                    <input type="text" wire:model="inlineEditFieldData.options"
                                        class="w-full border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                                        placeholder="Male, Female, Other" />
                                </div>
                            @endif
                            <div class="flex gap-4 pt-1">
                                <label class="flex items-center gap-1 text-[10px] text-gray-600 cursor-pointer">
                                    <input type="checkbox" wire:model="inlineEditFieldData.is_required" class="rounded border-gray-300 w-3 h-3" />
                                    Required
                                </label>
                                <label class="flex items-center gap-1 text-[10px] text-gray-600 cursor-pointer">
                                    <input type="checkbox" wire:model="inlineEditFieldData.requires_document" class="rounded border-gray-300 w-3 h-3" />
                                    Has Document
                                </label>
                                @if($this->inlineEditFieldData['requires_document'] ?? false)
                                    <label class="flex items-center gap-1 text-[10px] text-gray-600 cursor-pointer">
                                        <input type="checkbox" wire:model="inlineEditFieldData.document_required" class="rounded border-gray-300 w-3 h-3" />
                                        Mandatory
                                    </label>
                                @endif
                            </div>
                        </div>
                    @endif

                </div>
            @endforeach
        </div>
    @endif

    {{-- Publish --}}
    <div class="pt-3 border-t border-gray-200 mt-3">
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
@endif
