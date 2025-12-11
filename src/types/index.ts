// Типы для приложения

export type RiskLevel = 'casino' | 'high' | 'normal' | 'low';
export type SignalDirection = 'LONG' | 'SHORT';
export type SignalStatus = 'active' | 'closed' | 'cancelled' | 'target_hit';

export interface Entry {
  price: number;
  percentage?: number;
}

export interface Target {
  price: number;
  percentage: number;
  hit: boolean;
}

export interface Signal {
  id: string;
  symbol: string;
  direction: SignalDirection;
  risk: RiskLevel;
  current_price?: number;
  entries: Entry[];
  targets: Target[];
  stop_loss: number;
  stop_loss_percentage: number;
  soft_stop_timeframe: string;
  comment?: string;
  status: SignalStatus;
  admin_name: string;
  admin_telegram_id: number;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  telegram_id: number;
  username?: string;
  display_name: string;
  is_super_admin: boolean;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

// Telegram WebApp типы
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setText: (text: string) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        initDataUnsafe: {
          user?: TelegramUser;
          query_id?: string;
          auth_date?: number;
          hash?: string;
        };
        initData: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text?: string;
          }>;
        }, callback?: (buttonId: string) => void) => void;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

export {};
