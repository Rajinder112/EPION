const db = require('./db');

const papersData = [
  // ==================== PAPER 1 ====================
  {
    paperTitle: "SGPGI 2026 Mock Practice Paper - 01",
    questions: [
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Cardiology (Post-CABG)',
        question: 'A patient in the ICU post-CABG surgery has a Pulmonary Artery Wedge Pressure (PAWP) reading of 22 mmHg, a blood pressure of 88/54 mmHg, and bilateral crackles on auscultation. What is the most likely pathological state?',
        options: ['Hypovolemic Shock', 'Cardiogenic Shock', 'Septic Shock', 'Neurogenic Shock'],
        correct_answer: 1,
        explanation: 'Normal PAWP ranges from 6 to 12 mmHg. An elevated PAWP (> 18-20 mmHg) combined with systemic hypotension and pulmonary congestion (crackles) points directly to left ventricular failure and cardiogenic shock. Hypovolemic shock would present with a low PAWP.',
        difficulty: 'Hard',
        tags: ['CABG', 'PAWP', 'cardiogenic shock', 'ICU'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Critical Care (Ventilator)',
        question: 'While monitoring a patient on a mechanical ventilator in Synchronized Intermittent Mandatory Ventilation (SIMV) mode, the low tidal volume alarm sounds. The nurse notes that the patient is agitated and the ventilator tubing is disconnected from the tracheostomy tube. What is the immediate priority action?',
        options: [
          'Reconnect the ventilator tubing to the patient\'s tracheostomy tube',
          'Assess the patient’s oxygen saturation using a pulse oximeter',
          'Call the respiratory therapist to check the ventilator circuit settings',
          'Manually ventilate the patient with an Ambu bag connected to 100% O2'
        ],
        correct_answer: 0,
        explanation: 'The immediate threat is a total lack of ventilation due to circuit disconnection. Reconnecting the tubing instantly fixes the root problem. If the patient remains distressed or the equipment is faulty, manual ventilation with an Ambu bag becomes the next step.',
        difficulty: 'Medium',
        tags: ['ventilator', 'SIMV', 'tracheostomy', 'ICU'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pharmacology',
        topic: 'Seizure Management',
        question: 'A nurse is preparing to administer an intravenous dose of Phenytoin (Dilantin) to a patient with active seizures. Which solution should the nurse use to prime the IV line to prevent drug precipitation?',
        options: ['5% Dextrose in Water (D5W)', 'Ringer\'s Lactate (RL)', '0.9% Normal Saline (NS)', '0.45% Half-Normal Saline'],
        correct_answer: 2,
        explanation: 'Phenytoin is highly incompatible with dextrose solutions, which cause it to precipitate immediately in the line. It must only be mixed or co-administered with 0.9% Normal Saline.',
        difficulty: 'Medium',
        tags: ['phenytoin', 'IV priming', 'seizures'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Gastrointestinal (Pancreatitis)',
        question: 'A patient with severe acute pancreatitis displays bluish discoloration around the flank region. How should the nurse accurately document this specific physical assessment finding?',
        options: ['Cullen\'s sign', 'Grey Turner\'s sign', 'Kehr\'s sign', 'Homans\' sign'],
        correct_answer: 1,
        explanation: 'Grey Turner\'s sign is ecchymosis of the flanks, indicating retroperitoneal hemorrhage from pancreatic necrosis. Cullen\'s sign represents periumbilical bruising.',
        difficulty: 'Easy',
        tags: ['pancreatitis', 'Grey Turners sign', 'assessment'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pediatric Nursing',
        topic: 'Neurology (Lumbar Puncture)',
        question: 'While preparing a 3-year-old child for a lumbar puncture, which anatomical site should the nurse expect the healthcare provider to use to safely avoid spinal cord injury?',
        options: ['Between L1 and L2', 'Between L2 and L3', 'Between L4 and L5', 'Between T12 and L1'],
        correct_answer: 2,
        explanation: 'In children, the spinal cord terminates lower down the vertebral column (around L2–L3) than in adults (around L1). Inserting the needle between L4–L5 or L5–S1 prevents direct spinal cord trauma.',
        difficulty: 'Medium',
        tags: ['lumbar puncture', 'pediatrics', 'anatomy'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Obstetrics & Gynecology (OBGYN)',
        topic: 'Pregnancy Complications (Preeclampsia)',
        question: 'A multigravida at 32 weeks gestation is admitted with severe preeclampsia. The physician orders a continuous intravenous infusion of Magnesium Sulfate (MgSO4). Which assessment parameter serves as the earliest indicator of magnesium toxicity?',
        options: [
          'Decreased urine output below 30 mL/hour',
          'Loss of deep tendon reflexes (patellar reflex)',
          'Respiratory rate dropping below 10 breaths/minute',
          'Serum magnesium level reaching 4 mEq/L'
        ],
        correct_answer: 1,
        explanation: 'Neuromuscular blockade occurs early as magnesium levels rise. The loss of deep tendon reflexes occurs at serum levels of 7–10 mEq/L, serving as a reliable early warning before life-threatening respiratory depression (< 12/min) develops at levels > 12 mEq/L.',
        difficulty: 'Hard',
        tags: ['magnesium sulfate', 'toxicity', 'preeclampsia', 'reflexes'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Mental Health Nursing',
        topic: 'Pharmacotherapy Side Effects',
        question: 'A patient with schizophrenia who is taking Chlorpromazine develops a permanent adverse effect characterized by involuntary lip-smacking, tongue protrusion, and choreiform movements of the limbs. What is this condition?',
        options: ['Akathisia', 'Tardive Dyskinesia', 'Pseudoparkinsonism', 'Acute Dystonia'],
        correct_answer: 1,
        explanation: 'Tardive Dyskinesia is a late-onset, frequently irreversible extrapyramidal side effect (EPS) caused by long-term dopamine receptor blockade from typical antipsychotics.',
        difficulty: 'Medium',
        tags: ['chlorpromazine', 'tardive dyskinesia', 'antipsychotic', 'EPS'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Fundamentals of Nursing',
        topic: 'Infection Control (Biomedical Waste)',
        question: 'According to the National Biomedical Waste Management guidelines, into which color-coded waste bag should a nurse discard a used, un-emptied blood bag?',
        options: ['Red bag', 'Yellow bag', 'Blue cardboard box', 'White translucent container'],
        correct_answer: 1,
        explanation: 'Human blood, blood products, and soiled items contaminated with blood are classified as infectious anatomical/biomedical waste and must be disposed of in a Yellow bag for incineration.',
        difficulty: 'Easy',
        tags: ['biomedical waste', 'blood bag', 'infection control'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Community Health Nursing',
        topic: 'Immunization (Cold Chain)',
        question: 'During a home health visit, the nurse reviews the vaccination chart of an infant. Which vaccine must be maintained strictly at the coldest temperature in the freezing compartment of a cold chain system?',
        options: ['Hepatitis B vaccine', 'DPT vaccine', 'Oral Polio Vaccine (OPV)', 'Tetanus Toxoid'],
        correct_answer: 2,
        explanation: 'OPV is highly heat-sensitive and must be stored in the freezer compartment at -20°C. Vaccines like DPT, Hep B, and Tetanus are freeze-sensitive and should be kept in the refrigerator compartment (+2°C to +8°C); freezing destroys their potency.',
        difficulty: 'Medium',
        tags: ['cold chain', 'OPV', 'vaccines', 'immunization'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Cardiology (ECG)',
        question: 'A patient presents to the emergency room with a crushing chest pain radiating down the left arm. The ECG reveals ST-segment elevation in leads II, III, and aVF. Which region of the myocardium is affected?',
        options: ['Anterior wall MI', 'Lateral wall MI', 'Inferior wall MI', 'Septal wall MI'],
        correct_answer: 2,
        explanation: 'ST elevations in leads II, III, and aVF correspond directly to an inferior wall myocardial infarction, typically involving tissue supplied by the Right Coronary Artery (RCA).',
        difficulty: 'Medium',
        tags: ['ECG', 'inferior wall MI', 'cardiology'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Percentage',
        question: 'A hospital nursing superintendent notes that 30% of the beds in a 450-bed specialty ward are currently vacant. What is the total number of occupied beds in this ward?',
        options: ['135', '315', '270', '350'],
        correct_answer: 1,
        explanation: 'If 30% are vacant, then 100% - 30% = 70% are occupied. Occupied beds = 70 / 100 * 450 = 315.',
        difficulty: 'Easy',
        tags: ['math', 'percentage', 'beds'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Ratio and Proportion',
        question: 'The ratio of patients in the OPD to IPD on a given Monday was 5:2. If there were 250 patients in the OPD, find the number of patients admitted to the IPD.',
        options: ['100', '50', '125', '75'],
        correct_answer: 0,
        explanation: 'OPD units = 5. So, 5x = 250 => x = 50. IPD patients = 2x = 2 * 50 = 100.',
        difficulty: 'Easy',
        tags: ['math', 'ratio', 'OPD'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Indian Constitution',
        question: 'Which Article of the Indian Constitution empowers the President to declare a Financial Emergency if the financial stability of India is threatened?',
        options: ['Article 352', 'Article 356', 'Article 360', 'Article 370'],
        correct_answer: 2,
        explanation: 'Article 360 deals with Financial Emergency, Article 352 governs National Emergency, and Article 356 governs State Emergency (President’s Rule).',
        difficulty: 'Medium',
        tags: ['GK', 'emergency', 'constitution'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Healthcare Schemes',
        question: 'The flagship healthcare scheme of India, Ayushman Bharat PM-JAY, was officially launched by Prime Minister Narendra Modi in which year?',
        options: ['2015', '2018', '2020', '2022'],
        correct_answer: 1,
        explanation: 'Ayushman Bharat PM-JAY was launched on September 23, 2018, from Ranchi, Jharkhand, aiming to provide health cover up to ₹5 lakh per family per year.',
        difficulty: 'Easy',
        tags: ['GK', 'PMJAY', 'schemes'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Subject-Verb Agreement',
        question: 'Identify the part of the sentence that contains a grammatical error: "The team of neurosurgeons were preparing for a complex operation when the power supply failed."',
        options: ['The team of neurosurgeons', 'were preparing for', 'a complex operation', 'when the power supply failed'],
        correct_answer: 1,
        explanation: 'The true subject of the sentence is "The team," which is singular. Therefore, the helping verb must also be singular ("was preparing," not "were preparing").',
        difficulty: 'Medium',
        tags: ['english', 'grammar', 'subject-verb'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Synonyms',
        question: 'Select the word that is closest in meaning (synonym) to the medical term: PROGNOSIS',
        options: ['Diagnosis', 'Forecast', 'Etiology', 'Pathogenesis'],
        correct_answer: 1,
        explanation: 'Prognosis refers to predicting the likely course and outcome of a disease medical condition, making "forecast" the correct synonym.',
        difficulty: 'Easy',
        tags: ['english', 'vocabulary', 'synonyms'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Analogies',
        question: 'Complete the missing term in the sequence: Bradycardia : Heart :: Bradypnea : ___',
        options: ['Kidneys', 'Lungs', 'Liver', 'Brain'],
        correct_answer: 1,
        explanation: 'Bradycardia is an abnormally slow heart rate, directly involving the heart. Bradypnea is an abnormally slow respiratory rate, directly involving the lungs.',
        difficulty: 'Easy',
        tags: ['reasoning', 'analogy'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Coding-Decoding',
        question: 'If the term BLOOD is coded as EORrg in an examination room cipher, how will the word VEIN be written?',
        options: ['YHLQ', 'YGLM', 'XFKP', 'ZIMR'],
        correct_answer: 0,
        explanation: 'The letters are shifted forward by 3 positions (B+3=E, L+3=O, etc.). Shifting VEIN forward by 3 letters gives: V+3=Y, E+3=H, I+3=L, N+3=Q.',
        difficulty: 'Medium',
        tags: ['reasoning', 'coding'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      }
    ]
  },
  // ==================== PAPER 2 ====================
  {
    paperTitle: "SGPGI 2026 Mock Practice Paper - 02",
    questions: [
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Electrolytes (Hyperkalemia)',
        question: 'A patient with a severe crush injury to both lower limbs is admitted to the emergency department. The nurse notes tall, peaked T waves and a widened QRS complex on the telemetry monitor. Which laboratory level requires immediate verification?',
        options: ['Serum Calcium', 'Serum Sodium', 'Serum Potassium', 'Serum Magnesium'],
        correct_answer: 2,
        explanation: 'Tissue crushing causes massive intracellular potassium release into the bloodstream. Peaked T waves, prolonged PR intervals, and a widening QRS complex are classic cardiac manifestations of hyperkalemia (> 5.0 mEq/L), risking ventricular fibrillation if left untreated.',
        difficulty: 'Medium',
        tags: ['hyperkalemia', 'crush injury', 'electrolytes', 'potassium'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Neurology (Cushing\'s Triad)',
        question: 'While assessing a patient with increased intracranial pressure (ICP) following a motor vehicle accident, the nurse notes a blood pressure of 190/60 mmHg, a pulse rate of 48 beats/minute, and an irregular respiratory pattern. What is this clinical triad called?',
        options: ['Beck\'s Triad', 'Virchow\'s Triad', 'Cushing\'s Triad', 'Whipple\'s Triad'],
        correct_answer: 2,
        explanation: 'Cushing\'s Triad consists of systolic hypertension (with a widened pulse pressure), bradycardia, and irregular respirations (Bradypnea). It represents a late sign of brainstem compression from increased ICP.',
        difficulty: 'Easy',
        tags: ['Cushings triad', 'ICP', 'neurology'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pediatric Nursing',
        topic: 'Growth & Development (Milestones)',
        question: 'A nurse is evaluating a 9-month-old infant in the pediatric outpatient clinic. Which fine motor developmental milestone should the nurse expect the child to have successfully achieved?',
        options: [
          'Building a tower of six blocks',
          'Using a neat pincer grasp to pick up small objects',
          'Transferring objects from one hand to another',
          'Drinking completely from a cup without spilling'
        ],
        correct_answer: 1,
        explanation: 'A crude pincer grasp develops around 8–9 months, refining into a neat pincer grasp by 10–11 months. Transferring objects happens around 7 months, while building block towers occurs well into toddlerhood (15–18 months).',
        difficulty: 'Medium',
        tags: ['milestones', 'pincer grasp', 'pediatrics'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Obstetrics & Gynecology (OBGYN)',
        topic: 'Pregnancy Complications (Abruption)',
        question: 'A pregnant woman at 34 weeks gestation is diagnosed with a total abruptio placentae. Which characteristic clinical presentation should the nurse expect to find during assessment?',
        options: [
          'Painless, bright red vaginal bleeding with a soft uterus',
          'Painful, dark red vaginal bleeding with a rigid, board-like abdomen',
          'Intermittent painless contractions without vaginal bleeding',
          'Profuse watery vaginal discharge with a dilated cervix'
        ],
        correct_answer: 1,
        explanation: 'Abruptio placentae is the premature separation of the placenta from the uterine wall. It causes retroplacental bleeding, leading to severe uterine pain and a characteristic rigid, board-like abdomen due to blood infiltrating the myometrium.',
        difficulty: 'Medium',
        tags: ['abruptio placentae', 'bleeding', 'obgyn'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Mental Health Nursing',
        topic: 'Pharmacotherapy Side Effects (MAOIs)',
        question: 'A psychiatric nurse is caring for a patient with severe depression who has been prescribed Phenelzine, a Monoamine Oxidase Inhibitor (MAOI). The nurse instructs the patient to strictly avoid which food item to prevent a hypertensive crisis?',
        options: ['Fresh green leafy vegetables', 'Canned citrus fruit juices', 'Aged cheddar cheese and red wine', 'Refined white flour bread products'],
        correct_answer: 2,
        explanation: 'Foods rich in tyramine (aged cheeses, cured meats, red wine, fermented products) must be completely avoided when taking MAOIs. MAOIs block tyramine breakdown, allowing it to enter the systemic circulation and cause a massive release of norepinephrine, triggering a life-threatening hypertensive crisis.',
        difficulty: 'Hard',
        tags: ['MAOIs', 'phenelzine', 'tyramine', 'hypertensive crisis'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Wound Care (Evisceration)',
        question: 'The nurse is caring for a patient who returned from an abdominal surgery 2 hours ago. The patient reports a sudden "popping" sensation after coughing, and the nurse notes that surgical loops of the bowel are visible through the opened incision. What is the immediate priority nursing action?',
        options: [
          'Apply a tight abdominal binder to hold the organs in place',
          'Cover the protruding organs with sterile dressings soaked in warm normal saline',
          'Use sterile gloved hands to gently push the organs back into the abdominal cavity',
          'Place the patient in a high-Fowler\'s position to assist breathing'
        ],
        correct_answer: 1,
        explanation: 'This represents an emergency evisceration. Protruding abdominal contents must be kept moist with sterile, warm normal saline dressings to prevent tissue drying and necrosis. Never push organs back inside or apply pressure, and keep the patient flat with knees flexed to lower abdominal wall tension.',
        difficulty: 'Hard',
        tags: ['evisceration', 'surgery', 'complications'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pharmacology',
        topic: 'Emergency Medications (Seizures)',
        question: 'What is the drug of choice for managing an active, prolonged generalized tonic-clonic seizure in a patient in status epilepticus?',
        options: ['Lorazepam IV', 'Phenytoin IV', 'Phenobarbital IM', 'Valproic Acid PO'],
        correct_answer: 0,
        explanation: 'Intravenous benzodiazepines (Lorazepam or Diazepam) are the first-line treatments for status epilepticus due to their rapid onset of action in enhancing GABA-mediated inhibition in the brain. Phenytoin is given afterward for long-term seizure maintenance.',
        difficulty: 'Easy',
        tags: ['status epilepticus', 'lorazepam', 'seizures'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Acid-Base Balances (ABG)',
        question: 'A nurse is documenting a patient\'s arterial blood gas (ABG) values: pH 7.50, PaCO2 30 mmHg, and HCO3- 24 mEq/L. How should this status be interpreted?',
        options: [
          'Uncompensated Metabolic Alkalosis',
          'Uncompensated Respiratory Alkalosis',
          'Partially Compensated Respiratory Acidosis',
          'Fully Compensated Metabolic Acidosis'
        ],
        correct_answer: 1,
        explanation: 'The pH is high (> 7.45), indicating alkalosis. The PaCO2 is low (< 35 mmHg), matching the direction of the alkalotic pH and pointing to a respiratory cause. The HCO3- is normal, meaning no metabolic compensation has taken place.',
        difficulty: 'Medium',
        tags: ['ABG', 'respiratory alkalosis', 'acid-base'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Hemodynamic Monitoring (CVP)',
        question: 'While monitoring a central venous pressure (CVP) line, the nurse notes a reading of 1 cm H2O. Which primary fluid modification should the nurse expect the physician to order?',
        options: [
          'Restrict intravenous fluids to 50 mL/hour',
          'Administer a rapid bolus of isotonic crystalloid solutions',
          'Infuse 20% Mannitol over 30 minutes',
          'Start an immediate continuous infusion of Furosemide'
        ],
        correct_answer: 1,
        explanation: 'Normal CVP ranges from 5 to 10 cm H2O (or 2–6 mmHg). A very low reading indicates hypovolemia, requiring fluid resuscitation to restore adequate preload and venous return.',
        difficulty: 'Medium',
        tags: ['CVP', 'hypovolemia', 'fluid resuscitation'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Fundamentals of Nursing',
        topic: 'Advanced Life Support (CPR)',
        question: 'Under the current national standard guidelines for Cardiopulmonary Resuscitation (CPR), what is the correct chest compression depth and rate when resuscitating an adult patient?',
        options: [
          'Depth: 1.5 inches; Rate: 80–100/minute',
          'Depth: 2.0 to 2.4 inches; Rate: 100–120/minute',
          'Depth: 3.0 inches; Rate: 130–150/minute',
          'Depth: 1.0 inch; Rate: 90/minute'
        ],
        correct_answer: 1,
        explanation: 'Standard ACLS/BLS guidelines mandate adult chest compressions at a depth of 2 to 2.4 inches (5-6 cm) and a rapid rate of 100–120 beats per minute to optimize coronary artery perfusion.',
        difficulty: 'Easy',
        tags: ['CPR', 'cardiac arrest', 'resuscitation'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Dosage Flow Rates',
        question: 'A nurse needs to administer 1,000 mL of Normal Saline over 8 hours. The drop factor of the IV administration set is 15 drops/mL. Calculate the correct flow rate in drops per minute.',
        options: ['21 drops/minute', '31 drops/minute', '42 drops/minute', '50 drops/minute'],
        correct_answer: 1,
        explanation: 'Flow Rate = (Volume * Drop Factor) / Time in minutes. Flow Rate = (1000 * 15) / (8 * 60) = 15000 / 480 ≈ 31.25 drops/min.',
        difficulty: 'Medium',
        tags: ['math', 'flow rate', 'IV drops'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Unitary Method',
        question: 'If the cost of 12 boxes of surgical sterile gloves is ₹3,600, what will be the total price of 7 boxes of the same gloves?',
        options: ['₹2,100', '₹1,800', '₹2,400', '₹1,500'],
        correct_answer: 0,
        explanation: 'Cost of one box = 3600 / 12 = 300. Cost of 7 boxes = 7 * 300 = ₹2,100.',
        difficulty: 'Easy',
        tags: ['math', 'unitary method', 'gloves'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Indian Government Structure',
        question: 'Who is recognized as the ex-officio Chairman of the NITI Aayog in India?',
        options: ['The President of India', 'The Prime Minister of India', 'The Union Finance Minister', 'The Union Health Minister'],
        correct_answer: 1,
        explanation: 'The National Institution for Transforming India (NITI Aayog) was established in 2015 to replace the Planning Commission, with the Prime Minister serving as its ex-officio Chairman.',
        difficulty: 'Easy',
        tags: ['GK', 'NITI Aayog'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'National Health Schemes',
        question: 'The central government health scheme "Mission Indradhanush" focuses primarily on achieving high national coverage in which health area?',
        options: [
          'Maternal Nutrition',
          'Full Immunization for Children and Pregnant Women',
          'Free Distribution of Iron Tablets',
          'Rural Sanitation Infrastructure'
        ],
        correct_answer: 1,
        explanation: 'Mission Indradhanush was launched to ensure full vaccination coverage for children up to two years of age and pregnant women against vaccine-preventable diseases.',
        difficulty: 'Easy',
        tags: ['GK', 'immunization', 'Mission Indradhanush'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Prepositions',
        question: 'Select the most appropriate preposition to complete the sentence: "The recovery room nurse was placed ___ charge of the pediatric emergency division."',
        options: ['at', 'in', 'under', 'with'],
        correct_answer: 1,
        explanation: '"In charge of" is the standard idiomatic English prepositional phrase used to denote responsibility or leadership over an area.',
        difficulty: 'Easy',
        tags: ['english', 'prepositions'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Antonyms',
        question: 'What is the correct antonym for the word: CHRONIC',
        options: ['Acute', 'Persistent', 'Prolonged', 'Latent'],
        correct_answer: 0,
        explanation: 'Chronic describes long-term, slow-progressing conditions, while acute describes sudden-onset, short-duration events, making them direct antonyms.',
        difficulty: 'Easy',
        tags: ['english', 'vocabulary', 'antonyms'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Classification',
        question: 'Find the odd one out from the provided list of medical terms:',
        options: ['Arteries', 'Veins', 'Capillaries', 'Alveoli'],
        correct_answer: 3,
        explanation: 'Arteries, veins, and capillaries are structural components of the vascular/circulatory system, whereas alveoli belong to the respiratory system.',
        difficulty: 'Easy',
        tags: ['reasoning', 'odd one out'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Number Series',
        question: 'Complete the number pattern logic: 5, 11, 23, 47, ___',
        options: ['95', '98', '102', '85'],
        correct_answer: 0,
        explanation: 'The underlying mathematical progression multiplies the previous number by 2 and adds 1. 47 * 2 + 1 = 95.',
        difficulty: 'Easy',
        tags: ['reasoning', 'number series'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      }
    ]
  },
  // ==================== PAPER 3 ====================
  {
    paperTitle: "SGPGI 2026 Mock Practice Paper - 03",
    questions: [
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Critical Care (Chest Tube)',
        question: 'A patient in the emergency unit has a chest tube placed for a large pneumothorax. While turning the patient, the connection breaks, cracking the drainage unit. What is the immediate priority nursing action?',
        options: [
          'Clamp the chest tube close to the patient\'s chest wall using a padded hemostat',
          'Submerge the distal end of the chest tube 2 cm into a bottle of sterile water',
          'Cover the insertion site with an occlusive vaseline gauze dressing',
          'Stripping the chest tube vigorously to clear potential clots'
        ],
        correct_answer: 1,
        explanation: 'Submerging the open end of the tube 2 cm into sterile water or saline creates a temporary water seal, preventing atmospheric air from entering the pleural space and causing a tension pneumothorax. Clamping the tube should be avoided as it can cause air entrapment and worsen a pneumothorax.',
        difficulty: 'Hard',
        tags: ['chest tube', 'water seal', 'pneumothorax'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pediatric Nursing',
        topic: 'Gastrointestinal (Pyloric Stenosis)',
        question: 'An infant is diagnosed with congenital pyloric stenosis. Which hallmark clinical sign should the nurse expect to find during the intake assessment?',
        options: [
          'Malodorous ribbon-like stools',
          'Projectile, non-bilious vomiting immediately after feeding',
          'Severe abdominal distension with greenish emesis',
          'Chronic loose watery diarrhea mixed with mucus'
        ],
        correct_answer: 1,
        explanation: 'Hypertrophy of the pyloric sphincter mechanical blocks gastric emptying, leading to forceful, projectile, non-bilious vomiting after feeding. Ribbon-like stools point to Hirschsprung\'s disease.',
        difficulty: 'Easy',
        tags: ['pyloric stenosis', 'projectile vomiting', 'pediatrics'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Fundamentals of Nursing',
        topic: 'Invasive Procedures (NG Tube)',
        question: 'A nurse is preparing to insert a nasogastric (NG) tube. Which landmark measurement sequence is correct for estimating the proper insertion depth?',
        options: [
          'From the tip of the nose to the umbilicus',
          'From the tip of the nose to the earlobe, then down to the xiphoid process',
          'From the mouth directly to the stomach margin',
          'From the bridge of the nose to the sternal notch, then to the pubis'
        ],
        correct_answer: 1,
        explanation: 'This NEX (Nose-Earlobe-Xiphoid) measurement sequence provides an accurate estimate of the anatomical distance needed to reach the stomach lumen in adult patients.',
        difficulty: 'Easy',
        tags: ['NG tube', 'NEX measurement', 'fundamentals'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Infectious Diseases (Tuberculosis)',
        question: 'Which diagnostic test serves as the gold standard for verifying the definitive eradication of Mycobacterium tuberculosis in a patient completing therapy?',
        options: ['Serial Chest X-ray clearing', 'Sputum culture conversion to negative', 'Mantoux skin test induration decrease', 'Disappearance of a morning fever'],
        correct_answer: 1,
        explanation: 'While a clear chest X-ray indicates improvement, a negative sputum culture is the gold standard for confirming that viable bacilli have been eradicated from the lungs.',
        difficulty: 'Medium',
        tags: ['tuberculosis', 'sputum culture', 'diagnostic'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Hemodynamic Monitoring (Transducer)',
        question: 'A clinical instructor asks a student nurse to identify the specific anatomical location of the phlebostatic axis used to calibrate pressure transducers for invasive hemodynamic monitoring. What is the correct location?',
        options: [
          'Second intercostal space, right sternal border',
          'Fourth intercostal space, mid-axillary line',
          'Fifth intercostal space, mid-clavicular line',
          'Third intercostal space, anterior axillary line'
        ],
        correct_answer: 1,
        explanation: 'The phlebostatic axis represents the theoretical location of the right atrium, found at the intersection of the fourth intercostal space and the mid-axillary line. Aligning the transducer here avoids hydrostatic errors in blood pressure readings.',
        difficulty: 'Hard',
        tags: ['phlebostatic axis', 'hemodynamics', 'monitoring'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Endocrine (DKA)',
        question: 'A patient with type 1 diabetes mellitus presents with a blood glucose level of 450 mg/dL, positive serum ketones, and deep, rapid, sighing respirations. How should the nurse accurately document this respiratory pattern?',
        options: ['Cheyne-Stokes respirations', 'Kussmaul respirations', 'Biot\'s respirations', 'Apneustic breathing'],
        correct_answer: 1,
        explanation: 'Kussmaul respirations are deep, rapid, sighing breaths that represent a compensatory mechanism to blow off carbon dioxide (CO2) and mitigate metabolic acidosis in Diabetic Ketoacidosis (DKA).',
        difficulty: 'Easy',
        tags: ['DKA', 'Kussmaul', 'respiratory'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pharmacology',
        topic: 'Gastrointestinal (Hepatic Encephalopathy)',
        question: 'What is the specific therapeutic mechanism of action of Lactulose when administered to a patient with advanced hepatic cirrhosis and hepatic encephalopathy?',
        options: [
          'Accelerates glycogen synthesis in the liver cells',
          'Converts systemic ammonia into ammonium in the colon for excretion',
          'Directly decreases portal vein hypertension',
          'Protects gastric mucosa from active bleeding'
        ],
        correct_answer: 1,
        explanation: 'Lactulose lowers colonic pH, converting diffusible ammonia (NH3) into non-absorbable ammonium ions (NH4+), which are trapped in the bowel and excreted via its laxative effect, lowering blood ammonia levels.',
        difficulty: 'Medium',
        tags: ['lactulose', 'hepatic encephalopathy', 'ammonia'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pharmacology',
        topic: 'Safety (Potassium IV)',
        question: 'A nurse is documenting a patient\'s potassium level as 2.8 mEq/L. The physician orders intravenous Potassium Chloride (KCl). Which method of administration is strictly prohibited?',
        options: [
          'Intravenous piggyback via an infusion pump over 2 hours',
          'Direct intravenous push injection',
          'Diluted in 500 mL of Normal Saline over 4 hours',
          'Administered via a central venous catheter'
        ],
        correct_answer: 1,
        explanation: 'Administering Potassium Chloride via direct IV push causes immediate, lethal cardiac arrest. It must always be diluted and infused slowly via a pump, with a maximum concentration of 40 mEq/L and a rate not exceeding 10 mEq/hour.',
        difficulty: 'Easy',
        tags: ['potassium chloride', 'IV push', 'safety'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Cardiology (Beck\'s Triad)',
        question: 'Which classic physical assessment triad indicates the presence of cardiac tamponade, requiring immediate needle pericardiocentesis?',
        options: [
          'Bradycardia, Hypertension, Irregular Breathing',
          'Jugular Venous Distension, Muffled Heart Sounds, Hypotension',
          'Tachycardia, Splenomegaly, Systolic Murmur',
          'Widened Pulse Pressure, Fever, Bilateral Crackles'
        ],
        correct_answer: 1,
        explanation: 'This clinical triad is known as Beck\'s Triad. Fluid accumulation in the pericardial sac restricts ventricular filling, leading to jugular venous distension, distant or muffled heart sounds, and a drop in systemic blood pressure.',
        difficulty: 'Medium',
        tags: ['cardiac tamponade', 'Becks triad', 'cardiology'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pediatric Nursing',
        topic: 'Growth & Development (Theories)',
        question: 'According to Erikson’s stages of psychosocial development, what is the primary developmental task for an adolescent patient aged 12 to 18 years?',
        options: ['Autonomy vs. Shame and Doubt', 'Industry vs. Inferiority', 'Identity vs. Role Confusion', 'Intimacy vs. Isolation'],
        correct_answer: 2,
        explanation: 'Adolescents focus on developing a sense of self and personal identity. Failure to navigate this stage results in role confusion. Industry vs. Inferiority applies to school-aged children (6–12 years).',
        difficulty: 'Easy',
        tags: ['Erikson', 'adolescence', 'milestones'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Drug Calculation',
        question: 'A patient is prescribed 0.125 mg of Digoxin orally. The pharmacy dispenses Digoxin tablets labeled 250 micrograms per tablet. How many tablets should the nurse administer?',
        options: ['0.5 tablet', '1 tablet', '2 tablets', '1.5 tablets'],
        correct_answer: 0,
        explanation: '0.125 mg = 125 mcg. Dose = Desired / Have = 125 / 250 = 0.5 tablet.',
        difficulty: 'Easy',
        tags: ['math', 'drug calculation', 'digoxin'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Average Weight',
        question: 'The average weight of 5 neonatal infants in an ICU nursery is 2.4 kg. If a sixth infant weighing 3.6 kg is added to the nursery group, what is the new average weight of the infants?',
        options: ['2.6 kg', '2.8 kg', '3.0 kg', '2.5 kg'],
        correct_answer: 0,
        explanation: 'Sum of 5 = 5 * 2.4 = 12 kg. New Sum = 12 + 3.6 = 15.6 kg. New Average = 15.6 / 6 = 2.6 kg.',
        difficulty: 'Medium',
        tags: ['math', 'average', 'infants'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Indian Constitution Leaders',
        question: 'Who was the chief architect and is widely revered as the "Father of the Indian Constitution"?',
        options: ['Mahatma Gandhi', 'Dr. B.R. Ambedkar', 'Jawaharlal Nehru', 'Dr. Rajendra Prasad'],
        correct_answer: 1,
        explanation: 'Dr. Bhimrao Ramji Ambedkar served as the Chairman of the Drafting Committee for the Constitution of India and played a key role in its creation.',
        difficulty: 'Easy',
        tags: ['GK', 'constitution', 'Ambedkar'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Global Health Organizations',
        question: 'The specialized global international organization UNICEF focuses its humanitarian programs primarily on which population?',
        options: ['Industrial Labors', 'Children and Mothers', 'Military Veterans', 'Agricultural Farmers'],
        correct_answer: 1,
        explanation: 'UNICEF (United Nations International Children\'s Emergency Fund) is a UN agency dedicated to providing humanitarian and developmental aid to children and mothers worldwide.',
        difficulty: 'Easy',
        tags: ['GK', 'UNICEF', 'child health'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Spelling',
        question: 'Select the correctly spelled word from the options below:',
        options: ['Amniscentis', 'Amniocentesis', 'Amniocentisis', 'Amniocenteces'],
        correct_answer: 1,
        explanation: 'Amniocentesis is the correct medical spelling for the transabdominal aspiration of amniotic fluid for diagnostic analysis.',
        difficulty: 'Medium',
        tags: ['english', 'spelling'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Prepositions',
        question: 'Complete the sentence: "The nurse administrator was proud ___ the clinical achievements of her unit."',
        options: ['by', 'of', 'at', 'with'],
        correct_answer: 1,
        explanation: '"Proud of" is the correct grammatical prepositional pairing in English.',
        difficulty: 'Easy',
        tags: ['english', 'prepositions'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Analogies (Organs)',
        question: 'Select the word that best completes the analogy: Lungs : Pleura :: Heart : ___',
        options: ['Endocardium', 'Myocardium', 'Pericardium', 'Mediastinum'],
        correct_answer: 2,
        explanation: 'The pleura is the protective serous membrane surrounding the lungs. The pericardium is the corresponding protective sac enclosing the heart.',
        difficulty: 'Easy',
        tags: ['reasoning', 'analogy'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Direction Sense',
        question: 'If a nurse walks 10 meters East from the nursing station, turns left and walks 5 meters, which direction is she facing relative to her starting point?',
        options: ['North-East', 'North-West', 'South-East', 'North'],
        correct_answer: 0,
        explanation: 'Moving East and then North places the nurse North-East of her original starting coordinates.',
        difficulty: 'Medium',
        tags: ['reasoning', 'direction'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      }
    ]
  },
  // ==================== PAPER 4 ====================
  {
    paperTitle: "SGPGI 2026 Mock Practice Paper - 04",
    questions: [
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Renal (Osteodystrophy)',
        question: 'A patient with chronic kidney disease (CKD) on maintenance hemodialysis is at risk for developing severe osteodystrophy. Which reciprocal electrolyte pattern typical of renal failure drives this bone pathology?',
        options: [
          'Hypercalcemia and Hypophosphatemia',
          'Hypocalcemia and Hyperphosphatemia',
          'Hyponatremia and Hyperkalemia',
          'Hypokalemia and Hypomagnesemia'
        ],
        correct_answer: 1,
        explanation: 'In renal failure, failing kidneys cannot excrete phosphorus, leading to hyperphosphatemia. High phosphorus binds calcium, worsening hypocalcemia. This hypocalcemia triggers chronic parathyroid hormone (PTH) secretion, causing bone resorption (osteodystrophy).',
        difficulty: 'Hard',
        tags: ['CKD', 'osteodystrophy', 'phosphorus', 'calcium'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Nursing Management',
        topic: 'Quality (Sentinel Events)',
        question: 'While monitoring a multi-hospital database for quality metrics, a nurse administrator reviews indicators of "Sentinel Events." Which clinical occurrence meets the criteria for a sentinel event?',
        options: [
          'A patient experiencing a minor rash after receiving a scheduled antibiotic',
          'An inpatient attempting to leave the unit against medical advice',
          'Surgery performed on the wrong limb of a patient',
          'A delay of 30 minutes in delivering a routine morning diet tray'
        ],
        correct_answer: 2,
        explanation: 'A sentinel event is an unexpected occurrence involving death or serious physical or psychological injury, or the risk thereof. Wrong-site surgery is a classic example of a preventable sentinel event.',
        difficulty: 'Medium',
        tags: ['sentinel event', 'quality', 'management'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pediatric Nursing',
        topic: 'Neonatology (APGAR Score)',
        question: 'A neonate born at 39 weeks gestation is undergoing APGAR scoring. At 1 minute post-birth, the infant has a heart rate of 110 bpm, a weak cry with hypoventilation, some flexion of the extremities, grimacing upon suctioning, and a pink body with blue extremities. What is the calculated APGAR score?',
        options: ['5', '6', '7', '8'],
        correct_answer: 1,
        explanation: 'Heart rate > 100 = 2; Respiratory effort (weak/irregular) = 1; Muscle tone (some flexion) = 1; Reflex irritability (grimace) = 1; Color (acrocyanosis) = 1. Total score = 2 + 1 + 1 + 1 + 1 = 6.',
        difficulty: 'Easy',
        tags: ['APGAR', 'newborn', 'neonates'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Mental Health Nursing',
        topic: 'Paranoid Disorders',
        question: 'A patient is admitted to the psychiatric unit with severe paranoid delusions, stating that the hospital food is poisoned. Which nursing intervention is most effective for managing this behavior during initial meal times?',
        options: [
          'Tasting the food in front of the patient to prove its safety',
          'Providing pre-packaged, sealed food containers or individually wrapped items',
          'Telling the patient that their thoughts are irrational and completely false',
          'Restricting food access until the patient complies out of hunger'
        ],
        correct_answer: 1,
        explanation: 'Providing sealed or pre-packaged foods helps reduce the patient\'s anxiety and suspicion without directly validating or confronting the delusion, ensuring adequate nutritional intake.',
        difficulty: 'Medium',
        tags: ['delusions', 'paranoia', 'interventions'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Fundamentals of Nursing',
        topic: 'Safety (Transmission Precautions)',
        question: 'Under the standard transmission-based precaution guidelines, which personal protective equipment (PPE) combination is required when entering the room of a patient with active pulmonary tuberculosis?',
        options: [
          'Surgical mask, gloves, and protective gown',
          'N95 particulate respirator mask and hand hygiene',
          'Face shield, sterile gloves, and shoe covers',
          'Standard paper mask and protective goggles'
        ],
        correct_answer: 1,
        explanation: 'Tuberculosis is transmitted via small airborne droplet nuclei (< 5 microns). Airborne precautions require the use of a fit-tested N95 respirator and a negative-pressure isolation room.',
        difficulty: 'Easy',
        tags: ['PPE', 'tuberculosis', 'airborne precautions'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Trauma (Fat Embolism)',
        question: 'A patient with an open femur fracture is at risk for fat embolism syndrome. Which triad of clinical manifestations should the nurse monitor for?',
        options: [
          'Hematuria, Bradycardia, Hypothermia',
          'Respiratory distress, Neurological changes, and Petechial rash',
          'Jaundice, Abdominal rigidity, Hypertension',
          'Splenomegaly, Peripheral edema, Joint stiffness'
        ],
        correct_answer: 1,
        explanation: 'Fat embolism syndrome typically occurs 24–72 hours after long bone fractures. Fat globules enter the circulation, obstructing microvessels and causing respiratory distress, altered mental status, and a classic petechial rash across the chest and neck.',
        difficulty: 'Medium',
        tags: ['fat embolism', 'fractures', 'orthopedics'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Renal (Diagnostics)',
        question: 'A nurse is preparing a patient for an intravenous pyelogram (IVP). Which baseline laboratory parameter must be verified before administering the intravenous contrast dye?',
        options: ['Serum Amylase', 'Serum Creatinine', 'Total Bilirubin', 'Platelet Count'],
        correct_answer: 1,
        explanation: 'Intravenous contrast media can be nephrotoxic, risking contrast-induced nephropathy. Verifying baseline serum creatinine ensures the kidneys have adequate clearance capacity before contrast administration.',
        difficulty: 'Easy',
        tags: ['IVP', 'contrast dye', 'creatinine', 'renal'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Obstetrics & Gynecology (OBGYN)',
        topic: 'Placenta Previa bleeding',
        question: 'A multigravida patient at 36 weeks gestation has been diagnosed with a total placenta previa. She calls the clinic reporting mild spotting. What instruction should the nurse prioritize?',
        options: [
          'Come to the emergency department immediately and avoid any vaginal contact',
          'Perform a self-vaginal exam to assess cervical dilation',
          'Take an aspirin and rest in a prone position for 2 hours',
          'Increase ambulation to encourage fetal descent'
        ],
        correct_answer: 0,
        explanation: 'Any vaginal manipulation or contact can disrupt a low-lying placenta, triggering severe maternal hemorrhage. Immediate evaluation at the hospital is required.',
        difficulty: 'Medium',
        tags: ['placenta previa', 'bleeding', 'obgyn'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Mental Health Nursing',
        topic: 'Somatic Treatments (ECT)',
        question: 'Which medication is classified as a short-acting muscle relaxant and is routinely administered before Electroconvulsive Therapy (ECT) to prevent musculoskeletal injuries?',
        options: ['Atropine Sulfate', 'Succinylcholine', 'Diazepam', 'Haloperidol'],
        correct_answer: 1,
        explanation: 'Succinylcholine is a depolarizing neuromuscular blocker given during ECT to paralyze skeletal muscles, preventing fractures and severe muscle strain during the induced seizure. Atropine is given beforehand to dry secretions and prevent bradycardia.',
        difficulty: 'Medium',
        tags: ['ECT', 'succinylcholine', 'muscle relaxant'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Research & Statistics',
        topic: 'Measurement Scales',
        question: 'A clinical trial protocol requires the collection of ordinal data. Which parameter is an example of an ordinal scale of measurement?',
        options: [
          'Patient’s exact body temperature in Celsius',
          'Blood pressure readings in mmHg',
          'Pain intensity rating on a scale of Mild, Moderate, or Severe',
          'Patient\'s national health registration number'
        ],
        correct_answer: 2,
        explanation: 'Ordinal data involves categories that can be logically ranked or ordered (e.g., Mild < Moderate < Severe), but the mathematical distance between categories is not fixed.',
        difficulty: 'Medium',
        tags: ['research', 'ordinal scale', 'statistics'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Percentage increase',
        question: 'A nurse manager is preparing a budget report. The department\'s expenditure increased from ₹40,000 to ₹50,000. Calculate the percentage increase in expenditure.',
        options: ['20%', '25%', '10%', '30%'],
        correct_answer: 1,
        explanation: 'Increase = 10,000. Percentage Increase = (10,000 / 40,000) * 100 = 25%.',
        difficulty: 'Easy',
        tags: ['math', 'percentage', 'budget'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Profit and Loss',
        question: 'By selling a medical diagnostic machine for ₹18,000, a vendor incurs a loss of 10%. What was the original cost price of the machine?',
        options: ['₹20,000', '₹19,800', '₹22,000', '₹21,000'],
        correct_answer: 0,
        explanation: 'Selling Price = Cost Price * (100% - Loss%). 18000 = CP * 0.90 => CP = 18000 / 0.90 = ₹20,000.',
        difficulty: 'Medium',
        tags: ['math', 'loss', 'cost price'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'National Societies leadership',
        question: 'Who serves as the ex-officio President of the Indian Red Cross Society?',
        options: ['The Prime Minister of India', 'The President of India', 'The Union Health Minister', 'The Director General of Health Services'],
        correct_answer: 1,
        explanation: 'The President of India serves as the ex-officio President of the Indian Red Cross Society, while the Union Health Minister acts as its Chairman.',
        difficulty: 'Medium',
        tags: ['GK', 'Red Cross', 'leadership'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Maternal health schemes',
        question: 'The central government scheme "Janani Suraksha Yojana" (JSY) is aimed primarily at reducing maternal and neonatal mortality by encouraging which practice?',
        options: [
          'Home deliveries by untrained relatives',
          'Institutional deliveries in healthcare facilities',
          'Free supply of infant milk formulations',
          'Electronic registration of marriages'
        ],
        correct_answer: 1,
        explanation: 'JSY is a 100% centrally sponsored scheme under the National Health Mission (NHM) that provides cash incentives to eligible pregnant women to promote institutional delivery and reduce maternal-neonatal mortality.',
        difficulty: 'Easy',
        tags: ['GK', 'JSY', 'maternal health'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Medical Terminology Definitions',
        question: 'Give a one-word substitution for: "A physician who specializes in the treatment of mental health disorders and can prescribe medications."',
        options: ['Psychologist', 'Psychiatrist', 'Neurologist', 'Pathologist'],
        correct_answer: 1,
        explanation: 'A psychiatrist is a medical doctor (MD) specializing in mental health who has the legal authority to prescribe pharmacotherapy, unlike a psychologist.',
        difficulty: 'Easy',
        tags: ['english', 'definitions'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Vocabulary',
        question: 'Fill in the blank with the appropriate word: "The intensive care unit environment must be kept completely ___ to safeguard vulnerable post-op patients."',
        options: ['Sterile', 'Polluted', 'Chaotic', 'Antiseptic'],
        correct_answer: 0,
        explanation: '"Sterile" is the grammatically and clinically appropriate adjective to describe an environment completely free of viable microorganisms.',
        difficulty: 'Easy',
        tags: ['english', 'vocabulary'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Letter Series',
        question: 'Complete the missing term in the alphabet sequence: A, C, F, J, ___',
        options: ['L', 'M', 'O', 'P'],
        correct_answer: 2,
        explanation: 'The skips between letters increase: +1, +2, +3, +4. J + 4 = O.',
        difficulty: 'Medium',
        tags: ['reasoning', 'letter series'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Syllogism',
        question: 'Statement: "All critical care units require high hand hygiene compliance."\nConclusion: "Some areas with low compliance are not critical care units."\nBased on the statement, is this conclusion logically valid?',
        options: ['Yes, it follows logically', 'No, it contradicts the statement', 'The data is insufficient to determine', 'None of the above'],
        correct_answer: 0,
        explanation: 'If all critical care units require high compliance, any unit with low compliance cannot be a critical care unit, making the conclusion logically valid.',
        difficulty: 'Medium',
        tags: ['reasoning', 'logic'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      }
    ]
  },
  // ==================== PAPER 5 ====================
  {
    paperTitle: "SGPGI 2026 Mock Practice Paper - 05",
    questions: [
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Cardiology (DVT)',
        question: 'A patient with a suspected deep vein thrombosis (DVT) is admitted to the ward. While inspecting the leg, a junior nurse attempts to forcibly dorsiflex the patient\'s foot. A senior nurse stops this action immediately. Why is this maneuver contraindicated?',
        options: [
          'It causes severe permanent damage to the ankle joint',
          'It can dislodge the thrombus, potentially causing a pulmonary embolism',
          'It falsely lowers the calculated clinical clotting factor scores',
          'It alters local arterial pulses, invalidating subsequent Doppler studies'
        ],
        correct_answer: 1,
        explanation: 'Eliciting Homans\' sign (forcible dorsiflexion) carries a risk of dislodging a clot from the deep veins of the leg into the systemic circulation, where it can travel to the lungs and cause a fatal pulmonary embolism.',
        difficulty: 'Medium',
        tags: ['DVT', 'Homans sign', 'pulmonary embolism'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Critical Care (Ventilator Alarms)',
        question: 'While managing a patient on a mechanical ventilator, the high-pressure alarm sounds. After ruling out patient coughing and biting on the tube, the nurse auscultates coarse crackles and notes thick secretions in the ET tube. What is the priority nursing action?',
        options: [
          'Immediately lower the respiratory rate setting on the ventilator control panel',
          'Perform endotracheal suctioning after pre-oxygenating with 100% O2',
          'Administer an immediate dose of an intravenous loop diuretic',
          'Disconnect the circuit and manually bag the patient with room air'
        ],
        correct_answer: 1,
        explanation: 'Secretion accumulation increases airway resistance, triggering the high-pressure alarm. Targeted suctioning resolves the obstruction. Pre-oxygenation prevents suction-induced hypoxia.',
        difficulty: 'Medium',
        tags: ['ventilator', 'high pressure alarm', 'suctioning'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pediatric Nursing',
        topic: 'Gastrointestinal (Intussusception)',
        question: 'An infant is admitted with suspected intussusception. Which classic stool characteristics should the nurse expect to find during assessment?',
        options: [
          'Hard, dry marble-like stools',
          'Stools resembling currant jelly, mixed with blood and mucus',
          'Large, pale, frothy greasy stools',
          'Thin, clay-colored pale stools'
        ],
        correct_answer: 1,
        explanation: 'Intussusception involves the telescoping of one bowel segment into another, obstructing venous return. This leads to mucosal swelling and hemorrhage, which mixes with mucus to produce characteristic currant jelly stools.',
        difficulty: 'Easy',
        tags: ['intussusception', 'currant jelly', 'pediatrics'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Gastrointestinal (Liver Biopsy)',
        question: 'A patient with severe hepatic cirrhosis is scheduled for a percutaneous liver biopsy. In which position should the nurse place the patient immediately following the procedure to minimize the risk of internal bleeding?',
        options: [
          'Left lateral position with a pillow behind the back',
          'Flat supine with the head of the bed elevated 45 degrees',
          'Right side-lying (lateral) position with a rolled towel under the puncture site',
          'Prone position with a small sandbag under the abdomen'
        ],
        correct_answer: 2,
        explanation: 'Positioning the patient on their right side uses their own body weight to apply continuous pressure to the liver capsule puncture site, helping prevent internal hemorrhage.',
        difficulty: 'Medium',
        tags: ['liver biopsy', 'patient positioning', 'cirrhosis'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Medical Surgical Nursing',
        topic: 'Acid-Base (Metabolic Acidosis)',
        question: 'A nurse is reviewing a patient\'s arterial blood gas (ABG) values: pH 7.28, PaCO2 38 mmHg, and HCO3- 18 mEq/L. How should this metabolic imbalance be interpreted?',
        options: [
          'Uncompensated Respiratory Acidosis',
          'Uncompensated Metabolic Acidosis',
          'Fully Compensated Metabolic Alkalosis',
          'Partially Compensated Respiratory Alkalosis'
        ],
        correct_answer: 1,
        explanation: 'The pH is acidotic (< 7.35). The HCO3- is low (< 22 mEq/L), matching the acidosis and indicating a metabolic cause. The PaCO2 is within the normal range (35–45 mmHg), showing that respiratory compensation has not yet occurred.',
        difficulty: 'Medium',
        tags: ['ABG', 'metabolic acidosis', 'interpretation'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Obstetrics & Gynecology (OBGYN)',
        topic: 'Pregnancy Complications (Abruption bleeding)',
        question: 'A multigravida at 34 weeks gestation presents to the emergency unit with sudden-onset, painful, dark red vaginal bleeding. The nurse notes that the abdomen feels rigid and board-like upon palpation. What condition does this indicate?',
        options: ['Placenta Previa', 'Abruptio Placentae', 'Hydatidiform Mole', 'Cervical Incompetence'],
        correct_answer: 1,
        explanation: 'Painful, dark red bleeding accompanied by a rigid, board-like uterus is a classic presentation of abruptio placentae, where blood infiltrates the uterine muscle fibers following premature placental separation.',
        difficulty: 'Easy',
        tags: ['abruptio placentae', 'bleeding', 'uterus rigidity'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Pediatric Nursing',
        topic: 'Respiratory (Epiglottitis)',
        question: 'A child is admitted to the pediatric unit with a diagnosis of acute epiglottitis. Which assessment action is strictly contraindicated for the nurse to perform?',
        options: [
          'Assessing the child\'s oxygen saturation via a pulse oximeter',
          'Inspecting the throat using a tongue depressor',
          'Monitoring the respiratory rate and looking for chest wall retractions',
          'Placing the child in an upright, sitting position'
        ],
        correct_answer: 1,
        explanation: 'Inserting a tongue depressor into the throat of a child with epiglottitis can irritate the inflamed tissues and trigger a sudden, fatal laryngospasm. Throat inspection should only be performed in a controlled operating theater equipped for emergency intubation or tracheostomy.',
        difficulty: 'Hard',
        tags: ['epiglottitis', 'safety warning', 'contraindicated', 'pediatrics'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Mental Health Nursing',
        topic: 'Pharmacotherapy Side Effects (Oculogyric)',
        question: 'A psychiatric patient is receiving Haloperidol for acute psychosis. During the morning assessment, the nurse notes that the patient\'s eyes are locked in an involuntary upward gaze. How should this extrapyramidal symptom (EPS) be documented?',
        options: ['Akathisia', 'Oculogyric crisis', 'Tardive dyskinesia', 'Micrographia'],
        correct_answer: 1,
        explanation: 'An oculogyric crisis is an acute dystonic reaction characterized by the involuntary, fixed deviation of the eyes, typically upward. It is an extrapyramidal side effect managed with anticholinergic medications like Benztropine.',
        difficulty: 'Medium',
        tags: ['haloperidol', 'oculogyric crisis', 'EPS'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Fundamentals of Nursing',
        topic: 'Safety (Biomedical Glass)',
        question: 'According to national biomedical waste management rules, into which color-coded container should a nurse discard a broken glass drug ampoule?',
        options: ['Red bag', 'Yellow bag', 'Blue box or blue-marked cardboard container', 'White translucent sharps container'],
        correct_answer: 2,
        explanation: 'Waste glass, including contaminated ampoules, vials, and broken glassware, must be segregated into Blue-coded boxes or containers for specific decontamination and recycling.',
        difficulty: 'Easy',
        tags: ['biomedical waste', 'glass waste', 'ampoule'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Research & Statistics',
        topic: 'Variable Scales',
        question: 'A clinical research study measures the baseline pulse rates of 100 individuals. What type of data does this variable represent?',
        options: ['Nominal data', 'Qualitative data', 'Ratio data', 'Ordinal data'],
        correct_answer: 2,
        explanation: 'Pulse rate is a continuous quantitative variable with a true absolute zero point (0 bpm equals no pulse), classifying it as ratio scale data.',
        difficulty: 'Medium',
        tags: ['statistics', 'ratio data', 'pulse rate'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'Work and Time',
        question: 'A contractor can build an isolation clinic unit in 15 days using 8 workers. How many days will it take to build the identical unit if he employs 10 workers working at the same pace?',
        options: ['12 days', '10 days', '9 days', '14 days'],
        correct_answer: 0,
        explanation: 'Inverse variation: M1 * D1 = M2 * D2. 8 * 15 = 10 * D2 => D2 = 120 / 10 = 12 days.',
        difficulty: 'Easy',
        tags: ['math', 'work time', 'ratio'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Aptitude',
        topic: 'BODMAS',
        question: 'Evaluate the following mathematical expression following standard ordering rules: 45 - [3 * (8 + 4)] / 2.',
        options: ['27', '36', '18', '41'],
        correct_answer: 0,
        explanation: 'BODMAS: 8 + 4 = 12. 3 * 12 = 36. 36 / 2 = 18. 45 - 18 = 27.',
        difficulty: 'Easy',
        tags: ['math', 'BODMAS', 'operators'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Professional Anniversaries',
        question: 'On which date is International Nurses Day celebrated globally every year?',
        options: ['April 7', 'May 12', 'December 1', 'October 2'],
        correct_answer: 1,
        explanation: 'International Nurses Day is celebrated on May 12th to mark the birth anniversary of Florence Nightingale, the founder of modern nursing.',
        difficulty: 'Easy',
        tags: ['GK', 'Nurses Day'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General Knowledge',
        topic: 'Health Organizations headquarters',
        question: 'Which city serves as the international headquarters of the World Health Organization (WHO)?',
        options: ['New York, USA', 'Geneva, Switzerland', 'Paris, France', 'New Delhi, India'],
        correct_answer: 1,
        explanation: 'The World Health Organization is headquartered in Geneva, Switzerland, where it was established on April 7, 1948.',
        difficulty: 'Easy',
        tags: ['GK', 'WHO', 'headquarters'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Antonyms',
        question: 'Select the word that is most opposite in meaning (antonym) to: BENIGN',
        options: ['Innocent', 'Malignant', 'Harmless', 'Chronic'],
        correct_answer: 1,
        explanation: 'Benign denotes a non-threatening, mild, or non-cancerous condition, whereas malignant indicates a dangerous, invasive, or cancerous state, making them antonyms.',
        difficulty: 'Easy',
        tags: ['english', 'vocabulary', 'antonyms'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'General English',
        topic: 'Indirect Questions',
        question: 'Choose the correct option to fix the underlined phrase: "The nurse asked the patient where did he feel the acute pain."',
        options: ['where he felt', 'where he does feel', 'that where he feels', 'where did he felt'],
        correct_answer: 0,
        explanation: 'In indirect questions, sentence structure shifts back to standard declarative ordering (Subject + Verb) instead of interrogative inversion, making "where he felt" the correct choice.',
        difficulty: 'Medium',
        tags: ['english', 'grammar', 'indirect speech'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Number Patterns',
        question: 'Find the next number in the logical series: 3, 6, 11, 18, 27, ___',
        options: ['38', '36', '42', '35'],
        correct_answer: 0,
        explanation: 'Differences are consecutive odd numbers: +3, +5, +7, +9. Next is +11. 27 + 11 = 38.',
        difficulty: 'Easy',
        tags: ['reasoning', 'number series'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      },
      {
        subject: 'Reasoning',
        topic: 'Blood Relations',
        question: 'Introducing a man, a nurse says, "His father is the only son of my grandfather." How is the man related to the nurse?',
        options: ['Brother', 'Uncle', 'Father', 'Cousin'],
        correct_answer: 0,
        explanation: 'The only son of the nurse\'s grandfather is the nurse\'s father. If this man\'s father is the nurse\'s father, the man must be the nurse\'s brother.',
        difficulty: 'Medium',
        tags: ['reasoning', 'blood relation'],
        previous_year_indicator: 'SGPGI 2026 Blueprint'
      }
    ]
  }
];

async function loadUserPapers() {
  console.log('Starting SGPGI User Mock Papers load routine...');
  
  try {
    for (const paper of papersData) {
      console.log(`Processing paper: ${paper.paperTitle}...`);
      
      // 1. Insert mock test metadata
      const mockResult = await db.query(
        'INSERT INTO mock_tests (title, duration_minutes, total_questions, negative_marking) VALUES ($1, $2, $3, $4) RETURNING *',
        [paper.paperTitle, 120, paper.questions.length, 0.25]
      );
      const newMockTest = mockResult.rows[0];
      console.log(`Created Mock Test Config (ID: ${newMockTest.id}, Title: ${newMockTest.title})`);

      // 2. Insert questions and link them
      let orderIndex = 0;
      for (const q of paper.questions) {
        // Insert question
        const qResult = await db.query(
          'INSERT INTO questions (subject, topic, question, options, correct_answer, explanation, difficulty, tags, previous_year_indicator) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [
            q.subject,
            q.topic,
            q.question,
            JSON.stringify(q.options),
            q.correct_answer,
            q.explanation,
            q.difficulty,
            q.tags,
            q.previous_year_indicator
          ]
        );
        const newQuestion = qResult.rows[0];

        // Link to mock test
        await db.query(
          'INSERT INTO mock_test_questions (mock_test_id, question_id, order_index) VALUES ($1, $2, $3)',
          [newMockTest.id, newQuestion.id, orderIndex]
        );
        orderIndex++;
      }
      
      console.log(`Linked ${orderIndex} questions successfully to ${paper.paperTitle}.`);
    }

    console.log('All user mock papers loaded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to load user papers:', err.message);
    process.exit(1);
  }
}

// Execute
loadUserPapers();
