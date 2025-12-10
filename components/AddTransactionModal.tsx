

import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Category, IncomeCategory, Recurrence } from '../types';
import { X, Calendar as CalendarIcon, Check, Loader2, User, Phone, TrendingUp, TrendingDown } from 'lucide-react';
import { parseExpenseFromText, parseIncomeFromText } from '../services/geminiService';
import DatePicker from './DatePicker';

interface AddTransactionModalProps {
  onClose: () => void;
  initialTab?: 'expense' | 'income';
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, initialTab = 'expense' }) => {
  const { addExpense, addIncome, currency, t } = useData();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(initialTab);

  // --- Expense State ---
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<Category>('Food');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expPaymentMethod, setExpPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Other'>('UPI');
  const [expErrors, setExpErrors] = useState<{ amount?: string; description?: string; date?: string }>({});
  
  // AI State
  const [nlInput, setNlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);

  // --- Income State ---
  const [incAmount, setIncAmount] = useState('');
  const [incCategory, setIncCategory] = useState<IncomeCategory>('Salary');
  const [incSource, setIncSource] = useState('');
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [incRecurrence, setIncRecurrence] = useState<Recurrence>('None');
  const [tenantContact, setTenantContact] = useState('');
  const [incErrors, setIncErrors] = useState<{ amount?: string; source?: string }>({});

  // --- Shared Date Picker ---
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Expense Logic ---
  const validateExpense = () => {
    const newErrors: any = {};
    if (!expAmount || parseFloat(expAmount) <= 0) newErrors.amount = "Valid amount required";
    if (!expDesc.trim()) newErrors.description = "Description required";
    if (!expDate) newErrors.date = "Date required";
    setExpErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateExpense()) return;
    addExpense({
      amount: parseFloat(expAmount),
      category: expCategory,
      description: expDesc.trim(),
      date: expDate,
      paymentMethod: expPaymentMethod,
    });
    onClose();
  };

  const handleAIParse = async () => {
      if(!nlInput.trim()) return;
      setIsParsing(true);
      try {
          if (activeTab === 'expense') {
              const parsed = await parseExpenseFromText(nlInput);
              if (parsed.amount) setExpAmount(parsed.amount.toString());
              if (parsed.category) setExpCategory(parsed.category);
              if (parsed.description) setExpDesc(parsed.description);
              if (parsed.paymentMethod) setExpPaymentMethod(parsed.paymentMethod);
              if (parsed.date) {
                const d = new Date(parsed.date);
                if (!isNaN(d.getTime())) setExpDate(parsed.date);
              }
          } else {
              const parsed = await parseIncomeFromText(nlInput);
              if (parsed.amount) setIncAmount(parsed.amount.toString());
              if (parsed.category) setIncCategory(parsed.category);
              if (parsed.source) setIncSource(parsed.source);
              if (parsed.date) {
                const d = new Date(parsed.date);
                if (!isNaN(d.getTime())) setIncDate(parsed.date);
              }
          }
          setShowAIInput(false);
          setExpErrors({});
          setIncErrors({});
          setNlInput('');
      } catch (e) {
          alert('Failed to parse text.');
      } finally {
          setIsParsing(false);
      }
  }

  // --- Income Logic ---
  const validateIncome = () => {
    const newErrors: any = {};
    if (!incAmount || parseFloat(incAmount) <= 0) newErrors.amount = "Valid amount required";
    if (!incSource.trim()) newErrors.source = "Source required";
    setIncErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateIncome()) return;
    addIncome({
      amount: parseFloat(incAmount),
      category: incCategory,
      source: incSource.trim(),
      date: incDate,
      recurrence: incRecurrence,
      tenantContact: incCategory === 'Rent' ? tenantContact : undefined
    });
    onClose();
  };

  // --- Date Handler ---
  const handleDateSelect = (selectedDate: Date) => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (activeTab === 'expense') setExpDate(dateStr);
      else setIncDate(dateStr);
  };

  const activeDate = activeTab === 'expense' ? expDate : incDate;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[90vh] h-auto flex flex-col transition-colors pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-700 relative">
            <button 
                onClick={() => setActiveTab('expense')}
                className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${activeTab === 'expense' ? 'text-red-500 border-b-2 border-red-500 bg-red-50/50 dark:bg-red-900/10' : 'text-gray-400 dark:text-slate-500'}`}
            >
                <TrendingDown size={18} />
                <span>{t('Expense')}</span>
            </button>
            <button 
                onClick={() => setActiveTab('income')}
                className={`flex-1 py-4 font-bold text-sm flex items-center justify-center space-x-2 transition-colors ${activeTab === 'income' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/50 dark:bg-teal-900/10' : 'text-gray-400 dark:text-slate-500'}`}
            >
                <TrendingUp size={18} />
                <span>{t('Income')}</span>
            </button>
            <button onClick={onClose} className="absolute right-4 top-3 p-1 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors z-10">
                <X size={16} className="text-gray-600 dark:text-slate-300" />
            </button>
        </div>

        <div className="p-6 overflow-y-auto">
            {activeTab === 'expense' ? (
                <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    {/* AI Magic Fill */}
                    <div className="mb-2">
                        {!showAIInput ? (
                            <button 
                                type="button"
                                onClick={() => setShowAIInput(true)}
                                className="w-full py-2 px-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg flex items-center justify-center space-x-2 border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs font-medium"
                            >
                                <span className="text-lg">✨</span>
                                <span>{t('Magic Fill with AI')}</span>
                            </button>
                        ) : (
                            <div className="space-y-2 bg-purple-50 dark:bg-slate-700/50 p-3 rounded-xl border border-purple-100 dark:border-slate-600">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={nlInput}
                                        onChange={(e) => setNlInput(e.target.value)}
                                        placeholder={t('magic_fill_placeholder')}
                                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-purple-100 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAIParse}
                                        disabled={isParsing}
                                        className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {isParsing ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Amount')}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 dark:text-slate-400 font-bold text-lg">{currency}</span>
                            <input
                            type="number"
                            step="0.01"
                            value={expAmount}
                            onChange={(e) => setExpAmount(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border ${expErrors.amount ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-300 transition-colors`}
                            placeholder="0.00"
                            autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Description')}</label>
                        <input
                        type="text"
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border ${expErrors.description ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors`}
                        placeholder={t('description_placeholder')}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Category')}</label>
                            <select
                            value={expCategory}
                            onChange={(e) => setExpCategory(e.target.value as Category)}
                            className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none text-gray-900 dark:text-white text-sm"
                            >
                            {['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Housing', 'Other'].map(c => (
                                <option key={c} value={c}>{t(c)}</option>
                            ))}
                            </select>
                        </div>
                        
                        <div className="relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Date')}</label>
                            <button 
                                type="button"
                                onClick={() => setShowDatePicker(true)}
                                className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                                <span className="text-sm text-gray-900 dark:text-white truncate">
                                    {new Date(expDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <CalendarIcon size={16} className="text-gray-400 shrink-0" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase">{t('Payment Method')}</label>
                        <div className="flex gap-2">
                            {['Cash', 'Card', 'UPI', 'Other'].map((method) => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setExpPaymentMethod(method as any)}
                                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                                        expPaymentMethod === method 
                                        ? 'bg-red-500 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {t(method)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-red-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-600 shadow-lg shadow-red-500/20 transition-transform active:scale-[0.98] mt-2"
                    >
                        {t('Save Expense')}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleIncomeSubmit} className="space-y-4">
                     {/* AI Magic Fill Income */}
                     <div className="mb-2">
                        {!showAIInput ? (
                            <button 
                                type="button"
                                onClick={() => setShowAIInput(true)}
                                className="w-full py-2 px-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg flex items-center justify-center space-x-2 border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs font-medium"
                            >
                                <span className="text-lg">✨</span>
                                <span>{t('Magic Fill with AI')}</span>
                            </button>
                        ) : (
                            <div className="space-y-2 bg-purple-50 dark:bg-slate-700/50 p-3 rounded-xl border border-purple-100 dark:border-slate-600">
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={nlInput}
                                        onChange={(e) => setNlInput(e.target.value)}
                                        placeholder="e.g. Received 5000 rent from John"
                                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-purple-100 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                                        autoFocus
                                    />
                                    <button 
                                        type="button"
                                        onClick={handleAIParse}
                                        disabled={isParsing}
                                        className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {isParsing ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Amount')}</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 dark:text-slate-400 font-bold text-lg">{currency}</span>
                            <input
                                type="number"
                                value={incAmount}
                                onChange={(e) => setIncAmount(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border ${incErrors.amount ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-2xl font-bold text-gray-900 dark:text-white`}
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">
                            {incCategory === 'Rent' ? t('Tenant Name') : t('Source')}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                            <input
                                type="text"
                                value={incSource}
                                onChange={(e) => setIncSource(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border ${incErrors.source ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white`}
                                placeholder={incCategory === 'Rent' ? "e.g., John Doe" : "e.g., Employer, Bank"}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Category')}</label>
                            <select
                                value={incCategory}
                                onChange={(e) => setIncCategory(e.target.value as IncomeCategory)}
                                className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white text-sm"
                            >
                                {['Salary', 'Rent', 'Interest', 'Business', 'Gift', 'Other'].map(c => (
                                    <option key={c} value={c}>{t(c)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Date')}</label>
                            <button 
                                type="button"
                                onClick={() => setShowDatePicker(true)}
                                className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                            >
                                <span className="text-sm text-gray-900 dark:text-white truncate">
                                    {new Date(incDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <CalendarIcon size={16} className="text-gray-400 shrink-0" />
                            </button>
                        </div>
                    </div>

                    {incCategory === 'Rent' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 uppercase">{t('Tenant Mobile')}</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                                <input
                                    type="tel"
                                    value={tenantContact}
                                    onChange={(e) => setTenantContact(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                                    placeholder="+91..."
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2 uppercase">{t('Recurrence')}</label>
                        <div className="flex gap-2">
                            {['None', 'Monthly', 'Yearly'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setIncRecurrence(r as Recurrence)}
                                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-colors ${
                                        incRecurrence === r
                                        ? 'bg-teal-600 text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {t(r)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-transform active:scale-[0.98] mt-2"
                    >
                        {t('Save Income')}
                    </button>
                </form>
            )}
        </div>

        <DatePicker 
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={handleDateSelect}
            initialDate={new Date(activeDate)}
            title={t('Select Date')}
        />
      </div>
    </div>
  );
};

export default AddTransactionModal;