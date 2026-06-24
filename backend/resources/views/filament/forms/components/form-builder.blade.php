@php
    $statePath  = $getStatePath();
    $initialJson = $getState() ?: '[]';
@endphp

<div
    x-data="formBuilder({{ \Illuminate\Support\Js::from($initialJson) }})"
    x-init="init()"
    wire:ignore
    class="space-y-4"
>
    <input type="hidden" wire:model.defer="{{ $statePath }}" x-ref="hiddenInput" />

    <template x-for="(group, gi) in groups" :key="group._key">
        <div class="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            :id="group.id ? 'fb-group-' + group.id : 'fb-group-new-' + gi">

            {{-- Group header: Field Title --}}
            <div class="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-primary-50 to-white border-b border-gray-100">
                <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary-100 text-primary-600 shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
                </span>
                <input type="text"
                    x-model="group.label"
                    @input="sync()"
                    placeholder="Section title — e.g. Academic Background"
                    class="flex-1 font-semibold text-sm text-gray-800 bg-transparent border-none outline-none placeholder-gray-400"/>
            </div>

            <div class="p-4 space-y-3">

                {{-- Sections --}}
                <template x-for="(section, si) in group.sections" :key="section._key">
                    <div class="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">

                        {{-- Section header --}}
                        <div class="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-100">
                            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold shrink-0" x-text="si + 1"></span>
                            <span class="text-xs font-semibold text-gray-600">Data & Document</span>
                            <button type="button" @click="removeSection(group, si)"
                                class="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors font-medium">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                Remove
                            </button>
                        </div>

                        <div class="p-3 space-y-3">

                            {{-- Document upload card --}}
                            <div class="rounded-lg border border-dashed border-gray-300 bg-white p-3">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <div class="flex items-center gap-1.5">
                                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                                        <span class="text-xs font-semibold text-gray-500">Document Upload</span>
                                    </div>
                                    <div class="flex gap-1 ml-auto">
                                        <button type="button" @click="section.doc_mode = 'none'; sync()"
                                            :class="(section.doc_mode || 'none') === 'none' ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-300 font-semibold' : 'text-gray-400 hover:bg-gray-50'"
                                            class="text-[11px] px-3 py-1 rounded-full transition-all">None</button>
                                        <button type="button" @click="section.doc_mode = 'optional'; sync()"
                                            :class="section.doc_mode === 'optional' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-300 font-semibold' : 'text-gray-400 hover:bg-amber-50'"
                                            class="text-[11px] px-3 py-1 rounded-full transition-all">Optional</button>
                                        <button type="button" @click="section.doc_mode = 'mandatory'; sync()"
                                            :class="section.doc_mode === 'mandatory' ? 'bg-red-50 text-red-700 ring-1 ring-red-300 font-semibold' : 'text-gray-400 hover:bg-red-50'"
                                            class="text-[11px] px-3 py-1 rounded-full transition-all">Mandatory</button>
                                    </div>
                                </div>

                                <div x-show="section.doc_mode && section.doc_mode !== 'none'"
                                    x-transition:enter="transition ease-out duration-150"
                                    x-transition:enter-start="opacity-0 -translate-y-1"
                                    x-transition:enter-end="opacity-100 translate-y-0"
                                    class="mt-2.5 flex gap-2">
                                    <input type="text" x-model="section.doc_label" @input="sync()"
                                        placeholder="Label — e.g. Passport Copy"
                                        class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"/>
                                    <input type="text" x-model="section.doc_key" @input="sync()"
                                        placeholder="key e.g. passport_copy"
                                        class="w-40 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50 font-mono"/>
                                </div>

                                <p x-show="section.doc_mode === 'mandatory'"
                                    class="mt-1.5 text-[11px] text-red-500 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                                    Student must upload before submitting
                                </p>
                                <p x-show="section.doc_mode === 'optional'"
                                    class="mt-1.5 text-[11px] text-amber-600 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>
                                    Upload is optional for this section
                                </p>
                            </div>

                            {{-- Field boxes --}}
                            <div class="flex flex-wrap gap-2">
                                <template x-for="(box, bi) in section.boxes" :key="box._key">
                                    <div
                                        :style="{
                                            width: box.size === 'full'   ? '100%' :
                                                   box.size === 'middle' ? 'calc(50% - 4px)' :
                                                                           'calc(25% - 6px)'
                                        }"
                                        class="rounded-lg border bg-white overflow-hidden transition-all"
                                        :class="box.expanded
                                            ? 'border-primary-300 shadow-md'
                                            : (box.size === 'small' ? 'border-violet-200' : box.size === 'full' ? 'border-green-200' : 'border-blue-200')">

                                        {{-- Box — real form field preview --}}
                                        <div class="relative p-3 pt-2">

                                            {{-- Top row: size badge + label input + remove --}}
                                            <div class="flex items-center gap-1.5 mb-1.5">
                                                <span class="inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-black shrink-0"
                                                    :class="box.size === 'small' ? 'bg-violet-100 text-violet-500' : box.size === 'full' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-500'"
                                                    x-text="box.size === 'small' ? '¼' : (box.size === 'full' ? '↔' : '½')"></span>

                                                {{-- Editable label — becomes the field label --}}
                                                <input type="text"
                                                    x-model="box.label"
                                                    @input="sync()"
                                                    @click.stop
                                                    placeholder="Field label…"
                                                    class="flex-1 text-xs font-semibold text-gray-700 bg-transparent border-none outline-none placeholder-gray-300 min-w-0"/>

                                                <button type="button" @click.stop="removeBox(section, bi)"
                                                    class="w-5 h-5 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 transition-colors focus:outline-none shrink-0">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                                </button>
                                            </div>

                                            {{-- Real input preview — user types here --}}
                                            <div class="w-full rounded-lg border bg-white shadow-sm transition-all cursor-text"
                                                :class="box.size === 'small' ? 'border-violet-200' : box.size === 'full' ? 'border-green-200' : 'border-blue-200'"
                                                @click.stop>

                                                {{-- textarea --}}
                                                <template x-if="box.field_type === 'textarea'">
                                                    <textarea rows="2"
                                                        :placeholder="box.placeholder || (box.label ? 'Enter ' + box.label.toLowerCase() + '…' : 'Type here…')"
                                                        class="w-full px-3 py-2 text-sm text-gray-600 bg-transparent border-none outline-none placeholder-gray-400 resize-none"></textarea>
                                                </template>

                                                {{-- select / dropdown --}}
                                                <template x-if="box.field_type === 'select'">
                                                    <select class="w-full px-3 py-2 text-sm text-gray-500 bg-transparent border-none outline-none">
                                                        <option value="" disabled selected x-text="box.placeholder || (box.label ? 'Select ' + box.label.toLowerCase() + '…' : 'Select…')"></option>
                                                        <template x-for="opt in (box.options || [])">
                                                            <option :value="opt" x-text="opt"></option>
                                                        </template>
                                                    </select>
                                                </template>

                                                {{-- file upload --}}
                                                <template x-if="box.field_type === 'file'">
                                                    <div class="px-3 py-2.5 text-center">
                                                        <p class="text-xs text-gray-400">📎 <span x-text="box.label || 'Upload file'"></span></p>
                                                    </div>
                                                </template>

                                                {{-- text / number / date / email / default --}}
                                                <template x-if="!['textarea','select','file'].includes(box.field_type)">
                                                    <input
                                                        :type="box.field_type === 'number' ? 'number' : (box.field_type === 'date' ? 'date' : (box.field_type === 'email' ? 'email' : 'text'))"
                                                        :placeholder="box.placeholder || (box.label ? 'Enter ' + box.label.toLowerCase() + '…' : 'Type here…')"
                                                        class="w-full px-3 py-2 text-sm text-gray-600 bg-transparent border-none outline-none placeholder-gray-400"/>
                                                </template>

                                            </div>

                                            {{-- Settings toggle --}}
                                            <button type="button" @click.stop="box.expanded = !box.expanded"
                                                class="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-gray-300 hover:text-gray-500 transition-colors">
                                                <svg class="w-3 h-3 transition-transform" :class="box.expanded ? 'rotate-90' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                                Field settings
                                            </button>
                                        </div>

                                        {{-- Expanded panel --}}
                                        <div x-show="box.expanded" x-collapse
                                            class="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4">

                                            <div class="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Field Key <span class="text-red-400">*</span></label>
                                                    <input type="text" x-model="box.field_key" @input="sync()"
                                                        placeholder="e.g. ssc_gpa"
                                                        class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"/>
                                                    <p class="text-[10px] text-gray-400 mt-1">Use snake_case</p>
                                                </div>
                                                <div>
                                                    <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Width</label>
                                                    <select x-model="box.size" @change="sync()"
                                                        class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                                                        <option value="small">¼ Quarter</option>
                                                        <option value="middle">½ Half</option>
                                                        <option value="full">↔ Full width</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div class="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Field Type <span class="text-red-400">*</span></label>
                                                    <select x-model="box.field_type" @change="sync()"
                                                        class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white">
                                                        <option value="text">✏️ Text</option>
                                                        <option value="number">🔢 Number</option>
                                                        <option value="date">📅 Date</option>
                                                        <option value="select">▾ Dropdown</option>
                                                        <option value="textarea">📝 Textarea</option>
                                                        <option value="file">📎 File</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Placeholder</label>
                                                    <input type="text" x-model="box.placeholder" @input="sync()"
                                                        placeholder="e.g. Enter score…"
                                                        class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"/>
                                                </div>
                                                <div>
                                                    <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Helper text</label>
                                                    <input type="text" x-model="box.helper_text" @input="sync()"
                                                        placeholder="e.g. Out of 5.00"
                                                        class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"/>
                                                </div>
                                            </div>

                                            <div x-show="box.field_type === 'select'">
                                                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Dropdown Options</label>
                                                <input type="text"
                                                    :value="Array.isArray(box.options) ? box.options.join(', ') : ''"
                                                    @input="box.options = $event.target.value.split(',').map(o => o.trim()).filter(Boolean); sync()"
                                                    placeholder="e.g. N1, N2, N3, None  (comma separated)"
                                                    class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"/>
                                            </div>

                                            {{-- Toggles --}}
                                            <div class="flex gap-5 flex-wrap pt-1">
                                                <label class="flex items-center gap-2 cursor-pointer select-none"
                                                    @click.prevent="box.is_required = !box.is_required; sync()">
                                                    <span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200"
                                                        :class="box.is_required ? 'bg-primary-500' : 'bg-gray-200'">
                                                        <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
                                                            :class="box.is_required ? 'translate-x-4' : 'translate-x-1'"></span>
                                                    </span>
                                                    <span class="text-xs text-gray-600 font-medium">Required</span>
                                                </label>
                                                <label class="flex items-center gap-2 cursor-pointer select-none"
                                                    @click.prevent="box.is_active = !box.is_active; sync()">
                                                    <span class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200"
                                                        :class="box.is_active !== false ? 'bg-primary-500' : 'bg-gray-200'">
                                                        <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
                                                            :class="box.is_active !== false ? 'translate-x-4' : 'translate-x-1'"></span>
                                                    </span>
                                                    <span class="text-xs text-gray-600 font-medium">Visible</span>
                                                </label>
                                            </div>

                                            {{-- Per-field document upload --}}
                                            <div class="rounded-lg border border-gray-200 bg-white p-3 space-y-1.5">
                                                <label class="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block">📎 Field Document</label>
                                                <div class="flex gap-1.5">
                                                    <button type="button"
                                                        @click="box.document_mode = 'none'; sync()"
                                                        :class="box.document_mode === 'none' ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-300 font-semibold' : 'text-gray-400 hover:bg-gray-50'"
                                                        class="text-[11px] px-3 py-1 rounded-full transition-all">None</button>
                                                    <button type="button"
                                                        @click="box.document_mode = 'optional'; sync()"
                                                        :class="box.document_mode === 'optional' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-300 font-semibold' : 'text-gray-400 hover:bg-amber-50'"
                                                        class="text-[11px] px-3 py-1 rounded-full transition-all">Optional</button>
                                                    <button type="button"
                                                        @click="box.document_mode = 'mandatory'; sync()"
                                                        :class="box.document_mode === 'mandatory' ? 'bg-red-50 text-red-700 ring-1 ring-red-300 font-semibold' : 'text-gray-400 hover:bg-red-50'"
                                                        class="text-[11px] px-3 py-1 rounded-full transition-all">Mandatory</button>
                                                </div>
                                            </div>

                                            {{-- Conditional visibility --}}
                                            <details class="group">
                                                <summary class="text-[11px] font-semibold text-gray-400 cursor-pointer hover:text-gray-600 select-none flex items-center gap-1 uppercase tracking-wide">
                                                    <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                                                    Conditional visibility
                                                </summary>
                                                <div class="mt-2 grid grid-cols-3 gap-2">
                                                    <input type="text" x-model="box.conditional_field_key" @input="sync()"
                                                        placeholder="field_key"
                                                        class="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400 font-mono"/>
                                                    <select x-model="box.conditional_operator" @change="sync()"
                                                        class="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400">
                                                        <option value="">— operator —</option>
                                                        <option value="is">is</option>
                                                        <option value="is_not">is not</option>
                                                        <option value="is_empty">is empty</option>
                                                        <option value="is_not_empty">is not empty</option>
                                                    </select>
                                                    <input type="text" x-model="box.conditional_value" @input="sync()"
                                                        placeholder="value"
                                                        class="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"/>
                                                </div>
                                            </details>

                                        </div>
                                    </div>
                                </template>
                            </div>

                            {{-- Add field buttons --}}
                            <div class="flex items-center gap-2 pt-1">
                                <button type="button" @click="addBox(section, 'small')"
                                    class="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-400 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 transition-all">
                                    <span class="text-[10px] font-bold bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded">¼</span> Add Quarter
                                </button>
                                <button type="button" @click="addBox(section, 'middle')"
                                    class="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                    <span class="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">½</span> Add Half
                                </button>
                                <button type="button" @click="addBox(section, 'full')"
                                    class="flex-1 flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg py-2 text-xs font-semibold text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all">
                                    <span class="text-[10px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded">↔</span> Add Full
                                </button>
                            </div>

                        </div>
                    </div>
                </template>

                {{-- Add Data and Document button --}}
                <button type="button" @click="addSection(group)"
                    class="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm font-semibold text-gray-400 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Add Data and Document
                </button>

            </div>
        </div>
    </template>

