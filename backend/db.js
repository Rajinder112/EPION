const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

let pool = null;
let useLocalDb = false;
const localDbPath = path.join(__dirname, 'local_db.json');
const usersPath = path.join(__dirname, 'db_users.json');
const bookmarksPath = path.join(__dirname, 'db_bookmarks.json');
const attemptsPath = path.join(__dirname, 'db_question_attempts.json');
const mockTestsPath = path.join(__dirname, 'db_mock_tests.json');
const batchesPath = path.join(__dirname, 'db_batches.json');
const practiceSubjectsPath = path.join(__dirname, 'db_practice_subjects.json');
const conceptsPath = path.join(__dirname, 'db_concepts.json');

const questionFiles = {
  'Medical Surgical Nursing': path.join(__dirname, 'db_questions_medical_surgical.json'),
  'Pediatric Nursing': path.join(__dirname, 'db_questions_pediatric.json'),
  'Obstetrics & Gynecology (OBGYN)': path.join(__dirname, 'db_questions_obgyn.json'),
  'Fundamentals of Nursing': path.join(__dirname, 'db_questions_fundamentals.json'),
  'Anatomy & Physiology': path.join(__dirname, 'db_questions_anatomy_physiology.json'),
  'Pharmacology': path.join(__dirname, 'db_questions_pharmacology.json'),
  'Other': path.join(__dirname, 'db_questions_other.json')
};

// Initial seed data for the local fallback DB
const defaultLocalDb = {
  users: [],
  questions: [],
  bookmarks: [],
  question_attempts: [],
  mock_tests: [
    {
      id: 1,
      title: "SGPGI Nursing Officer Full Mock Test - 01",
      duration_minutes: 120,
      total_questions: 18,
      negative_marking: 0.25,
      created_at: new Date().toISOString(),
      status: "active"
    }
  ],
  mock_test_questions: [],
  mock_test_attempts: [],
  practice_subjects: []
};

