<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Groups table
        Schema::create('form_field_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_template_id')->constrained()->onDelete('cascade');
            $table->string('label');                    // "HSC Information"
            $table->string('hint')->nullable();         // shown under group title
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Extend form_template_fields
        Schema::table('form_template_fields', function (Blueprint $table) {
            $table->foreignId('form_field_group_id')->nullable()->after('form_template_id')
                  ->constrained('form_field_groups')->onDelete('cascade');
            $table->enum('box_size', ['small', 'middle', 'full'])->default('middle')->after('sort_order');
            // Conditional visibility
            $table->string('conditional_field_key')->nullable()->after('box_size');
            $table->enum('conditional_operator', ['is', 'is_not', 'is_empty', 'is_not_empty'])->nullable()->after('conditional_field_key');
            $table->string('conditional_value')->nullable()->after('conditional_operator');
        });
    }

    public function down(): void
    {
        Schema::table('form_template_fields', function (Blueprint $table) {
            $table->dropForeign(['form_field_group_id']);
            $table->dropColumn(['form_field_group_id', 'box_size', 'conditional_field_key', 'conditional_operator', 'conditional_value']);
        });
        Schema::dropIfExists('form_field_groups');
    }
};
