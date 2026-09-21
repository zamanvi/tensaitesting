<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // All three nullable and additive — existing memos simply have them
    // unset, nothing reads or requires them today. payment_date is the
    // actual date the money changed hands (distinct from created_at, the
    // moment the memo was entered — staff often back-enter historical
    // memos). admission_date/admission_batch belong to the student, not
    // the individual memo — only ever filled on a student's first memo
    // for a given branch (see PaymentResource::studentHasExistingMemo()),
    // left blank on every later one.
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->date('payment_date')->nullable()->after('method');
            $table->date('admission_date')->nullable()->after('student_roll');
            $table->string('admission_batch')->nullable()->after('admission_date');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_date', 'admission_date', 'admission_batch']);
        });
    }
};
