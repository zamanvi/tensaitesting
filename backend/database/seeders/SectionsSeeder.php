<?php

namespace Database\Seeders;

use App\Models\Section;
use Illuminate\Database\Seeder;

class SectionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Section::updateOrCreate(
            ['slug' => 'bangladesh'],
            [
                'name' => 'Bangladesh',
                'description' => 'Bengali language learning content for Bangladesh region',
                'order' => 1,
                'is_active' => true,
            ]
        );

        Section::updateOrCreate(
            ['slug' => 'international'],
            [
                'name' => 'International',
                'description' => 'English language learning content for international audience',
                'order' => 2,
                'is_active' => true,
            ]
        );
    }
}
