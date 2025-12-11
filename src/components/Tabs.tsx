import { motion } from 'framer-motion';

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

// Risk Tabs Component
interface RiskTabsProps {
  activeRisk: string | null;
  onChange: (risk: string | null) => void;
}

const riskTabs = [
  { id: 'all', label: 'Все', color: 'text-white' },
  { id: 'casino', label: '🎰 Casino', color: 'text-orange-400' },
  { id: 'high', label: '🔴 High', color: 'text-red-400' },
  { id: 'normal', label: '🟡 Normal', color: 'text-yellow-400' },
  { id: 'low', label: '🟢 Low', color: 'text-green-400' },
];

export function RiskTabs({ activeRisk, onChange }: RiskTabsProps) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
      {riskTabs.map((tab) => {
        const isActive = (tab.id === 'all' && !activeRisk) || tab.id === activeRisk;
        
        return (
          <button
            key={tab.id}
            onClick={() => {
              onChange(tab.id === 'all' ? null : tab.id);
              window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
            }}
            className={`
              relative px-4 py-2 rounded-xl text-sm font-medium
              whitespace-nowrap transition-all duration-200
              ${isActive
                ? `bg-dark-600 ${tab.color}`
                : 'bg-dark-700/50 text-gray-500 hover:text-gray-300'
              }
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
