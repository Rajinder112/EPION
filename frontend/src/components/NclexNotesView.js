'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { 
  Search, Filter, BookOpen, Bookmark, Clock, Eye, Download, 
  X, CheckCircle, Info, ChevronRight, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, Edit2, Trash2, Plus, FileText, Sparkles
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

  // Expanded Row State (Only one note expanded at a time, Kindle reader style)
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [windowWidth, setWindowWidth] = useState(0);

  // Admin Add/Edit Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteTopicName, setNoteTopicName] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteCategory, setNoteCategory] = useState('Fundamentals');
  const [noteDifficulty, setNoteDifficulty] = useState('Beginner');
  const [noteStatus, setNoteStatus] = useState('Published');
  const [noteDisplayOrder, setNoteDisplayOrder] = useState(0);
  const [noteFile, setNoteFile] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, [selectedCategory, sortBy]);

  // Inject PDF.js script dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // Track window size for responsive canvas redraws
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load PDF document when expandedNoteId changes
  useEffect(() => {
    if (!expandedNoteId) {
      setPdfDoc(null);
      setPdfError('');
      return;
    }

    let isMounted = true;
    const loadPdf = async () => {
      setPdfLoading(true);
      setPdfError('');
      setPdfDoc(null);

      // Ensure PDF.js is loaded
      let attempts = 0;
      while (typeof window !== 'undefined' && !window.pdfjsLib && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }

      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        if (isMounted) {
          setPdfError('PDF reader library failed to load from CDN. Please check your internet connection.');
          setPdfLoading(false);
        }
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/nclex-notes/${expandedNoteId}/pdf`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (!isMounted) return;

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(doc);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          setPdfError('Could not load PDF document. Please try again.');
        }
      } finally {
        if (isMounted) {
          setPdfLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [expandedNoteId]);

  // Render active page to canvas
  useEffect(() => {
    if (!pdfDoc) return;

    let isMounted = true;
    let renderTask = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const canvas = document.getElementById(`pdf-canvas-${expandedNoteId}`);
        if (!canvas) return;

        const context = canvas.getContext('2d');
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth || 800;

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = (containerWidth - 24) / unscaledViewport.width; // leave small padding
        const viewport = page.getViewport({ scale: scale || 1.2 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        if (renderTask) {
          renderTask.cancel();
        }

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, expandedNoteId, windowWidth]);

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
      let data = [];
      if (user?.role === 'admin') {
        data = await api.getAdminNclexNotes();
      } else {
        data = await api.getNclexNotes(filters);
      }
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching NCLEX notes:', err);
      setError('Failed to load study notes. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Bookmark helper
  const handleToggleBookmark = async (e, noteId, currentStatus) => {
    e.stopPropagation(); // prevent row collapse/expand
    try {
      const newStatus = !currentStatus;
      await api.toggleBookmarkNote(noteId, newStatus);
      
      setNotes(prev => prev.map(n => {
        if (n.id === noteId) {
          return { ...n, bookmarked: newStatus };
        }
        return n;
      }));

      showToast(newStatus ? 'Added to Bookmarks' : 'Removed from Bookmarks', 'success');
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      showToast('Failed to update bookmark', 'error');
    }
  };

  // Expand Note Row (opens Kindle Reader inline)
  const handleToggleExpand = (note) => {
    if (expandedNoteId === note.id) {
      setExpandedNoteId(null);
    } else {
      setExpandedNoteId(note.id);
      setCurrentPage(note.last_page || 1);

      // Increment view count locally and on backend
      setNotes(prev => prev.map(n => {
        if (n.id === note.id) {
          return { ...n, views: (n.views || 0) + 1 };
        }
        return n;
      }));
      api.incrementNoteViews(note.id).catch(console.error);
    }
  };

  // Kindle Page Flipping: Next Page
  const handleNextPage = (note) => {
    if (currentPage < (note.pages || 1)) {
      const nextPage = currentPage + 1;
      handleSaveProgress(note, nextPage);
    }
  };

  // Kindle Page Flipping: Prev Page
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      const note = notes.find(n => n.id === expandedNoteId);
      if (note) handleSaveProgress(note, prevPage);
    }
  };

  // Save progress on page flip or manual page click
  const handleSaveProgress = async (note, pageNum, isFinished = false) => {
    const targetPage = Math.max(1, Math.min(note.pages || 1, pageNum));
    const calculatedProgress = isFinished 
      ? 100 
      : Math.round((targetPage / (note.pages || 1)) * 100);

    try {
      await api.updateNoteProgress(note.id, targetPage, calculatedProgress, isFinished);
      
      setNotes(prev => prev.map(n => {
        if (n.id === note.id) {
          return {
            ...n,
            last_page: targetPage,
            progress_percent: calculatedProgress,
            completed: isFinished || n.completed
          };
        }
        return n;
      }));

      setCurrentPage(targetPage);
      showToast(isFinished ? 'Note marked as completed!' : `Moved to page ${targetPage}`);
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

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${topicName.replace(/\s+/g, '_')}_Notes.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

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

  // Open Admin Form for Add/Edit Note
  const handleOpenForm = (e = null, note = null) => {
    if (e) e.stopPropagation(); // prevent row expand/collapse
    if (note) {
      setEditingNote(note);
      setNoteTopicName(note.topic_name);
      setNoteDescription(note.description || '');
      setNoteCategory(note.category);
      setNoteDifficulty(note.difficulty);
      setNoteStatus(note.status || 'Published');
      setNoteDisplayOrder(note.display_order || 0);
      setNoteFile(null);
    } else {
      setEditingNote(null);
      setNoteTopicName('');
      setNoteDescription('');
      setNoteCategory('Fundamentals');
      setNoteDifficulty('Beginner');
      setNoteStatus('Published');
      setNoteDisplayOrder(notes.length + 1);
      setNoteFile(null);
    }
    setIsFormOpen(true);
  };

  // Save Note CRUD (Add/Edit)
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteTopicName || !noteCategory || !noteDifficulty) {
      alert('Please fill out all required fields.');
      return;
    }
    if (!editingNote && !noteFile) {
      alert('Please select a PDF file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('topic_name', noteTopicName);
    formData.append('description', noteDescription);
    formData.append('category', noteCategory);
    formData.append('difficulty', noteDifficulty);
    formData.append('status', noteStatus);
    formData.append('display_order', noteDisplayOrder);
    if (noteFile) {
      formData.append('pdf', noteFile);
    }

    try {
      if (editingNote) {
        await api.updateNclexNote(editingNote.id, formData);
        showToast('Note updated successfully!', 'success');
      } else {
        await api.createNclexNote(formData);
        showToast('NCLEX Note uploaded successfully!', 'success');
      }
      setIsFormOpen(false);
      fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save NCLEX Note.');
    }
  };

  // Delete Note CRUD
  const handleDeleteNote = async (e, id, title) => {
    e.stopPropagation(); // prevent row expand/collapse
    if (!window.confirm(`Are you sure you want to delete the NCLEX Note: "${title}"?`)) return;
    try {
      await api.deleteNclexNote(id);
      showToast('NCLEX Note deleted successfully', 'success');
      if (expandedNoteId === id) setExpandedNoteId(null);
      fetchNotes();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete NCLEX Note.');
    }
  };

  // Search/Filter matching notes
  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      note.topic_name.toLowerCase().includes(query) ||
      (note.description && note.description.toLowerCase().includes(query));

    const matchesCategory = 
      selectedCategory === 'All' || note.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

      {/* Header Banner */}
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

      {/* ADMIN CONTROL PANEL: ADD NOTES */}
      {user?.role === 'admin' && (
        <div className="flex flex-wrap gap-2.5 items-center justify-between bg-muted-bg/30 p-3 rounded-xl border border-border/80">
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Concept Notes Management (Admin):</span>
          <button
            onClick={(e) => handleOpenForm(e)}
            className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>+ Add Note</span>
          </button>
        </div>
      )}

      {/* FILTER, SEARCH, SORT BOX */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-text" />
            <input
              type="text"
              placeholder="Search concepts by keyword (e.g. Acid-Base, Cardiac)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted-bg border border-border hover:border-primary/20 focus:border-primary rounded-xl py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-text/50 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sort Select */}
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

            {/* Total count badge */}
            <div className="px-3 py-1.5 bg-primary-light border border-primary/20 text-primary font-bold rounded-lg text-xs">
              {filteredNotes.length} Note{filteredNotes.length !== 1 ? 's' : ''} Found
            </div>
          </div>
        </div>

        {/* Categories Pill List */}
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

      {/* CONCEPT NOTE EXPANDABLE LIST (Kindle Reader Layout) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2.5">
          <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-muted-text font-semibold">Loading NCLEX-RN syllabus notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border border-dashed rounded-xl">
          <Info className="w-10 h-10 text-muted-text mx-auto mb-2" />
          <h4 className="text-sm font-bold text-foreground">No Notes Match Your Filters</h4>
          <p className="text-xs text-muted-text mt-0.5">Try searching with other keywords or changing categories.</p>
        </div>
      ) : (
        <div className="space-y-2.5 animate-slide-up">
          {filteredNotes.map((note, idx) => {
            const isExpanded = expandedNoteId === note.id;
            const progressPercent = note.progress_percent || 0;
            const isCompleted = note.completed;

            return (
              <div 
                key={note.id} 
                className="bg-card border border-border hover:border-primary/30 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Header Row (Expand trigger) styled exactly like Concept Card rows in uploaded image */}
                <div
                  onClick={() => handleToggleExpand(note)}
                  className={`w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between text-left transition-colors duration-150 gap-4 cursor-pointer ${
                    isExpanded 
                      ? 'bg-primary-light/40 text-primary border-b border-border/80' 
                      : 'bg-card hover:bg-muted-bg/30'
                  }`}
                >
                  <div className="flex items-center gap-3 pr-4 flex-1 min-w-0">
                    {/* Index Number Badge - Styled exactly like the uploaded image (orange text on peach bg) */}
                    <span className="w-8 h-8 rounded-lg text-xs font-black flex items-center justify-center shrink-0 bg-[#FFF8F5] text-[#FF6A39] border border-[#FF6A39]/20">
                      {idx + 1}
                    </span>
                    
                    {/* Note Title (Heading) */}
                    <span className="font-extrabold text-sm text-foreground leading-tight truncate">
                      {note.topic_name}
                    </span>

                    {/* Draft Indicator (Admin only) */}
                    {user?.role === 'admin' && note.status === 'Draft' && (
                      <span className="px-1.5 py-0.5 text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/10 rounded tracking-wider uppercase shrink-0">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Metadata & Actions Row */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    
                    {/* Category badge */}
                    <div className="hidden xs:flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider shrink-0 text-muted-text">
                      <span className="px-1.5 py-0.5 bg-muted-bg border border-border rounded">
                        {note.category}
                      </span>
                    </div>

                    {/* Action buttons on the right side of the row */}
                    <div className="flex items-center gap-1.5">
                      
                      {/* Bookmark Icon */}
                      <span 
                        onClick={(e) => handleToggleBookmark(e, note.id, note.bookmarked)}
                        className="p-1.5 hover:bg-muted-bg rounded-lg text-muted-text hover:text-primary transition-colors cursor-pointer"
                        title={note.bookmarked ? 'Remove bookmark' : 'Bookmark topic'}
                      >
                        <Bookmark 
                          className="w-4 h-4" 
                          fill={note.bookmarked ? 'currentColor' : 'none'} 
                          style={{ color: note.bookmarked ? 'var(--primary)' : 'inherit' }}
                        />
                      </span>

                      {/* Admin edit & delete options - Styled exactly like the uploaded image */}
                      {user?.role === 'admin' && (
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <span
                            onClick={(e) => handleOpenForm(e, note)}
                            className="py-1 px-2.5 bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/15 rounded hover:bg-[#DBEAFE] transition-colors cursor-pointer"
                            title="Edit Note"
                          >
                            Edit
                          </span>
                          <span
                            onClick={(e) => handleDeleteNote(e, note.id, note.topic_name)}
                            className="py-1 px-2.5 bg-[#FEF2F2] text-[#DC2626] border border-[#DC2626]/15 rounded hover:bg-[#FEE2E2] transition-colors cursor-pointer"
                            title="Delete Note"
                          >
                            Delete
                          </span>
                        </div>
                      )}

                      {/* Toggle Expand Arrow */}
                      <span className="text-muted-text ml-1 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4.5 h-4.5 text-primary" />
                        ) : (
                          <ChevronDown className="w-4.5 h-4.5" />
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kindle Page-by-Page View Inline Panel */}
                {isExpanded && (
                  <div className="p-5 bg-card border-t border-border space-y-4 animate-slide-down">
                    
                    {/* Top Panel Description */}
                    {note.description && (
                      <div className="p-3 bg-muted-bg/50 border border-border/80 rounded-xl text-xs text-muted-text leading-relaxed">
                        <span className="font-extrabold text-foreground block mb-0.5">Syllabus Overview:</span>
                        {note.description}
                      </div>
                    )}

                    {/* KINDLE-STYLE CONTROLLER BAR */}
                    <div className="bg-primary-light/35 border border-primary/10 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                      
                      {/* Left: Stats & Progress percent */}
                      <div className="flex flex-wrap items-center gap-4 text-foreground font-bold">
                        <div className="flex items-center gap-1 text-muted-text font-semibold">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{note.reading_time} Min Read</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Reading Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isCompleted ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'
                          }`}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                          <span className="text-[10px] text-muted-text">({progressPercent}% read)</span>
                        </div>
                      </div>

                      {/* Middle: Kindle Page Selector & Flippers & Progress Slider */}
                      <div className="flex flex-wrap items-center gap-3 font-bold justify-center">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={currentPage <= 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevPage();
                            }}
                            className="px-2.5 py-1 bg-card border border-border hover:border-primary disabled:opacity-40 disabled:hover:border-border rounded-lg text-foreground transition-all cursor-pointer select-none"
                            title="Previous Page"
                          >
                            &larr; Prev Page
                          </button>
                          
                          <div className="flex items-center gap-1.5 px-2">
                            <span className="text-muted-text">Page</span>
                            <input
                              type="number"
                              min={1}
                              max={note.pages || 1}
                              value={currentPage}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) handleSaveProgress(note, val);
                              }}
                              className="w-11 bg-card border border-border hover:border-primary/20 focus:border-primary rounded-lg text-center font-bold text-xs py-0.5 text-foreground focus:outline-none"
                            />
                            <span className="text-muted-text">of {note.pages}</span>
                          </div>

                          <button
                            disabled={currentPage >= (note.pages || 1)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextPage(note);
                            }}
                            className="px-2.5 py-1 bg-card border border-border hover:border-primary disabled:opacity-40 disabled:hover:border-border rounded-lg text-foreground transition-all cursor-pointer select-none"
                            title="Next Page"
                          >
                            Next Page &rarr;
                          </button>
                        </div>

                        {/* Page Slider for Kindle e-reader paging control */}
                        <div className="flex items-center gap-1.5 w-32 shrink-0">
                          <input
                            type="range"
                            min={1}
                            max={note.pages || 1}
                            value={currentPage}
                            onChange={(e) => {
                              handleSaveProgress(note, parseInt(e.target.value));
                            }}
                            className="w-full h-1 bg-muted-bg rounded-lg appearance-none cursor-pointer accent-primary border-none"
                          />
                        </div>
                      </div>

                      {/* Right: Actions (Mark Complete / Download) */}
                      <div className="flex items-center gap-2">
                        {!isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveProgress(note, note.pages, true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDownload(e, note.id, note.topic_name)}
                          className="px-3 py-1 bg-card hover:bg-muted-bg text-muted-text hover:text-foreground border border-border rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>

                    </div>

                    {/* Progress percentage bar indicator */}
                    <div className="w-full bg-muted-bg rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`} 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    {/* DYNAMIC CANVAS-BASED KINDLE READER VIEWPORT */}
                    <div className="border border-border rounded-xl bg-[#F8F9FA] dark:bg-[#1E2022] overflow-hidden relative shadow-inner flex items-center justify-center p-4" style={{ minHeight: '650px' }}>
                      {pdfLoading ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs text-muted-text font-bold">Loading book pages...</p>
                        </div>
                      ) : pdfError ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                          <AlertCircle className="w-8 h-8 text-danger" />
                          <p className="text-xs text-danger font-bold">{pdfError}</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Re-trigger document load
                              const prev = expandedNoteId;
                              setExpandedNoteId(null);
                              setTimeout(() => setExpandedNoteId(prev), 50);
                            }}
                            className="mt-2 py-1 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <div className="relative w-full flex justify-center bg-white dark:bg-zinc-900 rounded-lg overflow-hidden select-none p-2 border border-border/40 shadow-sm max-w-[850px]">
                          {/* Left Navigation Overlay Zone */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrevPage();
                            }}
                            className={`absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 bg-gradient-to-r from-black/10 to-transparent cursor-pointer transition-opacity z-10 ${currentPage <= 1 ? 'pointer-events-none' : ''}`}
                            title="Previous Page"
                          >
                            <span className="w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow flex items-center justify-center text-foreground font-black text-sm border border-border/40 shadow-sm">&larr;</span>
                          </div>

                          {/* Render Page Canvas */}
                          <canvas 
                            id={`pdf-canvas-${note.id}`} 
                            className="shadow-md rounded-md max-w-full"
                            style={{ display: 'block' }}
                          />

                          {/* Right Navigation Overlay Zone */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNextPage(note);
                            }}
                            className={`absolute right-0 top-0 bottom-0 w-16 flex items-center justify-center opacity-0 hover:opacity-100 bg-gradient-to-l from-black/10 to-transparent cursor-pointer transition-opacity z-10 ${currentPage >= (note.pages || 1) ? 'pointer-events-none' : ''}`}
                            title="Next Page"
                          >
                            <span className="w-8 h-8 rounded-full bg-white/90 dark:bg-zinc-800/90 shadow flex items-center justify-center text-foreground font-black text-sm border border-border/40 shadow-sm">&rarr;</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Watermark */}
                    <div className="flex items-center justify-between text-[10px] text-muted-text font-semibold pt-1">
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> {note.views || 0} views
                        <span className="w-1 h-1 rounded-full bg-muted-text/30"></span>
                        <Download className="w-3.5 h-3.5" /> {note.downloads || 0} downloads
                      </span>
                      <span>Prepared in collaboration with Waheguru Nursing Classes (WNC)</span>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NCLEX NOTES ADD/EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/80 pb-3">
              <h3 className="font-extrabold text-foreground text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>{editingNote ? `Edit Note: ${editingNote.topic_name}` : 'Upload New NCLEX Note'}</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-muted-text hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              {/* Topic Name */}
              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Topic Name (Heading) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parkland Burn Resuscitation Formula"
                  value={noteTopicName}
                  onChange={(e) => setNoteTopicName(e.target.value)}
                  className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-muted-text uppercase tracking-wider block">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of note contents or focus concepts..."
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  className="w-full p-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Category *</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Fundamentals">Fundamentals</option>
                    <option value="Adult Health">Adult Health</option>
                    <option value="Medical Surgical Nursing">Medical Surgical Nursing</option>
                    <option value="Critical Care">Critical Care</option>
                    <option value="Pharmacology">Pharmacology</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Psychiatric">Psychiatric</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Difficulty *</label>
                  <select
                    value={noteDifficulty}
                    onChange={(e) => setNoteDifficulty(e.target.value)}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Status *</label>
                  <select
                    value={noteStatus}
                    onChange={(e) => setNoteStatus(e.target.value)}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                {/* Display Order */}
                <div className="space-y-1">
                  <label className="font-bold text-muted-text uppercase tracking-wider block">Display Order</label>
                  <input
                    type="number"
                    value={noteDisplayOrder}
                    onChange={(e) => setNoteDisplayOrder(parseInt(e.target.value) || 0)}
                    className="w-full py-2.5 px-3 bg-muted-bg border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  />
                </div>
              </div>

              {/* PDF file upload */}
              <div className="space-y-1.5 border border-dashed border-border rounded-xl p-4 bg-muted-bg/25">
                <label className="font-bold text-muted-text uppercase tracking-wider block">
                  {editingNote ? 'Replace PDF notes file (Optional)' : 'Select PDF notes file *'}
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setNoteFile(e.target.files[0])}
                  className="text-xs text-foreground"
                />
                <p className="text-[10px] text-muted-text">Max size: 100MB. PDF formats only. Page counts are auto-calculated on upload.</p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {editingNote ? 'Save Changes' : 'Upload Notes File'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
