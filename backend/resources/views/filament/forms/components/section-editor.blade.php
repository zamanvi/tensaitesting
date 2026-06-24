@php
    $livewire = $getLivewire();
    $groupId  = $livewire->inlineEditGroupId ?? null;
@endphp

@if($groupId)
    @php
        $group = \App\Models\FormFieldGroup::find($groupId);
    @endphp

    @if($group && $group->label !== 'Application Form Info')
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-blue-800">Editing: {{ $group->label }}</h3>
                <button wire:click="cancelInlineEdit" type="button"
                    class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
                    ✕ Cancel
                </button>
            </div>

            <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Section Title</label>
                <input type="text" wire:model="inlineEditLabel"
                    class="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>

            <button wire:click="saveInlineGroup" type="button"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                Save
            </button>
        </div>
    @endif
@endif
