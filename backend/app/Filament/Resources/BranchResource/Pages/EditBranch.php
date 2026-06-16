<?php

namespace App\Filament\Resources\BranchResource\Pages;

use App\Filament\Resources\BranchResource;
use App\Models\User;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EditBranch extends EditRecord
{
    protected static string $resource = BranchResource::class;

    protected function getHeaderActions(): array
    {
        return [Actions\DeleteAction::make()];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }

    protected function getSavedNotificationTitle(): ?string
    {
        return 'Branch updated successfully';
    }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $admin = DB::table('users')
            ->where('branch_id', $this->record->id)
            ->where('gateway_type', 'branch')
            ->where('id', '!=', auth()->id())
            ->first();

        if ($admin) {
            $data['manager_name_edit']     = $admin->name;
            $data['manager_phone_edit']    = $admin->phone ?? '';
            $data['manager_whatsapp_edit'] = $admin->whatsapp ?? '';
        }

        return $data;
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $branch = $this->record;

        $managerName     = $data['manager_name_edit'] ?? null;
        $managerPassword = $data['manager_password_edit'] ?? null;
        $managerPhone    = $data['manager_phone_edit'] ?? null;
        $managerWhatsapp = $data['manager_whatsapp_edit'] ?? null;

        $admin = DB::table('users')
            ->where('branch_id', $branch->id)
            ->where('gateway_type', 'branch')
            ->where('id', '!=', auth()->id())
            ->first();

        if ($admin) {
            $updates = [];
            if (!empty($managerName))     $updates['name']     = $managerName;
            if (!empty($managerPhone))    $updates['phone']    = $managerPhone;
            if (isset($managerWhatsapp))  $updates['whatsapp'] = $managerWhatsapp ?: null;
            if (!empty($managerPassword)) {
                $updates['password']               = Hash::make($managerPassword);
                $updates['manager_plain_password'] = $managerPassword;
            }
            if (!empty($updates)) {
                $updates['updated_at'] = now();
                DB::table('users')->where('id', $admin->id)->update($updates);
            }
        } elseif (!empty($managerName) && !empty($managerPassword)) {
            $baseEmail = Str::slug($managerName) . '@branch.tensai.jp';
            $email = $baseEmail;
            $i = 1;
            while (User::where('email', $email)->exists()) {
                $email = Str::slug($managerName) . $i . '@branch.tensai.jp';
                $i++;
            }
            $user = User::create([
                'name'                   => $managerName,
                'email'                  => $email,
                'password'               => Hash::make($managerPassword),
                'gateway_type'           => 'branch',
                'status'                 => 'active',
                'branch_id'              => $branch->id,
                'phone'                  => $managerPhone ?? null,
                'whatsapp'               => $managerWhatsapp ?? null,
                'manager_plain_password' => $managerPassword,
                'email_verified_at'      => now(),
            ]);
            $user->assignRole('branch_admin');
        }

        unset(
            $data['manager_name_edit'],
            $data['manager_password_edit'],
            $data['manager_password_edit_confirmation'],
            $data['manager_phone_edit'],
            $data['manager_whatsapp_edit'],
        );

        return $data;
    }
}
