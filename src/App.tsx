import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { 
  SignalCard, 
  EventCard,
  Tabs, 
  RiskTabs,
  AdminTabs,
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

function App() {
  const { user, isReady, haptic } = useTelegram();
  const { isAllowed, isAdmin, isLoading: accessLoading } = useAccess(user?.id);
  const { admins } = useAdmins();
  
  // Нижняя навигация
  const [activeSection, setActiveSection] = useState<TabId>('signals');
  
  // Фильтры для сигналов
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscribingSignals, setSubscribingSignals] = useState<Set<string>>(new Set());
  
  // Состояние для событий
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [subscribingEvents, setSubscribingEvents] = useState<Set<string>>(new Set());

  // Получаем telegram_id выбранного админа
  const selectedAdminTelegramId = useMemo(() => {
    if (!selectedAdminId) return undefined;
    const admin = admins.find(a => a.id === selectedAdminId);
    return admin?.telegram_id;
  }, [selectedAdminId, admins]);
  
  // Загрузка сигналов
  const { 
    signals, 
    isLoading: signalsLoading, 
    error: signalsError, 
    refetch: refetchSignals,
    updateSignal,
    closeSignal
  } = useSignals(selectedAdminTelegramId, selectedRisk || undefined);

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
  } = useSubscriptions(user?.id);

  // Подписки на события
  const {
    isSubscribed: isEventSubscribed,
    toggleSubscription: toggleEventSubscription,
  } = useEventSubscriptions(user?.id);

  // Получаем уникальные символы для цен
  const symbols = useMemo(() => 
    [...new Set(signals.map(s => s.symbol))],
    [signals]
  );

  // Текущие цены
  const { prices } = usePrices(symbols);

  // Фильтрация сигналов по поиску
  const filteredSignals = useMemo(() => 
    signals.filter(signal => 
      signal.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [signals, searchQuery]
  );

  // Обработчик подписки на сигнал
  const handleToggleSignalSubscription = useCallback(async (signalId: string) => {
    setSubscribingSignals(prev => new Set([...prev, signalId]));
    haptic('medium');
    
    try {
      await toggleSignalSubscription(signalId);
    } finally {
      setSubscribingSignals(prev => {
        const next = new Set(prev);
        next.delete(signalId);
        return next;
      });
    }
  }, [toggleSignalSubscription, haptic]);

  // Обработчик подписки на событие
  const handleToggleEventSubscription = useCallback(async (eventId: string) => {
    setSubscribingEvents(prev => new Set([...prev, eventId]));
    haptic('medium');
    
    try {
      await toggleEventSubscription(eventId);
    } finally {
      setSubscribingEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  }, [toggleEventSubscription, haptic]);

  // Обработчик обновления сигнала (для админов)
  const handleUpdateSignal = useCallback(async (signalId: string, data: Record<string, unknown>) => {
    await updateSignal(signalId, data);
    refetchSignals();
  }, [updateSignal, refetchSignals]);

  // Обработчик закрытия сигнала (для админов)
  const handleCloseSignal = useCallback(async (signalId: string) => {
    await closeSignal(signalId);
    refetchSignals();
  }, [closeSignal, refetchSignals]);

  // Event filter tabs
  const eventFilterTabs = [
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'completed', label: 'Завершённые' },
    { id: 'all', label: 'Все' },
  ];

  // ==========================================
  // LOADING STATE - показываем loader пока проверяем доступ
  // ==========================================
  if (!isReady || accessLoading || (user?.id && !isAllowed && accessLoading !== false)) {
    return <FullScreenLoader />;
  }

  // ==========================================
  // ACCESS DENIED - только после полной загрузки
  // ==========================================
  if (!isAllowed) {
    return <AccessDenied userId={user?.id} />;
  }

  // ==========================================
  // MAIN APP
  // ==========================================
  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {/* ==================== SIGNALS SECTION ==================== */}
      {activeSection === 'signals' && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700/50 px-4 py-3">
            <h1 className="text-xl font-bold text-white mb-3">Сетапы</h1>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Поиск по символу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-700 border border-dark-600 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-dark-500"
              />
            </div>

            {/* Admin Tabs */}
            {admins.length > 0 && (
              <div className="mb-3">
                <AdminTabs
                  admins={admins}
                  selectedAdminId={selectedAdminId}
                  onChange={setSelectedAdminId}
                />
              </div>
            )}

            {/* Risk Tabs */}
            <RiskTabs
              activeRisk={selectedRisk}
              onChange={(risk) => {
                setSelectedRisk(risk);
                haptic('light');
              }}
            />
          </header>

          {/* Signals Content */}
          <main className="px-4 py-4">
            {signalsLoading && !signals.length ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full" />
              </div>
            ) : signalsError ? (
              <ErrorState message={signalsError.message} onRetry={refetchSignals} />
            ) : filteredSignals.length === 0 ? (
              <EmptyState 
                title="Нет сигналов" 
                description={searchQuery ? 'Попробуйте другой поиск' : 'Сигналы пока не добавлены'}
              />
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div className="space-y-4" layout>
                  {filteredSignals.map((signal) => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      currentPrice={prices[signal.symbol]}
                      isSubscribed={isSignalSubscribed(signal.id)}
                      isSubscribing={subscribingSignals.has(signal.id)}
                      isAdmin={isAdmin}
                      onToggleSubscription={handleToggleSignalSubscription}
                      onUpdate={handleUpdateSignal}
                      onClose={handleCloseSignal}
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
          <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700/50 px-4 py-3">
            <h1 className="text-xl font-bold text-white mb-3">События</h1>
            
            {/* Event Filter Tabs */}
            <Tabs
              tabs={eventFilterTabs}
              activeTab={eventFilter}
              onChange={(tab) => {
                setEventFilter(tab as typeof eventFilter);
                haptic('light');
              }}
            />
          </header>

          <main className="px-4 py-4">
            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full" />
              </div>
            ) : eventsError ? (
              <ErrorState message={eventsError.message} onRetry={refetchEvents} />
            ) : events.length === 0 ? (
              <EmptyState 
                title="Нет событий" 
                description="События пока не добавлены"
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
          <header className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-700/50 px-4 py-3">
            <h1 className="text-xl font-bold text-white">Алерты</h1>
          </header>

          <main className="px-4 py-4">
            <EmptyState 
              title="Нет алертов" 
              description="Уведомления о достижении целей и входов появятся здесь"
            />
          </main>
        </>
      )}

      {/* ==================== BOTTOM NAV ==================== */}
      <BottomNav
        activeTab={activeSection}
        onChange={(tab) => {
          setActiveSection(tab);
          haptic('light');
        }}
      />
    </div>
  );
}

export default App;
