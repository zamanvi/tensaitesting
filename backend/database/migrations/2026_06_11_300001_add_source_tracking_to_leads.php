<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('source_type')->default('agency')->after('pool_type');
            // agency | branch | admin | affiliate | student
            $table->unsignedBigInteger('source_branch_id')->nullable()->after('source_agency_id');
            $table->unsignedBigInteger('source_affiliate_id')->nullable()->after('source_branch_id');

            $table->foreign('source_branch_id')->references('id')->on('branches')->nullOnDelete();
            $table->foreign('source_affiliate_id')->references('id')->on('users')->nullOnDelete();
        });

        // Backfill existing leads — if source_agency_id is set → source_type = agency
        \DB::table('leads')->whereNotNull('source_agency_id')->update(['source_type' => 'agency']);
        \DB::table('leads')->whereNull('source_agency_id')->update(['source_type' => 'admin']);
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['source_branch_id']);
            $table->dropForeign(['source_affiliate_id']);
            $table->dropColumn(['source_type', 'source_branch_id', 'source_affiliate_id']);
        });
    }
};
