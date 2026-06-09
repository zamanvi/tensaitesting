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
    | Force the temporary upload disk to 'local' so that Livewire always
    | routes uploads through the Laravel server (browser → server → R2).
    | Without this, when FILESYSTEM_DISK=r2, Livewire generates presigned
    | URLs and the browser PUTs directly to R2, which is blocked by CORS
    | because the Railway origin is not whitelisted in the R2 bucket policy.
    |
    */

    'temporary_file_upload' => [
        'disk'           => 'local',
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
