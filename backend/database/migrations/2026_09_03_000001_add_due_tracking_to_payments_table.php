<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // The full invoice amount for this memo. `amount` keeps its existing
            // meaning — "collected so far" — so every fund-routing/settlement
            // calculation elsewhere keeps working unchanged; it only ever sums
            // real cash in hand, never money still owed.
            $table->decimal('total_amount', 12, 2)->nullable()->after('amount');
            $table->enum('status', ['due', 'partial', 'paid'])->default('paid')->after('total_amount');
        });

        // Backfill: every pre-existing memo was, by definition, collected in
        // full at entry (there was no partial/due concept before this).
        DB::table('payments')->whereNull('total_amount')->update([
            'total_amount' => DB::raw('amount'),
            'status'       => 'paid',
        ]);

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('total_amount', 12, 2)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['total_amount', 'status']);
        });
    }
};
