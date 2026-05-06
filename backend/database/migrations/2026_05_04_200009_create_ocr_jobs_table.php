<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ocr_jobs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();

            $table->enum('document_type', ['passport', 'nid', 'certificate', 'transcript', 'language_score']);
            $table->string('original_file');
            $table->json('extracted_data')->nullable();
            $table->decimal('confidence_score', 5, 2)->nullable(); // 0-100

            $table->enum('status', ['queued', 'processing', 'completed', 'failed', 'review_requested'])->default('queued');
            $table->text('failure_reason')->nullable();
            $table->boolean('data_applied')->default(false); // applied to student profile

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('reviewer_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ocr_jobs');
    }
};
