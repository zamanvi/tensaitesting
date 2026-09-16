<x-filament-panels::page>
    <div
        x-data
        x-on:open-statement.window="window.open($event.detail.url, '_blank')"
    >
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Pick a period (and optionally one branch) to open a printable
            statement of every memo in that range — receipt numbers, dates,
            customers, categories, amounts, and refunds, with totals at the
            end. Leave Branch on "All Branches" for the whole company.
        </p>

        <form wire:submit="openStatement">
            {{ $this->form }}

            <div class="mt-6">
                <x-filament::button type="submit">
                    Open Printable Statement
                </x-filament::button>
            </div>
        </form>
    </div>
</x-filament-panels::page>
