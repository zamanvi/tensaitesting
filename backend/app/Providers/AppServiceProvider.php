<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Force Livewire temporary file uploads to use the local disk so that
        // browser uploads always go through the server (browser → Laravel → R2).
        // Without this, when FILESYSTEM_DISK=r2, Livewire generates presigned URLs
        // and the browser tries to PUT directly to R2, which fails with a CORS error
        // because the Railway origin is not whitelisted in the R2 bucket policy.
        config(['livewire.temporary_file_upload.disk' => 'local']);
    }
}
