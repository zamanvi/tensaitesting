@php
    $record = $getRecord();
@endphp

@if($record && $record->exists)
    @php
        $record->load('fieldGroups.boxes.fields');
        $groups      = $record->fieldGroups->sortBy('sort_order');
        $isPublished = $record->status === 'published';
        $allFields   = $groups->flatMap(fn($g) => $g->boxes->flatMap(fn($b) => $b->fields))->sortBy('sort_order');
    @endphp

    @if($allFields->isEmpty())
        <div class="text-sm text-gray-400 italic py-6 text-center">
            No fields saved yet. Use "Add Data and Document" below to add fields.
        </div>
    @else
        <div class="space-y-2">
            @foreach($allFields as $field)
                @php
                    $editUrl = \App\Filament\Resources\FormTemplateFieldResource::getUrl('edit', ['record' => $field->id]);
                @endphp
                <div class="border border-gray-200 rounded-xl bg-white px-3 py-2.5 flex items-center justify-between">
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
                        <a href="{{ $editUrl }}"
                            class="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                            ✏ Edit
                        </a>
                        <button wire:click="deleteField({{ $field->id }})"
                            wire:confirm="Delete this field?"
                            type="button"
                            class="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
                            ✕
                        </button>
                    </div>
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
