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
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    } catch {
      // Таблица admins может не существовать
      return [];
    }
  },

  // Получить активные сигналы
  async getActiveSignals(adminTelegramId?: number, risk?: string) {
    let query = supabase
      .from('signals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (adminTelegramId) {
      query = query.eq('admin_telegram_id', adminTelegramId);
    }
    
    if (risk) {
      query = query.eq('risk', risk);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
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
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('telegram_id', telegramId)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch {
      return null;
    }
  },

  // Создать сигнал
  async createSignal(signalData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('signals')
      .insert(signalData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Обновить сигнал
  async updateSignal(signalId: string, updateData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('signals')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', signalId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Закрыть сигнал
  async closeSignal(signalId: string, status: 'closed' | 'cancelled' | 'target_hit' = 'closed') {
    const { error } = await supabase
      .from('signals')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', signalId);
    
    if (error) throw error;
    return true;
  },

  // ==========================================
  // ПОДПИСКИ НА УВЕДОМЛЕНИЯ О ЦЕНАХ
  // ==========================================

  async subscribeToSignal(signalId: string, telegramId: number) {
    const { data, error } = await supabase
      .from('signal_subscriptions')
      .upsert({
        signal_id: signalId,
        telegram_id: telegramId,
        notify_entries: true,
        notify_targets: true,
        notify_stop_loss: true,
        is_active: true
      }, { onConflict: 'signal_id,telegram_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async unsubscribeFromSignal(signalId: string, telegramId: number) {
    const { error } = await supabase
      .from('signal_subscriptions')
      .update({ is_active: false })
      .eq('signal_id', signalId)
      .eq('telegram_id', telegramId);
    
    if (error) throw error;
    return true;
  },

  async getUserSubscriptions(telegramId: number) {
    const { data, error } = await supabase
      .from('signal_subscriptions')
      .select('signal_id')
      .eq('telegram_id', telegramId)
      .eq('is_active', true);
    
    if (error) throw error;
    return data?.map(s => s.signal_id) || [];
  },

  // ==========================================
  // СОБЫТИЯ
  // ==========================================

  async getEvents(options?: { status?: string; eventType?: string }) {
    let query = supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });
    
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

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

  async unsubscribeFromEvent(eventId: string, telegramId: number) {
    const { error } = await supabase
      .from('event_subscriptions')
      .update({ is_active: false })
      .eq('event_id', eventId)
      .eq('telegram_id', telegramId);
    
    if (error) throw error;
    return true;
  },

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
