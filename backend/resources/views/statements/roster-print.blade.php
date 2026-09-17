<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Payment Summary — {{ $branch->name }}</title>
  <style>
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; }
    .toolbar { max-width: 720px; margin: 20px auto 0; display: flex; justify-content: flex-end; }
    .print-btn {
      background: #16a34a; color: #fff; border: none; border-radius: 999px;
      padding: 10px 22px; font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: inherit; display: inline-flex; align-items: center; gap: 8px;
    }
    .print-btn:hover { background: #15803d; }
    .wrapper { max-width: 720px; margin: 16px auto 40px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: #0d1117; padding: 28px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .header h1 { margin: 0; color: #fff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; color: rgba(255,255,255,0.45); font-size: 12px; }
    .header .period { text-align: right; color: #fff; }
    .header .period .range { font-size: 13px; font-weight: 700; }
    .header .period .branch { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 2px; }

    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th { text-align: left; padding: 10px 40px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; }
    tbody td { padding: 10px 40px; border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child td { border-bottom: none; }
    .mono { font-family: 'Courier New', monospace; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .muted { color: #94a3b8; }
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
      <div>
        <h1>Tensai</h1>
        <p>Student Payment Summary</p>
      </div>
      <div class="period">
        <div class="range">
          @if($from || $until)
            {{ $from?->format('d M Y') ?? 'Start' }} — {{ $until?->format('d M Y') ?? 'Now' }}
          @else
            All time
          @endif
        </div>
        <div class="branch">{{ $branch->name }}</div>
      </div>
    </div>

    @if($students->isEmpty())
      <div class="empty">No students with memos in this range.</div>
    @else
      <table>
        <thead>
          <tr>
            <th>Roll</th>
            <th>Student Name</th>
            <th class="num">Memos</th>
            <th class="num">Total Paid</th>
          </tr>
        </thead>
        <tbody>
          @foreach($students as $student)
            <tr>
              <td class="mono">{{ $student['roll'] }}</td>
              <td>{{ $student['name'] }}</td>
              <td class="num muted">{{ $student['memoCount'] }}</td>
              <td class="num">{{ number_format($student['totalPaid'], 2) }}</td>
            </tr>
          @endforeach
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">{{ $students->count() }} student{{ $students->count() === 1 ? '' : 's' }}</td>
            <td class="num">{{ $students->sum('memoCount') }}</td>
            <td class="num">{{ number_format($grandTotal, 2) }}</td>
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
