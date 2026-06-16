<?php

namespace App\Filament\Resources\BranchResource\Pages;

use App\Filament\Resources\BranchResource;
use App\Models\User;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Hash;

class EditBranch extends EditRecord
{
    protected static string $resource = BranchResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }

    protected function afterSave(): void
    {
        $data = $this->data;
        $branch = $this->record;

        $admin = $branch->admins()->first();

        if (!$admin) {
            // No manager yet — create one if name+email+password provided
            if (!empty($data['manager_name_edit']) && !empty($data['manager_email_edit']) && !empty($data['manager_password_edit'])) {
                $user = User::create([
                    'name'                   => $data['manager_name_edit'],
                    'email'                  => $data['manager_email_edit'],
                    'password'               => Hash::make($data['manager_password_edit']),
                    'gateway_type'           => 'branch',
                    'status'                 => 'active',
                    'branch_id'              => $branch->id,
                    'phone'                  => $data['manager_phone_edit'] ?? null,
                    'whatsapp'               => $data['manager_whatsapp_edit'] ?? null,
                    'manager_plain_password' => $data['manager_password_edit'],
                    'email_verified_at'      => now(),
                ]);
                $user->assignRole('branch_admin');
            }
            return;
        }

        // Update existing manager
        $updates = [];

        if (!empty($data['manager_name_edit']))    $updates['name']     = $data['manager_name_edit'];
        if (!empty($data['manager_email_edit']))   $updates['email']    = $data['manager_email_edit'];
        if (!empty($data['manager_phone_edit']))   $updates['phone']    = $data['manager_phone_edit'];
        if (!empty($data['manager_whatsapp_edit'])) $updates['whatsapp'] = $data['manager_whatsapp_edit'];

        if (!empty($data['manager_password_edit'])) {
            $updates['password']               = Hash::make($data['manager_password_edit']);
            $updates['manager_plain_password'] = $data['manager_password_edit'];
        }

        if (!empty($updates)) {
            $admin->update($updates);
        }
    }
}
