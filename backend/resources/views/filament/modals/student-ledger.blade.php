<div class="space-y-5 py-2">

    {{-- Totals --}}
    <div class="grid grid-cols-2 gap-3">
        <div class="bg-green-50 rounded-xl p-3">
            <p class="text-xs text-gray-400 mb-0.5">Total Paid (all memos)</p>
            <p class="text-lg font-bold text-green-800">{{ number_format($ledger['total_paid'], 2) }} {{ $currency }}</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
            <p class="text-xs text-gray-400 mb-0.5">Total Invoiced</p>
            <p class="text-lg font-bold text-gray-800">{{ number_format($ledger['total_invoiced'], 2) }} {{ $currency }}</p>
        </div>
    </div>

    {{-- Memo-by-memo breakdown --}}
    <div>
        <h3 class="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            {{ $ledger['memo_count'] }} {{ Str::plural('Memo', $ledger['memo_count']) }}
        </h3>
        <div class="space-y-2">
            @foreach($ledger['memos'] as $memo)
            <div class="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                    <p class="text-sm font-semibold text-gray-900">{{ $memo->category?->label ?? '—' }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ $memo->receipt_no }} · {{ $memo->created_at?->format('d M Y') }}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold text-gray-900">{{ number_format((float) $memo->amount, 2) }} {{ $memo->currency }}</p>
                    <span class="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 {{ match($memo->status) {
                        'paid' => 'bg-green-100 text-green-700',
                        'partial' => 'bg-amber-100 text-amber-700',
                        default => 'bg-rose-100 text-rose-700',
                    } }}">
                        {{ ucfirst($memo->status) }}
                    </span>
                </div>
            </div>
            @endforeach
        </div>
    </div>

</div>
