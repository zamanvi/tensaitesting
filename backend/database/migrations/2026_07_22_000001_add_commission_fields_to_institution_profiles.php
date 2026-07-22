<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institution_profiles', function (Blueprint $table) {
            $table->enum('commission_type', ['percentage', 'flat'])->default('percentage')->after('commission_percent');
            $table->decimal('commission_value', 12, 2)->nullable()->after('commission_type');
            $table->string('commission_currency', 10)->nullable()->after('commission_value');
        });
    }

    public function down(): void
    {
        Schema::table('institution_profiles', function (Blueprint $table) {
            $table->dropColumn(['commission_type', 'commission_value', 'commission_currency']);
        });
    }
};
