<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users.affiliate_code is queried on every referral registration lookup
        Schema::table('users', function (Blueprint $table) {
            $table->index('affiliate_code', 'users_affiliate_code_idx');
        });

        // help_requests: speed up duplicate-request check (user + doc type + status)
        Schema::table('help_requests', function (Blueprint $table) {
            $table->index(['user_id', 'document_type', 'status'], 'help_requests_user_doc_status_idx');
        });

        // commissions: speed up payee earnings queries
        Schema::table('commissions', function (Blueprint $table) {
            $table->index(['payee_id', 'status'], 'commissions_payee_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_affiliate_code_idx');
        });

        Schema::table('help_requests', function (Blueprint $table) {
            $table->dropIndex('help_requests_user_doc_status_idx');
        });

        Schema::table('commissions', function (Blueprint $table) {
            $table->dropIndex('commissions_payee_status_idx');
        });
    }
};
