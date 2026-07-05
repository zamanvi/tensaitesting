<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('application_documents', function (Blueprint $table) {
            // The new Application system only sets application_id.
            // application_form_id belongs to the legacy system and must be nullable.
            $table->foreignId('application_form_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('application_documents', function (Blueprint $table) {
            $table->foreignId('application_form_id')->nullable(false)->change();
        });
    }
};
