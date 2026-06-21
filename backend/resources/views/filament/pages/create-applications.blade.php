<x-filament-panels::page>
<div style="display:flex;flex-direction:column;gap:1.5rem;">

    {{-- Hero header --}}
    <div style="background:linear-gradient(135deg,#2d5016 0%,#3d6117 50%,#16a34a 100%);border-radius:1rem;padding:1.75rem 2rem;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 24px rgba(61,97,23,.25);">
        <div>
            <h2 style="font-size:1.25rem;font-weight:900;color:#fff;letter-spacing:-.02em;margin:0 0 .3rem;">Application Form Builder</h2>
            <p style="color:#bbf7d0;font-size:.85rem;margin:0;">Design country-specific forms, publish them, and receive applications from branches &amp; agencies.</p>
        </div>
        <a href="{{ route('filament.admin.resources.form-templates.create') }}"
           style="display:inline-flex;align-items:center;gap:.5rem;padding:.6rem 1.25rem;background:#fff;color:#2d5016;font-size:.8rem;font-weight:800;border-radius:.75rem;box-shadow:0 2px 8px rgba(0,0,0,.15);text-decoration:none;white-space:nowrap;">
            <svg style="width:1rem;height:1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            New Form Template
        </a>
    </div>

    {{-- Stats row --}}
    @php
        $total     = $templates->count();
        $published = $templates->where('status', 'published')->count();
        $draft     = $templates->where('status', 'draft')->count();
    @endphp
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:1.25rem 1.5rem;box-shadow:0 1px 4px rgba(0,0,0,.05);">
            <p style="font-size:.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin:0 0 .4rem;">Total Templates</p>
            <p style="font-size:2rem;font-weight:900;color:#1e293b;margin:0;">{{ $total }}</p>
        </div>
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:1rem;padding:1.25rem 1.5rem;box-shadow:0 1px 4px rgba(0,0,0,.05);">
            <p style="font-size:.7rem;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:.08em;margin:0 0 .4rem;">Published</p>
            <p style="font-size:2rem;font-weight:900;color:#059669;margin:0;">{{ $published }}</p>
        </div>
        <div style="background:#fff;border:1px solid #fef3c7;border-radius:1rem;padding:1.25rem 1.5rem;box-shadow:0 1px 4px rgba(0,0,0,.05);">
            <p style="font-size:.7rem;font-weight:700;color:#f59e0b;text-transform:uppercase;letter-spacing:.08em;margin:0 0 .4rem;">Draft</p>
            <p style="font-size:2rem;font-weight:900;color:#d97706;margin:0;">{{ $draft }}</p>
        </div>
    </div>

    {{-- Form Templates Table --}}
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:1rem;box-shadow:0 1px 4px rgba(0,0,0,.05);overflow:hidden;">

        {{-- Table header --}}
        <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
            <div>
                <h3 style="font-size:.875rem;font-weight:900;color:#0f172a;margin:0 0 .2rem;">Form Templates</h3>
                <p style="font-size:.75rem;color:#94a3b8;margin:0;">One template per country — publish to make it live</p>
            </div>
            <a href="{{ route('filament.admin.resources.form-templates.index') }}"
               style="font-size:.75rem;font-weight:700;color:#3d6117;text-decoration:none;">Manage all →</a>
        </div>

        @if($templates->isEmpty())
            <div style="padding:4rem 1rem;text-align:center;">
                <div style="width:4rem;height:4rem;background:#f8fafc;border-radius:1rem;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                    <svg style="width:2rem;height:2rem;color:#cbd5e1;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <p style="font-size:.875rem;font-weight:600;color:#64748b;margin:0 0 .25rem;">No form templates yet</p>
                <p style="font-size:.75rem;color:#94a3b8;margin:0 0 1rem;">Create your first template to start receiving applications</p>
                <a href="{{ route('filament.admin.resources.form-templates.create') }}"
                   style="display:inline-flex;align-items:center;gap:.4rem;padding:.5rem 1rem;background:#3d6117;color:#fff;font-size:.75rem;font-weight:700;border-radius:.75rem;text-decoration:none;">
                    + New Form Template
                </a>
            </div>
        @else
            <div>
                @foreach($templates as $template)
                <div style="display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;border-bottom:1px solid #f8fafc;transition:background .15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">

                    {{-- Icon --}}
                    <div style="width:2.5rem;height:2.5rem;border-radius:.75rem;background:linear-gradient(135deg,#dcfce7,#f0fdf4);border:1px solid #bbf7d0;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <svg style="width:1.2rem;height:1.2rem;color:#3d6117;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                        </svg>
                    </div>

                    {{-- Country + Name --}}
                    <div style="flex:1;min-width:0;">
                        <p style="font-size:.875rem;font-weight:700;color:#1e293b;margin:0 0 .15rem;">{{ $template->country }}</p>
                        <p style="font-size:.75rem;color:#94a3b8;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ $template->name }}</p>
                    </div>

                    {{-- Visa type --}}
                    @if($template->visa_type ?? null)
                    <span style="font-size:.7rem;color:#64748b;background:#f1f5f9;padding:.25rem .6rem;border-radius:.5rem;white-space:nowrap;">{{ $template->visa_type }}</span>
                    @endif

                    {{-- Status badge --}}
                    @if($template->status === 'published')
                        <span style="display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .75rem;background:#ecfdf5;color:#059669;border:1px solid #a7f3d0;font-size:.7rem;font-weight:700;border-radius:9999px;">
                            <span style="width:.4rem;height:.4rem;background:#10b981;border-radius:50%;"></span>
                            Published
                        </span>
                    @else
                        <span style="display:inline-flex;align-items:center;gap:.35rem;padding:.25rem .75rem;background:#fffbeb;color:#d97706;border:1px solid #fde68a;font-size:.7rem;font-weight:700;border-radius:9999px;">
                            <span style="width:.4rem;height:.4rem;background:#f59e0b;border-radius:50%;"></span>
                            Draft
                        </span>
                    @endif

                    {{-- Actions --}}
                    <div style="display:flex;align-items:center;gap:.5rem;flex-shrink:0;">
                        @if($template->status === 'draft')
                            <a href="{{ route('filament.admin.resources.form-templates.index') }}"
                               style="padding:.35rem .8rem;background:#059669;color:#fff;font-size:.7rem;font-weight:700;border-radius:.5rem;text-decoration:none;">
                                Publish
                            </a>
                        @endif
                        <a href="{{ route('filament.admin.resources.form-templates.edit', $template->id) }}"
                           style="padding:.35rem .8rem;background:#3d6117;color:#fff;font-size:.7rem;font-weight:700;border-radius:.5rem;text-decoration:none;">
                            Edit
                        </a>
                    </div>

                </div>
                @endforeach
            </div>

            {{-- Footer --}}
            <div style="padding:1rem 1.5rem;background:#f8fafc;border-top:1px solid #f1f5f9;">
                <a href="{{ route('filament.admin.resources.form-templates.create') }}"
                   style="display:inline-flex;align-items:center;gap:.4rem;font-size:.75rem;font-weight:700;color:#3d6117;text-decoration:none;">
                    <svg style="width:.875rem;height:.875rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                    Add new country form
                </a>
            </div>
        @endif
    </div>

    {{-- How it works --}}
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:1.5rem;box-shadow:0 1px 4px rgba(0,0,0,.05);">
        <h3 style="font-size:.875rem;font-weight:900;color:#1e293b;margin:0 0 1.25rem;">How it works</h3>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;">
            @foreach([
                ['n'=>'1','bg'=>'#3d6117','title'=>'Create Template','desc'=>'Add country, visa type, form name and available intakes'],
                ['n'=>'2','bg'=>'#2563eb','title'=>'Build Fields','desc'=>'Add Data & Document sections with ¼ / ½ / full-width field boxes'],
                ['n'=>'3','bg'=>'#7c3aed','title'=>'Publish','desc'=>'Publish the form to make it live for branches and agencies'],
                ['n'=>'4','bg'=>'#059669','title'=>'Receive Applications','desc'=>'Branch / Agency / Student fill and submit — appears in All Applications'],
            ] as $step)
            <div style="display:flex;gap:.75rem;">
                <div style="width:1.75rem;height:1.75rem;background:{{ $step['bg'] }};color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:900;flex-shrink:0;margin-top:.1rem;">{{ $step['n'] }}</div>
                <div>
                    <p style="font-size:.8rem;font-weight:700;color:#1e293b;margin:0 0 .25rem;">{{ $step['title'] }}</p>
                    <p style="font-size:.75rem;color:#94a3b8;margin:0;line-height:1.5;">{{ $step['desc'] }}</p>
                </div>
            </div>
            @endforeach
        </div>
    </div>

</div>
</x-filament-panels::page>
