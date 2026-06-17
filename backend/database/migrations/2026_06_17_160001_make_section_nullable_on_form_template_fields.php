<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_template_fields', function (Blueprint $table) {
            $table->string('section')->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        Schema::table('form_template_fields', function (Blueprint $table) {
            $table->string('section')->nullable(false)->change();
        });
    }
};
