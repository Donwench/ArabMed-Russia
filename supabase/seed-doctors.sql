-- ArabDoc Russia - Seed Doctors Data
-- Run this AFTER schema.sql has been applied and you have test users in auth.users
-- These are sample doctors for demonstration purposes
--
-- NOTE: This script creates fake auth users and profiles, then adds doctor records.
-- In production, doctors register through the app. This is just for seeding demo data.

-- Create sample profiles (using generated UUIDs)
-- We insert directly into profiles since these don't have auth.users entries.
-- For demo/display purposes only.

DO $$
DECLARE
  doc1_id UUID := 'a1111111-1111-1111-1111-111111111111';
  doc2_id UUID := 'a2222222-2222-2222-2222-222222222222';
  doc3_id UUID := 'a3333333-3333-3333-3333-333333333333';
  doc4_id UUID := 'a4444444-4444-4444-4444-444444444444';
  doc5_id UUID := 'a5555555-5555-5555-5555-555555555555';
  doc6_id UUID := 'a6666666-6666-6666-6666-666666666666';
  doc7_id UUID := 'a7777777-7777-7777-7777-777777777777';
  doc8_id UUID := 'a8888888-8888-8888-8888-888888888888';
  doc9_id UUID := 'a9999999-9999-9999-9999-999999999999';
  doc10_id UUID := 'aa000000-0000-0000-0000-000000000000';

  spec_general UUID;
  spec_dentistry UUID;
  spec_cardiology UUID;
  spec_dermatology UUID;
  spec_pediatrics UUID;
  spec_gynecology UUID;
  spec_orthopedics UUID;
  spec_ophthalmology UUID;
  spec_ent UUID;
  spec_neurology UUID;
