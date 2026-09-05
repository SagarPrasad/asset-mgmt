import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  FileText,
  Landmark,
  Percent,
  ShieldCheck,
  Building2,
  Car,
  CreditCard
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { SubNavbar } from './components/SubNavbar';
import { OverviewTab } from './components/OverviewTab';
import { BankSection } from './components/BankSection';
import { InvestmentSection } from './components/InvestmentSection';
import { InsuranceSection } from './components/InsuranceSection';
import { PropertySection } from './components/PropertySection';
import { MovableSection } from './components/MovableSection';
import { LiabilitySection } from './components/LiabilitySection';
import { ScheduleALView } from './components/ScheduleALView';
import { SupabaseModal } from './components/SupabaseModal';
import { AddAssetModal } from './components/AddAssetModal';
import { AddFinancialYearModal } from './components/AddFinancialYearModal';
import { EditAssetModal } from './components/EditAssetModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ViewSecretModal } from './components/ViewSecretModal';
import { EditMemberModal } from './components/EditMemberModal';
import { EditHoldingModal } from './components/EditHoldingModal';
import { UpcomingRemindersModal } from './components/UpcomingRemindersModal';
import { LoginScreen } from './components/LoginScreen';
import { VaultUnlockScreen } from './components/VaultUnlockScreen';
import { UnauthorizedScreen } from './components/UnauthorizedScreen';
import { loadInitialData, getFreshSeedData, saveLocalData, syncDataToSupabase } from './services/dataService';
import { getSupabaseClient, resetSupabaseClient, signInWithGoogle, signOut } from './lib/supabaseClient';
import { calculateFinancialYearTotals } from './utils/formatters';
import { isEmailAuthorized } from './utils/authConfig';
import { getUpcomingInsuranceReminders } from './utils/reminderHelper';

