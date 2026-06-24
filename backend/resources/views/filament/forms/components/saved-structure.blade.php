@php
    $record = $getRecord();
@endphp

@if($record && $record->exists)
    @php
        $record = $record->fresh();
        $record->load('fieldGroups.boxes.fields');
        $groups      = $record->fieldGroups->sortBy('sort_order');
        $isPublished = $record->status === 'published';
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
                    $editUrl    = \App\Filament\Resources\FormFieldGroupResource::getUrl('edit', ['record' => $group->id]);
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
                            @if($group->label === 'Application Form Info')
                                <button onclick="window.scrollTo({top:0,behavior:'smooth'})" type="button"
                                    class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                    ✏ Edit
                                </button>
                            @else
                                <a href="{{ $editUrl }}"
                                    class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                    ✏ Edit
                                </a>
                            @endif
                            <button wire:click="deleteFieldGroup({{ $group->id }})"
                                wire:confirm="Delete this section and all its fields?"
                                type="button"
                                class="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                ✕ Delete
                            </button>
                        </div>
                    </div>

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
