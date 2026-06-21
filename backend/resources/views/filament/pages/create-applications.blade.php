<x-filament-panels::page>

    <div class="space-y-6">

        {{-- Header actions --}}
        <div class="flex items-center justify-between">
            <div>
                <p class="text-sm text-gray-500">Build and manage application forms for each country. Publish to make them available to branches and agencies.</p>
            </div>
            <a href="{{ route('filament.admin.resources.form-templates.create') }}"
               class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <x-heroicon-o-plus class="w-4 h-4" />
                New Form Template
            </a>
        </div>

        {{-- System overview --}}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white border border-gray-200 rounded-2xl p-5">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <x-heroicon-o-document-text class="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-800">Form Templates</p>
                        <p class="text-xs text-gray-400">{{ $templates->count() }} total</p>
                    </div>
                </div>
                <p class="text-xs text-gray-500">Create custom application forms per country with fields, sections, and document requirements.</p>
                <a href="{{ route('filament.admin.resources.form-templates.index') }}" class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                    View all templates →
                </a>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-5">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <x-heroicon-o-paper-airplane class="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-800">Submit Application</p>
                        <p class="text-xs text-gray-400">Admin direct submit</p>
                    </div>
                </div>
                <p class="text-xs text-gray-500">Open any published form template and use the "Submit Application" button to create an application directly.</p>
                <a href="{{ route('filament.admin.resources.form-templates.index') }}" class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-800">
                    Go to Form Templates →
                </a>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-5">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <x-heroicon-o-clipboard-document-list class="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-800">All Applications</p>
                        <p class="text-xs text-gray-400">Review & manage</p>
                    </div>
                </div>
                <p class="text-xs text-gray-500">View, accept, or reject all submitted applications from branches, agencies, and students.</p>
                <a href="{{ route('filament.admin.resources.applications.index') }}" class="mt-3 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800">
                    View all applications →
                </a>
            </div>
        </div>

        {{-- How it works --}}
        <div class="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 class="text-sm font-bold text-gray-800 mb-4">How it works</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                @foreach([
                    ['step' => '1', 'icon' => 'heroicon-o-document-plus', 'title' => 'Create Template', 'desc' => 'Add country, visa type, form name and available intakes'],
                    ['step' => '2', 'icon' => 'heroicon-o-squares-plus', 'title' => 'Build Fields', 'desc' => 'Add Data & Document sections with ¼ / ½ / ↔ field boxes'],
                    ['step' => '3', 'icon' => 'heroicon-o-rocket-launch', 'title' => 'Publish', 'desc' => 'Publish the form to make it live for branches and agencies'],
                    ['step' => '4', 'icon' => 'heroicon-o-check-circle', 'title' => 'Receive Applications', 'desc' => 'Branch/Agency/Student fill and submit — appears in All Applications'],
                ] as $item)
                <div class="flex gap-3">
                    <div class="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                        {{ $item['step'] }}
                    </div>
                    <div>
                        <p class="text-xs font-bold text-gray-800">{{ $item['title'] }}</p>
                        <p class="text-xs text-gray-500 mt-0.5">{{ $item['desc'] }}</p>
                    </div>
                </div>
                @endforeach
            </div>
        </div>

        {{-- Form templates table --}}
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 class="text-sm font-bold text-gray-800">Form Templates</h3>
                <span class="text-xs text-gray-400">{{ $templates->count() }} templates</span>
            </div>
            @if($templates->isEmpty())
                <div class="py-16 text-center">
                    <x-heroicon-o-document-text class="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p class="text-sm font-semibold text-gray-500">No form templates yet</p>
                    <p class="text-xs text-gray-400 mt-1">Create your first form template to get started</p>
                    <a href="{{ route('filament.admin.resources.form-templates.create') }}"
                       class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl hover:bg-primary-700">
                        + New Form Template
                    </a>
                </div>
            @else
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wide">
                            <th class="text-left px-6 py-3">Country</th>
                            <th class="text-left px-4 py-3">Form Name</th>
                            <th class="text-left px-4 py-3">Status</th>
                            <th class="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        @foreach($templates as $template)
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-6 py-3">
                                <span class="font-semibold text-gray-800 text-xs">{{ $template->country }}</span>
                            </td>
                            <td class="px-4 py-3 text-xs text-gray-500">{{ $template->name }}</td>
                            <td class="px-4 py-3">
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full {{ $template->status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700' }}">
                                    {{ ucfirst($template->status) }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-right">
                                <a href="{{ route('filament.admin.resources.form-templates.edit', $template->id) }}"
                                   class="text-xs font-bold text-primary-600 hover:text-primary-800">
                                    Edit →
                                </a>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

    </div>

</x-filament-panels::page>
