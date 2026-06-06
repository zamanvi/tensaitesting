<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE ocr_jobs MODIFY COLUMN document_type ENUM(
            'passport',
            'nid_student',
            'ssc_certificate',
            'ssc_marksheet',
            'hsc_certificate',
            'hsc_marksheet',
            'degree_certificate',
            'transcript',
            'birth_certificate_student',
            'father_birth_certificate',
            'father_nid',
            'mother_birth_certificate',
            'mother_nid',
            'student_photo',
            'sponsor_photo',
            'jlpt_certificate',
            'jlpt_marksheet',
            'nat_certificate',
            'nat_marksheet',
            'ielts_certificate'
        ) NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE ocr_jobs MODIFY COLUMN document_type ENUM(
            'passport','nid','ssc_certificate','hsc_certificate',
            'degree_certificate','transcript','jlpt_certificate','ielts_certificate'
        ) NOT NULL");
    }
};
