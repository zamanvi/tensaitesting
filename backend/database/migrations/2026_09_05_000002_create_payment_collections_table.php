<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per actual cash-changing-hands event against a memo — the
        // memo itself (payments) stays the single "invoice" (total, running
        // amount collected, due), this is the installment-by-installment
        // history: the first creation is collection #1, every later
        // Collect Payment call adds another. Lets a receipt say "this
        // payment: X on this date" instead of only ever showing the
        // cumulative total.
        Schema::create('payment_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_collections');
    }
};
