<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Three nullable, additive columns on the new mobility_candidates table
    // (nothing else is touched). They let staff sort the list by "who is
    // actually ready to come in" instead of reading every transcript.
    //   has_passport     - true only when the candidate said they hold a valid one
    //                      (the passport NUMBER is never collected)
    //   can_visit_office - can come to the Dhaka or Pabna office
    //   district         - free text, as typed by the candidate
    // Existing rows simply have them unset.
    public function up(): void
    {
        Schema::table('mobility_candidates', function (Blueprint $table) {
            $table->boolean('has_passport')->nullable()->after('target_country');
            $table->boolean('can_visit_office')->nullable()->after('has_passport');
            $table->string('district', 80)->nullable()->after('can_visit_office');
        });
    }

    public function down(): void
    {
        Schema::table('mobility_candidates', function (Blueprint $table) {
            $table->dropColumn(['has_passport', 'can_visit_office', 'district']);
        });
    }
};
