insert into packages (id, slug, name, category, description, price, mrp, discount)
values
  ('burnout-predictor-basic', 'burnout-predictor-basic', 'BURNOUT PREDICTOR BASIC', 'Stress & Lifestyle', 'Stress & Energy Health Check', 2480, 5800, 57),
  ('burnout-predictor-pro', 'burnout-predictor-pro', 'BURNOUT PREDICTOR PRO', 'Stress & Lifestyle', 'Advanced Stress + Hormone Panel', 3680, 7800, 53),
  ('health-360-basic', 'health-360-basic', 'HEALTH 360 BASIC', 'Preventive Health', 'Basic Preventive Screening', 699, 1950, 64),
  ('health-360-pro', 'health-360-pro', 'HEALTH 360 PRO', 'Preventive Health', 'Complete Body Check', 1599, 3340, 52),
  ('health-360-elite', 'health-360-elite', 'HEALTH 360 ELITE', 'Preventive Health', 'Advanced Preventive Screening', 1999, 4200, 52),
  ('longevity-package', 'longevity-package', 'LONGEVITY PACKAGE', 'Advanced & Specialized', 'Full Body + Disease Risk Screening', 4999, 12000, 58),
  ('gut-health-check', 'gut-health-check', 'GUT HEALTH CHECK', 'Stress & Lifestyle', 'Digestive & Absorption Health', 3599, 7200, 50),
  ('pcod-package', 'pcod-package', 'PCOD PACKAGE', 'Advanced & Specialized', 'Women Health', 2500, 5000, 50),
  ('std-package', 'std-package', 'STD PACKAGE', 'Advanced & Specialized', 'Confidential', 1250, 3000, 60)
on conflict (id) do update set
  price = excluded.price,
  mrp = excluded.mrp,
  discount = excluded.discount,
  description = excluded.description;

insert into tests (id, slug, name, category, description, price, mrp, discount, fasting_required, fasting_hours)
values
  ('cbc-esr', 'cbc-esr', 'Complete Blood Count + ESR', 'Blood', 'CBC with ESR', 300, 500, 40, false, null),
  ('hba1c', 'hba1c', 'HbA1c', 'Blood', 'Diabetes risk marker', 500, 900, 44, false, null),
  ('fasting-blood-sugar', 'fasting-blood-sugar', 'Fasting Blood Sugar', 'Blood', 'Fasting glucose test', 140, 250, 44, true, '10-12 hrs'),
  ('random-blood-sugar', 'random-blood-sugar', 'Random Blood Sugar', 'Blood', 'Random glucose test', 140, 250, 44, false, null),
  ('thyroid-function-test', 'thyroid-function-test', 'Thyroid Function Test', 'Profile', 'T3, T4, TSH profile', 350, 800, 56, false, null),
  ('true-lipid-profile', 'true-lipid-profile', 'True Lipid Profile', 'Profile', 'Advanced lipid profile', 950, 1500, 37, true, '10-12 hrs'),
  ('vitamin-d', 'vitamin-d', 'Vitamin D', 'Hormone', 'Vitamin D level', 800, 1600, 50, false, null),
  ('vitamin-b12', 'vitamin-b12', 'Vitamin B12', 'Hormone', 'Vitamin B12 level', 600, 1200, 50, false, null),
  ('true-liver-function-test', 'true-liver-function-test', 'TRUE Liver Function Test', 'Profile', 'Extended liver function panel', 800, 1500, 47, false, null),
  ('insulin', 'insulin', 'Insulin', 'Hormone', 'Fasting insulin', 600, 1200, 50, true, '10-12 hrs')
on conflict (id) do update set
  price = excluded.price,
  mrp = excluded.mrp,
  discount = excluded.discount,
  fasting_required = excluded.fasting_required,
  fasting_hours = excluded.fasting_hours;
