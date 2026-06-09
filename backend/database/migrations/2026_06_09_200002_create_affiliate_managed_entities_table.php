<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_managed_entities', function (Blueprint $table) {
            $table->id();

            // Which global affiliate manages this entity
            $table->foreignId('affiliate_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('entity_type', ['institution', 'employee']);

            // ── Identity ─────────────────────────────────────────────────────
            $table->string('name');                          // school or employee name
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('website')->nullable();

            // ── Location ─────────────────────────────────────────────────────
            $table->string('country')->nullable();
            $table->string('city')->nullable();

            // ── Institution-specific ─────────────────────────────────────────
            $table->string('specialty')->nullable(); // "Language School", "University", "Vocational"
            $table->unsignedInteger('capacity')->nullable();  // max students per intake

            // ── Employee-specific ─────────────────────────────────────────────
            $table->string('designation')->nullable();       // "Regional Rep", "Field Agent"

            // ── Linked Tensai account (optional) ────────────────────────────
            $table->foreignId('linked_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // ── Status & deal ─────────────────────────────────────────────────
            $table->enum('status', ['prospect', 'active', 'inactive'])->default('prospect');

            // Commission earned by this global affiliate per student enrolled HERE
            $table->decimal('commission_percent', 5, 2)->default(0.00);

            // ── Metrics (denormalized) ────────────────────────────────────────
            $table->unsignedInteger('total_enrollments')->default(0);
            $table->decimal('total_earned', 12, 2)->default(0.00);

            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_managed_entities');
    }
};
