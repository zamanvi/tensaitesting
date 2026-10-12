<?php

namespace App\Filament\Resources\CvAccessResource\Pages;

use App\Filament\Resources\CvAccessResource;
use App\Models\CvAccess;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CreateCvAccess extends \Filament\Resources\Pages\CreateRecord
{
    protected static string $resource = CvAccessResource::class;

    // Goes through activateFor() so the draft Job CV application is created
    // and the Talent Passport is linked, exactly like the "Activate CV"
    // button on the Talent Passports list.
    protected function handleRecordCreation(array $data): Model
    {
        $access = CvAccess::activateFor(User::findOrFail($data['user_id']), auth()->user());

        unset($data['user_id']);
        $access->update($data);

        return $access;
    }
}
