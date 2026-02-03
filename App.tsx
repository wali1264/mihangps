
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Layout, FileText, Settings, Archive, User, Search, Printer, Plus, Save, Move, RotateCw, Upload, Trash2, AlignLeft, AlignCenter, AlignRight, Grid, List, Layers, PlusCircle, ChevronDown, Files, UserPlus, X, ChevronLeft, CheckCircle2, Type, Maximize2, Bell, Pencil, ShieldCheck, Database, Download, FileJson, Key, Check, Lock, LogOut, UserCheck, Shield, Eye, EyeOff, Repeat, Phone, CreditCard, UserCircle, ZoomIn, ZoomOut, ChevronUp, Info, BookMarked, Copy, Wallet, ArrowUpCircle, ArrowDownCircle, Calculator, TrendingUp, TrendingDown, Clock, Users, Share2, MessageCircle, BarChart3, Calendar, Filter, UserPlus2, Forward, CalendarClock, ImageIcon, ImageOff, MonitorPlay } from 'lucide-react';
import { PaperSize, ContractField, ContractTemplate, TextAlignment, ContractPage, ClientProfile } from './types';
import { INITIAL_FIELDS } from './constants';
import ReactDOM from 'react-dom';
import { supabase } from './lib/supabase';

// --- Local Storage Engine (IndexedDB) ---
const DB_NAME = 'AsraCache_v3';
const STORE_NAME = 'images';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Lossless Processor: Preserves every pixel for Workspace and Database
const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    resolve(file);
  });
};

const cacheImage = async (url: string, forceRefresh = false): Promise<string> => {
  if (!url) return '';
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const cached = await new Promise<Blob | undefined>((resolve) => {
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(undefined);
    });

    if (cached && !forceRefresh) return URL.createObjectURL(cached);

    const response = await fetch(url, { mode: 'cors', cache: 'no-cache' });
    const blob = await response.blob();
    const writeTx = db.transaction(STORE_NAME, 'readwrite');
    writeTx.objectStore(STORE_NAME).put(blob, url);
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('Caching logic failed for:', url, e);
    return url;
  }
};

const getPrintOptimizedBlob = async (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(url);
      const targetWidth = 2480; 
      const scaleFactor = targetWidth / img.width;
      canvas.width = targetWidth;
      canvas.height = img.height * scaleFactor;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) resolve(URL.createObjectURL(blob));
        else resolve(url);
      }, 'image/jpeg', 0.92);
    };
    img.onerror = () => resolve(url);
  });
};

// --- Professional Printing Engine ---
const triggerProfessionalPrint = async (isLandscape: boolean = false, contractId?: string) => {
  showToast('در حال آماده‌سازی برای چاپ...');
  
  // Memory Management: Keep track of temp blob URLs to revoke them later
  const temporaryPrintUrls: string[] = [];

  // Track print time in DB if ID is provided
  if (contractId) {
    supabase.from('contracts').update({ last_printed_at: new Date().toISOString() }).eq('id', contractId).then(() => {
        // Silent update, will refresh on archive reload
    });
  }

  const style = document.createElement('style');
  style.id = 'print-orientation-style';
  style.innerHTML = `@page { size: ${isLandscape ? 'landscape' : 'portrait'}; }`;
  document.head.appendChild(style);

  const printLayer = document.querySelector('.print-root-layer');
  if (!printLayer) return;

  const pageUnits = Array.from(printLayer.querySelectorAll('.print-page-unit')) as HTMLElement[];
  
  try {
    await Promise.all(pageUnits.map(async (unit) => {
      const style = window.getComputedStyle(unit);
      const bg = style.backgroundImage;
      if (bg && bg !== 'none') {
        const url = bg.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
        const optimizedUrl = await getPrintOptimizedBlob(url);
        
        // Store for garbage collection
        if (optimizedUrl.startsWith('blob:')) {
          temporaryPrintUrls.push(optimizedUrl);
        }

        unit.style.backgroundImage = `url("${optimizedUrl}")`;
        await new Promise((resolve) => {
          const img = new Image();
          img.src = optimizedUrl;
          img.onload = resolve;
          img.onerror = resolve;
        });
      }
    }));

    await new Promise(resolve => setTimeout(resolve, 500));
    window.print();
    
    // Professional Cleanup: Revoke temp URLs after a safe delay (10 seconds)
    // to ensure printer driver has finished reading the stream.
    setTimeout(() => {
        const styleEl = document.getElementById('print-orientation-style');
        if (styleEl) styleEl.remove();

        // Release RAM by revoking Blob URLs
        if (temporaryPrintUrls.length > 0) {
          temporaryPrintUrls.forEach(url => URL.revokeObjectURL(url));
          console.log(`[MemoryGuard] Freed RAM for ${temporaryPrintUrls.length} temporary print assets.`);
        }
    }, 10000);
  } catch (err) {
    console.error('Print prep failed', err);
    window.print();
  }
};

