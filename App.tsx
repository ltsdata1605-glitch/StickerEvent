
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Product } from './types';
import { PrintSettings } from './services/printService';
import { parseProductFile, saveData, loadData, clearData, saveEmployeeName, parseCurrency, saveDisplayedProducts } from './services/fileParser';
import { printPriceTags } from './services/printService';
import ResultsDisplay from './components/ResultsDisplay';
import { LogoIcon, CheckCircleIcon, WarningIcon } from './components/Icons';
import Scanner from './components/Scanner';
import PrintSettingsModal from './components/PrintSettingsModal';
import LayoutSelectionModal from './components/LayoutSelectionModal';
import ManualInputModal from './components/ManualInputModal';
import ControlPanel from './components/ControlPanel';
import PdfPreviewModal from './components/PdfPreviewModal';

export default function App(): React.JSX.Element {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showNoResults, setShowNoResults] = useState(false);
  const [uploadTimestamp, setUploadTimestamp] = useState<Date | null>(null);
  const [fileExportDate, setFileExportDate] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [duplicateError, setDuplicateError] = useState<boolean>(false);
  const [highlightedMsp, setHighlightedMsp] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [isEditingEmployeeName, setIsEditingEmployeeName] = useState(false);
  const debounceTimeout = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  const [isPrintSettingsOpen, setIsPrintSettingsOpen] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
    // Default settings with all options enabled.
    const masterDefaults: PrintSettings = {
        showOriginalPrice: true,
        showPromotion: true,
        showBonus: true,
        showQrCode: true,
        showEmployeeName: true,
        sortByName: true,
        shortenPrice: true,
        tagsPerPage: 4, // Default layout if nothing is saved
        customFontData: null,
        customFontName: null,
        customSecondaryFontData: null,
        customSecondaryFontName: null,
        stickerStyle: 'default'
    };

    try {
        const savedSettingsJSON = localStorage.getItem('printSettings');
        if (savedSettingsJSON) {
            const savedSettings = JSON.parse(savedSettingsJSON);
            // Override all boolean settings with master defaults, but keep saved layout and font info.
            return {
                ...masterDefaults,
                shortenPrice: typeof savedSettings.shortenPrice === 'boolean' ? savedSettings.shortenPrice : masterDefaults.shortenPrice,
                tagsPerPage: savedSettings.tagsPerPage || masterDefaults.tagsPerPage,
                customFontData: savedSettings.customFontData || null,
                customFontName: savedSettings.customFontName || null,
                customSecondaryFontData: savedSettings.customSecondaryFontData || null,
                customSecondaryFontName: savedSettings.customSecondaryFontName || null,
                stickerStyle: savedSettings.stickerStyle || 'default'
            };
        }
    } catch (e) {
        console.error("Could not load print settings from localStorage", e);
    }
    
    // Return master defaults for a new session.
    return masterDefaults;
  });
  
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [printAction, setPrintAction] = useState<'selected' | 'all' | 'manual' | null>(null);
  const [productToPrint, setProductToPrint] = useState<Product | null>(null);
  const [productsForPrintingSession, setProductsForPrintingSession] = useState<Product[]>([]);
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);

  useEffect(() => {
    try {
        localStorage.setItem('printSettings', JSON.stringify(printSettings));
    } catch (e) {
        console.error("Could not save print settings to localStorage", e);
    }
  }, [printSettings]);

  useEffect(() => {
    const initializeApp = async () => {
      const savedData = await loadData();
      if (savedData) {
        setAllProducts(savedData.products || []);
        setDisplayedProducts(savedData.displayedProducts || []);
        if(savedData.fileInfo && savedData.fileInfo.fileName) {
          const savedFileNames = savedData.fileInfo.fileName;
          const fileList = savedFileNames.split(',').map(f => f.trim()).filter(Boolean);
          if (fileList.length > 1) {
              setFileName(`${fileList.length} tệp đã được tải lên`);
          } else {
              setFileName(savedFileNames);
          }
          setUploadTimestamp(savedData.fileInfo.uploadTimestamp ? new Date(savedData.fileInfo.uploadTimestamp) : null);
          setFileExportDate(savedData.fileInfo.fileExportDate);
        }
        const name = savedData.employeeName || '';
        setEmployeeName(name);
        if (!name) {
          setIsEditingEmployeeName(true);
        }
      } else {
        setIsEditingEmployeeName(true);
      }
      setIsInitializing(false);
    };
    initializeApp();
  }, []);

  useEffect(() => {
    // Do not save to DB during initial load, wait for data to be restored first.
    if (!isInitializing) {
      saveDisplayedProducts(displayedProducts);
    }
  }, [displayedProducts, isInitializing]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsLoading(true);
      setError(null);
      await clearData();
      setAllProducts([]);
      setDisplayedProducts([]);
      setFileName(null);
      setSearchQuery('');
      setUploadTimestamp(null);
      setFileExportDate(null);
      
      try {
        let latestExportDate: string | null = null;
        const fileNames: string[] = [];
        const productMap = new Map<string, Product>();
        let partialError = null;

        // Iterate directly over the FileList. `for...of` is supported and preserves the `File` type.
        for (const file of files) {
          fileNames.push(file.name);
          try {
            const { products, exportDate } = await parseProductFile(file);
            for (const product of products) {
              if (!productMap.has(product.msp)) {
                productMap.set(product.msp, product);
              }
            }
            if (!latestExportDate || (exportDate && exportDate > latestExportDate)) {
              latestExportDate = exportDate;
            }
          } catch (fileParseError) {
            console.error(`Lỗi khi xử lý tệp ${file.name}:`, fileParseError);
            partialError = `Lỗi khi xử lý tệp '${file.name}'. Các tệp hợp lệ khác đã được tải lên.`;
          }
        }

        const combinedProducts = Array.from(productMap.values());
        if (combinedProducts.length === 0 && partialError) {
            setError(partialError || 'Không có sản phẩm nào được tải lên. Vui lòng kiểm tra lại định dạng tệp.');
            setIsLoading(false);
            if (event.target) event.target.value = '';
            return;
        } else if (partialError) {
            setError(partialError);
        }

        const newUploadTimestamp = new Date();
        setAllProducts(combinedProducts);

        const fileNamesForStorage = fileNames.join(', ');
        let displayFileName: string | null = null;
        if (fileNames.length === 1) {
            displayFileName = fileNames[0];
        } else if (fileNames.length > 1) {
            displayFileName = `${fileNames.length} tệp đã được tải lên`;
        }
        setFileName(displayFileName);
        
        setUploadTimestamp(newUploadTimestamp);
        setFileExportDate(latestExportDate);
        
        await saveData(combinedProducts, {
          fileName: fileNamesForStorage,
          uploadTimestamp: newUploadTimestamp,
          fileExportDate: latestExportDate
        });
      } catch (err) {
        setError('Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
        console.error(err);
      } finally {
        setIsLoading(false);
        if (event.target) {
            event.target.value = '';
        }
      }
    }
  }, []);
  
  const handleEmployeeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmployeeName(e.target.value);
  };
  
  const handleSaveEmployeeName = useCallback(() => {
    const trimmedName = employeeName.trim();
    setEmployeeName(trimmedName);
    saveEmployeeName(trimmedName);
    if (trimmedName) {
      setIsEditingEmployeeName(false);
    }
  }, [employeeName]);
  
  const handleEmployeeNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSuggestions([]);
      setShowNoResults(false);
      return;
    }

    debounceTimeout.current = window.setTimeout(() => {
      const filteredSuggestions = allProducts.filter(p =>
        p.msp?.trim().toLowerCase().includes(query) ||
        p.sanPham?.trim().toLowerCase().includes(query)
      ).slice(0, 10);
      
      setSuggestions(filteredSuggestions);
      setShowNoResults(query.length > 0 && filteredSuggestions.length === 0);
    }, 200);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchQuery, allProducts]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setDuplicateError(false);
    setShowNoResults(false);
  };
  
  const handleSuggestionClick = (product: Product) => {
    setDuplicateError(false);
    const existingMspSet = new Set(displayedProducts.map(p => p.msp));
    
    if (existingMspSet.has(product.msp)) {
        setDuplicateError(true);
        const mspToHighlight = product.msp;
        setHighlightedMsp(mspToHighlight);
        
        const element = document.querySelector(`[data-msp="${mspToHighlight}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setTimeout(() => {
            setHighlightedMsp(null);
        }, 2000);
    } else {
        setDisplayedProducts(prevProducts => [{...product, selected: false, quantity: 1}, ...prevProducts]);
    }
    setSearchQuery('');
    setSuggestions([]);
    setShowNoResults(false);
  };

  const handleScanSuccess = (scannedCode: string): boolean => {
    const product = allProducts.find(p => p.msp === scannedCode);

    if (!product) {
      return false; // Product not found in the master list
    }

    setDisplayedProducts(prevProducts => {
      const existingProductIndex = prevProducts.findIndex(p => p.msp === scannedCode);

      if (existingProductIndex > -1) {
        // Product exists, increment quantity
        const newProducts = [...prevProducts]; // Create a copy
        const existingProduct = newProducts[existingProductIndex];
        newProducts[existingProductIndex] = { ...existingProduct, quantity: existingProduct.quantity + 1 };
        return newProducts;
      } else {
        // Product does not exist, add it to the top
        return [{ ...product, selected: false, quantity: 1 }, ...prevProducts];
      }
    });
    
    return true;
  };

  const handleToggleSelect = (msp: string) => {
    setDisplayedProducts(prev =>
      prev.map(p => (p.msp === msp ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleQuantityChange = (msp: string, delta: number) => {
    setDisplayedProducts(prev =>
      prev.map(p =>
        p.msp === msp
          ? { ...p, quantity: Math.max(1, p.quantity + delta) }
          : p
      )
    );
  };

  const handleSetQuantity = (msp: string, newQuantity: number) => {
    const qty = Math.max(1, Math.floor(newQuantity));
    setDisplayedProducts(prev =>
      prev.map(p => (p.msp === msp ? { ...p, quantity: qty } : p))
    );
  };

  const handlePrintSingle = (product: Product) => {
    setProductToPrint(product);
    setIsLayoutModalOpen(true);
  };

  const handlePrintSelected = () => {
    const selectedProducts = displayedProducts.filter(p => p.selected);
    if (selectedProducts.length > 0) {
      setPrintAction('selected');
      setIsLayoutModalOpen(true);
    }
  };

  const handlePrintAll = () => {
    if (displayedProducts.length > 0) {
      setPrintAction('all');
      setIsLayoutModalOpen(true);
    }
  };
  
  const executePrint = async (tagsPerPage: PrintSettings['tagsPerPage']) => {
    const settingsWithLayout = { ...printSettings, tagsPerPage };
    let productsToPrint: Product[] = [];
  
    if (productToPrint) {
      productsToPrint = [productToPrint];
    } else if (printAction === 'all') {
      productsToPrint = displayedProducts;
    } else if (printAction === 'selected') {
      productsToPrint = displayedProducts.filter(p => p.selected);
    } else if (printAction === 'manual') {
      productsToPrint = productsForPrintingSession;
    }
  
    if (settingsWithLayout.sortByName) {
      productsToPrint = [...productsToPrint].sort((a, b) => 
        a.sanPham.localeCompare(b.sanPham, 'vi', { sensitivity: 'base' })
      );
    }
  
    if (productsToPrint.length > 0) {
        setIsPrinting(true);
      try {
        const result = await printPriceTags(productsToPrint, employeeName, settingsWithLayout);
        if (typeof result === 'string') {
          setPdfPreviewUrl(result);
        }
      } catch (e) {
        console.error(e);
        setError("Không thể tạo tệp. Vui lòng thử lại.");
      } finally {
        setIsPrinting(false);
      }
    }
  
    setIsLayoutModalOpen(false);
    setPrintAction(null);
    setProductToPrint(null); // Reset
    setProductsForPrintingSession([]);
  };

  const handleShowTopBonus = useCallback(() => {
    const sortedProducts: Product[] = allProducts.slice()
        .filter((p): p is Product => !!(p && p.msp))
        .sort((a, b) => b.tongThuong - a.tongThuong)
        .slice(0, 100)
        .map((p): Product => ({...p, selected: false, quantity: 1}));
    setDisplayedProducts(sortedProducts);
  }, [allProducts]);

  const handleShowTopDiscount = useCallback(() => {
      const sortedProducts: Product[] = allProducts.slice()
        .filter((p): p is Product => !!(p && p.msp))
        .sort((a, b) => {
            const discountA = parseCurrency(a.giaGoc) - parseCurrency(a.giaGiam);
            const discountB = parseCurrency(b.giaGoc) - parseCurrency(b.giaGiam);
            return discountB - discountA;
        })
        .slice(0, 100)
        .map((p): Product => ({...p, selected: false, quantity: 1}));
      setDisplayedProducts(sortedProducts);
  }, [allProducts]);

  const executeReset = useCallback(() => {
    setDisplayedProducts([]); // Direct update to empty array
    setSearchQuery('');
    setSuggestions([]);
    setShowNoResults(false);
    setDuplicateError(false);
    setError(null);
    setIsResetConfirmOpen(false);
  }, []);

  const handleReset = () => {
    setIsResetConfirmOpen(true);
  };

  const handleExport = () => {
    if (displayedProducts.length === 0) return;

    const dataToExport = {
        employeeName: employeeName,
        products: displayedProducts.map(p => ({
            msp: p.msp,
            quantity: p.quantity,
        })),
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create custom filename: [Employee Name] - Danh_sach_san_pham_[Date]_[Time].json
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    const dateTimeStr = `${day}-${month}-${year}_${hour}-${minute}`;
    const safeEmployeeName = employeeName.trim() || 'Khong_ten';
    
    link.download = `${safeEmployeeName} - Danh_sach_san_pham_${dateTimeStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTriggerImport = () => {
    importInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const productMap = new Map(allProducts.filter(p => !!(p && p.msp)).map(p => [p.msp, p]));
      
      const allNewDisplayedProducts: Product[] = [];
      const allNotFoundMsps = new Set<string>();
      const fileProcessingErrors: string[] = [];
      let lastValidEmployeeName: string | null = null;

      for (const file of files) {
          try {
              const text = await file.text();
              const parsedJson = JSON.parse(text);
              
              let productList: { msp: string; quantity: number }[] = [];
              
              // Check for new format { employeeName, products } or old format [ ...products ]
              if (typeof parsedJson === 'object' && !Array.isArray(parsedJson) && parsedJson.products) {
                  // New format
                  if (Array.isArray(parsedJson.products)) {
                      productList = parsedJson.products;
                  } else {
                      throw new Error("Trường 'products' trong tệp phải là một mảng.");
                  }
                  
                  if (typeof parsedJson.employeeName === 'string') {
                      lastValidEmployeeName = parsedJson.employeeName;
                  }
              } else if (Array.isArray(parsedJson)) {
                  // Old format
                  productList = parsedJson;
              } else {
                  throw new Error("Định dạng tệp không hợp lệ.");
              }

              for (const item of productList) {
                  if (!item || typeof item !== 'object' || !item.msp) {
                      continue; // Skip invalid items in the JSON array.
                  }

                  if (productMap.has(item.msp)) {
                      const product = productMap.get(item.msp);
                      if (product) {
                          const newProduct: Product = {
                              ...(product as Product),
                              selected: false,
                              quantity: item.quantity > 0 ? item.quantity : 1,
                          };
                          allNewDisplayedProducts.push(newProduct);
                      }
                  } else {
                      allNotFoundMsps.add(item.msp);
                  }
              }
          } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Lỗi không xác định.';
              fileProcessingErrors.push(`Lỗi xử lý tệp '${file.name}': ${errorMessage}`);
              console.error(`Error processing file ${file.name}:`, err);
          }
      }

      setDisplayedProducts(allNewDisplayedProducts);

      // After processing all files, if we found a valid employee name, update it.
      if (lastValidEmployeeName !== null) {
          const trimmedName = lastValidEmployeeName.trim();
          setEmployeeName(trimmedName);
          saveEmployeeName(trimmedName);
          if (trimmedName) {
              setIsEditingEmployeeName(false);
          }
      }
      
      const errorMessages: string[] = Array.from(fileProcessingErrors);
      if (allNotFoundMsps.size > 0) {
          const notFoundArray = Array.from(allNotFoundMsps);
          errorMessages.push(`Không tìm thấy ${notFoundArray.length} mã sản phẩm trong dữ liệu hiện tại: ${notFoundArray.join(', ')}`);
      }

      if (errorMessages.length > 0) {
          setError(errorMessages.join('\n'));
      } else {
          setError(null);
      }

      if (event.target) {
          event.target.value = '';
      }
  };

  const handleManualPrint = (products: Product[]) => {
    setIsManualInputOpen(false);
    // Filter to ensure we only have valid products.
    const validProducts = products.filter(p => {
      return !!(p && p.msp && typeof p.msp === 'string' && p.msp.trim() !== '');
    });
    setProductsForPrintingSession(validProducts);
    setPrintAction('manual');
    setIsLayoutModalOpen(true);
  };


  if (isInitializing) {
     return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <LogoIcon className="h-10 w-10 text-indigo-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              CÔNG CỤ IN STICKER SẢN PHẨM EVENT
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Tải file in bảng giá và tìm sản phẩm cần in sticker.
          </p>
        </header>

        {fileName && uploadTimestamp && fileExportDate && !isLoading && !isInitializing && (
           <div className="bg-green-50 text-green-800 border border-green-200 rounded-lg p-3 flex items-center gap-3 mb-6">
              <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0"/>
              <div>
                  <p className="text-sm font-medium">
                      {fileName.includes('tệp') ? 
                          <span className="font-bold">{fileName}</span> : 
                          <>File <span className="font-bold">{fileName}</span></>
                      } đã được cập nhật lúc <span className="font-bold">{uploadTimestamp.toLocaleTimeString('vi-VN')}</span>.
                  </p>
                  <p className="text-xs">
                      Ngày xuất file: <span className="font-semibold">{fileExportDate}</span>
                  </p>
              </div>
           </div>
        )}

        <main className="flex flex-col lg:flex-row gap-8">
          <ControlPanel 
            employeeName={employeeName}
            isEditingEmployeeName={isEditingEmployeeName}
            searchQuery={searchQuery}
            suggestions={suggestions}
            showNoResults={showNoResults}
            allProducts={allProducts}
            displayedProducts={displayedProducts}
            isLoading={isLoading}
            fileName={fileName}
            isMobile={isMobile}
            onEmployeeNameChange={handleEmployeeNameChange}
            onSaveEmployeeName={handleSaveEmployeeName}
            onEmployeeNameKeyDown={handleEmployeeNameKeyDown}
            onSetIsEditingEmployeeName={setIsEditingEmployeeName}
            onSearchChange={handleSearchInputChange}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSuggestionClick={handleSuggestionClick}
            onFileChange={handleFileChange}
            onShowTopBonus={handleShowTopBonus}
            onShowTopDiscount={handleShowTopDiscount}
            onOpenManualInput={() => setIsManualInputOpen(true)}
            onReset={handleReset}
            onTriggerImport={handleTriggerImport}
            onExport={handleExport}
            onOpenPrintSettings={() => setIsPrintSettingsOpen(true)}
            onPrintSelected={handlePrintSelected}
            onPrintAll={handlePrintAll}
          />
          <div className="flex-1 space-y-4">
             {isLoading && (
                <div className="text-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-slate-600">Đang xử lý tệp...</p>
                </div>
              )}
              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                  <p className="font-bold">Lỗi</p>
                  <p className="whitespace-pre-wrap">{error}</p>
                </div>
              )}
              {duplicateError && (
                  <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-md" role="alert">
                      <p className="font-bold">Sản phẩm đã có</p>
                      <p>Sản phẩm này đã có trong danh sách kết quả của bạn.</p>
                  </div>
              )}

            <input type="file" ref={importInputRef} onChange={handleImport} accept=".json" className="hidden" multiple />

            <ResultsDisplay 
              results={displayedProducts} 
              hasData={allProducts.length > 0} 
              highlightedMsp={highlightedMsp}
              onToggleSelect={handleToggleSelect}
              onQuantityChange={handleQuantityChange}
              onSetQuantity={handleSetQuantity}
              onPrintSingle={handlePrintSingle}
              isMobile={isMobile}
            />
          </div>
        </main>
      </div>

      {isScannerOpen && (
        <Scanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isPrintSettingsOpen && (
          <PrintSettingsModal
              settings={printSettings}
              onSettingsChange={setPrintSettings}
              onClose={() => setIsPrintSettingsOpen(false)}
          />
      )}
      
      {isLayoutModalOpen && (
          <LayoutSelectionModal
              onSelect={executePrint}
              stickerStyle={printSettings.stickerStyle || 'default'}
              onStickerStyleChange={(style) => setPrintSettings({ ...printSettings, stickerStyle: style })}
              onClose={() => {
                setIsLayoutModalOpen(false);
                setProductToPrint(null);
                setPrintAction(null);
                setProductsForPrintingSession([]);
              }}
          />
      )}

      {isManualInputOpen && (
        <ManualInputModal
          onPrint={handleManualPrint}
          onClose={() => setIsManualInputOpen(false)}
          allProducts={allProducts}
        />
      )}
      
      {pdfPreviewUrl && (
        <PdfPreviewModal
            url={pdfPreviewUrl}
            fileName={`in-gia-sticker-${new Date().toISOString().slice(0, 10)}.pdf`}
            onClose={() => setPdfPreviewUrl(null)}
        />
      )}
      
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsResetConfirmOpen(false)}>
            <div 
                className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center">
                    <WarningIcon className="mx-auto h-12 w-12 text-amber-500"/>
                    <h2 className="text-xl font-bold text-slate-900 mt-2">Xác nhận Xóa</h2>
                    <p className="text-slate-600 mt-1">Bạn có chắc chắn muốn xóa toàn bộ danh sách sản phẩm đã tìm/lọc không?</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => setIsResetConfirmOpen(false)} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-slate-100 h-10 px-4 py-2">
                        Hủy
                    </button>
                    <button onClick={executeReset} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-red-600 text-red-50 hover:bg-red-700 h-10 px-4 py-2">
                        Xóa
                    </button>
                </div>
            </div>
        </div>
      )}

      {isPrinting && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-400"></div>
          <p className="text-white mt-4 text-lg font-medium">Đang tạo tệp PDF...</p>
        </div>
      )}
    </div>
  );
}
