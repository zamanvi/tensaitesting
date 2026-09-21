<?php

return [

    'class_namespace' => 'App\\Livewire',

    'view_path' => resource_path('views/livewire'),

    'layout' => 'components.layouts.app',

    'lazy_placeholder' => null,

    /*
    |---------------------------------------------------------------------------
    | Temporary File Uploads
    |---------------------------------------------------------------------------
    |
    | Force the temporary upload disk to a local (non-R2) disk so that
    | Livewire always routes uploads through the Laravel server (browser →
    | server → R2). Without this, when FILESYSTEM_DISK=r2, Livewire
    | generates presigned URLs and the browser PUTs directly to R2, which
    | is blocked by CORS because the Railway origin is not whitelisted in
    | the R2 bucket policy.
    |
    | Deliberately 'livewire-tmp' (config/filesystems.php, rooted at
    | /tmp/...), not 'local' (storage/app, which is on Railway's
    | persistent volume) — see that disk's own comment for why: writing
    | temp files to a network-backed volume and reading them back from a
    | different worker process moments later caused intermittent
    | "Unable to retrieve the file_size" 500s on every image upload.
    |
    */

    'temporary_file_upload' => [
        'disk'           => 'livewire-tmp',
        'rules'          => null,
        'directory'      => null,
        'middleware'     => null,
        'preview_mimes'  => [
            'png', 'gif', 'bmp', 'svg', 'wav', 'mp4',
            'mov', 'avi', 'wmv', 'mp3', 'm4a',
            'jpg', 'jpeg', 'mpga', 'webp', 'wma',
        ],
        'max_upload_time' => 5,
        'cleanup'         => true,
    ],

    'render_on_redirect' => false,

    'legacy_model_binding' => false,

    'inject_assets' => true,

    'navigate' => [
        'show_progress_bar' => true,
        'progress_bar_color' => '#2299dd',
    ],

    'inject_morph_markers' => true,

    'smart_wire_keys' => false,

    'pagination_theme' => 'tailwind',

    'release_token' => 'a',

];
