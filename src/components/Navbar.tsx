import React, { useRef, useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
  Building2,
  SlidersHorizontal,
  FileText,
  Table,
} from 'lucide-react';
import { CompanyProfile } from '../types/feasibility';

export type ActiveTab =
  | 'assumptions'
  | 'statements'
  | 'notes'
  | 'ratios';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenCompanyProfile: () => void;
  onPrint?: () => void;
  projectName?: string;
  companyProfile?: CompanyProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCompanyProfile,
  onPrint,
  projectName,
  companyProfile,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Exact 4 tabs in user-requested order:
  // 1. Assumptions & Costing
  // 2. Financial Statements
  // 3. Notes to Statements
  // 4. Financial Ratios
  const navTabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'assumptions',
      label: 'Assumptions & Costing',
      icon: <FileSpreadsheet className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'statements',
      label: 'Financial Statements',
      icon: <Table className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'notes',
      label: 'Notes to Statements',
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'ratios',
      label: 'Financial Ratios',
      icon: <SlidersHorizontal className="w-4 h-4 shrink-0" />,
    },
  ];

  // Check scroll position to toggle scroll arrow indicators
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Smooth scroll ribbon left or right
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollOffset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
      setTimeout(checkScroll, 250);
    }
  };

  const handleTabClick = (tabId: ActiveTab, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectTab(tabId);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    setTimeout(checkScroll, 200);
  };

  const hasConfiguredProfile =
    companyProfile &&
    companyProfile.entityName &&
    companyProfile.entityName.trim().length > 0;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Ribbon Navigation with Scrolling Function (Left & Right Controls + Scroll Container) */}
          <div className="flex items-center min-w-0 flex-1 relative">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              className={`p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs shrink-0 transition-opacity mr-1.5 ${
                canScrollLeft
                  ? 'hover:bg-slate-100 text-slate-800 opacity-100 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed text-slate-400'
              }`}
              title="Scroll ribbon left"
              aria-label="Scroll ribbon left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Ribbon Tabs Track */}
            <nav
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex items-center gap-1.5 overflow-x-auto scroll-smooth py-1 px-0.5 no-scrollbar scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              aria-label="Ribbon navigation"
            >
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={(e) => handleTabClick(tab.id, e)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap shrink-0 flex items-center gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              className={`p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-2xs shrink-0 transition-opacity ml-1.5 ${
                canScrollRight
                  ? 'hover:bg-slate-100 text-slate-800 opacity-100 cursor-pointer'
                  : 'opacity-30 cursor-not-allowed text-slate-400'
              }`}
              title="Scroll ribbon right"
              aria-label="Scroll ribbon right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action Zone: Company Profile & Print */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Company Profile Button */}
            <button
              onClick={onOpenCompanyProfile}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                hasConfiguredProfile
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
              }`}
              title="Configure Entity Name, Legal Classification, Nature, Purpose and Capital"
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">
                {hasConfiguredProfile ? 'Company Profile' : '+ Add Company Profile'}
              </span>
              <span className="sm:hidden">Profile</span>
              {hasConfiguredProfile && (
                <span className="hidden md:inline px-1.5 py-0.5 bg-emerald-200 text-emerald-950 rounded text-[10px] font-mono">
                  {companyProfile.classification === 'Sole Proprietorship' ? 'Sole' : 'Partnership'}
                </span>
              )}
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={onPrint || (() => window.print())}
              className="p-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Print current statement or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
