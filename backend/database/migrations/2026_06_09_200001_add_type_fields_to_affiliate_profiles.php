<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliate_profiles', function (Blueprint $table) {
            // Affiliate type — local manages students, global manages institutions/employees
            $table->enum('affiliate_type', ['local', 'global'])->default('local')->after('tier');

            // Global affiliate extra info
            $table->string('organization_name')->nullable()->after('affiliate_type');
            $table->string('designation')->nullable()->after('organization_name');   // e.g. "Regional Director"
            $table->string('website')->nullable()->after('designation');
            $table->json('target_regions')->nullable()->after('website');            // ["Bangladesh","Nepal"]

            // Performance tier
            $table->enum('performance_level', ['bronze', 'silver', 'gold', 'platinum'])
                ->default('bronze')->after('target_regions');

            // Denormalized counts
            $table->unsignedInteger('managed_institutions_count')->default(0)->after('converted_referrals');
            $table->unsignedInteger('managed_employees_count')->default(0)->after('managed_institutions_count');

            // Commission rates (set by admin)
            // local  → fixed BDT per enrolled student
            // global → percent of deal per student enrolled at their institution
            $table->decimal('local_commission_fixed', 10, 2)->default(5000.00)->after('commission_percent');
            $table->decimal('global_commission_percent', 5, 2)->default(5.00)->after('local_commission_fixed');

            // Onboarding: has the affiliate selected their type yet?
            $table->boolean('type_confirmed')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('affiliate_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'affiliate_type', 'organization_name', 'designation', 'website',
                'target_regions', 'performance_level',
                'managed_institutions_count', 'managed_employees_count',
                'local_commission_fixed', 'global_commission_percent',
                'type_confirmed',
            ]);
        });
    }
};