// Seed questions for local DB (corresponds to seed.sql)
const initialSeedQuestions = [
  {
    id: 1,
    subject: 'Medical Surgical Nursing',
    topic: 'Cardiovascular System',
    question: 'A patient is admitted with a diagnosis of left-sided heart failure. Which clinical manifestation should the nurse expect to find during assessment?',
    options: ["Jugular vein distention", "Dyspnea and crackles", "Splenomegaly", "Peripheral edema"],
    correct_answer: 1,
    explanation: 'Left-sided heart failure leads to pulmonary congestion. Fluid backs up into the lungs, causing dyspnea, orthopnea, cough, and crackles on auscultation. Jugular vein distention, peripheral edema, and splenomegaly are signs of right-sided heart failure due to systemic venous congestion.',
    difficulty: 'Medium',
    tags: ["cardiology", "heart failure", "assessment"],
    previous_year_indicator: 'SGPGI 2022',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    subject: 'Medical Surgical Nursing',
    topic: 'Endocrine System',
    question: 'Which of the following clinical findings is a hallmark sign of Diabetic Ketoacidosis (DKA)?',
    options: ["Bradycardia and hypertension", "Kussmaul respirations and fruity breath odor", "Profuse sweating and tremors", "Severe peripheral edema"],
    correct_answer: 1,
    explanation: 'Hallmark signs of DKA include Kussmaul respirations (rapid, deep breathing to blow off CO2 to compensate for metabolic acidosis) and a fruity breath odor (due to acetone release). Sweating and tremors are associated with hypoglycemia, not DKA.',
    difficulty: 'Easy',
    tags: ["diabetes", "DKA", "endocrine"],
    previous_year_indicator: 'AIIMS NORCET 2023',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    subject: 'Pediatric Nursing',
    topic: 'Growth & Development',
    question: 'At what age does a normal infant typically double their birth weight?',
    options: ["3 months", "6 months", "9 months", "12 months"],
    correct_answer: 1,
    explanation: 'A normal infant typically doubles their birth weight by 5 to 6 months of age and triples it by 1 year (12 months) of age.',
    difficulty: 'Easy',
    tags: ["infant growth", "pediatrics", "development"],
    previous_year_indicator: 'DSSSB 2021',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    subject: 'Pediatric Nursing',
    topic: 'Congenital Heart Defects',
    question: 'Which of the following is NOT a component of the Tetralogy of Fallot?',
    options: ["Ventricular septal defect", "Right ventricular hypertrophy", "Pulmonary stenosis", "Atrial septal defect"],
    correct_answer: 3,
    explanation: 'Tetralogy of Fallot consists of four components: 1) Pulmonary artery stenosis, 2) Ventricular septal defect (VSD), 3) Overriding aorta, and 4) Right ventricular hypertrophy. Atrial septal defect (ASD) is not part of this tetralogy.',
    difficulty: 'Hard',
    tags: ["tetralogy of fallot", "congenital defects", "pediatric cardiac"],
    previous_year_indicator: 'SGPGI 2023',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    subject: 'Obstetrics & Gynecology (OBGYN)',
    topic: 'Antenatal Care',
    question: 'Calculate the Expected Date of Delivery (EDD) using Nagele\'s rule for a pregnant woman whose Last Menstrual Period (LMP) began on October 10, 2025.',
    options: ["July 17, 2026", "July 10, 2026", "July 3, 2026", "August 17, 2026"],
    correct_answer: 0,
    explanation: 'Nagele\'s Rule formula: Add 7 days to the first day of the Last Menstrual Period (LMP), subtract 3 months, and add 1 year. So, Oct 10 + 7 days = Oct 17. Subtracting 3 months gives July 17. Adding 1 year gives July 17, 2026.',
    difficulty: 'Medium',
    tags: ["EDD calculation", "Nageles rule", "obgyn"],
    previous_year_indicator: 'SGPGI 2021',
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    subject: 'Obstetrics & Gynecology (OBGYN)',
    topic: 'Complications of Pregnancy',
    question: 'A pregnant woman at 32 weeks gestation presents with painless, bright red vaginal bleeding. The nurse should suspect which condition?',
    options: ["Abruptio placentae", "Placenta previa", "Ectopic pregnancy", "Pre-eclampsia"],
    correct_answer: 1,
    explanation: 'Painless, bright red vaginal bleeding in the second half of pregnancy is the classic sign of placenta previa. Abruptio placentae is characterized by painful, dark red vaginal bleeding and uterine rigidity.',
    difficulty: 'Medium',
    tags: ["placenta previa", "pregnancy bleeding", "obgyn"],
    previous_year_indicator: 'AIIMS NORCET 2022',
    created_at: new Date().toISOString()
  },
  {
    id: 7,
    subject: 'Fundamentals of Nursing',
    topic: 'Infection Control',
    question: 'What is the minimum duration recommended for hand washing with soap and water under running water to ensure proper hygiene?',
    options: ["5 - 10 seconds", "15 - 20 seconds", "40 - 60 seconds", "2 minutes"],
    correct_answer: 2,
    explanation: 'According to WHO, hand washing with soap and water should take 40-60 seconds total, with the actual rubbing of hands taking at least 20 seconds. An alcohol-based hand rub should take 20-30 seconds.',
    difficulty: 'Easy',
    tags: ["hand hygiene", "infection control", "nursing basics"],
    previous_year_indicator: 'ESIC 2019',
    created_at: new Date().toISOString()
  },
  {
    id: 8,
    subject: 'Fundamentals of Nursing',
    topic: 'Administration of Medications',
    question: 'Which angle of insertion is correct when administering an intramuscular (IM) injection to an adult?',
    options: ["15 degrees", "45 degrees", "90 degrees", "60 degrees"],
    correct_answer: 2,
    explanation: 'An intramuscular (IM) injection is administered at a 90-degree angle. Subcutaneous injections are given at 45 degrees (or 90 degrees if using a short needle/pinching skin), and intradermal injections are given at 10 to 15 degrees.',
    difficulty: 'Easy',
    tags: ["medication safety", "injection angles", "fundamentals"],
    previous_year_indicator: 'RRB 2019',
    created_at: new Date().toISOString()
  },
  {
    id: 9,
    subject: 'Anatomy & Physiology',
    topic: 'Endocrine System',
    question: 'Which hormone is responsible for the regulation of calcium levels in the blood by stimulating bone resorption and increasing renal absorption?',
    options: ["Calcitonin", "Parathyroid hormone (PTH)", "Thyroid hormone", "Aldosterone"],
    correct_answer: 1,
    explanation: 'Parathyroid hormone (PTH) increases blood calcium levels by stimulating osteoclast activity (bone resorption), increasing calcium reabsorption in the kidneys, and promoting active vitamin D synthesis (which increases intestinal calcium absorption). Calcitonin has the opposite effect.',
    difficulty: 'Medium',
    tags: ["endocrine", "calcium regulation", "anatomy"],
    previous_year_indicator: 'AIIMS NORCET 2021',
    created_at: new Date().toISOString()
  },
  {
    id: 10,
    subject: 'Pharmacology',
    topic: 'Cardiac Medications',
    question: 'Before administering Digoxin (Lanoxin), the nurse must check which of the following vital signs?',
    options: ["Blood pressure", "Apical pulse rate", "Respiratory rate", "Temperature"],
    correct_answer: 1,
    explanation: 'Digoxin decreases the heart rate (negative chronotropic effect). The nurse must check the apical pulse for a full 60 seconds before administering digoxin. The medication is typically withheld if the apical pulse is less than 60 beats per minute in adults.',
    difficulty: 'Easy',
    tags: ["digoxin", "apical pulse", "pharmacology"],
    previous_year_indicator: 'SGPGI 2023',
    created_at: new Date().toISOString()
  },
  {
    id: 11,
    subject: 'Nutrition',
    topic: 'Vitamins',
    question: 'Wernicke-Korsakoff syndrome is caused by a severe deficiency of which of the following vitamins?',
    options: ["Vitamin B12 (Cobalamin)", "Vitamin B1 (Thiamine)", "Vitamin B3 (Niacin)", "Vitamin C (Ascorbic acid)"],
    correct_answer: 1,
    explanation: 'Wernicke-Korsakoff syndrome is a neurological disorder caused by a severe deficiency of Vitamin B1 (Thiamine), most commonly observed in individuals with chronic alcohol abuse.',
    difficulty: 'Medium',
    tags: ["vitamins", "thiamine deficiency", "nutrition"],
    previous_year_indicator: 'DSSSB 2021',
    created_at: new Date().toISOString()
  },
  {
    id: 12,
    subject: 'Microbiology',
    topic: 'Bacteriology',
    question: 'Which staining technique is specifically used to identify Mycobacterium tuberculosis?',
    options: ["Gram staining", "Acid-fast (Ziehl-Neelsen) staining", "Negative staining", "Spore staining"],
    correct_answer: 1,
    explanation: 'Mycobacterium tuberculosis has a waxy cell wall containing mycolic acid, which makes it resistant to standard Gram staining. It is identified using Acid-Fast Staining, also known as the Ziehl-Neelsen staining technique.',
    difficulty: 'Easy',
    tags: ["microbiology", "staining", "tuberculosis"],
    previous_year_indicator: 'RRB 2020',
    created_at: new Date().toISOString()
  },
  {
    id: 13,
    subject: 'Nursing Management',
    topic: 'Leadership Styles',
    question: 'A nurse manager involves the staff in decision-making and planning unit goals. Which leadership style is this manager demonstrating?',
    options: ["Autocratic", "Democratic", "Laissez-faire", "Bureaucratic"],
    correct_answer: 1,
    explanation: 'Democratic leadership style involves sharing decision-making and goal-setting with group members, fostering collaboration and active participation.',
    difficulty: 'Easy',
    tags: ["leadership", "management", "nursing administration"],
    previous_year_indicator: 'SGPGI 2022',
    created_at: new Date().toISOString()
  },
  {
    id: 14,
    subject: 'Research & Statistics',
    topic: 'Research Methodology',
    question: 'Which type of research design is considered the gold standard for testing the efficacy of a clinical intervention?',
    options: ["Descriptive study", "Cohort study", "Randomized Controlled Trial (RCT)", "Case-control study"],
    correct_answer: 2,
    explanation: 'Randomized Controlled Trials (RCTs) are the gold standard of clinical research design due to random assignment and control groups, which minimize confounding variables and biases.',
    difficulty: 'Medium',
    tags: ["research design", "RCT", "statistics"],
    previous_year_indicator: 'AIIMS NORCET 2023',
    created_at: new Date().toISOString()
  },
  {
    id: 15,
    subject: 'General Knowledge',
    topic: 'Indian Healthcare System',
    question: 'Under the Ayushman Bharat Yojana (PM-JAY), what is the health cover provided per family per year for secondary and tertiary care hospitalization?',
    options: ["Rs. 2 Lakhs", "Rs. 3 Lakhs", "Rs. 5 Lakhs", "Rs. 10 Lakhs"],
    correct_answer: 2,
    explanation: 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY) provides a health cover of Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families.',
    difficulty: 'Easy',
    tags: ["general knowledge", "health schemes", "GK"],
    previous_year_indicator: 'SGPGI 2023',
    created_at: new Date().toISOString()
  },
  {
    id: 16,
    subject: 'General English',
    topic: 'Grammar',
    question: 'Choose the correct preposition to complete the sentence: "The nurse is responsible ___ administering medications to the patients in Ward A."',
    options: ["to", "for", "with", "at"],
    correct_answer: 1,
    explanation: 'The adjective "responsible" takes the preposition "for" when referring to tasks or duties (e.g., "responsible for administering...").',
    difficulty: 'Easy',
    tags: ["english", "preposition", "grammar"],
    previous_year_indicator: 'SGPGI 2022',
    created_at: new Date().toISOString()
  },
  {
    id: 17,
    subject: 'Reasoning',
    topic: 'Series Completion',
    question: 'Complete the series: 3, 5, 9, 17, 33, ?',
    options: ["45", "55", "65", "68"],
    correct_answer: 2,
    explanation: 'The pattern is adding successive powers of 2. 3 + 2 = 5; 5 + 4 = 9; 9 + 8 = 17; 17 + 16 = 33; 33 + 32 = 65. Alternatively, each number is (2 * previous number) - 1.',
    difficulty: 'Medium',
    tags: ["reasoning", "number series"],
    previous_year_indicator: 'SGPGI 2021',
    created_at: new Date().toISOString()
  },
  {
    id: 18,
    subject: 'Aptitude',
    topic: 'Percentage',
    question: 'If 15% of a nursing student cohort failed a pharmacology exam, and 68 students passed, what is the total number of students in the cohort?',
    options: ["80", "90", "100", "75"],
    correct_answer: 0,
    explanation: 'If 15% failed, then 85% passed. Let the total number of students be X. 0.85 * X = 68 => X = 68 / 0.85 = 80 total students.',
    difficulty: 'Medium',
    tags: ["aptitude", "percentage", "math"],
    previous_year_indicator: 'SGPGI 2022',
    created_at: new Date().toISOString()
  }
];

