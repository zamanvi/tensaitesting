<x-filament-widgets::widget>
    <x-filament::section heading="Action Items">
        <div class="space-y-3">

            <a href="{{ \App\Filament\Resources\CommissionResource::getUrl('index') }}?tableFilters[status][value]=due"
               class="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 transition hover:shadow-sm">
                <div class="flex items-center gap-3">
                    <x-heroicon-o-banknotes class="h-5 w-5 text-amber-500" />
                    <span class="text-sm font-medium text-amber-700 dark:text-amber-300">Commissions Due</span>
                </div>
                <span class="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {{ $commissionsDue }}
                </span>
            </a>

            <a href="{{ \App\Filament\Resources\LeadResource::getUrl('index') }}?tableFilters[status][value]=on_hold"
               class="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/30 px-4 py-3 transition hover:shadow-sm">
                <div class="flex items-center gap-3">
                    <x-heroicon-o-pause-circle class="h-5 w-5 text-slate-500" />
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Leads On Hold</span>
                </div>
                <span class="rounded-full bg-slate-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {{ $leadsOnHold }}
                </span>
            </a>

            <a href="{{ \App\Filament\Resources\LeadResource::getUrl('index') }}?tableFilters[status][value]=visa_processing"
               class="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 transition hover:shadow-sm">
                <div class="flex items-center gap-3">
                    <x-heroicon-o-globe-alt class="h-5 w-5 text-blue-500" />
                    <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Visa Processing</span>
                </div>
                <span class="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {{ $visaProcessing }}
                </span>
            </a>

        </div>
    </x-filament::section>
</x-filament-widgets::widget>
