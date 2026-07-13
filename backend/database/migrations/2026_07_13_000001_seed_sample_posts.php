<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        // Get category IDs
        $cats = DB::table('categories')->pluck('id', 'slug');

        // Insert sample posts
        $posts = [
            [
                'title'        => 'How to Study in Japan: Complete Guide for 2025',
                'slug'         => 'how-to-study-in-japan-complete-guide-2025',
                'excerpt'      => 'Japan is one of the most popular destinations for international students. From application requirements to visa processing and daily life tips — here is everything you need to know before making the move.',
                'body'         => '<h2>Why Study in Japan?</h2><p>Japan offers world-class universities, a unique cultural experience, and strong career prospects in Asia. International students benefit from generous scholarships, safe cities, and an unmatched quality of life.</p><h2>Admission Requirements</h2><p>Most Japanese universities require:</p><ul><li>High school or bachelor\'s degree transcript</li><li>Japanese Language Proficiency Test (JLPT) N2 or higher for Japanese-taught programs</li><li>IELTS/TOEFL for English-taught programs</li><li>Statement of purpose and letters of recommendation</li></ul><h2>Visa Process</h2><p>Once accepted, apply for a Student Visa (留学ビザ) at your nearest Japanese embassy. The Certificate of Eligibility (COE) from your university speeds up the process significantly.</p><h2>Cost of Living</h2><p>Monthly expenses typically range from ¥80,000–¥150,000 (approx. $550–$1,000 USD) depending on the city. Tokyo is more expensive than regional cities like Sendai or Fukuoka.</p>',
                'type'         => 'article',
                'video_url'    => null,
                'thumbnail_url'=> 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
                'status'       => 'published',
                'published_at' => $now->copy()->subDays(3),
                'created_by'   => null,
                'created_at'   => $now->copy()->subDays(3),
                'updated_at'   => $now->copy()->subDays(3),
                'categories'   => ['japan', 'higher-study'],
            ],
            [
                'title'        => 'Japan Student Visa Application — Step by Step',
                'slug'         => 'japan-student-visa-application-step-by-step',
                'excerpt'      => 'Getting your Japanese student visa doesn\'t have to be stressful. Watch this full walkthrough covering documents, embassy submission, and common mistakes that delay approval.',
                'body'         => null,
                'type'         => 'video',
                'video_url'    => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'thumbnail_url'=> null,
                'status'       => 'published',
                'published_at' => $now->copy()->subDays(5),
                'created_by'   => null,
                'created_at'   => $now->copy()->subDays(5),
                'updated_at'   => $now->copy()->subDays(5),
                'categories'   => ['japan', 'visa-legal'],
            ],
            [
                'title'        => 'Top 5 Universities in Australia for International Students',
                'slug'         => 'top-5-universities-australia-international-students',
                'excerpt'      => 'Australia is home to eight of the world\'s top 100 universities. We rank the top five for international students based on global rankings, scholarship availability, and post-graduation work rights.',
                'body'         => '<h2>1. University of Melbourne</h2><p>Consistently ranked #1 in Australia, Melbourne offers over 200 programs to international students with generous scholarship packages and a vibrant multicultural campus.</p><h2>2. Australian National University (ANU)</h2><p>Located in Canberra, ANU is especially strong in research, public policy, and science disciplines. Its graduates are highly sought by government and top firms.</p><h2>3. University of Sydney</h2><p>One of Australia\'s oldest universities, Sydney offers a wide range of programs and is situated in one of the world\'s most livable cities.</p><h2>4. UNSW Sydney</h2><p>Known for engineering, business, and law, UNSW has a strong industry network and excellent employment outcomes.</p><h2>5. Monash University</h2><p>With campuses in Melbourne and internationally, Monash is a global university with a reputation for innovation and research impact.</p>',
                'type'         => 'article',
                'video_url'    => null,
                'thumbnail_url'=> 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&q=80',
                'status'       => 'published',
                'published_at' => $now->copy()->subDays(7),
                'created_by'   => null,
                'created_at'   => $now->copy()->subDays(7),
                'updated_at'   => $now->copy()->subDays(7),
                'categories'   => ['australia', 'higher-study'],
            ],
            [
                'title'        => 'Working in Japan After Graduation — What You Need to Know',
                'slug'         => 'working-in-japan-after-graduation',
                'excerpt'      => 'Japan actively recruits international graduates. From changing your visa status to finding a job at a Japanese company — here\'s a practical guide to launching your career in Japan.',
                'body'         => '<h2>Changing Your Visa Status</h2><p>After graduating from a Japanese university, you can apply to change your Student Visa to a Work Visa (就労ビザ). The most common category is "Engineer/Specialist in Humanities/International Services."</p><h2>Job Hunting (就活)</h2><p>Japanese companies begin recruiting in October for positions starting the following April. Key platforms include:</p><ul><li>Rikunabi — largest new-grad job board</li><li>Mynavi — strong in mid-size companies</li><li>Gaishikei Shushoku — for foreign companies in Japan</li></ul><h2>Language Requirements</h2><p>JLPT N2 is the minimum for most corporate roles. N1 opens significantly more doors, especially in finance, law, and government-adjacent roles.</p>',
                'type'         => 'text',
                'video_url'    => null,
                'thumbnail_url'=> 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80',
                'status'       => 'published',
                'published_at' => $now->copy()->subDays(10),
                'created_by'   => null,
                'created_at'   => $now->copy()->subDays(10),
                'updated_at'   => $now->copy()->subDays(10),
                'categories'   => ['japan', 'work-career'],
            ],
            [
                'title'        => 'JLPT N5 to N1 — Learning Japanese Fast for Study Abroad',
                'slug'         => 'jlpt-n5-to-n1-learning-japanese-study-abroad',
                'excerpt'      => 'Watch our full video guide on passing JLPT from beginner to advanced. Covers study resources, test strategy, and realistic timelines based on your starting level.',
                'body'         => null,
                'type'         => 'video',
                'video_url'    => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'thumbnail_url'=> 'https://images.unsplash.com/photo-1546422904-90eab23c3d7e?w=800&q=80',
                'status'       => 'published',
                'published_at' => $now->copy()->subDays(12),
                'created_by'   => null,
                'created_at'   => $now->copy()->subDays(12),
                'updated_at'   => $now->copy()->subDays(12),
                'categories'   => ['japan', 'language'],
            ],
            [
                'title'        => 'Canada Student Visa (Study Permit) — Full Application Guide',
                'slug'         => 'canada-student-visa-study-permit-full-guide',
                'excerpt'      => 'Canada\'s Study Permit process changed significantly in 2024. This guide covers the new requirements, document checklist, biometrics, and how to avoid the most common refusal reasons.',
                'body'         => '<h2>What is a Study Permit?</h2><p>A Study Permit is Canada\'s equivalent of a student visa. It allows you to study at a Designated Learning Institution (DLI) for the duration of your program.</p><h2>Key Documents Required</h2><ul><li>Acceptance letter from a DLI</li><li>Proof of financial support (CAD $10,000+ beyond tuition)</li><li>Valid passport</li><li>Biometrics (most nationalities)</li><li>Statement of purpose explaining ties to home country</li></ul><h2>Processing Time</h2><p>Online applications typically take 4–8 weeks. Apply as early as possible — after receiving your acceptance letter.</p><h2>Post-Graduation Work Permit (PGWP)</h2><p>After completing a full-time program of 8+ months at a DLI, you are eligible for a PGWP — a work permit valid for up to 3 years. This is one of Canada\'s biggest advantages for international students.</p>',
                'type'         => 'article',
                'video_url'    => null,
                'thumbnail_url'=> 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800&q=80',
                'status'       => 'published',
                'published_at' => $now->copy()->subDays(14),
                'created_by'   => null,
                'created_at'   => $now->copy()->subDays(14),
                'updated_at'   => $now->copy()->subDays(14),
                'categories'   => ['canada', 'visa-legal'],
            ],
        ];

        foreach ($posts as $postData) {
            $categorySlags = $postData['categories'];
            unset($postData['categories']);

            $id = DB::table('posts')->insertGetId($postData);

            foreach ($categorySlags as $slug) {
                if (isset($cats[$slug])) {
                    DB::table('category_post')->insert([
                        'post_id'     => $id,
                        'category_id' => $cats[$slug],
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        $slugs = [
            'how-to-study-in-japan-complete-guide-2025',
            'japan-student-visa-application-step-by-step',
            'top-5-universities-australia-international-students',
            'working-in-japan-after-graduation',
            'jlpt-n5-to-n1-learning-japanese-study-abroad',
            'canada-student-visa-study-permit-full-guide',
        ];

        $ids = DB::table('posts')->whereIn('slug', $slugs)->pluck('id');
        DB::table('category_post')->whereIn('post_id', $ids)->delete();
        DB::table('posts')->whereIn('id', $ids)->delete();
    }
};
