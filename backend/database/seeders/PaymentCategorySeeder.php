<?php

namespace Database\Seeders;

use App\Models\PaymentCategory;
use Illuminate\Database\Seeder;

class PaymentCategorySeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['key' => 'course_fee',      'label' => 'Course Fee',           'fund_target' => 'branch',      'sort_order' => 1],
            ['key' => 'processing_fee',  'label' => 'Visa Processing Fee',  'fund_target' => 'head_office', 'sort_order' => 2],
            ['key' => 'service_charge',  'label' => 'Service Charge',       'fund_target' => 'head_office', 'sort_order' => 3],
        ];

        foreach ($rows as $row) {
            PaymentCategory::updateOrCreate(['key' => $row['key']], $row);
        }
    }
}
