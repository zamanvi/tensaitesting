@php
    $state    = $getState() ?: '[]';
    $statePath = $getStatePath();
@endphp

<div
    x-data="formBuilder(@js(json_decode($state, true) ?: []))"
    x-init="init()"
    wire:ignore
    class="space-y-3"
>
    <input type="hidden" wire:model.defer="{{ $statePath }}" x-ref="hiddenInput" />

    <template x-for="(group, gi) in groups" :key="group._key">
        <div class="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">

            <div class="p-4 space-y-3">

                {{-- Field title + delete --}}
                <div class="flex items-center gap-2">
                    <input type="text"
                        x-model="group.label"
                        @input="sync()"
                        placeholder="Field title..."
                        class="flex-1 font-semibold text-sm text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                    <button type="button" @click="removeGroup(gi)"
                        class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>

                    {{-- Boxes displayed in a flex-wrap grid showing actual widths --}}
                    <div class="flex flex-wrap gap-2">
                        <template x-for="(box, bi) in group.boxes" :key="box._key">
                            <div
                                :style="{
                                    width: box.size === 'full'   ? '100%' :
                                           box.size === 'middle' ? 'calc(50% - 4px)' :
                                                                   'calc(25% - 6px)'
                                }"
                                class="border border-gray-300 rounded-lg overflow-hidden bg-white transition-all">

                                {{-- Box compact row (always visible) --}}
                                <div class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                    @click="box.expanded = !box.expanded">
                                    {{-- Size badge --}}
                                    <span class="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-300 text-xs font-semibold text-gray-600 bg-gray-50 shrink-0"
                                        x-text="box.size === 'small' ? 'Q' : (box.size === 'full' ? '↔' : '½')"></span>
                                    {{-- Editable hint text --}}
                                    <input
                                        type="text"
                                        x-model="box.label"
                                        @input="sync()"
                                        @click.stop
                                        :placeholder="box.size === 'small' ? 'Quarter input...' : box.size === 'full' ? 'Full width input...' : 'Half input...'"
                                        class="flex-1 text-sm border-none outline-none bg-transparent placeholder-gray-400 min-w-0"
                                    />
                                    {{-- Expand chevron --}}
                                    <svg class="w-3.5 h-3.5 text-gray-300 shrink-0 transition-transform"
                                        :class="box.expanded ? 'rotate-180' : ''"
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                    </svg>
                                    {{-- Remove --}}
                                    <button type="button" @click.stop="removeBox(group, bi)"
                                        class="text-gray-300 hover:text-red-500 text-lg leading-none font-medium focus:outline-none shrink-0">
                                        ✕
                                    </button>
                                </div>

                                {{-- Expanded details --}}
                                <div x-show="box.expanded" x-collapse
                                    class="border-t border-gray-100 bg-gray-50 p-3 space-y-3">

                                    <div class="grid grid-cols-2 gap-3">
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 mb-1 block">
                                                Field Key <span class="text-red-500">*</span>
                                            </label>
                                            <input type="text" x-model="box.field_key" @input="sync()"
                                                placeholder="e.g. hsc_gpa"
                                                class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                                            <p class="text-xs text-gray-400 mt-0.5">snake_case</p>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 mb-1 block">Width</label>
                                            <select x-model="box.size" @change="sync()"
                                                class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                                <option value="small">¼ Quarter</option>
                                                <option value="middle">½ Half</option>
                                                <option value="full">↔ Full</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-3 gap-3">
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 mb-1 block">
                                                Field Type <span class="text-red-500">*</span>
                                            </label>
                                            <select x-model="box.field_type" @change="sync()"
                                                class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                                <option value="text">✏️ Text</option>
                                                <option value="number">🔢 Number</option>
                                                <option value="date">📅 Date</option>
                                                <option value="select">▾ Dropdown</option>
                                                <option value="textarea">📝 Textarea</option>
                                                <option value="file">📎 File</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 mb-1 block">Placeholder</label>
                                            <input type="text" x-model="box.placeholder" @input="sync()"
                                                placeholder="e.g. Enter score…"
                                                class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                                        </div>
                                        <div>
                                            <label class="text-xs font-medium text-gray-500 mb-1 block">Helper</label>
                                            <input type="text" x-model="box.helper_text" @input="sync()"
                                                placeholder="e.g. Out of 5.00"
                                                class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                                        </div>
                                    </div>

                                    <div x-show="box.field_type === 'select'">
                                        <label class="text-xs font-medium text-gray-500 mb-1 block">Options</label>
                                        <input type="text"
                                            :value="Array.isArray(box.options) ? box.options.join(', ') : ''"
                                            @input="box.options = $event.target.value.split(',').map(o => o.trim()).filter(Boolean); sync()"
                                            placeholder="e.g. N1, N2, N3, None"
                                            class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                                    </div>

                                    <div class="flex gap-6">
                                        <label class="flex items-center gap-2 cursor-pointer"
                                            @click.prevent="box.is_required = !box.is_required; sync()">
                                            <span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                                                :class="box.is_required ? 'bg-primary-500' : 'bg-gray-300'">
                                                <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                                                    :class="box.is_required ? 'translate-x-4' : 'translate-x-1'"></span>
                                            </span>
                                            <span class="text-xs text-gray-600">Required *</span>
                                        </label>
                                        <label class="flex items-center gap-2 cursor-pointer"
                                            @click.prevent="box.is_active = !box.is_active; sync()">
                                            <span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                                                :class="box.is_active !== false ? 'bg-primary-500' : 'bg-gray-300'">
                                                <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                                                    :class="box.is_active !== false ? 'translate-x-4' : 'translate-x-1'"></span>
                                            </span>
                                            <span class="text-xs text-gray-600">Visible</span>
                                        </label>
                                        <label class="flex items-center gap-2 cursor-pointer"
                                            @click.prevent="box.requires_document = !box.requires_document; sync()">
                                            <span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                                                :class="box.requires_document ? 'bg-amber-500' : 'bg-gray-300'">
                                                <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                                                    :class="box.requires_document ? 'translate-x-4' : 'translate-x-1'"></span>
                                            </span>
                                            <span class="text-xs text-gray-600">📎 Doc upload</span>
                                        </label>
                                    </div>

                                    <details>
                                        <summary class="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                                            ⚙ Conditional visibility
                                        </summary>
                                        <div class="mt-2 grid grid-cols-3 gap-2">
                                            <input type="text" x-model="box.conditional_field_key" @input="sync()"
                                                placeholder="field key"
                                                class="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"/>
                                            <select x-model="box.conditional_operator" @change="sync()"
                                                class="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none">
                                                <option value="">operator</option>
                                                <option value="is">is</option>
                                                <option value="is_not">is not</option>
                                                <option value="is_empty">is empty</option>
                                                <option value="is_not_empty">is not empty</option>
                                            </select>
                                            <input type="text" x-model="box.conditional_value" @input="sync()"
                                                placeholder="value"
                                                class="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none"/>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </template>
                    </div>

                    {{-- Add box buttons --}}
                    <div class="flex items-center gap-2">
                        <button type="button" @click="addBox(group, 'small')"
                            class="flex-1 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                            + Q
                        </button>
                        <button type="button" @click="addBox(group, 'middle')"
                            class="flex-1 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                            + ½
                        </button>
                        <button type="button" @click="addBox(group, 'full')"
                            class="flex-1 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                            + ↔
                        </button>
                    </div>

                </div>

            </div>
        </div>
    </template>

    {{-- Add new field --}}
    <button type="button" @click="addGroup()"
        class="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600 transition-colors">
        + Add Data and Document
    </button>
