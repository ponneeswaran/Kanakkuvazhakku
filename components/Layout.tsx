
import React, { ReactNode, useState } from 'react';
import { Home, List, Wallet, MessageCircle, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import AddTransactionModal from './AddTransactionModal';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { t } = useData();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors relative">
      <main className="
        w-full min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors
        pb-20 md:pb-0 landscape:pb-0
        md:pr-20 landscape:pr-20"
      >
        <div className="w-full h-full">
           {children}
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} initialTab={activeTab === 'income' ? 'income' : 'expense'} />}

      {/* Navigation - Bottom on Mobile, Right Sidebar on Tablet/Landscape */}
      <nav className="
        fixed z-50 bg-white dark:bg-slate-900 transition-colors shadow-lg md:shadow-none landscape:shadow-none
        bottom-0 left-0 right-0 border-t border-gray-100 dark:border-slate-800 pb-safe
        md:top-0 md:right-0 md:left-auto md:bottom-0 md:w-20 md:h-screen md:border-t-0 md:border-l md:pb-0
        landscape:top-0 landscape:right-0 landscape:left-auto landscape:bottom-0 landscape:w-20 landscape:h-screen landscape:border-t-0 landscape:border-l landscape:pb-0
      ">
        <div className="
          flex items-center
          justify-between h-16 px-6
          md:flex-col md:justify-center md:h-full md:space-y-8 md:px-0 md:w-full
          landscape:flex-col landscape:justify-center landscape:h-full landscape:space-y-8 landscape:px-0 landscape:w-full
        ">
          
          {/* Home */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'dashboard' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <Home 
              size={24} 
              strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('Home')}</span>
          </button>

          {/* History */}
          <button
            onClick={() => onTabChange('expenses')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'expenses' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <List 
              size={24} 
              strokeWidth={activeTab === 'expenses' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('History')}</span>
          </button>

          {/* Center Add Button */}
          <div className="
            relative -top-5 flex flex-col items-center justify-center
            md:static md:top-auto md:my-4 md:w-full
            landscape:static landscape:top-auto landscape:my-4 landscape:w-full
          ">
             <button 
                onClick={() => setShowAddModal(true)}
                className="w-14 h-14 bg-teal-600 rounded-full shadow-lg shadow-teal-600/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all border-4 border-gray-50 dark:border-slate-900"
                aria-label="Add Transaction"
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
          </div>

          {/* Income */}
          <button
            onClick={() => onTabChange('income')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <Wallet 
              size={24} 
              strokeWidth={activeTab === 'income' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('Income')}</span>
          </button>

          {/* Assistant */}
          <button
            onClick={() => onTabChange('ai')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'ai' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <MessageCircle 
              size={24} 
              strokeWidth={activeTab === 'ai' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('Assistant')}</span>
          </button>

        </div>
      </nav>
    </div>
  );
};

export default Layout;
