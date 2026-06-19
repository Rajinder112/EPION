'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Shield, Mail, Lock, User, AlertCircle, Sparkles, Phone, Globe, MapPin, HelpCircle } from 'lucide-react';

const countryOptions = [
  { code: '+91', country: 'India', label: '+91 (IN)' },
  { code: '+1', country: 'United States', label: '+1 (US)' },
  { code: '+44', country: 'United Kingdom', label: '+44 (UK)' },
  { code: '+61', country: 'Australia', label: '+61 (AU)' },
  { code: '+966', country: 'Saudi Arabia', label: '+966 (SA)' },
  { code: '+971', country: 'United Arab Emirates', label: '+971 (AE)' },
  { code: '+1', country: 'Canada', label: '+1 (CA)' },
  { code: '+65', country: 'Singapore', label: '+65 (SG)' },
  { code: '+64', country: 'New Zealand', label: '+64 (NZ)' },
  { code: '+353', country: 'Ireland', label: '+353 (IE)' },
  { code: '+49', country: 'Germany', label: '+49 (DE)' },
  { code: '+33', country: 'France', label: '+33 (FR)' },
  { code: '+81', country: 'Japan', label: '+81 (JP)' },
  { code: '+27', country: 'South Africa', label: '+27 (ZA)' },
  { code: '+92', country: 'Pakistan', label: '+92 (PK)' },
  { code: '+977', country: 'Nepal', label: '+977 (NP)' },
  { code: '+880', country: 'Bangladesh', label: '+880 (BD)' },
  { code: '+94', country: 'Sri Lanka', label: '+94 (LK)' },
  { code: '+965', country: 'Kuwait', label: '+965 (KW)' },
  { code: '+968', country: 'Oman', label: '+968 (OM)' },
  { code: '+974', country: 'Qatar', label: '+974 (QA)' },
  { code: '+973', country: 'Bahrain', label: '+973 (BH)' },
  { code: '+60', country: 'Malaysia', label: '+60 (MY)' },
  { code: '+63', country: 'Philippines', label: '+63 (PH)' },
  { code: '+39', country: 'Italy', label: '+39 (IT)' },
  { code: '+34', country: 'Spain', label: '+34 (ES)' }
];

