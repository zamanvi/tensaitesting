<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_no', 32)->unique();
            $table->foreignId('application_id')->nullable()->constrained()->nullOnDelete();
            // restrict, not cascade: deleting a branch must never silently wipe its
            // payment ledger — a branch with payment history simply can't be deleted.
            $table->foreignId('branch_id')->constrained()->restrictOnDelete();
            $table->foreignId('payment_category_id')->constrained()->restrictOnDelete();

            // Snapshot of the category's fund routing at the moment of entry —
            // intentionally NOT re-derived from payment_categories at read time,
            // so a later category reassignment never rewrites already-settled history.
            $table->enum('fund_target', ['branch', 'head_office']);

            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('BDT');
            $table->enum('method', ['cash', 'bank'])->default('cash');

            $table->string('customer_name');
            $table->string('customer_phone')->nullable();
            $table->string('customer_email')->nullable();

            $table->foreignId('received_by')->constrained('users')->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'created_at']);
            $table->index(['application_id']);
            $table->index(['fund_target']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
