<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('application_forms', function (Blueprint $table) {
            $table->json('custom_data')->nullable()->after('sponsor_monthly_income');
        });
    }

    public function down(): void
    {
        Schema::table('application_forms', function (Blueprint $table) {
            $table->dropColumn('custom_data');
        });
    }
};
