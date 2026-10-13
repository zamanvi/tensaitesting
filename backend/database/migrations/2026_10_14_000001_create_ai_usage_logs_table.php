<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // New, self-contained table: one row per call the website makes to an AI
    // service, so what the AI costs can be measured instead of guessed.
    //
    // It stores COUNTS ONLY: which feature, which model, how many tokens, how long
    // it took, whether it worked. Never the question, the answer, a name or any
    // other personal data. user_id points out to users and is cleared if the
    // user is deleted; nothing points in.
    public function up(): void
    {
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();

            $table->string('feature', 40)->index();          // e.g. cv_summary
            $table->string('provider', 20);                   // gemini | anthropic
            $table->string('model', 80);

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);   // includes thinking tokens
            $table->unsignedInteger('cached_input_tokens')->default(0);

            // Estimated from config/ai.php prices; null when the model's price is not listed.
            $table->decimal('cost_usd', 10, 6)->nullable();

            $table->boolean('ok')->default(true);
            $table->string('error', 40)->nullable();          // short code, e.g. http_429, no_key
            $table->unsignedInteger('latency_ms')->nullable();

            $table->timestamp('created_at')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
    }
};
