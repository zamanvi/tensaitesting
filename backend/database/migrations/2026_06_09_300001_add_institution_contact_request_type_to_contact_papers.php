<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE contact_papers MODIFY COLUMN type ENUM(
            'interview_request',
            'interview_confirmation',
            'selection_result',
            'offer_letter',
            'visa_status',
            'enrollment_confirmation',
            'general_notice',
            'institution_contact_request'
        ) NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE contact_papers MODIFY COLUMN type ENUM(
            'interview_request',
            'interview_confirmation',
            'selection_result',
            'offer_letter',
            'visa_status',
            'enrollment_confirmation',
            'general_notice'
        ) NOT NULL");
    }
};
