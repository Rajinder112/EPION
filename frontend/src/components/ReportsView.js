'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, Award, Calendar, CheckCircle2, Search, MapPin, 
  Download, RefreshCw, Phone, Mail, HelpCircle, Shield, X
} from 'lucide-react';

export default function ReportsView() {
  const [candidates, setCandidates] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [searchState, setSearchState] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterPaid, setFilterPaid] = useState('all'); // 'all', 'paid', 'unpaid'

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [candidatesData, batchesData] = await Promise.all([
        api.getCandidates(),
        api.getBatches()
      ]);
      setCandidates(candidatesData);
      setBatches(batchesData);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchName('');
    setSearchPhone('');
    setSearchCountry('');
    setSearchState('');
    setFilterBatch('all');
    setFilterYear('all');
    setFilterPaid('all');
  };

  // Get unique years of enrolment
  const uniqueYears = Array.from(
    new Set(
      candidates
        .map(c => {
          if (!c.created_at) return null;
          try {
            return new Date(c.created_at).getFullYear();
          } catch(e) {
            return null;
          }
        })
        .filter(Boolean)
    )
  ).sort((a, b) => b - a);

  // Filtering Logic
  const filteredCandidates = candidates.filter(candidate => {
    // 1. Search by Name / Email
    if (searchName) {
      const term = searchName.toLowerCase();
      const matchName = (candidate.name || '').toLowerCase().includes(term);
      const matchEmail = (candidate.email || '').toLowerCase().includes(term);
      if (!matchName && !matchEmail) return false;
    }

    // 2. Search by Phone
    if (searchPhone) {
      const phoneTerm = searchPhone.replace(/\s+/g, '');
      const candidatePhone = (candidate.phone || '').replace(/\s+/g, '');
      if (!candidatePhone.includes(phoneTerm)) return false;
    }

    // 3. Search by Country
    if (searchCountry) {
      const countryTerm = searchCountry.toLowerCase();
      const candidateCountry = (candidate.country || '').toLowerCase();
      if (!candidateCountry.includes(countryTerm)) return false;
    }

    // 4. Search by State / Address
    if (searchState) {
      const stateTerm = searchState.toLowerCase();
      const candidateAddress = (candidate.address || '').toLowerCase();
      if (!candidateAddress.includes(stateTerm)) return false;
    }

    // 5. Filter by Batch
    if (filterBatch !== 'all') {
      if (String(candidate.batch_id) !== String(filterBatch)) return false;
    }

    // 6. Filter by Enrolment Year
    if (filterYear !== 'all') {
      if (!candidate.created_at) return false;
      const year = new Date(candidate.created_at).getFullYear();
      if (String(year) !== String(filterYear)) return false;
    }

    // 7. Filter by Payment Status
    if (filterPaid !== 'all') {
      const isPaid = candidate.is_paid === true || candidate.is_paid === 'true' || candidate.is_paid === 1;
      if (filterPaid === 'paid' && !isPaid) return false;
      if (filterPaid === 'unpaid' && isPaid) return false;
    }

    return true;
  });

  // Sort by XP Points to find the top candidates (highest XP first)
  const rankedCandidates = [...filteredCandidates].sort((a, b) => {
    const xpA = parseInt(a.xp_points || 0);
    const xpB = parseInt(b.xp_points || 0);
    return xpB - xpA;
  });

  // Calculate Metrics
  const totalCount = candidates.length;
  const paidCount = candidates.filter(c => c.is_paid === true || c.is_paid === 'true' || c.is_paid === 1).length;
  const verifiedCount = candidates.filter(c => c.is_email_verified === true || c.is_email_verified === 'true' || c.is_email_verified === 1).length;
  const topXpCandidate = candidates.length > 0 ? Math.max(...candidates.map(c => parseInt(c.xp_points || 0))) : 0;

  // CSV Report Generator
  const handleExportCSV = () => {
    const headers = [
      'Rank', 'Name', 'Email', 'Phone', 'Country', 'State / Address', 
      'Enrolled At', 'Enrolment Year', 'XP Points', 'Paid Member', 
      'Email Verified', 'Batch Name', 'Security Question', 'Security Answer'
    ];

    const csvRows = [headers.join(',')];

    rankedCandidates.forEach((c, index) => {
      const batch = batches.find(b => b.id === c.batch_id);
      const batchName = batch ? batch.name : 'None';
      const year = c.created_at ? new Date(c.created_at).getFullYear() : 'N/A';
      const isPaid = (c.is_paid === true || c.is_paid === 'true' || c.is_paid === 1) ? 'YES' : 'NO';
      const isVerified = (c.is_email_verified === true || c.is_email_verified === 'true' || c.is_email_verified === 1) ? 'YES' : 'NO';
      
      const escapeCsv = (val) => {
        if (val === null || val === undefined) return '';
        let str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const row = [
        index + 1,
        escapeCsv(c.name),
        escapeCsv(c.email),
        escapeCsv(c.phone),
        escapeCsv(c.country),
        escapeCsv(c.address),
        escapeCsv(c.created_at ? new Date(c.created_at).toLocaleDateString() : ''),
        year,
        c.xp_points || 0,
        isPaid,
        isVerified,
        escapeCsv(batchName),
        escapeCsv(c.security_question),
        escapeCsv(c.security_answer)
      ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `epion_candidates_report_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in print:p-0 print:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Reports & Audits Console</span>
          </h2>
          <p className="text-muted-text text-sm">
            Generate detailed student registry sheets, audit registrations, check security fields, and filter candidates by region, batch, or study progress.
          </p>
        </div>
        <div className="flex gap-2.5 shrink-0">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-card hover:bg-muted-bg border border-border text-foreground hover:text-primary rounded-xl transition-all shadow-sm flex items-center justify-center"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading || rankedCandidates.length === 0}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report Audit (.csv)</span>
          </button>
        </div>
      </div>

      {/* 1. METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Total Candidates</span>
            <span className="text-lg md:text-xl font-black text-foreground">{loading ? '...' : totalCount}</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Paid Members</span>
            <span className="text-lg md:text-xl font-black text-foreground">{loading ? '...' : paidCount}</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-secondary-light flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Verified Emails</span>
            <span className="text-lg md:text-xl font-black text-foreground">{loading ? '...' : verifiedCount}</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">Highest XP Score</span>
            <span className="text-lg md:text-xl font-black text-foreground">{loading ? '...' : `${topXpCandidate} XP`}</span>
          </div>
        </div>
      </div>

      {/* 2. ADVANCED FILTERS MODULE */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            <span>Search & Audit Filter Console</span>
          </h3>
          {(searchName || searchPhone || searchCountry || searchState || filterBatch !== 'all' || filterYear !== 'all' || filterPaid !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-black text-primary hover:text-primary-hover uppercase tracking-wider flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-semibold">
          {/* Name / Email Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Candidate Name / Email</label>
            <div className="relative">
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g. Rajinder Singh"
                className="w-full pl-8 pr-3 py-2 bg-muted-bg border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-xs"
              />
              <Search className="w-3.5 h-3.5 text-muted-text absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Phone Number Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <input
                type="text"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                placeholder="e.g. +9198765"
                className="w-full pl-8 pr-3 py-2 bg-muted-bg border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-xs"
              />
              <Phone className="w-3.5 h-3.5 text-muted-text absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Country Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Country Name</label>
            <div className="relative">
              <input
                type="text"
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full pl-8 pr-3 py-2 bg-muted-bg border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-xs"
              />
              <HelpCircle className="w-3.5 h-3.5 text-muted-text absolute left-2.5 top-3" />
            </div>
          </div>

          {/* State / Address Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider">State / Living Address</label>
            <div className="relative">
              <input
                type="text"
                value={searchState}
                onChange={(e) => setSearchState(e.target.value)}
                placeholder="e.g. Punjab"
                className="w-full pl-8 pr-3 py-2 bg-muted-bg border border-border rounded-xl text-foreground focus:outline-none focus:border-primary text-xs"
              />
              <MapPin className="w-3.5 h-3.5 text-muted-text absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Filter by Batch */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Student Batch</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-foreground focus:outline-none text-xs"
            >
              <option value="all">All Batches</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Filter by Enrolment Year */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Year of Enrolment</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-foreground focus:outline-none text-xs"
            >
              <option value="all">All Years</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Filter by Paid/Unpaid Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Payment Status</label>
            <select
              value={filterPaid}
              onChange={(e) => setFilterPaid(e.target.value)}
              className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-foreground focus:outline-none text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid Members Only</option>
              <option value="unpaid">Free/Trial Users Only</option>
            </select>
          </div>

          {/* Total Filtered Stats */}
          <div className="flex items-end pb-1 pr-1 justify-end md:justify-start lg:justify-end text-[10px] font-extrabold text-primary uppercase tracking-widest leading-none">
            {rankedCandidates.length} Candidates Matched
          </div>
        </div>
      </div>

      {/* 3. REPORT LIST TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted-bg/15 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">Active Candidate Registry Report</span>
          <span className="text-[10px] text-muted-text">Sorted by study progress (XP Points) for Batch Ranking</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-muted-bg/30 text-muted-text font-bold text-[10px] uppercase tracking-wider border-b border-border/60">
                <th className="py-3 px-4 text-center w-12">Rank</th>
                <th className="py-3 px-4">Candidate info</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">State & Address</th>
                <th className="py-3 px-4">Security Audit</th>
                <th className="py-3 px-4 text-center">XP Points</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-foreground font-medium">
              {rankedCandidates.map((c, index) => {
                const batch = batches.find(b => b.id === c.batch_id);
                const isPaid = c.is_paid === true || c.is_paid === 'true' || c.is_paid === 1;
                const isVerified = c.is_email_verified === true || c.is_email_verified === 'true' || c.is_email_verified === 1;
                
                return (
                  <tr key={c.id} className="hover:bg-muted-bg/10 transition-colors">
                    {/* Rank */}
                    <td className="py-3 px-4 text-center font-bold text-muted-text text-sm">
                      {index + 1}
                    </td>

                    {/* Candidate Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-light font-black text-primary flex items-center justify-center uppercase shrink-0 border border-primary/10">
                          {c.name ? c.name[0] : 'U'}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold block text-foreground truncate">{c.name}</span>
                          <span className="text-[10px] text-muted-text block truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-text shrink-0" /> {c.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-3 px-4 space-y-1">
                      <span className="text-[11px] block font-bold text-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3 text-muted-text shrink-0" /> {c.phone || 'N/A'}
                      </span>
                      <span className="text-[10px] text-muted-text block font-semibold">
                        Country: {c.country || 'N/A'}
                      </span>
                    </td>

                    {/* State & Address */}
                    <td className="py-3 px-4 max-w-[200px] truncate" title={c.address || 'No address provided'}>
                      <span className="text-muted-text text-[10px] leading-relaxed block whitespace-pre-line truncate">
                        {c.address || 'N/A'}
                      </span>
                    </td>

                    {/* Security Audit */}
                    <td className="py-3 px-4 max-w-[180px]">
                      {c.security_question ? (
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-foreground block truncate" title={c.security_question}>
                            Q: {c.security_question}
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-600 block truncate" title={c.security_answer}>
                            Ans: {c.security_answer}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-text block italic">No security challenge</span>
                      )}
                    </td>

                    {/* XP Points */}
                    <td className="py-3 px-4 text-center font-bold text-sm text-foreground">
                      {c.xp_points || 0}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                        {isPaid ? (
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 border border-emerald-500/15 px-1.5 py-0.5 rounded">
                            PAID
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-text bg-muted-bg border border-border px-1.5 py-0.5 rounded">
                            TRIAL
                          </span>
                        )}
                        
                        {isVerified ? (
                          <span className="text-[8px] font-black uppercase tracking-widest text-secondary bg-secondary-light border border-secondary/15 px-1.5 py-0.5 rounded">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-widest text-danger bg-danger-light border border-danger/15 px-1.5 py-0.5 rounded">
                            UNVERIFIED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Batch */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {batch ? (
                        <span className="px-2.5 py-1 bg-primary-light text-primary rounded-lg font-bold text-[10px] border border-primary/10">
                          {batch.name}
                        </span>
                      ) : (
                        <span className="text-muted-text text-[10px] italic">No Batch</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {rankedCandidates.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-12 px-4 text-center text-muted-text text-sm font-semibold">
                    No candidates found matching the selected filters. Try adjusting your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
