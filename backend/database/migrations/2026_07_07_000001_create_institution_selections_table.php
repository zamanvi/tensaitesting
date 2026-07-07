<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institution_selections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('institution_id')->constrained('users')->cascadeOnDelete();

            // Contact person submitted by institution at selection time
            $table->string('connect_name')->nullable();
            $table->string('connect_email')->nullable();
            $table->string('connect_whatsapp')->nullable();
            $table->string('connect_phone')->nullable();

            // Status flow: selected → accepted | cancelled
            $table->enum('status', ['selected', 'accepted', 'cancelled'])->default('selected');

            $table->timestamp('selected_at')->useCurrent();
            $table->timestamps();

            // One institution can only select a lead once
            $table->unique(['lead_id', 'institution_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institution_selections');
    }
};
