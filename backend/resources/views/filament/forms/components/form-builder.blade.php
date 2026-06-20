@php
    $statePath = $getStatePath();
@endphp

<div
    x-data="formBuilder()"
    x-init="init()"
    wire:ignore
    class="space-y-3"
>
    <input type="hidden" wire:model.defer="{{ $statePath }}" x-ref="hiddenInput" />

    <template x-for="(group, gi) in groups" :key="group._key">
        <div class="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <div class="p-4 space-y-3">

                {{-- Field title --}}
                <div class="flex items-center gap-2">
                    <input type="text"
                        x-model="group.label"
                        @input="sync()"
                        placeholder="Field title..."
                        class="flex-1 font-semibold text-sm text-gray-800 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                </div>

                {{-- Sections (each = one Add Data and Document) --}}
                <template x-for="(section, si) in group.sections" :key="section._key">
                    <div class="border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-2">

                        {{-- Section header: remove button --}}
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-medium text-gray-500">Data & Document <span x-text="si + 1"></span></span>
                            <button type="button" @click="removeSection(group, si)"
                                class="text-gray-400 hover:text-red-500 text-xs transition-colors">
                                ✕ Remove
                            </button>
                        </div>

                        {{-- Document upload for this section --}}
                        <div class="bg-white border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-semibold text-gray-500">📎 Document</span>
                                <div class="flex gap-1 ml-auto">
                                    <button type="button"
                                        @click="section.doc_mode = 'none'; sync()"
                                        :class="(section.doc_mode || 'none') === 'none' ? 'bg-gray-200 text-gray-700 font-semibold' : 'bg-white text-gray-400 border border-gray-200'"
                                        class="text-xs px-2.5 py-1 rounded-full transition-colors">
                                        None
                                    </button>
                                    <button type="button"
                                        @click="section.doc_mode = 'optional'; sync()"
                                        :class="section.doc_mode === 'optional' ? 'bg-amber-100 text-amber-700 font-semibold' : 'bg-white text-gray-400 border border-gray-200'"
                                        class="text-xs px-2.5 py-1 rounded-full transition-colors">
                                        Optional
                                    </button>
                                    <button type="button"
                                        @click="section.doc_mode = 'mandatory'; sync()"
                                        :class="section.doc_mode === 'mandatory' ? 'bg-red-100 text-red-700 font-semibold' : 'bg-white text-gray-400 border border-gray-200'"
                                        class="text-xs px-2.5 py-1 rounded-full transition-colors">
                                        Mandatory
                                    </button>
                                </div>
                            </div>
                            <div x-show="section.doc_mode && section.doc_mode !== 'none'" class="flex gap-2">
                                <input type="text" x-model="section.doc_label" @input="sync()"
                                    placeholder="Document label e.g. Passport Copy"
                                    class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                                <input type="text" x-model="section.doc_key" @input="sync()"
                                    placeholder="key e.g. passport_copy"
                                    class="w-36 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                            </div>
                            <p x-show="section.doc_mode === 'mandatory'" class="text-xs text-red-500">⚠ Student must upload this document before submitting.</p>
                            <p x-show="section.doc_mode === 'optional'" class="text-xs text-amber-600">Upload is optional for this section.</p>
                        </div>

                        {{-- Boxes inside this section --}}
                        <div class="flex flex-wrap gap-2">
                            <template x-for="(box, bi) in section.boxes" :key="box._key">
                                <div
                                    :style="{
                                        width: box.size === 'full'   ? '100%' :
                                               box.size === 'middle' ? 'calc(50% - 4px)' :
                                                                       'calc(25% - 6px)'
                                    }"
                                    class="border border-gray-300 rounded-lg overflow-hidden bg-white transition-all">

                                    {{-- Box compact row --}}
                                    <div class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                                        @click="box.expanded = !box.expanded">
                                        <span class="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-300 text-xs font-semibold text-gray-600 bg-gray-50 shrink-0"
                                            x-text="box.size === 'small' ? 'Q' : (box.size === 'full' ? '↔' : '½')"></span>
                                        <input
                                            type="text"
                                            x-model="box.label"
                                            @input="sync()"
                                            @click.stop
                                            :placeholder="box.size === 'small' ? 'Quarter input...' : box.size === 'full' ? 'Full width input...' : 'Half input...'"
                                            class="flex-1 text-sm border-none outline-none bg-transparent placeholder-gray-400 min-w-0"
                                        />
                                        <svg class="w-3.5 h-3.5 text-gray-300 shrink-0 transition-transform"
                                            :class="box.expanded ? 'rotate-180' : ''"
                                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                                        </svg>
                                        <button type="button" @click.stop="removeBox(section, bi)"
                                            class="text-gray-300 hover:text-red-500 text-lg leading-none font-medium focus:outline-none shrink-0">
                                            ✕
                                        </button>
                                    </div>

                                    {{-- Expanded details --}}
                                    <div x-show="box.expanded" x-collapse
                                        class="border-t border-gray-100 bg-gray-50 p-3 space-y-3">

                                        <div class="grid grid-cols-2 gap-3">
                                            <div>
                                                <label class="text-xs font-medium text-gray-500 mb-1 block">Field Key <span class="text-red-500">*</span></label>
                                                <input type="text" x-model="box.field_key" @input="sync()"
                                                    placeholder="e.g. ssc_gpa"
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
                                                <label class="text-xs font-medium text-gray-500 mb-1 block">Field Type <span class="text-red-500">*</span></label>
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

                                        <div class="flex gap-6 flex-wrap">
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
                                        </div>

                                        {{-- Document upload mode --}}
                                        <div class="space-y-1">
                                            <label class="text-xs font-medium text-gray-500 block">📎 Document Upload</label>
                                            <div class="flex gap-2">
                                                <button type="button"
                                                    @click="box.document_mode = 'none'; sync()"
                                                    :class="box.document_mode === 'none' ? 'bg-gray-200 text-gray-700 font-semibold' : 'bg-white text-gray-400 border border-gray-200'"
                                                    class="text-xs px-3 py-1 rounded-full transition-colors">
                                                    None
                                                </button>
                                                <button type="button"
                                                    @click="box.document_mode = 'optional'; sync()"
                                                    :class="box.document_mode === 'optional' ? 'bg-amber-100 text-amber-700 font-semibold' : 'bg-white text-gray-400 border border-gray-200'"
                                                    class="text-xs px-3 py-1 rounded-full transition-colors">
                                                    Optional
                                                </button>
                                                <button type="button"
                                                    @click="box.document_mode = 'mandatory'; sync()"
                                                    :class="box.document_mode === 'mandatory' ? 'bg-red-100 text-red-700 font-semibold' : 'bg-white text-gray-400 border border-gray-200'"
                                                    class="text-xs px-3 py-1 rounded-full transition-colors">
                                                    Mandatory
                                                </button>
                                            </div>
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
                        <div class="flex items-center gap-2 pt-1">
                            <button type="button" @click="addBox(section, 'small')"
                                class="flex-1 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-500 hover:bg-white hover:border-gray-400 transition-colors">
                                + Q
                            </button>
                            <button type="button" @click="addBox(section, 'middle')"
                                class="flex-1 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-500 hover:bg-white hover:border-gray-400 transition-colors">
                                + ½
                            </button>
                            <button type="button" @click="addBox(section, 'full')"
                                class="flex-1 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-500 hover:bg-white hover:border-gray-400 transition-colors">
                                + ↔
                            </button>
                        </div>

                    </div>
                </template>

                {{-- Add Data and Document button --}}
                <button type="button" @click="addSection(group)"
                    class="w-full border-2 border-dashed border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600 transition-colors">
                    + Add Data and Document
                </button>

            </div>
        </div>
    </template>

