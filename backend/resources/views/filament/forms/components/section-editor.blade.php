@php
    $livewire = $getLivewire();
    $groupId  = $livewire->inlineEditGroupId ?? null;
@endphp

@if($groupId)
    @php
        $group = \App\Models\FormFieldGroup::find($groupId);
    @endphp

    @if($group)
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-blue-800">
                    Editing: {{ $group->label }}
                </h3>
                <button wire:click="cancelInlineEdit" type="button"
                    class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                    ✕ Cancel
                </button>
            </div>

            @if($group->label !== 'Application Form Info')
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Section Title</label>
                    <input type="text" wire:model="inlineEditLabel"
                        class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                </div>
            @endif

            <div>
                <div class="flex items-center justify-between mb-2">
                    <label class="text-xs font-medium text-gray-700">Fields</label>
                    <button wire:click="addInlineField" type="button"
                        class="text-xs bg-white border border-blue-300 text-blue-600 hover:bg-blue-50 font-medium px-3 py-1 rounded-lg">
                        + Add Field
                    </button>
                </div>

                @forelse($livewire->inlineEditFields as $fi => $field)
                    <div class="bg-white border border-gray-200 rounded-lg p-3 mb-2 space-y-2">
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" wire:model="inlineEditFields.{{ $fi }}.label"
                                placeholder="Field label"
                                class="col-span-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400">

                            <select wire:model="inlineEditFields.{{ $fi }}.field_type"
                                class="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="select">Dropdown</option>
                                <option value="textarea">Textarea</option>
                                <option value="file">File Upload</option>
                            </select>

                            <select wire:model="inlineEditFields.{{ $fi }}.box_size"
                                class="text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400">
                                <option value="small">25% width</option>
                                <option value="middle">50% width</option>
                                <option value="full">100% width</option>
                            </select>
                        </div>

                        <div class="flex items-center justify-between">
                            <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                <input type="checkbox" wire:model="inlineEditFields.{{ $fi }}.is_required"
                                    class="rounded border-gray-300">
                                Required field
                            </label>
                            <button wire:click="removeInlineField({{ $fi }})" type="button"
                                class="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50">
                                Remove
                            </button>
                        </div>
                    </div>
                @empty
                    <p class="text-xs text-gray-400 italic text-center py-3 bg-white rounded-lg border border-dashed border-gray-200">
                        No fields yet — click "+ Add Field" to add
                    </p>
                @endforelse
            </div>

            <button wire:click="saveInlineGroup" type="button"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                Save Section
            </button>
        </div>
    @endif
@endif
