<?php

namespace App\Support;

// A starting set of questions and answers about Japan's Specified Skilled Worker
// (SSW) route, drafted from official and public sources.
//
// EVERY item here is imported as a DRAFT and is never shown to a user until a
// staff member has checked it against its source and pressed "Verify". Each item
// carries the page it is based on (source_url) and a staff_note saying what to
// double-check. Facts that change (fees, test dates, lists of fields) are
// deliberately left out or kept general.
//
// Sources used (as read on 2026-10-14):
//   MOFA  General Process        https://www.mofa.go.jp/mofaj/ca/fna/ssw/us/introduction/
//   JFT   Prometric JFT-Basic    https://prometric-jp.com/en/ssw/test_list/archives/1
//   CARE  Prometric care tests   https://www.prometric-jp.com/en/ssw/test_list/archives/2
//   MHLW  Care field overview    https://www.mhlw.go.jp/content/12000000/000617602.pdf
//   MoC   Dhaka-Tokyo MoC (2019) https://thefinancialexpress.com.bd/economy/dhaka-tokyo-sign-moc-for-recruiting-specified-skilled-workers-to-japan-1566893379
class SswStarterLibrary
{
    private const MOFA = 'https://www.mofa.go.jp/mofaj/ca/fna/ssw/us/introduction/';
    private const JFT  = 'https://prometric-jp.com/en/ssw/test_list/archives/1';
    private const CARE = 'https://www.prometric-jp.com/en/ssw/test_list/archives/2';
    private const MHLW = 'https://www.mhlw.go.jp/content/12000000/000617602.pdf';
    private const MOC  = 'https://thefinancialexpress.com.bd/economy/dhaka-tokyo-sign-moc-for-recruiting-specified-skilled-workers-to-japan-1566893379';

