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
                <div class="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span class="font-semibold text-sm text-gray-800">
                            {{ $group->label ?: 'Application Form Info' }}
                        </span>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-400">
                                {{ $group->boxes->sum(fn($b) => $b->fields->count()) }} field(s)
                            </span>
                            <button
                                wire:click="openEditFieldGroup({{ $group->id }})"
                                type="button"
                                class="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors px-2 py-1 rounded hover:bg-blue-50">
                                ✏ Edit
                            </button>
                            <button
                                wire:click="deleteFieldGroup({{ $group->id }})"
                                wire:confirm="Delete this field group and all its fields?"
                                type="button"
                                class="text-xs text-red-400 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50">
                                ✕ Delete
                            </button>
                        </div>
                    </div>
                    <div class="p-4">
                        @php
                            $allFields = $group->boxes->flatMap(fn($b) => $b->fields)->sortBy('sort_order');
                        @endphp
                        @if($allFields->isEmpty())
                            <p class="text-xs text-gray-400 italic">No input fields in this group.</p>
                        @else
                            @foreach($group->boxes->sortBy('sort_order') as $box)
                                @if($box->fields->isNotEmpty())
                                    <div class="mb-3">
                                        <div class="flex flex-wrap gap-2">
                                            @foreach($box->fields->sortBy('sort_order') as $field)
                                                @php
                                                    $width = match($field->box_size) {
                                                        'full'   => '100%',
                                                        'middle' => 'calc(50% - 4px)',
                                                        default  => 'calc(25% - 6px)',
                                                    };
                                                @endphp
                                                <div style="width: {{ $width }}"
                                                    class="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                                                    <div class="text-sm font-medium text-gray-700 truncate">
                                                        {{ $field->label ?: 'Untitled' }}
                                                    </div>
                                                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span class="text-xs text-gray-400">{{ $field->field_type }}</span>
                                                        @if($field->is_required)
                                                            <span class="text-xs bg-red-100 text-red-500 px-1 rounded">required</span>
                                                        @endif
                                                        @if($field->requires_document)
                                                            <span class="text-xs bg-amber-100 text-amber-600 px-1 rounded">
                                                                📎 {{ $field->document_required ? 'mandatory doc' : 'optional doc' }}
                                                            </span>
                                                        @endif
                                                    </div>
                                                </div>
                                            @endforeach
                                        </div>
                                    </div>
                                @endif
                            @endforeach
                        @endif
                    </div>
                </div>
            @endforeach

            {{-- Submit / Publish button --}}
            <div class="pt-2 border-t border-gray-200">
                @if($isPublished)
                    <div class="flex items-center gap-2 text-sm text-green-600 font-medium py-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Form is Published — Live to branches
                    </div>
                @else
                    <button
                        wire:click="publishTemplate()"
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
