<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'applicant_name', 'full_name', 'full_name_japanese', 'date_of_birth',
        'gender', 'blood_group', 'mobile_number', 'whatsapp_number',
        'nationality', 'religion', 'address_bangladesh',
        'street_address', 'district', 'division', 'postal_code',
        'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
        'passport_number', 'passport_expiry', 'passport_document',
        'nid_number', 'nid_document', 'highest_qualification', 'gpa',
        'institution_name', 'passing_year', 'jlpt_level', 'nat_level',
        'ielts_score', 'language_documents',
        'is_admin_verified', 'is_data_locked',
        'admin_notes', 'locked_at', 'locked_by',
        'phone_visible_to_institution', 'email_visible_to_institution',
        'family_info', 'permanent_address', 'present_address',
        'education_history', 'sponsor_info',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'passport_expiry' => 'date',
        'language_documents' => 'array',
        'family_info' => 'array',
        'permanent_address' => 'array',
        'present_address' => 'array',
        'education_history' => 'array',
        'sponsor_info' => 'array',
        'is_admin_verified' => 'boolean',
        'is_data_locked' => 'boolean',
        'phone_visible_to_institution' => 'boolean',
        'email_visible_to_institution' => 'boolean',
        'locked_at' => 'datetime',
        'gpa' => 'decimal:2',
        'ielts_score' => 'decimal:1',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function locker() { return $this->belongsTo(User::class, 'locked_by'); }

    public function lock(int $adminId): void
    {
        $this->update([
            'is_data_locked' => true,
            'locked_at' => now(),
            'locked_by' => $adminId,
        ]);
    }
}
