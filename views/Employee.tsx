
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useLocation } from 'react-router-dom';
import { db } from '../services/mockDb';
import { IncidentReport, IncidentStatus, Training, TrainingAttempt, NewsItem } from '../types';
import { SSTModule } from '../components/SSTModule';
import { WarehouseModule } from '../components/WarehouseModule';
import { 
    AlertTriangle, 
    CheckCircle2, 
    Video, 
    FileText, 
    HardHat, 
    ArrowLeft, 
    ShieldCheck,
    PackageSearch,
    Megaphone,
    PlayCircle,
    Award,
    XCircle,
    BookOpenCheck,
    Briefcase
} from 'lucide-react';

type EmployeeView = 'menu' | 'my_space' | 'sst_docs' | 'warehouse' | 'training_news';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [view, setView] = useState<EmployeeView>('menu');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Data State
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [attempts, setAttempts] = useState<TrainingAttempt[]>([]);

  // Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Training | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{score: number, passed: boolean} | null>(null);

  useEffect(() => {
    // Navigation Router Logic
    const path = location.pathname;
    if (path.includes('/employee/sst')) setView('sst_docs');
    else if (path.includes('/employee/training')) setView('training_news');
    else if (path.includes('/employee/warehouse')) setView('warehouse');
    else setView('menu');

    if (user?.companyId) {
        setTrainings(db.trainings.getByCompany(user.companyId));
        setNews(db.news.getByCompany(user.companyId));
        const allAttempts = db.trainings.results.getAll();
        setAttempts(allAttempts.filter(a => a.userId === user.id));
    }
  }, [user, location.pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.companyId) return;

    const incident: IncidentReport = {
      id: `inc-${Date.now()}`,
      companyId: user.companyId,
      userId: user.id,
      userName: user.name,
      date: new Date().toISOString().split('T')[0],
      description: description,
      status: IncidentStatus.PENDING
    };

    db.incidents.create(incident);
    setDescription('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const startQuiz = (t: Training) => {
      setActiveQuiz(t);
      setQuizAnswers({});
      setQuizResult(null);
  };

  const submitQuiz = () => {
      if(!activeQuiz || !user) return;
      
      let correctCount = 0;
      const total = activeQuiz.questions?.length || 0;
      
      activeQuiz.questions?.forEach(q => {
          if (quizAnswers[q.id] === q.correctOptionIndex) {
              correctCount++;
          }
      });

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

  const closeQuiz = () => {
      setActiveQuiz(null);
      const allAttempts = db.trainings.results.getAll();
      setAttempts(allAttempts.filter(a => a.userId === user?.id));
  };

  const renderMenu = () => (
    <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Hola, {user?.name}</h1>
            <p className="text-slate-500 text-lg">Panel del Colaborador - ZELCON</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
                onClick={() => setView('my_space')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-blue-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">Seguridad y Avisos</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Reporta incidentes, revisa comunicados y completa tus cursos pendientes.
                </p>
                {news.length > 0 && (
                    <div className="mt-4 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-blue-200">
                        <Megaphone size={14} /> {news.length} Avisos Nuevos
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
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-purple-700 transition-colors">Documentos SSOMA</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Completa tus ATS, Checklists e IPERC Continuo antes de iniciar labores.
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
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-orange-700 transition-colors">Pedidos Almacén</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Solicita herramientas, EPPs e insumos. Revisa el estado de tus vales.
                </p>
            </div>
        </div>
    </div>
  );

  const renderMySpace = () => (
      <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center gap-4">
              <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button>
              <h2 className="text-2xl font-bold text-slate-900">Mi Espacio de Seguridad</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Column 1: Incident Report */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-red-600">
                        <AlertTriangle size={24} />
                        <h2 className="text-lg font-bold text-slate-900">Reportar Acto o Condición</h2>
                    </div>
                    
                    {success ? (
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 mb-4 font-medium border border-green-100">
                        <CheckCircle2 size={20} />
                        Reporte enviado correctamente.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                            Describe qué sucedió o qué observaste
                            </label>
                            <textarea
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none bg-slate-50 text-slate-900"
                            placeholder="Ej: Vi una mancha de aceite cerca a la faja transportadora..."
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                        >
                            Enviar Reporte
                        </button>
                        </form>
                    )}
                </div>

                {/* News Feed */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Megaphone size={18} /> Noticias y Comunicados</h3>
                    <div className="space-y-3">
                        {news.length === 0 ? <p className="text-slate-400 text-sm">No hay noticias recientes.</p> : 
                            news.map(n => (
                                <div key={n.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                                        {n.priority === 'Urgente' && <span className="bg-red-100 text-red-600 text-[10px] px-2 rounded-full font-bold border border-red-200">URGENTE</span>}
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">{n.content}</p>
                                    <p className="text-[10px] text-slate-400 text-right">{n.date} - {n.authorName}</p>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

            {/* Column 2 & 3: Training & Quiz */}
            <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-800">Capacitaciones y Exámenes</h2>
                
                {/* Active Quiz View */}
                {activeQuiz ? (
                    <div className="bg-white p-8 rounded-xl border border-blue-200 shadow-xl animate-in zoom-in duration-200">
                        {quizResult ? (
                            <div className="text-center py-8">
                                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${quizResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {quizResult.passed ? <Award size={48} /> : <XCircle size={48} />}
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{quizResult.passed ? '¡Felicidades, Aprobado!' : 'No Aprobado'}</h3>
                                <p className="text-lg text-slate-600 mb-6">Tu nota: <span className="font-bold">{quizResult.score}/100</span></p>
                                <button onClick={closeQuiz} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg">Volver</button>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-6 border-b pb-4">
                                    <h3 className="text-xl font-bold text-slate-900">{activeQuiz.title}</h3>
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">Examen en Curso</span>
                                </div>
                                <div className="space-y-8">
                                    {activeQuiz.questions?.map((q, idx) => (
                                        <div key={q.id}>
                                            <p className="font-bold text-slate-800 mb-3">{idx + 1}. {q.question}</p>
                                            <div className="space-y-2">
                                                {q.options.map((opt, oIdx) => (
                                                    <label key={oIdx} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${quizAnswers[q.id] === oIdx ? 'bg-blue-50 border-blue-500 shadow-sm' : 'hover:bg-slate-50 border-slate-200'}`}>
                                                        <input type="radio" name={q.id} checked={quizAnswers[q.id] === oIdx} onChange={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})} className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm text-slate-700 font-medium">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 pt-4 border-t flex justify-end gap-4">
                                    <button onClick={() => setActiveQuiz(null)} className="text-slate-500 hover:text-slate-700 font-bold transition-colors">Cancelar</button>
                                    <button onClick={submitQuiz} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition-colors">Enviar Respuestas</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // List of Trainings
                    <div className="grid grid-cols-1 gap-4">
                        {trainings.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-400">
                                No tienes capacitaciones asignadas.
                            </div>
                        ) : (
                            trainings.map(t => {
                                const attempt = attempts.find(a => a.trainingId === t.id);
                                const isPassed = attempt?.status === 'Aprobado';
                                
                                return (
                                    <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all group">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                                                    {t.title}
                                                    {isPassed && <CheckCircle2 size={16} className="text-green-500" />}
                                                </h3>
                                                <p className="text-sm text-slate-500 mt-1">{t.description}</p>
                                            </div>
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                                <Video size={20} />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-xs text-slate-500 font-medium">
                                                <span>Duración: {t.durationHours} hrs</span>
                                                <span className="mx-2 text-slate-300">•</span>
                                                <span>Vence: {t.date}</span>
                                            </div>
                                            
                                            {isPassed ? (
                                                <span className="text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-3 py-1 rounded-full">Completado ({attempt.score}/100)</span>
                                            ) : (
                                                <button 
                                                    onClick={() => startQuiz(t)} 
                                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-2 transition-colors shadow-md"
                                                >
                                                    <PlayCircle size={14} /> {attempt ? 'Reintentar Examen' : 'Iniciar Curso y Examen'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
  );

  const renderTrainingNews = () => (
      <div className="animate-in fade-in">
          {renderMySpace()}
      </div>
  );

  return (
    <div className="min-h-screen">
      {view === 'menu' && renderMenu()}
      {view === 'my_space' && renderMySpace()}
      {view === 'training_news' && renderMySpace()} {/* Reusing Training View for now */}
      {view === 'sst_docs' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-4"><button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Documentación SSOMA</h2></div>
            <SSTModule />
          </div>
      )}
      {view === 'warehouse' && (
           <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-4"><button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><ArrowLeft size={24} /></button><h2 className="text-2xl font-bold">Pedidos Almacén</h2></div>
            <WarehouseModule />
          </div>
      )}
    </div>
  );
};
