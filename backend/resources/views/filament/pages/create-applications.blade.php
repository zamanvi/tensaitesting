<x-filament-panels::page>
<div class="space-y-6">

    {{-- Hero header --}}
    <div class="rounded-2xl bg-gradient-to-r from-green-800 to-emerald-600 px-8 py-7 flex items-center justify-between shadow-sm">
        <div>
            <h2 class="text-xl font-black text-white tracking-tight">Application Form Builder</h2>
            <p class="text-green-100 text-sm mt-1">Design country-specific forms, publish them, and receive applications from branches & agencies.</p>
        </div>
        <a href="{{ route('filament.admin.resources.form-templates.create') }}"
           class="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-green-800 text-sm font-bold rounded-xl shadow hover:bg-green-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            New Form Template
        </a>
    </div>

    {{-- Stats row --}}
    @php
        $total     = $templates->count();
        $published = $templates->where('status', 'published')->count();
        $draft     = $templates->where('status', 'draft')->count();
    @endphp
    <div class="grid grid-cols-3 gap-4">
        <div class="bg-white border border-slate-100 rounded-2xl px-6 py-5 shadow-sm">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Templates</p>
            <p class="text-3xl font-black text-slate-800 mt-1">{{ $total }}</p>
        </div>
        <div class="bg-white border border-slate-100 rounded-2xl px-6 py-5 shadow-sm">
            <p class="text-xs font-semibold text-emerald-500 uppercase tracking-wide">Published</p>
            <p class="text-3xl font-black text-emerald-600 mt-1">{{ $published }}</p>
        </div>
        <div class="bg-white border border-slate-100 rounded-2xl px-6 py-5 shadow-sm">
            <p class="text-xs font-semibold text-amber-500 uppercase tracking-wide">Draft</p>
            <p class="text-3xl font-black text-amber-600 mt-1">{{ $draft }}</p>
        </div>
    </div>

    {{-- Form Templates Table --}}
    <div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">

        {{-- Table header --}}
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
                <h3 class="text-sm font-black text-slate-900">Form Templates</h3>
                <p class="text-xs text-slate-400 mt-0.5">One template per country — publish to make it live</p>
            </div>
            <a href="{{ route('filament.admin.resources.form-templates.index') }}"
               class="text-xs font-bold text-green-700 hover:text-green-900 transition-colors">
                Manage all →
            </a>
        </div>

        @if($templates->isEmpty())
            <div class="py-20 text-center">
                <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <p class="text-sm font-semibold text-slate-500">No form templates yet</p>
                <p class="text-xs text-slate-400 mt-1 mb-4">Create your first template to start receiving applications</p>
                <a href="{{ route('filament.admin.resources.form-templates.create') }}"
                   class="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white text-xs font-bold rounded-xl hover:bg-green-800 transition-colors">
                    + New Form Template
                </a>
            </div>
        @else
            <div class="divide-y divide-slate-50">
                @foreach($templates as $template)
                <div class="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors group">

                    {{-- Country icon --}}
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 border border-green-100 flex items-center justify-center shrink-0">
                        <svg class="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                        </svg>
                    </div>

                    {{-- Country + Name --}}
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-slate-800">{{ $template->country }}</p>
                        <p class="text-xs text-slate-400 truncate mt-0.5">{{ $template->name }}</p>
                    </div>

                    {{-- Status badge --}}
                    <div class="shrink-0">
                        @if($template->status === 'published')
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-bold rounded-full">
                                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Published
                            </span>
                        @else
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[11px] font-bold rounded-full">
                                <span class="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                                Draft
                            </span>
                        @endif
                    </div>

                    {{-- Actions --}}
                    <div class="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href="{{ route('filament.admin.resources.form-templates.edit', $template->id) }}"
                           class="px-3 py-1.5 bg-green-700 text-white text-[11px] font-bold rounded-lg hover:bg-green-800 transition-colors">
                            Edit
                        </a>
                    </div>

                </div>
                @endforeach
            </div>

            {{-- Footer --}}
            <div class="px-6 py-4 border-t border-slate-50 bg-slate-50/40">
                <a href="{{ route('filament.admin.resources.form-templates.create') }}"
                   class="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 hover:text-green-900 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                    Add new country form
                </a>
            </div>
        @endif
    </div>

    {{-- How it works --}}
    <div class="bg-white border border-slate-100 rounded-2xl px-6 py-6 shadow-sm">
        <h3 class="text-sm font-black text-slate-800 mb-5">How it works</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
            @foreach([
                ['n'=>'1','color'=>'bg-green-700','title'=>'Create Template','desc'=>'Add country, visa type, form name and available intakes'],
                ['n'=>'2','color'=>'bg-blue-600','title'=>'Build Fields','desc'=>'Add Data & Document sections with ¼ / ½ / ↔ field boxes'],
                ['n'=>'3','color'=>'bg-purple-600','title'=>'Publish','desc'=>'Publish the form to make it live for branches and agencies'],
                ['n'=>'4','color'=>'bg-emerald-600','title'=>'Receive Applications','desc'=>'Branch / Agency / Student fill and submit — appears in All Applications'],
            ] as $step)
            <div class="flex gap-3">
                <div class="w-7 h-7 {{ $step['color'] }} text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{{ $step['n'] }}</div>
                <div>
                    <p class="text-xs font-bold text-slate-800">{{ $step['title'] }}</p>
                    <p class="text-xs text-slate-400 mt-1 leading-relaxed">{{ $step['desc'] }}</p>
                </div>
            </div>
            @endforeach
        </div>
    </div>

</div>
</x-filament-panels::page>
