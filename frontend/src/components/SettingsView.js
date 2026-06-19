'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Settings, User, Lock, Paintbrush, Bell, Shield, 
  Check, AlertTriangle, Upload, Eye, EyeOff, RotateCcw, 
  Download, Moon, Sun, Laptop, Save
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'avatar-1', emoji: '🧑‍⚕️', label: 'Male Clinician' },
  { id: 'avatar-2', emoji: '👩‍⚕️', label: 'Female Clinician' },
  { id: 'avatar-3', emoji: '🩺', label: 'Stethoscope' },
  { id: 'avatar-4', emoji: '🧠', label: 'Brain' },
  { id: 'avatar-5', emoji: '💉', label: 'Syringe' },
  { id: 'avatar-6', emoji: '🏥', label: 'Hospital' }
];

export default function SettingsView({ currentUser, onProfileUpdate, theme, onToggleTheme }) {
  // Profile fields
  const [name, setName] = useState(currentUser?.name || '');
  const [profilePic, setProfilePic] = useState(currentUser?.profile_pic || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPass, setShowPass] = useState(false);

  // System Settings / Toggles
  const [notifStreak, setNotifStreak] = useState(true);
  const [notifMockTests, setNotifMockTests] = useState(true);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      setNotifStreak(localStorage.getItem('pref_notif_streak') !== 'false');
      setNotifMockTests(localStorage.getItem('pref_notif_mocks') !== 'false');
      setNotifWeeklyReport(localStorage.getItem('pref_notif_weekly') === 'true');
    } catch (e) {
      console.warn('Prefs reading blocked:', e);
    }
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');

    try {
      const res = await api.updateProfile(name, profilePic);
      setProfileMessage(res.message || 'Profile updated successfully.');
      onProfileUpdate(res.user);
    } catch (err) {
      console.error('Save Profile Error:', err);
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      setPasswordMessage(res.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password Change Error:', err);
      setPasswordError(err.message || 'Failed to change password. Make sure current password is correct.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 250 * 1024) {
      setProfileError('Custom avatar file size must be less than 250KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePic(reader.result); // Base64 encoding
    };
    reader.readAsDataURL(file);
  };

  const handleTogglePref = (key, val, setter) => {
    setter(val);
    try {
      localStorage.setItem(key, String(val));
    } catch (e) {}
  };

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear local cache and re-sync statistics? This will sign you out.')) {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        window.location.reload();
      }
    }
  };

  const handleExportData = async () => {
    try {
      const summary = await api.getAnalyticsSummary();
      const bookmarks = await api.getBookmarks();
      const revisions = await api.getRevisionList();
      
      const exportObject = {
        user: {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          xp: currentUser.xp_points,
          streak: currentUser.streak
        },
        analyticsSummary: summary,
        bookmarkedQuestionsCount: bookmarks.length,
        incorrectQuestionsCount: revisions.incorrect?.length || 0,
        exportedAt: new Date().toISOString()
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(exportObject, null, 2)
      )}`;
      const link = document.createElement('a');
      link.setAttribute('href', jsonString);
      link.setAttribute('download', `epion_prep_data_${currentUser.name.toLowerCase().replace(/ /g, '_')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Failed to gather stats for export. Verify API server is online.');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-4xl mx-auto">
      {/* Settings Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          <span>Account Settings</span>
        </h2>
        <p className="text-muted-text text-sm">Manage profile pictures, update password credentials, set visual themes, and adjust study alert preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col: Menu Navigation */}
        <div className="md:col-span-1 space-y-4">
          {/* Quick Info card */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
            
            {/* Avatar container */}
            <div className="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center rounded-full bg-primary-light border-2 border-primary/20 shadow-md overflow-hidden">
              {profilePic ? (
                profilePic.startsWith('data:image') ? (
                  <img src={profilePic} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">{profilePic}</span>
                )
              ) : (
                <span className="text-3xl font-extrabold text-primary uppercase">
                  {currentUser?.name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            
            <h3 className="font-extrabold text-foreground text-sm truncate">{currentUser.name}</h3>
            <span className="text-[10px] text-muted-text truncate block mb-3">{currentUser.email}</span>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-light text-primary text-[10px] font-black rounded-full border border-primary/10 uppercase tracking-wide">
              Level {Math.floor((currentUser.xp_points || 0) / 100) + 1} Candidate
            </div>
          </div>

          {/* Quick shortcuts */}
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-2.5">
            <h4 className="text-[10px] font-bold text-muted-text uppercase tracking-widest border-b border-border pb-1.5">Quick Actions</h4>
            <button
              onClick={handleExportData}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-muted-bg/30 hover:bg-primary-light hover:text-primary text-xs font-semibold text-foreground rounded-lg transition-colors text-left cursor-pointer"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Export Prep Profile</span>
            </button>
            <button
              onClick={handleClearCache}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-muted-bg/30 hover:bg-danger-light hover:text-danger text-xs font-semibold text-foreground rounded-lg transition-colors text-left cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Reset Local Cache</span>
            </button>
          </div>
        </div>

        {/* Right Col: Forms & Controls */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. PROFILE SECTION */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <User className="w-4.5 h-4.5 text-primary" />
              <span>Personal Profile Settings</span>
            </h3>

            {profileMessage && (
              <div className="bg-success-light border border-success/20 text-success text-xs rounded-xl p-3 animate-slide-up">
                {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="bg-danger-light border border-danger/20 text-danger text-xs rounded-xl p-3 animate-slide-up">
                {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Candidate Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted-bg border border-border py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl"
                />
              </div>

              {/* Email Address (Disabled) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Registered Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-muted-bg/60 border border-border/60 py-2.5 px-3 text-sm text-muted-text rounded-xl cursor-not-allowed opacity-75"
                />
                <span className="text-[9px] text-muted-text block pl-1">Authorized login identity. Contact support to change registration emails.</span>
              </div>

              {/* Profile Avatar Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Profile Picture / Avatar</label>
                
                {/* Custom File Uploader */}
                <div className="flex items-center gap-4 bg-muted-bg/20 border border-border/60 p-3.5 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {profilePic ? (
                      profilePic.startsWith('data:image') ? (
                        <img src={profilePic} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{profilePic}</span>
                      )
                    ) : (
                      <span className="text-lg font-black text-muted-text/40">U</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-foreground">Upload Custom Picture</div>
                    <label className="px-3 py-1.5 bg-primary-light hover:bg-primary/20 text-primary text-[10px] font-bold rounded-lg cursor-pointer border border-primary/10 transition-colors flex items-center gap-1 w-fit">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Image (Max 250KB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Preset Avatars Grid */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Or Select Preset Icon:</div>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_AVATARS.map((av) => {
                      const isSelected = profilePic === av.emoji;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setProfilePic(av.emoji)}
                          className={`p-2.5 rounded-xl border text-xl flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-primary-light border-primary shadow-sm scale-105' 
                              : 'bg-card border-border hover:border-primary/25 hover:bg-muted-bg/25'
                          }`}
                          title={av.label}
                        >
                          {av.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Profile */}
              <button
                type="submit"
                disabled={profileLoading}
                className="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{profileLoading ? 'Saving Settings...' : 'Save Profile Settings'}</span>
              </button>
            </form>
          </div>

          {/* 2. APPEARANCE (THEME SWITCHER) SECTION */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Paintbrush className="w-4.5 h-4.5 text-primary" />
              <span>Appearance & Color Theme</span>
            </h3>
            <p className="text-xs text-muted-text">Customize the visual presentation of the study portal. Swapping theme modes changes active color contrasts immediately.</p>

            <div className="grid grid-cols-2 gap-4 pt-1">
              {/* Light Mode Selector Card */}
              <button
                onClick={() => { if (theme !== 'light') onToggleTheme(); }}
                className={`p-4 rounded-xl border text-left space-y-3 transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'bg-primary-light/40 border-primary ring-2 ring-primary/10 shadow-sm' 
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner">
                    <Sun className="w-4.5 h-4.5" />
                  </div>
                  {theme === 'light' && <Check className="w-4.5 h-4.5 text-primary" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Light Mode</div>
                  <p className="text-[10px] text-muted-text mt-0.5 leading-snug">Clean slate backing, optimal for daytime reading.</p>
                </div>
              </button>

              {/* Dark Mode Selector Card */}
              <button
                onClick={() => { if (theme !== 'dark') onToggleTheme(); }}
                className={`p-4 rounded-xl border text-left space-y-3 transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'bg-primary-light/40 border-primary ring-2 ring-primary/10 shadow-sm' 
                    : 'bg-card border-border hover:border-primary/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner">
                    <Moon className="w-4.5 h-4.5" />
                  </div>
                  {theme === 'dark' && <Check className="w-4.5 h-4.5 text-primary" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Dark Mode</div>
                  <p className="text-[10px] text-muted-text mt-0.5 leading-snug">High contrast deep navy, gentle on eyes in low light.</p>
                </div>
              </button>
            </div>
          </div>

          {/* 3. SECURITY (PASSWORD) SECTION */}
          {/* Hide password section for users logged in via Google */}
          {!currentUser?.google_id && (
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
                <Lock className="w-4.5 h-4.5 text-primary" />
                <span>Security & Credentials</span>
              </h3>

              {passwordMessage && (
                <div className="bg-success-light border border-success/20 text-success text-xs rounded-xl p-3 animate-slide-up">
                  {passwordMessage}
                </div>
              )}
              {passwordError && (
                <div className="bg-danger-light border border-danger/20 text-danger text-xs rounded-xl p-3 animate-slide-up">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-muted-bg border border-border py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-3.5 text-muted-text hover:text-foreground focus:outline-none"
                    >
                      {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password & Confirm Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">New Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-muted-bg border border-border py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-text uppercase tracking-wider block">Confirm New Password</label>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-muted-bg border border-border py-2.5 px-3 text-sm text-foreground focus:outline-none focus:border-primary rounded-xl"
                    />
                  </div>
                </div>

                {/* Submit Password */}
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full md:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{passwordLoading ? 'Updating Password...' : 'Change Password'}</span>
                </button>
              </form>
            </div>
          )}

          {/* 4. PREFERENCES (NOTIFICATION & ALERTS) SECTION */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2 border-b border-border/80 pb-2">
              <Bell className="w-4.5 h-4.5 text-primary" />
              <span>Study Reminders & Notifications</span>
            </h3>

            <div className="space-y-3">
              {/* Toggle 1: Streak */}
              <div className="flex items-center justify-between p-3 bg-muted-bg/10 border border-border/50 rounded-xl">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-bold text-foreground">Daily Study Streak Alerts</div>
                  <p className="text-[10px] text-muted-text leading-snug">Notify me if I haven't completed my daily nursing MCQs to preserve streaks.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifStreak}
                    onChange={(e) => handleTogglePref('pref_notif_streak', e.target.checked, setNotifStreak)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-border rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/10 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Toggle 2: Mocks */}
              <div className="flex items-center justify-between p-3 bg-muted-bg/10 border border-border/50 rounded-xl">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-bold text-foreground">New Mock Test Bulletins</div>
                  <p className="text-[10px] text-muted-text leading-snug">Notify me when EPION administrators release simulated high-yield nursing exams.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifMockTests}
                    onChange={(e) => handleTogglePref('pref_notif_mocks', e.target.checked, setNotifMockTests)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-border rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/10 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Toggle 3: Weekly Report */}
              <div className="flex items-center justify-between p-3 bg-muted-bg/10 border border-border/50 rounded-xl">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-bold text-foreground">Weekly Performance Digest</div>
                  <p className="text-[10px] text-muted-text leading-snug">Receive weekly analytical summary logs highlighting weak topics and XP trends.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifWeeklyReport}
                    onChange={(e) => handleTogglePref('pref_notif_weekly', e.target.checked, setNotifWeeklyReport)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-border rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/10 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
