<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Personal info (OCR-populated)
            $table->string('full_name')->nullable();
            $table->string('full_name_japanese')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('nationality')->nullable();
            $table->string('religion')->nullable();
            $table->text('address_bangladesh')->nullable();

            // Passport
            $table->string('passport_number')->nullable()->unique();
            $table->date('passport_expiry')->nullable();
            $table->string('passport_document')->nullable(); // file path

            // NID
            $table->string('nid_number')->nullable()->unique();
            $table->string('nid_document')->nullable();

            // Academic
            $table->string('highest_qualification')->nullable();
            $table->decimal('gpa', 4, 2)->nullable();
            $table->string('institution_name')->nullable();
            $table->year('passing_year')->nullable();

            // Language scores
            $table->string('jlpt_level')->nullable(); // N1-N5
            $table->string('nat_level')->nullable();
            $table->decimal('ielts_score', 3, 1)->nullable();
            $table->json('language_documents')->nullable();

            // Verification
            $table->boolean('is_ocr_verified')->default(false);
            $table->boolean('is_admin_verified')->default(false);
            $table->boolean('is_data_locked')->default(false);
            $table->enum('ocr_status', ['pending', 'processing', 'verified', 'failed', 'review_requested'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamp('locked_at')->nullable();
            $table->foreignId('locked_by')->nullable()->constrained('users')->nullOnDelete();

            // Privacy
            $table->boolean('phone_visible_to_institution')->default(false);
            $table->boolean('email_visible_to_institution')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};
