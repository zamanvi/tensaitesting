<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_form_id')->constrained()->onDelete('cascade');
            // doc_type: photo | passport | certificate | transcript | language_cert | nid | bank_statement | sponsor
            $table->string('doc_type');
            $table->string('label');
            $table->string('file_path')->nullable();
            $table->string('original_name')->nullable();
            $table->bigInteger('file_size')->nullable(); // bytes
            $table->string('mime_type')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_documents');
    }
};
