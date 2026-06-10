<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliate_profiles', function (Blueprint $table) {
            $table->text('upgrade_request_reason')->nullable()->after('managed_employees_count');
            $table->timestamp('upgrade_requested_at')->nullable()->after('upgrade_request_reason');
            $table->enum('upgrade_status', ['none', 'pending', 'approved', 'rejected'])->default('none')->after('upgrade_requested_at');
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_profiles', function (Blueprint $table) {
            $table->dropColumn(['upgrade_request_reason', 'upgrade_requested_at', 'upgrade_status']);
        });
    }
};
