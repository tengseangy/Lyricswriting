import React from 'react';
import { 
  LayoutDashboard, 
  Music, 
  Sparkles, 
  Film, 
  History, 
  Image, 
  Info, 
  Crown, 
  Check, 
  X,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onGenerateClick: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen,
  onGenerateClick 
}: SidebarProps) {
  
  const menuItems = [
    { id: 'dashboard', labelKh: 'តាប្លូ', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'lyrics', labelKh: 'ទំនុកច្រៀង', labelEn: 'Lyrics Generator', icon: Music },
    { id: 'assistant', labelKh: 'ជំនួយក្នុងការតាក់តែង', labelEn: 'Songwriting Assistant', icon: Sparkles },
    { id: 'storyboard', labelKh: 'ក្តាររៀបរាប់ដំណើររឿង', labelEn: 'My Storyboard', icon: Film },
    { id: 'history', labelKh: 'ប្រវត្តិ', labelEn: 'History', icon: History },
    { id: 'cover', labelKh: 'បង្កើត COVER', labelEn: 'Album Cover', icon: Image },
    { id: 'about', labelKh: 'អំពីកម្មវិធី', labelEn: 'About', icon: Info },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="sidebar"
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 flex flex-col justify-between bg-[#0F0E0E] border-r border-[#262121]/40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-[#262121]/40">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EF4444] via-[#F97316] to-[#F59E0B] glow-accent">
              <Music className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-1.5">
                Lyric Studio
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-normal">PRO</span>
              </h1>
              <p className="text-[11px] font-mono text-gray-400">v1.2.0</p>
            </div>
          </div>
          
          <button 
            id="close-sidebar-btn"
            className="p-1 text-gray-400 hover:text-white md:hidden"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          
          {/* VIP User Profile Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#1E1B1B] to-[#121111] border border-amber-500/20 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-[#F59E0B] to-[#F97316] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  T
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-0.5 border border-[#121111]">
                  <Crown className="w-3 h-3 text-[#121111]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-semibold text-gray-100 truncate">Premium User</h3>
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-bold uppercase tracking-wider">VIP</span>
                </div>
                <p className="text-[11px] font-mono text-amber-500/90 flex items-center gap-1 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Active • Lifetime
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false); // Close on mobile
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-red-600/90 to-orange-500/90 text-white font-semibold glow-accent' 
                      : 'text-gray-400 hover:text-gray-100 hover:bg-[#1C1A1A]'}`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-105 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-500'}`} />
                    <div className="text-left">
                      <p className="text-sm tracking-wide">{item.labelKh}</p>
                      <p className={`text-[10px] font-mono leading-none ${isActive ? 'text-white/70' : 'text-gray-500'}`}>{item.labelEn}</p>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                </button>
              );
            })}
          </nav>

          {/* Premium Checklist Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#1C1A1A] to-[#121111] border border-red-500/10 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-200 tracking-wider uppercase font-display flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-red-500" />
                Premium Features
              </h4>
              <p className="text-[10px] text-gray-500 mt-1">Unlock boundless AI creations</p>
            </div>
            
            <ul className="space-y-2 text-xs">
              {[
                { kh: 'គ្មានការផ្សាយពាណិជ្ជកម្ម', en: 'No Ads' },
                { kh: 'បង្កើតបទចម្រៀងមិនកំណត់', en: 'Unlimited Songs' },
                { kh: 'សរសេរទំនុកច្រៀង + គំនិតច្នៃប្រឌិត', en: 'Prompt + Lyrics' },
                { kh: 'បង្កើតចំណងជើងរងស្វ័យប្រវត្ត', en: 'Auto Subtitle' }
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2.5 text-gray-300">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-red-500" />
                  </div>
                  <div>
                    <p className="leading-tight">{feature.kh}</p>
                    <p className="text-[9px] text-gray-500 font-mono leading-none">{feature.en}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              id="sidebar-generate-now-btn"
              onClick={onGenerateClick}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-300 active:scale-95 shadow-md shadow-red-500/10"
            >
              បង្កើតបទចម្រៀងថ្មី (Generate Now)
            </button>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#262121]/40 bg-[#0C0B0B] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center font-bold text-xs text-[#0F0E0E]">
            S
          </div>
          <div className="flex-1 min-w-0">
            <h4 id="user-display-name" className="text-xs font-semibold text-gray-200 truncate">StartupKH Group</h4>
            <p className="text-[10px] font-mono text-gray-500">KHMER AI COLLAB</p>
          </div>
        </div>
      </aside>
    </>
  );
}
