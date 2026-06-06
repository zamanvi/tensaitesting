<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('help_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('document_type')->nullable();
            $table->string('contact_via')->default('whatsapp'); // whatsapp, phone
            $table->string('status')->default('pending'); // pending, contacted, resolved
            $table->text('note')->nullable();
            $table->timestamp('contacted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('help_requests');
    }
};
