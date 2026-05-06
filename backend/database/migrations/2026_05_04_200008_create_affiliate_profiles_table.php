<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('tier', ['associate', 'global_partner'])->default('associate');
            // associate = student onboarding, volume-based fixed commission
            // global_partner = institution onboarding, high-value recurring commission

            $table->string('country')->nullable(); // global_partner location
            $table->text('bio')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
            $table->string('bank_account_name')->nullable();
            $table->string('bkash_number')->nullable();
            $table->string('nagad_number')->nullable();

            // Stats (denormalized for performance)
            $table->integer('total_referrals')->default(0);
            $table->integer('converted_referrals')->default(0);
            $table->decimal('total_earned', 12, 2)->default(0);
            $table->decimal('pending_payout', 12, 2)->default(0);

            // Commission rates
            $table->decimal('commission_percent', 5, 2)->default(10.00);

            $table->enum('status', ['active', 'suspended'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_profiles');
    }
};
