<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Image Driver
    |--------------------------------------------------------------------------
    | Intervention Image supports GD and Imagick. Railway PHP containers
    | typically have GD. If neither is available the controller falls back
    | to storing the original file without resizing.
    */

    'driver' => \Intervention\Image\Drivers\Gd\Driver::class,

];