export default function AuthView({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What was the name of your first pet?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [rePassword, setRePassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [devVerificationLink, setDevVerificationLink] = useState('');

  const getSelectedOptionIndex = () => {
    const idx = countryOptions.findIndex(o => o.code === countryCode && o.country === country);
    if (idx !== -1) return idx;
    const codeIdx = countryOptions.findIndex(o => o.code === countryCode);
    return codeIdx !== -1 ? codeIdx : 0;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verified') === 'true') {
        setRegistrationMessage('Your email address has been verified successfully! Please log in to your account.');
        // Clean URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLogin && password !== rePassword) {
      setError('Passwords do not match. Please verify both password entries.');
      setLoading(false);
      return;
    }

    try {
      let data;
      if (isLogin) {
        data = await api.login(email, password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } else {
        const fullPhone = `${countryCode} ${phone}`;
        const res = await api.register(
          name, 
          email, 
          password, 
          fullPhone, 
          country, 
          address, 
          securityQuestion, 
          securityAnswer
        );
        setRegistrationMessage(res.message);
        if (res.verificationLink) {
          setDevVerificationLink(res.verificationLink);
        }
        setIsLogin(true);
        // Clear password fields
        setPassword('');
        setRePassword('');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMockGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Create a simulated google user
      const mockNames = ['Rahul Sharma', 'Ananya Patel', 'Sandeep Singh', 'Priya Verma', 'Amit Kumar'];
      const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
      const randomId = Math.floor(Math.random() * 1000000000).toString();
      const mockEmail = `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`;

      const data = await api.googleMock(randomName, mockEmail, randomId);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Google Sign-In simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-6 animate-fade-in" style={{ padding: '1.5rem' }}>
      {/* Premium Outer Card */}
      <div 
        className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl relative overflow-hidden transition-all duration-300"
        style={{ padding: '2.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      >
        {/* Top brand accent border line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
        
        {/* Decorative backdrop glow blobs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center" style={{ marginBottom: '2rem' }}>
          <img 
            src="/epion_logo.png" 
            alt="EPION Logo" 
            className="w-20 h-20 object-contain border-2 border-primary/20 rounded-2xl p-2 bg-white/50 backdrop-blur-sm shadow-md shadow-primary/5 transform transition-transform hover:scale-105"
            style={{ marginBottom: '1rem' }} 
          />
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">EPION</h1>
          <p className="text-muted-text text-xs font-semibold uppercase tracking-widest" style={{ marginTop: '0.375rem' }}>
            ADVANCED NURSING EXAM PREPARATION
          </p>
        </div>

        {/* Auth Toggle Tabs (Card-styled switcher) */}
        <div className="flex bg-muted-bg p-1.5 rounded-xl border border-border" style={{ marginBottom: '1.75rem', padding: '0.375rem' }}>
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              isLogin 
                ? 'bg-card text-primary shadow-md border border-border' 
                : 'text-muted-text hover:text-foreground'
            }`}
            style={{ padding: '0.5rem 0' }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              !isLogin 
                ? 'bg-card text-primary shadow-md border border-border' 
                : 'text-muted-text hover:text-foreground'
            }`}
            style={{ padding: '0.5rem 0' }}
          >
            Register
          </button>
        </div>

        {/* Registration Success Notification Banner */}
        {registrationMessage && (
          <div 
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl p-4 animate-slide-up"
            style={{ marginBottom: '1.5rem' }}
          >
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 shrink-0 text-emerald-500" />
              <div>
                <span className="font-bold block text-sm">Success</span>
                <p className="text-[11px] font-semibold leading-relaxed mt-1 text-emerald-600/90 dark:text-emerald-400/90">{registrationMessage}</p>
              </div>
            </div>
            {devVerificationLink && (
              <div className="mt-3 pt-3 border-t border-emerald-500/15 bg-emerald-500/5 p-2 rounded-lg text-left">
                <span className="text-[9px] uppercase font-black tracking-wider text-emerald-500 block">Developer Verification Link</span>
                <p className="text-[9px] text-muted-text mt-0.5 break-all font-semibold">Click to verify account directly in browser testing:</p>
                <a 
                  href={devVerificationLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block mt-1.5 text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1 rounded-md transition-colors"
                >
                  Verify Email Now
                </a>
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div 
            className="bg-danger-light border border-danger/20 text-danger text-sm rounded-xl p-3.5 flex items-start gap-2.5 animate-slide-up"
            style={{ marginBottom: '1.5rem', padding: '0.875rem' }}
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Card-based input elements */}
          {!isLogin && (
            <div className="flex flex-col gap-1" style={{ marginBottom: '1.25rem' }}>
              <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                Full Name
              </label>
              <div className="relative">
                <span 
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none"
                  style={{ paddingLeft: '0.75rem' }}
                >
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                  style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1" style={{ marginBottom: '1.25rem' }}>
            <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
              Email Address
            </label>
            <div className="relative">
              <span 
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none"
                style={{ paddingLeft: '0.75rem' }}
              >
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
              />
            </div>
          </div>

          {!isLogin && (
            <>
              {/* Phone code and number */}
              <div className="flex gap-2.5 animate-slide-up" style={{ marginBottom: '1.25rem' }}>
                <div className="flex flex-col gap-1 w-28">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                    Code
                  </label>
                  <select
                    value={getSelectedOptionIndex()}
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (idx >= 0 && idx < countryOptions.length) {
                        setCountryCode(countryOptions[idx].code);
                        setCountry(countryOptions[idx].country);
                      }
                    }}
                    className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                    style={{ paddingTop: '0.65rem', paddingBottom: '0.65rem', paddingLeft: '0.5rem', paddingRight: '0.5rem' }}
                  >
                    {countryOptions.map((opt, idx) => (
                      <option key={idx} value={idx}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none" style={{ paddingLeft: '0.75rem' }}>
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                      style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Country */}
              <div className="flex flex-col gap-1 animate-slide-up" style={{ marginBottom: '1.25rem' }}>
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                  Country
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none" style={{ paddingLeft: '0.75rem' }}>
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                    style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1 animate-slide-up" style={{ marginBottom: '1.25rem' }}>
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                  Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none" style={{ paddingLeft: '0.75rem' }}>
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Street, City, Zipcode"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                    style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                  />
                </div>
              </div>

              {/* Security Question */}
              <div className="flex flex-col gap-1 animate-slide-up" style={{ marginBottom: '1.25rem' }}>
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                  Security Question
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none" style={{ paddingLeft: '0.75rem' }}>
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <select
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                    style={{ paddingLeft: '2.5rem', paddingRight: '0.5rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                  >
                    <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                    <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                    <option value="What is the name of your first school?">What is the name of your first school?</option>
                    <option value="What city were you born in?">What city were you born in?</option>
                    <option value="What is the name of your favorite childhood teacher?">What is the name of your favorite childhood teacher?</option>
                    <option value="What was your childhood nickname?">What was your childhood nickname?</option>
                    <option value="What is the name of the street you grew up on?">What is the name of the street you grew up on?</option>
                    <option value="What was the make and model of your first car?">What was the make and model of your first car?</option>
                    <option value="What was your dream job as a child?">What was your dream job as a child?</option>
                    <option value="What is your favorite book?">What is your favorite book?</option>
                  </select>
                </div>
              </div>

              {/* Security Answer */}
              <div className="flex flex-col gap-1 animate-slide-up" style={{ marginBottom: '1.25rem' }}>
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                  Security Answer
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none" style={{ paddingLeft: '0.75rem' }}>
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Your security answer"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                    style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1" style={{ marginBottom: '1.25rem' }}>
            <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
              Password
            </label>
            <div className="relative">
              <span 
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none"
                style={{ paddingLeft: '0.75rem' }}
              >
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1 animate-slide-up" style={{ marginBottom: '1.75rem' }}>
              <label className="text-xs font-bold text-muted-text uppercase tracking-wider block" style={{ paddingLeft: '0.25rem' }}>
                Confirm Password
              </label>
              <div className="relative">
                <span 
                  className="absolute inset-y-0 left-0 pl-3 flex items-center text-muted-text pointer-events-none"
                  style={{ paddingLeft: '0.75rem' }}
                >
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  className="w-full bg-muted-bg border border-border focus:border-primary focus:outline-none rounded-xl text-foreground text-sm transition-all focus:ring-2 focus:ring-primary/10"
                  style={{ paddingLeft: '2.5rem', paddingRight: '0.75rem', paddingTop: '0.65rem', paddingBottom: '0.65rem' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center justify-center gap-2 cursor-pointer"
            style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <span>{isLogin ? 'Sign In to Portal' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative text-center" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <span className="relative px-3 bg-card text-[10px] text-muted-text uppercase font-bold tracking-widest">Or Continue With</span>
        </div>

        {/* Mock Google Login Card */}
        <button
          onClick={handleMockGoogleLogin}
          disabled={loading}
          className="w-full bg-muted-bg hover:bg-border/30 border border-border text-foreground font-bold rounded-xl transition-all hover:scale-[1.01] text-sm flex items-center justify-center gap-2 cursor-pointer"
          style={{ paddingTop: '0.7rem', paddingBottom: '0.7rem' }}
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="24" height="24">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.77 21.56,11.41 21.35,11.1z" fill="#4285F4" />
              <path d="M12,20.62c2.61,0 4.8,-0.87 6.4,-2.34l-3.3,-2.58c-0.92,0.6 -2.1,0.98 -3.1,0.98 -2.4,0 -4.43,-1.62 -5.16,-3.82H3.4v2.66C5.02,18.73 8.27,20.62 12,20.62z" fill="#34A853" />
              <path d="M6.84,12.86c-0.18,-0.54 -0.29,-1.11 -0.29,-1.7s0.11,-1.16 0.29,-1.7V6.8H3.4C2.77,8.06 2.4,9.48 2.4,11s0.37,2.94 1,4.2L6.84,12.86z" fill="#FBBC05" />
              <path d="M12,4.32c1.42,0 2.7,0.49 3.7,1.44l2.78,-2.78C16.8,1.46 14.61,0.58 12,0.58c-3.73,0 -6.98,1.89 -8.6,5.12l3.44,2.66c0.73,-2.2 2.76,-3.82 5.16,-3.82z" fill="#EA4335" />
            </g>
          </svg>
          <span>Google Sign-In</span>
        </button>
      </div>
    </div>
  );
}
