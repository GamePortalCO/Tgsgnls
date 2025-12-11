import { motion } from 'framer-motion';
import { Copy, TrendingUp, TrendingDown, Target, AlertTriangle, Bell, BellOff, Users } from 'lucide-react';
import type { Signal, RiskLevel } from '../types';

interface SignalCardProps {
  signal: Signal;
  isSubscribed?: boolean;
  subscriberCount?: number;
  currentPrice?: number;
  onCopy?: (text: string) => void;
  onToggleSubscription?: (signalId: string) => void;
  isSubscribing?: boolean;
}

const riskConfig: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  casino: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Casino' },
  high: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'HIGH RISK' },
  normal: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Normal Risk' },
  low: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Low Risk' },
};

export function SignalCard({ 
  signal, 
  isSubscribed = false,
  subscriberCount = 0,
  currentPrice,
  onCopy,
  onToggleSubscription,
  isSubscribing = false
}: SignalCardProps) {
  const risk = riskConfig[signal.risk];
  const isLong = signal.direction === 'LONG';
  const displayPrice = currentPrice || signal.current_price;

  const handleCopy = (value: string | number) => {
    navigator.clipboard.writeText(String(value));
    onCopy?.(String(value));
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  const handleSubscriptionToggle = () => {
    if (onToggleSubscription && !isSubscribing) {
      onToggleSubscription(signal.id);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    }
  };

  // Вычисляем изменение цены относительно среднего входа
  const avgEntry = signal.entries.length > 0 
    ? signal.entries.reduce((sum, e) => sum + e.price, 0) / signal.entries.length 
    : 0;
  
  const priceChange = displayPrice && avgEntry 
    ? ((displayPrice - avgEntry) / avgEntry * 100).toFixed(2)
    : null;
  
  const isPriceUp = priceChange ? parseFloat(priceChange) > 0 : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative bg-dark-700 rounded-2xl p-4 border border-dark-500/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white font-mono">
            {signal.symbol.replace('USDT', '')}
            <span className="text-dark-500 text-sm">USDT</span>
          </span>
          
          {displayPrice && (
            <div className="flex items-center gap-1">
              <span className="bg-dark-600 px-2 py-1 rounded-lg text-sm font-mono text-gray-300">
                {displayPrice}
              </span>
              {priceChange && (
                <span className={`text-xs font-medium ${isPriceUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isPriceUp ? '+' : ''}{priceChange}%
                </span>
              )}
            </div>
          )}
          
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium ${
            isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isLong ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {signal.direction}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Subscription Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSubscriptionToggle}
            disabled={isSubscribing}
            className={`
              relative p-2 rounded-xl transition-all duration-200
              ${isSubscribed 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500'
              }
              ${isSubscribing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={isSubscribed ? 'Отписаться от уведомлений' : 'Подписаться на уведомления'}
          >
            {isSubscribing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Bell size={18} />
              </motion.div>
            ) : isSubscribed ? (
              <Bell size={18} className="fill-current" />
            ) : (
              <BellOff size={18} />
            )}
            
            {/* Subscriber count badge */}
            {subscriberCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                {subscriberCount > 99 ? '99+' : subscriberCount}
              </span>
            )}
          </motion.button>

          {/* Risk Badge */}
          <div className={`${risk.bg} px-3 py-1 rounded-lg flex items-center gap-1`}>
            <AlertTriangle size={14} className={risk.color} />
            <span className={`text-sm font-medium ${risk.color}`}>
              {risk.label}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription indicator bar */}
      {isSubscribed && (
        <div className="mb-3 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
          <Bell size={12} className="fill-current" />
          <span>Уведомления включены</span>
          {subscriberCount > 1 && (
            <span className="ml-auto flex items-center gap-1 text-gray-500">
              <Users size={12} />
              {subscriberCount}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Targets */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Target size={12} />
            TARGETS
          </div>
          {signal.targets.map((target, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={`text-xs ${target.hit ? 'text-green-400' : 'text-green-500/60'}`}>
                T{i + 1}
                {target.hit && <span className="ml-1">✓</span>}
              </span>
              <button
                onClick={() => handleCopy(target.price)}
                className="flex items-center gap-1 text-white font-mono hover:text-green-400 transition-colors group"
              >
                {target.price}
                <Copy size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            </div>
          ))}
        </div>

        {/* Entries */}
        <div className="space-y-2">
          <div className="text-xs text-yellow-500/60 uppercase tracking-wider">
            ENTRIES
          </div>
          {signal.entries.map((entry, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-yellow-500/60">
                E{i + 1}
                {entry.percentage && (
                  <span className="text-red-400 ml-1">{entry.percentage}%</span>
                )}
              </span>
              <button
                onClick={() => handleCopy(entry.price)}
                className="flex items-center gap-1 text-white font-mono hover:text-yellow-400 transition-colors group"
              >
                {entry.price}
                <Copy size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            </div>
          ))}
        </div>

        {/* Stop Loss */}
        <div className="space-y-2">
          <div className="text-xs text-red-500/60 uppercase tracking-wider">
            STOP LOSS
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-500/60">SL</span>
            <button
              onClick={() => handleCopy(signal.stop_loss)}
              className="flex items-center gap-1 text-white font-mono hover:text-red-400 transition-colors group"
            >
              {signal.stop_loss}
              <Copy size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </button>
          </div>
          
          {signal.soft_stop_timeframe && (
            <div className="text-xs text-gray-500">
              Soft Stop{' '}
              <span className="bg-dark-600 px-1.5 py-0.5 rounded text-gray-400">
                {signal.soft_stop_timeframe}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Comment */}
      {signal.comment && (
        <div className="mt-4 pt-3 border-t border-dark-500/30">
          <p className="text-sm text-gray-400">{signal.comment}</p>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-0 right-0">
        <div className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-bl-lg">
          Active
        </div>
      </div>
    </motion.div>
  );
}
