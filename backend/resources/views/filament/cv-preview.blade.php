{{-- The same CV the person sees in My CV → Preview. $preview comes from App\Support\CvPreview::build(). --}}
<div style="font-family: inherit; line-height: 1.5;">
    <div style="border-bottom: 2px solid #16a34a; padding-bottom: 10px; margin-bottom: 14px;">
        <div style="font-size: 22px; font-weight: 800;">{{ $preview['name'] ?: '—' }}</div>
        @if (!empty($preview['headline']))
            <div style="font-size: 15px; color: #16a34a; font-weight: 600;">{{ $preview['headline'] }}</div>
        @endif
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
            Contact details are left out of this preview. Filled: {{ $preview['progress'] }}%
        </div>
    </div>

    @if (!empty($preview['summary']))
        <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #6b7280;">Profile</div>
            <p style="margin: 4px 0 0;">{{ $preview['summary'] }}</p>
        </div>
    @endif

    @forelse ($preview['sections'] as $section)
        <div style="margin-bottom: 16px;">
            <div style="font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px;">
                {{ $section['title'] }}
            </div>
            <table style="width: 100%; margin-top: 6px; border-collapse: collapse;">
                @foreach ($section['items'] as $item)
                    <tr>
                        <td style="vertical-align: top; width: 38%; padding: 3px 10px 3px 0; color: #6b7280; font-size: 13px;">{{ $item['label'] }}</td>
                        <td style="vertical-align: top; padding: 3px 0; font-size: 14px; white-space: pre-line;">{{ $item['value'] }}</td>
                    </tr>
                @endforeach
            </table>
        </div>
    @empty
        <p style="color: #6b7280;">Nothing has been answered yet.</p>
    @endforelse
</div>
