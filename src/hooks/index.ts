import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/supabase';
import type { Signal, Admin, TelegramUser } from '../types';

// ==========================================
// TELEGRAM HOOK
// ==========================================
export function useTelegram() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#0a0a0f');
      tg.setBackgroundColor('#0a0a0f');
      
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      setIsReady(true);
    } else {
      // Для тестирования в браузере
      setIsReady(true);
    }
  }, []);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
  }, []);

  const showAlert = useCallback((message: string) => {
    window.Telegram?.WebApp?.showAlert(message);
  }, []);

  return { user, isReady, haptic, showAlert };
}

// ==========================================
// ACCESS HOOK
// ==========================================
export function useAccess(telegramId?: number) {
  const [isAllowed, setIsAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInfo, setAdminInfo] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!telegramId) {
      setIsLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        // Сначала проверяем whitelist
        const inWhitelist = await api.checkWhitelist(telegramId);
        if (inWhitelist) {
          setIsAllowed(true);
        }
        
        // Потом проверяем админа
        try {
          const admin = await api.checkAdmin(telegramId);
          if (admin) {
            setIsAllowed(true);
            setIsAdmin(true);
            setAdminInfo(admin);
          }
        } catch {
          // Таблица admins может не существовать
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [telegramId]);

  return { isAllowed, isAdmin, adminInfo, isLoading };
}

// ==========================================
// SIGNALS HOOK
// ==========================================
export function useSignals(adminTelegramId?: number, risk?: string) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSignals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getActiveSignals(adminTelegramId, risk);
      setSignals(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [adminTelegramId, risk]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const updateSignal = useCallback(async (signalId: string, data: Record<string, unknown>) => {
    await api.updateSignal(signalId, data);
  }, []);

  const closeSignal = useCallback(async (signalId: string) => {
    await api.closeSignal(signalId);
  }, []);

  return { 
    signals, 
    isLoading, 
    error, 
    refetch: fetchSignals,
    updateSignal,
    closeSignal
  };
}

// ==========================================
// ADMINS HOOK
// ==========================================
export function useAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const data = await api.getAdmins();
        setAdmins(data || []);
      } catch (error) {
        console.error('Error loading admins:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  return { admins, isLoading };
}

// ==========================================
// SUBSCRIPTIONS HOOK
// ==========================================
export function useSubscriptions(telegramId?: number) {
  const [subscribedSignals, setSubscribedSignals] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!telegramId) {
      setIsLoading(false);
      return;
    }

    const loadSubscriptions = async () => {
      try {
        const subscriptions = await api.getUserSubscriptions(telegramId);
        setSubscribedSignals(new Set(subscriptions));
      } catch (error) {
        console.error('Error loading subscriptions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [telegramId]);

  const toggleSubscription = useCallback(async (signalId: string) => {
    if (!telegramId) return;

    const isCurrentlySubscribed = subscribedSignals.has(signalId);

    try {
      if (isCurrentlySubscribed) {
        await api.unsubscribeFromSignal(signalId, telegramId);
        setSubscribedSignals(prev => {
          const next = new Set(prev);
          next.delete(signalId);
          return next;
        });
      } else {
        await api.subscribeToSignal(signalId, telegramId);
        setSubscribedSignals(prev => new Set([...prev, signalId]));
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      throw error;
    }
  }, [telegramId, subscribedSignals]);

  const isSubscribed = useCallback((signalId: string) => {
    return subscribedSignals.has(signalId);
  }, [subscribedSignals]);

  return {
    toggleSubscription,
    isSubscribed,
    isLoading,
  };
}

// ==========================================
// PRICES HOOK
// ==========================================
export function usePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (symbols.length === 0) return;

    const fetchPrices = async () => {
      try {
        const symbolsParam = JSON.stringify(symbols);
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(symbolsParam)}`
        );
        const data = await response.json();
        
        if (Array.isArray(data)) {
          const priceMap: Record<string, number> = {};
          data.forEach((item: { symbol: string; price: string }) => {
            priceMap[item.symbol] = parseFloat(item.price);
          });
          setPrices(priceMap);
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);

    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  return { prices };
}

// ==========================================
// EVENTS HOOK
// ==========================================
export function useEvents(options?: { status?: string; eventType?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getEvents(options);
      setEvents(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [options?.status, options?.eventType]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}

// ==========================================
// EVENT SUBSCRIPTIONS HOOK
// ==========================================
export function useEventSubscriptions(telegramId?: number) {
  const [subscribedEvents, setSubscribedEvents] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!telegramId) {
      setIsLoading(false);
      return;
    }

    const loadSubscriptions = async () => {
      try {
        const subscriptions = await api.getEventSubscriptions(telegramId);
        setSubscribedEvents(new Set(subscriptions));
      } catch (error) {
        console.error('Error loading event subscriptions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [telegramId]);

  const toggleSubscription = useCallback(async (eventId: string) => {
    if (!telegramId) return;

    const isCurrentlySubscribed = subscribedEvents.has(eventId);

    try {
      if (isCurrentlySubscribed) {
        await api.unsubscribeFromEvent(eventId, telegramId);
        setSubscribedEvents(prev => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
      } else {
        await api.subscribeToEvent(eventId, telegramId);
        setSubscribedEvents(prev => new Set([...prev, eventId]));
      }
    } catch (error) {
      console.error('Error toggling event subscription:', error);
      throw error;
    }
  }, [telegramId, subscribedEvents]);

  const isSubscribed = useCallback((eventId: string) => {
    return subscribedEvents.has(eventId);
  }, [subscribedEvents]);

  return {
    toggleSubscription,
    isSubscribed,
    isLoading,
  };
}

// Типы для экспорта
interface Event {
  id: string;
  title: string;
  event_type: string;
  impact: string;
  event_date: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  description?: string;
  result_comment?: string;
  status: string;
  admin_name?: string;
}

export type { Event };
