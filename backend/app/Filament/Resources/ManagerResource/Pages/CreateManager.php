<?php

namespace App\Filament\Resources\ManagerResource\Pages;

use App\Filament\Resources\ManagerResource;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateManager extends CreateRecord
{
    protected static string $resource = ManagerResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        // Generated, not typed by Admin — a manager account's credentials
        // are meant to be handed over once via the Login Link + Password
        // columns on the list page, not chosen/remembered by Admin.
        $plainPassword = Str::password(12);

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
