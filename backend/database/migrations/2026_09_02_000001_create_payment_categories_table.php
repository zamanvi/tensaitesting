<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_categories', function (Blueprint $table) {
            $table->id();
            $table->string('key', 64)->unique();
            $table->string('label');
            $table->enum('fund_target', ['branch', 'head_office']);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed the 3 default categories here (not a separate `db:seed` step) so
        // `php artisan migrate --force` — the only migration command the Railway
        // Procfile actually runs on deploy — leaves the branch dashboard usable
        // immediately, with no manual follow-up step against production.
        $now = now();
        \Illuminate\Support\Facades\DB::table('payment_categories')->insert([
            ['key' => 'course_fee',     'label' => 'Course Fee',          'fund_target' => 'branch',      'is_active' => true, 'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'processing_fee', 'label' => 'Visa Processing Fee', 'fund_target' => 'head_office', 'is_active' => true, 'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['key' => 'service_charge', 'label' => 'Service Charge',      'fund_target' => 'head_office', 'is_active' => true, 'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_categories');
    }
};
