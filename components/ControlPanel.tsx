import React, { useMemo } from 'react';
import { Product } from '../types';
import FileUpload from './FileUpload';
import SearchBar from './SearchBar';
import { PrintIcon, SettingsIcon, StarIcon, TagIcon, TrashIcon, ExportIcon, ImportIcon, PenSquareIcon, InventoryIcon } from './Icons';

interface ControlPanelProps {
    employeeName: string;
    isEditingEmployeeName: boolean;
    searchQuery: string;
    suggestions: Product[];
    showNoResults: boolean;
    allProducts: Product[];
    displayedProducts: Product[];
    isLoading: boolean;
    fileName: string | null;
    isMobile: boolean;

    onEmployeeNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEmployeeName: () => void;
    onEmployeeNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onSetIsEditingEmployeeName: (isEditing: boolean) => void;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenScanner: () => void;
    onSuggestionClick: (product: Product) => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onInventoryFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onShowTopBonus: () => void;
    onShowTopDiscount: () => void;
    onOpenManualInput: () => void;
    onReset: () => void;
    onTriggerImport: () => void;
    onExport: () => void;
    onOpenPrintSettings: () => void;
    onPrintSelected: () => void;
    onPrintAll: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = (props) => {
    const selectedCount = useMemo(() => props.displayedProducts.filter(p => p.selected).length, [props.displayedProducts]);
    const isEmployeeNameEmpty = !props.employeeName || props.employeeName.trim() === '';
    
    return (
        <aside className="w-full lg:w-96 lg:flex-shrink-0 bg-white p-6 rounded-2xl shadow-lg border border-slate-200 self-start space-y-6">
            <div className="flex items-end gap-4">
                <div className="flex-grow">
                    <label htmlFor="employee-name-input" className="block text-sm font-medium text-slate-700 mb-1">
                        Thông tin người in <span className="text-red-500">*</span>
                    </label>
                    {props.isEditingEmployeeName || !props.employeeName ? (
                        <div className="relative">
                            <input
                                id="employee-name-input"
                                type="text"
                                placeholder="Nhập tên/mã NV (Bắt buộc)"
                                value={props.employeeName}
                                onChange={props.onEmployeeNameChange}
                                onBlur={props.onSaveEmployeeName}
                                onKeyDown={props.onEmployeeNameKeyDown}
                                className={`w-full px-3 py-2 text-base border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isEmployeeNameEmpty ? 'border-red-300 bg-red-50 placeholder-red-300' : 'border-slate-300'}`}
                                autoFocus={!props.employeeName}
                            />
                            {isEmployeeNameEmpty && (
                                <p className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-medium">Cần nhập thông tin để tìm kiếm</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 h-10 px-1 border border-transparent">
                            <p className="font-bold text-lg text-slate-900 truncate" title={props.employeeName}>{props.employeeName}</p>
                            <button
                                onClick={() => props.onSetIsEditingEmployeeName(true)}
                                className="text-sm text-indigo-600 hover:underline focus:outline-none flex-shrink-0"
                            >
                                (Sửa)
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 flex gap-2">
                    <FileUpload 
                        onFileChange={props.onFileChange} 
                        fileName={props.fileName} 
                        disabled={props.isLoading} 
                    />
                    <div className="relative">
                        <input
                            type="file"
                            id="inventory-file-input"
                            onChange={props.onInventoryFileChange}
                            accept=".xlsx, .xls"
                            className="hidden"
                            disabled={props.isLoading}
                        />
                        <label
                            htmlFor="inventory-file-input"
                            className={`flex items-center justify-center p-2 rounded-lg border-2 border-dashed transition-all cursor-pointer h-10 w-10 ${props.isLoading ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-white border-indigo-200 hover:border-indigo-400 text-indigo-600'}`}
                            title="Nhập file tồn kho (.xlsx, .xls)"
                        >
                            <InventoryIcon className="h-5 w-5" />
                        </label>
                    </div>
                </div>
            </div>

            <div className={isEmployeeNameEmpty ? "opacity-60 pointer-events-none grayscale" : ""}>
                <SearchBar
                    searchQuery={props.searchQuery}
                    onSearchChange={props.onSearchChange}
                    onIconClick={props.onOpenScanner}
                    disabled={props.allProducts.length === 0 || props.isLoading || isEmployeeNameEmpty}
                    suggestions={props.suggestions}
                    onSuggestionClick={props.onSuggestionClick}
                    showNoResults={props.showNoResults}
                />
            </div>

             {props.allProducts.length > 0 && !props.isLoading && (
                 <>
                    <div className="pt-4 border-t border-slate-200">
                         <h3 className="text-base font-semibold text-slate-800 mb-3">Công cụ nhanh</h3>
                         <div className="grid grid-cols-2 gap-3">
                             <button onClick={props.onShowTopBonus} disabled={isEmployeeNameEmpty} title="Lọc 100 sản phẩm có tổng thưởng cao nhất" className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 h-10 px-3 py-2 disabled:opacity-50">
                                <StarIcon className="h-4 w-4 text-amber-500" /> Top Thưởng
                            </button>
                            <button onClick={props.onShowTopDiscount} disabled={isEmployeeNameEmpty} title="Lọc 100 sản phẩm có mức giảm giá nhiều nhất" className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 h-10 px-3 py-2 disabled:opacity-50">
                                <TagIcon className="h-4 w-4 text-green-600" /> Top Giảm
                            </button>
                            <button onClick={props.onOpenManualInput} title="Nhập sản phẩm thủ công để in" className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 h-10 px-3 py-2 col-span-2">
                                <PenSquareIcon className="h-4 w-4 text-blue-600" /> Nhập sản phẩm thủ công
                            </button>
                         </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200">
                        <h3 className="text-base font-semibold text-slate-800 mb-3">Thao tác</h3>
                        <div className="flex items-center gap-2 mb-3">
                            <button onClick={props.onTriggerImport} title="Nhập danh sách sản phẩm từ file .json" className="flex-1 inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 h-9 px-3 py-2">
                                <ImportIcon className="h-4 w-4 text-slate-600" />
                                Nhập
                            </button>
                            <button onClick={props.onExport} disabled={props.displayedProducts.length === 0} title="Xuất danh sách sản phẩm hiện tại ra file .json" className="flex-1 inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 h-9 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <ExportIcon className="h-4 w-4 text-slate-600" />
                                Xuất
                            </button>
                            <button onClick={props.onReset} disabled={props.displayedProducts.length === 0} title="Xóa danh sách" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0 disabled:opacity-50 disabled:cursor-not-allowed">
                                <TrashIcon className="h-4 w-4 text-slate-600" />
                            </button>
                             <button onClick={props.onOpenPrintSettings} title="Tùy chỉnh thông tin hiển thị trên sticker" className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 hover:text-slate-900 h-9 w-9 p-0">
                                <SettingsIcon className="h-4 w-4 text-slate-600" />
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={props.onPrintSelected} disabled={selectedCount === 0} className="w-full inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-indigo-600 text-indigo-50 hover:bg-indigo-700 h-10 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <PrintIcon className="h-4 w-4" /> In đã chọn ({selectedCount})
                            </button>
                            <button onClick={props.onPrintAll} disabled={props.displayedProducts.length === 0} className="w-full inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-indigo-600 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 h-10 px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                In tất cả ({props.displayedProducts.length})
                            </button>
                        </div>
                    </div>
                </>
             )}
        </aside>
    );
};

export default ControlPanel;