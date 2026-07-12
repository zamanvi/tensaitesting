<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('categories')->insert([
            // Countries
            ['name' => 'Japan',       'slug' => 'japan',       'type' => 'country', 'flag' => '🇯🇵', 'color' => 'red',    'sort_order' => 1,  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Australia',   'slug' => 'australia',   'type' => 'country', 'flag' => '🇦🇺', 'color' => 'yellow', 'sort_order' => 2,  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Canada',      'slug' => 'canada',      'type' => 'country', 'flag' => '🇨🇦', 'color' => 'red',    'sort_order' => 3,  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'UK',          'slug' => 'uk',          'type' => 'country', 'flag' => '🇬🇧', 'color' => 'blue',   'sort_order' => 4,  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Germany',     'slug' => 'germany',     'type' => 'country', 'flag' => '🇩🇪', 'color' => 'gray',   'sort_order' => 5,  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'South Korea', 'slug' => 'south-korea', 'type' => 'country', 'flag' => '🇰🇷', 'color' => 'blue',   'sort_order' => 6,  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'USA',         'slug' => 'usa',         'type' => 'country', 'flag' => '🇺🇸', 'color' => 'blue',   'sort_order' => 7,  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Malaysia',    'slug' => 'malaysia',    'type' => 'country', 'flag' => '🇲🇾', 'color' => 'green',  'sort_order' => 8,  'created_at' => $now, 'updated_at' => $now],
            // Purposes
            ['name' => 'Higher Study', 'slug' => 'higher-study', 'type' => 'purpose', 'flag' => '🎓', 'color' => 'indigo', 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Work & Career','slug' => 'work-career',  'type' => 'purpose', 'flag' => '💼', 'color' => 'amber',  'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Language',     'slug' => 'language',     'type' => 'purpose', 'flag' => '🗣️', 'color' => 'teal',   'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Visa & Legal', 'slug' => 'visa-legal',   'type' => 'purpose', 'flag' => '📋', 'color' => 'orange', 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        DB::table('categories')->truncate();
    }
};
