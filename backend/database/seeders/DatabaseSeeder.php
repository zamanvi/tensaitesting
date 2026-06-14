<?php

namespace Database\Seeders;

use App\Models\AgencyProfile;
use App\Models\AffiliateProfile;
use App\Models\InstitutionProfile;
use App\Models\StudentProfile;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Default target countries & cities (only seed if not already set)
        if (!Setting::where('key', 'target_countries')->exists()) {
            Setting::set('target_countries', json_encode([
                'Japan' => [
                    'Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Sapporo',
                    'Fukuoka', 'Hiroshima', 'Sendai', 'Kobe', 'Yokohama',
                    'Nara', 'Kanazawa', 'Matsuyama', 'Okayama',
                ],
            ]));
        }

        // Roles
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        $admin      = Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'student']);
        Role::firstOrCreate(['name' => 'agency']);
        Role::firstOrCreate(['name' => 'institution']);
        Role::firstOrCreate(['name' => 'affiliate']);
        Role::firstOrCreate(['name' => 'manager']);

        // Permissions
        $permissions = [
            'manage_users', 'manage_leads', 'manage_agencies',
            'manage_institutions', 'manage_commissions',
            'approve_ocr', 'publish_leads', 'unlock_vault',
            'arrange_interviews', 'view_all_reports',
        ];

        foreach ($permissions as $perm) {
            $p = Permission::firstOrCreate(['name' => $perm]);
            $superAdmin->givePermissionTo($p);
            $admin->givePermissionTo($p);
        }

        // Super Admin user
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@tensai.com'],
            [
                'name' => 'Tensai Admin',
                'password' => Hash::make('Tensai@2026!'),
                'gateway_type' => 'student',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $adminUser->assignRole('super_admin');

        // Demo student
        $student = User::updateOrCreate(
            ['email' => 'student@tensai.com'],
            [
                'name' => 'Demo Student',
                'password' => Hash::make('Student@2026!'),
                'gateway_type' => 'student',
                'status' => 'active',
                'affiliate_code' => 'STUDENT001',
                'email_verified_at' => now(),
            ]
        );
        $student->assignRole('student');
        StudentProfile::firstOrCreate(['user_id' => $student->id]);

        // Demo agency
        $agency = User::updateOrCreate(
            ['email' => 'agency@tensai.com'],
            [
                'name' => 'Demo Agency',
                'password' => Hash::make('Agency@2026!'),
                'gateway_type' => 'agency',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $agency->assignRole('agency');
        AgencyProfile::firstOrCreate(['user_id' => $agency->id]);

        // Demo institution
        $institution = User::updateOrCreate(
            ['email' => 'institution@tensai.com'],
            [
                'name' => 'Demo Institution',
                'password' => Hash::make('Institution@2026!'),
                'gateway_type' => 'institution',
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );
        $institution->assignRole('institution');
        InstitutionProfile::firstOrCreate(
            ['user_id' => $institution->id],
            ['institution_name' => 'Demo University', 'country' => 'Japan', 'status' => 'active']
        );

        // Demo affiliate
        $affiliate = User::updateOrCreate(
            ['email' => 'affiliate@tensai.com'],
            [
                'name' => 'Demo Affiliate',
                'password' => Hash::make('Affiliate@2026!'),
                'gateway_type' => 'affiliate',
                'status' => 'active',
                'affiliate_code' => 'AFFILIATE001',
                'email_verified_at' => now(),
            ]
        );
        $affiliate->assignRole('affiliate');
        AffiliateProfile::firstOrCreate(['user_id' => $affiliate->id]);
    }
}