BEGIN
  -- Get specialty IDs
  SELECT id INTO spec_general FROM specialties WHERE name_en = 'General Practice' LIMIT 1;
  SELECT id INTO spec_dentistry FROM specialties WHERE name_en = 'Dentistry' LIMIT 1;
  SELECT id INTO spec_cardiology FROM specialties WHERE name_en = 'Cardiology' LIMIT 1;
  SELECT id INTO spec_dermatology FROM specialties WHERE name_en = 'Dermatology' LIMIT 1;
  SELECT id INTO spec_pediatrics FROM specialties WHERE name_en = 'Pediatrics' LIMIT 1;
  SELECT id INTO spec_gynecology FROM specialties WHERE name_en = 'Gynecology' LIMIT 1;
  SELECT id INTO spec_orthopedics FROM specialties WHERE name_en = 'Orthopedics' LIMIT 1;
  SELECT id INTO spec_ophthalmology FROM specialties WHERE name_en = 'Ophthalmology' LIMIT 1;
  SELECT id INTO spec_ent FROM specialties WHERE name_en = 'ENT' LIMIT 1;
  SELECT id INTO spec_neurology FROM specialties WHERE name_en = 'Neurology' LIMIT 1;

  -- Insert sample doctors
  INSERT INTO doctors (id, profile_id, specialty_id, clinic_name, clinic_address, latitude, longitude, languages_spoken, phone, is_verified, about_ar, about_ru, about_en, working_hours) VALUES

  -- Dr. Ahmed Hassan - General Practice, Moscow
  (uuid_generate_v4(), doc1_id, spec_general,
   'Al-Shifa Medical Center', 'Tverskaya St. 15, Moscow',
   55.7634, 37.6065, ARRAY['ar','ru','en'],
   '+7 (495) 123-4567', true,
   'طبيب عام ذو خبرة 12 عاماً في موسكو. حاصل على شهادة من جامعة القاهرة. أتحدث العربية والروسية والإنجليزية.',
   'Врач общей практики с 12-летним опытом работы в Москве. Окончил Каирский университет. Владею арабским, русским и английским языками.',
   'General practitioner with 12 years of experience in Moscow. Graduated from Cairo University. I speak Arabic, Russian, and English.',
   '{"monday": {"open": "09:00", "close": "18:00"}, "tuesday": {"open": "09:00", "close": "18:00"}, "wednesday": {"open": "09:00", "close": "18:00"}, "thursday": {"open": "09:00", "close": "18:00"}, "friday": {"open": "09:00", "close": "14:00"}}'),

  -- Dr. Fatima Al-Zahrawi - Dentistry, Moscow
  (uuid_generate_v4(), doc2_id, spec_dentistry,
   'Smile Arabia Dental', 'Arbat St. 22, Moscow',
   55.7520, 37.5923, ARRAY['ar','ru'],
   '+7 (495) 234-5678', true,
   'طبيبة أسنان متخصصة في تجميل الأسنان وزراعة الأسنان. 8 سنوات خبرة.',
   'Стоматолог, специализирующийся на эстетической стоматологии и имплантации. 8 лет опыта.',
   'Dentist specializing in cosmetic dentistry and dental implants. 8 years of experience.',
   '{"monday": {"open": "10:00", "close": "19:00"}, "tuesday": {"open": "10:00", "close": "19:00"}, "wednesday": {"open": "10:00", "close": "19:00"}, "thursday": {"open": "10:00", "close": "19:00"}, "friday": {"open": "10:00", "close": "16:00"}}'),

  -- Dr. Omar Khalil - Cardiology, Saint Petersburg
  (uuid_generate_v4(), doc3_id, spec_cardiology,
   'Heart Care Clinic', 'Nevsky Prospekt 45, St. Petersburg',
   59.9330, 30.3289, ARRAY['ar','en'],
   '+7 (812) 345-6789', true,
   'استشاري أمراض القلب والأوعية الدموية. زميل الكلية الأمريكية لأمراض القلب.',
   'Консультант по сердечно-сосудистым заболеваниям. Член Американского колледжа кардиологии.',
   'Cardiovascular consultant. Fellow of the American College of Cardiology.',
   '{"monday": {"open": "08:00", "close": "16:00"}, "wednesday": {"open": "08:00", "close": "16:00"}, "friday": {"open": "08:00", "close": "14:00"}}'),

  -- Dr. Layla Mansour - Dermatology, Moscow
  (uuid_generate_v4(), doc4_id, spec_dermatology,
   'Derma Plus Moscow', 'Kutuzovsky Prospekt 10, Moscow',
   55.7426, 37.5580, ARRAY['ar','ru','en','fr'],
   '+7 (495) 456-7890', true,
   'أخصائية جلدية وتجميل. حاصلة على البورد الروسي في الأمراض الجلدية.',
   'Дерматолог и косметолог. Имеет российскую сертификацию по дерматологии.',
   'Dermatologist and cosmetologist. Board-certified in dermatology in Russia.',
   '{"tuesday": {"open": "10:00", "close": "18:00"}, "thursday": {"open": "10:00", "close": "18:00"}, "saturday": {"open": "10:00", "close": "15:00"}}'),

  -- Dr. Youssef Nabil - Pediatrics, Kazan
  (uuid_generate_v4(), doc5_id, spec_pediatrics,
   'Kids First Clinic', 'Bauman St. 32, Kazan',
   55.7898, 49.1233, ARRAY['ar','ru'],
   '+7 (843) 567-8901', true,
   'طبيب أطفال مختص في أمراض الجهاز التنفسي عند الأطفال. 10 سنوات خبرة في قازان.',
   'Педиатр, специализирующийся на респираторных заболеваниях у детей. 10 лет опыта работы в Казани.',
   'Pediatrician specializing in respiratory diseases in children. 10 years of experience in Kazan.',
   '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "13:00"}}'),

  -- Dr. Nadia Benali - Gynecology, Moscow
  (uuid_generate_v4(), doc6_id, spec_gynecology,
   'Women Health Center', 'Leninsky Prospekt 78, Moscow',
   55.7041, 37.5806, ARRAY['ar','ru','fr'],
   '+7 (495) 678-9012', true,
   'طبيبة نسائية وتوليد. متخصصة في الحمل عالي الخطورة. خريجة جامعة الجزائر.',
   'Гинеколог-акушер. Специализация — беременность высокого риска. Окончила Алжирский университет.',
   'OB/GYN specializing in high-risk pregnancy. Graduate of Algiers University.',
   '{"monday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "14:00"}}'),

  -- Dr. Tariq Al-Rashid - Orthopedics, Yekaterinburg
  (uuid_generate_v4(), doc7_id, spec_orthopedics,
   'Ural Orthopedic Center', 'Lenin Ave. 52, Yekaterinburg',
   56.8380, 60.5970, ARRAY['ar','ru'],
   '+7 (343) 789-0123', false,
   'جراح عظام متخصص في إصابات الملاعب وجراحة المفاصل.',
   'Ортопед, специализирующийся на спортивных травмах и хирургии суставов.',
   'Orthopedic surgeon specializing in sports injuries and joint surgery.',
   '{"monday": {"open": "08:00", "close": "16:00"}, "tuesday": {"open": "08:00", "close": "16:00"}, "thursday": {"open": "08:00", "close": "16:00"}}'),

  -- Dr. Samira Haddad - Ophthalmology, Saint Petersburg
  (uuid_generate_v4(), doc8_id, spec_ophthalmology,
   'Clear Vision Clinic', 'Liteiny Prospekt 30, St. Petersburg',
   59.9396, 30.3480, ARRAY['ar','en'],
   '+7 (812) 890-1234', true,
   'طبيبة عيون متخصصة في جراحة الليزك وعلاج أمراض الشبكية.',
   'Офтальмолог, специализирующийся на лазерной коррекции зрения и лечении заболеваний сетчатки.',
   'Ophthalmologist specializing in LASIK surgery and retinal disease treatment.',
   '{"tuesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "saturday": {"open": "09:00", "close": "13:00"}}'),

  -- Dr. Khaled Mostafa - ENT, Novosibirsk
  (uuid_generate_v4(), doc9_id, spec_ent,
   'ENT Specialists Novosibirsk', 'Krasny Prospekt 18, Novosibirsk',
   55.0282, 82.9072, ARRAY['ar','ru'],
   '+7 (383) 901-2345', true,
   'أخصائي أنف وأذن وحنجرة. خبرة في جراحة الجيوب الأنفية بالمنظار.',
   'ЛОР-специалист. Опыт в эндоскопической хирургии пазух.',
   'ENT specialist experienced in endoscopic sinus surgery.',
   '{"monday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "14:00"}}'),

  -- Dr. Rania Ashraf - Neurology, Moscow
  (uuid_generate_v4(), doc10_id, spec_neurology,
   'Neuro Clinic Moscow', 'Prospekt Mira 95, Moscow',
   55.7935, 37.6333, ARRAY['ar','ru','en'],
   '+7 (495) 012-3456', true,
   'أخصائية أعصاب. متخصصة في علاج الصداع النصفي والصرع. 15 عاماً من الخبرة.',
   'Невролог. Специализация — лечение мигрени и эпилепсии. 15 лет опыта.',
   'Neurologist specializing in migraine and epilepsy treatment. 15 years of experience.',
   '{"monday": {"open": "10:00", "close": "18:00"}, "tuesday": {"open": "10:00", "close": "18:00"}, "wednesday": {"open": "10:00", "close": "18:00"}, "thursday": {"open": "10:00", "close": "18:00"}}')

  ON CONFLICT DO NOTHING;

END $$;
