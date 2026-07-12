<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Post::with('categories')
            ->where('status', 'published')
            ->orderByDesc('published_at');

        if ($request->filled('country')) {
            $query->whereHas('categories', fn ($q) =>
                $q->where('slug', $request->country)->where('type', 'country')
            );
        }

        if ($request->filled('purpose')) {
            $query->whereHas('categories', fn ($q) =>
                $q->where('slug', $request->purpose)->where('type', 'purpose')
            );
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $posts = $query->paginate(12);

        $isAuth = auth('sanctum')->check();

        $posts->getCollection()->transform(function (Post $post) use ($isAuth) {
            return $this->formatPost($post, $isAuth);
        });

        return response()->json($posts);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $post = Post::with('categories')
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();

        $isAuth = auth('sanctum')->check();

        return response()->json($this->formatPost($post, $isAuth, full: true));
    }

    public function categories(): JsonResponse
    {
        $cats = Category::orderBy('type')->orderBy('sort_order')->get();
        return response()->json([
            'countries' => $cats->where('type', 'country')->values(),
            'purposes'  => $cats->where('type', 'purpose')->values(),
        ]);
    }

    private function formatPost(Post $post, bool $isAuth, bool $full = false): array
    {
        $base = [
            'id'          => $post->id,
            'title'       => $post->title,
            'slug'        => $post->slug,
            'type'        => $post->type,
            'excerpt'     => $post->excerpt,
            'thumbnail'   => $post->thumbnail,
            'youtube_id'  => $post->youtube_id,
            'published_at'=> $post->published_at,
            'categories'  => $post->categories->map(fn ($c) => [
                'name'  => $c->name,
                'slug'  => $c->slug,
                'type'  => $c->type,
                'flag'  => $c->flag,
                'color' => $c->color,
            ]),
            'locked' => !$isAuth,
        ];

        if ($isAuth && $full) {
            $base['body']      = $post->body;
            $base['video_url'] = $post->video_url;
        }

        return $base;
    }
}
