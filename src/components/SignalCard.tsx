import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, TrendingUp, TrendingDown, Target, AlertTriangle, 
  Bell, BellOff, Edit3, X, Check, Trash2 
} from 'lucide-react';
import type { Signal, RiskLevel } from '../types';

interface SignalCardProps {
  signal: Signal;
  isSubscribed?: boolean;
  currentPrice?: number;
  isAdmin?: boolean;
  onToggleSubscription?: (signalId: string) => void;
  onUpdate?: (signalId: string, data: Partial<Signal>) => Promise<void>;
  onClose?: (signalId: string) => Promise<void>;
  isSubscribing?: boolean;
}

const riskConfig: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  casino: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Casino' },
  high: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'High' },
  normal: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Normal' },
  low: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Low' },
};

export function SignalCard({ 
  signal, 
  isSubscribed = false,
  currentPrice,
  isAdmin = false,
  onToggleSubscription,
  onUpdate,
  onClose,
  isSubscribing = false
}: SignalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    entries: signal.entries.map(e => e.price),
    targets: signal.targets.map(t => t.price),
    stop_loss: signal.stop_loss,
    comment: signal.comment || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const risk = riskConfig[signal.risk];
  const isLong = signal.direction === 'LONG';
  const displayPrice = currentPrice || signal.current_price;

  const handleCopy = (value: string | number) => {
    navigator.clipboard.writeText(String(value));
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
  };

  const handleSubscriptionToggle = () => {
    if (onToggleSubscription && !isSubscribing) {
      onToggleSubscription(signal.id);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
    }
  };

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(signal.id, {
        entries: editData.entries.map(price => ({ price })),
        targets: editData.targets.map(price => ({ price, percentage: 0, hit: false })),
        stop_loss: editData.stop_loss,
        comment: editData.comment || undefined
      });
      setIsEditing(false);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
    } catch (error) {
      console.error('Error updating signal:', error);
      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    if (!onClose) return;
    const confirmed = await new Promise<boolean>((resolve) => {
      window.Telegram?.WebApp?.showConfirm(
        'Закрыть этот сигнал?',
        (ok) => resolve(ok)
      );
    });
    
    if (confirmed) {
      try {
        await onClose(signal.id);
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch (error) {
        console.error('Error closing signal:', error);
      }
    }
  };

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
      layout
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
          {/* Admin Edit Button */}
          {isAdmin && !isEditing && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsEditing(true)}
              className="p-2 rounded-xl bg-dark-600 text-gray-400 hover:text-white hover:bg-dark-500 transition-all"
            >
              <Edit3 size={18} />
            </motion.button>
          )}

          {/* Subscription Button */}
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

          {/* Risk Badge */}
          <div className={`${risk.bg} px-3 py-1 rounded-lg flex items-center gap-1`}>
            <AlertTriangle size={14} className={risk.color} />
            <span className={`text-sm font-medium ${risk.color}`}>
              {risk.label}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription indicator */}
      {isSubscribed && (
        <div className="mb-3 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg">
          <Bell size={12} className="fill-current" />
          <span>Уведомления включены</span>
        </div>
      )}

      {/* Edit Mode */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-dark-600/50 rounded-xl border border-dark-500"
          >
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Edit Entries */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Входы</label>
                {editData.entries.map((entry, i) => (
                  <input
                    key={i}
                    type="number"
                    value={entry}
                    onChange={(e) => {
                      const newEntries = [...editData.entries];
                      newEntries[i] = parseFloat(e.target.value) || 0;
                      setEditData({ ...editData, entries: newEntries });
                    }}
                    className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                ))}
              </div>

              {/* Edit Targets */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Цели</label>
                {editData.targets.map((target, i) => (
                  <input
                    key={i}
                    type="number"
                    value={target}
                    onChange={(e) => {
                      const newTargets = [...editData.targets];
                      newTargets[i] = parseFloat(e.target.value) || 0;
                      setEditData({ ...editData, targets: newTargets });
                    }}
                    className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                ))}
              </div>

              {/* Edit Stop Loss */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Stop Loss</label>
                <input
                  type="number"
                  value={editData.stop_loss}
                  onChange={(e) => setEditData({ ...editData, stop_loss: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
              </div>
            </div>

            {/* Comment */}
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">Комментарий</label>
              <textarea
                value={editData.comment}
                onChange={(e) => setEditData({ ...editData, comment: e.target.value })}
                className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white text-sm resize-none"
                rows={2}
                placeholder="Добавить комментарий..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 py-2 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-dark-600 text-gray-400 py-2 rounded-lg hover:bg-dark-500 transition-colors"
              >
                <X size={16} />
                Отмена
              </button>
              <button
                onClick={handleClose}
                className="flex items-center justify-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Data Grid */}
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
              <span className="text-xs text-yellow-500/60">E{i + 1}</span>
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
