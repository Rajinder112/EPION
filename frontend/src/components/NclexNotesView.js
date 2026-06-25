'use client';

import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Search, Filter, BookOpen, Bookmark, Clock, Eye, Download, 
  ExternalLink, X, CheckCircle, Info, ChevronRight, AlertCircle, RefreshCw
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Fundamentals',
  'Adult Health',
  'Medical Surgical Nursing',
  'Critical Care',
  'Pharmacology',
  'Maternity',
  'Pediatrics',
  'Psychiatric'
];

export default function NclexNotesView({ user }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default'); // 'default', 'popular', 'alphabetical', 'oldest'

  // Viewer Modal State
  const [activeNote, setActiveNote] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewerKey, setViewerKey] = useState(0); // to force iframe refresh if page hash changes

  // Toast Notification State
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory, sortBy]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {
        category: selectedCategory === 'All' ? '' : selectedCategory,
        sort: sortBy
      };
      const data = await api.getNclexNotes(filters);
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching NCLEX notes:', err);
      setError('Failed to load study notes. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Search Filter
  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    return (
      note.topic_name.toLowerCase().includes(query) ||
      (note.description && note.description.toLowerCase().includes(query))
    );
  });

  // Recently Viewed & In Progress
  const inProgressNotes = notes.filter(n => n.progress_percent > 0 && n.progress_percent < 100);
  // Bookmarked notes
  const bookmarkedNotes = notes.filter(n => n.bookmarked);

  // Toggle Bookmark helper
  const handleToggleBookmark = async (e, noteId, currentStatus) => {
    e.stopPropagation(); // prevent card click
    try {
      const newStatus = !currentStatus;
      await api.toggleBookmarkNote(noteId, newStatus);
      
      // Update local state
      setNotes(prev => prev.map(n => {
        if (n.id === noteId) {
          return { ...n, bookmarked: newStatus };
        }
        return n;
      }));

      // If active note is open, sync bookmark status
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(prev => ({ ...prev, bookmarked: newStatus }));
      }

      showToast(newStatus ? 'Added to Bookmarks' : 'Removed from Bookmarks', 'success');
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      showToast('Failed to update bookmark', 'error');
    }
  };

  // Stream PDF Viewer Open
  const handleOpenNote = async (note) => {
    try {
      setActiveNote(note);
      setCurrentPage(note.last_page || 1);
      setViewerKey(prev => prev + 1);
      
      // Increment view count locally
      setNotes(prev => prev.map(n => {
        if (n.id === note.id) {
          return { ...n, views: (n.views || 0) + 1 };
        }
        return n;
      }));

      // Call API views increment in background
      api.incrementNoteViews(note.id).catch(console.error);
    } catch (err) {
      console.error('Error opening note:', err);
      showToast('Could not load PDF viewer', 'error');
    }
  };

  // Close PDF Viewer
  const handleCloseNote = () => {
    setActiveNote(null);
  };

  // Save progress manually / next page
  const handleSaveProgress = async (pageNum, isFinished = false) => {
    if (!activeNote) return;
    
    const targetPage = Math.max(1, Math.min(activeNote.pages || 1, pageNum));
    const calculatedProgress = isFinished 
      ? 100 
      : Math.round((targetPage / (activeNote.pages || 1)) * 100);

    try {
      await api.updateNoteProgress(activeNote.id, targetPage, calculatedProgress, isFinished);
      
      // Update local notes array
      setNotes(prev => prev.map(n => {
        if (n.id === activeNote.id) {
          return {
            ...n,
            last_page: targetPage,
            progress_percent: calculatedProgress,
            completed: isFinished || n.completed
          };
        }
        return n;
      }));

      // Update active note state
      setActiveNote(prev => ({
        ...prev,
        last_page: targetPage,
        progress_percent: calculatedProgress,
        completed: isFinished || prev.completed
      }));

      setCurrentPage(targetPage);
      
      // Force iframe update
      setViewerKey(prev => prev + 1);
      showToast(isFinished ? 'Note marked as completed!' : 'Progress saved successfully');
    } catch (err) {
      console.error('Error updating progress:', err);
      showToast('Failed to save reading progress', 'error');
    }
  };

  // Download PDF secure handler
  const handleDownload = async (e, noteId, topicName) => {
    e.stopPropagation();
    showToast('Preparing download...', 'info');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/nclex-notes/${noteId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download request failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${topicName.replace(/\s+/g, '_')}_Notes.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Increment downloads count in local state
      setNotes(prev => prev.map(n => {
        if (n.id === noteId) {
          return { ...n, downloads: (n.downloads || 0) + 1 };
        }
        return n;
      }));

      showToast('Download completed!', 'success');
    } catch (err) {
      console.error('Error downloading note:', err);
      showToast('Failed to download PDF notes', 'error');
    }
  };

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-12 bg-card border border-border rounded-xl text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-1">Could Not Load Notes</h3>
        <p className="text-muted-text text-sm mb-4">{error}</p>
        <button 
          onClick={fetchNotes}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg flex items-center gap-2 mx-auto transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-2.5 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-2 transition-all transform animate-bounce ${
          toast.type === 'error' 
            ? 'bg-danger-light text-danger border-danger/20' 
            : toast.type === 'info'
            ? 'bg-primary-light text-primary border-primary/20'
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="bg-gradient-to-r from-card to-primary-light border border-border p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span>NCLEX-RN Study Notes</span>
            <BookOpen className="w-5 h-5 text-primary shrink-0" />
          </h2>
          <p className="text-muted-text text-sm max-w-2xl">
            Read and download high-quality NCLEX-RN PDF notes prepared by educators. Track your reading progress, bookmark important topics, and resume right where you left off.
          </p>
        </div>
      </div>

      {/* RECENTLY VIEWED / CONTINUE READING SECTION */}
      {inProgressNotes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-primary" />
            <span>Recently Viewed & In Progress</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressNotes.slice(0, 3).map(note => (
              <div 
                key={note.id} 
                onClick={() => handleOpenNote(note)}
                className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-2 py-0.5 text-[10px] bg-primary-light text-primary font-black rounded uppercase border border-primary/10 truncate">
                      {note.category}
                    </span>
                    <span className="text-xs text-muted-text font-bold flex items-center gap-1 shrink-0">
                      Page {note.last_page}/{note.pages}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mt-2 group-hover:text-primary transition-colors line-clamp-1">
                    {note.topic_name}
                  </h4>
                  <p className="text-xs text-muted-text mt-1 line-clamp-1">
                    {note.description || 'No description provided.'}
                  </p>
                </div>
                
                <div className="mt-4 space-y-2">
                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-muted-text">
                      <span>Reading Progress</span>
                      <span>{note.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-muted-bg rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${note.progress_percent}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-1 text-[11px] font-bold text-primary">
                    <span>Continue Reading</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BOOKMARKS SECTION */}
      {bookmarkedNotes.length > 0 && !selectedCategory && searchQuery === '' && (
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Bookmark className="w-4.5 h-4.5 text-primary" fill="currentColor" />
            <span>Bookmarked Topics</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bookmarkedNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => handleOpenNote(note)}
                className="bg-card border border-border hover:border-primary/40 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="px-1.5 py-0.5 text-[9px] bg-primary-light text-primary font-black rounded uppercase border border-primary/10 truncate">
                      {note.category}
                    </span>
                    <button 
                      onClick={(e) => handleToggleBookmark(e, note.id, note.bookmarked)}
                      className="p-1 text-primary hover:bg-primary-light rounded-lg transition-colors shrink-0"
                    >
                      <Bookmark className="w-3.5 h-3.5" fill="currentColor" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-foreground mt-2 group-hover:text-primary transition-colors line-clamp-1">
                    {note.topic_name}
                  </h4>
                </div>
                <div className="flex justify-between items-center text-[10px] font-semibold text-muted-text mt-3 pt-2 border-t border-border/60">
                  <span>{note.pages} Pages</span>
                  <span className="flex items-center gap-0.5 text-primary font-bold">
                    Read Note <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & SORT BAR */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-text" />
            <input
              type="text"
              placeholder="Search topic or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted-bg border border-border hover:border-primary/20 focus:border-primary rounded-xl py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-text focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-text">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-card border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="default">Default Order</option>
                <option value="popular">Most Popular</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Total Badge */}
            <div className="px-3 py-1.5 bg-primary-light border border-primary/20 text-primary font-bold rounded-lg text-xs">
              {filteredNotes.length} Note{filteredNotes.length !== 1 ? 's' : ''} Found
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-muted-text flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Categories</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => {
              const isSelected = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
                      : 'bg-card text-muted-text border-border hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* NOTES CATALOG GRID */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2.5">
          <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-muted-text font-semibold">Fetching study notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-xl">
          <Info className="w-10 h-10 text-muted-text mx-auto mb-2" />
          <h4 className="text-sm font-bold text-foreground">No Notes Match Your Filters</h4>
          <p className="text-xs text-muted-text mt-0.5">Try searching with other keywords or changing categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => {
            const hasStarted = note.progress_percent > 0;
            const isCompleted = note.completed;
            
            return (
              <div
                key={note.id}
                onClick={() => handleOpenNote(note)}
                className="bg-card border border-border hover:border-primary/30 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group overflow-hidden"
              >
                {/* Accent Top Bar based on difficulty */}
                <div className={`h-1.5 w-full ${
                  note.difficulty === 'Beginner' 
                    ? 'bg-emerald-500' 
                    : note.difficulty === 'Intermediate' 
                    ? 'bg-amber-500' 
                    : 'bg-rose-500'
                }`}></div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Tags row */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2 py-0.5 text-[9px] bg-primary-light text-primary font-black rounded uppercase border border-primary/10 truncate">
                        {note.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {/* Difficulty Badge */}
                        <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                          note.difficulty === 'Beginner'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : note.difficulty === 'Intermediate'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {note.difficulty}
                        </span>
                        
                        {/* Bookmark Icon */}
                        <button
                          onClick={(e) => handleToggleBookmark(e, note.id, note.bookmarked)}
                          className="p-1 hover:bg-muted-bg rounded-lg transition-colors text-muted-text hover:text-primary shrink-0"
                          title={note.bookmarked ? 'Remove bookmark' : 'Bookmark note'}
                        >
                          <Bookmark 
                            className="w-4.5 h-4.5" 
                            fill={note.bookmarked ? 'currentColor' : 'none'} 
                            style={{ color: note.bookmarked ? 'var(--primary)' : 'inherit' }}
                          />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-foreground mt-3 group-hover:text-primary transition-colors line-clamp-2">
                      {note.topic_name}
                    </h4>

                    <p className="text-xs text-muted-text mt-1.5 line-clamp-3">
                      {note.description || 'Access full study syllabus notes compiled by waheguru nursing classes expert educators.'}
                    </p>
                  </div>

                  <div className="mt-5 space-y-4 pt-3 border-t border-border/50">
                    {/* Stats metrics */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted-text">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{note.reading_time} Min Read</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-0.5">
                          <Eye className="w-3.5 h-3.5" /> {note.views || 0}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Download className="w-3.5 h-3.5" /> {note.downloads || 0}
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking */}
                    {hasStarted && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-muted-text">
                          <span>{isCompleted ? 'Completed' : 'Last read progress'}</span>
                          <span>{note.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-muted-bg rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`} 
                            style={{ width: `${note.progress_percent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Actions bar */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenNote(note)}
                        className="flex-1 py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{hasStarted ? 'Resume Reading' : 'Read Notes'}</span>
                      </button>
                      <button
                        onClick={(e) => handleDownload(e, note.id, note.topic_name)}
                        className="p-2 bg-card hover:bg-muted-bg text-muted-text hover:text-foreground border border-border rounded-xl transition-all cursor-pointer"
                        title="Download PDF note"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NATIVE PDF READER MODAL */}
      {activeNote && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-fade-in">
          <div className="w-full h-full md:max-w-6xl md:max-h-[92vh] md:border md:border-border md:rounded-2xl bg-card shadow-2xl flex flex-col overflow-hidden animate-scale-up relative">
            
            {/* Modal Header */}
            <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="px-2 py-0.5 text-[9px] bg-primary-light text-primary font-black rounded uppercase border border-primary/10 shrink-0">
                  {activeNote.category}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-sm truncate leading-tight">
                    {activeNote.topic_name}
                  </h3>
                  <p className="text-[10px] text-muted-text mt-0.5 truncate hidden sm:block">
                    {activeNote.pages} pages • Resumed at page {currentPage}
                  </p>
                </div>
              </div>

              {/* Controls area */}
              <div className="flex items-center gap-2">
                {/* Bookmark toggle inside modal */}
                <button
                  onClick={(e) => handleToggleBookmark(e, activeNote.id, activeNote.bookmarked)}
                  className={`p-1.5 border border-border rounded-lg hover:bg-muted-bg transition-colors shrink-0 ${
                    activeNote.bookmarked ? 'text-primary' : 'text-muted-text'
                  }`}
                  title={activeNote.bookmarked ? 'Bookmarked' : 'Add bookmark'}
                >
                  <Bookmark className="w-4 h-4" fill={activeNote.bookmarked ? 'currentColor' : 'none'} />
                </button>

                {/* Secure Direct Download */}
                <button
                  onClick={(e) => handleDownload(e, activeNote.id, activeNote.topic_name)}
                  className="p-1.5 border border-border rounded-lg hover:bg-muted-bg text-muted-text hover:text-foreground transition-colors shrink-0"
                  title="Download offline notes copy"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={handleCloseNote}
                  className="p-1.5 border border-border rounded-lg bg-danger/5 text-danger hover:bg-danger/10 transition-colors shrink-0"
                  title="Close Viewer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Sub-Header Control Bar (Resumes / Updates Progress) */}
            <div className="bg-primary-light/40 border-b border-primary/10 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 text-xs text-foreground font-bold">
                <Info className="w-4.5 h-4.5 text-primary shrink-0" />
                <span>Reading Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-primary/15 text-primary">
                  {activeNote.completed ? 'Completed' : 'In Progress'}
                </span>
                <span className="text-[11px] text-muted-text font-semibold">({activeNote.progress_percent || 0}% read)</span>
              </div>

              {/* Progress Saver Input & Buttons */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-text">I am currently at Page:</span>
                  <input
                    type="number"
                    min={1}
                    max={activeNote.pages || 1}
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setCurrentPage(val);
                    }}
                    className="w-14 bg-card border border-border hover:border-primary/20 focus:border-primary rounded-lg text-center font-bold text-xs py-1 text-foreground focus:outline-none"
                  />
                  <span className="text-xs font-semibold text-muted-text">/ {activeNote.pages}</span>
                  
                  <button
                    onClick={() => handleSaveProgress(currentPage)}
                    className="ml-1.5 px-3 py-1 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Save Page
                  </button>
                </div>

                {!activeNote.completed && (
                  <button
                    onClick={() => handleSaveProgress(activeNote.pages, true)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Complete Note</span>
                  </button>
                )}
              </div>
            </div>

            {/* Embedded Native PDF Viewer Frame */}
            <div className="flex-1 bg-muted-bg relative">
              <iframe
                key={viewerKey}
                src={`/api/nclex-notes/${activeNote.id}/pdf#page=${currentPage}`}
                className="w-full h-full border-none"
                title={`PDF notes: ${activeNote.topic_name}`}
              ></iframe>
            </div>

            {/* Educational watermark / partner banner */}
            <div className="bg-card border-t border-border px-4 py-2 text-center text-[10px] text-muted-text font-semibold shrink-0">
              NCLEX-RN Notes curated in academic collaboration with <span className="text-primary font-bold">Waheguru Nursing Classes (WNC)</span>. For personal candidate review only.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
