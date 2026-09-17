<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Statement — {{ $customerName }} (Roll {{ $roll }})</title>
  <style>
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; }
    .toolbar { max-width: 640px; margin: 20px auto 0; display: flex; justify-content: flex-end; }
    .print-btn {
      background: #16a34a; color: #fff; border: none; border-radius: 999px;
      padding: 10px 22px; font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: inherit; display: inline-flex; align-items: center; gap: 8px;
    }
    .print-btn:hover { background: #15803d; }
    .wrapper { max-width: 640px; margin: 16px auto 40px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: #0d1117; padding: 28px 40px; }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.45); font-size: 12px; }

    .student { padding: 20px 40px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
    .student .name { font-size: 17px; font-weight: 800; }
    .student .meta { font-size: 12px; color: #64748b; margin-top: 2px; }
    .student .total .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; text-align: right; }
    .student .total .value { font-size: 20px; font-weight: 800; color: #16a34a; text-align: right; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { text-align: left; padding: 10px 40px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
    tbody td { padding: 10px 40px; border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child td { border-bottom: none; }
    .mono { font-family: 'Courier New', monospace; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .rose { color: #e11d48; font-size: 11px; }
    tfoot td { padding: 12px 40px; font-weight: 800; border-top: 2px solid #0f172a; }

    .empty { padding: 60px 20px; text-align: center; color: #94a3b8; font-size: 13px; }
    .footer { padding: 18px 40px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { font-size: 11px; color: #94a3b8; margin: 0; }

    @media print {
      @page { margin: 12mm; }
      .toolbar { display: none; }
      body { background: #fff; }
      .wrapper { box-shadow: none; margin: 0; border-radius: 0; }
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
      <h1>Tensai</h1>
      <p>Student Statement</p>
    </div>

    <div class="student">
      <div>
        <div class="name">{{ $customerName }}</div>
        <div class="meta">Roll {{ $roll }} · {{ $branch->name }}</div>
      </div>
      <div class="total">
        <div class="label">Total Paid</div>
        <div class="value">{{ number_format($total, 2) }} BDT</div>
      </div>
    </div>

    @if($payments->isEmpty())
      <div class="empty">No memos found for this roll.</div>
    @else
      <table>
        <thead>
          <tr>
            <th>Memo No.</th>
            <th>Date</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          @foreach($payments as $payment)
            <tr>
              <td class="mono">{{ $payment->receipt_no }}</td>
              <td>{{ $payment->created_at->format('d M Y') }}</td>
              <td class="num">
                {{ number_format((float) $payment->net_amount, 2) }}
                @if((float) $payment->refunded_amount > 0)
                  <div class="rose">Refunded {{ number_format((float) $payment->refunded_amount, 2) }}</div>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">{{ $payments->count() }} memo{{ $payments->count() === 1 ? '' : 's' }}</td>
            <td class="num">{{ number_format($total, 2) }}</td>
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
