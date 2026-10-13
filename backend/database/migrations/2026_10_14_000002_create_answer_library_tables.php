<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Two new, self-contained tables for the staff-verified Answer Library.
    //
    //  answer_library_items      the library itself. Only items that staff have
    //                            VERIFIED (status = verified, not past valid_until)
    //                            are ever shown to a user. A starter draft is never
    //                            shown until a person verifies it.
    //  answer_library_questions  what people asked (text trimmed, long digit
    //                            strings and e-mail addresses masked) and what
    //                            they got back, so the library grows from real
    //                            questions. user_id points out to users and is
    //                            cleared if the user is deleted.
    public function up(): void
    {
        Schema::create('answer_library_items', function (Blueprint $table) {
            $table->id();

            $table->string('slug', 80)->unique();            // stable id, used by the starter import
            $table->string('category', 40)->index();

            $table->string('question_en');
            $table->string('question_bn')->nullable();
            $table->text('keywords')->nullable();             // words people use, English and Bangla

            $table->text('answer_en');
            $table->text('answer_bn')->nullable();
            $table->text('answer_ja')->nullable();

            $table->string('source_url', 500)->nullable();    // the official page the answer is based on
            $table->text('staff_note')->nullable();           // what to double-check; never shown to users

            // draft -> verified -> archived. Editing a verified answer sends it back to draft.
            $table->string('status', 16)->default('draft')->index();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->date('valid_until')->nullable();          // for dates, fees, schedules that go stale

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unsignedInteger('times_shown')->default(0);
            $table->unsignedInteger('helpful_yes')->default(0);
            $table->unsignedInteger('helpful_no')->default(0);

            $table->timestamps();
        });

        Schema::create('answer_library_questions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('question', 300);
            $table->string('lang', 5)->nullable();

            $table->foreignId('item_id')->nullable()->constrained('answer_library_items')->nullOnDelete();
            $table->string('outcome', 16)->index();            // matched | suggested | none
            $table->decimal('score', 4, 2)->nullable();

            $table->boolean('helpful')->nullable();
            $table->timestamp('handled_at')->nullable()->index();   // staff dealt with it

            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answer_library_questions');
        Schema::dropIfExists('answer_library_items');
    }
};
