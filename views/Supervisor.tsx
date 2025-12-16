
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useLocation } from 'react-router-dom';
import { db } from '../services/mockDb';
import { analyzeIncidentAI } from '../services/geminiService';
import { generateDocumentPDF } from '../services/pdfService';
import { IncidentReport, IncidentStatus, SSTDocument, SSTDocumentType, Training, NewsItem, QuizQuestion } from '../types';
import { SSTModule } from '../components/SSTModule';
import { WarehouseModule } from '../components/WarehouseModule';
import { 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  FileText, 
  ArrowLeft,
  XCircle,
  Activity,
  CalendarCheck,
  Printer,
  Users,
  Megaphone,
  GraduationCap,
  Plus,
  Trash2,
  PackageSearch,
  BarChart2,
  PieChart as PieChartIcon,
  MapPin,
  UserCheck,
  FileSearch,
  CheckSquare,
  Loader2,
  BrainCircuit
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type SupervisorView = 'menu' | 'safety_panel' | 'sst_docs' | 'warehouse' | 'training_news';

export const SupervisorDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [view, setView] = useState<SupervisorView>('menu');

  // --- Safety Panel State ---
  const [activeTab, setActiveTab] = useState<'approvals' | 'incidents' | 'metrics'>('metrics'); // Default to metrics for visual impact
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [pendingDocs, setPendingDocs] = useState<SSTDocument[]>([]);
  const [allDocsHistory, setAllDocsHistory] = useState<SSTDocument[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  // Approval Logic
  const [selectedDoc, setSelectedDoc] = useState<SSTDocument | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // --- Training & News State ---
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [trainingTab, setTrainingTab] = useState<'create_training' | 'create_news' | 'results'>('create_training');
  
  // New Training Form
  const [newTraining, setNewTraining] = useState({ title: '', description: '', duration: 1, date: new Date().toISOString().split('T')[0] });
  const [questions, setQuestions] = useState<QuizQuestion[]>([{ id: 'q1', question: '', options: ['', ''], correctOptionIndex: 0 }]);

  // New News Form
  const [newNews, setNewNews] = useState({ title: '', content: '', priority: 'Normal' as 'Normal' | 'Alta' | 'Urgente' });

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/supervisor/incidents')) setView('safety_panel');
    else if (path.includes('/supervisor/sst')) setView('sst_docs');
    else if (path.includes('/supervisor/training')) setView('training_news');
    else if (path.includes('/supervisor/warehouse')) setView('warehouse');
    else setView('menu');

    if (user?.companyId) {
      setIncidents(db.incidents.getByCompany(user.companyId));
      const allDocs = db.documents.getByCompany(user.companyId);
      setAllDocsHistory(allDocs);
      setPendingDocs(allDocs.filter(d => d.status === 'Pending'));
      
      setTrainings(db.trainings.getByCompany(user.companyId));
      setNews(db.news.getByCompany(user.companyId));
    }
  }, [user, location.pathname]); // Removed activeTab dependency to prevent view reset

  // --- Handlers ---
  
  const handleDocAction = (status: 'Approved' | 'Rejected') => {
    if(!selectedDoc || !user?.companyId) return;
    
    if (status === 'Rejected' && !approvalComment.trim()) {
        alert("Por favor, ingrese un comentario explicando el motivo del rechazo.");
        return;
    }

    const updatedDoc: SSTDocument = {
        ...selectedDoc,
        status: status,
        approvedBy: user.name,
        approvalComment: approvalComment
    };
    db.documents.update(updatedDoc);
    
    // Refresh lists
    const currentDocs = db.documents.getByCompany(user.companyId);
    setAllDocsHistory(currentDocs);
    setPendingDocs(currentDocs.filter(d => d.status === 'Pending'));
    
    setSelectedDoc(null);
    setApprovalComment('');
    alert(`Documento ${status === 'Approved' ? 'Aprobado y Firmado' : 'Rechazado y Devuelto al Trabajador'}`);
  };

  const handlePreviewPDF = () => {
      if(selectedDoc) {
          const company = db.companies.getById(selectedDoc.companyId);
          generateDocumentPDF(selectedDoc, company?.name || "Empresa");
      }
  };

  const handleAnalyze = async (incident: IncidentReport) => {
    setAnalyzingId(incident.id);
    const analysis = await analyzeIncidentAI(incident.description);
    const updated = { ...incident, aiAnalysis: analysis, status: IncidentStatus.IN_REVIEW };
    db.incidents.update(updated);
    setIncidents(prev => prev.map(i => i.id === incident.id ? updated : i));
    setAnalyzingId(null);
  };

  const handleResolve = (incident: IncidentReport) => {
     const updated = { ...incident, status: IncidentStatus.RESOLVED };
     db.incidents.update(updated);
     setIncidents(prev => prev.map(i => i.id === incident.id ? updated : i));
  };

  // --- Training Handlers ---
  const handleAddQuestion = () => {
      setQuestions([...questions, { id: `q${Date.now()}`, question: '', options: ['', ''], correctOptionIndex: 0 }]);
  };

  const handleRemoveQuestion = (idx: number) => {
      setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, val: any) => {
      const updated = [...questions];
      if (field === 'question') updated[idx].question = val;
      if (field === 'correctOptionIndex') updated[idx].correctOptionIndex = val;
      setQuestions(updated);
  };

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
      const updated = [...questions];
      updated[qIdx].options[oIdx] = val;
      setQuestions(updated);
  };

  const addOption = (qIdx: number) => {
      const updated = [...questions];
      updated[qIdx].options.push('');
      setQuestions(updated);
  };

  const handleCreateTraining = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.companyId) return;

      const training: Training = {
          id: `t-${Date.now()}`,
          companyId: user.companyId,
          title: newTraining.title,
          description: newTraining.description,
          durationHours: newTraining.duration,
          date: newTraining.date,
          questions: questions.filter(q => q.question.trim() !== '')
      };

      db.trainings.create(training);
      setTrainings(db.trainings.getByCompany(user.companyId));
      setNewTraining({ title: '', description: '', duration: 1, date: new Date().toISOString().split('T')[0] });
      setQuestions([{ id: 'q1', question: '', options: ['', ''], correctOptionIndex: 0 }]);
      alert("Capacitación y Examen Creados Exitosamente.");
  };

  const handleCreateNews = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.companyId) return;

      const item: NewsItem = {
          id: `n-${Date.now()}`,
          companyId: user.companyId,
          title: newNews.title,
          content: newNews.content,
          date: new Date().toISOString().split('T')[0],
          priority: newNews.priority,
          authorName: user.name
      };
      
      db.news.create(item);
      setNews(db.news.getByCompany(user.companyId));
      setNewNews({ title: '', content: '', priority: 'Normal' });
      alert("Noticia Publicada.");
  };

  // --- Views ---

  const renderMenu = () => (
    <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Ingeniería SSOMA</h1>
            <p className="text-slate-500 text-lg">Bienvenido Supervisor, {user?.name}. Gestión de riesgos y operaciones.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div 
                onClick={() => setView('safety_panel')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-red-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                    <Activity size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-red-700 transition-colors">Gestión SSOMA</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-4">
                    Control de incidentes, aprobación de permisos y métricas de seguridad.
                </p>
                {pendingDocs.length > 0 && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse border border-red-200">
                        <AlertTriangle size={14} /> {pendingDocs.length} Pendientes
                    </div>
                )}
            </div>

            <div 
                onClick={() => setView('sst_docs')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-purple-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                    <FileText size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-700 transition-colors">Documentos SSOMA</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Biblioteca técnica. IPERC, ATS, PETS y Permisos de Alto Riesgo.
                </p>
            </div>

            <div 
                onClick={() => setView('training_news')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-blue-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Megaphone size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">Capacitación</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Programación de charlas, exámenes y comunicados generales.
                </p>
            </div>

            <div 
                onClick={() => setView('warehouse')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-orange-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300">
                    <PackageSearch size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-orange-700 transition-colors">Pedidos Almacén</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Solicitud de EPPs, herramientas y materiales operativos.
                </p>
            </div>
        </div>
    </div>
  );

  // --- Sub-renderers for Document Viewer ---
  
  const renderDocContent = (doc: SSTDocument) => {
      if (!doc.data) return <div className="text-center p-4 text-slate-400">Sin datos visualizables.</div>;

      switch(doc.type) {
          case SSTDocumentType.IPERC:
              return (
                  <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                          <div><span className="font-bold text-slate-500 text-xs uppercase">Área:</span> <p className="font-bold">{doc.data.metadata?.area}</p></div>
                          <div><span className="font-bold text-slate-500 text-xs uppercase">Tarea:</span> <p className="font-bold">{doc.data.metadata?.task}</p></div>
                      </div>
                      
                      <div className="border border-slate-200 rounded overflow-hidden">
                          <table className="w-full text-xs">
                              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                  <tr><th className="p-2 text-left">Peligro</th><th className="p-2 text-left">Riesgo</th><th className="p-2 text-center">Nivel</th><th className="p-2 text-left">Control</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {doc.data.matrix?.map((row: any, i: number) => (
                                      <tr key={i}>
                                          <td className="p-2 align-top text-slate-700">{row.danger}</td>
                                          <td className="p-2 align-top text-slate-600">{row.risk}</td>
                                          <td className="p-2 align-top text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${row.evaluation?.label === 'ALTO' ? 'bg-red-500' : row.evaluation?.label === 'MEDIO' ? 'bg-yellow-500 text-black' : 'bg-green-500'}`}>{row.evaluation?.label}</span></td>
                                          <td className="p-2 align-top text-slate-700">{row.control}</td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                      <div className="bg-slate-50 p-2 rounded text-xs text-slate-500">
                          <strong>Trabajadores:</strong> {doc.data.workers?.map((w: any) => w.name).join(', ')}
                      </div>
                  </div>
              );
          case SSTDocumentType.ATS:
              return (
                  <div className="space-y-4 text-sm">
                      <div className="bg-slate-50 p-3 rounded border border-slate-200">
                          <p className="font-bold text-slate-800">{doc.data.meta?.description}</p>
                          <p className="text-xs text-slate-500 mt-1">Lugar: {doc.data.meta?.area}</p>
                      </div>
                      <div className="space-y-2">
                          <h4 className="font-bold text-xs uppercase text-slate-500 border-b pb-1">Pasos de la Tarea</h4>
                          {doc.data.steps?.map((step: any, i: number) => (
                              <div key={i} className="flex gap-2 text-xs border-b border-slate-100 pb-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">{i+1}</div>
                                  <div className="grid grid-cols-1 gap-1 w-full">
                                      <p className="font-bold text-slate-800">{step.step}</p>
                                      <p className="text-slate-600"><span className="text-red-500 font-bold">Riesgo:</span> {step.risk}</p>
                                      <p className="text-slate-600"><span className="text-blue-500 font-bold">Control:</span> {step.control}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              );
          case SSTDocumentType.CHECKLIST:
              return (
                  <div className="space-y-3 text-sm">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs font-bold text-center">
                          {doc.title}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                          {doc.data.checks && Object.entries(doc.data.checks).map(([key, val]: any, i: number) => (
                              <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-1">
                                  <span className="text-slate-600 text-xs">{key}</span>
                                  {val === 'pass' ? <CheckCircle size={16} className="text-green-500" /> : val === 'fail' ? <XCircle size={16} className="text-red-500" /> : <span className="text-slate-300">-</span>}
                              </div>
                          ))}
                      </div>
                  </div>
              );
          default:
              return <div className="text-slate-500 italic">Vista previa no disponible para este formato. Descargue el PDF.</div>
      }
  };

  const renderMetrics = () => {
      // 1. Docs by User
      const docsByUser: Record<string, number> = {};
      allDocsHistory.forEach(d => { docsByUser[d.createdBy] = (docsByUser[d.createdBy] || 0) + 1; });
      const barDataUser = Object.entries(docsByUser).map(([name, count]) => ({ name: name.split(' ')[0], count })).sort((a,b) => b.count - a.count).slice(0, 5);

      // 2. Docs by Type
      const docsByType: Record<string, number> = {};
      allDocsHistory.forEach(d => { docsByType[d.type] = (docsByType[d.type] || 0) + 1; });
      const pieDataType = Object.entries(docsByType).map(([type, value]) => ({ name: type, value }));
      const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#a855f7', '#f97316'];

      // 3. Simulated Hazards (In real app, analyze IPERC JSONs)
      const topHazards = [
          { name: 'Caída a desnivel', count: 12 },
          { name: 'Ruido excesivo', count: 8 },
          { name: 'Polvo respirable', count: 7 },
          { name: 'Cargas suspendidas', count: 5 }
      ];

      return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in h-full overflow-y-auto pb-10">
              {/* Cards Row */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                      <FileSearch size={28} className="text-blue-600 mb-2" />
                      <span className="text-3xl font-bold text-slate-800">{allDocsHistory.length}</span>
                      <span className="text-xs text-slate-500 uppercase font-bold">Documentos Totales</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                      <UserCheck size={28} className="text-green-600 mb-2" />
                      <span className="text-3xl font-bold text-slate-800">{barDataUser.length}</span>
                      <span className="text-xs text-slate-500 uppercase font-bold">Usuarios Activos</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                      <AlertTriangle size={28} className="text-red-500 mb-2" />
                      <span className="text-3xl font-bold text-slate-800">{topHazards.reduce((a,b) => a + b.count, 0)}</span>
                      <span className="text-xs text-slate-500 uppercase font-bold">Riesgos Críticos</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
                      <MapPin size={28} className="text-purple-500 mb-2" />
                      <span className="text-3xl font-bold text-slate-800">4</span>
                      <span className="text-xs text-slate-500 uppercase font-bold">Áreas Operativas</span>
                  </div>
              </div>

              {/* Chart: Docs by Type */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChartIcon size={18}/> Distribución por Tipo</h4>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={pieDataType} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {pieDataType.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Chart: Top Users */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart2 size={18}/> Top Usuarios Generadores</h4>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barDataUser} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11}} />
                              <Tooltip cursor={{fill: '#f1f5f9'}} />
                              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Chart: Top Hazards */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Peligros Recurrentes (Semanales)</h4>
                  <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topHazards}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" tick={{fontSize: 12}} />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      );
  };

  const renderSafetyPanel = () => {
    return (
        <div className="space-y-6 animate-in fade-in h-[calc(100vh-140px)] flex flex-col">
            <div className="flex items-center gap-4 shrink-0">
                <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Ingeniería de Seguridad</h2>
                    <p className="text-slate-500 text-sm">Control de Pérdidas y Gestión de Riesgos</p>
                </div>
            </div>
            
            <div className="flex space-x-4 border-b border-slate-200 shrink-0">
                <button onClick={() => setActiveTab('metrics')} className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'metrics' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500'}`}>
                    <BarChart2 size={16} /> Métricas y KPIs
                </button>
                <button onClick={() => setActiveTab('approvals')} className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'approvals' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                    <FileText size={16}/> Aprobación Documentaria
                </button>
                <button onClick={() => setActiveTab('incidents')} className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 ${activeTab === 'incidents' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500'}`}>
                    <AlertTriangle size={16} /> Gestión Incidentes
                </button>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'metrics' && renderMetrics()}

                {activeTab === 'approvals' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        {/* List Column */}
                        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                                <span>Bandeja de Entrada</span>
                                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingDocs.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {pendingDocs.length === 0 && <p className="text-center text-slate-400 py-10 text-sm">No hay documentos pendientes.</p>}
                                {pendingDocs.map(doc => (
                                    <div key={doc.id} onClick={() => setSelectedDoc(doc)} className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedDoc?.id === doc.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-slate-800 text-sm line-clamp-1">{doc.title}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${doc.type === 'IPERC' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{doc.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                                            <Users size={12} /> {doc.createdBy}
                                            <span className="text-slate-300">|</span>
                                            <CalendarCheck size={12} /> {doc.createdAt}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Detail/Review Column */}
                        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                            {selectedDoc ? (
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start shrink-0">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">{selectedDoc.title}</h3>
                                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{selectedDoc.type} - ID: {selectedDoc.id}</p>
                                        </div>
                                        <button 
                                            onClick={handlePreviewPDF} 
                                            className="bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors" 
                                            title="Generar PDF Oficial"
                                        >
                                            <Printer size={18} /> Imprimir Hoja
                                        </button>
                                    </div>
                                    
                                    {/* Scrollable Document Content */}
                                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-full">
                                            {renderDocContent(selectedDoc)}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                                        <label className="text-xs font-bold text-slate-700 uppercase mb-2 block">Comentarios del Supervisor</label>
                                        <div className="flex gap-4">
                                            <textarea 
                                                value={approvalComment} 
                                                onChange={(e) => setApprovalComment(e.target.value)} 
                                                className="flex-1 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 h-20" 
                                                placeholder="Escriba observaciones obligatorias si va a rechazar..." 
                                            />
                                            <div className="flex flex-col gap-2 w-48">
                                                <button onClick={() => handleDocAction('Approved')} className="flex-1 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors shadow-lg text-sm">
                                                    <CheckCircle size={16} /> Aprobar y Firmar
                                                </button>
                                                <button onClick={() => handleDocAction('Rejected')} className="flex-1 bg-white text-red-600 border border-red-200 rounded-lg font-bold hover:bg-red-50 flex items-center justify-center gap-2 transition-colors text-sm">
                                                    <XCircle size={16} /> Rechazar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                                    <FileSearch size={48} className="mb-4 text-slate-200" />
                                    <p className="font-medium">Selecciona un documento de la lista para auditar su contenido.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'incidents' && (
                    <div className="space-y-4 h-full overflow-y-auto pb-10">
                        {incidents.map(incident => (
                            <div key={incident.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${incident.status === IncidentStatus.RESOLVED ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {incident.status === IncidentStatus.RESOLVED ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Reporte #{incident.id}</h3>
                                            <p className="text-xs text-slate-500 font-bold">Reportado por: {incident.userName} <span className="font-normal">• {incident.date}</span></p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${incident.status === IncidentStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''} ${incident.status === IncidentStatus.RESOLVED ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>{incident.status}</span>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-lg mb-4 text-slate-700 text-sm leading-relaxed border border-slate-100">{incident.description}</div>
                                
                                {analyzingId === incident.id ? (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center gap-3">
                                        <Loader2 className="animate-spin text-blue-600" size={20} />
                                        <span className="text-blue-700 text-sm font-medium">Analizando causas raíz con Gemini AI...</span>
                                    </div>
                                ) : incident.aiAnalysis ? (
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                                        <h4 className="text-purple-800 font-bold text-sm flex items-center gap-2 mb-2">
                                            <BrainCircuit size={16} /> Análisis Inteligente
                                        </h4>
                                        <div className="text-xs text-purple-700 whitespace-pre-wrap leading-relaxed">
                                            {incident.aiAnalysis}
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={() => handleAnalyze(incident)} className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1 mb-4">
                                        <BrainCircuit size={14} /> Analizar con IA
                                    </button>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    {incident.status !== IncidentStatus.RESOLVED && (
                                        <button onClick={() => handleResolve(incident)} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 shadow-md">Cerrar Investigación</button>
                                    )}
                                </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  };

  const renderTrainingNews = () => (
      <div className="space-y-6 animate-in fade-in h-[calc(100vh-140px)] flex flex-col">
          <div className="flex items-center gap-4 shrink-0">
              <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <ArrowLeft size={24} />
              </button>
              <div>
                  <h2 className="text-2xl font-bold text-slate-900">Capacitación y Comunicaciones</h2>
                  <p className="text-slate-500 text-sm">Creación de contenido y seguimiento.</p>
              </div>
          </div>

          <div className="flex space-x-4 border-b border-slate-200 shrink-0">
              <button onClick={() => setTrainingTab('create_training')} className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 ${trainingTab === 'create_training' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>
                  <GraduationCap size={16} /> Crear Capacitación
              </button>
              <button onClick={() => setTrainingTab('create_news')} className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 ${trainingTab === 'create_news' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500'}`}>
                  <Megaphone size={16}/> Publicar Noticia
              </button>
              <button onClick={() => setTrainingTab('results')} className={`pb-3 px-2 font-medium text-sm border-b-2 flex items-center gap-2 ${trainingTab === 'results' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500'}`}>
                  <BarChart2 size={16} /> Resultados y Avance
              </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-10">
              {trainingTab === 'create_training' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-slate-800 mb-4">Nueva Capacitación</h3>
                          <form onSubmit={handleCreateTraining} className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Título del Curso</label>
                                  <input required value={newTraining.title} onChange={e => setNewTraining({...newTraining, title: e.target.value})} className="w-full border p-2 rounded text-sm" placeholder="Ej. Trabajo en Altura" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                                  <textarea required value={newTraining.description} onChange={e => setNewTraining({...newTraining, description: e.target.value})} className="w-full border p-2 rounded text-sm h-20 resize-none" placeholder="Objetivos del curso..." />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Duración (Hrs)</label>
                                      <input type="number" required value={newTraining.duration} onChange={e => setNewTraining({...newTraining, duration: parseInt(e.target.value)})} className="w-full border p-2 rounded text-sm" />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1">Fecha Límite</label>
                                      <input type="date" required value={newTraining.date} onChange={e => setNewTraining({...newTraining, date: e.target.value})} className="w-full border p-2 rounded text-sm" />
                                  </div>
                              </div>
                              
                              <div className="border-t pt-4">
                                  <div className="flex justify-between items-center mb-2">
                                      <h4 className="text-sm font-bold text-slate-700">Preguntas del Examen</h4>
                                      <button type="button" onClick={handleAddQuestion} className="text-xs text-blue-600 font-bold flex items-center gap-1"><Plus size={12} /> Agregar Pregunta</button>
                                  </div>
                                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                      {questions.map((q, qIdx) => (
                                          <div key={q.id} className="bg-slate-50 p-3 rounded border border-slate-200">
                                              <div className="flex justify-between mb-2">
                                                  <span className="text-xs font-bold text-slate-500">Pregunta {qIdx + 1}</span>
                                                  {questions.length > 1 && <button type="button" onClick={() => handleRemoveQuestion(qIdx)} className="text-red-500"><Trash2 size={12} /></button>}
                                              </div>
                                              <input required value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} className="w-full border p-2 rounded text-sm mb-2" placeholder="Enunciado de la pregunta" />
                                              <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                                                  {q.options.map((opt, oIdx) => (
                                                      <div key={oIdx} className="flex items-center gap-2">
                                                          <input type="radio" name={`correct-${q.id}`} checked={q.correctOptionIndex === oIdx} onChange={() => updateQuestion(qIdx, 'correctOptionIndex', oIdx)} className="cursor-pointer" />
                                                          <input required value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)} className="flex-1 border p-1 rounded text-xs" placeholder={`Opción ${oIdx + 1}`} />
                                                      </div>
                                                  ))}
                                                  <button type="button" onClick={() => addOption(qIdx)} className="text-[10px] text-blue-500 hover:underline">+ Opción</button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors">Crear Capacitación</button>
                          </form>
                      </div>

                      <div className="space-y-4">
                          <h3 className="font-bold text-slate-800">Cursos Activos</h3>
                          {trainings.map(t => (
                              <div key={t.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                  <h4 className="font-bold text-slate-900">{t.title}</h4>
                                  <p className="text-xs text-slate-500 mb-2">{t.description}</p>
                                  <div className="flex justify-between text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded">
                                      <span>{t.durationHours} Horas</span>
                                      <span>Vence: {t.date}</span>
                                      <span>{t.questions?.length || 0} Preguntas</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {trainingTab === 'create_news' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-slate-800 mb-4">Redactar Noticia</h3>
                          <form onSubmit={handleCreateNews} className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Título</label>
                                  <input required value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} className="w-full border p-2 rounded text-sm" placeholder="Título del comunicado" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Prioridad</label>
                                  <select value={newNews.priority} onChange={e => setNewNews({...newNews, priority: e.target.value as any})} className="w-full border p-2 rounded text-sm">
                                      <option>Normal</option>
                                      <option>Alta</option>
                                      <option>Urgente</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Contenido</label>
                                  <textarea required value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} className="w-full border p-2 rounded text-sm h-32 resize-none" placeholder="Cuerpo del mensaje..." />
                              </div>
                              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition-colors">Publicar</button>
                          </form>
                      </div>
                      <div className="space-y-4">
                          <h3 className="font-bold text-slate-800">Noticias Recientes</h3>
                          {news.map(n => (
                              <div key={n.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
                                  {n.priority === 'Urgente' && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl font-bold">URGENTE</div>}
                                  <h4 className="font-bold text-slate-900">{n.title}</h4>
                                  <p className="text-sm text-slate-600 mt-1">{n.content}</p>
                                  <p className="text-[10px] text-slate-400 mt-2 text-right">{n.date} • {n.authorName}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {trainingTab === 'results' && (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-800 mb-4">Resultados de Evaluaciones</h3>
                      <div className="text-center text-slate-500 py-10">
                          <BarChart2 size={48} className="mx-auto mb-4 text-slate-300" />
                          <p>Visualización de notas y cumplimiento de personal en desarrollo.</p>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen">
       {view === 'menu' && renderMenu()}
       {view === 'safety_panel' && renderSafetyPanel()}
       {view === 'training_news' && renderTrainingNews()}
       {view === 'sst_docs' && (
           <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center gap-4"><button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Documentación SSOMA</h2></div>
                <SSTModule />
           </div>
       )}
       {view === 'warehouse' && (
           <div className="space-y-6 animate-in fade-in">
                <div className="flex items-center gap-4"><button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Pedidos Almacén</h2></div>
                <WarehouseModule />
           </div>
       )}
    </div>
  );
};
