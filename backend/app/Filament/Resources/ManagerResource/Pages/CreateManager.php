<?php

namespace App\Filament\Resources\ManagerResource\Pages;

use App\Filament\Resources\ManagerResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class CreateManager extends CreateRecord
{
    protected static string $resource = ManagerResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        $plainPassword = request()->input('plain_password');

        $data['password'] = Hash::make($plainPassword);
        $data['manager_plain_password'] = $plainPassword;

        $record = static::getModel()::create($data);
        $record->assignRole('manager');

        return $record;
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
