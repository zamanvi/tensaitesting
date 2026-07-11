<div style="display:flex;flex-direction:column;gap:12px;padding:4px 0;">

    {{-- Identity --}}
    <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:4px;">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px;font-weight:800;flex-shrink:0;">
            {{ strtoupper(substr($record->connect_name ?? 'R', 0, 1)) }}
        </div>
        <div>
            <p style="font-size:15px;font-weight:800;color:#0f172a;margin:0 0 4px;">{{ $record->connect_name ?? '—' }}</p>
            <span style="font-size:11px;font-weight:600;color:#7c3aed;background:#ede9fe;padding:2px 8px;border-radius:99px;display:inline-block;">Institution Representative</span>
            @if($record->institution?->name)
                <p style="font-size:11px;color:#64748b;margin:4px 0 0;">{{ $record->institution->name }}</p>
            @endif
        </div>
    </div>

    {{-- WhatsApp --}}
    @if($record->connect_whatsapp)
        <a href="https://wa.me/{{ preg_replace('/\D/', '', $record->connect_whatsapp) }}" target="_blank"
            style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px;text-decoration:none;">
            <span style="font-size:22px;">📱</span>
            <div>
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#15803d;margin:0 0 2px;">WhatsApp</p>
                <p style="font-size:14px;font-weight:700;color:#14532d;margin:0;">{{ $record->connect_whatsapp }}</p>
            </div>
            <span style="margin-left:auto;font-size:18px;color:#15803d;">↗</span>
        </a>
    @endif

    {{-- Phone --}}
    @if($record->connect_phone)
        <a href="tel:{{ $record->connect_phone }}"
            style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:12px;text-decoration:none;">
            <span style="font-size:22px;">📞</span>
            <div>
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#1d4ed8;margin:0 0 2px;">Phone</p>
                <p style="font-size:14px;font-weight:700;color:#1e3a8a;margin:0;">{{ $record->connect_phone }}</p>
            </div>
            <span style="margin-left:auto;font-size:18px;color:#1d4ed8;">↗</span>
        </a>
    @endif

    {{-- Email --}}
    @if($record->connect_email)
        <a href="mailto:{{ $record->connect_email }}"
            style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#faf5ff;border:1.5px solid #e9d5ff;border-radius:12px;text-decoration:none;">
            <span style="font-size:22px;">✉️</span>
            <div>
                <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#7c3aed;margin:0 0 2px;">Email</p>
                <p style="font-size:14px;font-weight:700;color:#4c1d95;margin:0;">{{ $record->connect_email }}</p>
            </div>
            <span style="margin-left:auto;font-size:18px;color:#7c3aed;">↗</span>
        </a>
    @endif

    @if(!$record->connect_whatsapp && !$record->connect_phone && !$record->connect_email)
        <p style="text-align:center;color:#9ca3af;padding:20px;">No contact details available.</p>
    @endif

</div>
