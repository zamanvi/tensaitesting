<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\CommissionResource;
use App\Filament\Resources\LeadResource;
use App\Filament\Resources\OcrJobResource;
use App\Models\Commission;
use App\Models\Lead;
use App\Models\OcrJob;
use Filament\Facades\Filament;
use Filament\Widgets\Widget;

class QuickActionsWidget extends Widget
{
    protected static ?int $sort = 3;
    protected int | string | array $columnSpan = 1;
    protected static string $view = 'filament.widgets.quick-actions';

    // The Dashboard is shared with the manager panel, where Leads and OCR
    // Jobs aren't registered — the view's getUrl() calls for them throw
    // RouteNotFoundException there, 500ing the widget. Only show it where
    // every resource it links to actually exists.
    public static function canView(): bool
    {
        $registered = Filament::getCurrentPanel()?->getResources() ?? [];

        foreach ([OcrJobResource::class, CommissionResource::class, LeadResource::class] as $resource) {
            if (! in_array($resource, $registered, true)) {
                return false;
            }
        }

        return true;
    }

    public function getViewData(): array
    {
        return [
            'ocrPending'        => OcrJob::where('status', 'review_requested')->count(),
            'commissionsDue'    => Commission::where('status', 'due')->count(),
            'leadsOnHold'       => Lead::where('status', 'on_hold')->count(),
            'visaProcessing'    => Lead::where('status', 'visa_processing')->count(),
        ];
    }
}
