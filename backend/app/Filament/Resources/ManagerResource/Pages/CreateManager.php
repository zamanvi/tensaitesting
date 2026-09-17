<?php

namespace App\Filament\Resources\ManagerResource\Pages;

use App\Filament\Resources\ManagerResource;
use App\Models\User;
use Filament\Resources\Pages\CreateRecord;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateManager extends CreateRecord
{
    protected static string $resource = ManagerResource::class;

    protected function handleRecordCreation(array $data): Model
    {
        // Admin only ever provides Name, Designation, and Sections —
        // Username (stored in `email`, since that's what the manager
        // panel's login form asks for) and Password are both generated,
        // not typed, and handed over once via the copyable Username /
        // Password / Login Link columns on the list page.
        $data['email'] = $this->generateUsername($data['name'] ?? 'manager');

        $plainPassword = Str::password(12);
        $data['password'] = Hash::make($plainPassword);
        $data['manager_plain_password'] = $plainPassword;

        $record = static::getModel()::create($data);
        $record->assignRole('manager');

        return $record;
    }

    // Not a real, deliverable email address — purely a unique login
    // identifier, since the underlying `email` column (and the manager
    // panel's login form) require one. The retry loop guards the
    // vanishingly small chance of two managers colliding on both the
    // name-derived slug and the random suffix.
    private function generateUsername(string $name): string
    {
        $base = Str::slug($name) ?: 'manager';

        do {
            $candidate = "{$base}." . random_int(1000, 9999) . '@manager.tensai.app';
        } while (User::where('email', $candidate)->exists());

        return $candidate;
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
