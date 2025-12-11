import { motion } from 'framer-motion';
import { 
  Bell, BellOff, Calendar, Clock, TrendingUp, TrendingDown, 
  Minus, AlertTriangle, DollarSign, BarChart2, Users, Percent
} from 'lucide-react';

// Типы
export type EventType = 
  | 'fed_rate' 
  | 'fed_meeting' 
  | 'inflation_cpi' 
  | 'inflation_ppi' 
  | 'employment' 
  | 'gdp' 
  | 'retail_sales' 
  | 'other';

export type EventImpact = 'high' | 'medium' | 'low';
export type EventStatus = 'upcoming' | 'in_progress' | 'completed';

export interface Event {
  id: string;
  title: string;
  event_type: string; // Changed to string for Supabase compatibility
  impact: string; // Changed to string for Supabase compatibility
  event_date: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  description?: string;
  result_comment?: string;
  status: string; // Changed to string for Supabase compatibility
  admin_name?: string;
}

interface EventCardProps {
  event: Event;
  isSubscribed?: boolean;
  onToggleSubscription?: (eventId: string) => void;
  isSubscribing?: boolean;
}

// Конфигурация типов событий
const eventTypeConfig: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  fed_rate: { icon: DollarSign, label: 'Ставка ФРС', color: 'text-blue-400' },
  fed_meeting: { icon: Users, label: 'Заседание ФРС', color: 'text-blue-400' },
  inflation_cpi: { icon: Percent, label: 'Инфляция CPI', color: 'text-orange-400' },
  inflation_ppi: { icon: Percent, label: 'Инфляция PPI', color: 'text-orange-400' },
  employment: { icon: Users, label: 'Занятость', color: 'text-green-400' },
  gdp: { icon: BarChart2, label: 'ВВП', color: 'text-purple-400' },
  retail_sales: { icon: TrendingUp, label: 'Розн. продажи', color: 'text-cyan-400' },
  other: { icon: Calendar, label: 'Событие', color: 'text-gray-400' },
};

// Конфигурация влияния
const impactConfig: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Высокое' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Среднее' },
  low: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Низкое' },
};

// Конфигурация статусов
const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  upcoming: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Ожидается' },
  in_progress: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Сейчас' },
  completed: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Завершено' },
};

// Default configs for unknown values
const defaultTypeConfig = { icon: Calendar, label: 'Событие', color: 'text-gray-400' };
const defaultImpactConfig = { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Неизв.' };
const defaultStatusConfig = { color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Неизв.' };

// Форматирование даты
function formatEventDate(dateStr: string): { date: string; time: string; relative: string } {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  const dateFormatted = date.toLocaleDateString('ru-RU', { 
    day: 'numeric', 
    month: 'short' 
  });
  
  const timeFormatted = date.toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  let relative = '';
  if (diff > 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      relative = `через ${days} д.`;
    } else if (hours > 0) {
      relative = `через ${hours} ч.`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      relative = `через ${minutes} мин.`;
    }
  } else {
    relative = 'завершено';
  }
  
  return { date: dateFormatted, time: timeFormatted, relative };
}

// Сравнение значений
function compareValues(actual?: string, forecast?: string, previous?: string): 'better' | 'worse' | 'neutral' | null {
  if (!actual) return null;
  
  const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ''));
  const compareNum = parseFloat((forecast || previous || '').replace(/[^0-9.-]/g, ''));
  
  if (isNaN(actualNum) || isNaN(compareNum)) return null;
  
  if (actualNum > compareNum) return 'better';
  if (actualNum < compareNum) return 'worse';
  return 'neutral';
}

export function EventCard({ 
  event, 
  isSubscribed = false,
  onToggleSubscription,
  isSubscribing = false
}: EventCardProps) {
  const typeConfig = eventTypeConfig[event.event_type] || defaultTypeConfig;
  const impact = impactConfig[event.impact] || defaultImpactConfig;
  const status = statusConfig[event.status] || defaultStatusConfig;
  const { date, time, relative } = formatEventDate(event.event_date);
  const comparison = compareValues(event.actual, event.forecast, event.previous);
  
  const TypeIcon = typeConfig.icon;

  const handleSubscriptionToggle = () => {
    if (onToggleSubscription && !isSubscribing) {
      onToggleSubscription(event.id);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-dark-700 rounded-2xl p-4 border border-dark-500/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className={`p-2 rounded-xl ${impact.bg}`}>
            <TypeIcon size={20} className={typeConfig.color} />
          </div>
          
          {/* Title & Type */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${typeConfig.color}`}>{typeConfig.label}</span>
              <span className="text-dark-500">•</span>
              <span className={`text-xs ${impact.color}`}>
                <AlertTriangle size={10} className="inline mr-1" />
                {impact.label}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSubscriptionToggle}
          disabled={isSubscribing}
          className={`
            p-2 rounded-xl transition-all duration-200
            ${isSubscribed 
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
              : 'bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500'
            }
            ${isSubscribing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isSubscribed ? (
            <Bell size={18} className="fill-current" />
          ) : (
            <BellOff size={18} />
          )}
        </motion.button>
      </div>

      {/* Date & Time */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Calendar size={14} />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock size={14} />
          <span>{time}</span>
        </div>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-lg ${status.bg} ${status.color}`}>
          {relative}
        </span>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Previous */}
        <div className="bg-dark-600/50 rounded-xl p-2.5">
          <div className="text-xs text-gray-500 mb-1">Пред.</div>
          <div className="text-white font-mono text-sm">
            {event.previous || '—'}
          </div>
        </div>
        
        {/* Forecast */}
        <div className="bg-dark-600/50 rounded-xl p-2.5">
          <div className="text-xs text-gray-500 mb-1">Прогноз</div>
          <div className="text-yellow-400 font-mono text-sm">
            {event.forecast || '—'}
          </div>
        </div>
        
        {/* Actual */}
        <div className={`rounded-xl p-2.5 ${event.actual ? 'bg-dark-600' : 'bg-dark-600/50'}`}>
          <div className="text-xs text-gray-500 mb-1">Факт</div>
          <div className={`font-mono text-sm flex items-center gap-1 ${
            comparison === 'better' ? 'text-green-400' :
            comparison === 'worse' ? 'text-red-400' :
            event.actual ? 'text-white' : 'text-gray-500'
          }`}>
            {event.actual || '—'}
            {comparison === 'better' && <TrendingUp size={12} />}
            {comparison === 'worse' && <TrendingDown size={12} />}
            {comparison === 'neutral' && <Minus size={12} />}
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-sm text-gray-400 mb-2">{event.description}</p>
      )}

      {/* Result comment */}
      {event.result_comment && event.status === 'completed' && (
        <div className="mt-3 pt-3 border-t border-dark-500/30">
          <div className="text-xs text-gray-500 mb-1">Итог:</div>
          <p className="text-sm text-gray-300">{event.result_comment}</p>
        </div>
      )}

      {/* Status indicator */}
      {event.status === 'in_progress' && (
        <div className="absolute top-0 right-0">
          <div className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            LIVE
          </div>
        </div>
      )}
    </motion.div>
  );
}
