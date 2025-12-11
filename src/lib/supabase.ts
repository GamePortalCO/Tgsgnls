import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API функции
export const api = {
  // Получить всех админов
  async getAdmins() {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at');
    
    if (error) throw error;
    return data;
  },

  // Получить активные сигналы
  async getActiveSignals(adminId?: string, risk?: string) {
    let query = supabase
      .from('active_signals_view')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (adminId) {
      query = query.eq('admin_id', adminId);
    }
    
    if (risk) {
      query = query.eq('risk', risk);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  // Проверить пользователя в whitelist
  async checkWhitelist(telegramId: number) {
    const { data, error } = await supabase
      .from('whitelist')
      .select('id')
      .eq('telegram_id', telegramId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Проверить админа
  async checkAdmin(telegramId: number) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Создать сигнал (для админов через n8n webhook)
  async createSignal(signalData: unknown) {
    const { data, error } = await supabase
      .from('signals')
      .insert(signalData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Обновить сигнал
  async updateSignal(signalId: string, updateData: unknown) {
    const { data, error } = await supabase
      .from('signals')
      .update(updateData)
      .eq('id', signalId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Удалить сигнал (мягкое удаление)
  async deleteSignal(signalId: string) {
    const { error } = await supabase
      .from('signals')
      .update({ status: 'cancelled' })
      .eq('id', signalId);
    
    if (error) throw error;
    return true;
  },

  // ==========================================
  // ПОДПИСКИ НА УВЕДОМЛЕНИЯ О ЦЕНАХ
  // ==========================================

  // Подписаться на сигнал
  async subscribeToSignal(
    signalId: string, 
    telegramId: number,
    options?: {
      notifyEntries?: boolean;
      notifyTargets?: boolean;
      notifyStopLoss?: boolean;
    }
  ) {
    const { data, error } = await supabase
      .from('signal_subscriptions')
      .upsert({
        signal_id: signalId,
        telegram_id: telegramId,
        notify_entries: options?.notifyEntries ?? true,
        notify_targets: options?.notifyTargets ?? true,
        notify_stop_loss: options?.notifyStopLoss ?? true,
        is_active: true
      }, { onConflict: 'signal_id,telegram_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Отписаться от сигнала
  async unsubscribeFromSignal(signalId: string, telegramId: number) {
    const { error } = await supabase
      .from('signal_subscriptions')
      .update({ is_active: false })
      .eq('signal_id', signalId)
      .eq('telegram_id', telegramId);
    
    if (error) throw error;
    return true;
  },

  // Проверить подписку
  async isSubscribed(signalId: string, telegramId: number) {
    const { data, error } = await supabase
      .from('signal_subscriptions')
      .select('id')
      .eq('signal_id', signalId)
      .eq('telegram_id', telegramId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error) throw error;
    return !!data;
  },

  // Получить все подписки пользователя
  async getUserSubscriptions(telegramId: number) {
    const { data, error } = await supabase
      .from('signal_subscriptions')
      .select('signal_id')
      .eq('telegram_id', telegramId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data?.map(s => s.signal_id) || [];
  },

  // Получить количество подписчиков на сигнал
  async getSubscriptionCount(signalId: string) {
    const { count, error } = await supabase
      .from('signal_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('signal_id', signalId)
      .eq('is_active', true);
    
    if (error) throw error;
    return count || 0;
  },

  // Получить текущую цену из кэша
  async getCurrentPrice(symbol: string) {
    const { data, error } = await supabase
      .from('price_cache')
      .select('price, updated_at')
      .eq('symbol', symbol)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Получить цены для нескольких символов
  async getPrices(symbols: string[]) {
    const { data, error } = await supabase
      .from('price_cache')
      .select('symbol, price, updated_at')
      .in('symbol', symbols);
    
    if (error) throw error;
    return data || [];
  },

  // ==========================================
  // СОБЫТИЯ (ЭКОНОМИЧЕСКИЙ КАЛЕНДАРЬ)
  // ==========================================

  // Получить предстоящие события
  async getUpcomingEvents() {
    const { data, error } = await supabase
      .from('upcoming_events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Получить события на сегодня
  async getTodayEvents() {
    const { data, error } = await supabase
      .from('today_events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Получить все события с фильтрами
  async getEvents(options?: { 
    status?: string; 
    eventType?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    let query = supabase
      .from('events')
      .select('*, admins(display_name)')
      .order('event_date', { ascending: true });
    
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }
    if (options?.fromDate) {
      query = query.gte('event_date', options.fromDate);
    }
    if (options?.toDate) {
      query = query.lte('event_date', options.toDate);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Подписаться на событие
  async subscribeToEvent(eventId: string, telegramId: number) {
    const { data, error } = await supabase
      .from('event_subscriptions')
      .upsert({
        event_id: eventId,
        telegram_id: telegramId,
        is_active: true
      }, { onConflict: 'event_id,telegram_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Отписаться от события
  async unsubscribeFromEvent(eventId: string, telegramId: number) {
    const { error } = await supabase
      .from('event_subscriptions')
      .update({ is_active: false })
      .eq('event_id', eventId)
      .eq('telegram_id', telegramId);
    
    if (error) throw error;
    return true;
  },

  // Получить подписки на события
  async getEventSubscriptions(telegramId: number) {
    const { data, error } = await supabase
      .from('event_subscriptions')
      .select('event_id')
      .eq('telegram_id', telegramId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data?.map(s => s.event_id) || [];
  },
};
