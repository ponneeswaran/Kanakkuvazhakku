import React from 'react';
import { Expense, Income } from '../types';
import { X, Calendar, User, Tag, CreditCard, Clock, MapPin } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface TransactionDetailsModalProps {
  item: (Expense & { type: 'expense' }) | (Income & { type: 'income' });
  onClose: () => void;
  onDelete: () => void;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ item, onClose, onDelete }) => {
  const { currency, t } = useData();
  const isExpense = item.type === 'expense';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-6 pb-2">
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
                <X size={18} className="text-gray-600 dark:text-slate-300" />
            </button>
            
            <div className="flex flex-col items-center mt-2">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 ${
                     !isExpense 
                     ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' 
                     : item.category === 'Food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                     : item.category === 'Transport' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                     : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                    {isExpense ? item.category[0] : (item.category === 'Salary' ? '💰' : '📥')}
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                    {isExpense ? '-' : '+'}{currency}{item.amount.toFixed(2)}
                </h2>
                <p className="text-sm font-medium text-gray-500 dark:text-slate-400 text-center px-4">
                    {isExpense ? (item as Expense).description : (item as Income).source}
                </p>
            </div>
        </div>

        <div className="p-6 pt-4 space-y-4">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500 dark:text-slate-400">
                        <Tag size={16} className="mr-2" />
                        <span>{t('Category')}</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">{t(item.category)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500 dark:text-slate-400">
                        <Calendar size={16} className="mr-2" />
                        <span>{t('Date')}</span>
                    </div>
                    <span className="font-semibold text-gray-800 dark:text-white">
                        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                </div>

                {isExpense ? (
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500 dark:text-slate-400">
                            <CreditCard size={16} className="mr-2" />
                            <span>{t('Payment Method')}</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{t((item as Expense).paymentMethod)}</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-500 dark:text-slate-400">
                                <Clock size={16} className="mr-2" />
                                <span>{t('Recurrence')}</span>
                            </div>
                            <span className="font-semibold text-gray-800 dark:text-white">{t((item as Income).recurrence)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-500 dark:text-slate-400">
                                <User size={16} className="mr-2" />
                                <span>{t('Status')}</span>
                            </div>
                            <span className={`font-semibold ${(item as Income).status === 'Received' ? 'text-green-500' : (item as Income).status === 'Overdue' ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                                {t((item as Income).status)}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={() => {
                    if (confirm(t(isExpense ? 'Delete this expense?' : 'Delete this income entry?'))) {
                        onDelete();
                        onClose();
                    }
                }}
                className="w-full py-3 text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
                {t('Delete Transaction')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;