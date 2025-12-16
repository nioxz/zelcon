
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useLocation } from 'react-router-dom';
import { db } from '../services/mockDb';
import { InventoryItem, WarehouseRequest, RequestStatus, ReturnStatus, Training, NewsItem, TrainingAttempt } from '../types';
import { WarehouseModule } from '../components/WarehouseModule';
import { SSTModule } from '../components/SSTModule';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Warehouse, 
  ShoppingCart, 
  Search, 
  History,
  Clock,
  CheckCircle2,
  XCircle,
  Wrench,
  HardHat,
  Info,
  CalendarClock,
  MapPin,
  CornerDownLeft,
  X,
  RotateCcw,
  Plus,
  Image as ImageIcon,
  Calendar,
  Barcode,
  Tag,
  Factory,
  GraduationCap,
  Megaphone,
  Video,
  PlayCircle,
  Award,
  Truck,
  FileCheck,
  Package,
  ArrowLeft,
  Save,
  Download,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  ClipboardList,
  PackageSearch,
  ShieldCheck,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  QrCode,
  Printer
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type AlmaceneroView = 'menu' | 'logistics_panel' | 'sst_docs' | 'request_epp' | 'training_news';

export const AlmaceneroDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [view, setView] = useState<AlmaceneroView>('menu');

  // --- Logistics Panel State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'returns' | 'inventory'>('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<WarehouseRequest[]>([]);
  
  // Training/News State for Almacenero
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [attempts, setAttempts] = useState<TrainingAttempt[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Training | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{score: number, passed: boolean} | null>(null);

  // Action States
  const [editMode, setEditMode] = useState<string | null>(null);
  const [tempStock, setTempStock] = useState<number>(0);
  const [selectedReq, setSelectedReq] = useState<WarehouseRequest | null>(null);
  const [approvalData, setApprovalData] = useState({ time: '', location: '', comment: '' });
  
  // QR State
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);

  // Add Item State
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<{
      name: string;
      sku: string;
      brand: string;
      model: string;
      category: string;
      stock: number;
      minStock: number;
      maxStock: number; 
      unit: string;
      location: string;
      supplier: string;
      requiresReturn: boolean;
      lastRestock: string;
      expirationDate: string;
      image: string;
  }>({
      name: '',
      sku: '',
      brand: '',
      model: '',
      category: 'EPP',
      stock: 0,
      minStock: 5,
      maxStock: 100,
      unit: 'UND',
      location: '',
      supplier: '',
      requiresReturn: false,
      lastRestock: new Date().toISOString().split('T')[0],
      expirationDate: '',
      image: ''
  });

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/almacenero/inventory')) {
        setView('logistics_panel');
        if(view !== 'logistics_panel') setActiveTab('inventory');
    } else if (path.includes('/almacenero/requests')) {
        setView('logistics_panel');
        if(view !== 'logistics_panel') setActiveTab('orders');
    } else if (path.includes('/almacenero/dashboard')) {
        setView('logistics_panel');
        setActiveTab('dashboard');
    } else {
        setView('menu');
    }

    if (user?.companyId) {
      setInventory(db.inventory.getByCompany(user.companyId));
      const allReqs = db.inventory.requests.getByCompany(user.companyId);
      setRequests(allReqs.sort((a,b) => (a.status === 'Pendiente' ? -1 : 1)));
      
      setTrainings(db.trainings.getByCompany(user.companyId));
      setNews(db.news.getByCompany(user.companyId));
      const allAttempts = db.trainings.results.getAll();
      setAttempts(allAttempts.filter(a => a.userId === user.id));
    }
  }, [user, location.pathname]); 

  // --- Quiz Logic ---
  const startQuiz = (t: Training) => { setActiveQuiz(t); setQuizAnswers({}); setQuizResult(null); };
  const closeQuiz = () => { setActiveQuiz(null); const allAttempts = db.trainings.results.getAll(); setAttempts(allAttempts.filter(a => a.userId === user?.id)); };
  
  const submitQuiz = () => {
      if(!activeQuiz || !user) return;
      let correctCount = 0;
      const total = activeQuiz.questions?.length || 0;
      activeQuiz.questions?.forEach(q => { if (quizAnswers[q.id] === q.correctOptionIndex) correctCount++; });
      const score = Math.round((correctCount / total) * 100) || 0;
      const passed = score >= 70;
      const attempt: TrainingAttempt = {
          id: `att-${Date.now()}`,
          trainingId: activeQuiz.id,
          userId: user.id,
          userName: user.name,
          score: score,
          date: new Date().toISOString().split('T')[0],
          status: passed ? 'Aprobado' : 'Desaprobado'
      };
      db.trainings.results.add(attempt);
      setQuizResult({ score, passed });
  };

  // --- Actions ---

  const generateSKU = () => {
     const prefix = newItem.category.substring(0,3).toUpperCase();
     const random = Math.floor(1000 + Math.random() * 9000);
     setNewItem({...newItem, sku: `${prefix}-${random}`});
  };

  const openApprovalModal = (req: WarehouseRequest) => {
      setSelectedReq(req);
      setApprovalData({ 
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
          location: '', 
          comment: '' 
      });
  };

  const processApproval = (approved: boolean) => {
      if(!selectedReq || !user?.companyId) return;

      if (approved) {
          if (!approvalData.location.trim()) {
              alert("Por favor indique el lugar de entrega.");
              return;
          }
          const item = inventory.find(i => i.id === selectedReq.itemId);
          if (item && item.stock < selectedReq.quantity) {
              alert("Stock insuficiente para aprobar este pedido.");
              return;
          }
          if(item) {
              db.inventory.updateStock(item.id, item.stock - selectedReq.quantity);
          }
          const returnStatus = item?.requiresReturn ? ReturnStatus.PENDING_RETURN : ReturnStatus.NOT_REQUIRED;
          const updatedReq: WarehouseRequest = {
              ...selectedReq,
              status: RequestStatus.DELIVERED, 
              pickupTime: approvalData.time,
              pickupLocation: approvalData.location,
              approvalComment: approvalData.comment,
              returnStatus: returnStatus
          };
          db.inventory.requests.update(updatedReq);
      } else {
          if(!approvalData.comment) { alert("Ingrese un motivo de rechazo."); return; }
          const updatedReq: WarehouseRequest = {
              ...selectedReq,
              status: RequestStatus.REJECTED,
              approvalComment: approvalData.comment
          };
          db.inventory.requests.update(updatedReq);
      }
      setInventory(db.inventory.getByCompany(user.companyId));
      setRequests(db.inventory.requests.getByCompany(user.companyId));
      setSelectedReq(null);
  };

  const handleReturnItem = (req: WarehouseRequest) => {
      if (!window.confirm("¿Confirmar devolución del ítem y reingreso al stock?")) return;
      const updatedReq = { 
          ...req, 
          returnStatus: ReturnStatus.RETURNED, 
          returnDate: new Date().toISOString() 
      };
      db.inventory.requests.update(updatedReq);
      const item = inventory.find(i => i.id === req.itemId);
      if(item && user?.companyId) {
          db.inventory.updateStock(item.id, item.stock + req.quantity);
          setInventory(db.inventory.getByCompany(user.companyId));
      }
      setRequests(db.inventory.requests.getByCompany(user.companyId || ''));
  };

  const printQRLabel = () => {
      // Create a hidden iframe or new window to print just the label content
      const printContent = document.getElementById('qr-label-content');
      if (printContent) {
          const win = window.open('', '', 'height=500,width=500');
          if (win) {
              win.document.write('<html><head><title>Etiqueta QR</title>');
              win.document.write('<style>body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; } .label { border: 2px solid black; padding: 20px; text-align: center; width: 300px; } .sku { font-size: 24px; font-weight: bold; margin: 10px 0; } .name { font-size: 16px; margin-bottom: 10px; } </style>');
              win.document.write('</head><body>');
              win.document.write(printContent.innerHTML);
              win.document.write('</body></html>');
              win.document.close();
              win.print();
          }
      }
  };

  // --- Add Item Logic ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setNewItem({ ...newItem, image: reader.result as string });
          reader.readAsDataURL(file);
      }
  };

  const handleAddItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.companyId) return;
      const itemToCreate: InventoryItem = {
          id: `inv-${Date.now()}`,
          companyId: user.companyId,
          name: newItem.name,
          sku: newItem.sku || `GEN-${Date.now()}`,
          brand: newItem.brand,
          model: newItem.model,
          category: newItem.category,
          stock: newItem.stock,
          minStock: newItem.minStock,
          unit: newItem.unit,
          location: newItem.location,
          supplier: newItem.supplier,
          requiresReturn: newItem.requiresReturn,
          image: newItem.image,
          lastRestock: newItem.lastRestock,
          expirationDate: newItem.expirationDate
      };
      db.inventory.create(itemToCreate);
      setInventory(db.inventory.getByCompany(user.companyId));
      setIsAddItemModalOpen(false);
      setNewItem({ 
          name: '', sku: '', brand: '', model: '', category: 'EPP', stock: 0, minStock: 5, maxStock: 100, unit: 'UND', 
          location: '', supplier: '', requiresReturn: false, lastRestock: new Date().toISOString().split('T')[0], expirationDate: '', image: '' 
      });
  };

  const startEdit = (item: InventoryItem) => {
    setEditMode(item.id);
    setTempStock(item.stock);
  };

  const saveStock = (id: string) => {
    db.inventory.updateStock(id, tempStock);
    if(user?.companyId) setInventory(db.inventory.getByCompany(user.companyId));
    setEditMode(null);
  };

  const downloadKardex = () => {
      const doc = new jsPDF({ orientation: 'landscape' });
      
      let generateTable: any = autoTable;
      // @ts-ignore
      if (generateTable && typeof generateTable.default === 'function') {
          // @ts-ignore
          generateTable = generateTable.default;
      }
      // @ts-ignore
      if (typeof generateTable !== 'function' && typeof doc.autoTable === 'function') {
          // @ts-ignore
          generateTable = doc.autoTable;
      }

      if (typeof generateTable !== 'function') {
          alert("Error: El plugin de PDF no se cargó correctamente. Por favor recargue la página.");
          return;
      }

      // Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("KARDEX FÍSICO DE INVENTARIO", 14, 14);
      doc.setFontSize(10);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 14, 19);
      doc.text(`Empresa: ${db.companies.getById(user?.companyId || '')?.name || 'ZELCON'}`, 280, 14, { align: 'right' });

      // Structure
      const tableHead = [
          [
              { content: 'DATOS GENERALES DEL PRODUCTO', colSpan: 4, styles: { halign: 'center', fillColor: [22, 160, 133] } },
              { content: 'ENTRADAS (Último Movimiento)', colSpan: 3, styles: { halign: 'center', fillColor: [39, 174, 96] } },
              { content: 'SALIDAS (Último Movimiento)', colSpan: 3, styles: { halign: 'center', fillColor: [211, 84, 0] } },
              { content: 'SALDO', colSpan: 1, styles: { halign: 'center', fillColor: [41, 128, 185] } },
          ],
          [
              'Código (SKU)', 'Descripción del Producto', 'Und', 'Mín - Máx',
              'Fecha', 'Concepto', 'Cant.',
              'Fecha', 'Concepto', 'Cant.',
              'FÍSICO'
          ]
      ];

      const tableRows = inventory.map(item => {
          const entryDate = item.lastRestock || '-';
          const entryConcept = "Inventario Inicial / Compra"; 
          const entryQty = Math.floor(item.stock * 1.2).toString(); 

          const lastRequest = requests.find(r => r.itemId === item.id && (r.status === 'Entregado' || r.status === 'Aprobado'));
          const exitDate = lastRequest ? lastRequest.date : '-';
          const exitConcept = lastRequest ? (lastRequest.userArea || 'Despacho Interno') : '-';
          const exitQty = lastRequest ? lastRequest.quantity.toString() : '-';

          const maxStock = item.maxStock || item.minStock * 4;

          return [
              item.sku,
              item.name,
              item.unit,
              `${item.minStock} - ${maxStock}`,
              entryDate,
              entryConcept,
              entryQty,
              exitDate,
              exitConcept,
              exitQty,
              { content: item.stock, styles: { fontStyle: 'bold', halign: 'center' } }
          ];
      });

      generateTable(doc, {
          head: tableHead,
          body: tableRows,
          startY: 35,
          theme: 'grid',
          headStyles: { 
              textColor: 255,
              fontSize: 7,
              halign: 'center',
              valign: 'middle'
          },
          styles: { 
              fontSize: 7,
              cellPadding: 2,
              lineColor: [200, 200, 200],
              lineWidth: 0.1
          },
          columnStyles: {
              0: { cellWidth: 20 },
              1: { cellWidth: 50 },
              2: { cellWidth: 10, halign: 'center' },
              3: { cellWidth: 20, halign: 'center' },
              4: { cellWidth: 20, halign: 'center' },
              5: { cellWidth: 30 },
              6: { cellWidth: 15, halign: 'center' },
              7: { cellWidth: 20, halign: 'center' },
              8: { cellWidth: 30 },
              9: { cellWidth: 15, halign: 'center' },
              10: { cellWidth: 20, halign: 'center', fillColor: [235, 245, 251] }
          },
          didParseCell: (data: any) => {
              if (data.section === 'body' && data.column.index === 10) {
                  const stock = parseInt(data.cell.raw as string);
                  const min = parseInt((data.row.raw[3] as string).split('-')[0]);
                  
                  if (stock <= min) {
                      data.cell.styles.textColor = [220, 38, 38]; 
                      data.cell.styles.fontStyle = 'bold';
                  }
              }
          }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(8);
      doc.text("Nota: Este reporte muestra el estado físico actual y los últimos movimientos registrados. No incluye valoración monetaria.", 14, finalY + 10);

      doc.save(`Kardex_Fisico_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // --- Renders ---

  const renderMenu = () => (
    <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Panel de Logística</h1>
            <p className="text-slate-500 text-lg">Hola, {user?.name}. Gestión centralizada de almacenes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
                onClick={() => setView('logistics_panel')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-blue-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Truck size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">Gestión Logística</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Control de stock, despachos, devoluciones y kardex digital.
                </p>
                {requests.filter(r => r.status === 'Pendiente').length > 0 && (
                    <div className="mt-4 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-yellow-200 animate-pulse">
                        <Clock size={14} /> {requests.filter(r => r.status === 'Pendiente').length} Pedidos Pendientes
                    </div>
                )}
            </div>

            <div 
                onClick={() => setView('training_news')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-green-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                    <GraduationCap size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-green-700 transition-colors">Capacitación</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Exámenes obligatorios y noticias corporativas relevantes.
                </p>
                {news.length > 0 && (
                     <div className="mt-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-green-200">
                        <Megaphone size={14} /> {news.length} Avisos
                    </div>
                )}
            </div>

            <div 
                onClick={() => setView('sst_docs')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-purple-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    <ShieldCheck size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-purple-700 transition-colors">Documentos SSOMA</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Acceso a ATS, Checklists e IPERC Continuo.
                </p>
            </div>

            <div 
                onClick={() => setView('request_epp')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-orange-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                    <PackageSearch size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-700 transition-colors">Pedidos Almacén</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Solicitud de materiales y equipos para uso personal.
                </p>
            </div>
        </div>
    </div>
  );

  const renderTrainingNews = () => (
      <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold text-slate-900">Capacitaciones y Noticias</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* News Feed */}
              <div className="md:col-span-1 space-y-4">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2"><Megaphone size={18} /> Comunicados</h3>
                 {news.length === 0 ? <p className="text-slate-400 text-sm">No hay noticias.</p> : news.map(n => (
                     <div key={n.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                         <div className="flex justify-between mb-1"><h4 className="font-bold text-sm">{n.title}</h4>{n.priority === 'Urgente' && <span className="bg-red-100 text-red-600 text-[10px] px-2 rounded font-bold">URGENTE</span>}</div>
                         <p className="text-xs text-slate-600 mb-2">{n.content}</p>
                         <p className="text-[10px] text-slate-400 text-right">{n.date}</p>
                     </div>
                 ))}
              </div>
              
              {/* Quiz Area */}
              <div className="md:col-span-2 space-y-4">
                  <h3 className="font-bold text-slate-800">Cursos Asignados</h3>
                  {activeQuiz ? (
                    <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-lg">
                        {quizResult ? (
                            <div className="text-center py-6">
                                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${quizResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {quizResult.passed ? <Award size={32} /> : <XCircle size={32} />}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{quizResult.passed ? '¡Aprobado!' : 'No Aprobado'}</h3>
                                <p className="text-slate-600 mb-4">Nota: {quizResult.score}/100</p>
                                <button onClick={closeQuiz} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold">Finalizar</button>
                            </div>
                        ) : (
                            <div>
                                <h4 className="text-lg font-bold mb-4">{activeQuiz.title}</h4>
                                <div className="space-y-6">
                                    {activeQuiz.questions?.map((q, idx) => (
                                        <div key={q.id}>
                                            <p className="font-bold text-slate-800 mb-2">{idx + 1}. {q.question}</p>
                                            <div className="space-y-2">
                                                {q.options.map((opt, oIdx) => (
                                                    <label key={oIdx} className={`flex items-center gap-3 p-2 border rounded cursor-pointer ${quizAnswers[q.id] === oIdx ? 'bg-blue-50 border-blue-500' : 'hover:bg-slate-50'}`}>
                                                        <input type="radio" name={q.id} checked={quizAnswers[q.id] === oIdx} onChange={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})} className="w-4 h-4" />
                                                        <span className="text-sm">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={() => setActiveQuiz(null)} className="text-slate-500 hover:text-slate-700">Cancelar</button>
                                    <button onClick={submitQuiz} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Enviar</button>
                                </div>
                            </div>
                        )}
                    </div>
                  ) : (
                      <div className="grid grid-cols-1 gap-4">
                          {trainings.map(t => {
                                const attempt = attempts.find(a => a.trainingId === t.id);
                                const isPassed = attempt?.status === 'Aprobado';
                                return (
                                    <div key={t.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center group hover:border-blue-300">
                                        <div>
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">{t.title} {isPassed && <CheckCircle2 size={16} className="text-green-500" />}</h4>
                                            <p className="text-xs text-slate-500">{t.description}</p>
                                        </div>
                                        {isPassed ? (
                                            <span className="text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">Completado ({attempt.score})</span>
                                        ) : (
                                            <button onClick={() => startQuiz(t)} className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-slate-800"><PlayCircle size={14}/> {attempt ? 'Reintentar' : 'Iniciar'}</button>
                                        )}
                                    </div>
                                )
                          })}
                      </div>
                  )}
              </div>
          </div>
      </div>
  );

  const renderMetrics = () => {
      // Calculate Stats
      const totalItems = inventory.length;
      const lowStockItems = inventory.filter(i => i.stock <= i.minStock).length;
      const totalRequests = requests.length;
      const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING).length;
      
      // Charts Data
      const categoryData = inventory.reduce((acc, curr) => {
          const cat = curr.category;
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);
      const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
      const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

      // Mock Movement Data
      const movementData = [
          { name: 'Lun', salidas: 12, entradas: 5 },
          { name: 'Mar', salidas: 19, entradas: 10 },
          { name: 'Mie', salidas: 8, entradas: 15 },
          { name: 'Jue', salidas: 25, entradas: 2 },
          { name: 'Vie', salidas: 15, entradas: 8 },
      ];

      return (
          <div className="space-y-6 animate-in fade-in h-full overflow-y-auto pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase">Total SKUs</p>
                              <h3 className="text-3xl font-bold text-slate-800 mt-1">{totalItems}</h3>
                          </div>
                          <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Barcode size={24} /></div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">Artículos únicos en catálogo</div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase">Alertas Stock</p>
                              <h3 className="text-3xl font-bold text-red-600 mt-1">{lowStockItems}</h3>
                          </div>
                          <div className="bg-red-50 text-red-600 p-2 rounded-lg"><AlertTriangle size={24} /></div>
                      </div>
                      <div className="mt-2 text-xs text-red-400 font-bold">Requieren reposición inmediata</div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="text-slate-500 text-xs font-bold uppercase">Pendientes</p>
                              <h3 className="text-3xl font-bold text-yellow-600 mt-1">{pendingRequests}</h3>
                          </div>
                          <div className="bg-yellow-50 text-yellow-600 p-2 rounded-lg"><Clock size={24} /></div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">Solicitudes por atender</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Movement Chart */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={18}/> Movimiento Semanal</h4>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={movementData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                                  <YAxis tick={{fontSize: 12}} />
                                  <Tooltip cursor={{fill: '#f8fafc'}} />
                                  <Legend />
                                  <Bar dataKey="salidas" name="Salidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="entradas" name="Entradas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Category Pie Chart */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PieChartIcon size={18}/> Distribución por Categoría</h4>
                      <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                      {pieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const renderLogisticsPanel = () => (
      <div className="space-y-6 animate-in fade-in h-[calc(100vh-140px)] flex flex-col">
          <div className="flex items-center gap-4 shrink-0">
              <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <ArrowLeft size={24} />
              </button>
              <div>
                  <h2 className="text-2xl font-bold text-slate-900">Gestión Logística</h2>
                  <p className="text-slate-500 text-sm">Control de Stock y Despachos</p>
              </div>
          </div>

          <div className="flex gap-4 border-b border-slate-200 shrink-0">
              <button onClick={() => setActiveTab('dashboard')} className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'dashboard' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500'}`}>
                  <BarChart2 size={16} /> Dashboard
              </button>
              <button onClick={() => setActiveTab('orders')} className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                  <ClipboardList size={16} /> Pedidos
              </button>
              <button onClick={() => setActiveTab('returns')} className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'returns' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                  <RotateCcw size={16} /> Devoluciones
              </button>
              <button onClick={() => setActiveTab('inventory')} className={`pb-3 px-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'inventory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                  <Package size={16} /> Inventario
              </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeTab === 'dashboard' && renderMetrics()}

            {activeTab === 'orders' && (
                <div className="space-y-4 h-full overflow-y-auto pb-10">
                    {requests.length === 0 ? <p className="text-slate-400">No hay pedidos.</p> : requests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : req.status === 'Entregado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.status}</span>
                                    <span className="text-xs text-slate-400">{req.date}</span>
                                </div>
                                <h4 className="font-bold text-slate-800">{req.itemName} (x{req.quantity})</h4>
                                <p className="text-sm text-slate-600">Solicitante: {req.userName} - {req.userArea}</p>
                            </div>
                            {req.status === 'Pendiente' && (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openApprovalModal(req)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Atender</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'returns' && (
                <div className="space-y-4 h-full overflow-y-auto pb-10">
                    <h3 className="font-bold text-slate-700">Ítems Prestados (Pendientes de Devolución)</h3>
                    {requests.filter(r => r.returnStatus === 'En Préstamo').length === 0 ? <p className="text-slate-400">No hay préstamos activos.</p> : 
                        requests.filter(r => r.returnStatus === 'En Préstamo').map(req => (
                            <div key={req.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-slate-800">{req.itemName} (x{req.quantity})</h4>
                                    <p className="text-sm text-slate-600">En poder de: {req.userName}</p>
                                    <p className="text-xs text-slate-400">Entregado el: {req.date}</p>
                                </div>
                                <button onClick={() => handleReturnItem(req)} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-700 flex items-center gap-2"><RotateCcw size={16} /> Registrar Retorno</button>
                            </div>
                        ))
                    }
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col shadow-sm">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-slate-700">Kardex de Inventario</h3>
                        <div className="flex gap-2">
                            <button onClick={downloadKardex} className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-2"><Download size={14} /> Exportar KARDEX PDF</button>
                            <button onClick={() => setIsAddItemModalOpen(true)} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={14} /> Nuevo Ítem</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                                <tr><th className="p-3">Ítem</th><th className="p-3">SKU</th><th className="p-3">Ubicación</th><th className="p-3 text-center">Stock</th><th className="p-3 text-right">Acciones</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {inventory.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-800">{item.name} <span className="text-[10px] text-slate-400 block">{item.category} - {item.brand}</span></td>
                                        <td className="p-3 text-slate-500 font-mono text-xs">{item.sku}</td>
                                        <td className="p-3 text-slate-600">{item.location}</td>
                                        <td className="p-3 text-center">
                                            {editMode === item.id ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <input type="number" className="w-16 border rounded p-1 text-center" value={tempStock} onChange={e => setTempStock(parseInt(e.target.value))} />
                                                    <button onClick={() => saveStock(item.id)} className="text-green-600"><Save size={16} /></button>
                                                </div>
                                            ) : (
                                                <span className={`font-bold ${item.stock <= item.minStock ? 'text-red-600' : 'text-slate-700'}`}>{item.stock} {item.unit}</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setQrItem(item)} className="text-purple-600 hover:bg-purple-50 p-1 rounded transition-colors" title="Generar QR"><QrCode size={16} /></button>
                                                <button onClick={() => startEdit(item)} className="text-blue-600 hover:underline text-xs font-bold">Ajustar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
          </div>

          {/* Modal Approval */}
          {selectedReq && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                      <h3 className="text-lg font-bold mb-4">Atender Solicitud</h3>
                      <div className="bg-slate-50 p-3 rounded mb-4 text-sm">
                          <p><strong>Solicitante:</strong> {selectedReq.userName}</p>
                          <p><strong>Ítem:</strong> {selectedReq.itemName} (x{selectedReq.quantity})</p>
                      </div>
                      <div className="space-y-3 mb-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora de Entrega</label>
                              <input type="time" value={approvalData.time} onChange={e => setApprovalData({...approvalData, time: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-blue-500" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lugar de Entrega</label>
                              <input value={approvalData.location} onChange={e => setApprovalData({...approvalData, location: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-blue-500" placeholder="Ej. Ventanilla 2" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Comentario / Motivo Rechazo</label>
                              <textarea value={approvalData.comment} onChange={e => setApprovalData({...approvalData, comment: e.target.value})} className="w-full border p-2 rounded outline-none focus:border-blue-500 h-20 resize-none" />
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => processApproval(false)} className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-bold hover:bg-red-200">Rechazar</button>
                          <button onClick={() => processApproval(true)} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Aprobar y Entregar</button>
                      </div>
                      <button onClick={() => setSelectedReq(null)} className="w-full mt-3 text-slate-400 text-xs hover:text-slate-600">Cancelar</button>
                  </div>
              </div>
          )}

          {/* Modal QR Code */}
          {qrItem && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
                      <div className="w-full flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-800">Etiqueta de Identificación</h3>
                          <button onClick={() => setQrItem(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                      </div>
                      <div id="qr-label-content" className="flex flex-col items-center p-4 border-2 border-black rounded-lg w-full bg-white">
                          <h2 className="text-sm font-bold uppercase text-center mb-2">{qrItem.name}</h2>
                          <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrItem.sku}`} 
                              alt="QR" 
                              className="w-32 h-32 mb-2"
                          />
                          <p className="text-xl font-mono font-bold tracking-wider">{qrItem.sku}</p>
                          <p className="text-xs text-slate-500 mt-1">{qrItem.category} | {qrItem.location}</p>
                      </div>
                      <button 
                          onClick={() => {
                              const win = window.open('', '', 'height=500,width=500');
                              if(win) {
                                  win.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;">');
                                  win.document.write(document.getElementById('qr-label-content')?.outerHTML || '');
                                  win.document.write('</body></html>');
                                  win.document.close();
                                  win.print();
                              }
                          }}
                          className="mt-6 w-full bg-slate-900 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
                      >
                          <Printer size={18} /> Imprimir Etiqueta
                      </button>
                  </div>
              </div>
          )}

          {/* Modal Add Item - UPDATED */}
          {isAddItemModalOpen && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                          <div>
                              <h3 className="text-lg font-bold text-slate-800">Registrar Nuevo Artículo</h3>
                              <p className="text-xs text-slate-500">Ingrese los detalles para el catálogo maestro.</p>
                          </div>
                          <button 
                            onClick={() => setIsAddItemModalOpen(false)} 
                            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                          >
                              <X size={20} />
                          </button>
                      </div>
                      
                      <form onSubmit={handleAddItem} className="p-6 space-y-6">
                          {/* General Info Section */}
                          <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Información General</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  <div className="col-span-2 md:col-span-1">
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre del Artículo <span className="text-red-500">*</span></label>
                                      <input 
                                        required 
                                        value={newItem.name} 
                                        onChange={e => setNewItem({...newItem, name: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all font-medium text-slate-700" 
                                        placeholder="Ej. Guantes de Nitrilo"
                                      />
                                  </div>
                                  <div className="col-span-2 md:col-span-1">
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">SKU / Código Interno <span className="text-red-500">*</span></label>
                                      <div className="flex gap-2">
                                          <div className="relative flex-1">
                                              <Barcode className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                              <input 
                                                required 
                                                value={newItem.sku} 
                                                onChange={e => setNewItem({...newItem, sku: e.target.value})} 
                                                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all font-mono font-bold text-slate-700" 
                                                placeholder="COD-000"
                                              />
                                          </div>
                                          <button 
                                            type="button" 
                                            onClick={generateSKU} 
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 rounded-lg font-bold text-xs transition-colors flex flex-col items-center justify-center min-w-[70px]"
                                            title="Generar Automático"
                                          >
                                              <RotateCcw size={14} className="mb-0.5" /> Generar
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-5">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Categoría</label>
                                      <div className="relative">
                                          <Tag className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                          <select 
                                            value={newItem.category} 
                                            onChange={e => setNewItem({...newItem, category: e.target.value})} 
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all appearance-none cursor-pointer text-slate-700"
                                          >
                                              <option>EPP</option>
                                              <option>Herramientas</option>
                                              <option>Insumos</option>
                                              <option>Repuestos</option>
                                              <option>Materiales</option>
                                          </select>
                                          <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
                                              <ArrowDown size={14} />
                                          </div>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Unidad de Medida</label>
                                      <select 
                                        value={newItem.unit} 
                                        onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all cursor-pointer text-slate-700 font-medium"
                                      >
                                          <option value="UND">Unidad (UND)</option>
                                          <option value="PAR">Par (PAR)</option>
                                          <option value="KG">Kilogramos (KG)</option>
                                          <option value="LITROS">Litros (L)</option>
                                          <option value="CAJA">Caja / Paquete</option>
                                          <option value="METRO">Metros (M)</option>
                                      </select>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-5">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Marca</label>
                                      <input 
                                        value={newItem.brand} 
                                        onChange={e => setNewItem({...newItem, brand: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all text-slate-700" 
                                        placeholder="Ej. 3M"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Modelo</label>
                                      <input 
                                        value={newItem.model} 
                                        onChange={e => setNewItem({...newItem, model: e.target.value})} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all text-slate-700" 
                                        placeholder="Ej. 6200"
                                      />
                                  </div>
                              </div>
                          </div>

                          {/* Inventory Logic Section */}
                          <div className="space-y-4">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Control de Stock y Ubicación</h4>
                              
                              <div className="grid grid-cols-3 gap-3">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Stock Inicial</label>
                                      <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        value={newItem.stock} 
                                        onChange={e => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all font-bold text-slate-800" 
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Stock Mín.</label>
                                      <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        value={newItem.minStock} 
                                        onChange={e => setNewItem({...newItem, minStock: parseInt(e.target.value) || 0})} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all font-bold text-orange-600" 
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Stock Máx.</label>
                                      <input 
                                        type="number" 
                                        required 
                                        min="0"
                                        value={newItem.maxStock} 
                                        onChange={e => setNewItem({...newItem, maxStock: parseInt(e.target.value) || 0})} 
                                        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all font-bold text-blue-600" 
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Ubicación en Almacén</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <input 
                                            value={newItem.location} 
                                            onChange={e => setNewItem({...newItem, location: e.target.value})} 
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all text-slate-700" 
                                            placeholder="Ej. Pasillo A, Estante 2" 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Proveedor (Opcional)</label>
                                    <div className="relative">
                                        <Factory className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                        <input 
                                            value={newItem.supplier} 
                                            onChange={e => setNewItem({...newItem, supplier: e.target.value})} 
                                            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition-all text-slate-700" 
                                            placeholder="Ej. Ferretería Industrial SAC" 
                                        />
                                    </div>
                                </div>
                              </div>

                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                                  <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <input 
                                        type="checkbox" 
                                        checked={newItem.requiresReturn} 
                                        onChange={e => setNewItem({...newItem, requiresReturn: e.target.checked})} 
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer" 
                                    />
                                  </div>
                                  <div>
                                      <p className="text-sm font-bold text-blue-900">Requiere Devolución (Activo Fijo / Herramienta)</p>
                                      <p className="text-xs text-blue-700 mt-0.5">Si se marca, el sistema exigirá el retorno de este ítem después de su uso.</p>
                                  </div>
                              </div>
                          </div>

                          {/* Image Upload */}
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-2">Imagen de Referencia</label>
                              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-blue-400 transition-all cursor-pointer relative group">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                  />
                                  {newItem.image ? (
                                      <div className="relative inline-block">
                                          <img src={newItem.image} alt="Preview" className="h-24 rounded-lg shadow-md border border-slate-200" />
                                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <span className="text-white text-xs font-bold">Cambiar</span>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                                          <div className="p-3 bg-slate-100 rounded-full group-hover:bg-blue-50 transition-colors">
                                            <ImageIcon size={24} />
                                          </div>
                                          <p className="text-sm font-medium">Haga clic o arrastre una imagen aquí</p>
                                          <p className="text-xs opacity-70">PNG, JPG hasta 5MB</p>
                                      </div>
                                  )}
                              </div>
                          </div>

                          <div className="flex gap-3 pt-4 border-t border-slate-100">
                              <button 
                                type="button" 
                                onClick={() => setIsAddItemModalOpen(false)} 
                                className="flex-1 py-3 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors"
                              >
                                  Cancelar
                              </button>
                              <button 
                                type="submit" 
                                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-2"
                              >
                                  <Save size={18} /> Guardar Artículo
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="min-h-screen">
       {view === 'menu' && renderMenu()}
       {view === 'logistics_panel' && renderLogisticsPanel()}
       {view === 'sst_docs' && (
           <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center gap-4"><button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Documentación SSOMA</h2></div>
                <SSTModule />
           </div>
       )}
       {view === 'request_epp' && (
           <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center gap-4"><button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Pedidos Almacén</h2></div>
                <WarehouseModule />
           </div>
       )}
       {view === 'training_news' && renderTrainingNews()}
    </div>
  );
};
