<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institution_selections', function (Blueprint $table) {
            if (!Schema::hasColumn('institution_selections', 'admin_note')) {
                $table->text('admin_note')->nullable()->after('status');
            }
            if (!Schema::hasColumn('institution_selections', 'admin_note_at')) {
                $table->timestamp('admin_note_at')->nullable()->after('admin_note');
            }
        });
    }

    public function down(): void
    {
        Schema::table('institution_selections', function (Blueprint $table) {
            $table->dropColumn(['admin_note', 'admin_note_at']);
        });
    }
};