    public static function items(): array
    {
        return [
            [
                'slug' => 'ssw-what-is', 'category' => 'ssw_basics', 'sort_order' => 10,
                'question_en' => 'What is the Specified Skilled Worker (SSW) visa?',
                'question_bn' => 'স্পেসিফাইড স্কিলড ওয়ার্কার (SSW) ভিসা কী?',
                'keywords' => 'SSW, specified skilled worker, tokutei ginou, Japan work visa, জাপান, কাজের ভিসা, দক্ষ কর্মী',
                'answer_en' => 'SSW is a Japanese residence status for foreign workers who have the required skills and Japanese language ability to work in fields where Japan has a labour shortage. The first category, SSW(i), allows a stay of up to five years in total and does not allow you to bring your family.',
                'answer_bn' => 'SSW হলো জাপানের একটি আবাসন-মর্যাদা (রেসিডেন্স স্ট্যাটাস), যেখানে যে খাতে জাপানে কর্মীর ঘাটতি আছে সেখানে প্রয়োজনীয় দক্ষতা ও জাপানি ভাষার যোগ্যতা থাকলে বিদেশি কর্মীরা কাজ করতে পারেন। প্রথম ক্যাটাগরি SSW(i)-তে মোট সর্বোচ্চ পাঁচ বছর থাকা যায় এবং পরিবার সঙ্গে নেওয়া যায় না।',
                'source_url' => self::MOFA,
                'staff_note' => 'Check that the five-year and no-family rules for SSW(i) are still current.',
            ],
            [
                'slug' => 'ssw-age', 'category' => 'ssw_basics', 'sort_order' => 20,
                'question_en' => 'How old must I be to apply?',
                'question_bn' => 'আবেদন করতে আমার বয়স কত হতে হবে?',
                'keywords' => 'age, minimum age, 18, বয়স, কত বছর',
                'answer_en' => 'According to Japan\'s Ministry of Foreign Affairs, you must be over 18 years old to work under SSW.',
                'answer_bn' => 'জাপানের পররাষ্ট্র মন্ত্রণালয়ের তথ্য অনুযায়ী SSW-এর আওতায় কাজ করতে আপনার বয়স ১৮ বছরের বেশি হতে হবে।',
                'source_url' => self::MOFA,
                'staff_note' => 'The source says "over 18"; confirm whether exactly 18 is accepted.',
            ],
            [
                'slug' => 'ssw-language-test', 'category' => 'language', 'sort_order' => 10,
                'question_en' => 'Which Japanese language test do I need?',
                'question_bn' => 'আমার কোন জাপানি ভাষা পরীক্ষা দিতে হবে?',
                'keywords' => 'japanese language, JFT, JFT-Basic, JLPT, N4, N3, language test, what level of japanese, japanese level, which level, ভাষা পরীক্ষা, জাপানি ভাষা',
                'answer_en' => 'For SSW(i) you need to pass either the JFT-Basic (Japan Foundation Test for Basic Japanese) or the JLPT at level N4 or higher. Some fields ask for more: for example taxi and bus driving are reported to need JLPT N3 or higher, and nursing care needs an extra nursing-care Japanese test. Our staff will tell you what applies to your field.',
                'answer_bn' => 'SSW(i)-এর জন্য JFT-Basic (জাপান ফাউন্ডেশনের বেসিক জাপানি ভাষা পরীক্ষা) অথবা JLPT-এর N4 বা তার উপরের স্তর পাস করতে হয়। কিছু খাতে আরও বেশি লাগে: যেমন ট্যাক্সি ও বাস চালনায় JLPT N3 বা তার বেশি লাগে বলে জানা যায়, আর নার্সিং কেয়ারে আলাদা একটি জাপানি ভাষা পরীক্ষা লাগে। আপনার খাতের জন্য কী প্রযোজ্য তা আমাদের স্টাফ জানিয়ে দেবেন।',
                'source_url' => self::MOFA,
                'staff_note' => 'N3 for taxi/bus comes from a secondary source (see ssw-driver). Verify before publishing that sentence.',
            ],
            [
                'slug' => 'jft-basic-what', 'category' => 'language', 'sort_order' => 20,
                'question_en' => 'What is the JFT-Basic test?',
                'question_bn' => 'JFT-Basic পরীক্ষা কী?',
                'keywords' => 'JFT, JFT-Basic, basic japanese, computer test, CBT, prometric, জেএফটি',
                'answer_en' => 'It is a computer-based test of basic Japanese for daily life. It has about 50 questions in four parts (letters and vocabulary, conversation and expression, listening, reading) and takes about 60 minutes. Your result is available on the day of the test.',
                'answer_bn' => 'এটি দৈনন্দিন জীবনের জন্য প্রয়োজনীয় বেসিক জাপানি ভাষার কম্পিউটার-ভিত্তিক পরীক্ষা। এতে চারটি অংশে (অক্ষর ও শব্দভান্ডার, কথোপকথন ও প্রকাশ, শোনা, পড়া) প্রায় ৫০টি প্রশ্ন থাকে এবং সময় লাগে প্রায় ৬০ মিনিট। ফল পরীক্ষার দিনই পাওয়া যায়।',
                'source_url' => self::JFT,
                'staff_note' => 'Question count and duration can change; confirm on the Prometric page.',
            ],
            [
                'slug' => 'jft-vs-jlpt', 'category' => 'language', 'sort_order' => 30,
                'question_en' => 'JFT-Basic or JLPT: which should I take?',
                'question_bn' => 'JFT-Basic নাকি JLPT, কোনটি দেব?',
                'keywords' => 'JFT-Basic, JLPT, difference, which test, better, which one, jlpt or jft, jft or jlpt, কোনটি ভালো, পার্থক্য, JLPT নাকি JFT',
                'answer_en' => 'Both are accepted at the basic level. The JFT-Basic is offered on more dates and gives results immediately, while the JLPT is held twice a year and results come after about two months. Many applicants choose the JFT-Basic for speed.',
                'answer_bn' => 'বেসিক স্তরের জন্য দুটোই গ্রহণযোগ্য। JFT-Basic বেশি তারিখে হয় এবং ফল সাথে সাথে পাওয়া যায়, আর JLPT বছরে দুইবার হয় এবং ফল আসতে প্রায় দুই মাস লাগে। গতির জন্য অনেক আবেদনকারী JFT-Basic বেছে নেন।',
                'source_url' => self::JFT,
                'staff_note' => 'Check the JLPT frequency in Bangladesh for the current year.',
            ],
            [
                'slug' => 'jft-booking', 'category' => 'language', 'sort_order' => 40,
                'question_en' => 'How do I book the JFT-Basic test?',
                'question_bn' => 'JFT-Basic পরীক্ষার জন্য কীভাবে বুকিং দেব?',
                'keywords' => 'book, booking, reserve, register, prometric, prometric id, name mismatch, বুকিং, রেজিস্ট্রেশন',
                'answer_en' => 'You book on the Prometric website. Create your Prometric ID with exactly the same name as on your identification document; the name cannot be changed after you reserve, and a mismatch can stop you from sitting the test. Reservations and changes close three business days before the test date, and seats are limited.',
                'answer_bn' => 'Prometric-এর ওয়েবসাইটে বুকিং দিতে হয়। আপনার পরিচয়পত্রে যে নাম আছে হুবহু সেই নামে Prometric ID তৈরি করুন; বুকিংয়ের পর নাম বদলানো যায় না এবং নাম না মিললে পরীক্ষায় বসতে পারবেন না। পরীক্ষার তিন কর্মদিবস আগে বুকিং ও পরিবর্তন বন্ধ হয়ে যায় এবং আসন সীমিত।',
                'source_url' => self::JFT,
                'staff_note' => 'Add the current booking window, fee and Dhaka test centre address from the Prometric page, with a valid_until date.',
            ],
            [
                'slug' => 'ssw-skills-test', 'category' => 'skills_test', 'sort_order' => 10,
                'question_en' => 'Do I also need a skills test?',
                'question_bn' => 'আমাকে কি দক্ষতা পরীক্ষাও দিতে হবে?',
                'keywords' => 'skills test, skill exam, trade test, specified skills evaluation, দক্ষতা পরীক্ষা, স্কিল টেস্ট',
                'answer_en' => 'Yes. Besides the Japanese test you must pass the skills test of your own field. These tests are run by the responsible ministry or a designated organisation, not by the Japan Foundation.',
                'answer_bn' => 'হ্যাঁ। জাপানি ভাষা পরীক্ষার পাশাপাশি আপনার নিজের খাতের দক্ষতা পরীক্ষাও পাস করতে হয়। এই পরীক্ষাগুলো দায়িত্বপ্রাপ্ত মন্ত্রণালয় বা নির্ধারিত সংস্থা পরিচালনা করে, জাপান ফাউন্ডেশন নয়।',
                'source_url' => self::MOFA,
                'staff_note' => 'Add where and when each field test is held for Bangladesh candidates.',
            ],
            [
                'slug' => 'ssw-intern-exemption', 'category' => 'skills_test', 'sort_order' => 20,
                'question_en' => 'I finished technical intern training. Do I still need the exams?',
                'question_bn' => 'আমি টেকনিক্যাল ইন্টার্ন ট্রেনিং শেষ করেছি। আমাকে কি আবার পরীক্ষা দিতে হবে?',
                'keywords' => 'technical intern, TITP, intern training, exemption, exempt, ইন্টার্ন, ছাড়, অব্যাহতি',
                'answer_en' => 'If you completed Technical Intern Training (ii) or (iii) in good standing, you are generally exempt from both the skills test and the Japanese test when you move to SSW(i) in the same field. If you change to a different field, you may still need that field\'s skills test. Please confirm your own case with us before you plan.',
                'answer_bn' => 'আপনি যদি টেকনিক্যাল ইন্টার্ন ট্রেনিং (ii) বা (iii) ভালোভাবে শেষ করে থাকেন, তাহলে একই খাতে SSW(i)-এ যাওয়ার সময় সাধারণত দক্ষতা পরীক্ষা ও জাপানি ভাষা পরীক্ষা দুটোই থেকে ছাড় পান। অন্য খাতে গেলে সেই খাতের দক্ষতা পরীক্ষা দিতে হতে পারে। পরিকল্পনার আগে আপনার নিজের ক্ষেত্রটি আমাদের সাথে মিলিয়ে নিন।',
                'source_url' => self::MHLW,
                'staff_note' => 'Rules on field changes come from an MHLW document; the intern programme is being replaced from 2027 (ESD). Re-check.',
            ],
            [
                'slug' => 'ssw-sectors', 'category' => 'ssw_basics', 'sort_order' => 30,
                'question_en' => 'In which fields can I work under SSW?',
                'question_bn' => 'SSW-এ কোন কোন খাতে কাজ করা যায়?',
                'keywords' => 'sectors, fields, industries, which jobs, job list, খাত, কোন কাজ, কাজের তালিকা',
                'answer_en' => 'Japan has been adding fields over time, for example caregiving, construction, agriculture and, later, automobile transportation. Which fields are open to Bangladeshi workers, and when, depends on the current agreements and on test availability, so please ask our staff for the latest list.',
                'answer_bn' => 'জাপান সময়ের সাথে নতুন খাত যোগ করছে, যেমন কেয়ারগিভিং, নির্মাণ, কৃষি এবং পরে অটোমোবাইল ট্রান্সপোর্ট। বাংলাদেশি কর্মীদের জন্য কোন খাত কখন খোলা তা বর্তমান চুক্তি ও পরীক্ষার সুযোগের ওপর নির্ভর করে, তাই সর্বশেষ তালিকার জন্য আমাদের স্টাফকে জিজ্ঞেস করুন।',
                'source_url' => self::MOC,
                'staff_note' => 'Sources disagree on the number of fields (14 at the start, more added later). Replace with the current official list and set valid_until.',
            ],
            [
                'slug' => 'caregiver-tests', 'category' => 'caregiver', 'sort_order' => 10,
                'question_en' => 'What tests do caregivers (nursing care workers) need?',
                'question_bn' => 'কেয়ারগিভারদের (নার্সিং কেয়ার) কোন কোন পরীক্ষা লাগে?',
                'keywords' => 'caregiver, nursing care, kaigo, care worker, caregiver exam, caregiver test, care worker exam, exam in Bengali, bangla, কেয়ারগিভার, নার্সিং, সেবাকর্মী',
                'answer_en' => 'Care workers take the nursing-care skills test and the nursing-care Japanese language test, both computer-based tests run by Prometric, in addition to the basic Japanese requirement. The skills test is offered in several languages, including Bengali. Sources differ on whether JLPT N4 can replace the nursing-care Japanese test, so we confirm this with you before you register.',
                'answer_bn' => 'কেয়ারগিভারদের বেসিক জাপানি ভাষার শর্তের পাশাপাশি নার্সিং-কেয়ার দক্ষতা পরীক্ষা ও নার্সিং-কেয়ার জাপানি ভাষা পরীক্ষা দিতে হয়, দুটোই Prometric পরিচালিত কম্পিউটার-ভিত্তিক পরীক্ষা। দক্ষতা পরীক্ষা বাংলাসহ কয়েকটি ভাষায় দেওয়া যায়। JLPT N4 দিয়ে নার্সিং-কেয়ারের জাপানি ভাষা পরীক্ষার বিকল্প হয় কি না তা নিয়ে সূত্রগুলোর মধ্যে অমিল আছে, তাই রেজিস্ট্রেশনের আগে আমরা আপনার সাথে নিশ্চিত করে নেব।',
                'source_url' => self::CARE,
                'staff_note' => 'MOFA says care applicants must also pass the nursing-care Japanese test; an MHLW document is read as allowing JLPT N4 instead. Resolve this against the official pages, then rewrite the last sentence.',
            ],
            [
                'slug' => 'driver-ssw', 'category' => 'driver', 'sort_order' => 10,
                'question_en' => 'Can I work as a driver in Japan under SSW?',
                'question_bn' => 'SSW-এ কি জাপানে ড্রাইভার হিসেবে কাজ করা যায়?',
                'keywords' => 'driver, truck, taxi, bus, driving licence, license, automobile transportation, ড্রাইভার, ট্রাক, ট্যাক্সি, বাস, লাইসেন্স',
                'answer_en' => 'Automobile transportation (trucks, taxis and buses) was added to SSW(i) in March 2024. You need that field\'s skills test, the Japanese language requirement and the right Japanese driving licence (reported: a Class 1 licence for trucks, a Class 2 licence for taxis and buses). Foreign licence holders usually switch to a Japanese licence after arriving, and driving must be the main duty of the job.',
                'answer_bn' => 'অটোমোবাইল ট্রান্সপোর্ট (ট্রাক, ট্যাক্সি ও বাস) ২০২৪ সালের মার্চে SSW(i)-এ যোগ হয়েছে। এজন্য ওই খাতের দক্ষতা পরীক্ষা, জাপানি ভাষার শর্ত এবং সঠিক জাপানি ড্রাইভিং লাইসেন্স লাগে (জানা যায়: ট্রাকের জন্য ক্লাস ১, ট্যাক্সি ও বাসের জন্য ক্লাস ২)। বিদেশি লাইসেন্সধারীরা সাধারণত জাপানে পৌঁছে জাপানি লাইসেন্সে বদলে নেন, এবং চাকরির প্রধান কাজ হতে হবে গাড়ি চালানো।',
                'source_url' => 'https://wheretoemigrate.io/pathways/japan-specified-skilled-worker-i-automobile-transportation-business',
                'staff_note' => 'Based on secondary sources only. Replace the source with the official ISA / MLIT page, and check licence classes and the licence-switch process.',
            ],
            [
                'slug' => 'driver-language', 'category' => 'driver', 'sort_order' => 20,
                'question_en' => 'Which Japanese level do drivers need?',
                'question_bn' => 'ড্রাইভারদের কোন স্তরের জাপানি ভাষা লাগে?',
                'keywords' => 'driver, japanese level, N3, N4, truck, taxi, bus, ড্রাইভার, ভাষার স্তর',
                'answer_en' => 'Truck drivers: JFT-Basic or JLPT N4. Taxi and bus drivers: reported JLPT N3 or higher. The driving licence exams in Japan are held in Japanese, so a stronger level helps a great deal.',
                'answer_bn' => 'ট্রাক চালক: JFT-Basic বা JLPT N4। ট্যাক্সি ও বাস চালক: জানা যায় JLPT N3 বা তার বেশি। জাপানে ড্রাইভিং লাইসেন্স পরীক্ষা জাপানি ভাষায় হয়, তাই ভাষার দক্ষতা বেশি থাকলে অনেক সুবিধা হয়।',
                'source_url' => 'https://wheretoemigrate.io/pathways/japan-specified-skilled-worker-i-automobile-transportation-business',
                'staff_note' => 'Secondary source. Verify the N3 requirement for passenger vehicles on an official page.',
            ],
            [
                'slug' => 'ssw-family', 'category' => 'ssw_basics', 'sort_order' => 40,
                'question_en' => 'Can I bring my family to Japan?',
                'question_bn' => 'আমি কি পরিবারকে জাপানে নিতে পারব?',
                'keywords' => 'family, wife, husband, children, dependants, can my wife come, bring wife, bring children, পরিবার, স্ত্রী, সন্তান, পরিবার নিয়ে যেতে পারব, পরিবার সাথে নিতে',
                'answer_en' => 'Not under SSW(i). SSW(ii), for workers with more advanced skills, allows family members to join and the stay can be renewed without a fixed limit.',
                'answer_bn' => 'SSW(i)-এ নয়। SSW(ii)-এ, যা বেশি উন্নত দক্ষতার কর্মীদের জন্য, পরিবারের সদস্যরা সঙ্গে যেতে পারেন এবং থাকার মেয়াদ নির্দিষ্ট সীমা ছাড়াই নবায়ন করা যায়।',
                'source_url' => self::MOC,
                'staff_note' => 'Confirm SSW(ii) availability for Bangladeshi workers and its fields.',
            ],
            [
                'slug' => 'ssw-duration', 'category' => 'ssw_basics', 'sort_order' => 50,
                'question_en' => 'How long can I stay in Japan under SSW(i)?',
                'question_bn' => 'SSW(i)-এ আমি কত দিন জাপানে থাকতে পারব?',
                'keywords' => 'how long, duration, stay, five years, 5 years, how many years can I stay, মেয়াদ, কতদিন, পাঁচ বছর, কত বছর থাকা যায়, থাকা যায়',
                'answer_en' => 'SSW(i) allows a stay of up to five years in total.',
                'answer_bn' => 'SSW(i)-এ মোট সর্বোচ্চ পাঁচ বছর থাকা যায়।',
                'source_url' => self::MOFA,
                'staff_note' => 'Mention renewal terms (periods of stay are granted in steps) if you want to add detail.',
            ],
            [
                'slug' => 'ssw-no-deposit', 'category' => 'safety', 'sort_order' => 10,
                'question_en' => 'Can the Japanese employer take a deposit or charge a penalty?',
                'question_bn' => 'জাপানি নিয়োগকর্তা কি জামানত নিতে বা জরিমানার শর্ত দিতে পারেন?',
                'keywords' => 'deposit, security deposit, penalty, bond, জামানত, জরিমানা, টাকা',
                'answer_en' => 'No. Under the SSW rules an employer may not collect a security deposit or make a contract that sets penalties for the worker.',
                'answer_bn' => 'না। SSW-এর নিয়মে নিয়োগকর্তা জামানত নিতে বা কর্মীর জন্য জরিমানার শর্ত রাখা চুক্তি করতে পারেন না।',
                'source_url' => self::MOFA,
                'staff_note' => 'Good candidate for a short, prominent entry; keep as is if the MOFA wording is unchanged.',
            ],
            [
                'slug' => 'process-steps', 'category' => 'process', 'sort_order' => 10,
                'question_en' => 'What are the main steps from start to arrival in Japan?',
                'question_bn' => 'শুরু থেকে জাপানে পৌঁছানো পর্যন্ত প্রধান ধাপগুলো কী?',
                'keywords' => 'steps, process, procedure, how to go, প্রক্রিয়া, ধাপ, কীভাবে যাব',
                'answer_en' => 'In outline: pass the Japanese and skills tests (or hold an exemption), get a job offer from a Japanese employer, the employer applies for a Certificate of Eligibility, after approval you apply for the visa at the Japanese Embassy, complete the Bangladeshi emigration formalities (BMET), then travel. Each step has its own paperwork and time, and our staff will guide you.',
                'answer_bn' => 'সংক্ষেপে: জাপানি ভাষা ও দক্ষতা পরীক্ষা পাস করা (বা ছাড় থাকা), জাপানি নিয়োগকর্তার কাছ থেকে চাকরির প্রস্তাব পাওয়া, নিয়োগকর্তা সার্টিফিকেট অব এলিজিবিলিটির জন্য আবেদন করেন, অনুমোদনের পর জাপানি দূতাবাসে ভিসার আবেদন, বাংলাদেশের অভিবাসন প্রক্রিয়া (BMET) শেষ করা, তারপর যাত্রা। প্রতিটি ধাপের নিজস্ব কাগজপত্র ও সময় আছে, আমাদের স্টাফ আপনাকে পথ দেখাবেন।',
                'source_url' => self::MOFA,
                'staff_note' => 'The BMET step is described by a third-party guide only. Confirm the exact Bangladeshi steps (registration, clearance, any pre-departure orientation).',
            ],
            [
                'slug' => 'process-coe', 'category' => 'process', 'sort_order' => 20,
                'question_en' => 'What is a Certificate of Eligibility (CoE)?',
                'question_bn' => 'সার্টিফিকেট অব এলিজিবিলিটি (CoE) কী?',
                'keywords' => 'CoE, certificate of eligibility, eligibility certificate, সার্টিফিকেট, কোই',
                'answer_en' => 'It is a document issued by Japan\'s immigration authority after your Japanese employer applies for you. You need it to apply for your visa at the Japanese Embassy.',
                'answer_bn' => 'আপনার জাপানি নিয়োগকর্তা আপনার জন্য আবেদন করার পর জাপানের অভিবাসন কর্তৃপক্ষ এই নথি ইস্যু করে। জাপানি দূতাবাসে ভিসার আবেদনের জন্য এটি লাগে।',
                'source_url' => self::MOFA,
                'staff_note' => 'None.',
            ],
            [
                'slug' => 'process-time', 'category' => 'process', 'sort_order' => 30,
                'question_en' => 'How long does the whole process take?',
                'question_bn' => 'পুরো প্রক্রিয়ায় কত সময় লাগে?',
                'keywords' => 'how long, time, duration, months, visa how long, visa processing time, how many days, সময়, কতদিন, কত মাস, ভিসা কত দিনে হবে, ভিসা পেতে কতদিন, কত দিনে',
                'answer_en' => 'It varies a lot. Test dates, matching with an employer, the Certificate of Eligibility and the visa each take time, and the total is often several months. Anyone who promises a fixed, fast date is not being honest with you.',
                'answer_bn' => 'এটা অনেকটাই পরিবর্তনশীল। পরীক্ষার তারিখ, নিয়োগকর্তার সাথে মিলানো, সার্টিফিকেট অব এলিজিবিলিটি ও ভিসা, প্রতিটিতে সময় লাগে এবং মোট প্রায়ই কয়েক মাস লাগে। যে ব্যক্তি নির্দিষ্ট ও দ্রুত তারিখের প্রতিশ্রুতি দেয় সে আপনার সাথে সৎ নয়।',
                'source_url' => self::MOFA,
                'staff_note' => 'Do not add a number of months unless you can support it with your own experience.',
            ],
            [
                'slug' => 'process-bmet', 'category' => 'process', 'sort_order' => 40,
                'question_en' => 'Do I need BMET registration?',
                'question_bn' => 'আমার কি BMET রেজিস্ট্রেশন লাগবে?',
                'keywords' => 'BMET, registration, emigration clearance, smart card, রেজিস্ট্রেশন, ছাড়পত্র, বিএমইটি',
                'answer_en' => 'Bangladeshi workers who go abroad for work must be registered with BMET and complete emigration clearance before departure. Our staff will explain the current steps.',
                'answer_bn' => 'বিদেশে কাজের জন্য যাওয়া বাংলাদেশি কর্মীদের যাত্রার আগে BMET-এ নিবন্ধিত হতে হয় এবং অভিবাসন ছাড়পত্র সম্পন্ন করতে হয়। বর্তমান ধাপগুলো আমাদের স্টাফ বুঝিয়ে দেবেন।',
                'source_url' => 'https://bmet.gov.bd',
                'staff_note' => 'Verify on bmet.gov.bd and add the current registration steps.',
            ],
            [
                'slug' => 'safety-pay', 'category' => 'safety', 'sort_order' => 20,
                'question_en' => 'How much do I have to pay?',
                'question_bn' => 'আমাকে কত টাকা দিতে হবে?',
                'keywords' => 'cost, fee, fees, money, how much, price, খরচ, টাকা, ফি, কত',
                'answer_en' => 'The amounts depend on the route and change over time, so we do not quote a number here. Pay only through official, receipted channels and never to a person who promises you a job. Ask us before you pay anyone.',
                'answer_bn' => 'খরচ রুট অনুযায়ী ভিন্ন হয় এবং সময়ের সাথে বদলায়, তাই এখানে কোনো অঙ্ক বলা হচ্ছে না। শুধু সরকারি, রসিদযুক্ত মাধ্যমে টাকা দিন এবং যে ব্যক্তি চাকরির প্রতিশ্রুতি দিচ্ছে তাকে কখনো নয়। কাউকে টাকা দেওয়ার আগে আমাদের জিজ্ঞেস করুন।',
                'source_url' => 'https://bmet.gov.bd',
                'staff_note' => 'Add the current official figures with their date, then set valid_until. Do not publish a number without a source.',
            ],
            [
                'slug' => 'safety-agency-check', 'category' => 'safety', 'sort_order' => 30,
                'question_en' => 'How do I check whether a recruiting agency is genuine?',
                'question_bn' => 'রিক্রুটিং এজেন্সি আসল কি না কীভাবে যাচাই করব?',
                'keywords' => 'agency, recruiting agency, licence, license, RL number, verify, genuine, fake, এজেন্সি, লাইসেন্স, যাচাই, ভুয়া',
                'answer_en' => 'Agencies that send workers abroad must hold a BMET recruiting licence (an RL number). Check the licence and its validity on the official BMET agency list before you share documents or money.',
                'answer_bn' => 'যেসব এজেন্সি কর্মী বিদেশে পাঠায় তাদের BMET-এর রিক্রুটিং লাইসেন্স (RL নম্বর) থাকতে হয়। কাগজপত্র বা টাকা দেওয়ার আগে BMET-এর সরকারি এজেন্সি তালিকায় লাইসেন্স ও তার মেয়াদ দেখে নিন।',
                'source_url' => 'https://bmet.gov.bd',
                'staff_note' => 'Add the exact official agency-list page once confirmed.',
            ],
            [
                'slug' => 'safety-red-flags', 'category' => 'safety', 'sort_order' => 40,
                'question_en' => 'What are the signs of a fake job offer?',
                'question_bn' => 'ভুয়া চাকরির প্রস্তাবের লক্ষণ কী?',
                'keywords' => 'fake, scam, fraud, cheat, red flag, warning, asked for money, money before test, money before exam, ভুয়া, প্রতারণা, ঠকানো, সতর্কতা, টাকা চেয়েছে, আগে টাকা',
                'answer_en' => 'Warning signs: they ask for money before any test or contract; there is no company name or address; contact is only by WhatsApp or Telegram; they promise a guaranteed visa; they say no exam or language is needed; the salary is unusually high. If you see these, stop and ask us.',
                'answer_bn' => 'সতর্ক সংকেত: কোনো পরীক্ষা বা চুক্তির আগেই টাকা চায়; কোম্পানির নাম বা ঠিকানা নেই; শুধু WhatsApp বা Telegram-এ যোগাযোগ; ভিসার নিশ্চয়তা দেয়; বলে পরীক্ষা বা ভাষা লাগবে না; বেতন অস্বাভাবিক বেশি। এগুলো দেখলে থেমে যান এবং আমাদের জিজ্ঞেস করুন।',
                'source_url' => 'https://globalvoices.org/2025/11/30/when-dreams-meet-digital-recruitment-scams-bangladeshi-workers-in-crisis/',
                'staff_note' => 'General guidance based on public reporting on recruitment scams; add cases you have seen yourselves.',
            ],
            [
                'slug' => 'tensai-no-guarantee', 'category' => 'tensai', 'sort_order' => 10,
                'question_en' => 'Do you guarantee me a job?',
                'question_bn' => 'আপনারা কি আমাকে চাকরির নিশ্চয়তা দেন?',
                'keywords' => 'guarantee, promise, sure job, visa guarantee, নিশ্চয়তা, গ্যারান্টি, প্রতিশ্রুতি',
                'answer_en' => 'No. We are a consultancy. We help you prepare your CV and plan your steps and, with your permission, present your CV to suitable employers and partners. We cannot promise a job, a visa or a date.',
                'answer_bn' => 'না। আমরা একটি পরামর্শদাতা প্রতিষ্ঠান। আমরা আপনার সিভি তৈরি ও পরিকল্পনায় সাহায্য করি এবং আপনার অনুমতি নিয়ে উপযুক্ত নিয়োগকর্তা ও অংশীদারের কাছে সিভি উপস্থাপন করি। চাকরি, ভিসা বা তারিখের প্রতিশ্রুতি আমরা দিতে পারি না।',
                'source_url' => null,
                'staff_note' => 'Matches the Privacy Policy and Terms wording. Keep consistent.',
            ],
            [
                'slug' => 'tensai-my-cv', 'category' => 'tensai', 'sort_order' => 20,
                'question_en' => 'How does the My CV service work?',
                'question_bn' => 'আমার সিভি সেবাটি কীভাবে কাজ করে?',
                'keywords' => 'my cv, cv service, assistant, how it works, সিভি, অ্যাসিস্ট্যান্ট, কীভাবে কাজ করে',
                'answer_en' => 'Our staff open the assistant for your account. You answer simple questions and your CV builds as you go, and our team checks it. With your permission it can be shared as a link that shows a short name, a reference number and your age, never your phone number.',
                'answer_bn' => 'আমাদের স্টাফ আপনার একাউন্টে অ্যাসিস্ট্যান্ট চালু করে দেন। আপনি সহজ প্রশ্নের উত্তর দেন, আর সিভি নিজে থেকেই তৈরি হতে থাকে; আমাদের টিম তা যাচাই করে। আপনার অনুমতি নিয়ে এটি এমন একটি লিংক হিসেবে শেয়ার করা যায় যাতে সংক্ষিপ্ত নাম, রেফারেন্স নম্বর ও বয়স থাকে, ফোন নাম্বার কখনো নয়।',
                'source_url' => null,
                'staff_note' => 'Matches the shareable link design; update if the link fields change.',
            ],
            [
                'slug' => 'tensai-passport-number', 'category' => 'tensai', 'sort_order' => 30,
                'question_en' => 'Should I write my passport number in the CV?',
                'question_bn' => 'সিভিতে কি আমার পাসপোর্ট নম্বর লিখব?',
                'keywords' => 'passport number, NID, national id, document number, পাসপোর্ট নম্বর, এনআইডি',
                'answer_en' => 'No. We never ask for passport or national ID numbers in the chat or in the CV. Our staff check your original documents in person.',
                'answer_bn' => 'না। চ্যাট বা সিভিতে আমরা কখনো পাসপোর্ট বা জাতীয় পরিচয়পত্রের নম্বর চাই না। আপনার আসল কাগজপত্র আমাদের স্টাফ সরাসরি দেখে যাচাই করেন।',
                'source_url' => null,
                'staff_note' => 'Matches the Privacy Policy wording.',
            ],
            [
                'slug' => 'cv-what-to-write', 'category' => 'tensai', 'sort_order' => 40,
                'question_en' => 'What should a good CV for Japan include?',
                'question_bn' => 'জাপানের জন্য একটি ভালো সিভিতে কী থাকা উচিত?',
                'keywords' => 'cv tips, good cv, what to write, resume, সিভি, কী লিখব, ভালো সিভি',
                'answer_en' => 'Your job and years of experience, your licences and training, the languages you speak, and what you can do. Short, true statements are better than long ones. Do not add anything you cannot prove.',
                'answer_bn' => 'আপনার কাজ ও অভিজ্ঞতার বছর, লাইসেন্স ও প্রশিক্ষণ, কোন কোন ভাষা জানেন এবং কী কী কাজ পারেন। লম্বা বর্ণনার চেয়ে ছোট ও সত্য বাক্য ভালো। যা প্রমাণ করতে পারবেন না তা যোগ করবেন না।',
                'source_url' => null,
                'staff_note' => 'Add your own advice from candidates who succeeded.',
            ],
        ];
    }
}
