<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

/**
 * Livewire stores every temporary upload under a name that embeds the
 * original file name, base64-encoded (30-char hash + "-meta" + base64(name)
 * + extension). Linux caps a file name at 255 bytes, and Bangla (3 bytes per
 * character in UTF-8) or any long camera/download name blows past that: the
 * write fails silently (the temp disk has throw=false), Livewire is left
 * holding an empty path, and the later save step 500s with "Unable to
 * retrieve the file_size for file at location: livewire-tmp/livewire-tmp".
 *
 * Registered as livewire.temporary_file_upload.middleware, so it runs only
 * on the upload endpoint. A name that is already short is passed through
 * completely untouched; only an over-long one is trimmed (extension kept),
 * which is all the stored copy ever uses it for.
 */
class ShortenLongUploadNames
{
    // Keeps base64(name) comfortably under the limit: 30 + 5 + ~124 + 1 + ext.
    private const MAX_NAME_BYTES = 100;
    private const MAX_BASE_BYTES = 80;

    public function handle(Request $request, Closure $next)
    {
        // Read the raw bag, not $request->file(): that caches its converted
        // copy, so a replacement set afterwards would never be seen.
        $files = $request->files->get('files');

        if ($files) {
            $list = is_array($files) ? $files : [$files];
            $request->files->set('files', array_map(
                fn ($file) => $file instanceof UploadedFile ? $this->shorten($file) : $file,
                $list
            ));
        }

        return $next($request);
    }

    private function shorten(UploadedFile $file): UploadedFile
    {
        $name = $file->getClientOriginalName();

        if (strlen($name) <= self::MAX_NAME_BYTES) {
            return $file;
        }

        $extension = substr(preg_replace('/[^A-Za-z0-9]/', '', pathinfo($name, PATHINFO_EXTENSION)), 0, 10);
        // mb_strcut cuts on a byte budget without splitting a multi-byte character.
        $base = mb_strcut(pathinfo($name, PATHINFO_FILENAME), 0, self::MAX_BASE_BYTES, 'UTF-8');

        return new UploadedFile(
            $file->getPathname(),
            $base . ($extension !== '' ? '.' . $extension : ''),
            $file->getClientMimeType(),
            $file->getError(),
            true
        );
    }
}
