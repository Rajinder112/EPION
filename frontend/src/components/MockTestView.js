'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { 
  Trophy, Clock, FileText, ChevronLeft, ChevronRight, 
  Flag, AlertCircle, ArrowLeft, RotateCcw, Check, X, 
  TrendingUp, Download, Eye, Sparkles, LogOut, Lock, Upload
} from 'lucide-react';

export default function MockTestView({ onNavigateHome, user }) {
  const [mockTests, setMockTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState(null);
  const [activeTestQuestions, setActiveTestQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Exam States
  const [answers, setAnswers] = useState({}); // { [questionId]: optionIndex }
  const [flagged, setFlagged] = useState({}); // { [questionId]: boolean }
  const [visited, setVisited] = useState({}); // { [questionId]: boolean }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isExamActive, setIsExamActive] = useState(false);
  
  // Results States
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [resultsReviewQuestions, setResultsReviewQuestions] = useState([]);

  // Edit Mock Test states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState(120);
  const [editNegMarking, setEditNegMarking] = useState(0.25);
  const [editIsLocked, setEditIsLocked] = useState(false);
  const [editAllowedBatches, setEditAllowedBatches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvError, setCsvError] = useState(null);
  const [csvSuccess, setCsvSuccess] = useState(null);

  const timerRef = useRef(null);

  const fetchBatches = async () => {
    try {
      const data = await api.getBatches();
      setBatches(data);
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  useEffect(() => {
    fetchMockTests();
    if (user && user.role === 'admin') {
      fetchBatches();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  const fetchMockTests = async () => {
    setLoading(true);
    try {
      const data = await api.getMockTests();
      setMockTests(data);
    } catch (err) {
      console.error('Error fetching mock tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (test) => {
    setEditingTest(test);
    setEditTitle(test.title);
    setEditDuration(test.duration_minutes);
    setEditNegMarking(test.negative_marking);
    setEditIsLocked(test.is_locked === true || test.is_locked === 'true' || test.is_locked === 1);
    
    let allowed = [];
    if (test.allowed_batches) {
      try {
        allowed = typeof test.allowed_batches === 'string' ? JSON.parse(test.allowed_batches) : test.allowed_batches;
      } catch(e) {
        allowed = test.allowed_batches.split(',').map(x => parseInt(x.trim())).filter(Boolean);
      }
    }
    setEditAllowedBatches(Array.isArray(allowed) ? allowed.map(Number) : []);
    setCsvUploading(false);
    setCsvError(null);
    setCsvSuccess(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateMockTest(editingTest.id, {
        title: editTitle,
        durationMinutes: editDuration,
        negativeMarking: editNegMarking,
        isLocked: editIsLocked,
        allowedBatches: editAllowedBatches.length > 0 ? editAllowedBatches : null
      });
      alert('Mock test updated successfully');
      setIsEditModalOpen(false);
      fetchMockTests();
    } catch(err) {
      alert(err.message || 'Failed to update mock test');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvUploading(true);
    setCsvError(null);
    setCsvSuccess(null);

    try {
      const response = await api.importMockTestQuestionsCsv(editingTest.id, file);
      setCsvSuccess(response.message || 'Questions uploaded and replaced successfully!');
      fetchMockTests();
    } catch (err) {
      if (err.errors && Array.isArray(err.errors)) {
        setCsvError(err.errors);
      } else {
        setCsvError(err.message || 'Failed to upload CSV file.');
      }
    } finally {
      setCsvUploading(false);
      // Clear file input value so it can be re-uploaded if same file is edited
      e.target.value = '';
    }
  };

  const handleStartExam = async (test) => {
    setLoading(true);
    try {
      const data = await api.getMockTestDetails(test.id);
      
      setActiveTest(test);
      setActiveTestQuestions(data.questions);
      setAnswers({});
      setFlagged({});
      const initialVisited = { [data.questions[0].id]: true };
      setVisited(initialVisited);
      setCurrentIdx(0);
      setTimeLeft(test.duration_minutes * 60);
      setIsExamActive(true);
      setIsReviewMode(false);
      setTestResult(null);

      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmitExam(data.questions, {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error starting mock test:', err);
      alert('Could not start the exam. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const autoSubmitExam = (questions, currentAnswers = answers) => {
    alert('Time limit reached! Your exam is being automatically submitted.');
    submitExam(questions, currentAnswers);
  };

  const submitExam = async (questions = activeTestQuestions, currentAnswers = answers) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    setLoading(true);
    try {
      const timeTaken = (activeTest.duration_minutes * 60) - timeLeft;
      
      const result = await api.submitMockTest(
        activeTest.id,
        currentAnswers,
        timeTaken
      );

      setTestResult(result);
      setResultsReviewQuestions(result.scoredQuestions);
      setIsExamActive(false);
      setIsReviewMode(true);
    } catch (err) {
      console.error('Error submitting mock test:', err);
      alert('Failed to submit exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleClearOption = (qId) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleToggleFlag = (qId) => {
    setFlagged((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleNavigateQuestion = (idx) => {
    setCurrentIdx(idx);
    const qId = activeTestQuestions[idx].id;
    setVisited((prev) => ({
      ...prev,
      [qId]: true
    }));
  };

  const handlePrintScorecard = () => {
    window.print();
  };

  if (loading && !isExamActive && !isReviewMode) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-text text-sm font-medium">Preparing EPION exam interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in print:p-0 print:pb-0">
      {/* 1. TEST DIRECTORY VIEW */}
      {!isExamActive && !isReviewMode && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-foreground">EPION Mock Exam Center</h2>
            <p className="text-muted-text text-sm">Challenge yourself under standard exam settings: 100 questions, negative markings, and auto-submit timers.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {mockTests.map((test) => {
              const isLocked = test.is_locked === true || test.is_locked === 'true' || test.is_locked === 1;
              let allowedBatchesList = [];
              if (test.allowed_batches) {
                try {
                  allowedBatchesList = typeof test.allowed_batches === 'string' ? JSON.parse(test.allowed_batches) : test.allowed_batches;
                } catch(e) {}
              }
              const isBatchRestricted = Array.isArray(allowedBatchesList) && allowedBatchesList.length > 0;

              return (
                <div 
                  key={test.id}
                  className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-primary/45 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-secondary bg-secondary-light px-2.5 py-0.5 rounded-full border border-secondary/15 uppercase tracking-wider">
                        Full EPION/SGPGI Pattern
                      </span>
                      <span className="text-xs text-muted-text">Negative marking: {test.negative_marking} mark per wrong answer</span>
                      {isLocked && (
                        <span className="text-[9px] font-extrabold text-danger bg-danger-light px-2 py-0.5 rounded-full border border-danger/10 uppercase tracking-wider flex items-center gap-0.5">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}
                      {isBatchRestricted && (
                        <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/10 uppercase tracking-wider">
                          Restricted ({allowedBatchesList.length} Batches)
                        </span>
                      )}
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-foreground">{test.title}</h3>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-text">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" /> {test.duration_minutes} Minutes
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-primary" /> {test.total_questions} MCQs
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => handleStartExam(test)}
                      className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      Start Exam
                    </button>
                    {user?.role === 'admin' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenEditModal(test)}
                          className="flex-1 sm:flex-initial px-4 py-2 border border-border hover:bg-muted-bg text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm(`Are you sure you want to delete the mock test "${test.title}"?`)) {
                              try {
                                await api.deleteMockTest(test.id);
                                fetchMockTests();
                                alert('Mock test deleted successfully');
                              } catch(err) {
                                alert(err.message || 'Failed to delete mock test');
                              }
                            }
                          }}
                          className="flex-1 sm:flex-initial px-4 py-2 bg-danger/10 hover:bg-danger/25 text-danger text-xs font-bold rounded-xl transition-all flex items-center justify-center"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. EXAM CONSOLE INTERFACE */}
      {isExamActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Header Panel */}
          <div className="col-span-1 lg:col-span-3 bg-primary text-white p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
            <div>
              <h3 className="font-extrabold text-sm md:text-base">{activeTest?.title}</h3>
              <p className="text-xs text-white/70">Candidate Dashboard • EPION Exam Console</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-lg border border-white/20">
                <Clock className="w-5 h-5 text-accent animate-pulse" />
                <span className="font-mono text-lg font-extrabold tracking-wide">{formatTime(timeLeft)}</span>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to finish and submit your answers?')) {
                    submitExam();
                  }
                }}
                className="bg-accent hover:bg-amber-600 text-white font-bold text-xs md:text-sm px-4 py-2 rounded-lg transition-colors shadow"
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* Question Console (Left Panel) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
              {/* Question metadata row */}
              <div className="flex justify-between items-center border-b border-border/80 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-primary/10">
                    {activeTestQuestions[currentIdx]?.subject}
                  </span>
                  <div className="text-xs text-muted-text font-bold">
                    Question ID: #{activeTestQuestions[currentIdx]?.id} • Difficulty: {activeTestQuestions[currentIdx]?.difficulty}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleFlag(activeTestQuestions[currentIdx]?.id)}
                  className={`p-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                    flagged[activeTestQuestions[currentIdx]?.id]
                      ? 'bg-amber-light border-accent text-accent'
                      : 'bg-card border-border text-muted-text hover:text-foreground'
                  }`}
                >
                  <Flag className="w-4 h-4" fill={flagged[activeTestQuestions[currentIdx]?.id] ? 'currentColor' : 'none'} />
                  <span>Flag</span>
                </button>
              </div>

              {/* Question Text */}
              <h3 className="text-base md:text-lg font-bold text-foreground leading-snug">
                {activeTestQuestions[currentIdx]?.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {activeTestQuestions[currentIdx]?.options &&
                  activeTestQuestions[currentIdx].options.map((opt, oIdx) => {
                    const isSelected = answers[activeTestQuestions[currentIdx].id] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(activeTestQuestions[currentIdx].id, oIdx)}
                        className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 text-sm transition-all ${
                          isSelected
                            ? 'bg-primary-light border-primary text-primary font-semibold shadow-sm'
                            : 'bg-card border-border text-foreground hover:bg-muted-bg/50'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-primary text-white' : 'bg-muted-bg text-muted-text border border-border'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Console buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-border/80">
                <button
                  onClick={() => handleClearOption(activeTestQuestions[currentIdx].id)}
                  disabled={answers[activeTestQuestions[currentIdx].id] === undefined}
                  className="px-3 py-1.5 border border-border text-xs font-semibold text-muted-text hover:text-danger rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Response
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleNavigateQuestion(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-foreground bg-card hover:bg-muted-bg disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => handleNavigateQuestion(currentIdx + 1)}
                    disabled={currentIdx + 1 === activeTestQuestions.length}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Matrix Panel (Right Panel) */}
          <div className="space-y-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
              <h4 className="font-bold text-foreground text-sm">Question Navigation Map</h4>
              
              <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto pr-1">
                {activeTestQuestions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flagged[q.id];
                  const isVisited = visited[q.id];

                  let cellClass = 'bg-muted-bg border-border text-muted-text';
                  if (isCurrent) {
                    cellClass = 'border-2 border-primary text-primary font-bold shadow-sm';
                  } else if (isFlagged) {
                    cellClass = 'bg-accent/20 border-accent text-accent font-semibold';
                  } else if (isAnswered) {
                    cellClass = 'bg-primary/20 border-primary text-primary font-semibold';
                  } else if (isVisited) {
                    cellClass = 'bg-slate-200 dark:bg-slate-700 border-border text-foreground';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => handleNavigateQuestion(idx)}
                      className={`h-9 w-full rounded-lg border flex items-center justify-center text-xs transition-colors ${cellClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend indicators */}
              <div className="border-t border-border/80 pt-3 space-y-2 text-[10px] font-semibold text-muted-text">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-primary bg-primary/20 block"></span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-accent bg-accent/20 block"></span>
                  <span>Flagged for Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-border bg-slate-200 dark:bg-slate-700 block"></span>
                  <span>Visited / Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-border bg-muted-bg block"></span>
                  <span>Unvisited</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEST RESULT SCORECARD & ANSWER REVIEW */}
      {isReviewMode && (
        <div className="space-y-6">
          {/* Scorecard Widget */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-md relative overflow-hidden print:border-none print:shadow-none">
            {/* Background design elements */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-4 mb-5">
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-widest block">EPION Exam Scorecard</span>
                <h3 className="text-lg font-bold text-foreground">{activeTest?.title}</h3>
                <p className="text-xs text-muted-text mt-0.5">Attempted on {new Date().toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2 print:hidden">
                <button
                  onClick={handlePrintScorecard}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-foreground bg-card hover:bg-muted-bg flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-4 h-4" /> Download PDF Report
                </button>
                <button
                  onClick={() => setIsReviewMode(false)}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Exit Review
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {/* Score widget */}
              <div className="bg-muted-bg/50 border border-border p-4 rounded-xl">
                <div className="text-xs font-semibold text-muted-text uppercase">Total Score</div>
                <div className="text-3xl font-extrabold text-secondary mt-1">{testResult?.score}</div>
                <div className="text-[10px] text-muted-text mt-1">Penalty Penalty Included</div>
              </div>

              {/* Accuracy widget */}
              <div className="bg-muted-bg/50 border border-border p-4 rounded-xl">
                <div className="text-xs font-semibold text-muted-text uppercase">Accuracy Ratio</div>
                <div className="text-3xl font-extrabold text-foreground mt-1">
                  {testResult?.totalAttempted > 0 
                    ? Math.round((testResult?.correctCount / testResult?.totalAttempted) * 100)
                    : 0}%
                </div>
                <div className="text-[10px] text-muted-text mt-1">Correct / Total Attempted</div>
              </div>

              {/* Speed widget */}
              <div className="bg-muted-bg/50 border border-border p-4 rounded-xl">
                <div className="text-xs font-semibold text-muted-text uppercase">Time Taken</div>
                <div className="text-3xl font-extrabold text-foreground mt-1">
                  {Math.floor(testResult?.timeTakenSeconds / 60)}m {testResult?.timeTakenSeconds % 60}s
                </div>
                <div className="text-[10px] text-muted-text mt-1">Limit: {activeTest?.duration_minutes} mins</div>
              </div>

              {/* XP Multiplier widget */}
              <div className="bg-muted-bg/50 border border-border p-4 rounded-xl">
                <div className="text-xs font-semibold text-muted-text uppercase">XP Earned</div>
                <div className="text-3xl font-extrabold text-accent mt-1">+{testResult?.xpEarned}</div>
                <div className="text-[10px] text-muted-text mt-1">New Total: {testResult?.newXp} XP</div>
              </div>
            </div>

            {/* Matrix details */}
            <div className="grid grid-cols-3 gap-3 mt-4 text-center text-xs font-semibold text-white">
              <div className="bg-success py-2 rounded-lg">Correct: {testResult?.correctCount}</div>
              <div className="bg-danger py-2 rounded-lg">Incorrect: {testResult?.incorrectCount}</div>
              <div className="bg-muted-text py-2 rounded-lg">Unattempted: {testResult?.totalQuestions - testResult?.totalAttempted}</div>
            </div>
          </div>

          {/* Interactive Answer review */}
          <div className="space-y-4 print:hidden">
            <h4 className="font-bold text-foreground text-sm">Question-by-Question Diagnostic Review</h4>
            <div className="space-y-4">
              {resultsReviewQuestions.map((q, qIdx) => {
                const userChoice = q.user_chosen;
                const correctChoice = q.correct_answer;
                const wasAttempted = userChoice !== null;
                const wasCorrect = q.is_correct;

                return (
                  <div key={q.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-primary/15">
                        Q{qIdx + 1} • {q.subject}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-border/80 ${
                        !wasAttempted ? 'bg-muted-bg text-muted-text' :
                        wasCorrect ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                      }`}>
                        {!wasAttempted ? 'Skipped/Unattempted' :
                         wasCorrect ? 'Correct Answer' : 'Incorrect Answer'}
                      </span>
                    </div>

                    <h4 className="font-bold text-foreground text-sm md:text-base leading-snug">{q.question}</h4>

                    {/* Options status */}
                    <div className="space-y-2">
                      {q.options && q.options.map((opt, oIdx) => {
                        const isCorrectOption = oIdx === correctChoice;
                        const isUserOption = oIdx === userChoice;

                        let style = 'bg-card border-border text-muted-text';
                        let icon = null;

                        if (isCorrectOption) {
                          style = 'bg-success-light border-success/35 text-success font-semibold';
                          icon = <Check className="w-4 h-4 text-success shrink-0" />;
                        } else if (isUserOption) {
                          style = 'bg-danger-light border-danger/35 text-danger font-semibold';
                          icon = <X className="w-4 h-4 text-danger shrink-0" />;
                        }

                        return (
                          <div 
                            key={oIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${style}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isCorrectOption ? 'bg-success text-white' :
                                isUserOption ? 'bg-danger text-white' : 'bg-muted-bg text-muted-text'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {icon}
                          </div>
                        );
                      })}
                    </div>

                    {/* Rationale explanation */}
                    <div className="bg-muted-bg border border-border/80 p-3.5 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Rational Explanation</span>
                      </div>
                      <p className="leading-relaxed text-muted-text">{q.explanation}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* 4. EDIT MOCK TEST MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/80 pb-3">
              <h3 className="font-extrabold text-foreground text-base">Edit Mock Test Configuration</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-text hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Mock Test Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value))}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Negative Marking</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editNegMarking}
                    onChange={(e) => setEditNegMarking(parseFloat(e.target.value))}
                    className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* Lock Switch */}
              <div className="flex items-center justify-between p-3 bg-muted-bg/50 border border-border rounded-xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">Lock Mock Test</span>
                  <p className="text-[10px] text-muted-text">Lock exam from being started by candidates</p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsLocked}
                  onChange={(e) => setEditIsLocked(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </div>

              {/* Batch Restrictions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-text uppercase tracking-wider block">Restrict to Selected Batches</span>
                <p className="text-[10px] text-muted-text leading-snug">Only checked batches will be granted access to this mock test. Uncheck all to make it available to everyone.</p>
                
                <div className="border border-border rounded-xl divide-y divide-border/60 max-h-36 overflow-y-auto p-1 bg-muted-bg/30">
                  {batches.map((b) => {
                    const isChecked = editAllowedBatches.includes(b.id);
                    return (
                      <div 
                        key={b.id}
                        onClick={() => {
                          setEditAllowedBatches(prev => {
                            if (prev.includes(b.id)) {
                              return prev.filter(id => id !== b.id);
                            } else {
                              return [...prev, b.id];
                            }
                          });
                        }}
                        className={`p-2 text-xs flex items-center gap-2 cursor-pointer hover:bg-card transition-colors ${isChecked ? 'bg-primary-light/40 font-semibold' : ''}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5 shrink-0" 
                        />
                        <span>{b.name}</span>
                      </div>
                    );
                  })}
                  {batches.length === 0 && (
                    <div className="p-4 text-center text-muted-text">No student batches created yet.</div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Save Exam Configuration
              </button>
            </form>

            <hr className="border-border/60 my-4" />

            {/* CSV Questions Management */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-muted-text uppercase tracking-wider block">Bulk Manage Questions (CSV)</span>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.downloadMockTestTemplateCsv();
                    } catch (err) {
                      alert('Error downloading template: ' + err.message);
                    }
                  }}
                  className="py-2 px-3 border border-border bg-card hover:bg-muted-bg/50 rounded-xl text-[10px] font-bold text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Download Template</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.downloadMockTestQuestionsCsv(editingTest.id, editingTest.title);
                    } catch (err) {
                      alert('Error exporting questions: ' + err.message);
                    }
                  }}
                  className="py-2 px-3 border border-border bg-card hover:bg-muted-bg/50 rounded-xl text-[10px] font-bold text-foreground transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>Export Questions</span>
                </button>
              </div>

              {/* Upload CSV Input */}
              <div className="relative">
                <label className="border border-dashed border-border hover:border-primary/60 bg-muted-bg/10 hover:bg-muted-bg/30 p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvUpload}
                    disabled={csvUploading}
                  />
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-muted-text" />
                    <span className="text-xs font-bold text-foreground">
                      {csvUploading ? 'Uploading & Replacing...' : 'Upload & Replace Questions (.csv)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-text text-center leading-snug">
                    Warning: This will overwrite and replace all current questions in this mock test.
                  </span>
                </label>
              </div>

              {csvError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl flex gap-2 items-start text-[10px] leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div className="space-y-1 w-full">
                    <span className="font-bold block">CSV Import Failed:</span>
                    <ul className="list-disc pl-3.5 space-y-0.5 max-h-24 overflow-y-auto w-full">
                      {Array.isArray(csvError) ? csvError.map((err, idx) => <li key={idx}>{err}</li>) : <li>{csvError}</li>}
                    </ul>
                  </div>
                </div>
              )}

              {csvSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex gap-2 items-center text-[10px] font-bold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{csvSuccess}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
