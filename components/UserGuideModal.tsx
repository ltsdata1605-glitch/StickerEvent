import React from 'react';
import { Info, X, User, ShieldCheck, Database, RefreshCw, BookOpen, CheckCircle2 } from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'staff';
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose, userRole }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Hướng dẫn sử dụng</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Hệ thống In Sticker Event</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Nguyên lý hoạt động */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-800">1. Nguyên lý hoạt động</h3>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed">
                Hệ thống hoạt động dựa trên dữ liệu bảng giá và tồn kho được tải lên bởi Quản lý. 
                Dữ liệu được lưu trữ tập trung trên Cloud (Firebase), cho phép tất cả nhân viên trong cùng một kho 
                truy cập và sử dụng dữ liệu đồng nhất để in sticker giá sản phẩm một cách nhanh chóng và chính xác.
              </p>
            </div>
          </section>

          {/* Chức năng Nhân viên */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-bold text-slate-800">2. Chức năng dành cho Nhân viên</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Tìm kiếm sản phẩm theo mã hoặc tên.',
                'Quét mã vạch bằng Camera để chọn nhanh.',
                'Lọc sản phẩm theo ngành hàng, nhóm hàng.',
                'Tùy chỉnh số lượng sticker cần in.',
                'Lưu danh sách in để sử dụng lại sau này.',
                'Tùy chỉnh bố cục in (1, 2, 4, 10 sticker/trang).'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Chức năng Quản lý */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">3. Chức năng dành cho Quản lý</h3>
            </div>
            <div className="space-y-3">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-sm text-amber-800 font-medium mb-2 italic">* Bao gồm tất cả chức năng của nhân viên và thêm:</p>
                <ul className="space-y-2">
                  {[
                    'Cập nhật bảng giá: Tải file Excel bảng giá lên hệ thống.',
                    'Cập nhật tồn kho: Tải file Excel tồn kho để đồng bộ số lượng.',
                    'Quản lý người dùng: Tạo tài khoản, phân quyền cho nhân viên.',
                    'Quản lý kho: Thiết lập mã kho cho các chi nhánh.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Cách cập nhật dữ liệu */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-800">4. Cách cập nhật dữ liệu & Sử dụng</h3>
            </div>
            <div className="space-y-4">
              <div className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative mb-6">
                  <div className="absolute -left-8 top-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Tải dữ liệu (Dành cho Quản lý)</h4>
                  <p className="text-sm text-slate-600">Truy cập tab "Công cụ", chọn "Tải bảng giá" hoặc "Tải tồn kho" (File Excel .xls hoặc .xlsx).</p>
                </div>
                <div className="relative mb-6">
                  <div className="absolute -left-8 top-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Chọn sản phẩm</h4>
                  <p className="text-sm text-slate-600">Sử dụng thanh tìm kiếm hoặc quét mã vạch để đưa sản phẩm vào danh sách chờ in.</p>
                </div>
                <div className="relative mb-6">
                  <div className="absolute -left-8 top-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Thiết lập in</h4>
                  <p className="text-sm text-slate-600">Chọn số lượng sticker cho từng món, nhấn icon "Bánh răng" để chỉnh font chữ, hiển thị giá gốc/khuyến mãi.</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-8 top-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Xuất PDF & In</h4>
                  <p className="text-sm text-slate-600">Nhấn "In Sticker", chọn bố cục phù hợp. Hệ thống sẽ tạo file PDF để bạn gửi tới máy in.</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
