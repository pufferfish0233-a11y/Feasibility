import React, { useState, useMemo } from 'react';
import { CLEAN_SLATE_MODEL } from './data/cleanSlate';
import { FeasibilityModelData, CompanyProfile } from './types/feasibility';
import { runFeasibilityProjections } from './utils/financialCalculations';
import { Navbar, ActiveTab } from './components/Navbar';
import { AssumptionsView } from './components/AssumptionsView';
import { StatementsView } from './components/StatementsView';
import { NotesView } from './components/NotesView';
import { RatiosView } from './components/RatiosView';
import { CompanyProfileModal } from './components/CompanyProfileModal';

export function App() {
  // Working feasibility model data state
  const [modelData, setModelData] = useState<FeasibilityModelData>(() => {
    return JSON.parse(JSON.stringify(CLEAN_SLATE_MODEL));
  });

  // Company Profile Modal open/close state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Active navigation tab - starts at 'assumptions' (Assumptions & Costing)
  const [activeTab, setActiveTab] = useState<ActiveTab>('assumptions');

  // Handle Company Profile Save from modal
  const handleSaveProfile = (profile: CompanyProfile, totalEquity: number) => {
    setModelData((prev) => {
      const updated: FeasibilityModelData = {
        ...prev,
        companyProfile: profile,
        general: {
          ...prev.general,
          projectName: profile.entityName ? `${profile.entityName} Feasibility Study` : prev.general.projectName,
          companyName: profile.entityName || prev.general.companyName,
          industry: profile.nature || prev.general.industry,
          projectDescription: profile.purpose || prev.general.projectDescription,
          preparedBy:
            profile.classification === 'Sole Proprietorship' && profile.soleProprietor?.ownerName
              ? profile.soleProprietor.ownerName
              : profile.classification === 'Partnership' && profile.partners && profile.partners.length > 0
              ? profile.partners[0].name || prev.general.preparedBy
              : prev.general.preparedBy,
        },
        financing: {
          ...prev.financing,
          initialEquity: totalEquity > 0 ? totalEquity : prev.financing.initialEquity,
        },
      };
      return updated;
    });
    setIsProfileModalOpen(false);
  };

  // Run dynamic calculation engine whenever modelData changes
  const results = useMemo(() => {
    return runFeasibilityProjections(modelData);
  }, [modelData]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Application Ribbon with Horizontal Scrolling Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCompanyProfile={() => setIsProfileModalOpen(true)}
        onPrint={() => window.print()}
        projectName={modelData.general.projectName}
        companyProfile={modelData.companyProfile}
      />

      {/* Main Workspace Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8">
        {activeTab === 'assumptions' && (
          <AssumptionsView
            data={modelData}
            onChangeData={setModelData}
            onOpenCompanyProfile={() => setIsProfileModalOpen(true)}
          />
        )}

        {activeTab === 'statements' && (
          <StatementsView
            data={modelData}
            results={results}
          />
        )}

        {activeTab === 'notes' && (
          <NotesView
            data={modelData}
            results={results}
          />
        )}

        {activeTab === 'ratios' && (
          <RatiosView
            data={modelData}
            results={results}
          />
        )}
      </main>

      {/* Multi-step Company Profile & Capital Contribution Modal */}
      {isProfileModalOpen && (
        <CompanyProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentProfile={modelData.companyProfile}
          currentData={modelData}
          onSaveProfile={handleSaveProfile}
        />
      )}
    </div>
  );
}

export default App;
