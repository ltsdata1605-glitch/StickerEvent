import { Product } from '../types';
import * as XLSX from 'xlsx';

function parseBonus(bonusCode: string | undefined | null): { thuongERP: number; thuongNong: number } {
  if (!bonusCode || typeof bonusCode !== 'string') {
    return { thuongERP: 0, thuongNong: 0 };
  }
  
  // Strip any leading non-digit characters to handle prefixes like 'ĐD'
  const cleanedCode = bonusCode.trim().replace(/^[^\d]*/, '');

  // Regex to capture: 1. initial digits (ERP), 2. letters (brand), 3. subsequent digits (Hot Bonus), 4. the rest
  const regex = /^(\d+)([A-Z]+)(\d*)?(.*)?$/;
  const matches = cleanedCode.match(regex);

  if (!matches) {
    return { thuongERP: 0, thuongNong: 0 };
  }

  const erpPoints = parseInt(matches[1] || '0', 10);
  const hotBonusPoints = parseInt(matches[3] || '0', 10);

  return {
    thuongERP: erpPoints * 1000,
    thuongNong: hotBonusPoints * 1000,
  };
}

export function parseCurrency(value: string | number | undefined | null): number {
  if (typeof value === 'number') {
    return value;
  }
  if (!value || typeof value !== 'string') {
    return 0;
  }
  // Removes currency symbols, commas, and any non-digit characters.
  const numericString = value.replace(/[^\d]/g, '');
  return parseInt(numericString, 10) || 0;
}


const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

// Helper function to check if a value looks like a valid MSP (mostly digits, length > 3)
const isValidMsp = (value: any): boolean => {
    if (!value) return false;
    const str = String(value).trim();
    // Must be at least 4 chars and contain at least one digit to be a product code
    return str.length >= 4 && /\d/.test(str);
};

