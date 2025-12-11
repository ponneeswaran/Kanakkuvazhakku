
import React from 'react';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, Moon, Sun, ChevronDown, Globe, DollarSign, Check, Database } from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { theme, setTheme, currency, setCurrency, language, setLanguage, t, loadDemoData } = useData();

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLoadDemo = () => {
      if (confirm("This will replace all your current data with dummy demo data. Are you sure?")) {
          loadDemoData();
          alert("Demo data loaded successfully!");
          onBack();
      }
  }

  return (
    <div className="h-full flex flex-col animate-fade-in bg-gray-50 dark:bg-slate-900 transition-colors">
      <div className="shrink-0 p-6 pb-2 z-10 bg-gray-50 dark:bg-slate-900 transition-colors">
        <header className="flex items-center space-x-3 py-2">
            <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
            <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Settings')}</h1>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 no-scrollbar">
        <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Theme Section - Toggle */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center transition-colors">
                <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-900 text-indigo-300'}`}>
                    {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
                <div>
                    <h2 className="font-semibold text-gray-800 dark:text-white">{t('Appearance')}</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{theme === 'light' ? t('Light') : t('Dark')}</p>
                </div>
                </div>
                
                <button 
                onClick={toggleTheme}
                className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${theme === 'light' ? 'bg-gray-300' : 'bg-teal-600'}`}
                >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform duration-300 ${theme === 'light' ? 'translate-x-0' : 'translate-x-6'}`}></div>
                </button>
            </section>

            {/* Language Section */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                    <Globe size={20} />
                </div>
                <h2 className="font-semibold text-gray-800 dark:text-white">{t('Language')}</h2>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                {languages.map(lang => (
                    <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
                        language === lang.code 
                        ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/50' 
                        : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                    >
                    <div className="flex flex-col items-start">
                        <span className={`text-sm font-medium ${language === lang.code ? 'text-teal-800 dark:text-teal-200' : 'text-gray-700 dark:text-slate-300'}`}>{lang.nativeName}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{lang.name}</span>
                    </div>
                    {language === lang.code && <Check size={18} className="text-teal-600 dark:text-teal-400" />}
                    </button>
                ))}
                </div>
            </section>

            {/* Currency Section */}
            <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                    <DollarSign size={20} />
                </div>
                <h2 className="font-semibold text-gray-800 dark:text-white">{t('Primary Currency')}</h2>
                </div>

                <div className="relative">
                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl appearance-none text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        {currencies.map(curr => (
                            <option key={curr.code} value={curr.symbol}>
                                {curr.symbol} - {curr.name} ({curr.code})
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
                </div>
            </section>

             {/* Demo Data Section */}
             <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                    <Database size={20} />
                </div>
                <h2 className="font-semibold text-gray-800 dark:text-white">Developer Options</h2>
                </div>
                
                <button
                    onClick={handleLoadDemo}
                    className="w-full py-3 px-4 bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-300 font-bold rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors border border-purple-100 dark:border-purple-800"
                >
                    Load Demo Data
                </button>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">
                    This will replace your current data with sample entries for testing.
                </p>
            </section>
        </div>
        
        <div className="mt-auto pt-6 text-center">
            <p className="text-xs text-gray-400 dark:text-slate-600">App Version 1.0.0 (Offline Mode)</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
