import { motion } from 'framer-motion';
import { Lock, RefreshCw } from 'lucide-react';

// Loading Spinner
export function Loader({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <RefreshCw className={`${sizeClasses[size]} text-gray-400`} />
      </motion.div>
    </div>
  );
}

// Full Screen Loader
export function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5] 
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        >
          <span className="text-2xl">📊</span>
        </motion.div>
        <p className="text-gray-500 text-sm">Загрузка...</p>
      </motion.div>
    </div>
  );
}

// Access Denied Screen
interface AccessDeniedProps {
  userId?: number;
}

export function AccessDenied({ userId }: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
        >
          <Lock className="w-10 h-10 text-red-400" />
        </motion.div>
        
        <h1 className="text-xl font-bold text-white mb-2">
          Доступ запрещён
        </h1>
        
        <p className="text-gray-400 text-sm mb-6">
          У вас нет доступа к этому приложению.
          Свяжитесь с администратором для получения доступа.
        </p>
        
        {userId && (
          <div className="bg-dark-700 rounded-xl p-4 border border-dark-500">
            <p className="text-xs text-gray-500 mb-1">Ваш ID:</p>
            <p className="font-mono text-white">{userId}</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Empty State
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ 
  title = 'Нет данных', 
  description = 'Здесь пока ничего нет',
  icon
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      {icon || (
        <div className="w-16 h-16 mb-4 rounded-2xl bg-dark-700 flex items-center justify-center">
          <span className="text-3xl">📭</span>
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </motion.div>
  );
}

// Error State
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  message = 'Произошла ошибка', 
  onRetry 
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <span className="text-3xl">⚠️</span>
      </div>
      <h3 className="text-lg font-medium text-white mb-1">Ошибка</h3>
      <p className="text-sm text-gray-500 mb-4">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg text-sm transition-colors"
        >
          Попробовать снова
        </button>
      )}
    </motion.div>
  );
}
