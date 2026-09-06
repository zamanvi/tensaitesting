<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Nullable at the DB level — old memos have no way to be retroactively
    // assigned a roll, that's an accepted known gap. Every new memo requires
    // it, but that's enforced in the form/controller validation, not here.
    //
    // Roll numbers are unique per branch, not globally (two different
    // branches can both have a "Roll 5" who are two different people), so
    // the index is composite — it's what every "this student's total" lookup
    // groups/filters by.
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('student_roll')->nullable()->after('customer_email');
            $table->index(['branch_id', 'student_roll']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['branch_id', 'student_roll']);
            $table->dropColumn('student_roll');
        });
    }
};
