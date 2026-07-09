<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Superseded by 2026_07_09_000002_fix_application_status_enum.php
        // doctrine/dbal ->change() was failing in production; left empty to unblock chain
    }

    public function down(): void {}
};