</div>

@once
<script>
document.addEventListener('alpine:init', () => {
    Alpine.data('formBuilder', (initialData) => ({
        groups: [],
        _counter: 0,

        init() {
            this.groups = this._hydrate(initialData || []);
            this.$nextTick(() => this.sync());
        },

        _hydrate(data) {
            return data.map(g => ({
                ...g,
                _key: ++this._counter,
                collapsed: false,
                boxes: this._flattenBoxes(g),
            }));
        },

        _flattenBoxes(g) {
            // Support both old nested structure (boxes[].fields[]) and new flat structure (boxes[])
            const flatBoxes = [];
            if (g.boxes) {
                g.boxes.forEach(b => {
                    if (b.fields && b.fields.length > 0) {
                        // Old structure: each field inside box becomes a box
                        b.fields.forEach(f => {
                            flatBoxes.push({
                                _key: ++this._counter,
                                id: f.id || null,
                                label: f.label || '',
                                field_key: f.field_key || '',
                                field_type: f.field_type || 'text',
                                size: f.box_size || 'middle',
                                is_required: f.is_required || false,
                                is_active: f.is_active !== false,
                                requires_document: b.requires_document || false,
                                placeholder: f.placeholder || '',
                                helper_text: f.helper_text || '',
                                options: f.options || [],
                                conditional_field_key: f.conditional_field_key || '',
                                conditional_operator: f.conditional_operator || '',
                                conditional_value: f.conditional_value || '',
                                expanded: false,
                                _box_id: b.id || null,
                            });
                        });
                    } else if (!b.fields || b.fields.length === 0) {
                        // New flat structure box
                        flatBoxes.push({
                            _key: ++this._counter,
                            id: b.id || null,
                            label: b.label || '',
                            field_key: b.field_key || '',
                            field_type: b.field_type || 'text',
                            size: b.size || b.box_size || 'middle',
                            is_required: b.is_required || false,
                            is_active: b.is_active !== false,
                            requires_document: b.requires_document || false,
                            placeholder: b.placeholder || '',
                            helper_text: b.helper_text || '',
                            options: b.options || [],
                            conditional_field_key: b.conditional_field_key || '',
                            conditional_operator: b.conditional_operator || '',
                            conditional_value: b.conditional_value || '',
                            expanded: false,
                            _box_id: b.id || null,
                        });
                    }
                });
            }
            return flatBoxes;
        },

        sync() {
            const data = this.groups.map((g, gi) => ({
                id: g.id || null,
                label: g.label || '',
                is_active: g.is_active !== false,
                sort_order: gi,
                boxes: g.boxes.map((b, bi) => ({
                    id: b._box_id || null,
                    field_id: b.id || null,
                    label: b.label || '',
                    field_key: b.field_key || '',
                    field_type: b.field_type || 'text',
                    box_size: b.size || 'middle',
                    is_required: b.is_required || false,
                    is_active: b.is_active !== false,
                    requires_document: b.requires_document || false,
                    placeholder: b.placeholder || '',
                    helper_text: b.helper_text || '',
                    options: b.options || [],
                    sort_order: bi,
                    conditional_field_key: b.conditional_field_key || '',
                    conditional_operator: b.conditional_operator || '',
                    conditional_value: b.conditional_value || '',
                }))
            }));
            this.$refs.hiddenInput.value = JSON.stringify(data);
            this.$refs.hiddenInput.dispatchEvent(new Event('input'));
            this.$refs.hiddenInput.dispatchEvent(new Event('change'));
        },

        addGroup() {
            this.groups.push({
                _key: ++this._counter,
                id: null,
                label: '',
                is_active: true,
                sort_order: this.groups.length,
                collapsed: false,
                boxes: [],
            });
            this.sync();
        },

        removeGroup(gi) {
            this.groups.splice(gi, 1);
            this.sync();
        },

        addBox(group, size) {
            group.boxes.push({
                _key: ++this._counter,
                id: null,
                _box_id: null,
                label: '',
                field_key: '',
                field_type: 'text',
                size: size,
                is_required: false,
                is_active: true,
                requires_document: false,
                placeholder: '',
                helper_text: '',
                options: [],
                conditional_field_key: '',
                conditional_operator: '',
                conditional_value: '',
                expanded: false,
            });
            this.sync();
        },

        removeBox(group, bi) {
            group.boxes.splice(bi, 1);
            this.sync();
        },
    }));
});
</script>
@endonce
