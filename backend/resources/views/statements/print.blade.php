<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Memo Statement — {{ $from->format('d M Y') }} to {{ $until->format('d M Y') }}</title>
  <style>
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; }
    .toolbar { max-width: 920px; margin: 20px auto 0; display: flex; justify-content: flex-end; }
    .print-btn {
      background: #16a34a; color: #fff; border: none; border-radius: 999px;
      padding: 10px 22px; font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: inherit; display: inline-flex; align-items: center; gap: 8px;
    }
    .print-btn:hover { background: #15803d; }
    .wrapper { max-width: 920px; margin: 16px auto 40px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: #0d1117; padding: 28px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.45); font-size: 12px; }
    .header .period { text-align: right; color: #fff; }
    .header .period .range { font-size: 14px; font-weight: 700; }
    .header .period .branch { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px; }

    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: #e2e8f0; }
    .summary .box { background: #fff; padding: 18px 20px; }
    .summary .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .summary .value { font-size: 18px; font-weight: 800; }
    .summary .value.green { color: #16a34a; }
    .summary .value.rose { color: #e11d48; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tbody tr:last-child td { border-bottom: none; }
    .mono { font-family: 'Courier New', monospace; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: #94a3b8; }
    .badge { display: inline-block; padding: 1px 7px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .badge.branch { background: #f0fdf4; color: #15803d; }
    .badge.ho { background: #eef2ff; color: #4338ca; }
    tfoot td { padding: 12px; font-weight: 800; border-top: 2px solid #0f172a; }

    .empty { padding: 60px 20px; text-align: center; color: #94a3b8; font-size: 13px; }
    .footer { padding: 18px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { font-size: 11px; color: #94a3b8; margin: 0; }

    @media print {
      @page { size: landscape; margin: 12mm; }
      .toolbar { display: none; }
      body { background: #fff; }
      .wrapper { box-shadow: none; margin: 0; border-radius: 0; }
      table { font-size: 10.5px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="print-btn" onclick="window.print()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
      Print / Save as PDF
    </button>
  </div>

  <div class="wrapper">
    <div class="header">
      <div>
        <h1>Tensai</h1>
        <p>Memo Statement</p>
      </div>
      <div class="period">
        <div class="range">{{ $from->format('d M Y') }} — {{ $until->format('d M Y') }}</div>
        <div class="branch">{{ $branchLabel }}</div>
      </div>
    </div>

    <div class="summary">
      <div class="box">
        <div class="label">Total Collected</div>
        <div class="value">{{ number_format($totalCollected, 2) }}</div>
      </div>
      <div class="box">
        <div class="label">Total Refunded</div>
        <div class="value rose">{{ number_format($totalRefunded, 2) }}</div>
      </div>
      <div class="box">
        <div class="label">Net (Branch Fund)</div>
        <div class="value green">{{ number_format($branchFund, 2) }}</div>
      </div>
      <div class="box">
        <div class="label">Net (Head Office Fund)</div>
        <div class="value green">{{ number_format($headOfficeFund, 2) }}</div>
      </div>
    </div>

    @if($payments->isEmpty())
      <div class="empty">No memos in this period.</div>
    @else
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Receipt No.</th>
            <th>Branch</th>
            <th>Customer</th>
            <th>Category</th>
            <th>Routed To</th>
            <th class="num">Amount</th>
            <th class="num">Refunded</th>
            <th class="num">Net</th>
          </tr>
        </thead>
        <tbody>
          @foreach($payments as $payment)
            <tr>
              <td>{{ $payment->created_at->format('d M Y') }}</td>
              <td class="mono">{{ $payment->receipt_no }}</td>
              <td>{{ $payment->branch?->name ?? 'Main Branch' }}</td>
              <td>{{ $payment->customer_name }}</td>
              <td>{{ $payment->category?->label ?? '—' }}</td>
              <td>
                <span class="badge {{ $payment->fund_target === 'branch' ? 'branch' : 'ho' }}">
                  {{ $payment->fund_target === 'branch' ? 'Branch Fund' : 'HO Fund' }}
                </span>
              </td>
              <td class="num">{{ number_format((float) $payment->amount, 2) }}</td>
              <td class="num {{ (float) $payment->refunded_amount > 0 ? 'rose' : 'muted' }}" style="{{ (float) $payment->refunded_amount > 0 ? 'color:#e11d48;' : '' }}">
                {{ (float) $payment->refunded_amount > 0 ? number_format((float) $payment->refunded_amount, 2) : '—' }}
              </td>
              <td class="num">{{ number_format((float) $payment->net_amount, 2) }}</td>
            </tr>
          @endforeach
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6">{{ $payments->count() }} memo{{ $payments->count() === 1 ? '' : 's' }}</td>
            <td class="num">{{ number_format($totalCollected, 2) }}</td>
            <td class="num">{{ number_format($totalRefunded, 2) }}</td>
            <td class="num">{{ number_format($netTotal, 2) }}</td>
          </tr>
        </tfoot>
      </table>
    @endif

    <div class="footer">
      <p>Generated {{ now()->format('d M Y, h:i A') }} · © {{ date('Y') }} Tensai Consultancy.</p>
    </div>
  </div>
</body>
</html>
