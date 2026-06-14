<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->enum('city_type', ['preferred', 'must'])->default('preferred')->after('preferred_cities');
            $table->string('preferred_institution')->nullable()->after('city_type');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['city_type', 'preferred_institution']);
        });
    }
};
