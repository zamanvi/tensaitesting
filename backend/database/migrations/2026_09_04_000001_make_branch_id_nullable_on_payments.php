<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // "Main Branch" (Admin / Head Office) is not a Branch record — a memo
        // filed there simply has no branch. Not every admin-created memo
        // belongs to a physical branch office, so this can no longer be a
        // required foreign key.
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable(false)->change();
        });
    }
};
