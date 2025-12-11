
import React, { useState } from 'react';
import { Lock, Unlock, X, KeyRound, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface EncryptionModalProps {
  isOpen: boolean;
  mode: 'encrypt' | 'decrypt';
  onClose: () => void;
  onConfirm: (password: string | undefined) => void;
}

const EncryptionModal: React.FC<EncryptionModalProps> = ({ isOpen, mode, onClose, onConfirm }) => {
  const { t } = useData();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (mode === 'decrypt' && !password.trim()) {
          setError(t('Password is required to decrypt'));
          return;
      }
      
      onConfirm(password.trim() || undefined);
      setPassword('');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-2xl transition-all animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-full ${mode === 'encrypt' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                    {mode === 'encrypt' ? <Lock size={24} /> : <Unlock size={24} />}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {mode === 'encrypt' ? t('Secure Backup') : t('Unlock Backup')}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        {mode === 'encrypt' ? t('set_backup_password_desc') : t('enter_backup_password_desc')}
                    </p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    {mode === 'encrypt' ? t('Set Password (Optional)') : t('Enter Password')}
                </label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white`}
                        placeholder={mode === 'encrypt' ? t('Leave blank for default security') : "••••••••"}
                        autoFocus
                    />
                </div>
                {error && (
                    <div className="flex items-center mt-2 text-red-500 text-xs">
                        <AlertCircle size={12} className="mr-1" />
                        {error}
                    </div>
                )}
            </div>

            <div className="pt-2 flex flex-col gap-3">
                <button 
                    type="submit"
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${
                        mode === 'encrypt' 
                            ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20' 
                            : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                    }`}
                >
                    {mode === 'encrypt' 
                        ? (password ? t('Encrypt & Backup') : t('Skip / Use Default')) 
                        : t('Decrypt & Restore')
                    }
                </button>
                
                {mode === 'decrypt' && (
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="w-full py-3 rounded-xl font-medium text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                    >
                        {t('Cancel')}
                    </button>
                )}
            </div>
        </form>
      </div>
    </div>
  );
};

export default EncryptionModal;
