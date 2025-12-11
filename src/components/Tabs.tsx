import { motion } from 'framer-motion';

// ==========================================
// ADMIN TABS
// ==========================================

interface Admin {
  id: string;
  telegram_id: number;
  display_name: string;
}

interface AdminTabsProps {
  admins: Admin[];
  selectedAdminId: string | null;
  onChange: (adminId: string | null) => void;
}

export function AdminTabs({ admins, selectedAdminId, onChange }: AdminTabsProps) {
  if (admins.length === 0) return null;

  return (
    <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
      <button
        onClick={() => {
          onChange(null);
          window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
        }}
        className={`
          px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
          ${!selectedAdminId 
            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
            : 'bg-dark-700/50 text-gray-500 hover:text-gray-300'
          }
        `}
      >
        👥 Все
      </button>
      {admins.map((admin) => (
        <button
          key={admin.id}
          onClick={() => {
            onChange(admin.id);
            window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
          }}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
            ${selectedAdminId === admin.id 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-dark-700/50 text-gray-500 hover:text-gray-300'
            }
          `}
        >
          {admin.display_name}
        </button>
      ))}
    </div>
  );
}

// ==========================================
// RISK TABS - На всю ширину, Casino в конце
// ==========================================

interface RiskTabsProps {
  activeRisk: string | null;
  onChange: (risk: string | null) => void;
}

// Порядок: Все, Low, Normal, High, Casino
const riskTabs = [
  { id: 'all', label: 'Все', color: 'text-white', bg: 'bg-dark-600' },
  { id: 'low', label: 'Low', emoji: '🟢', color: 'text-green-400', bg: 'bg-green-500/20' },
  { id: 'normal', label: 'Normal', emoji: '🟡', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { id: 'high', label: 'High', emoji: '🔴', color: 'text-red-400', bg: 'bg-red-500/20' },
  { id: 'casino', label: 'Casino', emoji: '🎰', color: 'text-orange-400', bg: 'bg-orange-500/20' },
];

export function RiskTabs({ activeRisk, onChange }: RiskTabsProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {riskTabs.map((tab) => {
        const isActive = (tab.id === 'all' && !activeRisk) || tab.id === activeRisk;
        
        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onChange(tab.id === 'all' ? null : tab.id);
              window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
            }}
            className={`
              relative py-2.5 px-2 rounded-xl text-xs font-medium
              transition-all duration-200 flex flex-col items-center justify-center gap-0.5
              ${isActive
                ? `${tab.bg} ${tab.color} border border-current/30`
                : 'bg-dark-700/50 text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {tab.emoji && <span className="text-base">{tab.emoji}</span>}
            <span>{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ==========================================
// GENERIC TABS
// ==========================================

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
}

export function Tabs({ tabs, activeTab, onChange, variant = 'default' }: TabsProps) {
  return (
    <div className="relative">
      <div className={`
        flex overflow-x-auto scrollbar-hide gap-1
        ${variant === 'pills' ? 'bg-dark-700 p-1 rounded-xl' : ''}
        ${variant === 'underline' ? 'border-b border-dark-600' : ''}
      `}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              onChange(tab.id);
              window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
            }}
            className={`
              relative flex items-center gap-2 px-4 py-2 text-sm font-medium
              whitespace-nowrap transition-all duration-200
              ${variant === 'pills' ? 'rounded-lg' : ''}
              ${variant === 'underline' ? 'pb-3' : ''}
              ${activeTab === tab.id 
                ? 'text-white' 
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {tab.icon}
            {tab.label}
            
            {activeTab === tab.id && variant === 'default' && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-dark-600 rounded-lg -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            {activeTab === tab.id && variant === 'pills' && (
              <motion.div
                layoutId="activePill"
                className="absolute inset-0 bg-dark-500 rounded-lg -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            
            {activeTab === tab.id && variant === 'underline' && (
              <motion.div
                layoutId="activeUnderline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
