<div class="space-y-6 py-2">

    {{-- Branch Info --}}
    <div>
        <h3 class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Branch Info</h3>
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Name</p>
                <p class="text-sm font-semibold text-gray-900">{{ $branch->name }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Location</p>
                <p class="text-sm font-semibold text-gray-900">{{ trim($branch->city . ', ' . $branch->country, ', ') ?: '—' }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Slug</p>
                <p class="text-sm font-mono text-gray-700">{{ $branch->slug }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Status</p>
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold {{ $branch->is_active ? 'text-green-700' : 'text-red-600' }}">
                    <span class="w-1.5 h-1.5 rounded-full {{ $branch->is_active ? 'bg-green-500' : 'bg-red-400' }}"></span>
                    {{ $branch->is_active ? 'Active' : 'Inactive' }}
                </span>
            </div>
            @if($branch->tagline)
            <div class="col-span-2 bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Tagline</p>
                <p class="text-sm text-gray-700">{{ $branch->tagline }}</p>
            </div>
            @endif
            @if($branch->address)
            <div class="col-span-2 bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Address</p>
                <p class="text-sm text-gray-700">{{ $branch->address }}</p>
            </div>
            @endif
            @if($branch->phone || $branch->whatsapp || $branch->email)
            <div class="col-span-2 bg-gray-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-1.5">Contact</p>
                <div class="space-y-1">
                    @if($branch->phone)<p class="text-sm text-gray-700">📞 {{ $branch->phone }}</p>@endif
                    @if($branch->whatsapp)<p class="text-sm text-gray-700">💬 {{ $branch->whatsapp }}</p>@endif
                    @if($branch->email)<p class="text-sm text-gray-700">✉️ {{ $branch->email }}</p>@endif
                </div>
            </div>
            @endif
        </div>
    </div>

    {{-- Manager Info --}}
    <div>
        <h3 class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Manager Account</h3>
        @if($manager)
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-green-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Login Username</p>
                <p class="text-sm font-semibold text-green-800">{{ $manager->name }}</p>
            </div>
            <div class="bg-green-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Password</p>
                <p class="text-sm font-mono font-semibold text-green-800">{{ $manager->manager_plain_password ?? '—' }}</p>
            </div>
            @if($manager->phone)
            <div class="bg-green-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Phone</p>
                <p class="text-sm text-green-800">{{ $manager->phone }}</p>
            </div>
            @endif
            @if($manager->whatsapp)
            <div class="bg-green-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">WhatsApp</p>
                <p class="text-sm text-green-800">{{ $manager->whatsapp }}</p>
            </div>
            @endif
            <div class="col-span-2 bg-green-50 rounded-xl p-3">
                <p class="text-xs text-gray-400 mb-0.5">Login Link</p>
                <p class="text-sm font-mono text-blue-700 break-all">
                    {{ rtrim(config('app.frontend_url', config('app.url')), '/') }}/auth/branch-login?branch={{ urlencode($branch->name) }}
                </p>
            </div>
        </div>
        @else
        <div class="bg-amber-50 rounded-xl p-4 text-center">
            <p class="text-sm text-amber-700 font-medium">⚠ No manager assigned</p>
            <p class="text-xs text-amber-600 mt-1">Use the Edit action to add a manager.</p>
        </div>
        @endif
    </div>

    {{-- Timestamps --}}
    <div class="flex gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
        <span>Created: {{ $branch->created_at?->format('d M Y') }}</span>
        <span>Updated: {{ $branch->updated_at?->format('d M Y') }}</span>
    </div>

</div>
