'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  BookOpen, ChevronRight, Check, X, Bookmark, AlertTriangle, 
  ArrowLeft, ArrowRight, Play, Star, Sparkles, MessageSquareWarning,
  Flame, CheckCircle
} from 'lucide-react';

export default function PracticeView({ initialFilters = null, directLaunchQuestion = null, onNavigateHome, user }) {
  const [subjectsHierarchy, setSubjectsHierarchy] = useState({});
  const [subjectsMetadata, setSubjectsMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [reportingQ, setReportingQ] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Filter configuration states for starting session
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sessionSize, setSessionSize] = useState(10);
  const [activeSession, setActiveSession] = useState(false);

  const [isDailyChallenge, setIsDailyChallenge] = useState(false);
  const [showChallengeCompletionModal, setShowChallengeCompletionModal] = useState(false);
  const [challengeStreak, setChallengeStreak] = useState(0);

  const checkBookmarkStatus = async (questionId) => {
    try {
      const bookmarks = await api.getBookmarks();
      const bookmarked = bookmarks.some(b => b.id === questionId);
      setIsBookmarked(bookmarked);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (initialFilters) {
      setSelectedSubject(initialFilters.subject || '');
      setSelectedTopic(initialFilters.topic || '');
      setSelectedDifficulty(initialFilters.difficulty || '');
      
      if (initialFilters.list && initialFilters.list.length > 0) {
        setSessionQuestions(initialFilters.list);
        setCurrentIndex(initialFilters.startIndex || 0);
        setSelectedOption(null);
        setHasSubmitted(false);
        setAttemptResult(null);
        setConfidence(0);
        setActiveSession(true);
        checkBookmarkStatus(initialFilters.list[initialFilters.startIndex || 0].id);
        return;
      }
      
      if (initialFilters.subject) {
        if (initialFilters.isDailyChallenge) {
          setIsDailyChallenge(true);
          setSessionSize(10);
        } else {
          setIsDailyChallenge(false);
        }
        // Automatically fetch questions
        startPracticeSession(initialFilters.subject, initialFilters.topic || '', initialFilters.difficulty || '', initialFilters.isDailyChallenge ? 10 : sessionSize);
      }
    }
  }, [initialFilters]);

  useEffect(() => {
    if (directLaunchQuestion) {
      setSessionQuestions([directLaunchQuestion]);
      setCurrentIndex(0);
      setSelectedOption(null);
      setHasSubmitted(false);
      setAttemptResult(null);
      setConfidence(0);
      setActiveSession(true);
      checkBookmarkStatus(directLaunchQuestion.id);
    }
  }, [directLaunchQuestion]);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const data = await api.getSubjectTopics();
      if (data && data.hierarchy) {
        setSubjectsHierarchy(data.hierarchy);
        setSubjectsMetadata(data.metadata || {});
      } else {
        setSubjectsHierarchy(data || {});
        setSubjectsMetadata({});
      }
    } catch (err) {
      console.error('Error fetching subject metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPracticeSession = async (subject = selectedSubject, topic = selectedTopic, difficulty = selectedDifficulty, customLimit = null) => {
    if (subject) {
      const meta = subjectsMetadata[subject];
      if (meta && user?.role !== 'admin') {
        if (meta.status === 'coming_soon') {
          alert('This subject is coming soon and cannot be practiced yet.');
          return;
        }
        if (meta.status === 'inactive') {
          alert('This subject is currently inactive and cannot be practiced.');
          return;
        }
      }
    }
    setLoading(true);
    try {
      const filters = {
        subject: subject || undefined,
        topic: topic || undefined,
        difficulty: difficulty || undefined,
        limit: customLimit !== null ? customLimit : sessionSize
      };

      const questions = await api.getRandomQuestions(filters);
      
      if (questions.length === 0) {
        alert('No questions found matching the selected filters. Please try another subject.');
        setLoading(false);
        return;
      }

      setSessionQuestions(questions);
      setCurrentIndex(0);
      setSelectedOption(null);
      setHasSubmitted(false);
      setAttemptResult(null);
      setConfidence(0);
      setActiveSession(true);

      // Check bookmark status of first question
      checkBookmarkStatus(questions[0].id);
    } catch (err) {
      console.error('Error starting practice session:', err);
    } finally {
      setLoading(false);
    }
  };



  const handleSelectOption = (index) => {
    if (hasSubmitted) return;
    setSelectedOption(index);
  };

  const handleCompleteDailyChallenge = () => {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const userId = user?.id || 'guest';
      const streakKey = `challenge_streak_${userId}`;
      const lastCompletedKey = `last_completed_challenge_date_${userId}`;
      
      const lastCompleted = localStorage.getItem(lastCompletedKey);
      
      let newStreak = 1;
      if (lastCompleted !== todayDate) {
        const streak = parseInt(localStorage.getItem(streakKey) || '0');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastCompleted === yesterdayStr) {
          newStreak = streak + 1;
        }
        
        localStorage.setItem(streakKey, newStreak.toString());
        localStorage.setItem(lastCompletedKey, todayDate);
      } else {
        newStreak = parseInt(localStorage.getItem(streakKey) || '1');
      }
      
      setChallengeStreak(newStreak);
      setShowChallengeCompletionModal(true);
    } catch (e) {
      console.warn('Error saving challenge progress:', e);
      setShowChallengeCompletionModal(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || hasSubmitted) return;

    setLoading(true);
    try {
      const currentQuestion = sessionQuestions[currentIndex];
      const isLastQuestion = currentIndex + 1 === sessionQuestions.length;
      
      const result = await api.submitAttempt(
        currentQuestion.id,
        selectedOption,
        confidence || 3, // default 3 stars
        isDailyChallenge && isLastQuestion // isDailyChallengeComplete
      );
      setAttemptResult(result);
      setHasSubmitted(true);

      if (isDailyChallenge && isLastQuestion) {
        handleCompleteDailyChallenge();
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    const currentQuestion = sessionQuestions[currentIndex];
    try {
      const res = await api.toggleBookmark(currentQuestion.id);
      setIsBookmarked(res.bookmarked);
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleReportQuestion = () => {
    setReportingQ(true);
    setReportSuccess(false);
  };

  const submitReport = () => {
    if (!reportReason) return;
    // Simulate reporting API
    setTimeout(() => {
      setReportSuccess(true);
      setReportReason('');
      setTimeout(() => {
        setReportingQ(false);
        setReportSuccess(false);
      }, 1500);
    }, 500);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < sessionQuestions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setHasSubmitted(false);
      setAttemptResult(null);
      setConfidence(0);
      checkBookmarkStatus(sessionQuestions[nextIdx].id);
    } else {
      // Completed practice session
      alert('Congratulations! You completed this practice set.');
      setActiveSession(false);
      onNavigateHome();
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setSelectedOption(null);
      setHasSubmitted(false);
      setAttemptResult(null);
      setConfidence(0);
      checkBookmarkStatus(sessionQuestions[prevIdx].id);
    }
  };

  if (loading && !activeSession) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-text text-sm font-medium">Loading question catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {!activeSession ? (
        // Selector View
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-foreground">Practice Zone</h2>
            <p className="text-muted-text text-sm">Choose a subject, filter details, and sharpen your skills with real MCQ formats.</p>
          </div>

          {/* Quick Filters */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Configure Practice Session</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Subject Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedTopic(''); // Reset topic
                  }}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">-- All Subjects --</option>
                  {Object.keys(subjectsHierarchy).map((sub, idx) => {
                    const meta = subjectsMetadata[sub] || {};
                    const isComingSoon = meta.status === 'coming_soon';
                    const isInactive = meta.status === 'inactive';
                    if (isInactive && user?.role !== 'admin') return null;
                    return (
                      <option 
                        key={idx} 
                        value={sub}
                        disabled={isComingSoon && user?.role !== 'admin'}
                      >
                        {sub} {isComingSoon ? ' (Coming Soon)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Topic Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedSubject}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">-- All Topics --</option>
                  {selectedSubject && subjectsHierarchy[selectedSubject]?.map((t, idx) => (
                    <option key={idx} value={t.topic}>{t.topic} ({t.count})</option>
                  ))}
                </select>
              </div>

              {/* Difficulty select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">-- All Difficulties --</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Session Size select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Set Size</label>
                <select
                  value={sessionSize}
                  onChange={(e) => setSessionSize(parseInt(e.target.value))}
                  className="w-full py-2 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="20">20 Questions</option>
                  <option value="30">30 Questions</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => startPracticeSession()}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Interactive Practice</span>
            </button>
          </div>

          {/* Catalog of Subjects */}
          <div className="space-y-3">
            <h3 className="font-bold text-foreground text-sm">Browse Subject-wise Libraries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(subjectsHierarchy).map(([subject, topics], idx) => {
                const totalQuestions = topics.reduce((sum, item) => sum + item.count, 0);
                const meta = subjectsMetadata[subject] || {};
                const isComingSoon = meta.status === 'coming_soon';
                const isInactive = meta.status === 'inactive';
                const isActive = meta.status === 'active' || !meta.status;
                return (
                  <div
                    key={idx}
                    className={`bg-card border p-4 rounded-xl shadow-sm flex items-center justify-between transition-all group ${
                      isComingSoon ? 'opacity-75 border-border' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-1.5 pr-4">
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm md:text-base flex items-center flex-wrap gap-1.5">
                        <span>{subject}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black rounded uppercase tracking-wider border border-emerald-500/10 shrink-0">
                            Active
                          </span>
                        )}
                        {isComingSoon && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black rounded uppercase tracking-wider border border-amber-500/10 shrink-0">
                            Coming Soon
                          </span>
                        )}
                        {isInactive && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-danger-light text-danger font-black rounded uppercase tracking-wider border border-danger/10 shrink-0">
                            Inactive
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-text">
                        {topics.length} topics • {totalQuestions} questions
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (isComingSoon && user?.role !== 'admin') return;
                        if (isInactive && user?.role !== 'admin') return;
                        setSelectedSubject(subject);
                        setSelectedTopic('');
                        startPracticeSession(subject, '', '');
                      }}
                      disabled={(isComingSoon || isInactive) && user?.role !== 'admin'}
                      className={`p-2.5 rounded-lg transition-colors ${
                        (isComingSoon || isInactive) && user?.role !== 'admin'
                          ? 'bg-muted-bg text-muted-text/30 border border-border cursor-not-allowed'
                          : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
                      }`}
                      title={isComingSoon ? 'Coming Soon' : isInactive ? 'Inactive' : 'Play'}
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Question Session Screen (Flashcard Learning Mode)
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setActiveSession(false);
                if ((initialFilters?.source === 'revision' || directLaunchQuestion) && onNavigateHome) {
                  onNavigateHome();
                }
              }}
              className="px-3 py-1.5 border border-border hover:bg-muted-bg text-muted-text hover:text-foreground text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              &larr; Exit Session
            </button>

            <div className="text-xs font-bold text-muted-text">
              MCQ {currentIndex + 1} of {sessionQuestions.length}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleBookmark}
                className={`p-1.5 rounded-lg border border-border transition-colors ${
                  isBookmarked 
                    ? 'bg-accent-light border-accent/35 text-accent' 
                    : 'bg-card text-muted-text hover:text-foreground'
                }`}
                title="Bookmark Question"
              >
                <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleReportQuestion}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-text hover:text-danger hover:border-danger/20 transition-colors"
                title="Report Discrepancy"
              >
                <MessageSquareWarning className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isDailyChallenge && (
            <div className="bg-gradient-to-r from-secondary to-teal-500 text-white px-4 py-3 rounded-xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-accent animate-bounce" fill="currentColor" />
                <div className="text-left">
                  <h4 className="text-xs font-black uppercase tracking-widest leading-none">Daily Challenge Active</h4>
                  <span className="text-[10px] text-white/85 font-bold">Earn +20 XP Completion Bonus</span>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black bg-white/20 px-2 py-0.5 rounded shrink-0">
                Challenge Progress: {currentIndex + (hasSubmitted ? 1 : 0)} / 10
              </span>
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%` }}
            ></div>
          </div>

          {/* MCQ Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-primary bg-primary-light px-2.5 py-0.5 rounded-full border border-primary/15 uppercase tracking-wider">
                {sessionQuestions[currentIndex]?.subject}
              </span>
              <span className="text-[10px] font-bold text-muted-text bg-muted-bg px-2.5 py-0.5 rounded-full border border-border/80">
                {sessionQuestions[currentIndex]?.topic}
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/80 ${
                sessionQuestions[currentIndex]?.difficulty === 'Easy' ? 'bg-success-light text-success' :
                sessionQuestions[currentIndex]?.difficulty === 'Medium' ? 'bg-accent-light text-accent' :
                'bg-danger-light text-danger'
              }`}>
                {sessionQuestions[currentIndex]?.difficulty}
              </span>
              {sessionQuestions[currentIndex]?.previous_year_indicator && (
                <span className="text-[10px] font-bold text-secondary bg-secondary-light px-2.5 py-0.5 rounded-full border border-secondary/15 flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-secondary animate-pulse" />
                  {sessionQuestions[currentIndex]?.previous_year_indicator}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h3 className="text-base md:text-lg font-bold text-foreground leading-snug">
              {sessionQuestions[currentIndex]?.question}
            </h3>

            {/* Options list */}
            <div className="space-y-3">
              {sessionQuestions[currentIndex]?.options && 
                sessionQuestions[currentIndex].options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrectAnswer = idx === sessionQuestions[currentIndex].correct_answer;
                  
                  let optionClass = 'bg-card hover:bg-muted-bg border-border text-foreground';
                  let iconElement = null;

                  if (hasSubmitted) {
                    if (isCorrectAnswer) {
                      optionClass = 'bg-success-light border-success/40 text-success font-semibold shadow-sm';
                      iconElement = <Check className="w-4 h-4 text-success shrink-0" />;
                    } else if (isSelected) {
                      optionClass = 'bg-danger-light border-danger/40 text-danger font-semibold shadow-sm';
                      iconElement = <X className="w-4 h-4 text-danger shrink-0" />;
                    } else {
                      optionClass = 'bg-card border-border text-muted-text opacity-70';
                    }
                  } else if (isSelected) {
                    optionClass = 'bg-primary-light border-primary text-primary font-semibold shadow-sm';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={hasSubmitted}
                      className={`w-full p-4 rounded-xl border text-left flex items-center justify-between text-sm transition-all duration-150 ${optionClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          hasSubmitted && isCorrectAnswer ? 'bg-success text-white' :
                          hasSubmitted && isSelected ? 'bg-danger text-white' :
                          isSelected ? 'bg-primary text-white' : 'bg-muted-bg text-muted-text border border-border'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-tight">{opt}</span>
                      </div>
                      {iconElement}
                    </button>
                  );
                })}
            </div>

            {/* Action Buttons */}
            {!hasSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null || loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
              >
                Submit Answer
              </button>
            ) : (
              // Score details and explanation
              <div className="space-y-5 border-t border-border pt-5 animate-slide-up">
                {/* Confidence rating input */}
                <div className="bg-muted-bg/50 border border-border p-3.5 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-muted-text uppercase tracking-wider text-center">How confident were you with this answer?</div>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setConfidence(star)}
                        className="p-1 hover:transform hover:scale-110 transition-transform"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= confidence 
                              ? 'text-accent fill-current' 
                              : 'text-muted-text/30 hover:text-accent/60'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score update badge */}
                <div className={`p-3 rounded-xl border flex items-center gap-3 text-sm font-semibold ${
                  attemptResult?.isCorrect 
                    ? 'bg-success-light border-success/20 text-success' 
                    : 'bg-danger-light border-danger/20 text-danger'
                }`}>
                  <span className="text-2xl">
                    {attemptResult?.isCorrect ? '🎉' : '💡'}
                  </span>
                  <div>
                    <div>{attemptResult?.isCorrect ? 'Correct Answer!' : 'Incorrect Attempt'}</div>
                    <div className="text-xs text-muted-text font-normal">
                      Earned <strong className={attemptResult?.isCorrect ? 'text-success' : 'text-danger'}>+{attemptResult?.xpEarned} XP</strong>. Total Streak: {attemptResult?.streak} days
                    </div>
                  </div>
                </div>

                {/* Detailed Explanation */}
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <span>Rational Explanation</span>
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-text bg-muted-bg border border-border/80 rounded-xl p-4">
                    {sessionQuestions[currentIndex]?.explanation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-foreground bg-card hover:bg-muted-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={!hasSubmitted}
              className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1 shadow"
            >
              <span>{currentIndex + 1 === sessionQuestions.length ? 'Complete Set' : 'Next MCQ'}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* Discrepancy report modal */}
      {reportingQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fade-in p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger" />
              <span>Report Incorrect Question</span>
            </h3>
            <p className="text-xs text-muted-text">
              Admins review all submitted reports. Please indicate what error you found in the question options, answer key, or rational explanation.
            </p>

            {reportSuccess ? (
              <div className="bg-success-light border border-success/20 text-success text-sm rounded-lg p-3 text-center animate-slide-up">
                Report logged successfully. Thank you for making our database accurate!
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  placeholder="Explain the error (e.g. Option C is correct instead of B because...)"
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-3 bg-muted-bg border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground placeholder:text-muted-text/60"
                ></textarea>
                <div className="flex gap-2 justify-end text-xs font-bold">
                  <button
                    onClick={() => setReportingQ(false)}
                    className="px-4 py-2 border border-border rounded-lg text-muted-text hover:bg-muted-bg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReport}
                    disabled={!reportReason}
                    className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Log Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Daily Challenge Completion Modal */}
      {showChallengeCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4">
          <div 
            className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center text-center animate-scale-up"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Top accent border */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

            {/* Glowing Backdrop */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
              <Check className="w-8 h-8 font-black" />
            </div>

            {/* Headers */}
            <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Challenge Completed!</h3>
            <p className="text-muted-text text-sm mt-2 max-w-xs leading-relaxed">
              Congratulations! You completed today's EPION Daily Challenge successfully.
            </p>

            {/* Streak & Bonus Details */}
            <div className="w-full bg-muted-bg border border-border rounded-xl p-4 my-5 flex items-center justify-around">
              <div className="text-center space-y-1">
                <div className="text-2xl font-black text-foreground flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6 text-accent fill-accent animate-pulse" />
                  <span>{challengeStreak}</span>
                </div>
                <div className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Streak Days</div>
              </div>
              <div className="w-px bg-border h-8"></div>
              <div className="text-center space-y-1">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
                  <span>+20</span>
                </div>
                <div className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Bonus XP</div>
              </div>
            </div>

            {/* Complete button */}
            <button
              onClick={() => {
                setShowChallengeCompletionModal(false);
                setActiveSession(false);
                onNavigateHome();
              }}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
