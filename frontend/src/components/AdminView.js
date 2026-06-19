'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Plus, Edit2, Upload, FileText, Search, Database, 
  Trash2, Check, X, ShieldAlert, Sparkles, Filter, Download
} from 'lucide-react';

export default function AdminView() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQ, setEditingQ] = useState(null);

  // Batches & Candidates state
  const [activeSubTab, setActiveSubTab] = useState('questions'); // 'questions' or 'candidates'
  const [candidates, setCandidates] = useState([]);
  const [batches, setBatches] = useState([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');

  // Form inputs
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [tags, setTags] = useState('');
  const [prevYear, setPrevYear] = useState('');

  // CSV Importer state
  const [csvFile, setCsvFile] = useState(null);
  const [csvImportLogs, setCsvImportLogs] = useState(null);
  const [csvImportError, setCsvImportError] = useState('');

  // Mock Test Builder State
  const [isTestBuilderOpen, setIsTestBuilderOpen] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testDuration, setTestDuration] = useState(120);
  const [testNegMarking, setTestNegMarking] = useState(0.25);
  const [selectedQIds, setSelectedQIds] = useState([]);

  // User Promotion State
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteMessage, setPromoteMessage] = useState('');
  const [promoteError, setPromoteError] = useState('');

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const fetchCandidatesAndBatches = async () => {
    try {
      const [candidatesData, batchesData] = await Promise.all([
        api.getCandidates(),
        api.getBatches()
      ]);
      setCandidates(candidatesData);
      setBatches(batchesData);
    } catch (err) {
      console.error('Error fetching candidates/batches:', err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'candidates') {
      fetchCandidatesAndBatches();
    }
  }, [activeSubTab]);

  useEffect(() => {
    fetchQuestions();
  }, [filterSubject, searchQuery]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatchName) return;
    try {
      await api.createBatch(newBatchName);
      setNewBatchName('');
      fetchCandidatesAndBatches();
      alert(`Batch "${newBatchName}" created successfully.`);
    } catch (err) {
      alert(err.message || 'Failed to create batch');
    }
  };

  const handleDownloadCandidatesCsv = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Country', 'Address', 'Verified', 'Batch Name', 'Created At'];
    const rows = candidates.map(c => {
      const batch = batches.find(b => b.id === c.batch_id);
      const batchName = batch ? batch.name : 'None';
      return [
        c.id,
        c.name,
        c.email,
        c.phone || '',
        c.country || '',
        c.address || '',
        (c.is_email_verified === true || c.is_email_verified === 'true' || c.is_email_verified === 1) ? 'Yes' : 'No',
        batchName,
        c.created_at
      ];
    });

    const formatCell = (cell) => {
      if (cell === null || cell === undefined) return '';
      const stringified = String(cell);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n') || stringified.includes('\r')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const csvContent = [
      headers.map(formatCell).join(','),
      ...rows.map(row => row.map(formatCell).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'epion_candidates_list.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const filters = {
        subject: filterSubject || undefined,
        search: searchQuery || undefined
      };
      const data = await api.getQuestions(filters);
      setQuestions(data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (q = null) => {
    if (q) {
      setEditingQ(q);
      setSubject(q.subject);
      setTopic(q.topic);
      setQuestionText(q.question);
      setOptA(q.options[0] || '');
      setOptB(q.options[1] || '');
      setOptC(q.options[2] || '');
      setOptD(q.options[3] || '');
      setCorrectAnswer(q.correct_answer);
      setExplanation(q.explanation);
      setDifficulty(q.difficulty);
      setTags(q.tags ? q.tags.join(', ') : '');
      setPrevYear(q.previous_year_indicator || '');
    } else {
      setEditingQ(null);
      setSubject('');
      setTopic('');
      setQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectAnswer(0);
      setExplanation('');
      setDifficulty('Easy');
      setTags('');
      setPrevYear('');
    }
    setIsFormOpen(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);

    const questionData = {
      subject,
      topic,
      question: questionText,
      options: [optA, optB, optC, optD],
      correct_answer: parseInt(correctAnswer),
      explanation,
      difficulty,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      previous_year_indicator: prevYear || null
    };

    try {
      if (editingQ) {
        await api.updateQuestion(editingQ.id, questionData);
        alert('Question updated successfully.');
      } else {
        await api.createQuestion(questionData);
        alert('Question created successfully.');
      }
      setIsFormOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      alert('Failed to save question. Check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return;

    setLoading(true);
    setCsvImportLogs(null);
    setCsvImportError('');

    try {
      const data = await api.importQuestionsCsv(csvFile);
      setCsvImportLogs(data);
      setCsvFile(null);
      fetchQuestions();
    } catch (err) {
      console.error('CSV Import Error:', err);
      setCsvImportError(err.message || 'Failed to parse CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'subject',
      'topic',
      'question',
      'optionA',
      'optionB',
      'optionC',
      'optionD',
      'correctAnswerIndex',
      'explanation',
      'difficulty',
      'tags',
      'previousYearIndicator'
    ];
    
    const sampleRow = [
      'Medical Surgical Nursing',
      'Cardiovascular System',
      'A patient is admitted with a diagnosis of left-sided heart failure. Which clinical manifestation should the nurse expect to find during assessment?',
      'Jugular vein distention',
      'Dyspnea and crackles',
      'Splenomegaly',
      'Peripheral edema',
      '1',
      'Left-sided heart failure leads to pulmonary congestion. Fluid backs up into the lungs, causing dyspnea, orthopnea, cough, and crackles on auscultation.',
      'Medium',
      'cardiology, heart failure, assessment',
      'SGPGI 2022'
    ];

    const formatCell = (cell) => {
      if (cell === null || cell === undefined) return '';
      const stringified = String(cell);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n') || stringified.includes('\r')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const csvContent = [
      headers.map(formatCell).join(','),
      sampleRow.map(formatCell).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'epion_questions_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateMockTest = async (e) => {
    e.preventDefault();
    if (!testTitle || selectedQIds.length === 0) {
      alert('Please fill out mock test title and select questions.');
      return;
    }

    setLoading(true);
    try {
      await api.createMockTest({
        title: testTitle,
        durationMinutes: parseInt(testDuration),
        totalQuestions: selectedQIds.length,
        negativeMarking: parseFloat(testNegMarking),
        questionIds: selectedQIds
      });
      alert(`Mock test "${testTitle}" with ${selectedQIds.length} questions created successfully.`);
      setIsTestBuilderOpen(false);
      setTestTitle('');
      setSelectedQIds([]);
    } catch (err) {
      console.error('Error creating mock test:', err);
      alert('Failed to create test config.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestionForTest = (qId) => {
    setSelectedQIds(prev => {
      if (prev.includes(qId)) {
        return prev.filter(id => id !== qId);
      } else {
        return [...prev, qId];
      }
    });
  };

  const handleAutoSelectQuestions = () => {
    // Auto select 18 questions from current list (mock seed size)
    const currentIds = questions.slice(0, 18).map(q => q.id);
    setSelectedQIds(currentIds);
  };

  const handlePromoteAdmin = async (e) => {
    e.preventDefault();
    if (!promoteEmail) return;

    setPromoteLoading(true);
    setPromoteMessage('');
    setPromoteError('');

    try {
      const res = await api.makeAdmin(promoteEmail);
      setPromoteMessage(res.message || `Successfully promoted ${promoteEmail} to admin.`);
      setPromoteEmail('');
    } catch (err) {
      console.error('Error promoting admin:', err);
      setPromoteError(err.message || 'Failed to promote user to admin. Verify the email exists.');
    } finally {
      setPromoteLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            <span>Admin Control Panel</span>
          </h2>
          <p className="text-muted-text text-sm">Add questions, import batch CSV files, and orchestrate custom simulated mock tests.</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow"
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
          <button
            onClick={() => setIsTestBuilderOpen(true)}
            className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow"
          >
            <FileText className="w-4 h-4" /> Mock Test Generator
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex bg-muted-bg p-1 rounded-xl border border-border w-fit" style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setActiveSubTab('questions')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'questions' 
              ? 'bg-card text-primary shadow-sm border border-border' 
              : 'text-muted-text hover:text-foreground'
          }`}
        >
          Questions Management
        </button>
        <button
          onClick={() => setActiveSubTab('candidates')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeSubTab === 'candidates' 
              ? 'bg-card text-primary shadow-sm border border-border' 
              : 'text-muted-text hover:text-foreground'
          }`}
        >
          Batches & Candidates
        </button>
      </div>

      {activeSubTab === 'questions' ? (
        <>
          {/* CSV Batch Importer widget */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 mb-3">
              <Upload className="w-4.5 h-4.5 text-primary" />
              <span>Batch Question Importer</span>
            </h3>
            <form onSubmit={handleCsvUpload} className="flex flex-col md:flex-row items-center gap-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files[0])}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary/20 text-muted-text focus:outline-none"
              />
              <button
                type="submit"
                disabled={!csvFile || loading}
                className="w-full md:w-auto px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                Upload CSV
              </button>
            </form>

            <div className="mt-3 text-[10px] text-muted-text bg-muted-bg p-3 rounded-lg border border-border/70 leading-normal space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                <span className="font-bold text-foreground">CSV Column Format Template:</span>
                <button
                  onClick={handleDownloadTemplate}
                  type="button"
                  className="px-2.5 py-1 bg-primary-light hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer w-fit"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template CSV
                </button>
              </div>
              <div className="overflow-x-auto whitespace-nowrap scrollbar-thin pb-1">
                <code>subject, topic, question, optionA, optionB, optionC, optionD, correctAnswerIndex, explanation, difficulty, tags, previousYearIndicator</code>
              </div>
              <div>* Note: <code>correctAnswerIndex</code> must be 0 (Option A), 1 (Option B), 2 (Option C), or 3 (Option D).</div>
            </div>

            {csvImportLogs && (
              <div className="mt-4 bg-success-light border border-success/20 text-success text-xs rounded-xl p-3.5 space-y-1 animate-slide-up">
                <div className="font-bold">{csvImportLogs.message}</div>
                {csvImportLogs.errors && csvImportLogs.errors.length > 0 && (
                  <div className="mt-2 text-danger font-semibold space-y-0.5">
                    <div>Errors logged during import:</div>
                    {csvImportLogs.errors.map((err, idx) => <div key={idx}>• {err}</div>)}
                  </div>
                )}
              </div>
            )}

            {csvImportError && (
              <div className="mt-4 bg-danger-light border border-danger/20 text-danger text-xs rounded-xl p-3.5 animate-slide-up">
                {csvImportError}
              </div>
            )}
          </div>

          {/* Promote Admin widget */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4.5 h-4.5 text-primary" />
              <span>Promote User to Administrator Authority</span>
            </h3>
            <p className="text-xs text-muted-text mb-3">Promote an existing candidate account to Admin role, granting them access to question management, CSV uploader, and test creation tools.</p>
            <form onSubmit={handlePromoteAdmin} className="flex flex-col md:flex-row items-center gap-4">
              <input
                type="email"
                required
                placeholder="enter.candidate.email@gmail.com"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                className="w-full bg-muted-bg border border-border py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl placeholder:text-muted-text/50"
                style={{ paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
              />
              <button
                type="submit"
                disabled={!promoteEmail || promoteLoading}
                className="w-full md:w-auto px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition-colors shrink-0 cursor-pointer"
                style={{ paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
              >
                {promoteLoading ? 'Promoting...' : 'Grant Admin Role'}
              </button>
            </form>

            {promoteMessage && (
              <div className="mt-3 bg-success-light border border-success/20 text-success text-xs rounded-xl p-3 animate-slide-up">
                <strong>Success:</strong> {promoteMessage}
              </div>
            )}

            {promoteError && (
              <div className="mt-3 bg-danger-light border border-danger/20 text-danger text-xs rounded-xl p-3 animate-slide-up">
                <strong>Error:</strong> {promoteError}
              </div>
            )}
          </div>

          {/* Active Question database list */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Search bar toolbar */}
            <div className="p-4 border-b border-border/80 flex flex-col md:flex-row items-center gap-3 bg-muted-bg/30">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-muted-text absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search database by keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-card border border-border pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl placeholder:text-muted-text/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <Filter className="w-4 h-4 text-muted-text" />
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full md:w-48 bg-card border border-border py-2 px-3 text-xs text-foreground focus:outline-none focus:border-primary rounded-xl"
                >
                  <option value="">-- All Subjects --</option>
                  <option value="Medical Surgical Nursing">Medical Surgical</option>
                  <option value="Pediatric Nursing">Pediatric Nursing</option>
                  <option value="Obstetrics & Gynecology (OBGYN)">OBGYN</option>
                  <option value="Fundamentals of Nursing">Fundamentals</option>
                  <option value="Anatomy & Physiology">Anatomy & Physiology</option>
                  <option value="Pharmacology">Pharmacology</option>
                  <option value="General Knowledge">General Knowledge</option>
                </select>
              </div>
            </div>

            {/* Database List */}
            <div className="divide-y divide-border/70 max-h-[50vh] overflow-y-auto pr-1">
              {questions.length > 0 ? (
                questions.map((q) => (
                  <div 
                    key={q.id}
                    className="p-4 hover:bg-muted-bg/20 flex items-start justify-between gap-4 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[9px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-primary/10">
                          Q#{q.id} • {q.subject}
                        </span>
                        <span className="text-[9px] font-bold text-muted-text bg-muted-bg px-2.5 py-0.5 rounded-full">
                          {q.topic}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          q.difficulty === 'Easy' ? 'bg-success-light text-success border-success/10' :
                          q.difficulty === 'Medium' ? 'bg-accent-light text-accent border-accent/10' :
                          'bg-danger-light text-danger border-danger/10'
                        }`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground leading-snug">{q.question}</h4>
                    </div>
                    <button
                      onClick={() => handleOpenForm(q)}
                      className="p-1.5 rounded-lg border border-border text-muted-text hover:text-primary hover:border-primary/20 bg-card transition-colors shrink-0 mt-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-text text-sm font-semibold">No questions matched the database query.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Create Student Batch widget */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm animate-fade-in">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 mb-3">
              <Plus className="w-4.5 h-4.5 text-primary" />
              <span>Create Student Batch</span>
            </h3>
            <p className="text-xs text-muted-text mb-3">Create specific training groups or student classes (e.g. Waheguru Batch A, Paid Tier 2) to manage access controls for mock test configurations.</p>
            <form onSubmit={handleCreateBatch} className="flex flex-col md:flex-row items-center gap-4">
              <input
                type="text"
                required
                placeholder="e.g. SGPGI Batch 2026 - A"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                className="w-full bg-muted-bg border border-border py-2 px-3 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl placeholder:text-muted-text/50"
                style={{ paddingTop: '0.6rem', paddingBottom: '0.6rem' }}
              />
              <button
                type="submit"
                disabled={!newBatchName}
                className="w-full md:w-auto px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow transition-colors shrink-0 cursor-pointer"
                style={{ paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
              >
                Create Batch
              </button>
            </form>
          </div>

          {/* Candidates Database widget */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            {/* Toolbar */}
            <div className="p-4 border-b border-border/80 flex flex-col md:flex-row items-center justify-between gap-3 bg-muted-bg/30">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="w-4 h-4 text-muted-text absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search candidates by name or email..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full bg-card border border-border pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl placeholder:text-muted-text/50"
                />
              </div>

              <button
                onClick={handleDownloadCandidatesCsv}
                className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-full md:w-auto"
              >
                <Download className="w-4 h-4" /> Download Candidates CSV
              </button>
            </div>

            {/* List Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted-bg text-muted-text uppercase font-bold border-b border-border">
                    <th className="p-3">Candidate Details</th>
                    <th className="p-3">Phone & Address</th>
                    <th className="p-3">Verified</th>
                    <th className="p-3">Assigned Batch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates
                    .filter(c => {
                      const q = candidateSearch.toLowerCase();
                      return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
                    })
                    .map(c => {
                      return (
                        <tr key={c.id} className="hover:bg-muted-bg/5 text-foreground font-medium">
                          <td className="p-3">
                            <div className="font-bold text-sm">{c.name}</div>
                            <div className="text-muted-text text-[11px] font-semibold mt-0.5">{c.email}</div>
                            <div className="text-[10px] text-muted-text/70 mt-1">Registered: {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A'}</div>
                          </td>
                          <td className="p-3 space-y-1">
                            <div>{c.phone || 'No Phone'}</div>
                            <div className="text-muted-text leading-snug">{c.address ? `${c.address}, ${c.country}` : 'No Address'}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.is_email_verified === true || c.is_email_verified === 'true' || c.is_email_verified === 1
                                ? 'bg-success-light text-success'
                                : 'bg-danger-light text-danger'
                            }`}>
                              {c.is_email_verified === true || c.is_email_verified === 'true' || c.is_email_verified === 1 ? 'Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={c.batch_id || ''}
                              onChange={async (e) => {
                                const val = e.target.value;
                                const batchId = val === '' ? null : parseInt(val);
                                try {
                                  await api.assignBatch(c.id, batchId);
                                  fetchCandidatesAndBatches();
                                  alert('Batch assigned successfully');
                                } catch(err) {
                                  alert(err.message || 'Failed to assign batch');
                                }
                              }}
                              className="bg-card border border-border py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-primary rounded-xl"
                            >
                              <option value="">No Batch</option>
                              {batches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  {candidates.filter(c => {
                    const q = candidateSearch.toLowerCase();
                    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
                  }).length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-muted-text font-bold">No candidates found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 1. MOCK TEST GENERATOR MODAL */}
      {isTestBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-2xl w-full bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/80 pb-3">
              <h3 className="font-extrabold text-foreground text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Simulated Mock Test Creator</span>
              </h3>
              <button onClick={() => setIsTestBuilderOpen(false)} className="text-muted-text hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMockTest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 col-span-1 md:col-span-3">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Mock Test Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EPION Super-Specialty Nursing Officer Mock - 02"
                    value={testTitle}
                    onChange={(e) => setTestTitle(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={testDuration}
                    onChange={(e) => setTestDuration(parseInt(e.target.value))}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Negative marking index</label>
                  <select
                    value={testNegMarking}
                    onChange={(e) => setTestNegMarking(parseFloat(e.target.value))}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="0.25">0.25 (Standard EPION/SGPGI)</option>
                    <option value="0.33">0.33 (AIIMS NORCET)</option>
                    <option value="0.50">0.50 (Hard Penalty)</option>
                    <option value="0.00">0.00 (No negative mark)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Selected Questions</label>
                  <div className="py-2.5 text-center bg-muted-bg/50 border border-border rounded-lg text-sm font-extrabold text-primary">
                    {selectedQIds.length} Linked
                  </div>
                </div>
              </div>

              {/* Linking helper list */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-text uppercase tracking-wider">Select Questions to include:</span>
                  <button 
                    type="button" 
                    onClick={handleAutoSelectQuestions}
                    className="text-primary hover:underline"
                  >
                    Auto-Link 18 questions
                  </button>
                </div>

                <div className="border border-border rounded-xl divide-y divide-border/60 max-h-48 overflow-y-auto p-1 bg-muted-bg/30">
                  {questions.map((q) => {
                    const isChecked = selectedQIds.includes(q.id);
                    return (
                      <div 
                        key={q.id}
                        onClick={() => handleSelectQuestionForTest(q.id)}
                        className={`p-2.5 text-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-card transition-colors ${isChecked ? 'bg-primary-light/40 font-semibold' : ''}`}
                      >
                        <div className="flex items-center gap-2 leading-snug">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {}} // Handled by container click
                            className="rounded text-primary focus:ring-primary shrink-0" 
                          />
                          <span className="line-clamp-1">{q.question}</span>
                        </div>
                        <span className="text-[10px] text-muted-text font-bold shrink-0">{q.subject}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || selectedQIds.length === 0}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Assemble & Publish Mock Test
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. QUESTION ADD/EDIT CRUD MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-2xl w-full bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/80 pb-3">
              <h3 className="font-extrabold text-foreground text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                <span>{editingQ ? `Edit Question Q#${editingQ.id}` : 'Create New MCQ Card'}</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-muted-text hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Subject</label>
                  <select
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">-- Choose Subject --</option>
                    <option value="Medical Surgical Nursing">Medical Surgical Nursing</option>
                    <option value="Pediatric Nursing">Pediatric Nursing</option>
                    <option value="Obstetrics & Gynecology (OBGYN)">Obstetrics & Gynecology (OBGYN)</option>
                    <option value="Fundamentals of Nursing">Fundamentals of Nursing</option>
                    <option value="Anatomy & Physiology">Anatomy & Physiology</option>
                    <option value="Pharmacology">Pharmacology</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Microbiology">Microbiology</option>
                    <option value="General Knowledge">General Knowledge</option>
                    <option value="General English">General English</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="Aptitude">Aptitude</option>
                  </select>
                </div>

                {/* Topic */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cardiovascular Assessment"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>

                {/* Question */}
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Question Text</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter full MCQ text details..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="w-full p-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  ></textarea>
                </div>

                {/* Option A */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Option A</label>
                  <input
                    type="text"
                    required
                    placeholder="First option value"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>

                {/* Option B */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Option B</label>
                  <input
                    type="text"
                    required
                    placeholder="Second option value"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>

                {/* Option C */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Option C</label>
                  <input
                    type="text"
                    required
                    placeholder="Third option value"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>

                {/* Option D */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Option D</label>
                  <input
                    type="text"
                    required
                    placeholder="Fourth option value"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>

                {/* Correct Answer Select */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Correct Answer Key</label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(parseInt(e.target.value))}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {/* Explanation */}
                <div className="space-y-1 col-span-1 md:col-span-2">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Rationale explanation</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide step-by-step reasoning details why this answer is correct..."
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    className="w-full p-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  ></textarea>
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. cardiology, heart failure, vital signs"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>

                {/* Previous Year Indicator */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Previous Year Tag (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SGPGI 2023, AIIMS NORCET 2022"
                    value={prevYear}
                    onChange={(e) => setPrevYear(e.target.value)}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Save MCQ Card
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
