<?php
namespace App\Filament\Resources\BranchManagerResource\Pages;
use App\Filament\Resources\BranchManagerResource;
use App\Models\Branch;
use Filament\Resources\Pages\CreateRecord;
use Spatie\Permission\Models\Role;
class CreateBranchManager extends CreateRecord {
    protected static string $resource = BranchManagerResource::class;

    protected function afterCreate(): void
    {
        $record = $this->record;
        $role = Role::firstOrCreate(['name' => 'branch_manager', 'guard_name' => 'web']);
        $record->assignRole($role);

        // Send notification if possible
        if (class_exists(\App\Models\TensaiNotification::class)) {
            \App\Models\TensaiNotification::create([
                'user_id' => $record->id,
                'title'   => 'Welcome to Tensai Branch Panel',
                'body'    => 'You have been added as a Branch Manager. You can now log in to the admin panel.',
                'type'    => 'info',
            ]);
        }
    }
}
