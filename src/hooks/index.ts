import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/supabase';
import type { Signal, Admin, TelegramUser } from '../types';

// Хук для Telegram WebApp
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
    }
  }, []);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type);
  }, []);

  const showAlert = useCallback((message: string) => {
    window.Telegram?.WebApp?.showAlert(message);
  }, []);

  const showConfirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      window.Telegram?.WebApp?.showConfirm(message, (confirmed) => {
        resolve(confirmed);
      });
    });
  }, []);

  return { user, isReady, haptic, showAlert, showConfirm };
}

// Хук для проверки доступа
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
        // Проверяем админа
        const admin = await api.checkAdmin(telegramId);
        if (admin) {
          setIsAllowed(true);
          setIsAdmin(true);
          setAdminInfo(admin);
        } else {
          // Проверяем whitelist
          const inWhitelist = await api.checkWhitelist(telegramId);
          setIsAllowed(inWhitelist);
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

// Хук для загрузки сигналов
export function useSignals(adminTelegramId?: number, risk?: string) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSignals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.getActiveSignals(
        adminTelegramId?.toString(),
        risk
      );
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

  return { signals, isLoading, error, refetch: fetchSignals };
}

// Хук для загрузки админов
export function useAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const data = await api.getAdmins();
        setAdmins(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  return { admins, isLoading, error };
}

// Хук для управления подписками
export function useSubscriptions(telegramId?: number) {
  const [subscribedSignals, setSubscribedSignals] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка подписок при инициализации
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

  // Подписаться на сигнал
  const subscribe = useCallback(async (signalId: string) => {
    if (!telegramId) return false;
    
    try {
      await api.subscribeToSignal(signalId, telegramId);
      setSubscribedSignals(prev => new Set([...prev, signalId]));
      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      return false;
    }
  }, [telegramId]);

  // Отписаться от сигнала
  const unsubscribe = useCallback(async (signalId: string) => {
    if (!telegramId) return false;
    
    try {
      await api.unsubscribeFromSignal(signalId, telegramId);
      setSubscribedSignals(prev => {
        const next = new Set(prev);
        next.delete(signalId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }, [telegramId]);

  // Переключить подписку
  const toggleSubscription = useCallback(async (signalId: string) => {
    const isSubscribed = subscribedSignals.has(signalId);
    
    if (isSubscribed) {
      return await unsubscribe(signalId);
    } else {
      return await subscribe(signalId);
    }
  }, [subscribedSignals, subscribe, unsubscribe]);

  // Проверить подписку
  const isSubscribed = useCallback((signalId: string) => {
    return subscribedSignals.has(signalId);
  }, [subscribedSignals]);

  return {
    subscribedSignals,
    isLoading,
    subscribe,
    unsubscribe,
    toggleSubscription,
    isSubscribed,
  };
}

// Хук для получения текущих цен
export function usePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (symbols.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        const data = await api.getPrices(symbols);
        const priceMap: Record<string, number> = {};
        data.forEach(item => {
          priceMap[item.symbol] = item.price;
        });
        setPrices(priceMap);
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    
    // Обновляем каждые 10 секунд
    const interval = setInterval(fetchPrices, 10000);
    
    return () => clearInterval(interval);
  }, [symbols.join(',')]);

  return { prices, isLoading };
}

// ==========================================
// ХУКИ ДЛЯ СОБЫТИЙ
// ==========================================

// Хук для загрузки событий
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

// Хук для подписок на события
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

  const subscribe = useCallback(async (eventId: string) => {
    if (!telegramId) return false;
    
    try {
      await api.subscribeToEvent(eventId, telegramId);
      setSubscribedEvents(prev => new Set([...prev, eventId]));
      return true;
    } catch (error) {
      console.error('Error subscribing to event:', error);
      return false;
    }
  }, [telegramId]);

  const unsubscribe = useCallback(async (eventId: string) => {
    if (!telegramId) return false;
    
    try {
      await api.unsubscribeFromEvent(eventId, telegramId);
      setSubscribedEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      return true;
    } catch (error) {
      console.error('Error unsubscribing from event:', error);
      return false;
    }
  }, [telegramId]);

  const toggleSubscription = useCallback(async (eventId: string) => {
    const isSubscribed = subscribedEvents.has(eventId);
    return isSubscribed ? await unsubscribe(eventId) : await subscribe(eventId);
  }, [subscribedEvents, subscribe, unsubscribe]);

  const isSubscribed = useCallback((eventId: string) => {
    return subscribedEvents.has(eventId);
  }, [subscribedEvents]);

  return {
    subscribedEvents,
    isLoading,
    subscribe,
    unsubscribe,
    toggleSubscription,
    isSubscribed,
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
