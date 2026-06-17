<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_templates', function (Blueprint $table) {
            $table->id();
            $table->string('country')->unique();           // "Japan", "Canada", etc.
            $table->string('name');                        // display name
            $table->json('intake_options')->nullable();    // ["April 2025","October 2025"]
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('form_template_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_template_id')->constrained()->onDelete('cascade');
            $table->string('field_key');          // "jlpt_level" / "custom_coe_number" etc.
            $table->string('label');              // display label shown to branch admin
            $table->string('section');            // personal|academic|language|study|sponsor|documents
            $table->string('field_type');         // text|number|date|select|file|textarea
            $table->boolean('is_required')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('options')->nullable();  // for select type: ["N1","N2","N3"]
            $table->string('placeholder')->nullable();
            $table->string('helper_text')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['form_template_id', 'field_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_template_fields');
        Schema::dropIfExists('form_templates');
    }
};
