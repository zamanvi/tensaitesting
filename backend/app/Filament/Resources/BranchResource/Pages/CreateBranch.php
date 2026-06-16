<?php

namespace App\Filament\Resources\BranchResource\Pages;

use App\Filament\Resources\BranchResource;
use App\Models\User;
use Filament\Resources\Pages\CreateRecord;

class CreateBranch extends CreateRecord
{
    protected static string $resource = BranchResource::class;

    protected function afterCreate(): void
    {
        $data = $this->data;
        $branch = $this->record;

        if (empty($data['manager_name']) || empty($data['manager_email']) || empty($data['manager_password'])) {
            return;
        }

        $user = User::create([
            'name'                   => $data['manager_name'],
            'email'                  => $data['manager_email'],
            'password'               => bcrypt($data['manager_password']),
            'gateway_type'           => 'branch',
            'status'                 => 'active',
            'branch_id'              => $branch->id,
            'phone'                  => $data['manager_phone'] ?? null,
            'whatsapp'               => $data['manager_whatsapp'] ?? null,
            'manager_plain_password' => $data['manager_password'],
            'email_verified_at'      => now(),
        ]);

        $user->assignRole('branch_admin');
    }
}
