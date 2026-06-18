<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_code', 32)->unique();
            $table->foreignId('form_template_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // submitter
            $table->string('submitted_by_role', 32)->default('branch_admin'); // branch_admin, agency, student, admin
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('student_name');
            $table->string('student_email')->nullable();
            $table->string('student_phone')->nullable();
            $table->json('form_data')->nullable();
            $table->unsignedSmallInteger('progress')->default(0);
            $table->enum('status', ['draft', 'submitted', 'accepted', 'rejected'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};