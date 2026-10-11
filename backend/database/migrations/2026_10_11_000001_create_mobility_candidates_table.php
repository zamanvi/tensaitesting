<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // New, self-contained table for the "Skilled Worker Mobility" chat — it adds
    // nothing to, and has no foreign key pointing INTO, any existing table
    // (branch_id only points out to branches, nullable, set-null on delete).
    //
    // Deliberately NO passport number, NID number, address or date of birth:
    // the chat never asks for them. Staff collect and verify originals in person.
    // `status` is a plain string (not an enum) so new states never need an
    // ALTER on a populated table.
    public function up(): void
    {
        Schema::create('mobility_candidates', function (Blueprint $table) {
            $table->id();

            // Unguessable public id used in the Talent Passport URL.
            $table->string('code', 12)->unique();

            // new → contacted → verified → passport_ready → closed
            $table->string('status', 24)->default('new')->index();
            $table->string('source', 24)->default('chat');
            $table->string('lang', 5)->nullable();          // en | bn | ja

            // Contact, given in the chat. phone_consent must be true before any
            // staff follow-up; consented_at records when it was ticked.
            $table->string('full_name')->nullable();
            $table->string('phone', 32)->nullable()->index();
            $table->boolean('phone_consent')->default(false);
            $table->timestamp('consented_at')->nullable();

            // Answers from the chat.
            $table->string('role', 120)->nullable();
            $table->string('experience', 80)->nullable();
            $table->string('licence', 160)->nullable();
            $table->string('languages', 160)->nullable();
            $table->string('target_country', 80)->nullable();
            $table->json('answers')->nullable();            // raw transcript, for staff

            // Staff / AI side.
            $table->text('summary')->nullable();            // English profile summary
            $table->string('video_url', 500)->nullable();   // YouTube unlisted link
            $table->boolean('passport_published')->default(false);
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->text('admin_notes')->nullable();

            // Spam control for the public endpoint without storing the raw IP.
            $table->string('ip_hash', 64)->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mobility_candidates');
    }
};