defaultLocalDb.questions = initialSeedQuestions;
defaultLocalDb.mock_test_questions = initialSeedQuestions.map((q, idx) => ({
  mock_test_id: 1,
  question_id: q.id,
  order_index: idx
}));

// Initialize database
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  
  // Run migrations asynchronously
  pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_id INT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic TEXT;
    
    ALTER TABLE mock_tests ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
    ALTER TABLE mock_tests ADD COLUMN IF NOT EXISTS allowed_batches TEXT;
    ALTER TABLE mock_tests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
    
    CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS practice_subjects (
        id SERIAL PRIMARY KEY,
        subject_name VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        allowed_batches TEXT
    );

    CREATE TABLE IF NOT EXISTS concepts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        highlight TEXT,
        bullets JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `).then(() => {
    console.log('Postgres migrations completed successfully.');
  }).catch(err => {
    console.error('Error running Postgres migrations:', err.message);
  });
}

function getQuestionFileKey(subject) {
  const norm = (subject || '').toLowerCase().trim();
  if (norm.includes('medical surgical') || norm.includes('med-surg')) {
    return 'Medical Surgical Nursing';
  }
  if (norm.includes('pediatric')) {
    return 'Pediatric Nursing';
  }
  if (norm.includes('obstetrics') || norm.includes('obgyn') || norm.includes('gynecology')) {
    return 'Obstetrics & Gynecology (OBGYN)';
  }
  if (norm.includes('fundamentals')) {
    return 'Fundamentals of Nursing';
  }
  if (norm.includes('anatomy') || norm.includes('physiology')) {
    return 'Anatomy & Physiology';
  }
  if (norm.includes('pharmacology')) {
    return 'Pharmacology';
  }
  return 'Other';
}

function loadLocalDb() {
  try {
    // 1. Migration check: if the old single local_db.json file exists, migrate it
    if (fs.existsSync(localDbPath)) {
      console.log('Old local_db.json found. Migrating to separated database files...');
      try {
        const oldData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        
        // Save users
        fs.writeFileSync(usersPath, JSON.stringify(oldData.users || [], null, 2));
        // Save bookmarks
        fs.writeFileSync(bookmarksPath, JSON.stringify(oldData.bookmarks || [], null, 2));
        // Save attempts
        fs.writeFileSync(attemptsPath, JSON.stringify(oldData.question_attempts || [], null, 2));
        // Save mock tests
        const mockTestData = {
          mock_tests: oldData.mock_tests || [],
          mock_test_questions: oldData.mock_test_questions || [],
          mock_test_attempts: oldData.mock_test_attempts || []
        };
        fs.writeFileSync(mockTestsPath, JSON.stringify(mockTestData, null, 2));
        
        // Save questions grouped by subject
        const groupedQuestions = {};
        Object.keys(questionFiles).forEach(key => {
          groupedQuestions[key] = [];
        });
        
        const oldQuestions = oldData.questions || [];
        oldQuestions.forEach(q => {
          const fileKey = getQuestionFileKey(q.subject);
          groupedQuestions[fileKey].push(q);
        });
        
        Object.entries(questionFiles).forEach(([key, filepath]) => {
          fs.writeFileSync(filepath, JSON.stringify(groupedQuestions[key], null, 2));
        });
        
        // Rename local_db.json to local_db.json.bak
        fs.renameSync(localDbPath, localDbPath + '.bak');
        console.log('Migration to separated database files completed successfully!');
      } catch (migrationErr) {
        console.error('Error during database migration:', migrationErr);
      }
    }

    // Helper: read and parse JSON or return default
    const readJsonOrInit = (filepath, defaultVal) => {
      if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, JSON.stringify(defaultVal, null, 2));
        return defaultVal;
      }
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    };

    // 2. Load users
    const users = readJsonOrInit(usersPath, defaultLocalDb.users);
    
    // Ensure all existing users have the verification and profile fields
    let usersUpdated = false;
    users.forEach(u => {
      if (u.is_email_verified === undefined) {
        u.is_email_verified = true; // default verified for legacy users
        u.phone = u.phone || null;
        u.country = u.country || null;
        u.address = u.address || null;
        u.security_question = u.security_question || null;
        u.security_answer = u.security_answer || null;
        u.email_verification_token = u.email_verification_token || null;
        u.batch_id = u.batch_id || null;
        usersUpdated = true;
      }
    });
    if (usersUpdated) {
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    }
    
    // 3. Load bookmarks
    const bookmarks = readJsonOrInit(bookmarksPath, defaultLocalDb.bookmarks);
    
    // 4. Load attempts
    const question_attempts = readJsonOrInit(attemptsPath, defaultLocalDb.question_attempts);
    
    // 5. Load mock tests
    const mockTestData = readJsonOrInit(mockTestsPath, {
      mock_tests: defaultLocalDb.mock_tests,
      mock_test_questions: defaultLocalDb.mock_test_questions,
      mock_test_attempts: defaultLocalDb.mock_test_attempts
    });

    // Ensure all mock tests have is_locked, allowed_batches, and status fields
    let mockTestDataUpdated = false;
    mockTestData.mock_tests.forEach(mt => {
      if (mt.is_locked === undefined) {
        mt.is_locked = false;
        mt.allowed_batches = mt.allowed_batches || null;
        mockTestDataUpdated = true;
      }
      if (mt.status === undefined) {
        mt.status = 'active';
        mockTestDataUpdated = true;
      }
    });
    if (mockTestDataUpdated) {
      fs.writeFileSync(mockTestsPath, JSON.stringify(mockTestData, null, 2));
    }

    // Load batches
    const batches = readJsonOrInit(batchesPath, []);
    
    // Load practice subjects
    const practice_subjects = readJsonOrInit(practiceSubjectsPath, []);
    
    // Load concepts
    const concepts = readJsonOrInit(conceptsPath, []);
    
    // 6. Load questions from all split files
    let questions = [];
    Object.entries(questionFiles).forEach(([key, filepath]) => {
      let qList = [];
      if (!fs.existsSync(filepath)) {
        // Filter initial seed questions by subject
        qList = initialSeedQuestions.filter(q => getQuestionFileKey(q.subject) === key);
        fs.writeFileSync(filepath, JSON.stringify(qList, null, 2));
      } else {
        qList = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      }
      questions = questions.concat(qList);
    });

    // Make sure we have questions
    if (questions.length === 0) {
      questions = initialSeedQuestions;
      // Write back to separate files
      const groupedQuestions = {};
      Object.keys(questionFiles).forEach(key => {
        groupedQuestions[key] = [];
      });
      questions.forEach(q => {
        const fileKey = getQuestionFileKey(q.subject);
        groupedQuestions[fileKey].push(q);
      });
      Object.entries(questionFiles).forEach(([key, filepath]) => {
        fs.writeFileSync(filepath, JSON.stringify(groupedQuestions[key], null, 2));
      });
    }

    return {
      users,
      questions,
      bookmarks,
      question_attempts,
      mock_tests: mockTestData.mock_tests,
      mock_test_questions: mockTestData.mock_test_questions,
      mock_test_attempts: mockTestData.mock_test_attempts,
      batches,
      practice_subjects,
      concepts
    };
  } catch (err) {
    console.error('Error loading separated local DB files, using defaults:', err);
    return defaultLocalDb;
  }
}

function saveLocalDb(data) {
  try {
    // Save users
    fs.writeFileSync(usersPath, JSON.stringify(data.users || [], null, 2));
    
    // Save bookmarks
    fs.writeFileSync(bookmarksPath, JSON.stringify(data.bookmarks || [], null, 2));
    
    // Save attempts
    fs.writeFileSync(attemptsPath, JSON.stringify(data.question_attempts || [], null, 2));
    
    // Save mock tests
    const mockTestData = {
      mock_tests: data.mock_tests || [],
      mock_test_questions: data.mock_test_questions || [],
      mock_test_attempts: data.mock_test_attempts || []
    };
    fs.writeFileSync(mockTestsPath, JSON.stringify(mockTestData, null, 2));
    
    // Save questions grouped by subject
    const groupedQuestions = {};
    Object.keys(questionFiles).forEach(key => {
      groupedQuestions[key] = [];
    });
    
    const questions = data.questions || [];
    questions.forEach(q => {
      const fileKey = getQuestionFileKey(q.subject);
      groupedQuestions[fileKey].push(q);
    });
    
    Object.entries(questionFiles).forEach(([key, filepath]) => {
      fs.writeFileSync(filepath, JSON.stringify(groupedQuestions[key], null, 2));
    });
    // Save batches
    if (data.batches) {
      fs.writeFileSync(batchesPath, JSON.stringify(data.batches || [], null, 2));
    }
    // Save practice subjects
    if (data.practice_subjects) {
      fs.writeFileSync(practiceSubjectsPath, JSON.stringify(data.practice_subjects || [], null, 2));
    }
    // Save concepts
    if (data.concepts) {
      fs.writeFileSync(conceptsPath, JSON.stringify(data.concepts || [], null, 2));
    }
  } catch (err) {
    console.error('Error saving separated local DB files:', err);
  }
}

// SQL Query simulation for the local JSON database
function simulateQuery(text, params = []) {
  const dbData = loadLocalDb();
  const normalizedSql = text.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. SELECT COUNT(*) as count FROM questions
  if (normalizedSql.startsWith('select count(*) as count from questions')) {
    return { rows: [{ count: dbData.questions.length }] };
  }

  // 2. SELECT subject, topic, COUNT(*) as q_count FROM questions GROUP BY subject, topic
  if (normalizedSql.startsWith('select subject, topic, count(*) as q_count from questions group by subject, topic')) {
    const counts = {};
    dbData.questions.forEach(q => {
      const key = `${q.subject}|||${q.topic}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const rows = Object.entries(counts).map(([key, count]) => {
      const [subject, topic] = key.split('|||');
      return { subject, topic, q_count: count };
    });
    return { rows };
  }

  // 3. SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_correct = true) as correct FROM question_attempts WHERE user_id = $1
  if (normalizedSql.includes('count(*) as total') && normalizedSql.includes('from question_attempts')) {
    const userId = params[0];
    const userAttempts = dbData.question_attempts.filter(a => a.user_id === userId);
    const correctCount = userAttempts.filter(a => a.is_correct).length;
    return { rows: [{ total: userAttempts.length, correct: correctCount }] };
  }

  // 4. SELECT COUNT(*) as rank_val FROM users WHERE xp_points > $1
  if (normalizedSql.startsWith('select count(*) as rank_val from users where xp_points >')) {
    const xp = params[0] || 0;
    const count = dbData.users.filter(u => (u.xp_points || 0) > xp).length;
    return { rows: [{ rank_val: count }] };
  }

  // 5. SELECT q.subject, COUNT(qa.id) as attempted, COUNT(qa.id) FILTER(WHERE qa.is_correct = true) as correct FROM question_attempts qa ...
  if (normalizedSql.includes('select q.subject, count(qa.id) as attempted') && normalizedSql.includes('from question_attempts')) {
    const userId = params[0];
    const userAttempts = dbData.question_attempts.filter(a => a.user_id === userId);
    
    const subjectsMap = {};
    userAttempts.forEach(attempt => {
      const q = dbData.questions.find(quest => quest.id === attempt.question_id);
      if (q) {
        if (!subjectsMap[q.subject]) {
          subjectsMap[q.subject] = { subject: q.subject, attempted: 0, correct: 0 };
        }
        subjectsMap[q.subject].attempted += 1;
        if (attempt.is_correct) {
          subjectsMap[q.subject].correct += 1;
        }
      }
    });

    return { rows: Object.values(subjectsMap) };
  }

  // 6. SELECT qa.attempted_at::date as attempt_date, qa.is_correct FROM question_attempts qa WHERE qa.user_id = $1 AND qa.attempted_at >= NOW() - INTERVAL '7 days'
  if (normalizedSql.includes('qa.attempted_at::date as attempt_date') && normalizedSql.includes('from question_attempts')) {
    const userId = params[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentAttempts = dbData.question_attempts.filter(a => {
      return a.user_id === userId && new Date(a.attempted_at) >= sevenDaysAgo;
    });

    const rows = recentAttempts.map(a => ({
      attempt_date: a.attempted_at.split('T')[0],
      is_correct: a.is_correct
    }));

    return { rows };
  }

  // 7. SELECT * FROM users WHERE email = $1
  if (normalizedSql.startsWith('select * from users where email =')) {
    const email = params[0].toLowerCase();
    const user = dbData.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [user] : [] };
  }

  // 8. SELECT * FROM users WHERE id = $1
  if (normalizedSql.includes('from users where id =')) {
    const id = params[0];
    const user = dbData.users.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }

  // 8.5 SELECT * FROM users WHERE email_verification_token = $1
  if (normalizedSql.includes('from users where email_verification_token =')) {
    const token = params[0];
    const user = dbData.users.find(u => u.email_verification_token === token);
    return { rows: user ? [user] : [] };
  }

  // 9. INSERT INTO users ...
  if (normalizedSql.startsWith('insert into users')) {
    const id = require('crypto').randomUUID();
    let newUser = {};

    // Check if detailed register with 12 parameters is executed
    if (params.length >= 12) {
      newUser = {
        id,
        name: params[0],
        email: params[1],
        password_hash: params[2],
        google_id: params[3],
        role: params[4] || 'user',
        phone: params[5],
        country: params[6],
        address: params[7],
        security_question: params[8],
        security_answer: params[9],
        is_email_verified: params[10] === true || params[10] === 'true' || params[10] === 1,
        email_verification_token: params[11],
        batch_id: params[12] ? parseInt(params[12]) : null,
        xp_points: 0,
        streak: 0,
        is_paid: false,
        last_active_date: null,
        created_at: new Date().toISOString()
      };
    } else {
      newUser = {
        id,
        name: params[0],
        email: params[1],
        password_hash: params[2],
        google_id: params[3],
        role: params[4] || 'user',
        phone: null,
        country: null,
        address: null,
        security_question: null,
        security_answer: null,
        is_email_verified: true, // Auto-verify legacy/short registrations
        email_verification_token: null,
        batch_id: null,
        xp_points: 0,
        streak: 0,
        is_paid: false,
        last_active_date: null,
        created_at: new Date().toISOString()
      };
    }

    dbData.users.push(newUser);
    saveLocalDb(dbData);
    return { rows: [newUser] };
  }

  // 10. UPDATE users SET ...
  if (normalizedSql.startsWith('update users set') || normalizedSql.includes('update users')) {
    let userId = params[params.length - 1]; // standard pattern: ID is last param
    const idx = dbData.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const isRoleUpdate = normalizedSql.includes('role =');
      const isPaidUpdate = normalizedSql.includes('is_paid =');
      const isProfileUpdate = normalizedSql.includes('name =') || normalizedSql.includes('profile_pic =');
      const isPasswordUpdate = normalizedSql.includes('password_hash =');
      const isBatchUpdate = normalizedSql.includes('batch_id =');
      const isVerificationUpdate = normalizedSql.includes('is_email_verified =');
      
      if (isRoleUpdate) {
        const roleVal = params[0];
        dbData.users[idx].role = roleVal;
      } else if (isPaidUpdate) {
        const paidVal = params[0] === true || params[0] === 'true' || params[0] === 1;
        dbData.users[idx].is_paid = paidVal;
      } else if (isBatchUpdate) {
        const batchVal = params[0] === null ? null : parseInt(params[0]);
        dbData.users[idx].batch_id = batchVal;
      } else if (isVerificationUpdate) {
        const verifiedVal = params[0] === true || params[0] === 'true' || params[0] === 1;
        dbData.users[idx].is_email_verified = verifiedVal;
        if (verifiedVal) {
          dbData.users[idx].email_verification_token = null;
        }
      } else if (isProfileUpdate) {
        const nameVal = params[0];
        const profilePicVal = params[1];
        if (nameVal) dbData.users[idx].name = nameVal;
        if (profilePicVal !== undefined) dbData.users[idx].profile_pic = profilePicVal;
      } else if (isPasswordUpdate) {
        const passHash = params[0];
        dbData.users[idx].password_hash = passHash;
      } else {
        let xp = params[0];
        let streak = params[1];
        let lastActive = params[2];
        if (typeof xp === 'number') dbData.users[idx].xp_points = xp;
        if (typeof streak === 'number') dbData.users[idx].streak = streak;
        if (lastActive) dbData.users[idx].last_active_date = lastActive;
      }
      saveLocalDb(dbData);
      return { rows: [dbData.users[idx]] };
    }
    return { rows: [] };
  }

  // 11. SELECT * FROM questions WHERE id = $1
  if (normalizedSql.startsWith('select * from questions where id =') || normalizedSql.startsWith('select id from questions where id =')) {
    const id = parseInt(params[0]);
    const question = dbData.questions.find(q => q.id === id);
    return { rows: question ? [question] : [] };
  }

  // 12. SELECT * FROM questions
  if (normalizedSql.startsWith('select * from questions')) {
    let list = [...dbData.questions];
    // Simple filter simulation
    if (normalizedSql.includes('subject =')) {
      const subParam = params[0];
      list = list.filter(q => q.subject.toLowerCase() === subParam.toLowerCase());
    }
    if (normalizedSql.includes('id not in')) {
      const userId = normalizedSql.includes('subject =') ? params[1] : params[0];
      const attemptedIds = dbData.question_attempts.filter(a => a.user_id === userId).map(a => a.question_id);
      list = list.filter(q => !attemptedIds.includes(q.id));
    }
    if (normalizedSql.includes('limit 3')) {
      list = list.slice(0, 3);
    }
    return { rows: list };
  }

  // 13. INSERT INTO questions
  if (normalizedSql.startsWith('insert into questions')) {
    const subject = params[0];
    const topic = params[1];
    const question = params[2];
    const options = typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3];
    const correct_answer = parseInt(params[4]);
    const explanation = params[5];
    const difficulty = params[6];
    const tags = Array.isArray(params[7]) ? params[7] : [];
    const previous_year_indicator = params[8] || null;

    const newId = dbData.questions.length > 0 ? Math.max(...dbData.questions.map(q => q.id)) + 1 : 1;
    const newQuestion = {
      id: newId,
      subject,
      topic,
      question,
      options,
      correct_answer,
      explanation,
      difficulty,
      tags,
      previous_year_indicator,
      created_at: new Date().toISOString()
    };
    dbData.questions.push(newQuestion);
    saveLocalDb(dbData);
    return { rows: [newQuestion] };
  }

  // 14. UPDATE questions SET ...
  if (normalizedSql.startsWith('update questions')) {
    const id = parseInt(params[params.length - 1]);
    const idx = dbData.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      dbData.questions[idx].subject = params[0];
      dbData.questions[idx].topic = params[1];
      dbData.questions[idx].question = params[2];
      dbData.questions[idx].options = typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3];
      dbData.questions[idx].correct_answer = parseInt(params[4]);
      dbData.questions[idx].explanation = params[5];
      dbData.questions[idx].difficulty = params[6];
      dbData.questions[idx].tags = Array.isArray(params[7]) ? params[7] : [];
      dbData.questions[idx].previous_year_indicator = params[8];
      saveLocalDb(dbData);
      return { rows: [dbData.questions[idx]] };
    }
    return { rows: [] };
  }

  // 15. SELECT * FROM bookmarks
  if (normalizedSql.includes('from bookmarks') || normalizedSql.includes('join bookmarks')) {
    const userId = params[0];
    if (normalizedSql.includes('question_id =')) {
      const qId = parseInt(params[1]);
      const bookmark = dbData.bookmarks.find(b => b.user_id === userId && b.question_id === qId);
      return { rows: bookmark ? [bookmark] : [] };
    }
    const userBookmarks = dbData.bookmarks.filter(b => b.user_id === userId);
    const bookmarkedQuestions = dbData.questions.filter(q => userBookmarks.some(b => b.question_id === q.id));
    return { rows: bookmarkedQuestions };
  }

  // 16. INSERT INTO bookmarks
  if (normalizedSql.startsWith('insert into bookmarks')) {
    const user_id = params[0];
    const question_id = parseInt(params[1]);
    const exists = dbData.bookmarks.some(b => b.user_id === user_id && b.question_id === question_id);
    if (!exists) {
      dbData.bookmarks.push({ user_id, question_id, created_at: new Date().toISOString() });
      saveLocalDb(dbData);
    }
    return { rows: [{ user_id, question_id }] };
  }

  // 17. DELETE FROM bookmarks
  if (normalizedSql.startsWith('delete from bookmarks')) {
    const user_id = params[0];
    const question_id = parseInt(params[1]);
    dbData.bookmarks = dbData.bookmarks.filter(b => !(b.user_id === user_id && b.question_id === question_id));
    saveLocalDb(dbData);
    return { rowCount: 1 };
  }

  // 18. INSERT INTO question_attempts
  if (normalizedSql.startsWith('insert into question_attempts')) {
    const user_id = params[0];
    const question_id = parseInt(params[1]);
    const chosen_option = parseInt(params[2]);
    const is_correct = params[3];
    const confidence_rating = parseInt(params[4]);

    const newAttempt = {
      id: dbData.question_attempts.length + 1,
      user_id,
      question_id,
      chosen_option,
      is_correct,
      confidence_rating,
      attempted_at: new Date().toISOString()
    };
    dbData.question_attempts.push(newAttempt);
    saveLocalDb(dbData);
    return { rows: [newAttempt] };
  }

  // 19. SELECT * FROM question_attempts WHERE user_id = $1
  if (normalizedSql.includes('from question_attempts')) {
    const userId = params[0];
    let userAttempts = dbData.question_attempts.filter(a => a.user_id === userId);
    if (normalizedSql.includes('question_id =')) {
      const qId = parseInt(params[1]);
      userAttempts = userAttempts.filter(a => a.question_id === qId);
    }
    // Handle ORDER BY attempted_at DESC LIMIT 1
    if (normalizedSql.includes('order by attempted_at desc')) {
      userAttempts.sort((a, b) => new Date(b.attempted_at) - new Date(a.attempted_at));
    }
    if (normalizedSql.includes('limit 1')) {
      userAttempts = userAttempts.slice(0, 1);
    }
    return { rows: userAttempts };
  }

  // 20. SELECT * FROM mock_tests
  if (normalizedSql.startsWith('select * from mock_tests')) {
    if (normalizedSql.includes('where id =')) {
      const id = parseInt(params[0]);
      const mock = dbData.mock_tests.find(m => m.id === id);
      return { rows: mock ? [mock] : [] };
    }
    return { rows: dbData.mock_tests };
  }

  // 21. INSERT INTO mock_tests
  if (normalizedSql.startsWith('insert into mock_tests')) {
    const title = params[0];
    const duration = parseInt(params[1]);
    const total = parseInt(params[2]);
    const neg = parseFloat(params[3] || 0.25);
    const status = params[4] || 'active';
    const newId = dbData.mock_tests.length + 1;
    const newMock = {
      id: newId,
      title,
      duration_minutes: duration,
      total_questions: total,
      negative_marking: neg,
      created_at: new Date().toISOString(),
      is_locked: false,
      allowed_batches: null,
      status
    };
    dbData.mock_tests.push(newMock);
    saveLocalDb(dbData);
    return { rows: [newMock] };
  }

  // 22. INSERT INTO mock_test_questions
  if (normalizedSql.startsWith('insert into mock_test_questions')) {
    const mock_test_id = parseInt(params[0]);
    const question_id = parseInt(params[1]);
    const order_idx = parseInt(params[2]);
    dbData.mock_test_questions.push({ mock_test_id, question_id, order_index: order_idx });
    saveLocalDb(dbData);
    return { rows: [{ mock_test_id, question_id }] };
  }

  // SELECT COUNT(*) as count FROM mock_test_questions WHERE mock_test_id = $1
  if (normalizedSql.startsWith('select count(*) as count from mock_test_questions')) {
    const mockId = parseInt(params[0]);
    const mappings = dbData.mock_test_questions.filter(mq => mq.mock_test_id === mockId);
    return { rows: [{ count: mappings.length }] };
  }

  // 23. GET questions for a mock test
  if (normalizedSql.includes('mock_test_questions') && (normalizedSql.includes('join') || normalizedSql.includes('questions'))) {
    const mockId = parseInt(params[0]);
    const mappings = dbData.mock_test_questions.filter(mq => mq.mock_test_id === mockId);
    const mockQIds = mappings.map(mq => mq.question_id);
    const qList = dbData.questions.filter(q => mockQIds.includes(q.id));
    
    const hasCorrectAnswer = normalizedSql.includes('correct_answer') || normalizedSql.includes('explanation');
    const rows = qList.map(q => {
      if (hasCorrectAnswer) {
        return q;
      }
      const { correct_answer, explanation, ...rest } = q;
      return rest;
    });
    return { rows };
  }

  // 24. INSERT INTO mock_test_attempts
  if (normalizedSql.startsWith('insert into mock_test_attempts')) {
    const user_id = params[0];
    const mock_test_id = parseInt(params[1]);
    const score = parseFloat(params[2]);
    const total_attempted = parseInt(params[3]);
    const correct_count = parseInt(params[4]);
    const incorrect_count = parseInt(params[5]);
    const time_taken_seconds = parseInt(params[6]);

    const newAttempt = {
      id: dbData.mock_test_attempts.length + 1,
      user_id,
      mock_test_id,
      score,
      total_attempted,
      correct_count,
      incorrect_count,
      time_taken_seconds,
      attempted_at: new Date().toISOString()
    };
    dbData.mock_test_attempts.push(newAttempt);
    saveLocalDb(dbData);
    return { rows: [newAttempt] };
  }

  // 25. SELECT * FROM mock_test_attempts WHERE user_id = $1
  if (normalizedSql.includes('from mock_test_attempts')) {
    const userId = params[0];
    const attempts = dbData.mock_test_attempts.filter(a => a.user_id === userId);
    return { rows: attempts };
  }

  // 26. Leaderboard query: SELECT * FROM users ORDER BY xp_points DESC
  if (normalizedSql.includes('from users order by xp_points desc')) {
    const list = [...dbData.users].sort((a, b) => b.xp_points - a.xp_points).slice(0, 10);
    return { rows: list };
  }

  // 27. DELETE FROM mock_tests WHERE id = $1
  if (normalizedSql.startsWith('delete from mock_tests')) {
    const id = parseInt(params[0]);
    dbData.mock_tests = (dbData.mock_tests || []).filter(m => m.id !== id);
    dbData.mock_test_questions = (dbData.mock_test_questions || []).filter(mq => mq.mock_test_id !== id);
    saveLocalDb(dbData);
    return { rows: [{ id }] };
  }

  // 28. UPDATE mock_tests SET title = $1 ...
  if (normalizedSql.startsWith('update mock_tests set') || normalizedSql.includes('update mock_tests')) {
    const id = parseInt(params[params.length - 1]);
    const idx = dbData.mock_tests.findIndex(m => m.id === id);
    if (idx !== -1) {
      dbData.mock_tests[idx].title = params[0];
      dbData.mock_tests[idx].duration_minutes = parseInt(params[1]);
      dbData.mock_tests[idx].negative_marking = parseFloat(params[2]);
      dbData.mock_tests[idx].is_locked = params[3] === true || params[3] === 'true' || params[3] === 1;
      dbData.mock_tests[idx].allowed_batches = params[4] || null;
      if (params.length >= 7) {
        dbData.mock_tests[idx].status = params[5] || 'active';
      }
      saveLocalDb(dbData);
      return { rows: [dbData.mock_tests[idx]] };
    }
    return { rows: [] };
  }

  // 29. SELECT * FROM batches
  if (normalizedSql.startsWith('select * from batches')) {
    return { rows: dbData.batches || [] };
  }

  // 30. INSERT INTO batches
  if (normalizedSql.startsWith('insert into batches')) {
    const name = params[0];
    const newId = (dbData.batches || []).length > 0 ? Math.max(...dbData.batches.map(b => b.id)) + 1 : 1;
    const newBatch = {
      id: newId,
      name,
      created_at: new Date().toISOString()
    };
    if (!dbData.batches) dbData.batches = [];
    dbData.batches.push(newBatch);
    saveLocalDb(dbData);
    return { rows: [newBatch] };
  }

  // 31. SELECT * FROM users (All candidates table list)
  if (normalizedSql.startsWith('select * from users') && !normalizedSql.includes('where')) {
    return { rows: dbData.users };
  }

  // SELECT * FROM practice_subjects
  if (normalizedSql.startsWith('select * from practice_subjects')) {
    return { rows: dbData.practice_subjects || [] };
  }

  // INSERT INTO practice_subjects (subject_name, status, allowed_batches) VALUES ($1, $2, $3)
  if (normalizedSql.startsWith('insert into practice_subjects')) {
    const subject_name = params[0];
    const status = params[1] || 'active';
    const allowed_batches = params[2] || null;
    
    if (!dbData.practice_subjects) dbData.practice_subjects = [];
    
    const existingIdx = dbData.practice_subjects.findIndex(ps => ps.subject_name === subject_name);
    if (existingIdx !== -1) {
      dbData.practice_subjects[existingIdx].status = status;
      dbData.practice_subjects[existingIdx].allowed_batches = allowed_batches;
      saveLocalDb(dbData);
      return { rows: [dbData.practice_subjects[existingIdx]] };
    }
    
    const newId = dbData.practice_subjects.length + 1;
    const newSubject = {
      id: newId,
      subject_name,
      status,
      allowed_batches
    };
    dbData.practice_subjects.push(newSubject);
    saveLocalDb(dbData);
    return { rows: [newSubject] };
  }

  // UPDATE practice_subjects SET status = $1, allowed_batches = $2 WHERE subject_name = $3
  if (normalizedSql.startsWith('update practice_subjects set') || normalizedSql.includes('update practice_subjects')) {
    const status = params[0];
    const allowed_batches = params[1] || null;
    const subject_name = params[2];
    
    if (!dbData.practice_subjects) dbData.practice_subjects = [];
    
    const idx = dbData.practice_subjects.findIndex(ps => ps.subject_name === subject_name);
    if (idx !== -1) {
      dbData.practice_subjects[idx].status = status;
      dbData.practice_subjects[idx].allowed_batches = allowed_batches;
      saveLocalDb(dbData);
      return { rows: [dbData.practice_subjects[idx]] };
    }
    return { rows: [] };
  }

  // SELECT * FROM concepts
  if (normalizedSql.startsWith('select * from concepts')) {
    if (!dbData.concepts) dbData.concepts = [];
    const sorted = [...dbData.concepts].sort((a, b) => a.id - b.id);
    return { rows: sorted };
  }

  // INSERT INTO concepts (title, category, highlight, bullets) VALUES ($1, $2, $3, $4) RETURNING *
  if (normalizedSql.startsWith('insert into concepts')) {
    if (!dbData.concepts) dbData.concepts = [];
    const nextId = dbData.concepts.length > 0 ? Math.max(...dbData.concepts.map(c => c.id)) + 1 : 1;
    let bulletsVal = params[3];
    if (typeof bulletsVal === 'string') {
      try { bulletsVal = JSON.parse(bulletsVal); } catch(e) {}
    }
    const newConcept = {
      id: nextId,
      title: params[0],
      category: params[1],
      highlight: params[2],
      bullets: bulletsVal || [],
      created_at: new Date().toISOString()
    };
    dbData.concepts.push(newConcept);
    saveLocalDb(dbData);
    return { rows: [newConcept] };
  }

  // UPDATE concepts SET title = $1, category = $2, highlight = $3, bullets = $4 WHERE id = $5 RETURNING *
  if (normalizedSql.startsWith('update concepts')) {
    if (!dbData.concepts) dbData.concepts = [];
    const id = parseInt(params[4]);
    const idx = dbData.concepts.findIndex(c => c.id === id);
    if (idx !== -1) {
      let bulletsVal = params[3];
      if (typeof bulletsVal === 'string') {
        try { bulletsVal = JSON.parse(bulletsVal); } catch(e) {}
      }
      dbData.concepts[idx] = {
        ...dbData.concepts[idx],
        title: params[0],
        category: params[1],
        highlight: params[2],
        bullets: bulletsVal || []
      };
      saveLocalDb(dbData);
      return { rows: [dbData.concepts[idx]] };
    }
    return { rows: [] };
  }

  // DELETE FROM concepts WHERE id = $1
  if (normalizedSql.startsWith('delete from concepts where id =')) {
    if (!dbData.concepts) dbData.concepts = [];
    const id = parseInt(params[0]);
    dbData.concepts = dbData.concepts.filter(c => c.id !== id);
    saveLocalDb(dbData);
    return { rows: [] };
  }

  // TRUNCATE TABLE concepts / DELETE FROM concepts (clear all for bulk upload)
  if (normalizedSql.startsWith('truncate table concepts') || (normalizedSql.startsWith('delete from concepts') && !normalizedSql.includes('where'))) {
    dbData.concepts = [];
    saveLocalDb(dbData);
    return { rows: [] };
  }

  // Default return empty array
  return { rows: [] };
}

