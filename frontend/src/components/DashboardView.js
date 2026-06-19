'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Trophy, Target, Flame, Award, HelpCircle, 
  BrainCircuit, Sparkles, ChevronRight, BookOpen, 
  AlertTriangle, CheckCircle, RefreshCw, Calendar 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, LineChart, Line, CartesianGrid 
} from 'recharts';

export default function DashboardView({ user, onNavigateToSection, onStartQuestionPractice }) {
  const [stats, setStats] = useState(null);
  const [subjectPerf, setSubjectPerf] = useState([]);
  const [progressHistory, setProgressHistory] = useState([]);
  const [aiRecs, setAiRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const [challengeStreak, setChallengeStreak] = useState(0);
  const [isCompletedToday, setIsCompletedToday] = useState(false);

  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [trialTimeRemaining, setTrialTimeRemaining] = useState('');

  useEffect(() => {
    if (user && !user.is_paid && user.role !== 'admin') {
      const shown = sessionStorage.getItem('trial_popup_shown');
      if (!shown) {
        if (user.created_at) {
          const createdTime = new Date(user.created_at).getTime();
          const elapsed = Date.now() - createdTime;
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          const remaining = threeDaysMs - elapsed;
          if (remaining > 0) {
            const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            
            let timeStr = '';
            if (days > 0) {
              timeStr = `${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours > 1 ? 's' : ''}`;
            } else if (hours > 0) {
              timeStr = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
            } else {
              timeStr = `${minutes} minute${minutes > 1 ? 's' : ''}`;
            }
            setTrialTimeRemaining(timeStr);
            setShowTrialPopup(true);
            sessionStorage.setItem('trial_popup_shown', 'true');
          }
        }
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const streak = parseInt(localStorage.getItem(`challenge_streak_${user.id}`) || '0');
      const lastCompleted = localStorage.getItem(`last_completed_challenge_date_${user.id}`);
      const todayDate = new Date().toISOString().split('T')[0];
      setChallengeStreak(streak);
      setIsCompletedToday(lastCompleted === todayDate);
    } catch (e) {
      console.warn('Error reading challenge stats:', e);
    }
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryData, subjectData, progressData, aiData] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getSubjectPerformance(),
        api.getProgressHistory(),
        api.getAiRecommendations()
      ]);

      setStats(summaryData);
      setSubjectPerf(subjectData);
      setProgressHistory(progressData);
      setAiRecs(aiData);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Could not load performance stats. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-text text-sm font-medium">Analyzing exam prep status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-lg mx-auto mt-12 bg-card border border-border rounded-xl text-center">
        <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">Stats Offline</h3>
        <p className="text-muted-text text-sm mb-4">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg flex items-center gap-2 mx-auto transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Welcome & Streak Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card to-primary-light border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="space-y-1 z-10">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-foreground">
            <span>Hello and welcome, {user?.name || 'Candidate'}!</span>
            <Sparkles className="w-5 h-5 text-primary animate-pulse shrink-0" />
          </h2>
          <p className="text-muted-text text-sm max-w-md">
            Your EPION preparation scorecard is looking active. Keep maintaining your daily study streak!
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary-light border border-primary/20 px-4 py-2.5 rounded-xl z-10 shrink-0">
          <Flame className="w-8 h-8 text-primary animate-bounce" fill="currentColor" />
          <div>
            <div className="text-2xl font-extrabold leading-none text-foreground">{stats?.streakDays || 0} Days</div>
            <div className="text-xs text-muted-text font-medium">Current Study Streak</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Attempted</span>
            <span className="text-2xl font-extrabold text-foreground">{stats?.totalQuestionsAttempted || 0}</span>
            <span className="text-xs text-muted-text block">MCQs Answered</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Accuracy</span>
            <span className="text-2xl font-extrabold text-foreground">{stats?.accuracyPercentage || 0}%</span>
            <span className="text-xs text-muted-text block">Correct Ratio</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary-light text-secondary flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* XP Points */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-text uppercase tracking-wider block">XP Points</span>
            <span className="text-2xl font-extrabold text-foreground">{stats?.xpPoints || 0}</span>
            <span className="text-xs text-muted-text block">Level {Math.floor((stats?.xpPoints || 0) / 100) + 1} Candidate</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-accent-light text-accent flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Predicted Exam Rank */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-start justify-between bg-gradient-to-br from-card to-secondary/5">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-text uppercase tracking-wider block">Predicted Rank</span>
            <span className="text-2xl font-extrabold text-secondary">#{stats?.predictedExamRank || 'N/A'}</span>
            <span className="text-xs text-muted-text block">Out of 50k Candidates</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary-light text-secondary flex items-center justify-center shadow-inner">
            <Trophy className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* AI Features & Personal Study Guide */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center gap-2 text-primary mb-3">
          <BrainCircuit className="w-5 h-5" />
          <h3 className="font-bold text-foreground">AI Diagnostic & Study Guide</h3>
        </div>
        <p className="text-sm text-foreground mb-4 leading-relaxed bg-muted-bg/50 border border-border/40 rounded-xl p-3.5">
          {aiRecs?.aiAnalysis || 'Loading recommendation insights...'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Weak Topics */}
          <div className="bg-muted-bg p-3.5 rounded-xl border border-border/50">
            <div className="text-xs font-bold uppercase text-danger mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Weak Target Areas
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiRecs?.weakAreas?.map((item, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-danger-light text-danger text-xs font-semibold rounded-full border border-danger/10">
                  {item}
                </span>
              ))}
            </div>
          </div>
          {/* Strong Topics */}
          <div className="bg-muted-bg p-3.5 rounded-xl border border-border/50">
            <div className="text-xs font-bold uppercase text-success mb-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Strong Proficiencies
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aiRecs?.strongAreas?.map((item, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-success-light text-success text-xs font-semibold rounded-full border border-success/10">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recommended Questions Section */}
        {aiRecs?.recommendedQuestions && aiRecs.recommendedQuestions.length > 0 && (
          <div className="space-y-2.5 mt-4">
            <h4 className="text-xs font-bold text-muted-text uppercase tracking-wider">AI Recommended Questions</h4>
            <div className="space-y-2">
              {aiRecs.recommendedQuestions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => onStartQuestionPractice(q)}
                  className="w-full bg-card hover:bg-muted-bg/50 border border-border p-3 rounded-xl flex items-center justify-between text-left transition-colors group"
                >
                  <div className="space-y-1 pr-4">
                    <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
                      {q.subject}
                    </span>
                    <p className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {q.question}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-text shrink-0 group-hover:transform group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress Charts & Activity Logs */}
      {isMounted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Progress Line Chart */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Weekly Practice Progress</span>
            </h3>
            <div className="h-60 w-full">
              {progressHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(tick) => {
                        const dateParts = tick.split('-');
                        return `${dateParts[1]}/${dateParts[2]}`;
                      }}
                      tick={{ fill: 'var(--muted-text)', fontSize: 11 }}
                      stroke="var(--card-border)"
                    />
                    <YAxis tick={{ fill: 'var(--muted-text)', fontSize: 11 }} stroke="var(--card-border)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--card-border)', 
                        color: 'var(--foreground)',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" name="Attempted" dataKey="attempted" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" name="Correct" dataKey="correct" stroke="var(--secondary)" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-text text-sm">No activity recorded this week yet.</div>
              )}
            </div>
          </div>

          {/* Subject Performance Breakdown Bar Chart */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-secondary" />
              <span>Subject Accuracy breakdown</span>
            </h3>
            <div className="h-60 w-full">
              {subjectPerf.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectPerf} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--card-border)" />
                    <XAxis 
                      dataKey="subject" 
                      tickFormatter={(tick) => tick.substring(0, 8) + '..'}
                      tick={{ fill: 'var(--muted-text)', fontSize: 11 }}
                      stroke="var(--card-border)"
                    />
                    <YAxis unit="%" tick={{ fill: 'var(--muted-text)', fontSize: 11 }} stroke="var(--card-border)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card-bg)', 
                        borderColor: 'var(--card-border)', 
                        color: 'var(--foreground)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar name="Accuracy %" dataKey="accuracy" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-text text-sm">Attempt practice questions to populate subject accuracy breakdown.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Daily Challenge Card */}
      {(() => {
        const CHALLENGE_SUBJECTS = [
          { subject: 'Medical Surgical Nursing', title: 'Med-Surg Clinical Mastery', description: 'Attempt 10 quick Medical-Surgical MCQs and unlock an extra +20 XP!' },
          { subject: 'Pediatric Nursing', title: 'Pediatric Growth & Milestones', description: 'Attempt 10 quick Pediatric MCQs and unlock an extra +20 XP!' },
          { subject: 'Obstetrics & Gynecology (OBGYN)', title: 'Maternal & Newborn Care Booster', description: 'Attempt 10 quick OBGYN MCQs and unlock an extra +20 XP!' },
          { subject: 'Fundamentals of Nursing', title: 'Nursing Procedures & Safety', description: 'Attempt 10 quick Fundamentals MCQs and unlock an extra +20 XP!' },
          { subject: 'Anatomy & Physiology', title: 'Human Anatomy & Systems', description: 'Attempt 10 quick Anatomy & Physiology MCQs and unlock an extra +20 XP!' },
          { subject: 'Pharmacology', title: 'Pharmacology Medication Booster', description: 'Attempt 10 quick Pharmacology MCQs and unlock an extra +20 XP!' }
        ];

        const todayStr = new Date().toDateString();
        const getHash = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
          }
          return Math.abs(hash);
        };
        const challengeIndex = getHash(todayStr) % CHALLENGE_SUBJECTS.length;
        const todayChallenge = CHALLENGE_SUBJECTS[challengeIndex];

        if (isCompletedToday) {
          return (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest inline-block">Daily Challenge</span>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span>Challenge Completed!</span>
                  <CheckCircle className="w-5 h-5 text-accent animate-pulse" />
                </h3>
                <p className="text-white/80 text-sm">You completed today's challenge and claimed +20 bonus XP!</p>
                {challengeStreak > 0 && (
                  <div className="text-xs font-bold text-accent flex items-center gap-1 mt-1">
                    <Flame className="w-4 h-4 fill-current animate-bounce" />
                    <span>Completion Streak: {challengeStreak} Days</span>
                  </div>
                )}
              </div>
              <button
                disabled
                className="bg-white/20 text-white/70 px-5 py-2 rounded-xl text-sm font-bold shadow-md cursor-not-allowed shrink-0 border border-white/10"
              >
                Completed Today
              </button>
            </div>
          );
        }

        return (
          <div className="bg-gradient-to-r from-secondary to-teal-500 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest inline-block">Daily Challenge</span>
              <h3 className="text-lg font-bold">{todayChallenge.title}</h3>
              <p className="text-white/80 text-sm">{todayChallenge.description}</p>
              {challengeStreak > 0 ? (
                <div className="text-xs font-bold text-accent flex items-center gap-1 mt-1">
                  <Flame className="w-4 h-4 fill-current animate-bounce" />
                  <span>Streak: {challengeStreak} Days</span>
                </div>
              ) : (
                <p className="text-white/60 text-[11px] font-semibold mt-1">Start your daily challenge streak today!</p>
              )}
            </div>
            <button
              onClick={() => onNavigateToSection('practice', { subject: todayChallenge.subject, isDailyChallenge: true })}
              className="bg-white hover:bg-white/95 text-secondary px-5 py-2 rounded-xl text-sm font-bold shadow-md transition-colors shrink-0"
            >
              Accept Challenge
            </button>
          </div>
        );
      })()}

      {/* 3-Day Trial Status On-Login Popup Modal */}
      {showTrialPopup && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div 
            className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl relative overflow-hidden p-6 text-center animate-scale-up"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Top brand accent border line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary to-orange-500"></div>
            
            {/* Mascot / Icon */}
            <div className="w-16 h-16 bg-primary-light text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/10 shadow-sm animate-pulse">
              <Flame className="w-8 h-8 fill-current" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-foreground tracking-tight">Welcome Back to EPION!</h3>
            
            {/* Description */}
            <p className="text-muted-text text-sm mt-2 font-medium">
              You are currently using the <strong>3-Day Free Trial</strong> version.
            </p>

            {/* Timer Badge */}
            <div className="my-5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-xs mx-auto text-center">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-widest block">Time Remaining</span>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {trialTimeRemaining} left
              </div>
            </div>

            <p className="text-xs text-muted-text max-w-sm mx-auto mb-6 leading-relaxed">
              Unlock the complete premium preparation portal containing 5,000+ MCQs, full mock exams with negative markings, and advanced analytics.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowTrialPopup(false);
                  onNavigateToSection('settings');
                }}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all text-sm cursor-pointer"
              >
                Upgrade to Premium
              </button>
              <button
                onClick={() => setShowTrialPopup(false)}
                className="w-full py-2 px-4 hover:bg-muted-bg text-muted-text hover:text-foreground font-bold rounded-xl transition-all text-xs cursor-pointer"
              >
                Continue Practice Trial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
