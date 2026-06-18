<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_field_boxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_field_group_id')->constrained('form_field_groups')->onDelete('cascade');
            $table->string('name');                          // e.g. "HSC Result"
            $table->boolean('requires_document')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('form_template_fields', function (Blueprint $table) {
            $table->foreignId('form_field_box_id')->nullable()->after('form_field_group_id')
                  ->constrained('form_field_boxes')->onDelete('cascade');
            // make group nullable — fields now belong to a box, not directly to a group
            $table->foreignId('form_field_group_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('form_template_fields', function (Blueprint $table) {
            $table->dropForeign(['form_field_box_id']);
            $table->dropColumn('form_field_box_id');
            $table->foreignId('form_field_group_id')->nullable(false)->change();
        });

        Schema::dropIfExists('form_field_boxes');
    }
};