export function App() {
  const [data, setData] = useState(getFreshSeedData());
  const [isLoading, setIsLoading] = useState(true);
  const [activeFyId, setActiveFyId] = useState('fy_25_26');
  const [activeMemberId, setActiveMemberId] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [privacyMode, setPrivacyMode] = useState(false);

  // Visual Theme State
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('family_vault_theme') || 'midnight';
    } catch {
      return 'midnight';
    }
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('family_vault_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'nordic') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.warn('Theme storage error:', e);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'nordic') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Auth & Security State
  const [user, setUser] = useState(null);
  const [masterPassword, setMasterPassword] = useState(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState('bank');
  const [isAddFyModalOpen, setIsAddFyModalOpen] = useState(false);

  const [editModal, setEditModal] = useState({
    isOpen: false,
    assetType: 'bank',
    item: null
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: '',
    type: '',
    onConfirm: null
  });

  const [secretModal, setSecretModal] = useState({
    isOpen: false,
    accountTitle: '',
    accountType: '',
    credentials: {}
  });

  const [memberModal, setMemberModal] = useState({
    isOpen: false,
    member: null
  });

  const [holdingModal, setHoldingModal] = useState({
    isOpen: false,
    holding: null
  });

  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);
  const [pairSuccessNotice, setPairSuccessNotice] = useState('');

  // Mobile pairing hash handler & Supabase Auth listener
  useEffect(() => {
    // 1. Check for incoming mobile pairing link (#connect=...)
    if (window.location.hash && window.location.hash.includes('connect=')) {
      try {
        const match = window.location.hash.match(/connect=([^&]+)/);
        if (match && match[1]) {
          const rawPayload = decodeURIComponent(match[1]);
          const decoded = JSON.parse(decodeURIComponent(escape(atob(rawPayload))));
          if (decoded.u && decoded.k) {
            localStorage.setItem('family_vault_supabase_url', decoded.u);
            localStorage.setItem('family_vault_supabase_key', decoded.k);
            resetSupabaseClient(decoded.u, decoded.k);
            // Clean up the URL bar immediately for privacy & aesthetics
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
            setPairSuccessNotice('✅ Device successfully paired! Database connected & ready for login.');
            setTimeout(() => setPairSuccessNotice(''), 6000);
          }
        }
      } catch (err) {
        console.error('Failed to parse mobile pairing payload:', err);
      }
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      setIsSupabaseConnected(true);
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          setIsVaultUnlocked(false);
          setMasterPassword(null);
        }
        setIsLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      setIsSupabaseConnected(false);
      setIsLoading(false);
    }
  }, []);

  const loadUserData = async (currentUser, pwd) => {
    setIsLoading(true);
    try {
      const loaded = await loadInitialData(currentUser, pwd);
      setData(loaded);
    } catch (e) {
      console.error('Failed to load user data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        setIsSupabaseModalOpen(true);
        return;
      }
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Sign In Error:', err);
      alert(`Google Sign-In: ${err.message}\nOpening Supabase settings modal to verify configuration.`);
      setIsSupabaseModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsVaultUnlocked(false);
      setMasterPassword(null);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  const handleBypassDemo = () => {
    const demoUser = {
      id: 'demo_vault_user',
      email: 'demo.user@familyvault.local',
      user_metadata: {
        full_name: 'Demo Family Admin',
        avatar_url: ''
      }
    };
    setUser(demoUser);
  };

  const handleUnlockVault = async (pwd) => {
    setMasterPassword(pwd);
    setIsVaultUnlocked(true);
    await loadUserData(user, pwd);

    // Automated Policy Due Reminders Popup upon Vault Unlock / Login
    const activePolicies = data.insurancePolicies || [];
    const reminders = getUpcomingInsuranceReminders(activePolicies, 45);
    const isSnoozed = sessionStorage.getItem('insurance_reminders_snoozed') === 'true';
    if (reminders.length > 0 && !isSnoozed) {
      setIsRemindersModalOpen(true);
    }
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
    setMasterPassword(null);
  };

  // Action Handlers
  const handleOpenAddModal = (type = 'bank') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  const handleOpenEditAsset = (item, assetType) => {
    setEditModal({
      isOpen: true,
      assetType,
      item
    });
  };

  const handleOpenDeleteAsset = (title, type, deleteAction) => {
    setDeleteModal({
      isOpen: true,
      title,
      type,
      onConfirm: () => {
        const updatedData = deleteAction();
        saveLocalData(updatedData, user);
        setData(updatedData);
        if (getSupabaseClient() && user) {
          syncDataToSupabase(updatedData, user, masterPassword).catch(console.warn);
        }
      }
    });
  };

  const handleOpenViewCredentials = (credObj) => {
    setSecretModal({
      isOpen: true,
      accountTitle: credObj.title,
      accountType: credObj.type,
      credentials: credObj
    });
  };

  const handleOpenEditMember = (member) => {
    setMemberModal({
      isOpen: true,
      member
    });
  };

  const handleOpenAddMember = () => {
    setMemberModal({
      isOpen: true,
      member: null
    });
  };

  // STEP 1: Not authenticated -> Login Screen
  if (!user) {
    return (
      <>
        {pairSuccessNotice && (
          <div style={{
            position: 'fixed',
            top: '1.25rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {pairSuccessNotice}
          </div>
        )}
        <LoginScreen
          onGoogleSignIn={handleGoogleSignIn}
          onOpenSettings={() => setIsSupabaseModalOpen(true)}
          isSupabaseConnected={isSupabaseConnected}
          onBypassDemo={handleBypassDemo}
          theme={theme}
          setTheme={setTheme}
        />
        <SupabaseModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          user={user}
          onGoogleSignIn={handleGoogleSignIn}
          onSignOut={handleSignOut}
          data={data}
          setData={setData}
          isSupabaseConnected={isSupabaseConnected}
          setIsSupabaseConnected={setIsSupabaseConnected}
          masterPassword={masterPassword}
          setMasterPassword={setMasterPassword}
        />
      </>
    );
  }

  // STEP 2: Check Whitelist
  if (!isEmailAuthorized(user.email)) {
    return (
      <UnauthorizedScreen
        user={user}
        onSignOut={handleSignOut}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // STEP 3: Check Master Password
  if (!isVaultUnlocked) {
    return (
      <VaultUnlockScreen
        user={user}
        onUnlockVault={handleUnlockVault}
        onSignOut={handleSignOut}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // STEP 4: Dashboard
  const activeFy = data.financialYears?.find(fy => fy.id === activeFyId) || data.financialYears?.[0] || { id: 'fy_25_26', label: 'FY 2025-26' };

  // Calculate totals
  const totals = calculateFinancialYearTotals(data, activeFyId, activeMemberId);

  // Multi-year totals for timeline
  const totalsByFy = {};
  data.financialYears?.forEach(fy => {
    totalsByFy[fy.id] = calculateFinancialYearTotals(data, fy.id, activeMemberId);
  });

  const upcomingReminders = getUpcomingInsuranceReminders(data.insurancePolicies || [], 45);

  const tabs = [
    { id: 'overview', label: 'Executive Overview', icon: TrendingUp },
    { id: 'schedule_al', label: 'ITR Schedule AL Report', icon: FileText, badge: 'Tax View' },
    { id: 'banks', label: 'Bank Accounts & Deposits', icon: Landmark },
    { id: 'investments', label: 'Demat & Retirement', icon: Percent },
    { id: 'insurance', label: 'Insurance Portfolio', icon: ShieldCheck },
    { id: 'properties', label: 'Immovable Properties', icon: Building2 },
    { id: 'movables', label: 'Physical & Movables', icon: Car },
    { id: 'liabilities', label: 'Liabilities & Expenses', icon: CreditCard }
  ];

  return (
    <div className="app-wrapper">
      {/* Top Navigation */}
      <Navbar
        privacyMode={privacyMode}
        setPrivacyMode={setPrivacyMode}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onOpenSettings={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        data={data}
        activeFy={activeFy}
        onLockVault={handleLockVault}
        onOpenReminders={() => setIsRemindersModalOpen(true)}
        upcomingRemindersCount={upcomingReminders.length}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Sub Navbar with FY & Member Switcher and + Next FY button */}
      <SubNavbar
        financialYears={data.financialYears || []}
        activeFyId={activeFyId}
        onSelectFy={setActiveFyId}
        members={data.members || []}
        activeMemberId={activeMemberId}
        onSelectMember={setActiveMemberId}
        onOpenAddModal={() => handleOpenAddModal('bank')}
        onOpenAddFyModal={() => setIsAddFyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="main-layout">
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="badge-tag" style={{ fontSize: '10px', padding: '1px 5px' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <OverviewTab
            totals={totals}
            totalsByFy={totalsByFy}
            data={data}
            activeFy={activeFy}
            activeMemberId={activeMemberId}
            privacyMode={privacyMode}
            onNavigateTab={setActiveTab}
            onEditMember={handleOpenEditMember}
            onAddMember={handleOpenAddMember}
          />
        )}

        {activeTab === 'schedule_al' && (
          <ScheduleALView
            data={data}
            activeFy={activeFy}
            privacyMode={privacyMode}
          />
        )}

        {activeTab === 'banks' && (
          <BankSection
            data={data}
            activeFy={activeFy}
            activeMemberId={activeMemberId}
            privacyMode={privacyMode}
            onOpenAddModal={handleOpenAddModal}
            onEditAsset={handleOpenEditAsset}
            onDeleteAsset={handleOpenDeleteAsset}
            onViewCredentials={handleOpenViewCredentials}
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentSection
            data={data}
            setData={setData}
            activeFy={activeFy}
            activeMemberId={activeMemberId}
            privacyMode={privacyMode}
            user={user}
            masterPassword={masterPassword}
            onOpenAddModal={handleOpenAddModal}
            onEditAsset={handleOpenEditAsset}
            onDeleteAsset={handleOpenDeleteAsset}
            onViewCredentials={handleOpenViewCredentials}
            onOpenAddHolding={() => setHoldingModal({ isOpen: true, holding: null })}
            onEditHolding={(h) => setHoldingModal({ isOpen: true, holding: h })}
          />
        )}

        {activeTab === 'insurance' && (
          <InsuranceSection
            data={data}
            activeMemberId={activeMemberId}
            privacyMode={privacyMode}
            onOpenAddModal={handleOpenAddModal}
            onEditAsset={handleOpenEditAsset}
            onDeleteAsset={handleOpenDeleteAsset}
            onOpenRemindersModal={() => setIsRemindersModalOpen(true)}
          />
        )}

        {activeTab === 'properties' && (
          <PropertySection
            data={data}
            privacyMode={privacyMode}
            onOpenAddModal={handleOpenAddModal}
            onEditAsset={handleOpenEditAsset}
            onDeleteAsset={handleOpenDeleteAsset}
          />
        )}

        {activeTab === 'movables' && (
          <MovableSection
            data={data}
            activeMemberId={activeMemberId}
            privacyMode={privacyMode}
            onOpenAddModal={handleOpenAddModal}
            onEditAsset={handleOpenEditAsset}
            onDeleteAsset={handleOpenDeleteAsset}
          />
        )}

        {activeTab === 'liabilities' && (
          <LiabilitySection
            data={data}
            privacyMode={privacyMode}
            onOpenAddModal={handleOpenAddModal}
            onEditAsset={handleOpenEditAsset}
            onDeleteAsset={handleOpenDeleteAsset}
          />
        )}
      </main>

      {/* Supabase, Whitelist & Security Configuration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        user={user}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        data={data}
        setData={setData}
        isSupabaseConnected={isSupabaseConnected}
        setIsSupabaseConnected={setIsSupabaseConnected}
        masterPassword={masterPassword}
        setMasterPassword={setMasterPassword}
      />

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialType={addModalType}
        data={data}
        setData={setData}
        activeFy={activeFy}
        user={user}
      />

      {/* Add Next Financial Year Modal */}
      <AddFinancialYearModal
        isOpen={isAddFyModalOpen}
        onClose={() => setIsAddFyModalOpen(false)}
        data={data}
        setData={setData}
        activeFy={activeFy}
        setActiveFyId={setActiveFyId}
        user={user}
        masterPassword={masterPassword}
      />

      {/* Edit Asset Modal */}
      <EditAssetModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, assetType: 'bank', item: null })}
        assetType={editModal.assetType}
        item={editModal.item}
        data={data}
        setData={setData}
        activeFy={activeFy}
        user={user}
        masterPassword={masterPassword}
      />

      {/* Delete Confirmation Modal (Master Password Required) */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, title: '', type: '', onConfirm: null })}
        itemTitle={deleteModal.title}
        itemType={deleteModal.type}
        onConfirmDelete={deleteModal.onConfirm}
        sessionMasterPassword={masterPassword}
      />

      {/* Protected Secret Credentials Modal (Master Password Required) */}
      <ViewSecretModal
        isOpen={secretModal.isOpen}
        onClose={() => setSecretModal({ isOpen: false, accountTitle: '', accountType: '', credentials: {} })}
        accountTitle={secretModal.accountTitle}
        accountType={secretModal.accountType}
        credentials={secretModal.credentials}
        sessionMasterPassword={masterPassword}
      />

      {/* Edit / Add Family Member Identity Vault Modal */}
      <EditMemberModal
        isOpen={memberModal.isOpen}
        onClose={() => setMemberModal({ isOpen: false, member: null })}
        member={memberModal.member}
        data={data}
        setData={setData}
        user={user}
        masterPassword={masterPassword}
      />

      {/* Upcoming Insurance Due Reminders Modal */}
      <UpcomingRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
        reminders={upcomingReminders}
        data={data}
        privacyMode={privacyMode}
        onNavigateTab={setActiveTab}
      />

      {/* Edit / Add Demat Stock or Mutual Fund Holding Modal */}
      <EditHoldingModal
        isOpen={holdingModal.isOpen}
        onClose={() => setHoldingModal({ isOpen: false, holding: null })}
        holding={holdingModal.holding}
        data={data}
        setData={setData}
        user={user}
        masterPassword={masterPassword}
      />
    </div>
  );
}

export default App;
