
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Income } from '../types';
import { CheckCircle, Clock, AlertTriangle, Phone, MessageCircle, Trash2, X } from 'lucide-react';

interface IncomeCardProps {
    income: Income;
    currency: string;
    t: (key: string) => string;
    onFollowUp: (income: Income) => void;
    onMarkReceived: (id: string) => void;
    onDelete: (id: string) => void;
}

const IncomeCard: React.FC<IncomeCardProps> = ({ income, currency, t, onFollowUp, onMarkReceived, onDelete }) => {
    // Helper for local today
    const getLocalToday = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = getLocalToday();
    // Safety check: Don't show Overdue if date is in the future, regardless of status data
    const isOverdue = income.status === 'Overdue' && income.date < today;

    // Check if income is in the future (tomorrow or later) to prompt confirmation
    const isFuturePayment = useMemo(() => {
        return income.status === 'Expected' && income.date > today;
    }, [income.date, income.status, today]);
    
    const handleReceiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        // If it's a future date, require confirmation
        if (isFuturePayment) {
             if(!confirm(t('confirm_mark_received'))) return;
        }
        onMarkReceived(income.id);
    }

    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border ${isOverdue ? 'border-red-400 dark:border-red-900 ring-1 ring-red-100 dark:ring-red-900/30' : 'border-gray-100 dark:border-slate-700'} relative transition-all`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        income.category === 'Rent' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 
                        income.category === 'Salary' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                        {income.category === 'Rent' ? '🏠' : income.category === 'Salary' ? '💼' : '💰'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{income.source}</h3>
                        <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 space-x-2">
                            <span>{t(income.category)}</span>
                            {income.recurrence !== 'None' && (
                                <span className="bg-gray-100 dark:bg-slate-700 px-1.5 rounded text-[10px] flex items-center">
                                    <Clock size={10} className="mr-1"/> {t(income.recurrence)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`block font-bold text-lg ${isOverdue ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'}`}>
                        {currency}{income.amount.toFixed(0)}
                    </span>
                    <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {isOverdue ? t('Overdue') : new Date(income.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-50 dark:border-slate-700/50">
                {income.status !== 'Received' && (
                    <>
                        {income.category === 'Rent' && isOverdue && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onFollowUp(income); }}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-semibold"
                            >
                                <AlertTriangle size={12} />
                                <span>{t('Follow Up')}</span>
                            </button>
                        )}
                        <button 
                            onClick={handleReceiveClick}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                isFuturePayment
                                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300' 
                                    : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                            }`}
                        >
                            <CheckCircle size={12} />
                            <span>{t('Mark Received')}</span>
                        </button>
                    </>
                )}
                {income.status === 'Received' && (
                    <span className="text-xs text-green-500 font-medium flex items-center">
                        <CheckCircle size={12} className="mr-1" /> {t('Received')}
                    </span>
                )}
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(t('Delete this income entry?'))) {
                            onDelete(income.id);
                        }
                    }}
                    className="p-2 text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

const IncomeScreen: React.FC = () => {
  const { incomes, markIncomeReceived, deleteIncome, currency, t } = useData();
  const [followUpItem, setFollowUpItem] = useState<Income | null>(null);

  // Helper for local today
  const getLocalToday = () => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };
  const today = getLocalToday();

  // Group by strict date logic to ensure UI consistency
  // Overdue: Only if status isn't Received AND date < today
  const overdueIncomes = incomes.filter(i => i.status !== 'Received' && i.date < today);
  
  // Upcoming/Expected: Status isn't Received AND (date >= today OR status is strictly Expected/Overdue but conceptually strictly >= today for 'upcoming' view, but here we group anything >= today)
  // We effectively split pending items into Past (Overdue) and Present/Future (Upcoming)
  const expectedIncomes = incomes
      .filter(i => i.status !== 'Received' && i.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleWhatsAppReminder = (income: Income) => {
      if (!income.tenantContact) {
          alert(t('No contact number found for this tenant.'));
          return;
      }
      const message = `Hi, this is a reminder regarding the rent of ${currency}${income.amount} due on ${new Date(income.date).toLocaleDateString()}. Please pay at your earliest convenience.`;
      const url = `https://wa.me/${income.tenantContact.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setFollowUpItem(null);
  };

  const handleCallTenant = (income: Income) => {
      if (!income.tenantContact) {
           alert(t('No contact number found for this tenant.'));
           return;
      }
      window.location.href = `tel:${income.tenantContact}`;
      setFollowUpItem(null);
  }

  return (
    <div className="h-full flex flex-col animate-fade-in bg-gray-50 dark:bg-slate-950 transition-colors">
        <div className="shrink-0 p-6 pb-2 z-10 bg-gray-50 dark:bg-slate-950 transition-colors">
            <header className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Income & Rent')}</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('Track incoming payments')}</p>
            </header>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
            {/* Overdue Section */}
            {overdueIncomes.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center">
                        <AlertTriangle size={12} className="mr-1" />
                        {t('Action Required')}
                    </h2>
                    {overdueIncomes.map(income => (
                        <IncomeCard 
                            key={income.id} 
                            income={income} 
                            currency={currency} 
                            t={t}
                            onFollowUp={setFollowUpItem}
                            onMarkReceived={markIncomeReceived}
                            onDelete={deleteIncome}
                        />
                    ))}
                </div>
            )}

            {/* Upcoming Section */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('Upcoming')}
                </h2>
                {expectedIncomes.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                        <p className="text-sm text-gray-400 dark:text-slate-500">{t('No upcoming income scheduled.')}</p>
                    </div>
                ) : (
                    expectedIncomes.map(income => (
                        <IncomeCard 
                            key={income.id} 
                            income={income} 
                            currency={currency} 
                            t={t}
                            onFollowUp={setFollowUpItem}
                            onMarkReceived={markIncomeReceived}
                            onDelete={deleteIncome}
                        />
                    ))
                )}
            </div>
            
            <div className="h-10"></div> {/* Bottom Spacer */}
        </div>

        {/* Follow Up Modal / Sheet */}
        {followUpItem && (
            <div 
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={() => setFollowUpItem(null)}
            >
                <div 
                    className="bg-white dark:bg-slate-800 w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl p-6 shadow-xl animate-slide-up"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('Rent Follow Up')}</h3>
                        <button onClick={() => setFollowUpItem(null)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => handleWhatsAppReminder(followUpItem)}
                            className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
                        >
                            <MessageCircle size={20} />
                            <span>{t('WhatsApp Reminder')}</span>
                        </button>
                        
                        <button 
                            onClick={() => handleCallTenant(followUpItem)}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
                        >
                            <Phone size={20} />
                            <span>{t('Call Tenant')}</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default IncomeScreen;
