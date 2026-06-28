<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->string('admission_manager_name')->nullable()->after('notes');
            $table->string('admission_manager_phone')->nullable()->after('admission_manager_name');
            $table->string('admission_manager_whatsapp')->nullable()->after('admission_manager_phone');
        });
    }

    public function down(): void
    {
        Schema::table('form_templates', function (Blueprint $table) {
            $table->dropColumn(['admission_manager_name', 'admission_manager_phone', 'admission_manager_whatsapp']);
        });
    }
};
