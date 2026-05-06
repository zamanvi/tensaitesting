<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agency_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('agency_name');
            $table->string('agency_name_bn')->nullable();
            $table->string('registration_number')->nullable()->unique();
            $table->string('trade_license')->nullable();
            $table->string('trade_license_document')->nullable();
            $table->string('contact_person_name');
            $table->string('contact_person_phone');
            $table->string('address');
            $table->string('city');
            $table->string('website')->nullable();
            $table->text('description')->nullable();
            $table->string('logo')->nullable();

            // Vetting
            $table->enum('vetting_status', ['pending', 'under_review', 'approved', 'rejected'])->default('pending');
            $table->integer('slot_number')->nullable(); // 1-20 vetted slots
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();

            // Capabilities
            $table->json('target_countries')->nullable(); // ['Japan', 'Korea', ...]
            $table->json('service_types')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agency_profiles');
    }
};
