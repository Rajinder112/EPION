'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Trophy, Award, Flame, Star, Sparkles, ShieldCheck, HeartPulse } from 'lucide-react';

export default function LeaderboardView({ currentUser }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const dbLeaderboard = await api.getLeaderboard();
      
      // Inject mock competitors to create a lively competitive ladder for the user
      const mockCompetitors = [
        { id: 'm1', name: 'Dr. Shruti Sen (EPION Candidate)', xp_points: 3450, streak: 18 },
        { id: 'm2', name: 'Rohan Deshmukh (B.Sc Nursing)', xp_points: 2820, streak: 12 },
        { id: 'm3', name: 'Meera Nair (Nursing Officer)', xp_points: 2150, streak: 8 },
        { id: 'm4', name: 'Sneha Reddy (AIIMS NORCET Prep)', xp_points: 1640, streak: 15 },
        { id: 'm5', name: 'Aditya Verma (GNM Student)', xp_points: 1120, streak: 6 },
        { id: 'm6', name: 'Dr. Vivek Joshi', xp_points: 980, streak: 4 }
      ];

      // Merge user list with mock data (avoid duplicates if user is somehow matching)
      const mergedList = [...dbLeaderboard];
      
      mockCompetitors.forEach(comp => {
        if (!mergedList.some(item => item.name === comp.name || item.email === comp.email)) {
          mergedList.push(comp);
        }
      });

      // Sort by XP DESC
      mergedList.sort((a, b) => b.xp_points - a.xp_points);
      
      setLeaderboard(mergedList);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine badge level based on XP
  const getBadgeDetails = (xp) => {
    if (xp >= 2500) {
      return { name: 'Nursing Legend', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950 border-purple-500/20', desc: 'Top 1% candidate tier. Master of all 16 subjects.' };
    }
    if (xp >= 1000) {
      return { name: 'Senior Officer', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950 border-amber-500/20', desc: 'Outstanding clinical reasoning and consistent streaks.' };
    }
    if (xp >= 500) {
      return { name: 'Care Specialist', color: 'text-secondary bg-secondary-light border-secondary/15', desc: 'Demonstrates deep competency in fundamentals and surgical skills.' };
    }
    if (xp >= 200) {
      return { name: 'Clinical Cadet', color: 'text-primary bg-primary-light border-primary/15', desc: 'Acquiring active medical terminology and pharmacology familiarity.' };
    }
    return { name: 'Nursing Novice', color: 'text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-500/20', desc: 'Beginning their competitive exam prep journey.' };
  };

  const currentBadge = getBadgeDetails(currentUser?.xp_points || 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-text text-sm font-medium">Updating ranking tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-foreground">Global Leaderboard</h2>
        <p className="text-muted-text text-sm">Compete with nursing candidates across India and climb the ladder by earning XP and maintaining streaks.</p>
      </div>

      {/* User Rank Summary Card */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
        
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Your Gamification Status</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${currentBadge.color}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {currentBadge.name}
            </span>
            <span className="text-xs font-bold text-accent bg-accent-light px-3 py-1 rounded-full border border-accent/15 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {currentUser?.streak || 0} Day Streak
            </span>
          </div>
          <p className="text-xs text-muted-text">{currentBadge.desc}</p>
        </div>

        <div className="bg-muted-bg/50 border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-semibold text-muted-text uppercase">Active Balance</div>
          <div className="text-2xl font-black text-foreground mt-1">{currentUser?.xp_points || 0} XP</div>
          <div className="w-full bg-border/40 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-primary h-full"
              style={{ width: `${((currentUser?.xp_points || 0) % 100)}%` }}
            ></div>
          </div>
          <div className="text-[9px] text-muted-text mt-1">
            {100 - ((currentUser?.xp_points || 0) % 100)} XP to next level
          </div>
        </div>
      </div>

      {/* Leaderboard Ladder */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border/80 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="font-bold text-foreground text-sm">Candidates Rank Board</h3>
        </div>

        <div className="divide-y divide-border/70">
          {leaderboard.map((user, idx) => {
            const isCurrentUser = user.name === currentUser?.name || user.id === currentUser?.id;
            const rank = idx + 1;
            
            let rankBadge = null;
            if (rank === 1) rankBadge = <Trophy className="w-4 h-4 text-accent" />;
            else if (rank === 2) rankBadge = <Award className="w-4 h-4 text-slate-400" />;
            else if (rank === 3) rankBadge = <Award className="w-4 h-4 text-amber-600" />;

            return (
              <div
                key={user.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  isCurrentUser 
                    ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary font-semibold' 
                    : 'bg-card'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-6 text-center font-mono text-xs font-black text-muted-text shrink-0">
                    {rankBadge || `#${rank}`}
                  </span>
                  
                  {/* Candidate Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-extrabold flex items-center justify-center text-xs border border-primary/10 overflow-hidden shrink-0 shadow-inner">
                    {user.profile_pic ? (
                      user.profile_pic.startsWith('data:image') ? (
                        <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base">{user.profile_pic}</span>
                      )
                    ) : (
                      user.id && user.id.startsWith('m') ? (
                        ['🧑‍⚕️', '👩‍⚕️', '🩺', '🧠', '💉', '🏥'][idx % 6]
                      ) : (
                        user.name ? user.name.charAt(0) : 'U'
                      )
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm text-foreground flex items-center gap-1.5 leading-tight">
                      <span>{user.name}</span>
                      {isCurrentUser && (
                        <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90">
                          You
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-muted-text bg-muted-bg border border-border/60 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                      {getBadgeDetails(user.xp_points).name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <div className="space-y-0.5">
                    <div className="text-sm font-extrabold text-foreground">{user.xp_points} XP</div>
                    <div className="text-[10px] text-muted-text">Level {Math.floor(user.xp_points / 100) + 1}</div>
                  </div>
                  {user.streak > 0 && (
                    <div className="flex items-center gap-0.5 text-accent bg-accent-light px-2 py-1 rounded-lg border border-accent/10">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span className="font-mono text-xs font-bold">{user.streak}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
