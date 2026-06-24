@php
    $record   = $getRecord();
    $livewire = $getLivewire();
@endphp

@if($record && $record->exists)
    @php
        $record = $record->fresh();
        $record->load('fieldGroups.boxes.fields');
        $groups      = $record->fieldGroups->sortBy('sort_order');
        $isPublished = $record->status === 'published';
        $editingId   = $livewire->inlineEditGroupId ?? null;
    @endphp

    @if($groups->isEmpty())
        <div class="text-sm text-gray-400 italic py-6 text-center">
            No sections saved yet. Fill in Application Form Info and save, or use "Add Data and Document" below.
        </div>
    @else
        <div class="space-y-2">
            @foreach($groups as $group)
                @php
                    $fieldCount = $group->boxes->sum(fn($b) => $b->fields->count());
                    $isEditing  = $editingId === $group->id;
                @endphp

                <div class="border border-gray-200 rounded-xl bg-white overflow-hidden">
                    {{-- Section header --}}
                    <div class="px-3 py-2.5 flex items-center justify-between bg-gray-50 border-b border-gray-100">
                        <div>
                            <div class="text-sm font-semibold text-gray-800">
                                {{ $group->label ?: 'Application Form Info' }}
                            </div>
                            @if($group->hint)
                                <div class="text-[10px] text-gray-400 mt-0.5">{{ $group->hint }}</div>
                            @endif
                        </div>
                        <div class="flex items-center gap-1.5 ml-2 shrink-0">
                            <span class="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {{ $fieldCount }} field(s)
                            </span>
                            @if($isEditing)
                                <button wire:click="cancelInlineEdit" type="button"
                                    class="text-xs text-gray-500 hover:text-gray-700 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                                    ✕ Cancel
                                </button>
                            @else
                                <button wire:click="openEditFieldGroup({{ $group->id }})" type="button"
                                    class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                    ✏ Edit
                                </button>
                                <button wire:click="deleteFieldGroup({{ $group->id }})"
                                    wire:confirm="Delete this section and all its fields?"
                                    type="button"
                                    class="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                    ✕ Delete
                                </button>
                            @endif
                        </div>
                    </div>

                    @if($isEditing)
                        {{-- Inline edit form --}}
                        <div class="p-3 space-y-3">
                            @if($group->label !== 'Application Form Info')
                                <div>
                                    <label class="text-xs font-medium text-gray-600">Section Title</label>
                                    <input type="text" wire:model="inlineEditLabel"
                                        class="mt-1 w-full text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Section title">
                                </div>
                            @endif

                            <div>
                                <div class="flex items-center justify-between mb-2">
                                    <label class="text-xs font-medium text-gray-600">Fields</label>
                                    <button wire:click="addInlineField" type="button"
                                        class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                        + Add Field
                                    </button>
                                </div>

                                @foreach($livewire->inlineEditFields as $fi => $field)
                                    <div class="border border-gray-100 rounded-lg p-2.5 mb-2 bg-gray-50 space-y-2">
                                        <div class="flex gap-2">
                                            <input type="text" wire:model="inlineEditFields.{{ $fi }}.label"
                                                placeholder="Field label"
                                                class="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                            <select wire:model="inlineEditFields.{{ $fi }}.field_type"
                                                class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="select">Dropdown</option>
                                                <option value="textarea">Textarea</option>
                                                <option value="file">File</option>
                                            </select>
                                            <select wire:model="inlineEditFields.{{ $fi }}.box_size"
                                                class="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                                <option value="small">25%</option>
                                                <option value="middle">50%</option>
                                                <option value="full">100%</option>
                                            </select>
                                            <button wire:click="removeInlineField({{ $fi }})" type="button"
                                                class="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
                                        </div>
                                        <div class="flex gap-3 text-xs text-gray-500">
                                            <label class="flex items-center gap-1">
                                                <input type="checkbox" wire:model="inlineEditFields.{{ $fi }}.is_required">
                                                Required
                                            </label>
                                        </div>
                                    </div>
                                @endforeach

                                @if(empty($livewire->inlineEditFields))
                                    <p class="text-xs text-gray-400 italic text-center py-2">No fields yet — click "+ Add Field"</p>
                                @endif
                            </div>

                            <button wire:click="saveInlineGroup" type="button"
                                class="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
                                Save Section
                            </button>
                        </div>
                    @else
                        {{-- Fields preview --}}
                        @php $allFields = $group->boxes->flatMap(fn($b) => $b->fields)->sortBy('sort_order'); @endphp
                        @if($allFields->isNotEmpty())
                            <div class="px-3 py-2 flex flex-wrap gap-1.5">
                                @foreach($allFields as $field)
                                    <span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        {{ $field->label ?: 'Untitled' }}
                                        <span class="text-slate-400">· {{ $field->field_type }}</span>
                                        @if($field->is_required)<span class="text-red-400">*</span>@endif
                                    </span>
                                @endforeach
                            </div>
                        @else
                            <div class="px-3 py-2 text-[11px] text-gray-400 italic">No fields in this section yet — click Edit to add.</div>
                        @endif
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
