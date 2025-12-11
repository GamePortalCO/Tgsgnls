import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Bell, Calendar } from 'lucide-react';
import { 
  SignalCard, 
  EventCard,
  Tabs, 
  RiskTabs,
  BottomNav,
  FullScreenLoader, 
  AccessDenied,
  EmptyState,
  ErrorState 
} from './components';
import type { TabId } from './components';
import { 
  useTelegram, 
  useAccess, 
  useSignals, 
  useAdmins, 
  useSubscriptions, 
  usePrices,
  useEvents,
  useEventSubscriptions
} from './hooks';
import type { Admin } from './types';

function App() {
  const { user, isReady, haptic } = useTelegram();
  const { isAllowed, isAdmin, isLoading: accessLoading } = useAccess(user?.id);
  const { admins, isLoading: adminsLoading } = useAdmins();
  
  // Нижняя навигация
  const [activeSection, setActiveSection] = useState<TabId>('signals');
  
  // Состояние фильтров для сигналов
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscribingSignals, setSubscribingSignals] = useState<Set<string>>(new Set());
  
  // Состояние для событий
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [subscribingEvents, setSubscribingEvents] = useState<Set<string>>(new Set());
  
  // Загрузка сигналов
  const { 
    signals, 
    isLoading: signalsLoading, 
    error: signalsError, 
    refetch: refetchSignals 
  } = useSignals(
    selectedAdmin?.telegram_id,
    selectedRisk || undefined
  );

  // Загрузка событий
  const {
    events,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents
  } = useEvents({ 
    status: eventFilter === 'all' ? undefined : eventFilter 
  });

  // Подписки на сигналы
  const { 
    isSubscribed: isSignalSubscribed, 
    toggleSubscription: toggleSignalSubscription,
    isLoading: subscriptionsLoading 
  } = useSubscriptions(user?.id);

  // Подписки на события
  const {
    isSubscribed: isEventSubscribed,
    toggleSubscription: toggleEventSubscription,
    isLoading: eventSubsLoading
  } = useEventSubscriptions(user?.id);

  // Получаем уникальные символы для загрузки цен
  const symbols = useMemo(() => 
    [...new Set(signals.map(s => s.symbol))],
    [signals]
  );

  // Текущие цены
  const { prices } = usePrices(symbols);

  // Фильтрация сигналов по поиску
  const filteredSignals = signals.filter(signal => 
    signal.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Создаём табы админов
  const adminTabs = [
    { id: 'all', label: 'Все' },
    ...admins.map(admin => ({
      id: admin.id,
      label: admin.display_name,
      icon: <User size={14} />
    }))
  ];

  // Обработка выбора админа
  const handleAdminChange = (tabId: string) => {
    if (tabId === 'all') {
      setSelectedAdmin(null);
    } else {
      const admin = admins.find(a => a.id === tabId);
      setSelectedAdmin(admin || null);
    }
  };

  // Обработка подписки на сигнал
  const handleToggleSignalSubscription = useCallback(async (signalId: string) => {
    setSubscribingSignals(prev => new Set([...prev, signalId]));
    haptic('medium');
    
    try {
      await toggleSignalSubscription(signalId);
      haptic('light');
    } finally {
      setSubscribingSignals(prev => {
        const next = new Set(prev);
        next.delete(signalId);
        return next;
      });
    }
  }, [toggleSignalSubscription, haptic]);

  // Обработка подписки на событие
  const handleToggleEventSubscription = useCallback(async (eventId: string) => {
    setSubscribingEvents(prev => new Set([...prev, eventId]));
    haptic('medium');
    
    try {
      await toggleEventSubscription(eventId);
      haptic('light');
    } finally {
      setSubscribingEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  }, [toggleEventSubscription, haptic]);

  // Подсчёт подписок
  const subscribedSignalsCount = useMemo(() => 
    filteredSignals.filter(s => isSignalSubscribed(s.id)).length,
    [filteredSignals, isSignalSubscribed]
  );

  // Показываем загрузку
  if (!isReady || accessLoading) {
    return <FullScreenLoader />;
  }

  // Проверяем доступ
  if (!isAllowed) {
    return <AccessDenied userId={user?.id} />;
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-20">
      {/* ==================== SIGNALS SECTION ==================== */}
      {activeSection === 'signals' && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700/50">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold">Сетапы</h1>
                <div className="flex items-center gap-2">
                  {subscribedSignalsCount > 0 && (
                    <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg text-xs">
                      <Bell size={12} className="fill-current" />
                      {subscribedSignalsCount}
                    </div>
                  )}
                  {isAdmin && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Поиск по символу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors"
                />
              </div>
            </div>

            {/* Admin Tabs */}
            {!adminsLoading && admins.length > 0 && (
              <div className="px-4 pb-2">
                <Tabs
                  tabs={adminTabs}
                  activeTab={selectedAdmin?.id || 'all'}
                  onChange={handleAdminChange}
                  variant="pills"
                />
              </div>
            )}

            {/* Risk Tabs */}
            <div className="px-4 pb-3">
              <RiskTabs
                activeRisk={selectedRisk}
                onChange={setSelectedRisk}
              />
            </div>
          </header>

          {/* Signals Content */}
          <main className="px-4 py-4">
            {signalsLoading || subscriptionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-dark-700 rounded-2xl h-48 animate-pulse" />
                ))}
              </div>
            ) : signalsError ? (
              <ErrorState message={signalsError.message} onRetry={refetchSignals} />
            ) : filteredSignals.length === 0 ? (
              <EmptyState
                title="Нет сигналов"
                description={searchQuery ? `По запросу "${searchQuery}" ничего не найдено` : 'Нет активных сигналов'}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div className="space-y-4" layout>
                  {filteredSignals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      isSubscribed={isSignalSubscribed(signal.id)}
                      currentPrice={prices[signal.symbol]}
                      isSubscribing={subscribingSignals.has(signal.id)}
                      onToggleSubscription={handleToggleSignalSubscription}
                      onCopy={() => haptic('light')}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </>
      )}

      {/* ==================== EVENTS SECTION ==================== */}
      {activeSection === 'events' && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700/50">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={20} />
                  События
                </h1>
              </div>

              {/* Event Filter Tabs */}
              <div className="flex gap-2">
                {[
                  { id: 'upcoming', label: 'Предстоящие' },
                  { id: 'completed', label: 'Завершённые' },
                  { id: 'all', label: 'Все' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setEventFilter(tab.id as typeof eventFilter);
                      haptic('light');
                    }}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${eventFilter === tab.id
                        ? 'bg-dark-600 text-white'
                        : 'bg-dark-700/50 text-gray-500 hover:text-gray-300'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Events Content */}
          <main className="px-4 py-4">
            {eventsLoading || eventSubsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-dark-700 rounded-2xl h-40 animate-pulse" />
                ))}
              </div>
            ) : eventsError ? (
              <ErrorState message={eventsError.message} onRetry={refetchEvents} />
            ) : events.length === 0 ? (
              <EmptyState
                title="Нет событий"
                description={
                  eventFilter === 'upcoming' 
                    ? 'Нет предстоящих событий' 
                    : 'События не найдены'
                }
                icon={<Calendar size={48} className="text-gray-600 mb-4" />}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div className="space-y-4" layout>
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      isSubscribed={isEventSubscribed(event.id)}
                      isSubscribing={subscribingEvents.has(event.id)}
                      onToggleSubscription={handleToggleEventSubscription}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </>
      )}

      {/* ==================== NOTIFICATIONS SECTION ==================== */}
      {activeSection === 'notifications' && (
        <>
          <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700/50">
            <div className="px-4 py-3">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Bell size={20} />
                Мои алерты
              </h1>
            </div>
          </header>

          <main className="px-4 py-4">
            <EmptyState
              title="Алерты"
              description="Здесь будут ваши подписки на сигналы и события"
              icon={<Bell size={48} className="text-gray-600 mb-4" />}
            />
          </main>
        </>
      )}

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeSection}
        onChange={setActiveSection}
        notificationCount={subscribedSignalsCount}
      />
    </div>
  );
}

export default App;
