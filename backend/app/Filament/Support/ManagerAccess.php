<?php

namespace App\Filament\Support;

use App\Models\User;

class ManagerAccess
{
    // True only when the current user is a Manager who was individually
    // granted this exact section on the Managers form (manager_sections
    // holds fully-qualified Resource/Page class names — see
    // ManagerResource::discoverSectionOptions()). Admin/super_admin access
    // is handled separately by each canAccess()'s own role check; this is
    // purely the per-manager grant on top of that.
    public static function granted(string $class): bool
    {
        $user = auth()->user();

        return $user instanceof User
            && $user->hasRole('manager')
            && in_array($class, $user->manager_sections ?? [], true);
    }
}
