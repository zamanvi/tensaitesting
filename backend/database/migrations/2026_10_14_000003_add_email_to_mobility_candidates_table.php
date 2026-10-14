<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// An e-mail address is the second way (besides the phone number) to recognise
// that a chat lead and a website account are the same person. Optional, filled
// by staff or copied from the account when the two are joined; never shown to
// employers and not part of the public Talent Passport or the Copy-for-AI pack.
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('mobility_candidates', 'email')) {
            return;
        }

        Schema::table('mobility_candidates', function (Blueprint $table) {
            $table->string('email', 190)->nullable()->after('phone')->index();
        });
    }

    public function down(): void
    {
        Schema::table('mobility_candidates', function (Blueprint $table) {
            $table->dropColumn('email');
        });
    }
};
