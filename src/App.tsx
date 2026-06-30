import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Music, 
  Sparkles, 
  Film, 
  History, 
  Image as ImageIcon, 
  Info, 
  Menu, 
  X, 
  Download, 
  Copy, 
  Edit3, 
  Plus, 
  Check, 
  Heart, 
  Trash2, 
  Play, 
  Square,
  Search, 
  Loader2, 
  AlertCircle,
  HelpCircle,
  Clock,
  Tv,
  ArrowRight
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import { SongProject, GenerateRequest, DashboardStats } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('lyrics');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [songs, setSongs] = useState<SongProject[]>([]);
  const [currentSong, setCurrentSong] = useState<SongProject | null>(null);
  
  // App state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New song form state
  const [prompt, setPrompt] = useState<string>('');
  const [genre, setGenre] = useState<string>('មនោសញ្ចេតនា (Sentimental)');
  const [tempo, setTempo] = useState<string>('យឺត (Slow - 72 BPM)');
  const [mode, setMode] = useState<'khmer' | 'english' | 'km'>('khmer');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customArtist, setCustomArtist] = useState<string>('');

  // Audio concept player state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [activeOscillators, setActiveOscillators] = useState<any[]>([]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editLyrics, setEditLyrics] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editStoryboard, setEditStoryboard] = useState<string>('');

  // Copy/Download success states
  const [copiedLyrics, setCopiedLyrics] = useState<boolean>(false);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  // Load initial samples and user data
  useEffect(() => {
    const loadSongs = async () => {
      try {
        const localSongs = localStorage.getItem('lyric_studio_songs');
        if (localSongs) {
          const parsed = JSON.parse(localSongs);
          setSongs(parsed);
          if (parsed.length > 0) {
            setCurrentSong(parsed[0]);
          }
        } else {
          // Fetch samples from backend Express server
          const response = await fetch('/api/samples');
          if (response.ok) {
            const samples = await response.json();
            setSongs(samples);
            localStorage.setItem('lyric_studio_songs', JSON.stringify(samples));
            if (samples.length > 0) {
              setCurrentSong(samples[0]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load songs:', err);
      }
    };

    loadSongs();
  }, []);

  // Sync back to local storage whenever songs list updates
  const saveSongsToStorage = (updatedSongs: SongProject[]) => {
    setSongs(updatedSongs);
    localStorage.setItem('lyric_studio_songs', JSON.stringify(updatedSongs));
  };

  // Generate new song
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre,
          tempo,
          mode,
          title: customTitle || undefined,
          artist: customArtist || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate song. Key may be missing.');
      }

      const generatedData = await response.json();
      
      const newSong: SongProject = {
        id: `song-${Date.now()}`,
        title: generatedData.title,
        artist: customArtist || (mode === 'khmer' ? 'រក្សាសិទ្ធិដោយ AI' : 'AI Co-Writer'),
        genre,
        tempo,
        mode,
        lyrics: generatedData.lyrics,
        producerNotes: generatedData.producerNotes,
        visualAiPrompt: generatedData.visualAiPrompt,
        storyboard: generatedData.storyboard,
        createdAt: new Date().toISOString(),
        isFavorite: false
      };

      const updated = [newSong, ...songs];
      saveSongsToStorage(updated);
      setCurrentSong(newSong);
      setIsGenerateModalOpen(false);
      setActiveTab('lyrics'); // Go to writing space

      // Reset form
      setPrompt('');
      setCustomTitle('');
      setCustomArtist('');
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'មានបញ្ហាបច្ចេកទេសក្នុងការតាក់តែង។ សូមព្យាយាមម្តងទៀត។');
    } finally {
      setIsGenerating(false);
    }
  };

  // Favorite toggle
  const toggleFavorite = (id: string) => {
    const updated = songs.map(song => {
      if (song.id === id) {
        const val = !song.isFavorite;
        if (currentSong?.id === id) {
          setCurrentSong({ ...currentSong, isFavorite: val });
        }
        return { ...song, isFavorite: val };
      }
      return song;
    });
    saveSongsToStorage(updated);
  };

  // Delete song
  const handleDeleteSong = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('តើអ្នកពិតជាចង់លុបបទចម្រៀងនេះមែនទេ?')) {
      const updated = songs.filter(song => song.id !== id);
      saveSongsToStorage(updated);
      if (currentSong?.id === id) {
        setCurrentSong(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  // Copy lyrics to clipboard
  const handleCopyLyrics = () => {
    if (!currentSong) return;
    const textToCopy = `Title: ${currentSong.title}\nGenre: ${currentSong.genre}\nTempo: ${currentSong.tempo}\n\nLYRICS:\n${currentSong.lyrics}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  // Download bundle file (.txt)
  const handleDownloadBundle = () => {
    if (!currentSong) return;
    const content = `=========================================
LYRIC STUDIO PRO - AI MASTERCLASS BUNDLE
=========================================
ចំណងជើង / TITLE: ${currentSong.title}
អ្នកនិពន្ធ / STYLE: ${currentSong.artist || 'AI Lyricist'}
ចង្វាក់ / GENRE: ${currentSong.genre}
ល្បឿន / TEMPO: ${currentSong.tempo}
ភាសា / MODE: ${currentSong.mode.toUpperCase()}
បង្កើតឡើងនៅថ្ងៃ / DATE: ${new Date(currentSong.createdAt).toLocaleDateString()}

-----------------------------------------
ទំរង់ទំនុកច្រៀង / LYRICS:
-----------------------------------------
${currentSong.lyrics}

-----------------------------------------
គំនិតណែនាំរបស់អ្នកផលិត / PRODUCER NOTES:
-----------------------------------------
${currentSong.producerNotes}

-----------------------------------------
រូបភាព AI / VISUAL AI PROMPT (For Midjourney/Gemini):
-----------------------------------------
${currentSong.visualAiPrompt}

-----------------------------------------
ក្តាររៀបរាប់ដំណើររឿង / MUSIC VIDEO STORYBOARD:
-----------------------------------------
${currentSong.storyboard}

=========================================
Crafted via Lyric Studio Pro.
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentSong.title.replace(/\s+/g, '_')}_studio_bundle.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  // Edit current song
  const handleOpenEdit = () => {
    if (!currentSong) return;
    setEditTitle(currentSong.title);
    setEditLyrics(currentSong.lyrics);
    setEditNotes(currentSong.producerNotes);
    setEditPrompt(currentSong.visualAiPrompt);
    setEditStoryboard(currentSong.storyboard);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSong) return;

    const updatedSong: SongProject = {
      ...currentSong,
      title: editTitle,
      lyrics: editLyrics,
      producerNotes: editNotes,
      visualAiPrompt: editPrompt,
      storyboard: editStoryboard
    };

    const updated = songs.map(s => s.id === currentSong.id ? updatedSong : s);
    saveSongsToStorage(updated);
    setCurrentSong(updatedSong);
    setIsEditModalOpen(false);
  };

  // Web Audio Synth to play atmospheric ambient sounds
  // Emulates beautiful traditional Khmer Khloy (bamboo flute) vibrato + soft background piano pad!
  const startAtmosphericAudio = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(ctx);
      setIsPlayingAudio(true);

      const oscillatorsList: any[] = [];

      // 1. Piano / Pad sound (Base chords)
      const pianoFreqs = [110, 165, 220, 330]; // A major/minor neutral chord notes
      pianoFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'triangle'; // Smooth flute-like soft sound
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Gentle swell
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start();
        oscillatorsList.push({ osc, gainNode });
      });

      // 2. Beautiful Khloy flute lead melody (synthesized with a gentle vibrato LFO)
      const fluteOsc = ctx.createOscillator();
      fluteOsc.type = 'sine';
      
      const fluteGain = ctx.createGain();
      fluteGain.gain.setValueAtTime(0, ctx.currentTime);
      fluteGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1);

      // Low pass filter to make it sound woody and warm like bamboo
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);

      // Vibrato LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 4.5; // Vibrato speed (Hz)
      lfoGain.gain.value = 8; // Vibrato depth (pitch change range)
      
      lfo.connect(lfoGain);
      lfoGain.connect(fluteOsc.frequency);
      
      fluteOsc.connect(filter);
      filter.connect(fluteGain);
      fluteGain.connect(ctx.destination);

      lfo.start();
      fluteOsc.start();
      
      oscillatorsList.push({ osc: fluteOsc, gainNode: fluteGain });
      oscillatorsList.push({ osc: lfo, gainNode: null });

      // Play a beautiful, slow Khmer-style modal scale melody
      const notes = [440, 495, 523, 587, 659, 783, 880]; // Pentatonic A minor/Khmer traditional vibe
      let timeOffset = 1;

      const playRandomMelody = () => {
        if (!ctx || ctx.state === 'closed') return;
        
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        const duration = 1.5 + Math.random() * 2; // Long breathing notes
        
        fluteOsc.frequency.setValueAtTime(randomNote, ctx.currentTime + timeOffset);
        
        // Swell envelope for breath articulation
        fluteGain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
        fluteGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + timeOffset + 0.4);
        fluteGain.gain.setValueAtTime(0.12, ctx.currentTime + timeOffset + duration - 0.5);
        fluteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + duration);

        timeOffset += duration + 0.2;
        
        // Loop next notes
        if (isPlayingAudio) {
          setTimeout(playRandomMelody, duration * 1000);
        }
      };

      playRandomMelody();
      setActiveOscillators(oscillatorsList);

    } catch (e) {
      console.error('Audio Synthesis failed to initialize:', e);
    }
  };

  const stopAtmosphericAudio = () => {
    activeOscillators.forEach(item => {
      try {
        if (item.gainNode) {
          item.gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext!.currentTime + 0.5);
        }
        setTimeout(() => {
          try { item.osc.stop(); } catch (err) {}
        }, 600);
      } catch (err) {}
    });
    
    if (audioContext) {
      setTimeout(() => {
        try { audioContext.close(); } catch (err) {}
      }, 700);
    }
    
    setIsPlayingAudio(false);
    setActiveOscillators([]);
    setAudioContext(null);
  };

  useEffect(() => {
    return () => {
      // Clean up synth on unmount
      activeOscillators.forEach(item => {
        try { item.osc.stop(); } catch (e) {}
      });
    };
  }, [activeOscillators]);

  // Statistics calculation
  const stats: DashboardStats = {
    totalSongs: songs.length,
    favoriteSongs: songs.filter(s => s.isFavorite).length,
    totalStoryboardScenes: songs.reduce((acc, curr) => acc + (curr.storyboard ? 4 : 0), 0),
    averageWords: songs.length > 0 
      ? Math.round(songs.reduce((acc, curr) => acc + curr.lyrics.split(/\s+/).length, 0) / songs.length)
      : 0
  };

  // Filter songs based on search
  const filteredSongs = songs.filter(song => {
    const query = searchQuery.toLowerCase();
    return (
      song.title.toLowerCase().includes(query) ||
      (song.artist && song.artist.toLowerCase().includes(query)) ||
      song.genre.toLowerCase().includes(query) ||
      song.lyrics.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#070606] text-gray-100 font-sans flex flex-col md:flex-row antialiased">
      
      {/* Sidebar Component */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen}
        onGenerateClick={() => setIsGenerateModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[#0F0E0E] border-b border-[#262121]/30">
          <div className="flex items-center gap-2">
            <button 
              id="mobile-sidebar-toggle"
              onClick={() => setIsSidebarOpen(true)} 
              className="p-1.5 text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base font-bold font-display text-white tracking-tight flex items-center gap-1">
              Lyric Studio <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded font-mono">PRO</span>
            </h1>
          </div>
          
          <button
            id="mobile-generate-btn"
            onClick={() => setIsGenerateModalOpen(true)}
            className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-red-500/10"
          >
            <Plus className="w-4 h-4" />
          </button>
        </header>

        {/* Studio Top Header (Aesthetic and Functional) */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0A0909] border-b border-[#262121]/20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-mono text-gray-400 tracking-wider">LYRIC STUDIO PRO • AI MASTERCLASS SUITE</span>
          </div>
          
          {/* Audio Concept Playback Banner */}
          <div className="flex items-center gap-4 bg-[#141212] border border-[#ef4444]/10 rounded-full px-4 py-1.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-500" />
              Ambient Studio Synth:
            </span>
            {isPlayingAudio ? (
              <button 
                id="stop-audio-btn"
                onClick={stopAtmosphericAudio} 
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-400"
              >
                <Square className="w-3 h-3 fill-current" /> Stop Concept Flute
              </button>
            ) : (
              <button 
                id="start-audio-btn"
                onClick={startAtmosphericAudio} 
                className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400"
              >
                <Play className="w-3 h-3 fill-current animate-bounce" /> Play atmospheric sound
              </button>
            )}
          </div>
        </div>

        {/* Active Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold font-display text-white">សួស្តី, ស្ទូឌីយ៉ូកំពូលនិពន្ធ AI</h2>
                  <p className="text-gray-400 text-sm">សូមស្វាគមន៍មកកាន់ប្រព័ន្ធវិភាគ និងគ្រប់គ្រងការតែងនិពន្ធតន្ត្រីទំនើបបំផុត។</p>
                </div>
                <button
                  id="dashboard-new-song-btn"
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold shadow-lg shadow-red-500/10 hover:shadow-red-500/25 transition-all duration-300"
                >
                  <Plus className="w-5 h-5" />
                  តែងនិពន្ធបទថ្មី (Create New Song)
                </button>
              </div>

              {/* Stats Bento Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'បទចម្រៀងសរុប', sub: 'Total Songs', val: stats.totalSongs, color: 'border-red-500/20 text-red-500 bg-red-500/5' },
                  { label: 'បទចម្រៀងពេញចិត្ត', sub: 'Favorite Songs', val: stats.favoriteSongs, color: 'border-amber-500/20 text-amber-500 bg-amber-500/5' },
                  { label: 'ប្លង់រឿងវីដេអូ', sub: 'MV Storyboards', val: stats.totalStoryboardScenes, color: 'border-orange-500/20 text-orange-500 bg-orange-500/5' },
                  { label: 'ប្រវែងពាក្យជាមធ្យម', sub: 'Average Words/Song', val: stats.averageWords, color: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' },
                ].map((stat, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${stat.color} flex flex-col justify-between h-32`}>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                      <p className="text-[10px] font-mono text-gray-500 leading-none">{stat.sub}</p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight font-display">{stat.val}</p>
                  </div>
                ))}
              </div>

              {/* Quick Start / Banner Section */}
              <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-[#211212] via-[#120E0E] to-[#0A0909] border border-red-500/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="space-y-2 max-w-xl text-center md:text-left">
                  <span className="inline-block text-[10px] font-mono bg-red-500/10 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">AI CO-WRITER ACTIVE</span>
                  <h3 className="text-lg md:text-xl font-bold text-white">គ្រាន់តែបញ្ចូលគំនិត ឬប្រធានបទ បទចម្រៀងនឹងលេចចេញជាភ្លាមៗ</h3>
                  <p className="text-xs md:text-sm text-gray-400">ប្រព័ន្ធនឹងបង្កើតទាំងទំនុកច្រៀងជាវគ្គៗ, ការណែនាំឧបករណ៍តន្ត្រី, កម្រិតល្បឿន (BPM), គំនិតផ្ទាំងរូបភាព AI និងក្តាររៀបរាប់ដំណើររឿងវីដេអូ (Storyboard) យ៉ាងលម្អិត។</p>
                </div>
                <button
                  id="dashboard-start-masterclass-btn"
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300"
                >
                  សាកល្បងឥឡូវនេះ (Start Now)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Recent Songs Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-display text-white">បទចម្រៀងថ្មីៗដែលបានតាក់តែង (Recent Works)</h3>
                  <button 
                    onClick={() => setActiveTab('history')} 
                    className="text-xs text-red-500 hover:text-red-400 font-semibold"
                  >
                    មើលទាំងអស់ (View All)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {songs.slice(0, 4).map((song) => (
                    <div 
                      key={song.id} 
                      className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 hover:border-[#EF4444]/30 transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer group"
                      onClick={() => {
                        setCurrentSong(song);
                        setActiveTab('lyrics');
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.2 rounded font-mono uppercase tracking-wider">
                              {song.mode === 'khmer' ? 'Khmer' : song.mode === 'english' ? 'English' : 'Bilingual'}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">{song.genre}</span>
                          </div>
                          <h4 className="text-base font-bold text-gray-100 group-hover:text-[#EF4444] transition-colors mt-2">{song.title}</h4>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{song.artist || 'AI Lyricist'}</p>
                        </div>
                        <button 
                          id={`fav-btn-dashboard-${song.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(song.id);
                          }}
                          className={`p-2 rounded-xl transition-colors ${song.isFavorite ? 'text-amber-500 bg-amber-500/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                          <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 border-t border-[#262121]/40 pt-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(song.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-[#EF4444] font-semibold group-hover:underline">
                          បើកស្ទូឌីយ៉ូ (Open Studio) &rarr;
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {songs.length === 0 && (
                    <div className="col-span-2 text-center py-12 bg-[#0F0E0E] rounded-2xl border border-[#262121]/30">
                      <Music className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">មិនទាន់មានបទចម្រៀងនៅឡើយទេ។ សូមចុច "តែងនិពន្ធបទថ្មី" ដើម្បីចាប់ផ្តើម!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* TAB: LYRICS GENERATOR & ACTIVE WRITING STUDIO */}
          {activeTab === 'lyrics' && (
            <div className="space-y-6 animate-fade-in">
              
              {currentSong ? (
                <>
                  {/* Top Work Title Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0E0E]/80 backdrop-blur-md p-5 rounded-2xl border border-[#262121]/40">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/10 flex-shrink-0 animate-pulse">
                        ♫
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-bold font-mono bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 px-2 py-0.5 rounded uppercase tracking-wider">
                            {currentSong.mode.toUpperCase()} MODE
                          </span>
                          <span className="text-xs text-gray-400 font-mono">{currentSong.genre}</span>
                          <span className="text-xs text-gray-500 font-mono">• {currentSong.tempo}</span>
                        </div>
                        <h2 id="studio-song-title" className="text-xl md:text-2xl font-bold text-white tracking-tight mt-1 truncate">{currentSong.title}</h2>
                        <p id="studio-song-artist" className="text-xs text-gray-400 font-mono">{currentSong.artist || 'AI Lyricist'}</p>
                      </div>
                    </div>

                    {/* Action buttons on header */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <button 
                        id="studio-fav-btn"
                        onClick={() => toggleFavorite(currentSong.id)}
                        className={`p-2.5 rounded-xl border border-[#262121] transition-all hover:bg-white/5 ${currentSong.isFavorite ? 'text-amber-500 border-amber-500/30 bg-amber-500/5' : 'text-gray-400'}`}
                        title="Favorite"
                      >
                        <Heart className={`w-5 h-5 ${currentSong.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        id="studio-delete-btn"
                        onClick={(e) => handleDeleteSong(currentSong.id, e)}
                        className="p-2.5 rounded-xl border border-[#262121] text-gray-400 hover:text-red-500 hover:bg-red-500/5 transition-all"
                        title="Delete Song"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        id="studio-edit-btn"
                        onClick={handleOpenEdit}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1C1A1A] text-gray-200 border border-[#262121] hover:text-white hover:bg-[#262121] transition-all text-sm font-semibold"
                      >
                        <Edit3 className="w-4 h-4 text-amber-500" />
                        <span>កែសម្រួល (Edit)</span>
                      </button>
                    </div>
                  </div>

                  {/* Language Selector Top Panel precisely like visual screenshot */}
                  <div className="grid grid-cols-3 gap-2 bg-[#0F0E0E] p-1.5 rounded-2xl border border-[#262121]/30">
                    <button
                      id="mode-khmer-btn"
                      onClick={() => {
                        const updated = { ...currentSong, mode: 'khmer' as const };
                        setCurrentSong(updated);
                        const updatedList = songs.map(s => s.id === currentSong.id ? updated : s);
                        saveSongsToStorage(updatedList);
                      }}
                      className={`py-3.5 rounded-xl text-xs font-semibold tracking-wider font-display flex flex-col items-center justify-center gap-1 transition-all duration-300
                        ${currentSong.mode === 'khmer' 
                          ? 'bg-gradient-to-r from-red-600/90 to-red-500/90 text-white shadow-lg shadow-red-600/20 glow-accent' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <span className="text-[13px] md:text-sm">KHMER</span>
                      <span className="text-[9px] font-mono opacity-85 uppercase">Khmer Mode</span>
                    </button>
                    
                    <button
                      id="mode-english-btn"
                      onClick={() => {
                        const updated = { ...currentSong, mode: 'english' as const };
                        setCurrentSong(updated);
                        const updatedList = songs.map(s => s.id === currentSong.id ? updated : s);
                        saveSongsToStorage(updatedList);
                      }}
                      className={`py-3.5 rounded-xl text-xs font-semibold tracking-wider font-display flex flex-col items-center justify-center gap-1 transition-all duration-300
                        ${currentSong.mode === 'english' 
                          ? 'bg-gradient-to-r from-sky-600 to-indigo-500 text-white shadow-lg shadow-sky-600/20' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <span className="text-[13px] md:text-sm">ENGLISH</span>
                      <span className="text-[9px] font-mono opacity-85 uppercase">English Mode</span>
                    </button>

                    <button
                      id="mode-km-btn"
                      onClick={() => {
                        const updated = { ...currentSong, mode: 'km' as const };
                        setCurrentSong(updated);
                        const updatedList = songs.map(s => s.id === currentSong.id ? updated : s);
                        saveSongsToStorage(updatedList);
                      }}
                      className={`py-3.5 rounded-xl text-xs font-semibold tracking-wider font-display flex flex-col items-center justify-center gap-1 transition-all duration-300
                        ${currentSong.mode === 'km' 
                          ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-lg shadow-amber-600/20' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <span className="text-[13px] md:text-sm">KM</span>
                      <span className="text-[9px] font-mono opacity-85 uppercase">Bilingual Mode</span>
                    </button>
                  </div>

                  {/* Main Work split section: Lyrics on left, Actions on right */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    
                    {/* Lyric Sheet Display Container (Take up 3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                      <div className="relative rounded-2xl bg-[#0B0A0A] border border-[#262121]/40 overflow-hidden shadow-2xl">
                        
                        {/* Decorative vinyl/tape recorder widget */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-40 font-mono text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                          <span>REC. CONTEXT</span>
                        </div>

                        {/* Lyrics Sheet Area */}
                        <div id="lyrics-display-area" className="p-6 md:p-10 whitespace-pre-line text-sm md:text-[16px] leading-relaxed text-gray-100 max-h-[500px] overflow-y-auto selection:bg-red-500/30">
                          {/* Parse lyrics and colorize section headers like [Chorus] or (Outro) */}
                          {currentSong.lyrics.split('\n').map((line, index) => {
                            if (line.startsWith('[') && line.endsWith(']')) {
                              return (
                                <div key={index} className="text-[#EF4444] font-bold font-display tracking-wide mt-6 mb-2 text-sm md:text-base">
                                  {line}
                                </div>
                              );
                            } else if (line.startsWith('(') && line.endsWith(')')) {
                              return (
                                <div key={index} className="text-amber-500 font-medium italic text-xs md:text-sm my-2 opacity-90">
                                  {line}
                                </div>
                              );
                            }
                            return <div key={index} className="min-h-[1.5rem] tracking-wide text-gray-300 font-sans">{line}</div>;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Studio Actions Panel (Takes 1 col) exactly matching the user screen mockup */}
                    <div className="space-y-4 lg:col-span-1">
                      <div className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold font-display text-gray-400 tracking-wider uppercase">STUDIO ACTIONS</h4>
                          <p className="text-[10px] text-gray-500">Export and refine metadata</p>
                        </div>

                        <div className="space-y-2.5">
                          {/* Bundle Download Button */}
                          <button
                            id="download-bundle-btn"
                            onClick={handleDownloadBundle}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold hover:from-red-600 hover:to-orange-600 transition-all active:scale-95 glow-accent"
                          >
                            <Download className="w-4 h-4" />
                            <span>ទាញយក BUNDLE (.TXT)</span>
                          </button>

                          {/* Copy Lyrics Button */}
                          <button
                            id="copy-lyrics-btn"
                            onClick={handleCopyLyrics}
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#1C1A1A] border border-[#262121] text-gray-200 text-xs font-bold hover:bg-[#262121] hover:text-white transition-all active:scale-95"
                          >
                            {copiedLyrics ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-emerald-500">ចម្លងជោគជ័យ!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-orange-500" />
                                <span>ចម្លងទំនុកច្រៀង</span>
                              </>
                            )}
                          </button>

                          {/* Refine / Edit Details Button */}
                          <button
                            id="edit-details-btn"
                            onClick={handleOpenEdit}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#121111] border border-[#262121]/60 text-gray-400 text-xs font-semibold hover:border-gray-500 hover:text-gray-100 transition-all active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Song Details</span>
                          </button>
                        </div>
                      </div>

                      {/* Info Tips widget */}
                      <div className="p-4 rounded-xl bg-[#0F0E0E]/50 border border-[#262121]/30 text-[11px] text-gray-500 space-y-1">
                        <p className="font-semibold text-gray-400">គន្លឹះស្ទូឌីយ៉ូ (Studio Tip):</p>
                        <p>ភាសាខ្មែរជួយរក្សាទំនុកច្រៀងតាមបែបចុងចួនបុរាណ ចំណែកឯភាសា Bilingual (KM) គឺល្បាយទំនើបបែប Pop, Hip-Hop និង R&B។</p>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Multi-Panel Area: Producer Notes, Visual Prompt, Storyboard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    
                    {/* Card 1: PRODUCER NOTES */}
                    <div className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#262121]/40 pb-3">
                          <h4 className="text-sm font-bold font-display text-gray-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            គំនិតអ្នកផលិត / PRODUCER NOTES
                          </h4>
                          <span className="text-[10px] font-mono text-gray-500 uppercase">01 ស្គាល់ចង្វាក់</span>
                        </div>
                        <div id="producer-notes-text" className="text-xs md:text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                          {currentSong.producerNotes}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: VISUAL AI PROMPT */}
                    <div className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-[#262121]/40 pb-3">
                          <h4 className="text-sm font-bold font-display text-gray-100 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            រូបភាព AI PROMPT / VISUAL AI PROMPT
                          </h4>
                          <span className="text-[10px] font-mono text-gray-500 uppercase">02 Cover Art</span>
                        </div>
                        <div id="visual-prompt-text" className="text-xs font-mono text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl whitespace-pre-wrap leading-relaxed select-all">
                          {currentSong.visualAiPrompt}
                        </div>
                        <p className="text-[10px] text-gray-500">
                          ចម្លង Prompt ខាងលើនេះ ទៅប្រើប្រាស់ក្នុងកម្មវិធីបង្កើតរូបភាព AI ដូចជា Gemini, Midjourney ឬ DALL-E ដើម្បីបង្កើតក្របអាល់ប៊ុមដ៏ស្អាត។
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Card 3: STORYBOARD (Full width below) */}
                  <div className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40">
                    <div className="flex items-center justify-between border-b border-[#262121]/40 pb-3 mb-4">
                      <h4 className="text-sm font-bold font-display text-gray-100 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                        ក្តាររៀបរាប់ដំណើររឿង / MY STORYBOARD
                      </h4>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">03 MV Conception</span>
                    </div>
                    
                    <div id="storyboard-display-text" className="text-xs md:text-sm text-gray-400 whitespace-pre-line leading-relaxed">
                      {currentSong.storyboard}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-[#0F0E0E] rounded-2xl border border-[#262121]/40 max-w-lg mx-auto">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-gray-100 font-display">មិនទាន់មានបទចម្រៀងសកម្មឡើយ</h3>
                  <p className="text-gray-400 text-sm mt-1.5 max-w-sm mx-auto">សូមបង្កើតបទចម្រៀងថ្មីដោយប្រើប្រាស់ AI ឬជ្រើសរើសពីផ្ទាំងប្រវត្តិបទចម្រៀងខាងឆ្វេង។</p>
                  <button
                    id="lyrics-empty-generate-btn"
                    onClick={() => setIsGenerateModalOpen(true)}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" /> តែងនិពន្ធឥឡូវនេះ (Generate Now)
                  </button>
                </div>
              )}

            </div>
          )}


          {/* TAB: STORYBOARD (FOCUSED DETAIL) */}
          {activeTab === 'storyboard' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-display text-white">ក្តាររៀបរាប់ដំណើររឿងវីដេអូ (Storyboard Viewer)</h2>
                <p className="text-gray-400 text-sm">បំប្លែងខ្លឹមសារទំនុកច្រៀងចម្រៀង ទៅជាប្លង់វីដេអូចលនា និងការថតរូបយ៉ាងរស់រវើក។</p>
              </div>

              {currentSong ? (
                <div className="space-y-6">
                  {/* Song Anchor banner */}
                  <div className="p-4 rounded-xl bg-[#0F0E0E] border border-[#262121]/40 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-mono text-gray-500 uppercase">Active MV Blueprint</p>
                      <h4 className="text-sm font-bold text-gray-200">{currentSong.title}</h4>
                    </div>
                    <span className="text-xs bg-red-500/10 text-red-400 px-2.5 py-1 rounded font-mono">4 Scenes Generated</span>
                  </div>

                  {/* Parse storyboard text into individual cards/scenes visually */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentSong.storyboard.split(/Scene \d+:|Scene \d+/g).filter(Boolean).map((sceneText, index) => {
                      // Extrapolate a brief title or description for the visual card
                      const cleanText = sceneText.trim();
                      const lines = cleanText.split('\n');
                      const firstLine = lines[0]?.replace(/^[\s-*]+|[\s-*]+$/g, '') || `Scene ${index + 1}`;
                      const bodyContent = lines.slice(1).join('\n');

                      return (
                        <div key={index} className="rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 overflow-hidden group hover:border-[#EF4444]/30 transition-all duration-300">
                          {/* Image Placeholder with cinematic color overlay */}
                          <div className="h-44 bg-gradient-to-br from-[#1F1414] via-[#0E0B0B] to-[#0A0909] relative flex items-center justify-center border-b border-[#262121]/40">
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors"></div>
                            <Tv className="w-10 h-10 text-red-500/30 group-hover:text-red-500/50 transition-colors animate-pulse" />
                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 rounded-lg text-[10px] font-mono text-red-500 font-bold">
                              SCENE {index + 1}
                            </div>
                          </div>

                          <div className="p-5 space-y-3">
                            <h5 className="text-sm font-bold text-gray-200">{firstLine}</h5>
                            <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{bodyContent || cleanText}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-[#0F0E0E] rounded-2xl border border-[#262121]/40 max-w-lg mx-auto">
                  <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-100 font-display">មិនទាន់មានគម្រោងសកម្មឡើយ</h3>
                  <p className="text-gray-400 text-sm mt-1.5">សូមបង្កើតបទចម្រៀងជាមុនសិន ដើម្បីស្វែងយល់ពីក្តាររៀបរាប់រឿងវីដេអូ។</p>
                </div>
              )}
            </div>
          )}


          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold font-display text-white">បណ្ណាល័យប្រវត្តិបទចម្រៀង (Songwriting History)</h2>
                  <p className="text-gray-400 text-sm">មើល និងគ្រប់គ្រងរាល់ស្នាដៃបទចម្រៀង និងលទ្ធផលតាក់តែងរបស់អ្នកកន្លងមក។</p>
                </div>

                {/* Search input */}
                <div className="relative max-w-md w-full">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកចំណងជើង ចង្វាក់ ទំនុកច្រៀង..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0F0E0E] text-xs text-gray-200 pl-10 pr-4 py-3 rounded-xl border border-[#262121]/80 focus:outline-none focus:border-red-500 transition-colors placeholder-gray-600"
                  />
                </div>
              </div>

              {/* Grid representation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredSongs.map((song) => (
                  <div 
                    key={song.id} 
                    className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 hover:border-red-500/20 hover:shadow-xl transition-all duration-300 flex flex-col justify-between gap-5 group cursor-pointer"
                    onClick={() => {
                      setCurrentSong(song);
                      setActiveTab('lyrics');
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                          {song.mode.toUpperCase()} MODE
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            id={`fav-btn-history-${song.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(song.id);
                            }}
                            className={`p-1.5 rounded hover:bg-white/5 transition-colors ${song.isFavorite ? 'text-amber-500' : 'text-gray-500 hover:text-white'}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${song.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          <button 
                            id={`del-btn-history-${song.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSong(song.id, e);
                            }}
                            className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-gray-100 group-hover:text-red-500 transition-colors">{song.title}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{song.artist || 'AI Lyricist'}</p>
                      </div>

                      {/* Snip of lyrics */}
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                        {song.lyrics.replace(/\[.*?\]|\(.*?\)/g, '').trim()}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 border-t border-[#262121]/30 pt-3.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(song.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-red-500 font-semibold group-hover:underline">បើកក្នុងស្ទូឌីយ៉ូ &rarr;</span>
                    </div>
                  </div>
                ))}

                {filteredSongs.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-[#0F0E0E] rounded-2xl border border-[#262121]/30">
                    <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">រកមិនឃើញបទចម្រៀងត្រូវគ្នាឡើយ។</p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* TAB: SONGWRITING ASSISTANT / EXPLAINER */}
          {activeTab === 'assistant' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-display text-white">មគ្គុទ្ទេសក៍ និងរបៀបតែងនិពន្ធ (AI Masterclass Guidelines)</h2>
                <p className="text-gray-400 text-sm">រៀនពីរបៀបបង្កើតបទចម្រៀងកម្រិតអាជីពជាមួយ AI និងឧបករណ៍គរុកោសល្យផ្សេងៗ។</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'វគ្គនិពន្ធចុងចួនខ្មែរ (Khmer Rhyme)', desc: 'ការតែងនិពន្ធទំនុកច្រៀងខ្មែរ គឺពឹងផ្អែកលើចុងចួន (Rhyme Scheme) ដូចជា ព្យាង្គចុងក្រោយនៃឃ្លាទី១ ត្រូវជួននឹងព្យាង្គទី៣ ឬទី៥ នៃឃ្លាទី២។ AI ត្រូវបានហ្វឹកហាត់ឲ្យយល់ពីទំរង់ចុងចួនមនោសញ្ចេតនានេះយ៉ាងល្អ។', icon: Music },
                  { title: 'ស្គាល់រចនាបថបទចម្រៀង (Song Genres)', desc: 'ការជ្រើសរើសចង្វាក់មនោសញ្ចេតនា (Sentimental) គឺល្អសម្រាប់ការច្រៀងបែបយឺតៗ លាយសម្លេងខ្លុយ។ ចំណែកឯចង្វាក់សម័យ Pop/Hip-hop គឺត្រូវនឹងភាសា Bilingual (KM) ដើម្បីបង្កើតភាពរស់រវើក។', icon: Sparkles },
                  { title: 'ផលិតរឿង MV លំដាប់កុន (Cinematic Storyboard)', desc: 'ប្រព័ន្ធនឹងបង្កើតក្តាររៀបរាប់ដំណើររឿងវីដេអូ MV ចំនួន ៤ ប្លង់ chronological សម្រាប់ធ្វើជាគ្រោងការណ៍ថតរូប និងថតវីដេអូកម្រិតហូលីវូដ។', icon: Film }
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-100">{item.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Custom Help Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1A1111] to-[#0A0909] border border-[#EF4444]/10 space-y-4">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-red-500" />
                  របៀបទទួលបានលទ្ធផលល្អបំផុតក្នុងការតាក់តែង (Best Prompts Guide)
                </h4>
                <ul className="space-y-3 text-xs text-gray-400 leading-relaxed">
                  <li>
                    <strong className="text-gray-200">១. ផ្តល់ព័ត៌មានលម្អិត៖</strong> ជំនួសឲ្យការសរសេរ "បទចម្រៀងស្នេហា" គួរតែសរសេរ "បទចម្រៀងមនោសញ្ចេតនាជ្រាលជ្រៅនិយាយពីយុវជនម្នាក់អង្គុយចាំគូស្នេហ៍របស់គាត់ក្រោមមេឃភ្លៀងធ្លាក់នៅមាត់ទន្លេភ្នំពេញ"។
                  </li>
                  <li>
                    <strong className="text-gray-200">២. កំណត់ឧបករណ៍តន្ត្រី៖</strong> អ្នកអាចបញ្ចូលលក្ខខណ្ឌដូចជា "ចង់បានការលាយបញ្ចូលគ្នារវាងសម្លេងរនាតឯក និងចង្វាក់បាសទំនើប"។
                  </li>
                  <li>
                    <strong className="text-gray-200">៣. ប្រើប្រាស់គំនិតរូបភាព AI៖</strong> យក Visual AI Prompt ដែលកម្មវិធីបង្កើតឲ្យ ទៅប្រើប្រាស់ក្នុង AI image generators ដើម្បីបានក្របអាល់ប៊ុមស្អាតឥតខ្ចោះ។
                  </li>
                </ul>
              </div>
            </div>
          )}


          {/* TAB: ALBUM COVER */}
          {activeTab === 'cover' && (
            <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-display text-white">ម៉ាស៊ីនបង្កើតក្របអាល់ប៊ុម (AI Album Cover Studio)</h2>
                <p className="text-gray-400 text-sm">បង្កើតក្របអាល់ប៊ុមតន្ត្រីដ៏ទាក់ទាញ ដោយផ្អែកលើបរិយាកាសចម្រៀងរបស់អ្នក។</p>
              </div>

              {currentSong ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Generated Cover Placeholder with beautiful stylistic CSS overlay */}
                  <div className="aspect-square w-full max-w-sm mx-auto rounded-3xl bg-gradient-to-tr from-[#1E1111] via-[#0D0B0B] to-[#121111] border border-red-500/20 relative overflow-hidden group shadow-2xl">
                    
                    {/* Glowing circular backdrop */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-red-600/10 via-orange-500/5 to-amber-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>
                    
                    {/* Abstract design elements matching the music vibes */}
                    <div className="absolute top-8 left-8 w-16 h-16 border-t border-l border-red-500/30 rounded-tl-xl"></div>
                    <div className="absolute bottom-8 right-8 w-16 h-16 border-b border-r border-red-500/30 rounded-br-xl"></div>

                    {/* Vinyl groove record visualization */}
                    <div className="absolute top-12 right-12 w-32 h-32 rounded-full border border-gray-800/60 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border border-gray-800/40 flex items-center justify-center animate-spin" style={{ animationDuration: '12s' }}>
                        <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        </div>
                      </div>
                    </div>

                    {/* Text overlays */}
                    <div className="absolute bottom-10 left-8 right-8 space-y-1 z-10">
                      <p className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">{currentSong.genre}</p>
                      <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">{currentSong.title}</h3>
                      <p className="text-xs text-gray-400 font-mono">{currentSong.artist || 'AI MASTERCLASS'}</p>
                    </div>

                    <div className="absolute top-6 left-8 px-2 py-0.5 bg-red-500 text-white rounded font-mono text-[9px] font-bold">
                      PRO MIX
                    </div>
                  </div>

                  {/* Settings / Prompt copy */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-[#0F0E0E] border border-[#262121]/40 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold font-display text-gray-400 tracking-wider uppercase">VISUAL ARTWORK PROMPT</h4>
                        <p className="text-[11px] text-gray-500">Use this detailed prompt to generate the real cover</p>
                      </div>

                      <div className="p-4 rounded-xl bg-black/60 border border-amber-500/10 text-xs font-mono text-amber-500 leading-relaxed max-h-40 overflow-y-auto select-all">
                        {currentSong.visualAiPrompt}
                      </div>

                      <button
                        id="copy-cover-prompt-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(currentSong.visualAiPrompt);
                          alert('ចម្លង Prompt រូបភាពរួចរាល់! Copy successful.');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1C1A1A] border border-[#262121] text-xs font-semibold text-gray-200 hover:text-white hover:bg-[#262121] transition-all"
                      >
                        <Copy className="w-4 h-4 text-amber-500" />
                        <span>ចម្លង PROMPT រូបភាព</span>
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 leading-relaxed">
                      <p><strong>ព័ត៌មានបន្ថែម៖</strong> ក្របអាល់ប៊ុមតំណាងខាងលើត្រូវបានច្នៃឡើងដោយស្វ័យប្រវត្តិតាមរយៈ CSS styling ។ ដើម្បីទទួលបានរូបថតពិតៗប្រណិតៗ សូមចម្លង Prompt ខាងលើទៅកាន់ម៉ាស៊ីនបង្កើតរូបភាព AI ដូចជា Gemini ឬ Midjourney។</p>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 bg-[#0F0E0E] rounded-2xl border border-[#262121]/40 max-w-lg mx-auto">
                  <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-100 font-display">មិនទាន់មានបទចម្រៀងសកម្មឡើយ</h3>
                  <p className="text-gray-400 text-sm mt-1.5">សូមបង្កើតបទចម្រៀងជាមុនសិន ដើម្បីមើលគំនិតបង្កើតក្របអាល់ប៊ុម។</p>
                </div>
              )}
            </div>
          )}


          {/* TAB: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in text-gray-300">
              <div className="text-center space-y-3 pb-6 border-b border-[#262121]/30">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-red-500/20">
                  ♫
                </div>
                <h2 className="text-2xl font-bold font-display text-white mt-4">Lyric Studio Pro</h2>
                <p className="text-sm font-mono text-red-500">KHMER AI SONGWRITING MASTERCLASS</p>
                <p className="text-xs text-gray-500">Version 1.2.0 • Powered by Gemini 3.5 Flash</p>
              </div>

              <div className="space-y-4 text-xs md:text-sm leading-relaxed">
                <h3 className="text-base font-bold text-white font-display">អំពីប្រព័ន្ធ និងបេសកកម្ម</h3>
                <p>
                  <strong>Lyric Studio Pro</strong> គឺជាកម្មវិធីជំនួយការតាក់តែងទំនុកច្រៀងចម្រៀងខ្មែរទំនើប ដែលបំពាក់នូវបញ្ញាសិប្បនិម្មិត (AI) ដើម្បីសម្រួលដល់ការងាររបស់សិល្បករ អ្នកនិពន្ធ អ្នកផលិតតន្ត្រី និងអ្នកដឹកនាំវីដេអូចម្រៀង (MV Director)។
                </p>
                <p>
                  កម្មវិធីនេះជួយសន្សំពេលវេលាដល់ទៅ ៨០% ក្នុងការរៀបចំគ្រោងឆ្អឹងបទចម្រៀង ទំនុកច្រៀងដែលត្រូវនឹងច្បាប់ចុងចួនខ្មែរ គន្លឹះឧបករណ៍ភ្លេងបែបបុរាណលាយសម័យ ព្រមទាំងការកសាង Storyboard វីដេអូចម្រៀងភ្លាមៗ។
                </p>

                <div className="p-4 rounded-xl bg-[#0F0E0E] border border-[#262121]/40 space-y-2 mt-4">
                  <p className="font-semibold text-white text-xs">សហការអភិវឌ្ឍន៍ដោយ៖</p>
                  <p className="text-xs text-amber-500 font-mono">StartupKH Group • KHMER AI COLLAB 2026</p>
                  <p className="text-xs text-gray-500">បច្ចេកវិទ្យាបង្កើតឡើងដើម្បីលើកស្ទួយវិស័យសិល្បៈវប្បធម៌ខ្មែរ និងតន្ត្រីទាន់សម័យ។</p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================== */}
      {/* 4. MODALS & FORMS SECTION                                  */}
      {/* ========================================================== */}

      {/* GENERATE SONG MODAL (Gemini Integration) */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div 
            id="generate-modal-card"
            className="w-full max-w-xl bg-[#0F0E0E] border border-red-500/20 rounded-2xl overflow-hidden shadow-2xl relative"
          >
            {/* Header */}
            <div className="p-5 border-b border-[#262121]/40 flex items-center justify-between bg-[#070606]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
                <h3 className="text-base font-bold font-display text-white">តាក់តែងបទចម្រៀងថ្មីដោយ AI (Create Song with AI)</h3>
              </div>
              <button 
                id="close-generate-modal-btn"
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleGenerate} className="p-6 space-y-5">
              
              {/* Prompt Instruction input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>សូមបញ្ចូលព័ត៌មានលម្អិត ឬប្រធានបទបទចម្រៀង * (Prompt details)</span>
                  <span className="text-[10px] text-gray-500">គាំទ្រភាសាខ្មែរ និងអង់គ្លេស</span>
                </label>
                <textarea
                  id="generate-prompt-input"
                  required
                  rows={3}
                  placeholder="ឧទាហរណ៍៖ បទចម្រៀងមនោសញ្ចេតនាជ្រាលជ្រៅ និយាយពីការនឹកគូស្នេហ៍ចាស់ក្រោមដំណក់ទឹកភ្លៀងក្នុងរាត្រីឯកោនាទីក្រុងភ្នំពេញ អមដោយសម្លេងខ្លុយ និងហ្គីតាឈើ..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#171515] text-xs text-gray-200 p-3.5 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors placeholder-gray-600 resize-none"
                />
              </div>

              {/* Grid configs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Genre Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">ជ្រើសរើសចង្វាក់ (Genre)</label>
                  <select
                    id="generate-genre-select"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500"
                  >
                    <option value="មនោសញ្ចេតនា (Sentimental)">មនោសញ្ចេតនា (Sentimental)</option>
                    <option value="បែបសម័យ Pop (Modern Pop)">បែបសម័យ Pop (Modern Pop)</option>
                    <option value="ចង្វាក់ញាប់ Hip Hop / R&B">ចង្វាក់ញាប់ Hip Hop / R&B</option>
                    <option value="បុរាណច្នៃប្រឌិត (Khmer Traditional Fusion)">បុរាណច្នៃប្រឌិត (Traditional Fusion)</option>
                  </select>
                </div>

                {/* Tempo Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">កម្រិតល្បឿន / ល្បឿនភ្លេង (Tempo)</label>
                  <select
                    id="generate-tempo-select"
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500"
                  >
                    <option value="យឺត (Slow - 72 BPM)">យឺត (Slow - 72 BPM)</option>
                    <option value="មធ្យម (Medium - 92 BPM)">មធ្យម (Medium - 92 BPM)</option>
                    <option value="ញាប់ (Fast - 128 BPM)">ញាប់ (Fast - 128 BPM)</option>
                  </select>
                </div>

              </div>

              {/* Language Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">ទំរង់ភាសា (Language Mode)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'khmer', name: 'ខ្មែរសុទ្ធ (KHMER)' },
                    { id: 'english', name: 'ENGLISH ONLY' },
                    { id: 'km', name: 'ខ្មែរ-អង់គ្លេស (KM)' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      id={`form-mode-${l.id}`}
                      type="button"
                      onClick={() => setMode(l.id as any)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors
                        ${mode === l.id 
                          ? 'bg-red-500/10 border-red-500 text-red-400' 
                          : 'bg-[#171515] border-[#262121] text-gray-400 hover:text-white'}`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Advanced Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#262121]/40 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">ចំណងជើងចង់បាន (Suggested Title - Optional)</label>
                  <input
                    id="generate-title-input"
                    type="text"
                    placeholder="ឧ. សំឡេងកំដរចិត្ត"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">អ្នកចម្រៀងចង់ឱ្យរំលឹក (Artist Style - Optional)</label>
                  <input
                    id="generate-artist-input"
                    type="text"
                    placeholder="ឧ. ស៊ីន ស៊ីសាមុត ឬ បែបសម័យថ្មី"
                    value={customArtist}
                    onChange={(e) => setCustomArtist(e.target.value)}
                    className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Error indicator */}
              {generationError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{generationError}</p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-[#262121]/40 pt-4">
                <button
                  id="cancel-generate-btn"
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                  disabled={isGenerating}
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  id="submit-generate-btn"
                  type="submit"
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold shadow-lg shadow-red-500/10 disabled:opacity-50"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>កំពុងតែងនិពន្ធជាមួយ AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>ចាប់ផ្តើមតែងនិពន្ធ (Generate)</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* EDIT MANUAL MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0F0E0E] border border-[#262121] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#262121]/40 flex items-center justify-between bg-[#070606]">
              <h3 className="text-base font-bold text-white">កែសម្រួលព័ត៌មានលម្អិតបទចម្រៀង (Edit Song Details)</h3>
              <button 
                id="close-edit-modal-btn"
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">ចំណងជើង (Title)</label>
                <input
                  id="edit-title-input"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">ទំនុកច្រៀងចម្រៀង (Lyrics)</label>
                <textarea
                  id="edit-lyrics-input"
                  required
                  rows={8}
                  value={editLyrics}
                  onChange={(e) => setEditLyrics(e.target.value)}
                  className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">គំនិតណែនាំរបស់អ្នកផលិត (Producer Notes)</label>
                  <textarea
                    id="edit-notes-input"
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">រូបភាព AI Prompt (Visual AI Prompt)</label>
                  <textarea
                    id="edit-prompt-input"
                    rows={4}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">ក្តាររៀបរាប់ដំណើររឿងវីដេអូ (Storyboard)</label>
                <textarea
                  id="edit-storyboard-input"
                  rows={4}
                  value={editStoryboard}
                  onChange={(e) => setEditStoryboard(e.target.value)}
                  className="w-full bg-[#171515] text-xs text-gray-200 p-3 rounded-xl border border-[#262121] focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#262121]/40 pt-4">
                <button
                  id="cancel-edit-btn"
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
                >
                  បោះបង់ (Cancel)
                </button>
                <button
                  id="save-edit-btn"
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold"
                >
                  រក្សាទុកការផ្លាស់ប្តូរ (Save Changes)
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
