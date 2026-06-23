'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import AuthView from '../components/AuthView';
import DashboardView from '../components/DashboardView';
import PracticeView from '../components/PracticeView';
import MockTestView from '../components/MockTestView';
import RevisionView from '../components/RevisionView';
import LeaderboardView from '../components/LeaderboardView';
import AdminView from '../components/AdminView';
import ReportsView from '../components/ReportsView';
import SettingsView from '../components/SettingsView';

import { 
  LayoutDashboard, BookOpen, Trophy, Bookmark, 
  Award, Shield, LogOut, Sun, Moon, HeartPulse, Settings, BarChart3 
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  // States to facilitate cross-component launching (e.g. clicking recommended question)
  const [practiceFilters, setPracticeFilters] = useState(null);
  const [directQuestion, setDirectQuestion] = useState(null);

  const [trialTimeRemaining, setTrialTimeRemaining] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const [runtimeError, setRuntimeError] = useState(null);

  useEffect(() => {
    // Sync theme on startup
    let savedTheme = 'light';
    try {
      savedTheme = localStorage.getItem('theme') || 'light';
    } catch (e) {
      console.warn('LocalStorage blocked or not supported:', e);
    }
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    // Capture errors to display on loading screen
    const handleError = (event) => {
      setRuntimeError(event.error?.message || event.message || 'Unknown runtime error');
    };
    const handleRejection = (event) => {
      setRuntimeError(event.reason?.message || event.reason || 'Unhandled promise rejection');
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Hydrate user session
    hydrateSession();

    // Listen to global trial expiration events
    const handleTrialExpiredEvent = () => {
      setShowPaywall(true);
    };
    window.addEventListener('trial-expired', handleTrialExpiredEvent);
    return () => {
      window.removeEventListener('trial-expired', handleTrialExpiredEvent);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Monitor trial status
  useEffect(() => {
    if (!user || user.role === 'admin' || user.is_paid) {
      setShowPaywall(false);
      return;
    }

    const checkTrial = () => {
      if (!user.created_at) return;
      const createdTime = new Date(user.created_at).getTime();
      const elapsed = Date.now() - createdTime;
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      const remaining = threeDaysMs - elapsed;

      if (remaining <= 0) {
        setTrialTimeRemaining('Expired');
        setShowPaywall(true);
      } else {
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) {
          setTrialTimeRemaining(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTrialTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTrialTimeRemaining(`${minutes}m`);
        }
        setShowPaywall(false);
      }
    };

    checkTrial();
    const interval = setInterval(checkTrial, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleUnlock = async () => {
    setPaying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await api.unlockAccount();
      
      const updatedUser = { ...user, is_paid: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setPaySuccess(true);
      setTimeout(() => {
        setPaySuccess(false);
        setShowPaywall(false);
      }, 1000);
    } catch (err) {
      alert(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const hydrateSession = async () => {
    let token = null;
    try {
      token = localStorage.getItem('token');
    } catch (e) {
      console.warn('LocalStorage access blocked:', e);
    }

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const profileData = await api.getProfile();
      setUser(profileData);
      
      // Handle navigation shortcuts from PWA manifest
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const shortcut = params.get('shortcut');
        if (shortcut === 'practice') setActiveTab('practice');
        else if (shortcut === 'mocks') setActiveTab('mocks');
      }
    } catch (err) {
      console.warn('Session hydration failed:', err);
      if (err.status === 401 || err.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      console.warn('LocalStorage clear blocked:', e);
    }
    setUser(null);
    setActiveTab('dashboard');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Switch sections and apply filters (e.g., from Dashboard challenge to Practice)
  const handleNavigateSection = (section, filters = null) => {
    setPracticeFilters(filters);
    setDirectQuestion(null);
    setActiveTab(section);
  };

  const handleStartQuestionPractice = (questionObj, questionList = null) => {
    if (questionList) {
      // In revision, we can pass arrays
      setDirectQuestion(null);
      setPracticeFilters({ list: questionList });
    } else {
      setDirectQuestion(questionObj);
      setPracticeFilters(null);
    }
    setActiveTab('practice');
  };

  const syncUserStats = async () => {
    // Quick silent sync of profile stats like XP and streaks
    if (!user) return;
    try {
      const profileData = await api.getProfile();
      setUser(profileData);
    } catch (e) {
      console.warn('Quiet sync error:', e);
    }
  };

  // Sync profile details whenever user switches sections
  useEffect(() => {
    if (user) {
      syncUserStats();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <img 
          src="/epion_logo.png" 
          alt="EPION Logo" 
          className="w-16 h-16 object-contain mb-4 animate-pulse"
        />
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-text text-xs font-semibold mt-3">EPION Prep Engine Hydrating...</p>
        
        {runtimeError && (
          <div className="mt-6 p-4 bg-danger-light border border-danger/20 rounded-xl text-danger text-xs font-bold max-w-sm mx-auto break-words shadow-sm">
            <p className="uppercase tracking-wider text-[9px] text-danger/80 mb-1.5 font-extrabold">Runtime Engine Error</p>
            <p className="mb-3 font-semibold leading-relaxed">{runtimeError}</p>
            <button 
              onClick={() => {
                try {
                  localStorage.clear();
                } catch (e) {}
                window.location.reload();
              }}
              className="w-full py-2 px-3 bg-danger hover:bg-danger-hover text-white rounded-lg transition-colors cursor-pointer text-[10px]"
            >
              Clear Local Cache & Force Reload
            </button>
          </div>
        )}
      </div>
    );
  }

  // 1. RENDER AUTHENTICATION SHELL IF NOT LOGGED IN
  if (!user) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  // Navigation configurations
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'practice', name: 'Practice Zone', icon: BookOpen },
    { id: 'mocks', name: 'Mock Exams', icon: Trophy },
    { id: 'revision', name: 'Revision Vault', icon: Bookmark },
    { id: 'leaderboard', name: 'Leaderboard', icon: Award },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  // Append Admin Panel & Reports Console if user is administrator
  if (user.role === 'admin') {
    menuItems.push({ id: 'admin', name: 'Admin Panel', icon: Shield });
    menuItems.push({ id: 'reports', name: 'Reports Console', icon: BarChart3 });
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      
      {/* 2. DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-card border-r border-border shrink-0">
        {/* Brand Logo Header */}
        <div className="p-4 border-b border-border flex items-center gap-2">
          <img 
            src="/epion_logo.png" 
            alt="EPION Logo" 
            className="w-16 h-16 object-contain -my-3 -ml-2 shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-black text-base text-foreground leading-tight tracking-tight">EPION</h1>
            <span className="text-[9px] text-primary font-black uppercase tracking-wider block mt-0.5">NURSING EXAM PORTAL</span>
          </div>
        </div>

        {/* User Info Row */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3.5 hover:bg-muted-bg/30 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-orange-400 text-white font-black flex items-center justify-center text-sm uppercase shrink-0 border border-primary/20 shadow-sm overflow-hidden">
            {user.profile_pic ? (
              user.profile_pic.startsWith('data:image') ? (
                <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{user.profile_pic}</span>
              )
            ) : (
              user.name ? user.name.charAt(0) : 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-foreground truncate leading-tight">
              <span>{user.name}</span>
            </div>
            <div className="text-[10px] text-muted-text truncate leading-relaxed mt-0.5">{user.email}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="px-1.5 py-0.5 text-[8px] bg-primary-light text-primary font-black rounded uppercase tracking-wider border border-primary/10">
                Lvl {Math.floor((user.xp_points || 0) / 100) + 1}
              </span>
              {user.role === 'admin' ? (
                <span className="px-1.5 py-0.5 text-[8px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black rounded uppercase tracking-wider border border-indigo-500/10">
                  Admin
                </span>
              ) : user.is_paid ? (
                <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black rounded uppercase tracking-wider border border-emerald-500/10">
                  Premium
                </span>
              ) : (
                <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase tracking-wider border ${
                  showPaywall 
                    ? 'bg-danger-light text-danger border-danger/10' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10'
                }`}>
                  {showPaywall ? 'Expired' : `Trial`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Nav list */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setPracticeFilters(null);
                  setDirectQuestion(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-md shadow-primary/20' 
                    : 'text-muted-text hover:text-foreground hover:bg-muted-bg/50'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Academic Partner Collaboration Section */}
        <div className="px-5 py-4 border-t border-border bg-muted-bg/5 mt-auto">
          <a 
            href="https://wahegurunursingclasses.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group block text-center space-y-2.5 p-3 rounded-xl border border-border/40 hover:border-primary/30 bg-card/50 transition-all duration-300 hover:shadow-sm"
          >
            <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-sm group-hover:bg-primary/20 transition-colors"></div>
              <img 
                src="/wnc_logo.png" 
                alt="WNC Logo" 
                className="relative w-11 h-11 rounded-full object-contain border border-border/80 bg-white p-0.5 shadow-sm transform group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] font-black text-primary uppercase tracking-widest block">Academic Partner</span>
              <div className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                Waheguru Nursing Classes (WNC)
              </div>
              <p className="text-[9px] leading-snug text-muted-text">
                NCLEX-RN & Competitive Exam Training
              </p>
            </div>
          </a>
        </div>

        {/* Bottom controls */}
        <div className="p-4 border-t border-border space-y-1 bg-muted-bg/5">
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-danger hover:bg-danger-light/50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 3. MOBILE HEADER */}
      <header className="md:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src="/epion_logo.png" 
            alt="EPION Logo" 
            className="w-14 h-14 object-contain -my-3 -ml-2 shrink-0"
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-xs text-foreground leading-none">EPION</span>
            <span className="text-[9px] text-muted-text font-bold uppercase tracking-wide">NURSING EXAM PORTAL</span>
          </div>
        </div>
        
        {/* Mobile Trial Timer Badge */}
        {!user.is_paid && user.role !== 'admin' && (
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
            showPaywall ? 'bg-danger-light text-danger' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
          }`}>
            {showPaywall ? 'Trial Expired' : trialTimeRemaining}
          </span>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-text hover:text-foreground transition-colors"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-danger hover:bg-danger-light rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 4. MAIN LAYOUT AND SECTION DISPATCHER */}
      <main className="flex-1 p-4 pb-20 md:p-8 md:pb-4 overflow-y-auto max-h-screen flex flex-col">
        {activeTab === 'dashboard' && (
          <DashboardView 
            user={user}
            onNavigateToSection={handleNavigateSection}
            onStartQuestionPractice={handleStartQuestionPractice}
          />
        )}
        
        {activeTab === 'practice' && (
          <PracticeView 
            initialFilters={practiceFilters}
            directLaunchQuestion={directQuestion}
            onNavigateHome={() => setActiveTab('dashboard')}
            user={user}
          />
        )}
        
        {activeTab === 'mocks' && (
          <MockTestView 
            onNavigateHome={() => setActiveTab('dashboard')}
            user={user}
          />
        )}
        
        {activeTab === 'revision' && (
          <RevisionView 
            onStartQuestionPractice={handleStartQuestionPractice}
            user={user}
          />
        )}
        
        {activeTab === 'leaderboard' && (
          <LeaderboardView 
            currentUser={user}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            currentUser={user}
            onProfileUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {activeTab === 'admin' && user.role === 'admin' && (
          <AdminView />
        )}

        {activeTab === 'reports' && user.role === 'admin' && (
          <ReportsView />
        )}

        {/* Global Footer */}
        <footer className="mt-auto pt-6 pb-0 md:pb-0 border-t border-border/60 text-center text-xs text-muted-text font-medium print:hidden">
          © 2026 EPION. All Rights Reserved. Academic Collaboration Partner: <a href="https://wahegurunursingclasses.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Waheguru Nursing Classes (WNC)</a>
        </footer>
      </main>

      {/* 5. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border py-1.5 px-3 flex justify-between items-center z-40 shadow-lg">
        {menuItems.slice(0, 6).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setPracticeFilters(null);
                setDirectQuestion(null);
              }}
              className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-all ${
                isActive ? 'text-primary' : 'text-muted-text hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-bold">{item.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

      {/* 6. DYNAMIC PREMIUM PAYWALL OVERLAY */}
      {showPaywall && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in animate-duration-200">
          <div 
            className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl relative overflow-hidden p-8 flex flex-col items-center text-center animate-scale-up"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Top brand accent border line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
            
            {/* Logo */}
            <img 
              src="/epion_logo.png" 
              alt="EPION Logo" 
              className="w-24 h-24 object-contain border-2 border-primary/20 rounded-2xl p-2 bg-white/50 backdrop-blur-sm mb-4 shadow-sm shadow-primary/5"
            />
            
            {/* Headers */}
            <h2 className="text-2xl font-black text-foreground tracking-tight">Free Trial Expired</h2>
            <p className="text-muted-text text-sm mt-2 max-w-sm">
              Your 3-day free trial of <strong>EPION</strong> has completed. Upgrade to premium to continue.
            </p>
            
            {/* Premium Features List Card */}
            <div className="w-full bg-muted-bg border border-border rounded-xl p-4 my-5 text-left space-y-2.5">
              <div className="text-xs font-bold text-muted-text uppercase tracking-widest border-b border-border pb-1">
                Premium Features Include:
              </div>
              <ul className="text-xs text-foreground font-semibold space-y-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>5,000+ High-Yield Nursing MCQs</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>Full Mock Exams (Negative Marking & Timer)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>Global Candidate Leaderboard & Rankings</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>AI Performance Diagnostics & Weak Areas</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>Interactive Revision Vault & Bookmarks</span>
                </li>
              </ul>
            </div>
            
            {/* Pricing Section */}
            <div className="mb-6">
              <div className="text-[10px] text-muted-text font-bold uppercase tracking-wider line-through">Regular Price ₹1,499</div>
              <div className="text-3xl font-black text-foreground">
                ₹499 <span className="text-sm font-semibold text-muted-text">/ lifetime access</span>
              </div>
            </div>
            
            {/* Action button */}
            <button
              onClick={handleUnlock}
              disabled={paying || paySuccess}
              className="w-full py-3 px-6 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {paying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Processing Payment...</span>
                </>
              ) : paySuccess ? (
                <span>Payment Successful! Unlocking...</span>
              ) : (
                <span>Pay & Unlock Premium</span>
              )}
            </button>
            
            <button
              onClick={handleLogout}
              className="mt-4 text-xs font-bold text-danger hover:underline cursor-pointer"
            >
              Sign Out & Switch Account
            </button>
            
            <p className="text-[9px] text-muted-text/80 mt-3 font-semibold">
              Secure simulated UPI/Card Payment. Immediate activation.
            </p>
          </div>
        </div>
      )}
      
    </div>
  );
}