// Seeding admin user helper for PostgreSQL
async function seedPostgresAdmin() {
  try {
    const adminEmail = 's.rajinder321@gmail.com';
    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    if (checkUser.rows.length === 0) {
      console.log('Seeding PostgreSQL admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('#@!Raji#@!1', salt);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, google_id, role, xp_points, streak, is_paid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        ['Rajinder Singh (Admin)', adminEmail, password_hash, null, 'admin', 500, 1, true]
      );
      console.log('PostgreSQL admin user seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding PostgreSQL admin user:', err.message);
  }
}

// Seeding admin user helper for Local JSON fallback DB
async function seedLocalDbAdmin(dbData) {
  try {
    const adminEmail = 's.rajinder321@gmail.com';
    const hasAdmin = dbData.users.some(u => u.email.toLowerCase() === adminEmail.toLowerCase());
    if (!hasAdmin) {
      console.log('Seeding Local JSON admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('#@!Raji#@!1', salt);
      dbData.users.push({
        id: require('crypto').randomUUID(),
        name: 'Rajinder Singh (Admin)',
        email: adminEmail,
        password_hash,
        google_id: null,
        role: 'admin',
        xp_points: 500,
        streak: 1,
        is_paid: true,
        last_active_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      });
      saveLocalDb(dbData);
      console.log('Local JSON admin user seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding local JSON admin user:', err);
  }
}

// Check database connection and switch to fallback if necessary
async function checkConnection() {
  if (pool) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('Successfully connected to PostgreSQL database!');
      useLocalDb = false;
      await seedPostgresAdmin();
    } catch (err) {
      console.warn('PostgreSQL connection failed. Falling back to local JSON database.');
      console.warn('Error details:', err.message);
      useLocalDb = true;
      const dbData = loadLocalDb(); // Ensure local DB directory exists
      await seedLocalDbAdmin(dbData);
    }
  } else {
    console.log('No DATABASE_URL provided. Operating in local JSON fallback mode.');
    useLocalDb = true;
    const dbData = loadLocalDb();
    await seedLocalDbAdmin(dbData);
  }
}

// Exportable query function
async function query(text, params) {
  if (useLocalDb) {
    return simulateQuery(text, params);
  } else {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error('PostgreSQL query error, attempting local fallback execution:', error.message);
      // Try resolving on mock database as fallback during temporary outages
      return simulateQuery(text, params);
    }
  }
}

// Initial connection check
checkConnection();

module.exports = {
  query,
  isUsingLocalDb: () => useLocalDb,
  getLocalDbPath: () => usersPath
};
