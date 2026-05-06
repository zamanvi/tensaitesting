<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('lead_code')->unique(); // TEN-2026-XXXXX

            // Student
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();

            // Ownership
            $table->enum('pool_type', ['open', 'private'])->default('private');
            $table->foreignId('source_agency_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_agency_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_institution_id')->nullable()->constrained('users')->nullOnDelete();

            // Affiliate tracking
            $table->foreignId('affiliate_id')->nullable()->constrained('users')->nullOnDelete();

            // Status pipeline
            $table->enum('status', [
                'new',
                'profile_complete',
                'under_review',
                'shortlisted',
                'interview_scheduled',
                'interviewed',
                'offer_received',
                'accepted',
                'visa_processing',
                'visa_approved',
                'visa_rejected',
                'enrolled',
                'closed',
                'on_hold',
            ])->default('new');

            // Lead sharing
            $table->boolean('is_published')->default(false); // published to open pool
            $table->timestamp('published_at')->nullable();
            $table->decimal('unlock_fee', 10, 2)->nullable(); // fee to unlock from private vault
            $table->boolean('is_locked')->default(false); // locked by source agency

            // Target
            $table->string('target_country')->default('Japan');
            $table->string('target_course')->nullable();
            $table->date('target_intake')->nullable();

            // Notes
            $table->text('admin_notes')->nullable();
            $table->text('agency_notes')->nullable();

            // Referral (when forwarded B2B)
            $table->foreignId('forwarded_from_agency_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('referral_fee', 10, 2)->nullable();
            $table->boolean('referral_fee_paid')->default(false);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
