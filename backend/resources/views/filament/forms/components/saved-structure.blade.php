@php
    $record = $getRecord();
@endphp

@if($record && $record->exists)
    @php
        $record->load('fieldGroups.boxes.fields');
        $groups = $record->fieldGroups->sortBy('sort_order');
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
                            {{ $group->label ?: 'Untitled Group' }}
                        </span>
                        <span class="text-xs text-gray-400">
                            {{ $group->boxes->sum(fn($b) => $b->fields->count()) }} field(s)
                        </span>
                    </div>
                    <div class="p-4">
                        @php
                            $allFields = $group->boxes->flatMap(fn($b) => $b->fields)->sortBy('sort_order');
                        @endphp
                        @if($allFields->isEmpty())
                            <p class="text-xs text-gray-400 italic">No input fields in this group.</p>
                        @else
                            <div class="flex flex-wrap gap-2">
                                @foreach($allFields as $field)
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
                                        <div class="flex items-center gap-2 mt-1">
                                            <span class="text-xs text-gray-400">{{ $field->field_type }}</span>
                                            @if($field->is_required)
                                                <span class="text-xs text-red-400">required</span>
                                            @endif
                                        </div>
                                    </div>
                                @endforeach
                            </div>
                        @endif
                    </div>
                </div>
            @endforeach
        </div>
    @endif
@endif