const MihanLogo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mihanPinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4CAF50" />
        <stop offset="100%" stopColor="#1B5E20" />
      </linearGradient>
      <linearGradient id="mihanWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#03A9F4" />
        <stop offset="100%" stopColor="#01579B" />
      </linearGradient>
    </defs>
    {/* ۱. سایه تکیه‌گاه زیر آیکون (Shadow) */}
    <ellipse cx="50" cy="94" rx="18" ry="3.5" fill="#000" fillOpacity="0.12" />
    
    {/* ۲. پین لوکیشن (Location Pin) - با تناسب ابعاد دقیق */}
    <path d="M50 90C50 90 26 64 26 48C26 34.7 36.7 24 50 24C63.3 24 74 34.7 74 48C74 64 50 90 50 90Z" fill="url(#mihanPinGradient)" />
    <circle cx="50" cy="48" r="9" fill="white" />
    
    {/* ۳. امواج رادیویی (Radio Waves) - کاملاً در فضای بالای سر و تفکیک شده */}
    <path d="M38 17C42 12 58 12 62 17" stroke="url(#mihanWaveGradient)" strokeWidth="5.5" strokeLinecap="round" />
    <path d="M30 8C35 1 65 1 70 8" stroke="url(#mihanWaveGradient)" strokeWidth="6.5" strokeLinecap="round" />
  </svg>
);

const showToast = (message: string) => {
  window.dispatchEvent(new CustomEvent('show-app-toast', { detail: message }));
};

const Toast = () => {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: any) => {
      setMsg(e.detail);
      setTimeout(() => setMsg(null), 3000);
    };
    window.addEventListener('show-app-toast', handler);
    return () => window.removeEventListener('show-app-toast', handler);
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 z-[1000] animate-in slide-in-from-bottom-10 border border-slate-700 backdrop-blur-xl no-print">
      <Bell size={18} className="text-blue-400" />
      <span className="font-bold text-sm">{msg}</span>
    </div>
  );
};