</div>

@once
<script>
document.addEventListener('alpine:init', () => {
    Alpine.data('formBuilder', () => ({
        groups: [],
        _counter: 0,

        init() {
            // Always start with one empty group (one Field Title)
            this.groups = [{
                _key: ++this._counter,
                id: null,
                label: '',
                is_active: true,
                sections: [],
            }];
            this.$nextTick(() => this.sync());
        },

        sync() {
            const data = this.groups.map((g, gi) => ({
                id: g.id || null,
                label: g.label || '',
                is_active: g.is_active !== false,
                sort_order: gi,
                boxes: g.sections.map((s, si) => ({
                    id: s.id || null,
                    name: s.name || '',
                    sort_order: si,
                    is_active: true,
                    requires_document: s.doc_mode && s.doc_mode !== 'none',
                    document_required: s.doc_mode === 'mandatory',
                    doc_label: s.doc_label || '',
                    doc_key: s.doc_key || '',
                    doc_mode: s.doc_mode || 'none',
                    fields: s.boxes.map((b, bi) => ({
                        field_id: b.id || null,
                        label: b.label || '',
                        field_key: b.field_key || '',
                        field_type: b.field_type || 'text',
                        box_size: b.size || 'middle',
                        is_required: b.is_required || false,
                        is_active: b.is_active !== false,
                        requires_document: b.document_mode !== 'none',
                        document_required: b.document_mode === 'mandatory',
                        document_mode: b.document_mode || 'none',
                        placeholder: b.placeholder || '',
                        helper_text: b.helper_text || '',
                        options: b.options || [],
                        sort_order: bi,
                        conditional_field_key: b.conditional_field_key || '',
                        conditional_operator: b.conditional_operator || '',
                        conditional_value: b.conditional_value || '',
                    }))
                }))
            }));
            this.$refs.hiddenInput.value = JSON.stringify(data);
            this.$refs.hiddenInput.dispatchEvent(new Event('input'));
            this.$refs.hiddenInput.dispatchEvent(new Event('change'));
        },

        addSection(group) {
            group.sections.push({
                _key: ++this._counter,
                id: null,
                name: '',
                requires_document: false,
                doc_mode: 'none',
                doc_label: '',
                doc_key: '',
                boxes: [],
            });
            this.sync();
        },

        removeSection(group, si) {
            group.sections.splice(si, 1);
            this.sync();
        },

        addBox(section, size) {
            section.boxes.push({
                _key: ++this._counter,
                id: null,
                label: '',
                field_key: '',
                field_type: 'text',
                size: size,
                is_required: false,
                is_active: true,
                document_mode: 'none',
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

        removeBox(section, bi) {
            section.boxes.splice(bi, 1);
            this.sync();
        },
    }));
});
</script>
@endonce
