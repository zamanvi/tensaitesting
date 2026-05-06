<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained()->cascadeOnDelete();

            $table->enum('type', [
                'platform_service_fee',      // student pays Tensai
                'institution_commission',    // institution pays Tensai on enrollment
                'agency_processing_fee',     // agency pays Tensai (10-20%)
                'lead_unlock_fee',           // B2B lead unlock (10,000 BDT)
                'b2b_profit_share',          // collaborative route profit share
                'affiliate_associate',       // student onboarding affiliate
                'affiliate_global_partner',  // institution onboarding affiliate
                'referral_sourcing_fee',     // source agency gets when lead converted by another
            ]);

            $table->foreignId('payer_id')->constrained('users');
            $table->foreignId('payee_id')->constrained('users'); // Tensai platform user or affiliate
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('BDT');
            $table->decimal('percent', 5, 2)->nullable();

            $table->enum('status', ['pending', 'due', 'paid', 'disputed', 'waived'])->default('pending');
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