export const parseProductFile = (file: File): Promise<{ products: Product[], exportDate: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Try to find export date from the first few rows (usually in column AI/34)
        // We scan the first 5 rows to find a cell containing "Ngày in:"
        let exportDate = 'N/A';
        for(let i=0; i<Math.min(json.length, 5); i++) {
            const row = json[i];
            const dateCellIndex = row.findIndex((cell: any) => String(cell).includes('Ngày in:'));
            if (dateCellIndex !== -1) {
                exportDate = String(row[dateCellIndex]);
                break;
            }
        }

        // Process ALL rows (removed .slice(1)) to handle files starting with data at Row 1
        const products: Product[] = json.map((row) => {
          // Default fixed indices
          const colA = row[0] || '';
          const colB = row[1] || '';
          const colE = row[4] || '0';
          const colF = row[5] || '0';
          const colH = row[7] || '';
          
          // SMART PARSING LOGIC
          // Find the "Anchor" column which is "Ngày in:" (Date)
          let dateIndex = -1;
          for (let i = row.length - 1; i > 20; i--) { // Scan backwards from end, assuming Date is towards the right
              if (String(row[i]).toLowerCase().includes('ngày in')) {
                  dateIndex = i;
                  break;
              }
          }

          let colAI, colAJ, colAK;

          if (dateIndex !== -1) {
              // If Anchor found, use relative positions
              colAI = row[dateIndex];         // Date
              colAJ = row[dateIndex + 1];     // Bonus Code (Internal ID)
              colAK = row[dateIndex + 2];     // MSP (Barcode)
          } else {
              // Fallback to fixed indices if Anchor not found
              colAI = row[34] || '';
              colAJ = row[35] || '';
              colAK = row[36] || '';
              
              // Fallback Level 2: If MSP at 36 is empty, look at adjacent columns (37 or 35)
              // This handles slight column shifts
              if (!isValidMsp(colAK)) {
                  if (isValidMsp(row[37])) colAK = row[37]; // Shifted Right
                  else if (isValidMsp(row[35]) && !String(row[35]).match(/[a-zA-Z]/)) colAK = row[35]; // Shifted Left (check if not bonus code)
              }
              
              // Fallback Level 3: Scan last 10 columns for something that looks like a barcode
              if (!isValidMsp(colAK)) {
                  for(let i = row.length - 1; i > 30; i--) {
                      const val = row[i];
                      // Strict check: only digits, length > 8 (typical barcode)
                      if (val && String(val).match(/^\d{8,}$/)) {
                          colAK = val;
                          break;
                      }
                  }
              }
          }

          const { thuongERP, thuongNong } = parseBonus(colAJ);
          const tongThuong = thuongNong * 0.4 + thuongERP;

          return {
            msp: String(colAK || '').trim(),
            sanPham: `${colA} ${colB}`.trim(),
            thuongERP: thuongERP,
            thuongNong: thuongNong,
            tongThuong: tongThuong,
            giaGoc: formatCurrency(parseCurrency(colE)),
            giaGiam: formatCurrency(parseCurrency(colF)),
            khuyenMai: String(colH),
            ngayIn: String(colAI),
            selected: false,
            quantity: 1,
          };
        }).filter(p => p.msp && p.msp !== 'undefined' && p.msp.length > 0); // Strict filter removes empty rows or headers without MSP

        resolve({ products, exportDate });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

// --- IndexedDB Persistence ---

const DB_NAME = 'ProductSearchDB';
const DB_VERSION = 1;
const STORE_NAME = 'appData';

interface FileInfo {
  fileName: string | null;
  uploadTimestamp: Date | null;
  fileExportDate: string | null;
}

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject('Error opening IndexedDB.');
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const getStore = async (mode: IDBTransactionMode) => {
  const db = await getDB();
  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
};

export const saveData = async (products: Product[], fileInfo: FileInfo): Promise<void> => {
  const store = await getStore('readwrite');
  store.put(products, 'products');
  store.put(fileInfo, 'fileInfo');
};

export const saveDisplayedProducts = async (products: Product[]): Promise<void> => {
    const store = await getStore('readwrite');
    store.put(products, 'displayedProducts');
};

export const saveEmployeeName = async (name: string): Promise<void> => {
    const store = await getStore('readwrite');
    store.put(name, 'employeeName');
};

export const loadData = async (): Promise<{ products: Product[]; displayedProducts: Product[]; fileInfo: FileInfo | null; employeeName: string; } | null> => {
    try {
        const store = await getStore('readonly');
        const productsReq = store.get('products');
        const displayedProductsReq = store.get('displayedProducts');
        const fileInfoReq = store.get('fileInfo');
        const employeeNameReq = store.get('employeeName');

        return new Promise((resolve) => {
            const results: any = { products: [], displayedProducts: [], fileInfo: null, employeeName: '' };
            let completed = 0;
            const totalRequests = 4;

            const checkCompletion = () => {
                completed++;
                if (completed === totalRequests) {
                   resolve(results);
                }
            };
            
            const onError = () => {
                // In case of error, we still need to "complete" to resolve the promise.
                checkCompletion();
            };

            productsReq.onsuccess = () => {
                // FIX: Defensively check if the loaded data from IndexedDB is an array.
                // Data corruption could lead to an object being stored instead of an array,
                // causing a type error when `setAllProducts` is called in App.tsx.
                results.products = Array.isArray(productsReq.result) ? productsReq.result : [];
                checkCompletion();
            };
            displayedProductsReq.onsuccess = () => {
                // FIX: Defensively check if the loaded data from IndexedDB is an array.
                results.displayedProducts = Array.isArray(displayedProductsReq.result) ? displayedProductsReq.result : [];
                checkCompletion();
            };
            fileInfoReq.onsuccess = () => {
                results.fileInfo = fileInfoReq.result;
                checkCompletion();
            };
             employeeNameReq.onsuccess = () => {
                results.employeeName = employeeNameReq.result || '';
                checkCompletion();
            };
            
            productsReq.onerror = onError;
            displayedProductsReq.onerror = onError;
            fileInfoReq.onerror = onError;
            employeeNameReq.onerror = onError;
        });
    } catch (e) {
        console.error("Failed to load data from IndexedDB", e);
        return null;
    }
};

export const clearData = async (): Promise<void> => {
  const store = await getStore('readwrite');
  store.delete('products');
  store.delete('fileInfo');
  store.delete('displayedProducts');
};