'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Bookmark, AlertCircle, Play, Sparkles, BookOpen, Trash2, ArrowRight,
  ChevronDown, ChevronUp, Calculator, HeartPulse, Activity, HelpCircle, 
  RotateCcw, Sparkle, Stethoscope, GraduationCap, ArrowUpRight, Check, Brain,
  Calendar, Droplet
} from 'lucide-react';

export default function RevisionView({ onStartQuestionPractice, user, onNavigateHome }) {
  const [bookmarkedList, setBookmarkedList] = useState([]);
  const [incorrectList, setIncorrectList] = useState([]);
  const [activeTab, setActiveTab] = useState('bookmarks'); // 'bookmarks' | 'incorrect' | 'notes' | 'concepts' | 'sureshot' | 'calculators'
  const [loading, setLoading] = useState(true);

  // States for revision notes and concepts search
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedConcept, setExpandedConcept] = useState(null);

  // States for Q&A reveal
  const [revealedAnswers, setRevealedAnswers] = useState({}); // { [qIndex]: boolean }
  
  // Pagination states
  const [conceptsPage, setConceptsPage] = useState(1);
  const [sureshotPage, setSureshotPage] = useState(1);

  // States for Parkland Calculator
  const [parklandWeight, setParklandWeight] = useState(70);
  const [parklandTbsa, setParklandTbsa] = useState(30);
  const [parklandResult, setParklandResult] = useState(null);

  // States for ABG Interpreter
  const [abgPh, setAbgPh] = useState(7.30);
  const [abgPaco2, setAbgPaco2] = useState(50);
  const [abgHco3, setAbgHco3] = useState(24);
  const [abgResult, setAbgResult] = useState(null);

  // States for APGAR Calculator
  const [apgarHeart, setApgarHeart] = useState(2);
  const [apgarResp, setApgarResp] = useState(1);
  const [apgarTone, setApgarTone] = useState(1);
  const [apgarReflex, setApgarReflex] = useState(1);
  const [apgarColor, setApgarColor] = useState(1);
  const [apgarResult, setApgarResult] = useState(null);

  // States for IV Drop Rate Calculator
  const [ivVolume, setIvVolume] = useState(1000);
  const [ivTime, setIvTime] = useState(8);
  const [ivDropFactor, setIvDropFactor] = useState(15);
  const [ivResult, setIvResult] = useState(null);

  // States for Glasgow Coma Scale (GCS)
  const [gcsEye, setGcsEye] = useState(4);
  const [gcsVerbal, setGcsVerbal] = useState(5);
  const [gcsMotor, setGcsMotor] = useState(6);
  const [gcsResult, setGcsResult] = useState(null);

  // States for SpO2/FiO2 Ratio
  const [sfSpo2, setSfSpo2] = useState(98);
  const [sfFio2, setSfFio2] = useState(21);
  const [sfResult, setSfResult] = useState(null);

  // States for Mean Arterial Pressure (MAP)
  const [mapSbp, setMapSbp] = useState(120);
  const [mapDbp, setMapDbp] = useState(80);
  const [mapResult, setMapResult] = useState(null);

  // States for Pregnancy Due Date Calculator
  const [pregnancyLmp, setPregnancyLmp] = useState('');
  const [pregnancyCycle, setPregnancyCycle] = useState(28);
  const [pregnancyResult, setPregnancyResult] = useState(null);

  // States for Holliday-Segar Formula Calculator
  const [hollidayWeight, setHollidayWeight] = useState(15);
  const [hollidayResult, setHollidayResult] = useState(null);

  // States for Dynamic Concepts Database
  const [conceptsList, setConceptsList] = useState([]);
  const [conceptsLoaded, setConceptsLoaded] = useState(false);

  // States for Concept Form Modal
  const [conceptModalOpen, setConceptModalOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState(null);
  const [conceptTitle, setConceptTitle] = useState('');
  const [conceptCategory, setConceptCategory] = useState('');
  const [conceptHighlight, setConceptHighlight] = useState('');
  const [conceptBullets, setConceptBullets] = useState('');

  // States for Sure-Shot Q&As
  const [sureshotList, setSureshotList] = useState([]);
  const [sureshotLoaded, setSureshotLoaded] = useState(false);
  const [sureshotModalOpen, setSureshotModalOpen] = useState(false);
  const [editingSureshot, setEditingSureshot] = useState(null);
  const [sureshotQ, setSureshotQ] = useState('');
  const [sureshotA, setSureshotA] = useState('');
  const [sureshotExp, setSureshotExp] = useState('');

  useEffect(() => {
    fetchRevisionData();
    fetchConcepts();
    fetchSureshotQuestions();
  }, []);

  const fetchConcepts = async () => {
    try {
      const data = await api.getConcepts();
      setConceptsList(data || []);
      setConceptsLoaded(true);
    } catch (err) {
      console.error('Error fetching concepts:', err);
    }
  };

  const fetchSureshotQuestions = async () => {
    try {
      const data = await api.getSureshotQuestions();
      setSureshotList(data || []);
      setSureshotLoaded(true);
    } catch (err) {
      console.error('Error fetching sureshot questions:', err);
    }
  };

  useEffect(() => {
    setConceptsPage(1);
  }, [searchQuery]);

  const fetchRevisionData = async () => {
    setLoading(true);
    try {
      const data = await api.getRevisionList();
      setBookmarkedList(data.bookmarked || []);
      setIncorrectList(data.incorrect || []);
      await fetchConcepts();
      await fetchSureshotQuestions();
    } catch (err) {
      console.error('Error fetching revision data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (qId, e) => {
    e.stopPropagation();
    try {
      await api.toggleBookmark(qId);
      setBookmarkedList((prev) => prev.filter(q => q.id !== qId));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  const handleStartPracticeSession = (list) => {
    if (list.length === 0) return;
    onStartQuestionPractice(null, list);
  };

  // Flip state tracker for 25 sure shot Q&As
  const toggleAnswerReveal = (idx) => {
    setRevealedAnswers(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // 1. Parkland calculation logic
  const calculateParkland = (e) => {
    e.preventDefault();
    const w = parseFloat(parklandWeight);
    const t = parseFloat(parklandTbsa);
    if (isNaN(w) || isNaN(t)) return;

    if (w <= 0 || t <= 0 || t > 100) {
      setParklandResult({
        totalFluid: null,
        errorMsg: 'Error: Weight must be positive, and TBSA must be between 0% and 100%.',
        alertClass: 'bg-danger-light text-danger border-danger/20'
      });
      return;
    }

    const totalFluid = 4 * w * t; // in mL
    const first8Hrs = totalFluid / 2;
    const next16Hrs = totalFluid / 2;
    const rateFirst8 = first8Hrs / 8; // mL/hr
    const rateNext16 = next16Hrs / 16; // mL/hr

    setParklandResult({
      totalFluid: totalFluid.toFixed(0),
      first8Hrs: first8Hrs.toFixed(0),
      next16Hrs: next16Hrs.toFixed(0),
      rateFirst8: rateFirst8.toFixed(1),
      rateNext16: rateNext16.toFixed(1)
    });
  };

  // 2. ABG Interpretation logic
  const interpretAbg = (e) => {
    e.preventDefault();
    const ph = parseFloat(abgPh);
    const paco2 = parseFloat(abgPaco2);
    const hco3 = parseFloat(abgHco3);

    if (isNaN(ph) || isNaN(paco2) || isNaN(hco3)) return;

    // Validate physiological bounds to prevent clinically impossible calculations
    if (ph < 6.0 || ph > 8.0 || paco2 < 5 || paco2 > 150 || hco3 < 2 || hco3 > 60) {
      setAbgResult({
        diagnosis: 'Inconsistent/Invalid ABG Values',
        compensation: 'Error: Input values are outside plausible physiological ranges (pH 6.0-8.0, PaCO₂ 5-150 mmHg, HCO₃⁻ 2-60 mEq/L).',
        isError: true
      });
      return;
    }

    let pHState = 'normal'; // 'normal' | 'acidosis' | 'alkalosis'
    if (ph < 7.35) pHState = 'acidosis';
    else if (ph > 7.45) pHState = 'alkalosis';

    let respiratoryState = 'normal'; // 'normal' | 'acidosis' | 'alkalosis'
    if (paco2 > 45) respiratoryState = 'acidosis';
    else if (paco2 < 35) respiratoryState = 'alkalosis';

    let metabolicState = 'normal'; // 'normal' | 'acidosis' | 'alkalosis'
    if (hco3 < 22) metabolicState = 'acidosis';
    else if (hco3 > 26) metabolicState = 'alkalosis';

    let diagnosis = 'Normal Acid-Base Balance';
    let compensation = 'N/A';
    let isError = false;

    if (pHState === 'acidosis') {
      if (respiratoryState === 'acidosis' && metabolicState !== 'acidosis') {
        diagnosis = 'Respiratory Acidosis';
        compensation = metabolicState === 'alkalosis' ? 'Partially Compensated' : 'Uncompensated';
      } else if (metabolicState === 'acidosis' && respiratoryState !== 'acidosis') {
        diagnosis = 'Metabolic Acidosis';
        compensation = respiratoryState === 'alkalosis' ? 'Partially Compensated' : 'Uncompensated';
      } else if (respiratoryState === 'acidosis' && metabolicState === 'acidosis') {
        diagnosis = 'Combined Respiratory & Metabolic Acidosis';
        compensation = 'None';
      } else {
        diagnosis = 'Inconsistent/Invalid ABG Values';
        compensation = 'Error: Acidosis pH cannot coexist with these respiratory/metabolic values.';
        isError = true;
      }
    } else if (pHState === 'alkalosis') {
      if (respiratoryState === 'alkalosis' && metabolicState !== 'alkalosis') {
        diagnosis = 'Respiratory Alkalosis';
        compensation = metabolicState === 'acidosis' ? 'Partially Compensated' : 'Uncompensated';
      } else if (metabolicState === 'alkalosis' && respiratoryState !== 'alkalosis') {
        diagnosis = 'Metabolic Alkalosis';
        compensation = respiratoryState === 'acidosis' ? 'Partially Compensated' : 'Uncompensated';
      } else if (respiratoryState === 'alkalosis' && metabolicState === 'alkalosis') {
        diagnosis = 'Combined Respiratory & Metabolic Alkalosis';
        compensation = 'None';
      } else {
        diagnosis = 'Inconsistent/Invalid ABG Values';
        compensation = 'Error: Alkalosis pH cannot coexist with these respiratory/metabolic values.';
        isError = true;
      }
    } else {
      if (respiratoryState === 'normal' && metabolicState === 'normal') {
        diagnosis = 'Normal Acid-Base Balance';
        compensation = 'None';
      } else if (respiratoryState === 'acidosis' && metabolicState === 'alkalosis') {
        diagnosis = ph < 7.40 ? 'Fully Compensated Respiratory Acidosis' : 'Fully Compensated Metabolic Alkalosis';
        compensation = 'Fully Compensated';
      } else if (respiratoryState === 'alkalosis' && metabolicState === 'acidosis') {
        diagnosis = ph < 7.40 ? 'Fully Compensated Metabolic Acidosis' : 'Fully Compensated Respiratory Alkalosis';
        compensation = 'Fully Compensated';
      } else {
        diagnosis = 'Inconsistent/Invalid ABG Values';
        compensation = 'Error: Normal pH requires both values to be normal or fully compensating.';
        isError = true;
      }
    }

    setAbgResult({ diagnosis, compensation, isError });
  };

  // 3. APGAR calculation logic
  const calculateApgar = (e) => {
    e.preventDefault();
    const score = parseInt(apgarHeart) + parseInt(apgarResp) + parseInt(apgarTone) + parseInt(apgarReflex) + parseInt(apgarColor);
    let status = 'Excellent Condition (7-10)';
    let alertClass = 'bg-success-light text-success border-success/20';
    
    if (score <= 3) {
      status = 'Severe Depression (0-3) - Requires immediate resuscitation!';
      alertClass = 'bg-danger-light text-danger border-danger/20';
    } else if (score <= 6) {
      status = 'Moderate Depression (4-6) - Requires active stimulation & oxygen support!';
      alertClass = 'bg-accent-light text-accent border-accent/20';
    }

    setApgarResult({ score, status, alertClass });
  };

  // 4. IV Flow Rate calculation logic
  const calculateIvFlow = (e) => {
    e.preventDefault();
    const v = parseFloat(ivVolume);
    const t = parseFloat(ivTime);
    const f = parseFloat(ivDropFactor);

    if (isNaN(v) || isNaN(t) || isNaN(f)) return;

    if (v <= 0 || t <= 0) {
      setIvResult({
        rateMlHr: null,
        errorMsg: 'Error: Volume and time must be positive values.',
        alertClass: 'bg-danger-light text-danger border-danger/20'
      });
      return;
    }

    const rateMlHr = v / t;
    const rateDropsMin = (v * f) / (t * 60);

    setIvResult({
      rateMlHr: rateMlHr.toFixed(1),
      rateDropsMin: Math.round(rateDropsMin)
    });
  };

  // 5. GCS calculation logic
  const calculateGcs = (e) => {
    e.preventDefault();
    const eye = parseInt(gcsEye);
    const verbal = parseInt(gcsVerbal);
    const motor = parseInt(gcsMotor);
    const score = eye + verbal + motor;

    let interpretation = 'Mild Brain Injury (13-15)';
    let alertClass = 'bg-success-light text-success border-success/20';

    if (score <= 8) {
      interpretation = 'Severe Brain Injury / Coma (3-8). Less than 8, intubate!';
      alertClass = 'bg-danger-light text-danger border-danger/20';
    } else if (score <= 12) {
      interpretation = 'Moderate Brain Injury (9-12)';
      alertClass = 'bg-amber-500/10 text-amber-600 border-amber-500/15';
    }

    setGcsResult({ score, interpretation, alertClass });
  };

  // 6. SpO2/FiO2 Ratio calculation logic
  const calculateSfRatio = (e) => {
    e.preventDefault();
    const spo2 = parseFloat(sfSpo2);
    const fio2 = parseFloat(sfFio2);

    if (isNaN(spo2) || isNaN(fio2)) return;

    let adjustedFio2 = fio2;
    if (fio2 <= 1.0) {
      adjustedFio2 = fio2 * 100;
    }

    if (spo2 < 0 || spo2 > 100 || adjustedFio2 < 21 || adjustedFio2 > 100) {
      setSfResult({
        ratio: null,
        interpretation: 'Error: SpO₂ must be between 0-100%, and FiO₂ must be between 21-100% (or 0.21-1.0).',
        alertClass: 'bg-danger-light text-danger border-danger/20'
      });
      return;
    }

    const ratio = Math.round((spo2 / adjustedFio2) * 100);

    let interpretation = 'Normal / No ARDS (> 315)';
    let alertClass = 'bg-success-light text-success border-success/20';

    if (ratio <= 235) {
      interpretation = 'Moderate to Severe ARDS (≤ 235) [Equivalent to PaO₂/FiO₂ ≤ 200]';
      alertClass = 'bg-danger-light text-danger border-danger/20';
    } else if (ratio <= 315) {
      interpretation = 'Mild ARDS (236 - 315) [Equivalent to PaO₂/FiO₂ ≤ 300]';
      alertClass = 'bg-amber-500/10 text-amber-600 border-amber-500/15';
    }

    setSfResult({ ratio, interpretation, alertClass });
  };

  // 7. MAP calculation logic
  const calculateMap = (e) => {
    e.preventDefault();
    const sbp = parseFloat(mapSbp);
    const dbp = parseFloat(mapDbp);

    if (isNaN(sbp) || isNaN(dbp)) return;

    if (sbp <= dbp || sbp <= 0 || dbp <= 0) {
      setMapResult({
        map: null,
        interpretation: 'Error: Systolic pressure must be greater than diastolic pressure, and both must be positive.',
        alertClass: 'bg-danger-light text-danger border-danger/20'
      });
      return;
    }

    const mapVal = Math.round((sbp + 2 * dbp) / 3);

    let interpretation = 'Normal Perfusion (70-100 mmHg)';
    let alertClass = 'bg-success-light text-success border-success/20';

    if (mapVal < 60) {
      interpretation = 'Inadequate Organ Perfusion (< 60 mmHg) - Danger of Shock!';
      alertClass = 'bg-danger-light text-danger border-danger/20';
    } else if (mapVal < 70) {
      interpretation = 'Low MAP (60-69 mmHg) - Monitor Closely';
      alertClass = 'bg-amber-500/10 text-amber-600 border-amber-500/15';
    } else if (mapVal > 100) {
      interpretation = 'Elevated MAP (> 100 mmHg)';
      alertClass = 'bg-amber-500/10 text-amber-600 border-amber-500/15';
    }

    setMapResult({ map: mapVal, interpretation, alertClass });
  };

  // Pregnancy Due Date calculation logic
  const calculatePregnancy = (e) => {
    e.preventDefault();
    if (!pregnancyLmp) return;

    const lmpDate = new Date(pregnancyLmp);
    if (isNaN(lmpDate.getTime())) {
      setPregnancyResult({
        edd: null,
        gestationalAge: null,
        errorMsg: 'Invalid date selected.',
        alertClass: 'bg-danger-light text-danger border-danger/20'
      });
      return;
    }

    const cycleDays = parseInt(pregnancyCycle) || 28;
    if (cycleDays < 20 || cycleDays > 45) {
      setPregnancyResult({
        edd: null,
        gestationalAge: null,
        errorMsg: 'Cycle length must be between 20 and 45 days.',
        alertClass: 'bg-danger-light text-danger border-danger/20'
      });
      return;
    }

    const eddDate = new Date(lmpDate);
    // Standard gestation is 280 days from LMP for a 28-day cycle.
    eddDate.setDate(eddDate.getDate() + 252 + cycleDays);

    // Calculate Gestational Age
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lmpMidnight = new Date(lmpDate);
    lmpMidnight.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lmpMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let gestationalAgeStr = '';
    let trimester = '';
    let progressPercent = 0;

    if (diffDays < 0) {
      gestationalAgeStr = 'LMP date is in the future.';
      trimester = 'N/A';
    } else {
      const weeks = Math.floor(diffDays / 7);
      const days = diffDays % 7;
      
      if (weeks >= 42) {
        gestationalAgeStr = `${weeks} weeks, ${days} days (Post-term)`;
      } else {
        gestationalAgeStr = `${weeks} weeks, ${days} days`;
      }

      if (weeks < 13) {
        trimester = 'First Trimester (Weeks 1-12)';
      } else if (weeks < 27) {
        trimester = 'Second Trimester (Weeks 13-26)';
      } else {
        trimester = 'Third Trimester (Weeks 27-40+)';
      }

      progressPercent = Math.min(100, Math.max(0, Math.round((diffDays / 280) * 100)));
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedEdd = eddDate.toLocaleDateString('en-US', options);

    setPregnancyResult({
      edd: formattedEdd,
      gestationalAge: gestationalAgeStr,
      trimester,
      progressPercent,
      errorMsg: null
    });
  };

  // Holliday-Segar Formula calculation logic
  const calculateHolliday = (e) => {
    if (e) e.preventDefault();
    const w = parseFloat(hollidayWeight);
    if (isNaN(w) || w <= 0) {
      setHollidayResult({
        daily: null,
        hourly: null,
        errorMsg: 'Weight must be a positive number.',
        alertClass: 'bg-danger-light text-danger border-danger/20'
      });
      return;
    }

    // Daily fluid calculation (100/50/20 rule)
    let dailyFluid = 0;
    let dailyBreakdown = '';
    if (w <= 10) {
      dailyFluid = w * 100;
      dailyBreakdown = `${w.toFixed(1)} kg × 100 mL/kg = ${dailyFluid.toFixed(0)} mL/day`;
    } else if (w <= 20) {
      dailyFluid = 1000 + (w - 10) * 50;
      dailyBreakdown = `First 10 kg: 1000 mL/day\nRemaining ${(w - 10).toFixed(1)} kg × 50 mL/kg = ${((w - 10) * 50).toFixed(0)} mL/day\nTotal = ${dailyFluid.toFixed(0)} mL/day`;
    } else {
      dailyFluid = 1500 + (w - 20) * 20;
      dailyBreakdown = `First 10 kg: 1000 mL/day\nNext 10 kg: 500 mL/day\nRemaining ${(w - 20).toFixed(1)} kg × 20 mL/kg = ${((w - 20) * 20).toFixed(0)} mL/day\nTotal = ${dailyFluid.toFixed(0)} mL/day`;
    }

    // Hourly fluid calculation (4/2/1 rule)
    let hourlyFluid = 0;
    let hourlyBreakdown = '';
    if (w <= 10) {
      hourlyFluid = w * 4;
      hourlyBreakdown = `${w.toFixed(1)} kg × 4 mL/kg/hr = ${hourlyFluid.toFixed(0)} mL/hr`;
    } else if (w <= 20) {
      hourlyFluid = 40 + (w - 10) * 2;
      hourlyBreakdown = `First 10 kg: 40 mL/hr\nRemaining ${(w - 10).toFixed(1)} kg × 2 mL/kg/hr = ${((w - 10) * 2).toFixed(0)} mL/hr\nTotal = ${hourlyFluid.toFixed(0)} mL/hr`;
    } else {
      hourlyFluid = 60 + (w - 20) * 1;
      hourlyBreakdown = `First 10 kg: 40 mL/hr\nNext 10 kg: 20 mL/hr\nRemaining ${(w - 20).toFixed(1)} kg × 1 mL/kg/hr = ${((w - 20) * 1).toFixed(0)} mL/hr\nTotal = ${hourlyFluid.toFixed(0)} mL/hr`;
    }

    setHollidayResult({
      daily: Math.round(dailyFluid),
      hourly: Math.round(hourlyFluid),
      dailyBreakdown,
      hourlyBreakdown,
      alertClass: 'bg-secondary-light border-secondary/20 text-foreground'
    });
  };

  // Concepts Management Handlers
  const handleDownloadTemplate = () => {
    const csvContent = "title,category,highlight,bullets\n" +
      "Parkland Burn Resuscitation Formula,Critical Care / Trauma,\"Formula: 4 mL x Body Weight (kg) x TBSA (%)\",\"Administer half of the total calculated volume in the first 8 hours (calculated from the time of injury | not arrival). | Administer the remaining half of the volume over the next 16 hours. | The crystalloid of choice for resuscitation is Ringer's Lactate (RL).\"\n" +
      "Blood Transfusion Guidelines & Reactions,Clinical Nursing / Safety,Complete transfusion within 4 hours maximum to avoid bacterial growth.,\"Must verify patient identity and blood bag details with 2 registered nurses prior to administration. | Run the infusion slowly at 2 to 5 mL/min for the first 15 minutes to monitor for immediate reactions. | Closely monitor for hemolytic reactions (chills | severe lower back pain | dyspnea | fever | hypotension). | If a reaction occurs: Stop infusion immediately | disconnect tubing | run normal saline via new tubing | and notify provider.\"";
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "epion_concepts_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUploadConcepts = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const confirmUpload = window.confirm("Are you sure you want to bulk upload? This will replace all existing concepts with the concepts in the CSV file.");
    if (!confirmUpload) return;
    
    setLoading(true);
    try {
      const response = await api.importConceptsCsv(file);
      alert(response.message || "Bulk upload completed successfully.");
      await fetchConcepts();
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert(err.message || "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConcept = async (id, title, e) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(`Are you sure you want to delete the concept "${title}"?`);
    if (!confirmDelete) return;
    
    try {
      await api.deleteConcept(id);
      alert("Concept deleted successfully.");
      await fetchConcepts();
    } catch (err) {
      console.error("Delete concept error:", err);
      alert("Failed to delete concept.");
    }
  };

  const openEditConceptModal = (concept, e) => {
    e.stopPropagation();
    setEditingConcept(concept);
    setConceptTitle(concept.title);
    setConceptCategory(concept.category);
    setConceptHighlight(concept.highlight || '');
    setConceptBullets(concept.bullets ? concept.bullets.join('\n') : '');
    setConceptModalOpen(true);
  };

  const openAddConceptModal = () => {
    setEditingConcept(null);
    setConceptTitle('');
    setConceptCategory('');
    setConceptHighlight('');
    setConceptBullets('');
    setConceptModalOpen(true);
  };

  const handleSaveConcept = async (e) => {
    e.preventDefault();
    if (!conceptTitle.trim() || !conceptCategory.trim() || !conceptBullets.trim()) {
      alert("Please fill in all required fields.");
      return;
    }
    
    const bulletsArray = conceptBullets.split('\n').map(b => b.trim()).filter(Boolean);
    if (bulletsArray.length === 0) {
      alert("Please enter at least one bullet point.");
      return;
    }
    
    const payload = {
      title: conceptTitle.trim(),
      category: conceptCategory.trim(),
      highlight: conceptHighlight.trim() || null,
      bullets: bulletsArray
    };
    
    try {
      if (editingConcept) {
        await api.updateConcept(editingConcept.id, payload);
        alert("Concept updated successfully.");
      } else {
        await api.createConcept(payload);
        alert("Concept created successfully.");
      }
      setConceptModalOpen(false);
      await fetchConcepts();
    } catch (err) {
      console.error("Save concept error:", err);
      alert("Failed to save concept.");
    }
  };

  // Sureshot Questions Management Handlers
  const handleDownloadSureshotTemplate = () => {
    const csvContent = "question,answer,explanation\n" +
      "\"A patient with a head injury has a regular respiratory pattern followed by periods of apnea. How is this documented?\",\"Cheyne-Stokes Respiration.\",\"Characterized by a gradual crescendo-decrescendo pattern of breathing separated by apneic phases, indicating deep bilateral cerebral hemisphere or brainstem impairment.\"\n" +
      "\"Which solution is used to clean a large blood spill on an ICU floor?\",\"10% Sodium Hypochlorite (Bleach) solution.\",\"For substantial blood spills, a 1:10 dilution of sodium hypochlorite is required to effectively neutralize bloodborne pathogens like HIV, HBV, and HCV.\"";
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "epion_sureshot_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUploadSureshot = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const confirmUpload = window.confirm("Are you sure you want to bulk upload? This will replace all existing sure-shot questions with the ones in the CSV file.");
    if (!confirmUpload) return;
    
    setLoading(true);
    try {
      const response = await api.importSureshotQuestionsCsv(file);
      alert(response.message || "Bulk upload completed successfully.");
      await fetchSureshotQuestions();
    } catch (err) {
      console.error("Bulk upload error:", err);
      alert(err.message || "Bulk upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSureshot = async (id, questionText, e) => {
    e.stopPropagation();
    if (!id) {
      alert("Preloaded template questions cannot be deleted individually unless they are first saved to the database. You can customize the entire list by uploading a CSV file.");
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete this question?`);
    if (!confirmDelete) return;
    
    try {
      await api.deleteSureshotQuestion(id);
      alert("Question deleted successfully.");
      await fetchSureshotQuestions();
    } catch (err) {
      console.error("Delete sureshot error:", err);
      alert("Failed to delete question.");
    }
  };

  const openEditSureshotModal = (q, e) => {
    e.stopPropagation();
    setEditingSureshot(q);
    setSureshotQ(q.question);
    setSureshotA(q.answer);
    setSureshotExp(q.explanation);
    setSureshotModalOpen(true);
  };

  const openAddSureshotModal = () => {
    setEditingSureshot(null);
    setSureshotQ('');
    setSureshotA('');
    setSureshotExp('');
    setSureshotModalOpen(true);
  };

  const handleSaveSureshot = async (e) => {
    e.preventDefault();
    if (!sureshotQ.trim() || !sureshotA.trim() || !sureshotExp.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    
    const payload = {
      question: sureshotQ.trim(),
      answer: sureshotA.trim(),
      explanation: sureshotExp.trim()
    };
    
    try {
      if (editingSureshot) {
        await api.updateSureshotQuestion(editingSureshot.id, payload);
        alert("Question updated successfully.");
      } else {
        await api.createSureshotQuestion(payload);
        alert("Question created successfully.");
      }
      setSureshotModalOpen(false);
      await fetchSureshotQuestions();
    } catch (err) {
      console.error("Save sureshot error:", err);
      alert("Failed to save question.");
    }
  };

  // High-Yield One Page Notes dataset
  const revisionNotes = [
    {
      category: 'Med-Surg Essentials',
      bullets: [
        'MI: Troponin I is the most specific biomarker, rising in 3-4 hours and remaining elevated for 10-14 days.',
        'Stroke: Thrombolytic window with tissue plasminogen activator (tPA) is strictly 3 to 4.5 hours from symptom onset.',
        'Chronic Kidney Disease: Avoid NSAIDs (highly nephrotoxic); monitor and treat hyperkalemia (>5.0 mEq/L) immediately.',
        'Glaucoma: Elevated intraocular pressure (IOP); treat with miotics (e.g. Pilocarpine) to constrict pupil and open Schlemm canal drainage.'
      ]
    },
    {
      category: 'Critical Care & Ventilation',
      bullets: [
        'Ventilator Alarms: Low-pressure = circuit disconnection, leaks, or cuff deflation. High-pressure = biting on tube, coughing, secretions, or tube kink.',
        'ARDS: Low tidal volume strategy (6 mL/kg) prevents ventilator-induced lung injury (volutrauma). Prone positioning improves oxygenation.',
        'Shock preps: Hypovolemic = low CVP; Cardiogenic = elevated CVP and PAWP; Anaphylaxis = Epinephrine 1:1000 IM immediately.'
      ]
    },
    {
      category: 'Pharmacology Levels & Antidotes',
      bullets: [
        'Therapeutic ranges: Digoxin (0.5 - 2 ng/mL), Phenytoin (10 - 20 mcg/mL), Theophylline (10 - 20 mcg/mL).',
        'High-alert antidotes: Acetaminophen -> N-Acetylcysteine; Iron -> Deferoxamine; Benzodiazepines -> Flumazenil; Heparin -> Protamine Sulfate; Warfarin -> Vitamin K.'
      ]
    },
    {
      category: 'OBGYN & Pediatrics',
      bullets: [
        'OBGYN Calculations: Naegele\'s Rule = LMP + 7 Days - 3 Months + 1 Year.',
        'Lochia discharge order: Rubra (dark red, day 1-3) -> Serosa (pink-brown, day 4-10) -> Alba (white-yellow, day 11-21).',
        'Pediatric milestones: Birth weight doubles at 5-6 months, triples at 1 year. Social smile develops around 2 months. Pincer grasp around 9 months.'
      ]
    },
    {
      category: 'Patient Safety & Infection Control',
      bullets: [
        'Biomedical Waste: Red bag = Recyclable plastics (IV lines, catheters, tubing, syringes without needles). Yellow bag = Anatomical waste, blood bags, dressings. Blue box = Glassware/broken ampoules.',
        'ACLS Resuscitation: Adult compression depth of 2 to 2.4 inches (5-6 cm). Ratio of 30:2. Continuous compressions at 100-120/min.'
      ]
    }
  ];

  // 50 Core Repeated Concepts Dataset
  const coreConcepts = [
    {
      id: 1,
      title: 'Parkland Burn Resuscitation Formula',
      category: 'Critical Care / Trauma',
      highlight: 'Formula: 4 mL x Body Weight (kg) x TBSA (%)',
      bullets: [
        'Administer half of the total calculated volume in the first 8 hours (calculated from the time of injury, not arrival).',
        'Administer the remaining half of the volume over the next 16 hours.',
        'The crystalloid of choice for resuscitation is Ringer\'s Lactate (RL).'
      ]
    },
    {
      id: 2,
      title: 'Blood Transfusion Guidelines & Reactions',
      category: 'Clinical Nursing / Safety',
      highlight: 'Complete transfusion within 4 hours maximum to avoid bacterial growth.',
      bullets: [
        'Must verify patient identity and blood bag details with 2 registered nurses prior to administration.',
        'Run the infusion slowly at 2 to 5 mL/min for the first 15 minutes to monitor for immediate reactions.',
        'Closely monitor for hemolytic reactions (chills, severe lower back pain, dyspnea, fever, hypotension).',
        'If a reaction occurs: Stop infusion immediately, disconnect tubing, run normal saline via new tubing, and notify provider.'
      ]
    },
    {
      id: 3,
      title: 'ABG Systematic Interpretation',
      category: 'Acid-Base / Critical Care',
      highlight: 'pH: 7.35–7.45 | PaCO2: 35–45 mmHg | HCO3-: 22–26 mEq/L',
      bullets: [
        'pH < 7.35 indicates acidosis; pH > 7.45 indicates alkalosis.',
        'PaCO2 represents the respiratory component (normal range: 35 to 45 mmHg).',
        'HCO3- represents the metabolic component (normal range: 22 to 26 mEq/L).',
        'Match pH direction with PaCO2 and HCO3- changes to diagnose. Assess other systems for partial or full compensation.'
      ]
    },
    {
      id: 4,
      title: 'Glasgow Coma Scale (GCS)',
      category: 'Neurology / Assessment',
      highlight: 'GCS ≤ 8 = Coma (Airway protection required: "Less than 8, intubate!")',
      bullets: [
        'Maximum GCS score is 15 (fully awake); minimum score is 3 (deep coma/brain death).',
        'Eye Opening (1-4): Spontaneous (4), To sound (3), To pressure/pain (2), None (1).',
        'Verbal Response (1-5): Oriented (5), Confused (4), Words (3), Sounds (2), None (1).',
        'Motor Response (1-6): Obeys command (6), Localizing (5), Normal flexion (4), Abnormal flexion/decorticate (3), Extension/decerebrate (2), None (1).'
      ]
    },
    {
      id: 5,
      title: 'IV Fluid Tonics (Hypo, Hyper, Isotonic)',
      category: 'Fluids & Electrolytes',
      highlight: 'Isotonic: stays in vessel | Hypotonic: swells cells | Hypertonic: shrinks cells',
      bullets: [
        'Isotonic (0.9% NS, Ringer\'s Lactate): Equal osmolarity to blood. Expands intravascular volume. Used for fluid deficits.',
        'Hypotonic (0.45% NS, 2.5% Dextrose): Lower osmolarity. Fluid shifts out of vessels into cells, causing cells to swell. Used for intracellular dehydration.',
        'Hypertonic (3% NS, 5% NS, D5NS): Higher osmolarity. Fluid shifts out of cells into vascular space, causing cells to shrink. Monitor closely for circulatory overload and pulmonary edema.'
      ]
    },
    {
      id: 6,
      title: 'Chest Tube Drainage Monitoring',
      category: 'Respiratory / Critical Care',
      highlight: 'Continuous bubbling in water seal chamber = Air Leak!',
      bullets: [
        'Tidaling (fluctuations in the water level matching respiration) is normal. If tidaling stops, the lung has either fully re-expanded or the tube is kinked/blocked.',
        'Continuous bubbling in the water seal chamber indicates an air leak in the chest tube system or pleural space.',
        'Intermittent bubbling is normal in patients with a pneumothorax during coughing or deep breathing.',
        'Never clamp a chest tube without a physician\'s order or during accidental system disconnection, as it can cause a tension pneumothorax.'
      ]
    },
    {
      id: 7,
      title: 'Tracheostomy Suctioning Standards',
      category: 'Respiratory / Clinical Skills',
      highlight: 'Maximum suctioning time: 10-15 seconds | Pre-oxygenate with 100% O2',
      bullets: [
        'Hyperoxygenate the patient with 100% O2 for at least 30-60 seconds prior to inserting the suction catheter.',
        'Limit suction time to 10-15 seconds per pass to prevent severe hypoxia and vagal nerve stimulation.',
        'Apply suction intermittently ONLY while withdrawing and rotating the catheter. Never apply suction during insertion.',
        'Allow at least 1 minute between suction passes, limiting total passes to a maximum of 3.'
      ]
    },
    {
      id: 8,
      title: 'Digoxin Toxicity Signs',
      category: 'Pharmacology / Cardiology',
      highlight: 'Therapeutic Range: 0.5–2.0 ng/mL | Hold if Apical Pulse < 60 bpm',
      bullets: [
        'Early toxicity signs are gastrointestinal: anorexia, nausea, vomiting, and diarrhea.',
        'Late/neuro-visual toxicity signs include fatigue, muscle weakness, blurred vision, and yellow-green halos around lights.',
        'Hypokalemia (low potassium) significantly increases the risk of digoxin toxicity. Monitor serum potassium closely.',
        'Always assess the apical pulse rate for a full 60 seconds before administering; hold if <60 bpm in adults.'
      ]
    },
    {
      id: 9,
      title: 'Anticoagulant Monitoring & Antidotes',
      category: 'Pharmacology / Hematology',
      highlight: 'Heparin antidote: Protamine Sulfate | Warfarin antidote: Vitamin K',
      bullets: [
        'Unfractionated Heparin: Monitored via activated partial thromboplastin time (aPTT). Normal range is 30-40 sec; therapeutic range is 1.5-2.5 times normal.',
        'Heparin Antidote: Protamine Sulfate.',
        'Warfarin (Coumadin): Monitored via Prothrombin Time (PT) and International Normalized Ratio (INR). Therapeutic target INR is usually 2.0-3.0.',
        'Warfarin Antidote: Vitamin K (phytonadione).'
      ]
    },
    {
      id: 10,
      title: 'Potassium Chloride IV Infusion Rules',
      category: 'Fluids & Electrolytes / Safety',
      highlight: 'CRITICAL: NEVER give Potassium Chloride via IV push or bolus (causes cardiac arrest)!',
      bullets: [
        'Maximum standard infusion rate is 10 mEq/hour. Always administer via an electronic infusion pump.',
        'Verify adequate renal function: check that urine output is at least 30 mL/hour before starting potassium infusion.',
        'KCl is highly irritating to peripheral veins. Assess the IV insertion site hourly for infiltration, phlebitis, or burning.'
      ]
    },
    {
      id: 11,
      title: 'Magnesium Sulfate in Preeclampsia',
      category: 'Obstetrics / Pharmacology',
      highlight: 'Antidote: Calcium Gluconate (keep at bedside)',
      bullets: [
        'Administered to preeclamptic patients as a central nervous system depressant to prevent seizures (eclampsia), not as an antihypertensive.',
        'Monitor for magnesium toxicity: loss of deep tendon reflexes (patellar), respiratory rate < 12 breaths/min, and urine output < 30 mL/hour.',
        'Therapeutic blood serum magnesium level is 4 to 7 mEq/L.'
      ]
    },
    {
      id: 12,
      title: 'Cushing\'s Triad (ICP indicator)',
      category: 'Neurology / Critical Care',
      highlight: 'Sign of brainstem herniation due to severely increased intracranial pressure (ICP)',
      bullets: [
        '1. Systolic hypertension with a widened pulse pressure (rising systolic, stable diastolic).',
        '2. Bradycardia (slow, bounding heart rate).',
        '3. Bradypnea (slow, irregular, or Cheyne-Stokes breathing patterns).',
        'This is a late sign of intracranial hypertension and constitutes a medical emergency.'
      ]
    },
    {
      id: 13,
      title: 'Cranial Nerve VII (Facial)',
      category: 'Anatomy / Neurology',
      highlight: 'Cranial Nerve VII regulates facial expression muscles and taste on anterior 2/3 of tongue.',
      bullets: [
        'Tested clinically by asking the patient to smile, frown, raise eyebrows, close eyes tightly, and puff out their cheeks.',
        'Assessed in patients suspected of Bell\'s Palsy or stroke. Look for unilateral facial droop, asymmetry, or inability to close one eye.',
        'Stroke typically spares the forehead muscles, whereas Bell\'s Palsy affects both the upper and lower face.'
      ]
    },
    {
      id: 14,
      title: 'Left-Sided Heart Failure symptoms',
      category: 'Cardiology / Assessment',
      highlight: 'Left-Sided Failure = Pulmonary Congestion ("L" for Lungs)',
      bullets: [
        'Blood backs up into the left atrium and pulmonary veins, increasing pulmonary capillary pressure.',
        'Assessment findings: dyspnea on exertion, orthopnea (difficulty breathing lying flat), paroxysmal nocturnal dyspnea (PND).',
        'Auscultation reveals crackles (pulmonary edema), and the patient may cough up pink, frothy sputum.'
      ]
    },
    {
      id: 15,
      title: 'Right-Sided Heart Failure symptoms',
      category: 'Cardiology / Assessment',
      highlight: 'Right-Sided Failure = Systemic Congestion ("R" for Rest of body)',
      bullets: [
        'Blood backs up into the right atrium and systemic venous circulation.',
        'Assessment findings: Jugular Venous Distention (JVD) at 45-degree bed elevation.',
        'Systemic fluid retention leads to dependent peripheral edema, ascites, hepatomegaly (tender liver), and splenomegaly.'
      ]
    },
    {
      id: 16,
      title: 'Appendicitis Physical Markers',
      category: 'Gastrointestinal / Assessment',
      highlight: 'Avoid applying heat or administering laxatives (increases risk of appendix rupture)',
      bullets: [
        'Pain localizes in the Right Lower Quadrant (RLQ) at McBurney\'s point (located 1/3 the distance from the anterior superior iliac spine to the umbilicus).',
        'Rebound Tenderness: Pain intensifies upon the sudden release of deep pressure in the abdominal wall.',
        'Rovsing\'s Sign: Deep palpation of the Left Lower Quadrant (LLQ) elicits pain in the Right Lower Quadrant (RLQ).',
        'Keep patient NPO in preparation for emergency appendectomy.'
      ]
    },
    {
      id: 17,
      title: 'Pulmonary Embolism Prevention',
      category: 'Clinical Nursing / Surgical Care',
      highlight: 'Pulmonary Embolism (PE) is a life-threatening blockage of a pulmonary artery.',
      bullets: [
        'Encourage early post-operative mobilization and active/passive range-of-motion exercises.',
        'Apply Sequential Compression Devices (SCDs) or anti-embolism stockings to venous vessels.',
        'Administer prophylactic low-molecular-weight heparin (Enoxaparin/Lovenox) as ordered.',
        'Never massage the calves of a patient suspected of a Deep Vein Thrombosis (DVT), as this can dislodge the clot.'
      ]
    },
    {
      id: 18,
      title: 'Diabetic Ketoacidosis (DKA) Features',
      category: 'Endocrine / Critical Care',
      highlight: 'Glucose > 300 mg/dL | Metabolic Acidosis | Ketones Present',
      bullets: [
        'Severe hyperglycemia is caused by insulin deficiency. Ketone bodies accumulate in blood and urine.',
        'Causes metabolic acidosis: blood pH < 7.35 and serum HCO3- < 15 mEq/L.',
        'Characterized by Kussmaul respirations (deep, rapid breathing to blow off CO2) and a fruity breath odor (acetone).',
        'Treatment priority: IV fluids (0.9% NS) for dehydration first, followed by regular insulin IV infusion.'
      ]
    },
    {
      id: 19,
      title: 'Epinephrine Concentrations',
      category: 'Pharmacology / Emergency',
      highlight: 'IM Concentration = 1:1000 (1 mg/mL) | IV Concentration = 1:10,000 (0.1 mg/mL)',
      bullets: [
        'Anaphylactic Shock: Administer Epinephrine 1:1000 concentration via the Intramuscular (IM) route (typically in the vastus lateralis).',
        'Cardiac Arrest (CPR): Administer Epinephrine 1:10,000 concentration via the Intravenous (IV) or Intraosseous (IO) route.',
        'Intravenous administration of 1:1000 Epinephrine is highly dangerous and can trigger severe dysrhythmias and myocardial infarction.'
      ]
    },
    {
      id: 20,
      title: 'Lithium Carbonate Monitoring',
      category: 'Mental Health / Pharmacology',
      highlight: 'Therapeutic Index: 0.6–1.2 mEq/L (Toxicity begins > 1.5 mEq/L)',
      bullets: [
        'Instruct the patient to maintain a normal dietary sodium and fluid intake. Hyponatremia (low sodium) causes lithium retention and toxicity.',
        'Monitor for signs of mild toxicity: fine hand tremors, polyuria, polydipsia, and mild nausea.',
        'Monitor for signs of severe toxicity: coarse hand tremors, vomiting, diarrhea, slurred speech, ataxia, and confusion.',
        'Long-term treatment can cause hypothyroidism and nephrogenic diabetes insipidus (monitor TSH and renal function).'
      ]
    },
    {
      id: 21,
      title: 'Tensilon Test in Myasthenia Gravis',
      category: 'Neurology / Diagnostics',
      highlight: 'Tensilon (Edrophonium) administration: Improvement = Myasthenic Crisis; Worsening = Cholinergic Crisis',
      bullets: [
        'Myasthenia Gravis is an autoimmune disease causing destruction of acetylcholine receptors at the neuromuscular junction.',
        'Edrophonium chloride (Tensilon) is a rapid, short-acting acetylcholinesterase inhibitor used to diagnose MG.',
        'If muscle strength improves significantly within 30-60 seconds, it is a Myasthenic Crisis (requires more anticholinesterase medication).',
        'If muscle weakness worsens or flaccid paralysis occurs, it is a Cholinergic Crisis (overdosage; immediately administer antidote: Atropine Sulfate).'
      ]
    },
    {
      id: 22,
      title: 'Cardiac Biomarkers (MI Indicators)',
      category: 'Cardiology / Diagnostics',
      highlight: 'Troponin I is the most sensitive and specific indicator of myocardial injury.',
      bullets: [
        'Troponin I: Rises within 3 to 4 hours, peaks at 12 to 24 hours, and remains elevated for 7 to 14 days (ideal for late diagnosis).',
        'CK-MB (Creatine Kinase-MB): Rises in 4 to 6 hours, peaks at 18 to 24 hours, and returns to normal in 2 to 3 days (ideal for detecting re-infarction).',
        'Myoglobin: Rises earliest (within 1 to 3 hours) but is highly non-specific as it is found in all muscle tissue.',
        'Always obtain serial cardiac enzymes (usually drawn every 6 to 8 hours for 24 hours).'
      ]
    },
    {
      id: 23,
      title: 'Cranial Nerves Summary & Test Methods',
      category: 'Neurology / Assessment',
      highlight: 'CN I to XII regulate motor and sensory function of the head and neck.',
      bullets: [
        'CN I (Olfactory): Sensory for smell. Test by asking the patient to identify non-irritating odors (e.g., coffee, mint) with eyes closed.',
        'CN II (Optic): Sensory for vision. Test visual acuity using a Snellen chart and peripheral visual fields.',
        'CN III, IV, VI (Oculomotor, Trochlear, Abducens): Motor for extraocular movements and pupillary constriction (CN III). Test six cardinal fields of gaze and pupillary response (PERRLA).',
        'CN V (Trigeminal): Sensory to face, motor to muscles of mastication. Test facial sensation with a cotton wisp and ask to clench teeth.'
      ]
    },
    {
      id: 24,
      title: 'Insulin Action Profiles (Onset, Peak, Duration)',
      category: 'Endocrine / Pharmacology',
      highlight: 'CRITICAL: Monitor for hypoglycemia during the peak action time of the administered insulin!',
      bullets: [
        'Rapid-Acting (Lispro/Aspart/Glulisine): Onset: 15 min | Peak: 1-2 hours | Duration: 3-4 hours. Give within 15 minutes of a meal.',
        'Short-Acting (Regular Insulin): Onset: 30-60 min | Peak: 2-4 hours | Duration: 5-8 hours. The only insulin that can be given IV.',
        'Intermediate-Acting (NPH): Onset: 1-2 hours | Peak: 4-12 hours | Duration: 18-24 hours. Cloudy suspension; must roll gently to mix.',
        'Long-Acting (Glargine/Detemir): Onset: 1-2 hours | Peak: None (peakless, flat plateau) | Duration: 24 hours. Do not mix with other insulins in the same syringe.'
      ]
    },
    {
      id: 25,
      title: 'Hyperkalemia vs. Hypokalemia',
      category: 'Fluids & Electrolytes',
      highlight: 'Potassium range: 3.5–5.0 mEq/L | Key regulator of cardiac electrical conduction',
      bullets: [
        'Hyperkalemia (>5.0 mEq/L): Causes: renal failure, potassium-sparing diuretics, burn injury. ECG: Tall peaked T-waves, widened QRS, flat P-waves. Treatment: Calcium Gluconate (protects heart), insulin + dextrose, Sodium Polystyrene Sulfonate (Kayexalate).',
        'Hypokalemia (<3.5 mEq/L): Causes: vomiting, loop diuretics (Furosemide), Cushing\'s syndrome. ECG: Flat/inverted T-waves, prominent U-waves, ST depression.',
        'Never give potassium IV push; dilute and infuse slowly (max 10 mEq/hr peripherally).'
      ]
    },
    {
      id: 26,
      title: 'Hypocalcemia Indicators (Chvostek & Trousseau)',
      category: 'Fluids & Electrolytes / Assessment',
      highlight: 'Calcium range: 9.0–10.5 mg/dL | Signs of neuromuscular irritability',
      bullets: [
        'Hypocalcemia (<9.0 mg/dL) causes tetany and increased neuromuscular excitability.',
        'Chvostek\'s Sign: Tapping the facial nerve in front of the earlobe triggers spasm/twitching of facial muscles on the same side.',
        'Trousseau\'s Sign: Inflating a blood pressure cuff on the upper arm above systolic pressure for 3 minutes causes carpopedal spasm (adduction of thumb, flexion of fingers).',
        'Treatment: Administer IV Calcium Gluconate slowly; monitor ECG for bradycardia and QT prolongation.'
      ]
    },
    {
      id: 27,
      title: 'Shock States: CVP and Hemodynamics',
      category: 'Critical Care / Cardiology',
      highlight: 'CVP indicates right ventricular preload (Normal: 2–8 mmHg)',
      bullets: [
        'Hypovolemic Shock: Caused by blood/fluid loss. Low CVP, low cardiac output, elevated heart rate, and high systemic vascular resistance (SVR). Treatment: IV crystalloids and blood products.',
        'Cardiogenic Shock: Caused by pump failure (e.g., severe MI). Elevated CVP, elevated Pulmonary Artery Wedge Pressure (PAWP), low cardiac output. Treatment: Inotropes (Dobutamine) and vasodilators.',
        'Septic/Anaphylactic/Neurogenic Shock (Distributive): Massive vasodilation. Low SVR, variable CVP. Anaphylaxis treatment: Epinephrine IM.'
      ]
    },
    {
      id: 28,
      title: 'Peripheral Vascular Disease: Arterial vs. Venous',
      category: 'Cardiology / Vascular',
      highlight: 'Arterial = Decreased flow to extremities | Venous = Decreased return to heart',
      bullets: [
        'Peripheral Arterial Disease (PAD): Intermittent claudication (muscle pain during walk, relieved by rest). Extremities are cool, pale/cyanotic, with weak pulses. Skin is shiny and hairless. Elevating legs increases pain; hanging legs down (rubor) relieves it.',
        'Chronic Venous Insufficiency (CVI): Dull, achy pain. Extremities are warm, with thick/tough skin showing brown pigmentation (hemosiderin staining). Edema is present. Elevating legs relieves pain and promotes drainage.',
        'Ulcerations: Arterial ulcers are circular, deep, and dry (toes/heels); Venous ulcers are irregular, shallow, and wet (medial malleolus).'
      ]
    },
    {
      id: 29,
      title: 'Pediatric Milestones: Ages 1 to 5 Years',
      category: 'Pediatric Nursing',
      highlight: 'Key physical, motor, and cognitive milestones dictate healthy development.',
      bullets: [
        '1 Year: Walks with assistance, says 2-3 single words, uses neat pincer grasp, stacks 2 blocks.',
        '2 Years: Walks up/down stairs one step at a time, runs, speaks in 2-3 word phrases, stacks 6 blocks, engages in parallel play.',
        '3 Years: Rides a tricycle, goes up stairs alternating feet, copies a circle, stacks 9-10 blocks, toilet trained (daytime), asks "why".',
        '4-5 Years: Hops on one foot, throws ball overhead, uses scissors, speaks in complete sentences, ties shoelaces (by age 5).'
      ]
    },
    {
      id: 30,
      title: 'MAOI Interactions & Tyramine Restrictions',
      category: 'Mental Health / Pharmacology',
      highlight: 'MAOIs + Tyramine = Severe Hypertensive Crisis!',
      bullets: [
        'Monoamine Oxidase Inhibitors (MAOIs) include Phenelzine, Tranylcypromine, and Isocarboxazid.',
        'These drugs prevent the breakdown of norepinephrine, serotonin, and dopamine in the synaptic cleft.',
        'Eating tyramine-rich foods causes massive release of norepinephrine, leading to severe vasoconstriction, pounding headache, and malignant hypertension.',
        'Restrict: Aged cheeses, red wine/beer, processed/cured meats (salami, sausage), bananas, avocados, and yeast extracts.'
      ]
    },
    {
      id: 31,
      title: 'Pyloric Stenosis (Pediatric Highlight)',
      category: 'Pediatric / Gastrointestinal',
      highlight: 'Classic triad: Projectile non-bilious vomiting, olive-shaped mass, peristaltic waves',
      bullets: [
        'Pyloric stenosis is the hypertrophy and hyperplasia of the pyloric sphincter, causing stomach outlet obstruction in infants.',
        'Usually presents between 2 to 8 weeks of life with progressive, non-bilious projectile vomiting immediately after feeding.',
        'Assessment: Palpable olive-shaped mass in the right upper quadrant, and visible left-to-right gastric peristaltic waves.',
        'Nursing Priorities: Correct dehydration and electrolyte imbalances (hypokalemic hypochloric metabolic alkalosis) prior to pyloromyotomy surgery.'
      ]
    },
    {
      id: 32,
      title: 'Autonomic Dysreflexia (SCI Emergency)',
      category: 'Neurology / Critical Care',
      highlight: 'Medical emergency occurring in spinal cord injuries at or above T6.',
      bullets: [
        'Triggered by a noxious stimulus below the level of spinal injury, most commonly a distended bladder, fecal impaction, or tight clothing.',
        'Sympathetic surge below injury causes severe, sudden vasoconstriction leading to life-threatening hypertension.',
        'Baroreceptors trigger a parasympathetic response above injury, causing bradycardia, facial flushing, sweating, and headache.',
        'Immediate interventions: Elevate head of bed to 90 degrees (high-Fowler\'s) to induce orthostatic pooling, loosen clothing, identify/remove stimulus, and administer antihypertensives if BP remains high.'
      ]
    },
    {
      id: 33,
      title: 'Acute Epiglottitis Hallmarks',
      category: 'Pediatric / Respiratory',
      highlight: 'CRITICAL: Never inspect the throat with a tongue depressor/blade if epiglottitis is suspected!',
      bullets: [
        'Epiglottitis is a rapidly progressive bacterial infection (most commonly Haemophilus influenzae type B) causing airway swelling.',
        'Key clinical signs - The 4 D\'s: Drooling, Dysphagia (difficulty swallowing), Dysphonia (muffled voice), Distress (stridor, retractions).',
        'Child characteristically sits in the "tripod position" (leaning forward with neck hyperextended and mouth open) to maximize airflow.',
        'Nursing action: Keep the child calm and prepare for emergency intubation/tracheostomy. Avoid direct throat manipulation as it can trigger laryngospasm.'
      ]
    },
    {
      id: 34,
      title: 'Thyroid Storm vs. Myxedema Coma',
      category: 'Endocrine / Critical Care',
      highlight: 'Thyroid Storm = Hyperactive state | Myxedema Coma = Hypoactive state',
      bullets: [
        'Thyroid Storm (Extreme Hyperthyroidism): Triggered by stress, infection, or thyroid surgery. Symptoms: Hyperthermia (fever >104F), extreme tachycardia, agitation, delirium, diarrhea, tremors. Treatment: PTU, Beta-blockers, iodine, cooling blankets.',
        'Myxedema Coma (Extreme Hypothyroidism): Triggered by cold exposure, abrupt medication cessation, or illness. Symptoms: Hypothermia, bradycardia, severe hypotension, hypoventilation, generalized edema. Treatment: IV Levothyroxine, airway support, warm blankets.'
      ]
    },
    {
      id: 35,
      title: 'Cranial Nerve X (Vagus Nerve) Clinical Notes',
      category: 'Neurology / Physiology',
      highlight: 'The longest cranial nerve, providing extensive parasympathetic innervation.',
      bullets: [
        'Regulates cardiac heart rate, bronchoconstriction, and gastrointestinal motility.',
        'Vagal Stimulation (e.g., bearing down, carotid massage, coughing) slows conduction through the AV node, lowering heart rate.',
        'Test clinically by asking the patient to say "ah" and observing for symmetrical elevation of the soft palate and uvula.',
        'Damage results in hoarseness, dysphagia, and deviation of the uvula to the unaffected (opposite) side.'
      ]
    },
    {
      id: 36,
      title: 'Ototoxicity and Cranial Nerve VIII',
      category: 'Pharmacology / Neurology',
      highlight: 'CN VIII (Vestibulocochlear) damage causes hearing loss and equilibrium loss.',
      bullets: [
        'CN VIII has two branches: cochlear (hearing) and vestibular (balance). Test using the whisper test, Rinne/Weber tests, and Romberg test.',
        'Aminoglycoside antibiotics (e.g., Gentamicin, Amikacin, Neomycin) are highly ototoxic and nephrotoxic.',
        'Loop diuretics (e.g., Furosemide) administered too rapidly via IV push can cause transient or permanent tinnitus and hearing loss.',
        'Instruct patients to report ringing in ears (tinnitus), vertigo, or balance issues immediately.'
      ]
    },
    {
      id: 37,
      title: 'Hyperthyroidism vs. Hypothyroidism',
      category: 'Endocrine / Assessment',
      highlight: 'Hyperthyroidism = Metabolism accelerated | Hypothyroidism = Metabolism slowed',
      bullets: [
        'Hyperthyroidism (Graves\' Disease): High T3/T4, low TSH. Symptoms: weight loss, heat intolerance, diarrhea, smooth skin, anxiety, tachycardia, exophthalmos (bulging eyes).',
        'Hypothyroidism (Hashimoto\'s Disease): Low T3/T4, high TSH. Symptoms: weight gain, cold intolerance, constipation, dry skin, fatigue, bradycardia, myxedema (waxy non-pitting edema).',
        'Treatments: Hyperthyroidism = Methimazole/PTU, radioactive iodine, thyroidectomy. Hypothyroidism = Levothyroxine (Synthroid) taken in the morning on an empty stomach.'
      ]
    },
    {
      id: 38,
      title: 'Parkinson\'s Disease Triad & Care',
      category: 'Neurology / Chronic Care',
      highlight: 'Parkinson\'s is caused by degeneration of dopamine-producing neurons in the substantia nigra.',
      bullets: [
        'Classical Triad: Tremor (worse at rest, "pill-rolling"), Muscle Rigidity (cogwheel rigidity), Bradykinesia (slow movements).',
        'Assessment shows a shuffling gait with loss of postural reflexes, mask-like facial expression, and micrographic handwriting.',
        'Treatment: Carbidopa-Levodopa (increases dopamine levels). Avoid foods high in protein/vitamin B6 as they decrease absorption.',
        'Nursing care: Encourage independence, use velcro closures, clear paths to prevent falls, and schedule medications on time.'
      ]
    },
    {
      id: 39,
      title: 'Multiple Sclerosis (MS) & Charcot\'s Triad',
      category: 'Neurology / Chronic Care',
      highlight: 'Autoimmune demyelination of the central nervous system (brain and spinal cord).',
      bullets: [
        'Characterized by periods of exacerbation and remission. Triggered by fatigue, stress, pregnancy, and temperature extremes.',
        'Charcot\'s Neurologic Triad: 1. Nystagmus (involuntary eye movements), 2. Intention tremor (tremor during voluntary movement), 3. Scanning speech (slurred, spaced words).',
        'Other symptoms include optic neuritis (vision loss), muscle weakness, paresthesias, and urinary incontinence.',
        'Nursing action: Promote energy conservation, avoid hot baths (Uthoff\'s sign - symptoms worsen with heat), and administer immunomodulators.'
      ]
    },
    {
      id: 40,
      title: 'COPD Oxygen Therapy & Hypoxic Drive',
      category: 'Respiratory / Chronic Care',
      highlight: 'Target O2 saturation in severe COPD is typically 88% to 92%.',
      bullets: [
        'In healthy individuals, the primary stimulus to breathe is elevated arterial carbon dioxide (hypercapnia).',
        'In chronic hypercapnic patients (severe COPD), the respiratory center becomes desensitized to high CO2 levels.',
        'Their primary stimulus to breathe becomes low oxygen levels (hypoxic drive), detected by peripheral chemoreceptors.',
        'Administering excessive oxygen can elevate arterial O2, eliminating their hypoxic drive and inducing hypoventilation/respiratory arrest.'
      ]
    },
    {
      id: 41,
      title: 'Rheumatoid Arthritis vs. Osteoarthritis',
      category: 'Musculoskeletal / Assessment',
      highlight: 'RA is systemic and inflammatory | OA is localized and degenerative',
      bullets: [
        'Rheumatoid Arthritis (RA): Autoimmune, bilateral/symmetrical joint involvement. Morning stiffness lasts > 1 hour. Joints are warm, swollen, and painful. Systemic symptoms: fatigue, fever, organ involvement. Features swan-neck and boutonniere deformities.',
        'Osteoarthritis (OA): Degenerative "wear-and-tear", asymmetrical joint involvement. Stiffness resolves within 30 minutes of waking. Exacerbated by use, relieved by rest. Features Heberden\'s nodes (distal joints) and Bouchard\'s nodes (proximal joints).'
      ]
    },
    {
      id: 42,
      title: 'Glomerulonephritis vs. Nephrotic Syndrome',
      category: 'Renal / Assessment',
      highlight: 'Glomerulonephritis = Inflammatory damage | Nephrotic Syndrome = Massive protein leak',
      bullets: [
        'Acute Glomerulonephritis (Nephritic): Often follows group A beta-hemolytic streptococcal infection. Key findings: Mild proteinuria, hematuria ("cola-colored" or smoky urine), oliguria, hypertension, and periorbital edema.',
        'Nephrotic Syndrome: Glomerular basement membrane hyperpermeability. Key findings: Massive proteinuria (>3.5g/24hr), severe hypoalbuminemia, generalized edema (anasarca), hyperlipidemia, and frothy beer-like urine.',
        'Nursing care: Weigh daily, monitor fluid balance, limit sodium, and administer corticosteroids as prescribed.'
      ]
    },
    {
      id: 43,
      title: 'AHA CPR Guidelines (Basic Life Support)',
      category: 'Emergency / Safety',
      highlight: 'Adult compression-to-ventilation ratio: 30:2 (for single or double rescuers)',
      bullets: [
        'Compression Rate: 100 to 120 compressions per minute.',
        'Compression Depth: 2 to 2.4 inches (5 to 6 cm) in adults, allowing complete chest recoil between compressions.',
        'Infant CPR: Compression depth is 1.5 inches (4 cm). Ratio is 30:2 for a single rescuer and 15:2 for two healthcare rescuers.',
        'Minimize interruptions to chest compressions; check pulse and rhythm for no more than 10 seconds every 2 minutes (5 cycles).'
      ]
    },
    {
      id: 44,
      title: 'Chest Tube Emergency Protocols',
      category: 'Respiratory / Emergency',
      highlight: 'Be prepared for accidental system disconnection or tube displacement.',
      bullets: [
        'If the chest tube becomes disconnected from the drainage system: Immediately submerge the distal end of the tube in 1-2 inches of sterile water or saline to create a temporary water seal and prevent air entry.',
        'If the chest tube is accidentally pulled out of the patient\'s chest: Immediately cover the site with a sterile occlusive dressing (e.g., Vaseline gauze) and tape it securely on THREE sides.',
        'Taping on three sides creates a flutter valve, allowing air to escape the pleural space but preventing atmospheric air from entering.'
      ]
    },
    {
      id: 45,
      title: 'Transmission-Based Isolation Precautions',
      category: 'Infection Control / Safety',
      highlight: 'Always wear appropriate Personal Protective Equipment (PPE) based on transmission route.',
      bullets: [
        'Airborne (Measles, Chickenpox/Varicella, Tuberculosis): Requires a private, negative-pressure room with 6-12 air exchanges/hour. Wear an N95 respirator mask.',
        'Droplet (Influenza, Pertussis, Meningitis, Mumps): Requires a private room or cohorting. Wear a standard surgical mask when within 3 feet of the patient.',
        'Contact (MRSA, VRE, C. difficile): Requires private room, gowns, and gloves. Wash hands with soap and water (not alcohol gel) for C. diff.'
      ]
    },
    {
      id: 46,
      title: 'Disaster Triage Color Coding',
      category: 'Emergency / Public Health',
      highlight: 'Goal: Do the greatest good for the greatest number of casualties.',
      bullets: [
        'RED (Immediate): Life-threatening injuries but salvageable with quick intervention (e.g., tension pneumothorax, airway obstruction, shock).',
        'YELLOW (Delayed): Significant injuries requiring care but can wait 1-2 hours without immediate threat to life (e.g., stable fractures, large lacerations without active hemorrhage).',
        'GREEN (Minor): "Walking wounded" with minor injuries; can delay treatment for hours.',
        'BLACK (Expectant): Deceased or unsalvageable injuries (e.g., massive head trauma, deep burns over 90% body, pulselessness).'
      ]
    },
    {
      id: 47,
      title: 'Rule of Nines for Burn Calculation',
      category: 'Trauma / Critical Care',
      highlight: 'Divides the body into sections representing 9% (or multiples of 9%) of total body surface area.',
      bullets: [
        'Head and Neck: 9% total (4.5% anterior, 4.5% posterior).',
        'Torso (Trunk): 36% total (18% anterior chest/abdomen, 18% posterior back).',
        'Each Arm: 9% total (4.5% anterior, 4.5% posterior).',
        'Each Leg: 18% total (9% anterior, 9% posterior).',
        'Perineum (Genitals): 1% total.',
        'Use only partial-thickness (2nd degree) and full-thickness (3rd degree) burns in calculations.'
      ]
    },
    {
      id: 48,
      title: 'Trigeminal Neuralgia (CN V)',
      category: 'Neurology / Chronic Care',
      highlight: 'Characterized by severe, sharp, stabbing, shock-like facial pain.',
      bullets: [
        'Pain is localized along the branches of the trigeminal nerve (usually ophthalmic, maxillary, or mandibular).',
        'Triggered by minimal sensory stimuli: light touch, washing the face, brushing teeth, eating, drinking, or cold drafts.',
        'First-line pharmacological treatment is Carbamazepine (Tegretol), an anticonvulsant. Monitor CBC for bone marrow suppression.',
        'Nursing care: Instruct patient to wash face with warm water and cotton pads, chew on the unaffected side, and eat soft, warm foods.'
      ]
    },
    {
      id: 49,
      title: 'Meningitis Signs: Kernig & Brudzinski',
      category: 'Neurology / Assessment',
      highlight: 'Indicative of meningeal irritation / inflammation.',
      bullets: [
        'Meningitis is inflammation of the meninges surrounding the brain and spinal cord, caused by bacterial or viral infection.',
        'Kernig\'s Sign: With the patient supine, flex the hip and knee to 90 degrees. Attempting to extend the knee triggers severe pain and resistance in the hamstring.',
        'Brudzinski\'s Sign: Flexing the patient\'s neck toward the chest triggers involuntary flexion of the patient\'s hips and knees.',
        'Nursing Priorities: Initiate droplet precautions immediately for suspected bacterial meningitis, monitor for increased ICP, and prepare for lumbar puncture.'
      ]
    },
    {
      id: 50,
      title: 'Liver Cirrhosis & Portal Hypertension',
      category: 'Gastrointestinal / Chronic Care',
      highlight: 'Complications: Esophageal varices, ascites, and hepatic encephalopathy.',
      bullets: [
        'Portal Hypertension: Scarring of liver blocks blood flow, raising portal vein pressure. Leads to collateral vessel formation (esophageal varices). Variceal rupture is a life-threatening hemorrhage.',
        'Hepatic Encephalopathy: Failing liver cannot convert ammonia (a neurotoxin byproduct of protein breakdown) to urea. Ammonia crosses blood-brain barrier.',
        'Encephalopathy findings: confusion, altered sleep patterns, and asterixis (bilateral flapping tremor of hands when arms are extended and wrists dorsiflexed).',
        'Treatment: Administer Lactulose to promote excretion of ammonia in the stool (aim for 2-3 soft stools per day).'
      ]
    }
  ];

  // 25 Sure-Shot Q&As Dataset
  const sureShotQs = [
    { q: "A patient with a head injury has a regular respiratory pattern followed by periods of apnea. How is this documented?", a: "Cheyne-Stokes Respiration.", exp: "Characterized by a gradual crescendo-decrescendo pattern of breathing separated by apneic phases, indicating deep bilateral cerebral hemisphere or brainstem impairment." },
    { q: "Which solution is used to clean a large blood spill on an ICU floor?", a: "10% Sodium Hypochlorite (Bleach) solution.", exp: "For substantial blood spills, a 1:10 dilution of sodium hypochlorite is required to effectively neutralize bloodborne pathogens like HIV, HBV, and HCV." },
    { q: "During CPR, what is the maximum recommended time allowed for interrupting chest compressions to check for a pulse or deliver breaths?", a: "Less than 10 seconds.", exp: "Minimizing interruptions ensures a high chest compression fraction, maintaining coronary and cerebral perfusion pressures during resuscitation." },
    { q: "A patient is scheduled for an intravenous pyelogram (IVP). Which pre-procedure assessment is the most critical priority?", a: "Assessing for allergies to iodine, shellfish, or contrast dye, and reviewing serum creatinine levels.", exp: "IVP uses iodine-based contrast media, which can trigger severe anaphylactoid reactions and cause contrast-induced nephropathy if baseline kidney function is impaired." },
    { q: "What is the priority nursing action when a patient’s central venous catheter accidentally becomes disconnected, and the patient suddenly develops severe dyspnea and cyanosis?", a: "Place the patient in the Left Lateral Trendelenburg position (Durant's Maneuver) and administer high-flow oxygen.", exp: "This position helps trap an air embolism in the apex of the right ventricle, preventing it from traveling into the pulmonary artery and obstructing blood flow." },
    { q: "A psychiatric patient has been taking Phenelzine (an MAOI). The nurse instructs the patient to strictly avoid which food item to prevent a hypertensive crisis?", a: "Aged cheese, yogurt, red wine, or processed meats (foods rich in Tyramine).", exp: "MAOIs inhibit the breakdown of tyramine. Elevated tyramine levels cause a massive release of norepinephrine, leading to severe vasoconstriction and dangerous spikes in blood pressure." },
    { q: "What is the primary clinical purpose of adding Positive End-Expiratory Pressure (PEEP) to the ventilator settings of an ARDS patient?", a: "To prevent alveolar collapse at the end of expiration and improve oxygenation.", exp: "PEEP keeps the alveoli open, expanding the surface area available for gas exchange and allowing for lower, safer fractions of inspired oxygen (FiO2) to prevent oxygen toxicity." },
    { q: "Which physical assessment finding confirms the presence of a patent arteriovenous (AV) fistula created for hemodialysis?", a: "Palpating a thrill and auscultating a bruit over the fistula site.", exp: "A thrill (vibration) and bruit (swishing sound) confirm high-velocity blood flow from the artery directly into the vein, verifying that the access site is patent." },
    { q: "A postpartum mother is diagnosed with deep vein thrombosis (DVT). Which clinical assessment technique is contraindicated due to safety concerns?", a: "Eliciting Homans' Sign (forcible dorsiflexion of the foot).", exp: "Homans' sign is unreliable and carrying out this maneuver can dislodge a thrombus, potentially causing a life-threatening pulmonary embolism." },
    { q: "A child with a history of asthma is brought to the emergency department in acute respiratory distress. On auscultation, the nurse notes a sudden disappearance of wheezing and diminished breath sounds. How should the nurse interpret this finding?", a: "The patient is experiencing \"Silent Chest Syndrome,\" a sign of impending respiratory failure.", exp: "The absence of wheezing during a severe asthma attack indicates that airflow is too limited to produce sound, signaling critical airway obstruction that requires immediate intubation." },
    { q: "What is the priority nursing action for a patient experiencing Autonomic Dysreflexia?", a: "Place the patient in a high-Fowler's position and check for bladder distension or bowel impaction.", exp: "Autonomic dysreflexia is a medical emergency in spinal cord injuries (T6 or above). Elevating the head of the bed decreases blood pressure through orthostatic pooling, while identifying and removing the noxious stimulus (usually a full bladder or impacted bowel) resolves the autonomic storm." },
    { q: "What is the drug of choice for treating status epilepticus?", a: "Intravenous Lorazepam (Ativan) or Diazepam (Valium).", exp: "Benzodiazepines act rapidly to enhance GABA inhibition in the central nervous system, stopping continuous seizure activity. This is followed by a long-acting anticonvulsant like Phenytoin." },
    { q: "Which clinical sign is expected in a pediatric patient with pyloric stenosis?", a: "Non-bilious projectile vomiting and an olive-shaped mass in the epigastrium.", exp: "Hypertrophy of the pyloric sphincter obstructs gastric outlet flow, leading to forceful projectile vomiting (typically non-bilious since it occurs before the duodenum) and a palpable olive-like mass." },
    { q: "What is the primary antidote for acetaminophen (paracetamol) poisoning?", a: "N-acetylcysteine (NAC / Mucomyst).", exp: "NAC restores hepatic glutathione levels, allowing the liver to safely metabolize and detoxify the hepatotoxic metabolite NAPQI." },
    { q: "What is the therapeutic range for serum Phenytoin (Dilantin)?", a: "10 to 20 mcg/mL.", exp: "Phenytoin has a narrow therapeutic index. Levels below 10 mcg/mL are subtherapeutic and increase seizure risk, while levels above 20 mcg/mL cause nystagmus, ataxia, and slurred speech." },
    { q: "A patient on mechanical ventilation has a low-pressure alarm. What should the nurse inspect first?", a: "Check for circuit disconnection, tubing leaks, or a deflated airway cuff.", exp: "Low-pressure alarms indicate a loss of pressure in the ventilator circuit, usually due to a disconnection between the ventilator tubing and the patient’s airway, or an underinflated endotracheal tube cuff." },
    { q: "A patient has a high-pressure ventilator alarm. What is the most common immediate cause?", a: "Secretions in the airway, biting on the tube, or tube kinking.", exp: "High-pressure alarms trigger when the ventilator meets resistance exceeding the pressure limit. Suctioning the airway, inserting a bite block, or straightening the tubing usually resolves the issue." },
    { q: "What is the classic clinical sign of Intussusception in infants?", a: "Red currant jelly stools and a sausage-shaped abdominal mass.", exp: "Intussusception involves telescoping of one bowel segment into another, causing lymphatic and venous obstruction. This leads to mucosal bleeding and mucus production, presenting as classic jelly-like stools." },
    { q: "What is the drug of choice for treating magnesium sulfate toxicity?", a: "Calcium Gluconate 10% IV.", exp: "Calcium antagonizes the neuromuscular blockade effects of hypermagnesemia, reversing respiratory depression and cardiac dysfunction." },
    { q: "Which landmark is used to measure the insertion length of a Nasogastric (NG) tube?", a: "From the tip of the nose, to the earlobe, to the xiphoid process (NEX measurement).", exp: "The NEX measurement approximates the anatomical distance required for the tube to pass through the esophagus and sit correctly in the stomach." },
    { q: "What clinical signs characterize Graves' disease (Hyperthyroidism)?", a: "Heat intolerance, weight loss despite increased appetite, tachycardia, and exophthalmos.", exp: "Excess circulating thyroid hormones (T3/T4) accelerate the metabolic rate, causing heat intolerance, weight loss, sympathetic overactivity (tachycardia), and retro-orbital tissue inflammation (exophthalmos)." },
    { q: "What is the key priority assessment for a patient diagnosed with Guillain-Barré Syndrome (GBS)?", a: "Respiratory rate, effort, and vital capacity.", exp: "GBS causes ascending muscle weakness and paralysis. As paralysis ascends to the diaphragm and intercostal muscles, respiratory failure can occur rapidly, making airway and ventilation monitoring the top priority." },
    { q: "Which medication is contraindicated in a patient with a history of asthma?", a: "Non-selective beta-blockers (e.g., Propranolol).", exp: "Non-selective beta-blockers block beta-2 receptors in the lungs, causing bronchial smooth muscle contraction and triggering life-threatening bronchoconstriction in asthmatics." },
    { q: "How is a positive Mantoux test (Tuberculin Skin Test) evaluated?", a: "Measuring the diameter of induration (palpable raised hardening) in millimeters, not the erythema (redness).", exp: "Induration is a delayed-type hypersensitivity reaction. An induration of 10 mm or more is considered positive in healthcare workers and high-risk populations, whereas 15 mm or more is positive in low-risk individuals." },
    { q: "What is the priority nursing action if a patient's chest tube accidentally becomes pulled out of the chest?", a: "Cover the insertion site immediately with a sterile occlusive dressing taped on three sides.", exp: "Taping the dressing on three sides creates a flutter-valve effect, allowing air to escape during expiration but preventing atmospheric air from entering the pleural space during inspiration, which prevents a tension pneumothorax." }
  ];

  // Filtering concepts based on search
  const currentConcepts = (conceptsLoaded && conceptsList.length > 0) ? conceptsList : coreConcepts;
  const filteredConcepts = currentConcepts.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.highlight && c.highlight.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.bullets.some(b => b.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Concepts Pagination logic
  const ITEMS_PER_PAGE_CONCEPTS = 10;
  const totalPagesConcepts = Math.max(1, Math.ceil(filteredConcepts.length / ITEMS_PER_PAGE_CONCEPTS));
  const displayedConcepts = filteredConcepts.slice(
    (conceptsPage - 1) * ITEMS_PER_PAGE_CONCEPTS,
    conceptsPage * ITEMS_PER_PAGE_CONCEPTS
  );

  // Sureshot Pagination logic
  const currentSureshotQs = (sureshotLoaded && sureshotList.length > 0) ? sureshotList : sureShotQs;
  const ITEMS_PER_PAGE_SURESHOT = 5;
  const totalPagesSureshot = Math.max(1, Math.ceil(currentSureshotQs.length / ITEMS_PER_PAGE_SURESHOT));
  const displayedSureshotQs = currentSureshotQs.slice(
    (sureshotPage - 1) * ITEMS_PER_PAGE_SURESHOT,
    sureshotPage * ITEMS_PER_PAGE_SURESHOT
  );

  if (loading && (activeTab === 'bookmarks' || activeTab === 'incorrect')) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-text text-sm font-medium">Loading Hub databases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in print:p-0">
      {/* Revision Hub Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span>Revision & Study Hub</span>
          </h2>
          <p className="text-muted-text text-sm">Access clinical calculators, high-yield system cards, exam Q&As, and your saved questions checklist.</p>
        </div>
        {onNavigateHome && (
          <button
            onClick={onNavigateHome}
            className="self-start sm:self-center px-4 py-2 border border-border bg-card hover:bg-muted-bg text-muted-text hover:text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            &larr; Exit Hub
          </button>
        )}
      </div>

      {/* Main Tabs Selection Navigation */}
      <div className="flex flex-wrap bg-muted-bg p-1 rounded-xl gap-1 print:hidden">
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'bookmarks' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text hover:text-foreground'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5 fill-current text-accent" />
          <span>Bookmarks ({bookmarkedList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('incorrect')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'incorrect' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text hover:text-foreground'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-danger" />
          <span>Mistake Log ({incorrectList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'notes' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text hover:text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>System Revision</span>
        </button>
        <button
          onClick={() => setActiveTab('concepts')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'concepts' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text hover:text-foreground'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-secondary" />
          <span>Top 50 Concepts</span>
        </button>
        <button
          onClick={() => setActiveTab('sureshot')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'sureshot' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text hover:text-foreground'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-primary" />
          <span>Sure-Shot Q&A</span>
        </button>
        <button
          onClick={() => setActiveTab('calculators')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'calculators' ? 'bg-card text-foreground shadow-sm' : 'text-muted-text hover:text-foreground'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-secondary" />
          <span>Clinical Calculators</span>
        </button>
      </div>

      {/* 1. BOOKMARKS TAB VIEW */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4 print:hidden">
          <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
            <div>
              <h4 className="font-bold text-sm text-foreground">Bookmarks Practice</h4>
              <p className="text-xs text-muted-text">Test yourself on questions you marked for special study review.</p>
            </div>
            <button
              onClick={() => handleStartPracticeSession(bookmarkedList)}
              disabled={bookmarkedList.length === 0}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-45 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice All ({bookmarkedList.length})</span>
            </button>
          </div>

          <div className="space-y-3">
            {bookmarkedList.length > 0 ? (
              bookmarkedList.map((q) => (
                <div
                  key={q.id}
                  onClick={() => onStartQuestionPractice(q, bookmarkedList)}
                  className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start justify-between gap-4 hover:border-primary/45 cursor-pointer transition-all group"
                >
                  <div className="space-y-1.5 pr-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-primary/10">
                        {q.subject}
                      </span>
                      <span className="text-[9px] font-bold text-muted-text bg-muted-bg px-2.5 py-0.5 rounded-full">
                        {q.topic}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {q.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleRemoveBookmark(q.id, e)}
                      className="p-1.5 rounded-lg border border-border text-muted-text hover:text-danger hover:border-danger/10 bg-card transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-4.5 h-4.5 text-muted-text group-hover:transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Bookmark className="w-10 h-10 text-muted-text/30 mx-auto mb-2" />
                <p className="text-sm text-muted-text font-medium">No bookmarks registered.</p>
                <p className="text-xs text-muted-text/75 mt-0.5">Click the bookmark pin in practice MCQs to view them here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MISTAKES LOG VIEW */}
      {activeTab === 'incorrect' && (
        <div className="space-y-4 print:hidden">
          <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between gap-4 shadow-sm">
            <div>
              <h4 className="font-bold text-sm text-foreground">Mistakes Revision Quiz</h4>
              <p className="text-xs text-muted-text">Test yourself exclusively on questions you previously failed.</p>
            </div>
            <button
              onClick={() => handleStartPracticeSession(incorrectList)}
              disabled={incorrectList.length === 0}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-45 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice All ({incorrectList.length})</span>
            </button>
          </div>

          <div className="space-y-3">
            {incorrectList.length > 0 ? (
              incorrectList.map((q) => (
                <div
                  key={q.id}
                  onClick={() => onStartQuestionPractice(q, incorrectList)}
                  className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start justify-between gap-4 hover:border-primary/45 cursor-pointer transition-all group"
                >
                  <div className="space-y-1.5 pr-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-bold text-danger bg-danger-light px-2.5 py-0.5 rounded-full border border-danger/10">
                        {q.subject}
                      </span>
                      <span className="text-[9px] font-bold text-muted-text bg-muted-bg px-2.5 py-0.5 rounded-full">
                        {q.topic}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {q.question}
                    </p>
                  </div>
                  <ArrowRight className="w-4.5 h-4.5 text-muted-text shrink-0 mt-2 group-hover:transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <AlertCircle className="w-10 h-10 text-muted-text/30 mx-auto mb-2" />
                <p className="text-sm text-muted-text font-medium">Your mistake log is clear!</p>
                <p className="text-xs text-muted-text/75 mt-0.5">Incorrect choices in practice modes will accumulate here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SYSTEM REVISION NOTES TAB VIEW */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
          {revisionNotes.map((note, idx) => (
            <div key={idx} className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
              <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
                <Sparkle className="w-4 h-4 text-primary" />
                <span>{note.category}</span>
              </h3>
              <ul className="space-y-2 text-xs leading-relaxed text-muted-text list-disc pl-4">
                {note.bullets.map((b, bIdx) => <li key={bIdx}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 4. 50 CORE REPEATED CONCEPTS TAB VIEW */}
      {activeTab === 'concepts' && (
        <div className="space-y-4 animate-slide-up">
          {/* Search & Admin actions bar */}
          <div className="flex flex-col gap-3">
            {user?.role === 'admin' && (
              <div className="flex flex-wrap gap-2.5 items-center justify-between bg-muted-bg/30 p-3 rounded-xl border border-border/80">
                <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Concept Management (Admin):</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={openAddConceptModal}
                    type="button"
                    className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                  >
                    <span>+ Add Concept</span>
                  </button>
                  <button
                    onClick={handleDownloadTemplate}
                    type="button"
                    className="py-1.5 px-3 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Download CSV Template</span>
                  </button>
                  <label className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/10 cursor-pointer transition-colors flex items-center gap-1 select-none">
                    <span>Bulk Upload CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUploadConcepts}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                placeholder="Search concepts by keyword (e.g. Parkland, GCS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl placeholder:text-muted-text/50"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {displayedConcepts.map((c) => {
              const isExpanded = expandedConcept === c.id;
              return (
                <div key={c.id} className="bg-card border border-border hover:border-primary/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                  <button
                    onClick={() => setExpandedConcept(isExpanded ? null : c.id)}
                    className={`w-full p-4 flex items-center justify-between text-left focus:outline-none transition-colors duration-150 ${
                      isExpanded 
                        ? 'bg-primary-light/40 text-primary border-b border-border/80' 
                        : 'bg-card hover:bg-muted-bg/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-4">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded 
                          ? 'bg-primary text-white' 
                          : 'bg-primary-light text-primary border border-primary/10'
                      }`}>
                        {c.id}
                      </span>
                      <span className="font-extrabold text-xs md:text-sm text-foreground leading-tight">{c.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {user?.role === 'admin' && (
                        <div className="flex items-center gap-1 mr-2 text-[10px]">
                          <button
                            onClick={(e) => openEditConceptModal(c, e)}
                            type="button"
                            className="py-1 px-2.5 bg-secondary/10 hover:bg-secondary/25 text-secondary font-bold rounded transition-colors"
                            title="Edit Concept"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => handleDeleteConcept(c.id, c.title, e)}
                            type="button"
                            className="py-1 px-2.5 bg-danger-light hover:bg-danger text-danger hover:text-white font-bold rounded transition-colors"
                            title="Delete Concept"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4.5 h-4.5 text-primary shrink-0 transition-transform" />
                      ) : (
                        <ChevronDown className="w-4.5 h-4.5 text-muted-text shrink-0 hover:text-foreground transition-transform" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="p-5 bg-card animate-slide-up space-y-4">
                      {/* Category & Info Header */}
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-primary bg-primary-light px-2.5 py-1 rounded-md border border-primary/10 uppercase tracking-wider">
                          {c.category}
                        </span>
                      </div>

                      {/* Highlight / Formula / Warning Box */}
                      {c.highlight && (
                        <div className="bg-primary-light/30 border-l-4 border-primary p-4 rounded-r-xl shadow-inner">
                          <p className="text-xs font-bold text-primary leading-normal">
                            {c.highlight}
                          </p>
                        </div>
                      )}

                      {/* Clinical Guidelines / Key Points */}
                      <div className="space-y-2.5">
                        <div className="text-[9px] font-black text-muted-text uppercase tracking-widest border-b border-border pb-1 w-fit">
                          Clinical Guidelines & Key Points
                        </div>
                        <ul className="space-y-2">
                          {c.bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"></span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Concepts Pagination Controls */}
          {totalPagesConcepts > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <button
                onClick={() => setConceptsPage(prev => Math.max(1, prev - 1))}
                disabled={conceptsPage === 1}
                className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted-bg/30 disabled:opacity-40 disabled:hover:bg-card transition-colors flex items-center gap-1"
              >
                <span>&larr;</span> Previous
              </button>
              <span className="text-xs font-semibold text-muted-text">
                Page <span className="text-foreground font-bold">{conceptsPage}</span> of <span className="text-foreground font-bold">{totalPagesConcepts}</span>
              </span>
              <button
                onClick={() => setConceptsPage(prev => Math.min(totalPagesConcepts, prev + 1))}
                disabled={conceptsPage === totalPagesConcepts}
                className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted-bg/30 disabled:opacity-40 disabled:hover:bg-card transition-colors flex items-center gap-1"
              >
                Next <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. 25 SURE SHOT QUESTIONS TAB VIEW */}
      {activeTab === 'sureshot' && (
        <div className="space-y-4 animate-slide-up max-w-2xl mx-auto">
          {/* Search & Admin actions bar */}
          {user?.role === 'admin' && (
            <div className="flex flex-wrap gap-2.5 items-center justify-between bg-muted-bg/30 p-3 rounded-xl border border-border/80">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Sure-Shot Management (Admin):</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openAddSureshotModal}
                  type="button"
                  className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <span>+ Add Question</span>
                </button>
                <button
                  onClick={handleDownloadSureshotTemplate}
                  type="button"
                  className="py-1.5 px-3 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                >
                  <span>Download CSV Template</span>
                </button>
                <label className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/10 cursor-pointer transition-colors flex items-center gap-1 select-none">
                  <span>Bulk Upload CSV</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUploadSureshot}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {displayedSureshotQs.map((q, idx) => {
            const absoluteIdx = (sureshotPage - 1) * ITEMS_PER_PAGE_SURESHOT + idx;
            const isRevealed = revealedAnswers[absoluteIdx] || false;
            const questionText = q.question || q.q;
            const answerText = q.answer || q.a;
            const explanationText = q.explanation || q.exp;
            return (
              <div key={absoluteIdx} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-20 h-20 bg-secondary/5 rounded-full blur-xl"></div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-bold text-secondary bg-secondary-light px-2.5 py-0.5 rounded-full border border-secondary/10 uppercase">
                    Sure-Shot Question {absoluteIdx + 1}
                  </span>
                  {user?.role === 'admin' && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        onClick={(e) => openEditSureshotModal(q, e)}
                        type="button"
                        className="py-0.5 px-2 bg-secondary/10 hover:bg-secondary/25 text-secondary font-bold rounded transition-colors"
                        title="Edit Question"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteSureshot(q.id, questionText, e)}
                        type="button"
                        className="py-0.5 px-2 bg-danger-light hover:bg-danger text-danger hover:text-white font-bold rounded transition-colors"
                        title="Delete Question"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-foreground text-sm md:text-base leading-snug">{questionText}</h4>
                
                {isRevealed ? (
                  <div className="space-y-2.5 animate-slide-up pt-2 border-t border-border/80">
                    <div className="text-xs font-bold text-success flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Correct Answer:
                    </div>
                    <div className="text-sm font-semibold text-foreground pl-1">{answerText}</div>
                    
                    <div className="bg-muted-bg border border-border/80 p-3 rounded-xl space-y-1 mt-2">
                      <div className="text-[10px] font-bold uppercase text-muted-text tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary" /> Rationale Explanation
                      </div>
                      <p className="text-xs leading-relaxed text-muted-text">{explanationText}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleAnswerReveal(absoluteIdx)}
                    className="w-full mt-2 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-secondary/10"
                  >
                    <span>Reveal Correct Answer & Rationale</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Sureshot Pagination Controls */}
          {totalPagesSureshot > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <button
                onClick={() => setSureshotPage(prev => Math.max(1, prev - 1))}
                disabled={sureshotPage === 1}
                className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted-bg/30 disabled:opacity-40 disabled:hover:bg-card transition-colors flex items-center gap-1"
              >
                <span>&larr;</span> Previous
              </button>
              <span className="text-xs font-semibold text-muted-text">
                Page <span className="text-foreground font-bold">{sureshotPage}</span> of <span className="text-foreground font-bold">{totalPagesSureshot}</span>
              </span>
              <button
                onClick={() => setSureshotPage(prev => Math.min(totalPagesSureshot, prev + 1))}
                disabled={sureshotPage === totalPagesSureshot}
                className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-bold text-foreground hover:bg-muted-bg/30 disabled:opacity-40 disabled:hover:bg-card transition-colors flex items-center gap-1"
              >
                Next <span>&rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. CLINICAL CALCULATORS TAB VIEW */}
      {activeTab === 'calculators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up max-w-4xl mx-auto">
          
          {/* Parkland Burn Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Stethoscope className="w-4.5 h-4.5 text-primary" />
              <span>Parkland Burn Fluid Calculator</span>
            </h3>
            <form onSubmit={calculateParkland} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Weight (kg)</label>
                  <input
                    type="number"
                    required
                    value={parklandWeight}
                    onChange={(e) => setParklandWeight(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">TBSA % (Burn Area)</label>
                  <input
                    type="number"
                    required
                    max={100}
                    value={parklandTbsa}
                    onChange={(e) => setParklandTbsa(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate Fluids
              </button>
            </form>

            {parklandResult && (
              <div className={`p-4 rounded-xl text-xs space-y-2 border animate-slide-up ${parklandResult.totalFluid === null ? parklandResult.alertClass : 'bg-primary-light/40 border-primary/20 text-foreground'}`}>
                {parklandResult.totalFluid !== null ? (
                  <>
                    <div className="flex justify-between items-center border-b border-primary/10 pb-1.5">
                      <span className="font-semibold text-muted-text">Total Fluid (24 hrs)</span>
                      <span className="font-black text-primary text-base">{parklandResult.totalFluid} mL</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-text leading-tight pt-1">
                      <div>
                        <div className="font-semibold text-foreground">First 8 Hours:</div>
                        <div className="text-xs font-bold text-foreground mt-0.5">{parklandResult.first8Hrs} mL</div>
                        <div>Rate: {parklandResult.rateFirst8} mL/hr</div>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Next 16 Hours:</div>
                        <div className="text-xs font-bold text-foreground mt-0.5">{parklandResult.next16Hrs} mL</div>
                        <div>Rate: {parklandResult.rateNext16} mL/hr</div>
                      </div>
                    </div>
                    <div className="text-[9px] text-accent font-bold mt-1 uppercase tracking-wider">
                      * First 8 hours volume count starts from the TIME OF INJURY!
                    </div>
                  </>
                ) : (
                  <p className="text-xs leading-tight font-semibold">{parklandResult.errorMsg}</p>
                )}
              </div>
            )}
          </div>

          {/* ABG Interpreter */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Activity className="w-4.5 h-4.5 text-secondary" />
              <span>ABG Acid-Base Interpreter</span>
            </h3>
            <form onSubmit={interpretAbg} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">pH</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={abgPh}
                    onChange={(e) => setAbgPh(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">PaCO2 (mmHg)</label>
                  <input
                    type="number"
                    required
                    value={abgPaco2}
                    onChange={(e) => setAbgPaco2(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">HCO3- (mEq/L)</label>
                  <input
                    type="number"
                    required
                    value={abgHco3}
                    onChange={(e) => setAbgHco3(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-secondary hover:bg-secondary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Diagnose ABG
              </button>
            </form>

            {abgResult && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-slide-up ${
                abgResult.isError 
                  ? 'bg-danger-light border-danger/20 text-danger' 
                  : 'bg-secondary-light border-secondary/20 text-secondary'
              }`}>
                <div className={`font-semibold ${abgResult.isError ? 'text-danger/80' : 'text-muted-text'}`}>
                  Diagnostic Interpretation:
                </div>
                <div className={`text-sm font-black ${abgResult.isError ? 'text-danger' : 'text-secondary'}`}>
                  {abgResult.diagnosis}
                </div>
                <div className={`text-[10px] ${abgResult.isError ? 'text-danger/90 font-semibold' : 'text-muted-text'}`}>
                  {abgResult.isError ? abgResult.compensation : `Compensation Status: ${abgResult.compensation}`}
                </div>
              </div>
            )}
          </div>

          {/* Glasgow Coma Scale (GCS) Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Brain className="w-4.5 h-4.5 text-primary" />
              <span>Glasgow Coma Scale (GCS)</span>
            </h3>
            <form onSubmit={calculateGcs} className="space-y-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2 border-b border-border/50 pb-1.5">
                  <span className="font-semibold text-muted-text">Eye Opening (E):</span>
                  <select 
                    value={gcsEye} 
                    onChange={(e) => setGcsEye(parseInt(e.target.value))}
                    className="py-1 px-2 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px] text-foreground w-40"
                  >
                    <option value="4">4 - Spontaneous</option>
                    <option value="3">3 - To sound / command</option>
                    <option value="2">2 - To pressure / pain</option>
                    <option value="1">1 - None</option>
                  </select>
                </div>
                <div className="flex justify-between items-center gap-2 border-b border-border/50 pb-1.5">
                  <span className="font-semibold text-muted-text">Verbal Response (V):</span>
                  <select 
                    value={gcsVerbal} 
                    onChange={(e) => setGcsVerbal(parseInt(e.target.value))}
                    className="py-1 px-2 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px] text-foreground w-40"
                  >
                    <option value="5">5 - Oriented conversation</option>
                    <option value="4">4 - Confused conversation</option>
                    <option value="3">3 - Inappropriate words</option>
                    <option value="2">2 - Incomprehensible sounds</option>
                    <option value="1">1 - None</option>
                  </select>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-muted-text">Motor Response (M):</span>
                  <select 
                    value={gcsMotor} 
                    onChange={(e) => setGcsMotor(parseInt(e.target.value))}
                    className="py-1 px-2 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px] text-foreground w-40"
                  >
                    <option value="6">6 - Obeys commands</option>
                    <option value="5">5 - Localizes to pain</option>
                    <option value="4">4 - Normal flexion (withdrawal)</option>
                    <option value="3">3 - Abnormal flexion (decorticate)</option>
                    <option value="2">2 - Extension response (decerebrate)</option>
                    <option value="1">1 - None</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate GCS Score
              </button>
            </form>

            {gcsResult && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-slide-up ${gcsResult.alertClass}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Calculated GCS Score</span>
                  <span className="text-lg font-black">{gcsResult.score} / 15</span>
                </div>
                <p className="text-[10px] leading-tight font-semibold">{gcsResult.interpretation}</p>
              </div>
            )}
          </div>

          {/* APGAR Newborn Score Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <HeartPulse className="w-4.5 h-4.5 text-primary" />
              <span>APGAR Newborn Score Calculator</span>
            </h3>
            <form onSubmit={calculateApgar} className="space-y-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-muted-text">Heart Rate (Pulse):</span>
                  <select 
                    value={apgarHeart} 
                    onChange={(e) => setApgarHeart(e.target.value)}
                    className="py-1 px-2.5 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px]"
                  >
                    <option value="0">0 (Absent)</option>
                    <option value="1">1 (&lt; 100 bpm)</option>
                    <option value="2">2 (&gt; 100 bpm)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-muted-text">Respiratory Effort (Cry):</span>
                  <select 
                    value={apgarResp} 
                    onChange={(e) => setApgarResp(e.target.value)}
                    className="py-1 px-2.5 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px]"
                  >
                    <option value="0">0 (Absent)</option>
                    <option value="1">1 (Weak, irregular cry)</option>
                    <option value="2">2 (Strong, robust cry)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-muted-text">Muscle Tone (Activity):</span>
                  <select 
                    value={apgarTone} 
                    onChange={(e) => setApgarTone(e.target.value)}
                    className="py-1 px-2.5 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px]"
                  >
                    <option value="0">0 (Limp, flaccid)</option>
                    <option value="1">1 (Some flexion of limbs)</option>
                    <option value="2">2 (Active movements)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-muted-text">Reflex Irritability (Grimace):</span>
                  <select 
                    value={apgarReflex} 
                    onChange={(e) => setApgarReflex(e.target.value)}
                    className="py-1 px-2.5 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px]"
                  >
                    <option value="0">0 (No response)</option>
                    <option value="1">1 (Grimace/frown upon stimulation)</option>
                    <option value="2">2 (Cough/sneeze/cry)</option>
                  </select>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-muted-text">Skin Color (Appearance):</span>
                  <select 
                    value={apgarColor} 
                    onChange={(e) => setApgarColor(e.target.value)}
                    className="py-1 px-2.5 bg-muted-bg border border-border rounded-lg focus:outline-none text-[11px]"
                  >
                    <option value="0">0 (Blue or pale all over)</option>
                    <option value="1">1 (Acrocyanosis: pink body, blue limbs)</option>
                    <option value="2">2 (Pink body and limbs)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate APGAR Score
              </button>
            </form>

            {apgarResult && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-slide-up ${apgarResult.alertClass}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Calculated Score (1-5 min)</span>
                  <span className="text-lg font-black">{apgarResult.score} / 10</span>
                </div>
                <p className="text-[10px] leading-tight font-medium">{apgarResult.status}</p>
              </div>
            )}
          </div>

          {/* Mean Arterial Pressure (MAP) Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <HeartPulse className="w-4.5 h-4.5 text-secondary" />
              <span>Mean Arterial Pressure (MAP)</span>
            </h3>
            <form onSubmit={calculateMap} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    required
                    value={mapSbp}
                    onChange={(e) => setMapSbp(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                    placeholder="e.g. 120"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    required
                    value={mapDbp}
                    onChange={(e) => setMapDbp(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                    placeholder="e.g. 80"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-secondary hover:bg-secondary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate MAP
              </button>
            </form>

            {mapResult && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-slide-up ${mapResult.alertClass}`}>
                {mapResult.map !== null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Calculated MAP</span>
                      <span className="text-lg font-black">{mapResult.map} mmHg</span>
                    </div>
                    <p className="text-[10px] leading-tight font-semibold">{mapResult.interpretation}</p>
                  </>
                ) : (
                  <p className="text-xs leading-tight font-semibold">{mapResult.interpretation}</p>
                )}
              </div>
            )}
          </div>

          {/* IV Drop Rate Flow Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Calculator className="w-4.5 h-4.5 text-secondary" />
              <span>IV Flow Rate Drop Calculator</span>
            </h3>
            <form onSubmit={calculateIvFlow} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Volume (mL)</label>
                  <input
                    type="number"
                    required
                    value={ivVolume}
                    onChange={(e) => setIvVolume(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Time (Hours)</label>
                  <input
                    type="number"
                    required
                    value={ivTime}
                    onChange={(e) => setIvTime(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Drop Factor (gtts)</label>
                  <select
                    value={ivDropFactor}
                    onChange={(e) => setIvDropFactor(parseInt(e.target.value))}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  >
                    <option value="10">10 (Macro)</option>
                    <option value="15">15 (Standard)</option>
                    <option value="20">20 (Standard)</option>
                    <option value="60">60 (Micro)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-secondary hover:bg-secondary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate Flow Rate
              </button>
            </form>

            {ivResult && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-slide-up ${ivResult.rateMlHr === null ? ivResult.alertClass : 'bg-secondary-light border-secondary/20 text-secondary'}`}>
                {ivResult.rateMlHr !== null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-muted-text">Infusion Rate</span>
                      <span className="font-bold text-foreground">{ivResult.rateMlHr} mL/hour</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-secondary/10 pt-1.5">
                      <span className="font-semibold text-muted-text">Gravity Drop Rate</span>
                      <span className="font-black text-secondary text-base">{ivResult.rateDropsMin} drops/minute</span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs leading-tight font-semibold">{ivResult.errorMsg}</p>
                )}
              </div>
            )}
          </div>

          {/* SpO₂/FiO₂ Ratio Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Activity className="w-4.5 h-4.5 text-primary" />
              <span>SpO₂/FiO₂ Ratio Calculator</span>
            </h3>
            <form onSubmit={calculateSfRatio} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">SpO₂ (%)</label>
                  <input
                    type="number"
                    required
                    min={50}
                    max={100}
                    value={sfSpo2}
                    onChange={(e) => setSfSpo2(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                    placeholder="e.g. 95"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">FiO₂ (%) or Decimal</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min={0.21}
                    max={100}
                    value={sfFio2}
                    onChange={(e) => setSfFio2(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                    placeholder="e.g. 50 or 0.50"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate SF Ratio
              </button>
            </form>

            {sfResult && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 border animate-slide-up ${sfResult.alertClass}`}>
                {sfResult.ratio !== null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Calculated SF Ratio</span>
                      <span className="text-lg font-black">{sfResult.ratio}</span>
                    </div>
                    <p className="text-[10px] leading-tight font-semibold">{sfResult.interpretation}</p>
                  </>
                ) : (
                  <p className="text-xs leading-tight font-semibold">{sfResult.interpretation}</p>
                )}
              </div>
            )}
          </div>

          {/* Pregnancy Due Dates Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Calendar className="w-4.5 h-4.5 text-secondary" />
              <span>Pregnancy Due Dates & Gestational Age</span>
            </h3>
            <form onSubmit={calculatePregnancy} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Last Menstrual Period (LMP)</label>
                  <input
                    type="date"
                    required
                    value={pregnancyLmp}
                    onChange={(e) => setPregnancyLmp(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-muted-text">Average Cycle (Days)</label>
                  <input
                    type="number"
                    required
                    min={20}
                    max={45}
                    value={pregnancyCycle}
                    onChange={(e) => setPregnancyCycle(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-secondary hover:bg-secondary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate Due Date & Age
              </button>
            </form>

            {pregnancyResult && (
              <div className={`p-4 rounded-xl text-xs space-y-2 border animate-slide-up ${pregnancyResult.edd === null ? pregnancyResult.alertClass : 'bg-secondary-light border-secondary/20 text-foreground'}`}>
                {pregnancyResult.edd !== null ? (
                  <>
                    <div className="flex justify-between items-center border-b border-secondary/10 pb-1.5 gap-2">
                      <span className="font-semibold text-muted-text shrink-0">Expected Due Date (EDD):</span>
                      <span className="font-black text-secondary text-right leading-tight break-words">{pregnancyResult.edd}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-semibold text-muted-text">Gestational Age:</span>
                      <span className="font-bold text-foreground">{pregnancyResult.gestationalAge}</span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="font-semibold text-muted-text">Current Stage:</span>
                      <span className="font-bold text-foreground">{pregnancyResult.trimester}</span>
                    </div>
                    <div className="space-y-1 pt-1.5">
                      <div className="flex justify-between text-[10px] text-muted-text">
                        <span>Pregnancy Progress</span>
                        <span>{pregnancyResult.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-muted-bg rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-secondary h-full transition-all duration-500" 
                          style={{ width: `${pregnancyResult.progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-xs leading-tight font-semibold">{pregnancyResult.errorMsg}</p>
                )}
              </div>
            )}
          </div>

          {/* Holliday-Segar Pediatric Fluid Calculator */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-extrabold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Droplet className="w-4.5 h-4.5 text-primary" />
              <span>Pediatric Fluid Maintenance (Holliday-Segar)</span>
            </h3>
            <form onSubmit={calculateHolliday} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-muted-text uppercase tracking-wider block">Body Weight (kg)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={150}
                  step="0.1"
                  value={hollidayWeight}
                  onChange={(e) => setHollidayWeight(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none"
                  placeholder="e.g. 15"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Calculate Maintenance Fluid
              </button>
            </form>

            {hollidayResult && (
              <div className={`p-4 rounded-xl text-xs space-y-2 border animate-slide-up ${hollidayResult.daily === null ? hollidayResult.alertClass : 'bg-secondary-light border-secondary/20 text-foreground'}`}>
                {hollidayResult.daily !== null ? (
                  <>
                    <div className="flex justify-between items-center border-b border-secondary/10 pb-1.5 gap-2">
                      <span className="font-semibold text-muted-text">Hourly Rate (4/2/1):</span>
                      <span className="font-black text-secondary text-base">{hollidayResult.hourly} mL/hour</span>
                    </div>
                    <div className="text-[10px] text-muted-text leading-relaxed whitespace-pre-line border-b border-secondary/10 pb-1.5">
                      {hollidayResult.hourlyBreakdown}
                    </div>
                    <div className="flex justify-between items-center py-0.5 gap-2">
                      <span className="font-semibold text-muted-text">Daily Volume (100/50/20):</span>
                      <span className="font-bold text-foreground text-sm">{hollidayResult.daily} mL/day</span>
                    </div>
                    <div className="text-[10px] text-muted-text leading-relaxed whitespace-pre-line">
                      {hollidayResult.dailyBreakdown}
                    </div>
                  </>
                ) : (
                  <p className="text-xs leading-tight font-semibold">{hollidayResult.errorMsg}</p>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Concept Add/Edit Modal */}
      {conceptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-border/80 flex items-center justify-between">
              <h3 className="font-extrabold text-foreground text-base">
                {editingConcept ? 'Edit Repeated Concept' : 'Add New Repeated Concept'}
              </h3>
              <button
                onClick={() => setConceptModalOpen(false)}
                type="button"
                className="text-muted-text hover:text-foreground p-1 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSaveConcept} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Concept Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parkland Burn Resuscitation Formula"
                  value={conceptTitle}
                  onChange={(e) => setConceptTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Care / Trauma"
                  value={conceptCategory}
                  onChange={(e) => setConceptCategory(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Highlight / Formula Box (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Formula: 4 mL x Body Weight (kg) x TBSA (%)"
                  value={conceptHighlight}
                  onChange={(e) => setConceptHighlight(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">
                  Clinical Guidelines / Key Points (One bullet point per line)
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Administer half of the total calculated volume in the first 8 hours.&#10;Administer the remaining half of the volume over the next 16 hours.&#10;The crystalloid of choice is Ringer's Lactate (RL)."
                  value={conceptBullets}
                  onChange={(e) => setConceptBullets(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none text-xs leading-relaxed font-sans"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setConceptModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted-bg/30 text-foreground font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-sm transition-colors"
                >
                  Save Concept
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Sureshot Add/Edit Modal */}
      {sureshotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-border/80 flex items-center justify-between">
              <h3 className="font-extrabold text-foreground text-base">
                {editingSureshot ? 'Edit Sure-Shot Question' : 'Add New Sure-Shot Question'}
              </h3>
              <button
                onClick={() => setSureshotModalOpen(false)}
                type="button"
                className="text-muted-text hover:text-foreground p-1 text-lg font-bold"
              >
                &times;
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSaveSureshot} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Question Text</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the sure-shot question..."
                  value={sureshotQ}
                  onChange={(e) => setSureshotQ(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none text-xs leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Correct Answer</label>
                <input
                  type="text"
                  required
                  placeholder="Enter the correct answer..."
                  value={sureshotA}
                  onChange={(e) => setSureshotA(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Rationale / Explanation</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the explanation/rationale..."
                  value={sureshotExp}
                  onChange={(e) => setSureshotExp(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-foreground focus:outline-none text-xs leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setSureshotModalOpen(false)}
                  className="px-4 py-2 border border-border hover:bg-muted-bg/30 text-foreground font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-sm transition-colors"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
