@php
    $record   = $this->getRecord();
    $progress = $record?->progress ?? 0;
    $status   = $record?->status   ?? 'draft';

    $barColor = $progress >= 80 ? '#16a34a' : ($progress >= 50 ? '#d97706' : '#dc2626');
    $bgColor  = $progress >= 80 ? '#f0fdf4' : ($progress >= 50 ? '#fffbeb' : '#fff7f7');
    $label    = $progress >= 80 ? 'Almost complete' : ($progress >= 50 ? 'Halfway there — you can submit' : 'Keep filling to unlock Submit');

    $statusColors = [
        'draft'     => ['bg' => '#f1f5f9', 'text' => '#64748b', 'label' => 'Draft'],
        'submitted' => ['bg' => '#fffbeb', 'text' => '#d97706', 'label' => 'Submitted'],
        'accepted'  => ['bg' => '#f0fdf4', 'text' => '#16a34a', 'label' => 'Accepted'],
        'rejected'  => ['bg' => '#fff7f7', 'text' => '#dc2626', 'label' => 'Rejected'],
    ];
    $sc = $statusColors[$status] ?? $statusColors['draft'];
@endphp

<div style="background:{{ $bgColor }};border:1.5px solid {{ $barColor }}22;border-radius:14px;padding:16px 20px;margin-bottom:4px;">

    {{-- Top row: label + status badge --}}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:14px;font-weight:700;color:{{ $barColor }};">{{ $progress }}% Complete</span>
            <span style="font-size:12px;color:#64748b;">— {{ $label }}</span>
        </div>
        <span style="background:{{ $sc['bg'] }};color:{{ $sc['text'] }};border-radius:20px;padding:3px 12px;font-size:12px;font-weight:600;border:1px solid {{ $sc['text'] }}33;">
            {{ $sc['label'] }}
        </span>
    </div>

    {{-- Progress bar --}}
    <div style="width:100%;height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden;">
        <div style="width:{{ $progress }}%;height:100%;background:{{ $barColor }};border-radius:99px;transition:width .4s ease;"></div>
    </div>

    {{-- Submit hint --}}
    @if($progress < 50)
    <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">
        Fill at least <strong style="color:{{ $barColor }};">50%</strong> of the form to unlock the Submit button.
    </p>
    @elseif($status === 'draft')
    <p style="margin:8px 0 0;font-size:11px;color:#d97706;">
        ✓ Ready to submit — click <strong>Submit Application</strong> in the top-right corner.
    </p>
    @elseif($status === 'submitted')
    <p style="margin:8px 0 0;font-size:11px;color:#16a34a;">
        ✓ Submitted — you can still edit this application and changes will update everywhere.
    </p>
    @endif
</div>