// --- Smart Reports Logic ---
const ReportsPanel = ({ template }: { template: ContractTemplate }) => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isEmployeeMenuOpen, setIsEmployeeMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'main' | 'extended'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [quickFilter, setQuickFilter] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');

  useEffect(() => {
    fetchEmployees();
    fetchClientsData();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [quickFilter, dateRange, filterType, selectedEmployeeId]);

  const fetchEmployees = async () => {
    const { data } = await supabase.from('users').select('*').neq('username', 'admin');
    if (data) setEmployees(data);
  };

  const fetchClientsData = async () => {
    const { data } = await supabase.from('clients').select('*');
    if (data) setClients(data);
  };

  const fetchReportData = async () => {
    setLoading(true);
    let query = supabase.from('contracts').select('*');
    if (selectedEmployeeId) query = query.eq('assigned_to', selectedEmployeeId);
    const now = new Date();
    let startDate = new Date();
    if (quickFilter === 'today') startDate.setHours(0, 0, 0, 0);
    else if (quickFilter === 'week') startDate.setDate(now.getDate() - 7);
    else if (quickFilter === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (quickFilter === 'year') startDate.setFullYear(now.getFullYear() - 1);
    else if (quickFilter === 'custom' && dateRange.start) startDate = new Date(dateRange.start);
    if (quickFilter !== 'custom' || dateRange.start) query = query.gte('timestamp', startDate.toISOString());
    if (quickFilter === 'custom' && dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      query = query.lte('timestamp', end.toISOString());
    }
    if (filterType === 'main') query = query.eq('is_extended', false);
    if (filterType === 'extended') query = query.eq('is_extended', true);
    const { data } = await query.order('timestamp', { ascending: false });
    if (data) setContracts(data);
    setLoading(false);
  };

  // --- Professional Excel (CSV) Export Engine ---
  const handleExportExcel = () => {
    if (contracts.length === 0) {
      showToast('داده‌ای برای خروجی یافت نشد');
      return;
    }

    // 1. Prepare dynamic field labels map
    const fieldLabelsMap: Record<string, string> = {};
    template.pages.forEach(p => {
      p.fields.forEach(f => {
        fieldLabelsMap[f.key] = f.label;
      });
    });

    // 2. Identify all dynamic keys used in filtered contracts
    const dynamicKeysSet = new Set<string>();
    contracts.forEach(c => {
      if (c.form_data) {
        Object.keys(c.form_data).forEach(k => dynamicKeysSet.add(k));
      }
    });
    const dynamicKeys = Array.from(dynamicKeysSet);

    // 3. Define headers with duplicate label protection
    const headerCounts: Record<string, number> = {};
    const headers = [
      'ردیف',
      'تاریخ ثبت',
      'نام مشتری',
      'نام پدر',
      'شماره پلاک',
      'شماره تماس',
      'نوع خدمات',
      'کارمند ثبت‌کننده',
      ...dynamicKeys.map(k => {
        const baseLabel = fieldLabelsMap[k] || 'فیلد پویا';
        headerCounts[baseLabel] = (headerCounts[baseLabel] || 0) + 1;
        // If label is duplicate, append the field key to distinguish columns
        return headerCounts[baseLabel] > 1 ? `${baseLabel} (${k.replace('f_', '')})` : baseLabel;
      })
    ];

    // 4. Map rows with "Force Text Formula" to preserve zeros and large numbers
    const rows = contracts.map((c, index) => {
      const client = clients.find(cl => cl.id === c.client_id);
      const employee = employees.find(e => e.id === c.assigned_to);
      
      const rowData = [
        index + 1,
        new Date(c.timestamp).toLocaleDateString('fa-IR'),
        c.client_name,
        client?.father_name || client?.fatherName || '---',
        `="${client?.tazkira || '---'}"`, // Force text to avoid scientific notation for plates
        `="${client?.phone || '---'}"`,   // Force text to avoid scientific notation for phones
        c.is_extended ? 'تمدیدی' : 'اصلی',
        employee?.username || 'مدیر سیستم'
      ];

      // Dynamic form fields
      dynamicKeys.forEach(k => {
        const val = c.form_data?.[k] || '';
        // Wrap every dynamic value in a text formula for Excel safety
        rowData.push(`="${val.toString().replace(/"/g, '""')}"`);
      });

      // Escape quotes for CSV compliance (outer wrap)
      return rowData.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',');
    });

    // 5. Generate file with BOM for Persian support in Excel
    const csvContent = "\uFEFF" + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toLocaleDateString('fa-IR').replace(/\//g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `گزارش_میهن_GPS_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('فایل اکسل با موفقیت تولید شد');
  };

  const stats = useMemo(() => {
    const mainCount = contracts.filter(c => !c.is_extended).length;
    const extCount = contracts.filter(c => c.is_extended).length;
    return { total: contracts.length, mainCount, extCount };
  }, [contracts]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-6 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">گزارشات هوشمند</h2>
          <p className="text-slate-400 font-bold">تحلیل عملکرد و آمارهای ثبت خدمات</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setIsEmployeeMenuOpen(!isEmployeeMenuOpen)} className={`flex items-center gap-3 px-6 py-3.5 rounded-[24px] font-black text-xs transition-all border shadow-sm ${selectedEmployeeId ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}><Users size={16} />{selectedEmployeeId ? employees.find(e => e.id === selectedEmployeeId)?.username : 'فیلتر کارمند'}<ChevronDown size={14} className={`transition-transform duration-300 ${isEmployeeMenuOpen ? 'rotate-180' : ''}`} /></button>
            {isEmployeeMenuOpen && (
              <div className="absolute top-full mt-3 right-0 bg-white border border-slate-100 shadow-2xl rounded-[28px] p-2 z-[200] animate-in zoom-in-95 w-56 overflow-hidden">
                <button onClick={() => { setSelectedEmployeeId(null); setIsEmployeeMenuOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-black transition-all ${!selectedEmployeeId ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}><span>همه کارمندان (کل سیستم)</span>{!selectedEmployeeId && <Check size={14}/>}</button>
                <div className="h-[1px] bg-slate-50 my-2 mx-2" />
                {employees.map(emp => (<button key={emp.id} onClick={() => { setSelectedEmployeeId(emp.id); setIsEmployeeMenuOpen(false); }} className={`w-full flex items-center justify-between p-4 rounded-2xl text-[10px] font-black transition-all mt-1 ${selectedEmployeeId === emp.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}`}><span>{emp.username}</span>{selectedEmployeeId === emp.id && <Check size={14}/>}</button>))}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-6 py-3.5 rounded-[24px] bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Download size={16} />
            <span>خروجی اکسل</span>
          </button>

          <div className="bg-white p-2 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-1">
            {[{ id: 'today', label: 'امروز' }, { id: 'week', label: 'هفته' }, { id: 'month', label: 'ماه' }, { id: 'year', label: 'سال' }, { id: 'custom', label: 'سفارشی' }].map(f => (<button key={f.id} onClick={() => setQuickFilter(f.id as any)} className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${quickFilter === f.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{f.label}</button>))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div><div className="relative z-10"><div className="flex items-center gap-3 mb-4 text-blue-600"><BarChart3 size={20}/> <span className="text-[10px] font-black uppercase tracking-widest">کل خدمات</span></div><p className="text-4xl font-black text-slate-800">{stats.total}</p></div></div>
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div><div className="relative z-10"><div className="flex items-center gap-3 mb-4 text-indigo-600"><FileText size={20}/> <span className="text-[10px] font-black uppercase tracking-widest">قرارداد اصلی</span></div><p className="text-4xl font-black text-slate-800">{stats.mainCount}</p></div></div>
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group"><div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform"></div><div className="relative z-10"><div className="flex items-center gap-3 mb-4 text-emerald-600"><Repeat size={20}/> <span className="text-[10px] font-black uppercase tracking-widest">تمدیدی‌ها</span></div><p className="text-4xl font-black text-slate-800">{stats.extCount}</p></div></div>
      </div>
      {quickFilter === 'custom' && (
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 mb-8 flex flex-wrap gap-6 animate-in slide-in-from-top-4"><div className="flex-1 min-w-[200px] space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">از تاریخ</label><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} /></div><div className="flex-1 min-w-[200px] space-y-2"><label className="text-[10px] font-black text-slate-400 mr-2 uppercase">تا تاریخ</label><input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} /></div></div>
      )}
      <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50/50"><h4 className="font-black text-slate-800 flex items-center gap-2"><List size={18}/> ریز گزارش قراردادها</h4><div className="flex bg-white p-1 rounded-xl border border-slate-100"><button onClick={() => setFilterType('all')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>همه</button><button onClick={() => setFilterType('main')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${filterType === 'main' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>اصلی</button><button onClick={() => setFilterType('extended')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${filterType === 'extended' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>تمدیدی</button></div></div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
           {loading ? (<div className="h-full flex items-center justify-center text-slate-300 font-black animate-pulse">در حال تحلیل داده‌ها...</div>) : contracts.length > 0 ? (<div className="space-y-4">
                {contracts.map(c => {
                  const clientProfile = clients.find(cl => cl.id === c.client_id);
                  return (
                    <div key={c.id} className="p-6 bg-white border border-slate-100 rounded-[32px] flex items-center justify-between hover:bg-slate-50 transition-all"><div className="flex items-center gap-6"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${c.is_extended ? 'bg-emerald-500' : 'bg-blue-600'}`}>{c.is_extended ? <Repeat size={18}/> : <FileText size={18}/>}</div><div><h5 className="font-black text-slate-800">{c.client_name}</h5><p className="text-[10px] font-bold text-slate-400">پلاک: {clientProfile?.tazkira || '---'}</p></div></div><div className="text-left"><p className="text-xs font-black text-slate-700">{new Date(c.timestamp).toLocaleDateString('fa-IR')}</p><p className={`text-[9px] font-black mt-1 ${c.is_extended ? 'text-emerald-500' : 'text-blue-500'}`}>{c.is_extended ? 'تمدید خدمات' : 'قرارداد اولیه'}</p></div></div>
                  );
                })}
             </div>) : (<div className="h-full flex items-center justify-center text-slate-300 font-black italic">در این بازه زمانی تراکنشی یافت نشد</div>)}
        </div>
      </div>
    </div>
  );
};

// --- Security Gate for Design Section ---
const DesignGate = ({ onUnlock, onCancel }: { onUnlock: () => void, onCancel: () => void }) => {
  const [pass, setPass] = useState('');
  const [isError, setIsError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (pass === 'wali') onUnlock(); else { setIsError(true); setTimeout(() => setIsError(false), 500); setPass(''); } };
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-