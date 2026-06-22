<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            // Drop the old single-column unique on country
            $table->dropUnique(['country']);

            // New composite unique: same country+visa_type+name = duplicate
            $table->unique(['country', 'visa_type', 'name'], 'form_templates_country_visa_name_unique');
        });
    }

    public function down(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->dropUnique('form_templates_country_visa_name_unique');
            $table->unique('country');
        });
    }
};
