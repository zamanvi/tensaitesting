<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_papers', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique(); // CP-2026-XXXXX
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('interview_id')->nullable()->constrained()->nullOnDelete();

            $table->enum('type', [
                'interview_request',
                'interview_confirmation',
                'selection_result',
                'offer_letter',
                'visa_status',
                'enrollment_confirmation',
                'general_notice',
            ]);

            $table->foreignId('from_user_id')->constrained('users');
            $table->foreignId('to_user_id')->constrained('users');
            $table->foreignId('cc_admin_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('subject');
            $table->text('body');
            $table->json('attachments')->nullable();

            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamp('acknowledged_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_papers');
    }
};
