<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt {{ $payment->receipt_no }}</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
    .header { background: #0d1117; padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.45); font-size: 13px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 12px; }
    .text { font-size: 14px; color: #475569; line-height: 1.65; margin-bottom: 20px; }
    .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 22px 24px; margin: 24px 0; text-align: center; }
    .amount-box .label { font-size: 12px; font-weight: 600; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .amount-box .value { font-size: 30px; font-weight: 800; color: #0f172a; }
    .details { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .row:last-child { border-bottom: none; }
    .row-label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .row-value { font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; }
    .mono { font-family: 'Courier New', monospace; }
    .footer { padding: 20px 40px; border-top: 1px solid #f1f5f9; }
    .footer p { font-size: 12px; color: #94a3b8; margin: 0; text-align: center; }
    .disclaimer { font-size: 11px; color: #94a3b8; line-height: 1.6; margin: 0 0 12px; font-style: italic; text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Tensai</h1>
      <p>Payment Receipt</p>
    </div>
    <div class="body">
      <p class="greeting">Hi {{ $payment->customer_name }},</p>
      <p class="text">
        Thank you for your payment. This confirms we have received it directly on behalf of Tensai —
        please keep this receipt for your records.
      </p>

      <div class="amount-box">
        <div class="label">Amount Received</div>
        <div class="value">{{ number_format((float) $payment->amount, 2) }} {{ $payment->currency }}</div>
      </div>

      <div class="details">
        <div class="row">
          <span class="row-label">Receipt No.</span>
          <span class="row-value mono">{{ $payment->receipt_no }}</span>
        </div>
        <div class="row">
          <span class="row-label">Date</span>
          <span class="row-value">{{ $payment->created_at->format('d M Y, h:i A') }}</span>
        </div>
        <div class="row">
          <span class="row-label">For</span>
          <span class="row-value">{{ $payment->category?->label ?? '—' }}</span>
        </div>
        <div class="row">
          <span class="row-label">Branch</span>
          <span class="row-value">{{ $payment->branch?->name ?? '—' }}</span>
        </div>
        <div class="row">
          <span class="row-label">Payment Method</span>
          <span class="row-value" style="text-transform: capitalize;">{{ $payment->method }}</span>
        </div>
        @if($payment->application)
        <div class="row">
          <span class="row-label">Application</span>
          <span class="row-value mono">{{ $payment->application->application_code }}</span>
        </div>
        @endif
      </div>
    </div>
    <div class="footer">
      <p class="disclaimer">
        Tensai is a tech-enabled Education &amp; Talent Marketplace — not a visa agency or manpower recruiter.
        We train, verify, and connect. We do not process files, guarantee visas, or supply labour.
      </p>
      <p>© {{ date('Y') }} Tensai Consultancy. This receipt was sent to {{ $payment->customer_email ?? 'you' }}.</p>
    </div>
  </div>
</body>
</html>
