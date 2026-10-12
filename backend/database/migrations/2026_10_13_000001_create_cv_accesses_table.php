<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // New, self-contained table: "this account has had its My CV section opened
    // by staff". It changes no existing table — every foreign key points OUT
    // (users cascade, the rest set-null) and nothing points in.
    //
    //  * One row per user (unique user_id): activation is idempotent.
    //  * application_id is the draft "Job CV" Application created on activation,
    //    so the CV shows up in the admin "All Applications" list.
    //  * mobility_candidate_id links the account to its Talent Passport when the
    //    person also used the /mobility chat (matched by phone).
    //  * chat_log keeps the assistant conversation (never name/phone) and
    //    ai_messages_used / ai_messages_limit cap the free AI usage per person.
    //  * public_token + public_enabled drive the shareable CV link; the link is
    //    off until staff switch it on.
    public function up(): void
    {
        Schema::create('cv_accesses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->foreignId('mobility_candidate_id')->nullable()
                ->constrained('mobility_candidates')->nullOnDelete();
            $table->foreignId('application_id')->nullable()
                ->constrained('applications')->nullOnDelete();

            // active | paused (paused hides the builder but keeps the CV)
            $table->string('status', 16)->default('active')->index();

            $table->foreignId('activated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('activated_at')->nullable();

            // Where the CV is in the staff-reviewed pipeline:
            //   share_consent_at  the person ticked "my CV may be shown to employers
            //                     and partners" (set together with cv_submitted_at)
            //   cv_submitted_at   the person pressed "send for review"
            //   sent_at           staff checked it and sent it to All Applications
            // Stage is derived from these, so no status enum needs altering later.
            $table->timestamp('share_consent_at')->nullable();
            $table->timestamp('cv_submitted_at')->nullable();
            $table->timestamp('sent_at')->nullable();

            $table->unsignedInteger('ai_messages_used')->default(0);
            $table->unsignedInteger('ai_messages_limit')->default(150);
            $table->json('chat_log')->nullable();

            $table->string('public_token', 40)->nullable()->unique();
            $table->boolean('public_enabled')->default(false);

            $table->text('admin_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cv_accesses');
    }
};
