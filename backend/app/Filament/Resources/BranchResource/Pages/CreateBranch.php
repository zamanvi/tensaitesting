<?php

namespace App\Filament\Resources\BranchResource\Pages;

use App\Filament\Resources\BranchResource;
use App\Models\User;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Support\Str;

class CreateBranch extends CreateRecord
{
    protected static string $resource = BranchResource::class;

    protected function getCreateAnotherFormAction(): \Filament\Actions\Action
    {
        return parent::getCreateAnotherFormAction()->hidden();
    }

    protected function afterCreate(): void
    {
        $data = $this->data;
        $branch = $this->record;

        if (empty($data['manager_name']) || empty($data['manager_password'])) {
            return;
        }

        // Auto-generate unique email from manager name
        $baseEmail = Str::slug($data['manager_name']) . '@branch.tensai.jp';
        $email = $baseEmail;
        $i = 1;
        while (User::where('email', $email)->exists()) {
            $email = Str::slug($data['manager_name']) . $i . '@branch.tensai.jp';
            $i++;
        }

        $user = User::create([
            'name'                   => $data['manager_name'],
            'email'                  => $email,
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
