import React from 'react';
import { Home, ScanLine, Printer, Settings, Wrench } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'home' | 'tools';
  onTabChange: (tab: 'home' | 'tools') => void;
  onScanClick: () => void;
  onPrintClick: () => void;
  onSettingsClick: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  onScanClick,
  onPrintClick,
  onSettingsClick,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <button
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          activeTab === 'home' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Home className="w-6 h-6" />
        <span className="text-[10px] font-medium">Trang chủ</span>
      </button>
      
      <button
        onClick={() => onTabChange('tools')}
        className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
          activeTab === 'tools' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <Wrench className="w-6 h-6" />
        <span className="text-[10px] font-medium">Công cụ</span>
      </button>

      <button
        onClick={onScanClick}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900 relative"
      >
        <div className="absolute -top-5 bg-indigo-600 text-white p-3 rounded-full shadow-md border-4 border-white">
          <ScanLine className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-medium mt-6">Quét mã</span>
      </button>

      <button
        onClick={onPrintClick}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900"
      >
        <Printer className="w-6 h-6" />
        <span className="text-[10px] font-medium">In tem</span>
      </button>

      <button
        onClick={onSettingsClick}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900"
      >
        <Settings className="w-6 h-6" />
        <span className="text-[10px] font-medium">Cài đặt</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
