<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institution_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('institution_name');
            $table->string('institution_name_local')->nullable();
            $table->enum('institution_type', ['university', 'college', 'language_school', 'vocational', 'employer'])->default('university');
            $table->string('country');
            $table->string('city');
            $table->string('address');
            $table->string('website')->nullable();
            $table->string('logo')->nullable();
            $table->text('description')->nullable();

            // Intake settings
            $table->json('intake_months')->nullable(); // [4, 10] = April, October
            $table->json('accepted_qualifications')->nullable();
            $table->json('required_language_scores')->nullable(); // {"jlpt": "N3", "nat": "3"}
            $table->decimal('tuition_fee_min', 12, 2)->nullable();
            $table->decimal('tuition_fee_max', 12, 2)->nullable();
            $table->string('currency', 10)->default('JPY');

            // Commission
            $table->decimal('commission_percent', 5, 2)->default(0);

            // Verification
            $table->enum('status', ['pending', 'active', 'suspended'])->default('pending');
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institution_profiles');
    }
};
