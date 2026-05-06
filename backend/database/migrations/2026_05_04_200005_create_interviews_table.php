<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('interviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('users');
            $table->foreignId('institution_id')->constrained('users');
            $table->foreignId('arranged_by')->constrained('users'); // Tensai admin

            $table->enum('medium', ['zoom', 'google_meet', 'teams', 'phone', 'in_person'])->default('zoom');
            $table->string('meeting_link')->nullable();
            $table->datetime('scheduled_at');
            $table->integer('duration_minutes')->default(30);

            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'])->default('pending');
            $table->enum('result', ['passed', 'failed', 'pending'])->default('pending');

            $table->text('institution_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('contact_paper')->nullable(); // formal record file

            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('interviews');
    }
};
