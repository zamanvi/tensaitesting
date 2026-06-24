@php
    $record = $getRecord();
@endphp

@if($record && $record->exists)
    @php
        $record      = $record->fresh();
        $record->load('fieldGroups.boxes.fields');
        $groups      = $record->fieldGroups->sortBy('sort_order');
        $isPublished = $record->status === 'published';
    @endphp

    @if($groups->isEmpty())
        <div class="text-center py-8 space-y-2">
            <div class="text-3xl">📋</div>
            <p class="text-sm font-medium text-gray-500">No sections saved yet</p>
            <p class="text-xs text-gray-400">Fill in Application Form Info above and click <strong>Save Info</strong>, or use <strong>Add Data &amp; Documents</strong> below to add field sections.</p>
        </div>
    @else
        <div class="space-y-2">
            @foreach($groups as $group)
                @php
                    $fieldCount = $group->boxes->sum(fn($b) => $b->fields->count());
                    $isAFI      = $group->label === 'Application Form Info';
                @endphp

                <div class="border rounded-xl overflow-hidden {{ $isAFI ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200 bg-white' }}">

                    {{-- Section header --}}
                    <div class="px-3 py-2.5 flex items-center justify-between {{ $isAFI ? 'bg-primary-50 border-b border-primary-100' : 'bg-gray-50 border-b border-gray-100' }}">
                        <div class="flex items-center gap-2 min-w-0">
                            @if($isAFI)
                                <span class="shrink-0 text-[10px] font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Fixed</span>
                            @else
                                <span class="shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            @endif
                            <div class="min-w-0">
                                <div class="text-sm font-semibold text-gray-800 truncate">
                                    {{ $group->label ?: 'Untitled Section' }}
                                </div>
                                @if($group->hint)
                                    <div class="text-[10px] text-gray-400 truncate">{{ $group->hint }}</div>
                                @endif
                            </div>
                        </div>

                        <div class="flex items-center gap-1 ml-2 shrink-0">
                            <span class="text-[10px] text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                {{ $fieldCount }} {{ Str::plural('field', $fieldCount) }}
                            </span>

                            @if($isAFI)
                                <button type="button"
                                    onclick="(function(){ var el=document.getElementById('afi-section'); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.outline='2px solid #4f46e5'; setTimeout(()=>el.style.outline='',2000); } })()"
                                    title="Edit Application Form Info — scrolls to the form above"
                                    class="text-xs text-primary-600 hover:text-primary-800 font-medium px-2 py-1 rounded hover:bg-primary-100 transition-colors">
                                    ✏ Edit
                                </button>
                            @else
                                <button type="button"
                                    onclick="(function(id){ var el=document.getElementById('fb-group-'+id); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.outline='2px solid #4f46e5'; setTimeout(()=>el.style.outline='',2000); } else { document.getElementById('add-data-section').scrollIntoView({behavior:'smooth'}); } })({{ $group->id }})"
                                    title="Edit this section in the form builder below"
                                    class="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                                    ✏ Edit
                                </button>
                            @endif

                            <button wire:click="deleteFieldGroup({{ $group->id }})"
                                wire:confirm="Delete '{{ $group->label }}'? This will permanently remove the section and all its fields."
                                type="button"
                                title="Delete this section"
                                class="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                                ✕
                            </button>
                        </div>
                    </div>

                    {{-- Fields preview --}}
                    @php $allFields = $group->boxes->flatMap(fn($b) => $b->fields)->sortBy('sort_order'); @endphp
                    @if($allFields->isNotEmpty())
                        <div class="px-3 py-2 flex flex-wrap gap-1.5">
                            @foreach($allFields as $field)
                                <span class="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                    <span>{{ $field->label ?: 'Untitled' }}</span>
                                    <span class="text-slate-400">· {{ $field->field_type }}</span>
                                    @if($field->is_required)<span class="text-red-400 font-bold">*</span>@endif
                                </span>
                            @endforeach
                        </div>
                    @else
                        <div class="px-3 py-2.5 text-[11px] text-gray-400 italic flex items-center gap-1.5">
                            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            No fields yet — click <strong class="not-italic text-gray-500 mx-0.5">Edit</strong> to add fields
                        </div>
                    @endif
                </div>
            @endforeach
        </div>
    @endif

    {{-- Publish / Published status --}}
    <div class="pt-3 border-t border-gray-200 mt-4">
        @if($isPublished)
            <div class="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <svg class="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <div>
                    <p class="text-sm font-semibold text-green-700">Published — Live to Branches</p>
                    <p class="text-[10px] text-green-600">Branch admins can now use this form for applications.</p>
                </div>
            </div>
        @else
            <div class="space-y-2">
                @if($groups->isEmpty())
                    <p class="text-[11px] text-amber-600 text-center">⚠ Add at least one section before publishing.</p>
                @endif
                <button wire:click="publishTemplate()"
                    wire:confirm="Publish this form? Branch admins will be able to use it for new applications."
                    type="button"
                    @if($groups->isEmpty()) disabled @endif
                    class="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                    Submit &amp; Publish Form
                </button>
            </div>
        @endif
    </div>
@endif
