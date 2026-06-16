<?php

namespace App\Filament\Resources\BranchResource\Pages;

use App\Filament\Resources\BranchResource;
use App\Models\User;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EditBranch extends EditRecord
{
    protected static string $resource = BranchResource::class;

    private array $managerData = [];

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
        return 'Branch saved successfully';
    }

    protected function mutateFormDataBeforeFill(array $data): array
    {
        $admin = $this->record->admins()->where('id', '!=', auth()->id())->first();
        if ($admin) {
            $data['manager_name_edit']     = $admin->name;
            $data['manager_phone_edit']    = $admin->phone ?? '';
            $data['manager_whatsapp_edit'] = $admin->whatsapp ?? '';
        }
        return $data;
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // Capture manager fields before they reach the Branch model
        $this->managerData = [
            'name'     => $data['manager_name_edit'] ?? null,
            'password' => $data['manager_password_edit'] ?? null,
            'phone'    => $data['manager_phone_edit'] ?? null,
            'whatsapp' => $data['manager_whatsapp_edit'] ?? null,
        ];

        // Strip manager fields — Branch model has no these columns
        unset(
            $data['manager_name_edit'],
            $data['manager_password_edit'],
            $data['manager_password_edit_confirmation'],
            $data['manager_phone_edit'],
            $data['manager_whatsapp_edit'],
        );

        return $data;
    }

    protected function afterSave(): void
    {
        $branch = $this->record;
        $data   = $this->managerData;

        $admin = $branch->admins()->where('id', '!=', auth()->id())->first();

        if (!$admin) {
            if (!empty($data['name']) && !empty($data['password'])) {
                $baseEmail = Str::slug($data['name']) . '@branch.tensai.jp';
                $email = $baseEmail;
                $i = 1;
                while (User::where('email', $email)->exists()) {
                    $email = Str::slug($data['name']) . $i . '@branch.tensai.jp';
                    $i++;
                }
                $user = User::create([
                    'name'                   => $data['name'],
                    'email'                  => $email,
                    'password'               => Hash::make($data['password']),
                    'gateway_type'           => 'branch',
                    'status'                 => 'active',
                    'branch_id'              => $branch->id,
                    'phone'                  => $data['phone'] ?? null,
                    'whatsapp'               => $data['whatsapp'] ?? null,
                    'manager_plain_password' => $data['password'],
                    'email_verified_at'      => now(),
                ]);
                $user->assignRole('branch_admin');
            }
            return;
        }

        $updates = [];
        if (!empty($data['name']))     $updates['name']     = $data['name'];
        if (!empty($data['phone']))    $updates['phone']    = $data['phone'];
        if (!empty($data['whatsapp'])) $updates['whatsapp'] = $data['whatsapp'];

        if (!empty($data['password'])) {
            $updates['password']               = Hash::make($data['password']);
            $updates['manager_plain_password'] = $data['password'];
        }

        if (!empty($updates)) {
            $admin->update($updates);
        }
    }
}
