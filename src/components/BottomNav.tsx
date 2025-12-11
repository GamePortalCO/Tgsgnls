import { motion } from 'framer-motion';
import { BarChart3, Calendar, Bell } from 'lucide-react';

export type TabId = 'signals' | 'events' | 'notifications' | 'settings';

interface BottomNavProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  notificationCount?: number;
}

const tabs = [
  { id: 'signals' as TabId, label: 'Сетапы', icon: BarChart3 },
  { id: 'events' as TabId, label: 'События', icon: Calendar },
  { id: 'notifications' as TabId, label: 'Алерты', icon: Bell },
];

export function BottomNav({ activeTab, onChange, notificationCount = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-800/95 backdrop-blur-lg border-t border-dark-600/50 z-50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                onChange(tab.id);
                window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
              }}
              className={`
                relative flex flex-col items-center justify-center
                min-w-[64px] py-2 px-3 rounded-xl
                transition-all duration-200
                ${isActive 
                  ? 'text-white' 
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute inset-0 bg-dark-600 rounded-xl"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              
              <div className="relative z-10">
                <Icon size={22} className={isActive ? 'stroke-[2.5]' : ''} />
                
                {tab.id === 'notifications' && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </div>
              
              <span className={`relative z-10 text-[11px] mt-1 font-medium ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
