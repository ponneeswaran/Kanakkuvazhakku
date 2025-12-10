
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Trash2, Search, RotateCcw, ArrowRight } from 'lucide-react';
import { Category, Expense, Income } from '../types';

interface ExpenseListProps {
  initialCategory?: Category | 'All';
  onNavigateToBudget?: () => void;
}

type TransactionItem = (Expense & { type: 'expense' }) | (Income & { type: 'income' });

interface SwipeableItemProps {
  item: TransactionItem;
  currency: string;
  onDelete: (id: string, type: 'expense' | 'income') => void;
  t: (key: string) => string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ item, currency, onDelete, t }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const itemRef = useRef<HTMLDivElement>(null);
  
  const DELETE_BTN_WIDTH = 80;
  const THRESHOLD = 40;
  const isExpense = item.type === 'expense';

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].clientX;
    const diff = x - startX.current;
    
    if (diff < 0 && diff > -150) {
      setOffsetX(diff);
    } else if (diff > 0 && offsetX < 0) {
       setOffsetX(Math.min(0, -DELETE_BTN_WIDTH + diff));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX < -THRESHOLD) {
      setOffsetX(-DELETE_BTN_WIDTH);
    } else {
      setOffsetX(0);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const x = e.clientX;
    const diff = x - startX.current;
    
    if (diff < 0 && diff > -150) {
      setOffsetX(diff);
    } else if (diff > 0 && offsetX < 0) {
       setOffsetX(Math.min(0, -DELETE_BTN_WIDTH + diff));
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offsetX < -THRESHOLD) {
      setOffsetX(-DELETE_BTN_WIDTH);
    } else {
      setOffsetX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
        setIsDragging(false);
        setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-3 select-none">
      <div 
        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center rounded-r-xl"
        style={{ width: `${DELETE_BTN_WIDTH}px` }}
        onClick={() => onDelete(item.id, item.type)}
      >
        <Trash2 className="text-white" size={20} />
      </div>

      <div
        ref={itemRef}
        className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700 flex justify-between items-center relative z-10 transition-transform duration-200 ease-out"
        style={{ 
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center space-x-3 pointer-events-none">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0
            ${!isExpense ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' :
              item.category === 'Food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
              item.category === 'Transport' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'}
          `}>
            {isExpense ? item.category[0] : (item.category === 'Salary' ? '💰' : '📥')}
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-white line-clamp-1">
                {isExpense ? (item as Expense).description : (item as Income).source}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
                {t(item.category)} • {isExpense ? (item as Expense).paymentMethod : (item as Income).recurrence}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 pointer-events-none">
          <span className={`font-bold ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`}>
            {isExpense ? '-' : '+'}{currency}{item.amount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ExpenseList: React.FC<ExpenseListProps> = ({ initialCategory = 'All', onNavigateToBudget }) => {
  const { expenses, incomes, deleteExpense, restoreExpense, deleteIncome, currency, t } = useData();
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deletedItem, setDeletedItem] = useState<{ item: any, type: 'expense' | 'income' } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFilterCategory(initialCategory);
  }, [initialCategory]);

  const allTransactions = useMemo(() => {
      const exps = expenses.map(e => ({ ...e, type: 'expense' as const }));
      const incs = incomes.map(i => ({ ...i, type: 'income' as const }));
      return [...exps, ...incs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, incomes]);

  const filteredTransactions = allTransactions
    .filter(item => {
        if (filterCategory === 'All') return true;
        // If filter is active, only show expenses matching category
        return item.category === filterCategory;
    })
    .filter(item => {
        const text = item.type === 'expense' ? (item as Expense).description : (item as Income).source;
        return text.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Group by date
  const groupedTransactions: Record<string, typeof allTransactions> = {};
  filteredTransactions.forEach(item => {
      const date = new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groupedTransactions[date]) groupedTransactions[date] = [];
      groupedTransactions[date].push(item);
  });

  const handleDelete = (id: string, type: 'expense' | 'income') => {
    if (type === 'expense') {
        const item = expenses.find(e => e.id === id);
        if (item) {
            setDeletedItem({ item, type });
            deleteExpense(id);
        }
    } else {
        const item = incomes.find(i => i.id === id);
        if (item) {
             if (confirm("Delete this income record?")) {
                 deleteIncome(id);
             }
             return; 
        }
    }

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
        setDeletedItem(null);
    }, 4000);
  };

  const handleUndo = () => {
    if (deletedItem && deletedItem.type === 'expense') {
        restoreExpense(deletedItem.item);
        setDeletedItem(null);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  return (
    <div className="p-6 space-y-4 animate-fade-in relative min-h-[80vh]">
       <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('History')}</h1>
        {onNavigateToBudget && (
            <button 
                onClick={onNavigateToBudget}
                className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1"
            >
                <span>{t('Budget')}</span>
                <ArrowRight size={16} />
            </button>
        )}
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-0 z-10 transition-colors">
        <div className="flex space-x-2 mb-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={t('Search transactions...')} 
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 border border-transparent dark:border-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex overflow-x-auto no-scrollbar space-x-2 pb-1 w-full flex-nowrap">
            <button 
                onClick={() => setFilterCategory('All')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === 'All' ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}
            >
                {t('All')}
            </button>
             {['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Housing', 'Other'].map(c => (
                <button
                    key={c}
                    onClick={() => setFilterCategory(c as Category)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategory === c ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}
                >
                    {t(c)}
                </button>
             ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
          {Object.entries(groupedTransactions).length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-500">
                  <p>{t('No transactions found.')}</p>
              </div>
          ) : (
             Object.entries(groupedTransactions).map(([date, items]) => (
                 <div key={date}>
                     <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 ml-1">{date}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map(item => (
                            <SwipeableItem 
                                key={item.id}
                                item={item}
                                currency={currency}
                                onDelete={handleDelete}
                                t={t}
                            />
                        ))}
                     </div>
                 </div>
             ))
          )}
      </div>

      {/* Undo Snackbar */}
      <div 
        className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 bg-gray-900 dark:bg-slate-700 text-white p-4 rounded-xl shadow-lg flex justify-between items-center z-50 transition-all duration-300 transform ${deletedItem ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
      >
        <span className="text-sm">Transaction deleted</span>
        <button 
            onClick={handleUndo}
            className="text-teal-400 font-bold text-sm flex items-center space-x-1 hover:text-teal-300 transition-colors"
        >
            <RotateCcw size={16} />
            <span>Undo</span>
        </button>
      </div>
    </div>
  );
};

export default ExpenseList;
