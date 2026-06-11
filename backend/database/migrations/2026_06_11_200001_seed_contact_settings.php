<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $rows = [
            // Social Media
            ['key' => 'facebook_url',   'label' => 'Facebook Page URL',     'value' => 'https://www.facebook.com/TensaiConsultancyy'],
            ['key' => 'youtube_url',    'label' => 'YouTube Channel URL',   'value' => 'https://www.youtube.com/@tensaiconsultancy7582'],
            ['key' => 'instagram_url',  'label' => 'Instagram URL',         'value' => ''],
            ['key' => 'tiktok_url',     'label' => 'TikTok URL',            'value' => ''],
            ['key' => 'linkedin_url',   'label' => 'LinkedIn URL',          'value' => ''],
            ['key' => 'twitter_url',    'label' => 'X / Twitter URL',       'value' => ''],
            // Contact
            ['key' => 'support_email',  'label' => 'Support Email',         'value' => ''],
            ['key' => 'office_address', 'label' => 'Office Address',        'value' => ''],
            // Copyright
            ['key' => 'copyright_en',   'label' => 'Copyright Text (EN)',   'value' => '© 2026 Tensai Consultancy Ltd. All rights reserved.'],
            ['key' => 'copyright_ja',   'label' => 'Copyright Text (JA)',   'value' => '© 2026 テンサイコンサルタンシー株式会社。無断転載禁止。'],
            ['key' => 'copyright_bn',   'label' => 'Copyright Text (BN)',   'value' => '© 2026 তেনসাই কনসালটেন্সি লিমিটেড। সর্বস্বত্ব সংরক্ষিত।'],
        ];

        foreach ($rows as $row) {
            DB::table('settings')->updateOrInsert(
                ['key' => $row['key']],
                ['label' => $row['label'], 'value' => $row['value'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'facebook_url', 'youtube_url', 'instagram_url', 'tiktok_url',
            'linkedin_url', 'twitter_url', 'support_email', 'office_address',
            'copyright_en', 'copyright_ja', 'copyright_bn',
        ])->delete();
    }
};
