-- Seeding sample questions for SGPGI Nursing Officer Exam Prep

INSERT INTO questions (subject, topic, question, options, correct_answer, explanation, difficulty, tags, previous_year_indicator) VALUES
-- Medical Surgical Nursing
(
    'Medical Surgical Nursing',
    'Cardiovascular System',
    'A patient is admitted with a diagnosis of left-sided heart failure. Which clinical manifestation should the nurse expect to find during assessment?',
    '["Jugular vein distention", "Dyspnea and crackles", "Splenomegaly", "Peripheral edema"]',
    1,
    'Left-sided heart failure leads to pulmonary congestion. Fluid backs up into the lungs, causing dyspnea, orthopnea, cough, and crackles on auscultation. Jugular vein distention, peripheral edema, and splenomegaly are signs of right-sided heart failure due to systemic venous congestion.',
    'Medium',
    '{"cardiology", "heart failure", "assessment"}',
    'SGPGI 2022'
),
(
    'Medical Surgical Nursing',
    'Endocrine System',
    'Which of the following clinical findings is a hallmark sign of Diabetic Ketoacidosis (DKA)?',
    '["Bradycardia and hypertension", "Kussmaul respirations and fruity breath odor", "Profuse sweating and tremors", "Severe peripheral edema"]',
    1,
    'Hallmark signs of DKA include Kussmaul respirations (rapid, deep breathing to blow off CO2 to compensate for metabolic acidosis) and a fruity breath odor (due to acetone release). Sweating and tremors are associated with hypoglycemia, not DKA.',
    'Easy',
    '{"diabetes", "DKA", "endocrine"}',
    'AIIMS NORCET 2023'
),
-- Pediatric Nursing
(
    'Pediatric Nursing',
    'Growth & Development',
    'At what age does a normal infant typically double their birth weight?',
    '["3 months", "6 months", "9 months", "12 months"]',
    1,
    'A normal infant typically doubles their birth weight by 5 to 6 months of age and triples it by 1 year (12 months) of age.',
    'Easy',
    '{"infant growth", "pediatrics", "development"}',
    'DSSSB 2021'
),
(
    'Pediatric Nursing',
    'Congenital Heart Defects',
    'Which of the following is NOT a component of the Tetralogy of Fallot?',
    '["Ventricular septal defect", "Right ventricular hypertrophy", "Pulmonary stenosis", "Atrial septal defect"]',
    3,
    'Tetralogy of Fallot consists of four components: 1) Pulmonary artery stenosis, 2) Ventricular septal defect (VSD), 3) Overriding aorta, and 4) Right ventricular hypertrophy. Atrial septal defect (ASD) is not part of this tetralogy.',
    'Hard',
    '{"tetralogy of fallot", "congenital defects", "pediatric cardiac"}',
    'SGPGI 2023'
),
-- Obstetrics & Gynecology (OBGYN)
(
    'Obstetrics & Gynecology (OBGYN)',
    'Antenatal Care',
    'Calculate the Expected Date of Delivery (EDD) using Nagele''s rule for a pregnant woman whose Last Menstrual Period (LMP) began on October 10, 2025.',
    '["July 17, 2026", "July 10, 2026", "July 3, 2026", "August 17, 2026"]',
    0,
    'Nagele''s Rule formula: Add 7 days to the first day of the Last Menstrual Period (LMP), subtract 3 months, and add 1 year. So, Oct 10 + 7 days = Oct 17. Subtracting 3 months gives July 17. Adding 1 year gives July 17, 2026.',
    'Medium',
    '{"EDD calculation", "Nageles rule", "obgyn"}',
    'SGPGI 2021'
),
(
    'Obstetrics & Gynecology (OBGYN)',
    'Complications of Pregnancy',
    'A pregnant woman at 32 weeks gestation presents with painless, bright red vaginal bleeding. The nurse should suspect which condition?',
    '["Abruptio placentae", "Placenta previa", "Ectopic pregnancy", "Pre-eclampsia"]',
    1,
    'Painless, bright red vaginal bleeding in the second half of pregnancy is the classic sign of placenta previa. Abruptio placentae is characterized by painful, dark red vaginal bleeding and uterine rigidity.',
    'Medium',
    '{"placenta previa", "pregnancy bleeding", "obgyn"}',
    'AIIMS NORCET 2022'
),
-- Fundamentals of Nursing
(
    'Fundamentals of Nursing',
    'Infection Control',
    'What is the minimum duration recommended for hand washing with soap and water under running water to ensure proper hygiene?',
    '["5 - 10 seconds", "15 - 20 seconds", "40 - 60 seconds", "2 minutes"]',
    2,
    'According to WHO, hand washing with soap and water should take 40-60 seconds total, with the actual rubbing of hands taking at least 20 seconds. An alcohol-based hand rub should take 20-30 seconds.',
    'Easy',
    '{"hand hygiene", "infection control", "nursing basics"}',
    'ESIC 2019'
),
(
    'Fundamentals of Nursing',
    'Administration of Medications',
    'Which angle of insertion is correct when administering an intramuscular (IM) injection to an adult?',
    '["15 degrees", "45 degrees", "90 degrees", "60 degrees"]',
    2,
    'An intramuscular (IM) injection is administered at a 90-degree angle. Subcutaneous injections are given at 45 degrees (or 90 degrees if using a short needle/pinching skin), and intradermal injections are given at 10 to 15 degrees.',
    'Easy',
    '{"medication safety", "injection angles", "fundamentals"}',
    'RRB 2019'
),
-- Anatomy & Physiology
(
    'Anatomy & Physiology',
    'Endocrine System',
    'Which hormone is responsible for the regulation of calcium levels in the blood by stimulating bone resorption and increasing renal absorption?',
    '["Calcitonin", "Parathyroid hormone (PTH)", "Thyroid hormone", "Aldosterone"]',
    1,
    'Parathyroid hormone (PTH) increases blood calcium levels by stimulating osteoclast activity (bone resorption), increasing calcium reabsorption in the kidneys, and promoting active vitamin D synthesis (which increases intestinal calcium absorption). Calcitonin has the opposite effect.',
    'Medium',
    '{"endocrine", "calcium regulation", "anatomy"}',
    'AIIMS NORCET 2021'
),
-- Pharmacology
(
    'Pharmacology',
    'Cardiac Medications',
    'Before administering Digoxin (Lanoxin), the nurse must check which of the following vital signs?',
    '["Blood pressure", "Apical pulse rate", "Respiratory rate", "Temperature"]',
    1,
    'Digoxin decreases the heart rate (negative chronotropic effect). The nurse must check the apical pulse for a full 60 seconds before administering digoxin. The medication is typically withheld if the apical pulse is less than 60 beats per minute in adults.',
    'Easy',
    '{"digoxin", "apical pulse", "pharmacology"}',
    'SGPGI 2023'
),
-- Nutrition
(
    'Nutrition',
    'Vitamins',
    'Wernicke-Korsakoff syndrome is caused by a severe deficiency of which of the following vitamins?',
    '["Vitamin B12 (Cobalamin)", "Vitamin B1 (Thiamine)", "Vitamin B3 (Niacin)", "Vitamin C (Ascorbic acid)"]',
    1,
    'Wernicke-Korsakoff syndrome is a neurological disorder caused by a severe deficiency of Vitamin B1 (Thiamine), most commonly observed in individuals with chronic alcohol abuse.',
    'Medium',
    '{"vitamins", "thiamine deficiency", "nutrition"}',
    'DSSSB 2021'
),
-- Microbiology
(
    'Microbiology',
    'Bacteriology',
    'Which staining technique is specifically used to identify Mycobacterium tuberculosis?',
    '["Gram staining", "Acid-fast (Ziehl-Neelsen) staining", "Negative staining", "Spore staining"]',
    1,
    'Mycobacterium tuberculosis has a waxy cell wall containing mycolic acid, which makes it resistant to standard Gram staining. It is identified using Acid-Fast Staining, also known as the Ziehl-Neelsen staining technique.',
    'Easy',
    '{"microbiology", "staining", "tuberculosis"}',
    'RRB 2020'
),
-- Nursing Management
(
    'Nursing Management',
    'Leadership Styles',
    'A nurse manager involves the staff in decision-making and planning unit goals. Which leadership style is this manager demonstrating?',
    '["Autocratic", "Democratic", "Laissez-faire", "Bureaucratic"]',
    1,
    'Democratic leadership style involves sharing decision-making and goal-setting with group members, fostering collaboration and active participation.',
    'Easy',
    '{"leadership", "management", "nursing administration"}',
    'SGPGI 2022'
),
-- Research & Statistics
(
    'Research & Statistics',
    'Research Methodology',
    'Which type of research design is considered the gold standard for testing the efficacy of a clinical intervention?',
    '["Descriptive study", "Cohort study", "Randomized Controlled Trial (RCT)", "Case-control study"]',
    2,
    'Randomized Controlled Trials (RCTs) are the gold standard of clinical research design due to random assignment and control groups, which minimize confounding variables and biases.',
    'Medium',
    '{"research design", "RCT", "statistics"}',
    'AIIMS NORCET 2023'
),
-- General Knowledge
(
    'General Knowledge',
    'Indian Healthcare System',
    'Under the Ayushman Bharat Yojana (PM-JAY), what is the health cover provided per family per year for secondary and tertiary care hospitalization?',
    '["Rs. 2 Lakhs", "Rs. 3 Lakhs", "Rs. 5 Lakhs", "Rs. 10 Lakhs"]',
    2,
    'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY) provides a health cover of Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families.',
    'Easy',
    '{"general knowledge", "health schemes", "GK"}',
    'SGPGI 2023'
),
-- General English
(
    'General English',
    'Grammar',
    'Choose the correct preposition to complete the sentence: "The nurse is responsible ___ administering medications to the patients in Ward A."',
    '["to", "for", "with", "at"]',
    1,
    'The adjective "responsible" takes the preposition "for" when referring to tasks or duties (e.g., "responsible for administering...").',
    'Easy',
    '{"english", "preposition", "grammar"}',
    'SGPGI 2022'
),
-- Reasoning
(
    'Reasoning',
    'Series Completion',
    'Complete the series: 3, 5, 9, 17, 33, ?',
    '["45", "55", "65", "68"]',
    2,
    'The pattern is adding successive powers of 2. 3 + 2 = 5; 5 + 4 = 9; 9 + 8 = 17; 17 + 16 = 33; 33 + 32 = 65. Alternatively, each number is (2 * previous number) - 1.',
    'Medium',
    '{"reasoning", "number series"}',
    'SGPGI 2021'
),
-- Aptitude
(
    'Aptitude',
    'Percentage',
    'If 15% of a nursing student cohort failed a pharmacology exam, and 68 students passed, what is the total number of students in the cohort?',
    '["80", "90", "100", "75"]',
    0,
    'If 15% failed, then 85% passed. Let the total number of students be X. 0.85 * X = 68 => X = 68 / 0.85 = 80 total students.',
    'Medium',
    '{"aptitude", "percentage", "math"}',
    'SGPGI 2022'
);

-- Seed a Mock Test
INSERT INTO mock_tests (title, duration_minutes, total_questions, negative_marking) VALUES
('SGPGI Nursing Officer Full Mock Test - 01', 120, 100, 0.25);

-- Link mock test questions
INSERT INTO mock_test_questions (mock_test_id, question_id, order_index)
SELECT 1, id, row_number() over() - 1 FROM questions LIMIT 18;
