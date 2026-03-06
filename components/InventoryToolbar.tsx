import React, { useMemo } from 'react';
import { InventoryItem } from '../types';

interface InventoryToolbarProps {
  inventory: InventoryItem[];
  filters: {
    maSieuThi: string;
    nganhHang: string;
    nhomHang: string;
    maSanPham: string;
    tenSanPham: string;
  };
  onFilterChange: (key: string, value: string) => void;
  onClearFilters: () => void;
}

const InventoryToolbar: React.FC<InventoryToolbarProps> = ({ 
  inventory, 
  filters, 
  onFilterChange,
  onClearFilters
}) => {
  const options = useMemo(() => {
    const maSieuThi = Array.from(new Set(inventory.map(item => item.maSieuThi))).sort();
    const nganhHang = Array.from(new Set(inventory.map(item => item.nganhHang))).sort();
    const nhomHang = Array.from(new Set(inventory.map(item => item.nhomHang))).sort();
    
    return { maSieuThi, nganhHang, nhomHang };
  }, [inventory]);

  if (inventory.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Bộ lọc tồn kho</h3>
        <button 
          onClick={onClearFilters}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Xóa bộ lọc
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Mã siêu thị</label>
          <select 
            value={filters.maSieuThi}
            onChange={(e) => onFilterChange('maSieuThi', e.target.value)}
            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả siêu thị</option>
            {options.maSieuThi.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Ngành hàng</label>
          <select 
            value={filters.nganhHang}
            onChange={(e) => onFilterChange('nganhHang', e.target.value)}
            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả ngành hàng</option>
            {options.nganhHang.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Nhóm hàng</label>
          <select 
            value={filters.nhomHang}
            onChange={(e) => onFilterChange('nhomHang', e.target.value)}
            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả nhóm hàng</option>
            {options.nhomHang.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Mã sản phẩm</label>
          <input 
            type="text"
            value={filters.maSanPham}
            onChange={(e) => onFilterChange('maSanPham', e.target.value)}
            placeholder="Tìm mã SP..."
            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500">Tên sản phẩm</label>
          <input 
            type="text"
            value={filters.tenSanPham}
            onChange={(e) => onFilterChange('tenSanPham', e.target.value)}
            placeholder="Tìm tên SP..."
            className="w-full text-sm border-slate-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryToolbar;
