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

        <div class="mt-10 pt-8 border-t border-gray-200 dark:border-white/10">
            <h2 class="text-base font-semibold text-gray-950 dark:text-white mb-1">Per-Student Statement</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Every memo for one student — memo no., date, and amount —
                regardless of category. Roll is only unique within a branch,
                so pick the branch first.
            </p>

            <form wire:submit="openStudentStatement" class="grid grid-cols-3 gap-4 items-end">
                <div>
                    <label class="fi-fo-field-wrp-label text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Branch</label>
                    <select wire:model="studentBranchId" class="fi-select-input block w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 text-sm">
                        <option value="">Select a branch…</option>
                        @foreach($this->branches() as $branch)
                            <option value="{{ $branch->id }}">{{ $branch->name }}</option>
                        @endforeach
                    </select>
                    @error('studentBranchId') <p class="text-xs text-danger-600 mt-1">{{ $message }}</p> @enderror
                </div>
                <div>
                    <label class="fi-fo-field-wrp-label text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Student Roll</label>
                    <input type="text" wire:model="roll" placeholder="e.g. 42"
                        class="fi-input block w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 text-sm" />
                    @error('roll') <p class="text-xs text-danger-600 mt-1">{{ $message }}</p> @enderror
                </div>
                <div>
                    <x-filament::button type="submit">
                        Open Student Statement
                    </x-filament::button>
                </div>
            </form>
        </div>
    </div>
</x-filament-panels::page>
