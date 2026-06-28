<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->boolean('live_to_school')->default(false)->after('submitted_at');
            $table->timestamp('live_to_school_at')->nullable()->after('live_to_school');
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn(['live_to_school', 'live_to_school_at']);
        });
    }
};
