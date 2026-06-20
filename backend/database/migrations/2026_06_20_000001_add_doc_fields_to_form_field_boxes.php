<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('form_field_boxes', function (Blueprint $table) {
            $table->boolean('document_required')->default(false)->after('requires_document');
            $table->string('doc_label', 255)->nullable()->after('document_required');
            $table->string('doc_key', 100)->nullable()->after('doc_label');
        });
    }

    public function down(): void
    {
        Schema::table('form_field_boxes', function (Blueprint $table) {
            $table->dropColumn(['document_required', 'doc_label', 'doc_key']);
        });
    }
};