</div>

@once
<script>
document.addEventListener('alpine:init', () => {
    Alpine.data('formBuilder', (initialData = '[]') => ({
        groups: [],
        _counter: 0,

        init() {
            let parsed = [];
            try {
                const raw = typeof initialData === 'string' ? initialData : JSON.stringify(initialData);
                parsed = JSON.parse(raw);
            } catch(e) {}

            if (Array.isArray(parsed) && parsed.length > 0) {
                this.groups = parsed.map(g => ({
                    _key: ++this._counter,
                    id: g.id || null,
                    label: g.label || '',
                    is_active: g.is_active !== false,
                    sections: (g.boxes || []).map(s => ({
                        _key: ++this._counter,
                        id: s.id || null,
                        name: s.name || '',
                        doc_mode: s.doc_mode || 'none',
                        doc_label: s.doc_label || '',
                        doc_key: s.doc_key || '',
                        requires_document: s.requires_document || false,
                        boxes: (s.fields || []).map(b => ({
                            _key: ++this._counter,
                            id: b.field_id || null,
                            label: b.label || '',
                            field_key: b.field_key || '',
                            field_type: b.field_type || 'text',
                            size: b.box_size || 'middle',
                            is_required: b.is_required || false,
                            is_active: b.is_active !== false,
                            document_mode: b.document_mode || 'none',
                            placeholder: b.placeholder || '',
                            helper_text: b.helper_text || '',
                            options: b.options || [],
                            conditional_field_key: b.conditional_field_key || '',
                            conditional_operator: b.conditional_operator || '',
                            conditional_value: b.conditional_value || '',
                            expanded: false,
                        })),
                    })),
                }));
            } else {
                this.groups = [{
                    _key: ++this._counter,
                    id: null,
                    label: '',
                    is_active: true,
                    sections: [],
                }];
            }
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
