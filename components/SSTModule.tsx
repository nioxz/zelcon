
import React, { useState } from 'react';
import { SSTDocument, SSTDocumentType, UserRole } from '../types';
import { db } from '../services/mockDb';
import { useAuth } from '../App';
import { generateDocumentPDF } from '../services/pdfService';
import { 
  FileText, 
  ShieldAlert, 
  CheckSquare, 
  FileCheck, 
  Download, 
  ArrowLeft, 
  Plus, 
  Save, 
  Eye,
  Printer,
  Trash2,
  Users,
  Camera,
  Image as ImageIcon,
  FileSignature,
  HardHat,
  Glasses,
  Ear,
  Footprints,
  Shirt,
  Flame,
  ScanFace,
  Anchor,
  Briefcase,
  Droplets,
  FlaskConical,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Upload,
  FileUp,
  Lock,
  MessageSquare
} from 'lucide-react';

export const SSTModule = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'list' | 'create_iperc' | 'create_ats' | 'create_checklist' | 'create_petar' | 'view_pets'>('list');
  const [documents, setDocuments] = useState<SSTDocument[]>(
    user?.companyId ? db.documents.getByCompany(user.companyId) : []
  );

  const refreshDocs = () => {
    if (user?.companyId) {
      const allDocs = db.documents.getByCompany(user.companyId);
      setDocuments(allDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
    setActiveView('list');
  };

  const handleDownload = (doc: SSTDocument) => {
    const company = db.companies.getById(doc.companyId);
    generateDocumentPDF(doc, company?.name || "Empresa");
  };

  const canCreateHighLevelDocs = user?.role === UserRole.SUPERVISOR || user?.role === UserRole.COMPANY_ADMIN || user?.role === UserRole.SUPER_ADMIN;
  
  const getInitialStatus = () => {
      return (user?.role === UserRole.SUPERVISOR || user?.role === UserRole.COMPANY_ADMIN) ? 'Approved' : 'Pending';
  };

  // --- REUSABLE COMPONENT: Declaration Section ---
  const DeclarationSection = ({ isVerified, setIsVerified, docType }: { isVerified: boolean, setIsVerified: (v: boolean) => void, docType: string }) => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center gap-2">
            <FileSignature className="text-blue-400" size={20} />
            <h4 className="font-bold text-slate-200 text-sm uppercase">Declaración Jurada y Compromiso</h4>
        </div>
        <div className="p-6">
            <div className="mb-6">
                <p className="text-sm font-bold text-slate-300 mb-2">Al firmar este documento, declaro bajo juramento que:</p>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                    <li>He inspeccionado mi área de trabajo y mis herramientas.</li>
                    <li>He participado en la elaboración de este {docType} y comprendo los riesgos.</li>
                    <li>Me encuentro en condiciones físicas y mentales aptas para la labor.</li>
                    <li>Entiendo que tengo el derecho y el deber de detener la tarea si es insegura.</li>
                </ul>
            </div>
            <div className={`flex items-center gap-4 p-4 border-2 rounded-lg transition-all cursor-pointer hover:border-blue-500/50 ${isVerified ? 'bg-slate-800 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'bg-slate-900 border-slate-700'}`}>
                <input 
                    type="checkbox" 
                    id="verifyDoc" 
                    checked={isVerified} 
                    onChange={(e) => setIsVerified(e.target.checked)} 
                    className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer bg-slate-700 border-slate-600" 
                />
                <label htmlFor="verifyDoc" className="cursor-pointer select-none flex-1">
                    <span className="block font-bold text-slate-200 text-sm">
                        YO, <span className="uppercase text-blue-400">{user?.name || 'TRABAJADOR'}</span>, FIRMO DIGITALMENTE ESTE DOCUMENTO.
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                        Doy fe de la veracidad de la información y me comprometo a cumplir los controles establecidos.
                    </span>
                </label>
            </div>
        </div>
    </div>
  );

  // --- IPERC FORM COMPONENTS & LOGIC ---
  const calculateRiskLevel = (sev: number, freq: string) => {
    // ... (same as original)
    const fMap: Record<string, number> = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
    const sIndex = sev - 1; 
    const fIndex = fMap[freq];
    const matrix = [[1, 2, 4, 7, 11],[3, 5, 8, 12, 16],[6, 9, 13, 17, 20],[10, 14, 18, 21, 23],[15, 19, 22, 24, 25]];
    if (sIndex < 0 || fIndex === undefined) return { val: 0, label: '', color: 'bg-slate-700 text-slate-400' };
    const val = matrix[sIndex][fIndex];
    if (val <= 8) return { val, label: 'ALTO', color: 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' };
    if (val <= 15) return { val, label: 'MEDIO', color: 'bg-yellow-500 text-black' };
    return { val, label: 'BAJO', color: 'bg-green-600 text-white' };
  };
  const MatrixVisual = () => ( <div className="bg-slate-800 inline-flex shadow-xl border-2 border-slate-600 p-1 rounded"><table className="border-collapse border-spacing-0 text-[10px] bg-black"><tbody className="bg-slate-100"><tr><td className="border border-black px-2 py-1 font-bold text-black bg-white w-[110px] align-middle">Catastrófico</td><td className="border border-black px-1 py-1 font-bold text-black bg-white text-center w-[30px] align-middle text-sm">1</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 w-[50px] h-[30px] align-middle text-lg">1</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 w-[50px] h-[30px] align-middle text-lg">2</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 w-[50px] h-[30px] align-middle text-lg">4</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 w-[50px] h-[30px] align-middle text-lg">7</td><td className="border border-black p-0 text-center font-bold text-black bg-yellow-500 w-[50px] h-[30px] align-middle text-lg">11</td></tr><tr><td className="border border-black px-2 py-1 font-bold text-black bg-white align-middle">Mortalidad</td><td className="border border-black px-1 py-1 font-bold text-black bg-white text-center align-middle text-sm">2</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 h-[30px] align-middle text-lg">3</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 h-[30px] align-middle text-lg">5</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 h-[30px] align-middle text-lg">8</td><td className="border border-black p-0 text-center font-bold text-black bg-yellow-500 h-[30px] align-middle text-lg">12</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">16</td></tr><tr><td className="border border-black px-2 py-1 font-bold text-black bg-white align-middle">Permanente</td><td className="border border-black px-1 py-1 font-bold text-black bg-white text-center align-middle text-sm">3</td><td className="border border-black p-0 text-center font-bold text-white bg-red-600 h-[30px] align-middle text-lg">6</td><td className="border border-black p-0 text-center font-bold text-black bg-yellow-500 h-[30px] align-middle text-lg">9</td><td className="border border-black p-0 text-center font-bold text-black bg-yellow-500 h-[30px] align-middle text-lg">13</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">17</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">20</td></tr><tr><td className="border border-black px-2 py-1 font-bold text-black bg-white align-middle">Temporal</td><td className="border border-black px-1 py-1 font-bold text-black bg-white text-center align-middle text-sm">4</td><td className="border border-black p-0 text-center font-bold text-black bg-yellow-500 h-[30px] align-middle text-lg">10</td><td className="border border-black p-0 text-center font-bold text-black bg-yellow-500 h-[30px] align-middle text-lg">14</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">18</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">21</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">23</td></tr><tr><td className="border border-black px-2 py-1 font-bold text-black bg-white align-middle">Menor</td><td className="border border-black px-1 py-1 font-bold text-black bg-white text-center align-middle text-sm">5</td><td className="border border-black p-0 text-center font-bold text-black bg-yellow-500 h-[30px] align-middle text-lg">15</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">19</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">22</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">24</td><td className="border border-black p-0 text-center font-bold text-white bg-green-600 h-[30px] align-middle text-lg">25</td></tr><tr><td className="border-0 bg-transparent"></td><td className="border-0 bg-transparent"></td><td colSpan={5} className="border border-black py-1 font-bold text-black text-center bg-yellow-500 text-sm">FRECUENCIA (A-E)</td></tr></tbody></table></div> );
  const IPERCForm = () => {
      // ... (Same IPERC Logic)
      const [meta, setMeta] = useState({ date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), area: '', task: '' });
      const [workers, setWorkers] = useState([{ name: user?.name || '', signature: true }]);
      const [rows, setRows] = useState([ { danger: '', risk: '', sev: 1, freq: 'A', control: '', resSev: 1, resFreq: 'A' } ]);
      const [evidence, setEvidence] = useState<string | null>(null);
      const [isVerified, setIsVerified] = useState(false);
      const severityOptions = [{ val: 1, label: '1 - Catastrófico' },{ val: 2, label: '2 - Mortalidad' },{ val: 3, label: '3 - Permanente' },{ val: 4, label: '4 - Temporal' },{ val: 5, label: '5 - Menor' }];
      const frequencyOptions = [{ val: 'A', label: 'A - Común' },{ val: 'B', label: 'B - Ha sucedido' },{ val: 'C', label: 'C - Podría suceder' },{ val: 'D', label: 'D - Raro que suceda' },{ val: 'E', label: 'E - Prác. Imposible' }];
      const addWorker = () => setWorkers([...workers, { name: '', signature: false }]);
      const removeWorker = (idx: number) => setWorkers(workers.filter((_, i) => i !== idx));
      const addRow = () => setRows([...rows, { danger: '', risk: '', sev: 1, freq: 'A', control: '', resSev: 1, resFreq: 'A' }]);
      const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));
      const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setEvidence(reader.result as string); reader.readAsDataURL(file); } };
      const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!user?.companyId) return; if (!isVerified) return; const processedData = { metadata: meta, workers, matrix: rows.map(r => ({ ...r, evaluation: calculateRiskLevel(r.sev, r.freq), residual: calculateRiskLevel(r.resSev, r.resFreq) })), evidence }; const doc: SSTDocument = { id: `doc-${Date.now()}`, companyId: user.companyId, type: SSTDocumentType.IPERC, title: `IPERC: ${meta.task.substring(0, 30)}...`, createdAt: meta.date, status: getInitialStatus(), createdBy: user.name, data: processedData }; db.documents.create(doc); refreshDocs(); };
      return ( <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 max-w-[1200px] mx-auto text-slate-200 font-sans"><div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4"><h3 className="text-2xl font-bold flex items-center gap-2 text-white"><ShieldAlert className="text-red-500" /> IPERC CONTINUO (Dark Mode)</h3><span className="text-xs text-slate-500 font-mono">Versión 04</span></div><form onSubmit={handleSubmit} className="space-y-8"><div className="flex flex-col xl:flex-row gap-8 items-start"><div className="flex-1 space-y-4 w-full"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tarea a Realizar</label><input required value={meta.task} onChange={e => setMeta({...meta, task: e.target.value})} className="w-full bg-slate-800 border border-slate-600 p-2 rounded focus:ring-2 ring-red-500 outline-none text-white" placeholder="Descripción de la tarea..." /></div><div className="grid grid-cols-3 gap-4"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha</label><input type="date" required value={meta.date} onChange={e => setMeta({...meta, date: e.target.value})} className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-white" /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hora</label><input type="time" required value={meta.time} onChange={e => setMeta({...meta, time: e.target.value})} className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-white" /></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1">Área / Zona</label><input required value={meta.area} onChange={e => setMeta({...meta, area: e.target.value})} className="w-full bg-slate-800 border border-slate-600 p-2 rounded text-white" placeholder="Ej. Chancado" /></div></div><div className="bg-slate-800/50 p-3 rounded border border-slate-700 text-[10px] space-y-2 mt-4"><p className="font-bold text-slate-300 uppercase border-b border-slate-600 pb-1">Leyenda de Riesgos</p><div className="grid grid-cols-[80px_1fr] gap-2 items-start py-1"><div className="bg-red-600 text-white text-center font-bold py-1 rounded">ALTO</div><div className="text-slate-400">Riesgo intolerable. Corregir en 0-24 HRS.</div></div><div className="grid grid-cols-[80px_1fr] gap-2 items-start py-1"><div className="bg-yellow-500 text-black text-center font-bold py-1 rounded">MEDIO</div><div className="text-slate-400">Riesgo medio. Corregir en 0-72 HRS.</div></div><div className="grid grid-cols-[80px_1fr] gap-2 items-start py-1"><div className="bg-green-600 text-white text-center font-bold py-1 rounded">BAJO</div><div className="text-slate-400">Riesgo tolerable. Plazo 1 Mes.</div></div></div></div><div className="w-full xl:w-auto overflow-x-auto flex justify-center p-2 bg-slate-900 rounded"><MatrixVisual /></div></div><div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"><div className="flex justify-between items-center mb-3"><label className="block text-sm font-bold text-slate-300 uppercase flex items-center gap-2"><Users size={16} /> Equipo de Trabajo</label><button type="button" onClick={addWorker} className="text-xs text-blue-400 font-bold hover:underline">+ Agregar Trabajador</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{workers.map((w, i) => (<div key={i} className="flex items-center gap-2 bg-slate-900 p-2 border border-slate-600 rounded"><input placeholder="Nombre y Apellidos" className="flex-1 text-sm bg-transparent outline-none text-white placeholder-slate-600" value={w.name} onChange={e => {const n = [...workers]; n[i].name = e.target.value; setWorkers(n)}} /><div className="flex items-center gap-1 border-l border-slate-700 pl-2"><input type="checkbox" checked={w.signature} readOnly className="w-3 h-3 accent-green-500" title="Firma Digital" />{workers.length > 1 && <button type="button" onClick={() => removeWorker(i)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>}</div></div>))}</div></div><div className="overflow-x-auto border border-slate-700 rounded-lg"><table className="w-full text-xs text-left min-w-[900px]"><thead className="bg-slate-800 text-slate-400 uppercase font-bold border-b border-slate-700"><tr><th className="p-3 w-1/4 border-r border-slate-700">Peligro</th><th className="p-3 w-1/4 border-r border-slate-700">Riesgo</th><th className="p-3 w-40 border-r border-slate-700 text-center">Eval. Inicial</th><th className="p-3 w-1/4 border-r border-slate-700">Medidas de Control</th><th className="p-3 w-40 text-center">Riesgo Residual</th><th className="p-1 w-8"></th></tr></thead><tbody className="divide-y divide-slate-700 bg-slate-900">{rows.map((row, i) => { const evalRisk = calculateRiskLevel(row.sev, row.freq); const resRisk = calculateRiskLevel(row.resSev, row.resFreq); return (<tr key={i} className="hover:bg-slate-800/50"><td className="p-2 border-r border-slate-700 align-top"><textarea required rows={3} className="w-full bg-transparent p-1 outline-none resize-none text-slate-300 placeholder-slate-700" placeholder="Descripción..." value={row.danger} onChange={e => {const n=[...rows]; n[i].danger=e.target.value; setRows(n)}} /></td><td className="p-2 border-r border-slate-700 align-top"><textarea required rows={3} className="w-full bg-transparent p-1 outline-none resize-none text-slate-300 placeholder-slate-700" placeholder="Consecuencia..." value={row.risk} onChange={e => {const n=[...rows]; n[i].risk=e.target.value; setRows(n)}} /></td><td className="p-2 border-r border-slate-700 bg-slate-800/30 align-top"><div className="flex flex-col gap-2"><div className="flex gap-1"><select className="w-1/2 bg-slate-700 text-white rounded text-[9px]" value={row.sev} onChange={e => {const n=[...rows]; n[i].sev=parseInt(e.target.value); setRows(n)}}>{severityOptions.map(o => <option key={o.val} value={o.val}>{o.val}</option>)}</select><select className="w-1/2 bg-slate-700 text-white rounded text-[9px]" value={row.freq} onChange={e => {const n=[...rows]; n[i].freq=e.target.value; setRows(n)}}>{frequencyOptions.map(o => <option key={o.val} value={o.val}>{o.val}</option>)}</select></div><div className={`text-center py-1 rounded font-bold ${evalRisk.color} text-[10px]`}>{evalRisk.val} - {evalRisk.label}</div></div></td><td className="p-2 border-r border-slate-700 align-top"><textarea required rows={3} className="w-full bg-transparent p-1 outline-none resize-none text-slate-300 placeholder-slate-700" placeholder="Controles..." value={row.control} onChange={e => {const n=[...rows]; n[i].control=e.target.value; setRows(n)}} /></td><td className="p-2 bg-slate-800/30 align-top"><div className="flex flex-col gap-2"><div className="flex gap-1"><select className="w-1/2 bg-slate-700 text-white rounded text-[9px]" value={row.resSev} onChange={e => {const n=[...rows]; n[i].resSev=parseInt(e.target.value); setRows(n)}}>{severityOptions.map(o => <option key={o.val} value={o.val}>{o.val}</option>)}</select><select className="w-1/2 bg-slate-700 text-white rounded text-[9px]" value={row.resFreq} onChange={e => {const n=[...rows]; n[i].resFreq=e.target.value; setRows(n)}}>{frequencyOptions.map(o => <option key={o.val} value={o.val}>{o.val}</option>)}</select></div><div className={`text-center py-1 rounded font-bold ${resRisk.color} text-[10px]`}>{resRisk.val} - {resRisk.label}</div></div></td><td className="p-1 text-center align-middle"><button type="button" onClick={() => removeRow(i)} className="text-slate-500 hover:text-red-500"><Trash2 size={16} /></button></td></tr>)})}</tbody></table><button type="button" onClick={addRow} className="w-full py-2 text-center text-sm font-bold text-blue-400 hover:bg-slate-800 bg-slate-900 border-t border-slate-700">+ Agregar Peligro</button></div><div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30"><label className="block text-sm font-bold text-slate-300 uppercase mb-3 flex items-center gap-2"><Camera size={16} /> Foto / Evidencia (Opcional)</label><div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-6 hover:bg-slate-800 transition-colors">{evidence ? (<div className="relative w-full"><img src={evidence} alt="Evidencia" className="h-32 object-contain mx-auto rounded" /><button type="button" onClick={() => setEvidence(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><Trash2 size={12} /></button></div>) : (<><ImageIcon className="text-slate-500 mb-2" size={32} /><input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-blue-400 hover:file:bg-slate-600" /></>)}</div></div><DeclarationSection isVerified={isVerified} setIsVerified={setIsVerified} docType="IPERC" /><div className="flex justify-end gap-4 pt-4 border-t border-slate-700"><button type="button" onClick={() => setActiveView('list')} className="px-6 py-3 border border-slate-600 rounded-lg font-medium text-slate-400 hover:bg-slate-800">Cancelar</button><button type="submit" disabled={!isVerified} className={`px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all ${isVerified ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Save size={18} /> {user?.role === UserRole.SUPERVISOR ? 'Guardar y Aprobar' : 'Enviar a Revisión'}</button></div></form></div> );
  };

  const ATSForm = () => {
      // ... (Same ATS Logic, condensed for brevity)
      const [atsData, setAtsData] = useState({ site: 'Mina Principal', area: '', responsible: '', date: new Date().toISOString().split('T')[0], time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), description: '' });
      const [workers, setWorkers] = useState([{ name: user?.name || '', signature: true }]);
      const addWorker = () => setWorkers([...workers, { name: '', signature: false }]);
      const removeWorker = (idx: number) => setWorkers(workers.filter((_, i) => i !== idx));
      const [selectedPPE, setSelectedPPE] = useState<string[]>([]);
      const PPE_LIST = [ { id: 'casco', label: 'CASCO', icon: HardHat, color: 'text-yellow-400' }, { id: 'botas', label: 'BOTAS', icon: Footprints, color: 'text-yellow-700' }, { id: 'lentes', label: 'LENTES', icon: Glasses, color: 'text-blue-400' }, { id: 'guantes', label: 'GUANTES', icon: Briefcase, color: 'text-orange-400' }, { id: 'orejeras', label: 'OREJERAS', icon: Ear, color: 'text-red-400' }, { id: 'mascarilla', label: 'MASCARILLA', icon: ScanFace, color: 'text-white' }, { id: 'arnes', label: 'ARNÉS', icon: Anchor, color: 'text-orange-500' }, { id: 'careta', label: 'CARETA', icon: ShieldAlert, color: 'text-blue-200' }, { id: 'mandil', label: 'MANDIL CUERO', icon: Shirt, color: 'text-yellow-600' }, { id: 'soldar', label: 'CARETA SOLDAR', icon: Flame, color: 'text-orange-600' } ];
      const togglePPE = (id: string) => { if (selectedPPE.includes(id)) { setSelectedPPE(selectedPPE.filter(item => item !== id)); } else { setSelectedPPE([...selectedPPE, id]); } };
      const [highRisk, setHighRisk] = useState<Record<string, boolean>>({ altura: false, caliente: false, bloqueo: false, confinados: false, izaje: false, excavaciones: false });
      const [materialInput, setMaterialInput] = useState('');
      const [materials, setMaterials] = useState<string[]>([]);
      const addMaterial = () => { if(materialInput) { setMaterials([...materials, materialInput]); setMaterialInput(''); } }
      const [steps, setSteps] = useState([{ step: '', risk: '', control: '' }]);
      const addStep = () => setSteps([...steps, { step: '', risk: '', control: '' }]);
      const [evidence, setEvidence] = useState<string | null>(null);
      const [isVerified, setIsVerified] = useState(false);
      const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setEvidence(reader.result as string); reader.readAsDataURL(file); } };
      const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!user?.companyId) return; if (!isVerified) return; const doc: SSTDocument = { id: `doc-${Date.now()}`, companyId: user.companyId, type: SSTDocumentType.ATS, title: `ATS: ${atsData.description.substring(0, 30)}...`, createdAt: atsData.date, status: getInitialStatus(), createdBy: user.name, data: { meta: atsData, workers, ppe: selectedPPE, highRisk, materials, steps, evidence } }; db.documents.create(doc); refreshDocs(); };
      return ( <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 max-w-[1000px] mx-auto text-slate-200 font-sans"><form onSubmit={handleSubmit} className="space-y-6"><div className="bg-slate-800 border-b border-slate-700 pb-4 text-center"><h2 className="text-2xl font-bold text-white uppercase tracking-wider">Análisis de Trabajo Seguro (ATS)</h2></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="flex flex-col"><label className="text-xs text-slate-400 mb-1">Sede</label><select value={atsData.site} onChange={e => setAtsData({...atsData, site: e.target.value})} className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none"><option>Mina Principal</option><option>Planta Concentradora</option><option>Taller Mantenimiento</option></select></div><div className="flex flex-col"><label className="text-xs text-slate-400 mb-1">Área donde se realiza el trabajo</label><input value={atsData.area} onChange={e => setAtsData({...atsData, area: e.target.value})} className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div><div className="flex flex-col"><label className="text-xs text-slate-400 mb-1">Área Responsable / Solicitante</label><input value={atsData.responsible} onChange={e => setAtsData({...atsData, responsible: e.target.value})} className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div><div className="flex flex-col"><label className="text-xs text-slate-400 mb-1">Fecha</label><input type="date" value={atsData.date} onChange={e => setAtsData({...atsData, date: e.target.value})} className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div><div className="flex flex-col"><label className="text-xs text-slate-400 mb-1">Hora</label><input type="time" value={atsData.time} onChange={e => setAtsData({...atsData, time: e.target.value})} className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none" /></div></div><div className="flex flex-col"><label className="text-xs text-slate-400 mb-1">Descripción del trabajo</label><textarea rows={3} value={atsData.description} onChange={e => setAtsData({...atsData, description: e.target.value})} className="bg-slate-800 border border-slate-600 rounded p-2 text-sm text-white focus:border-blue-500 outline-none resize-none" /></div><div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"><div className="flex justify-between items-center mb-3"><h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2"><Users size={16} /> Participantes del Trabajo</h3><button type="button" onClick={addWorker} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus size={12} /> Agregar</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{workers.map((w, i) => (<div key={i} className="flex items-center gap-2 bg-slate-900 p-2 border border-slate-600 rounded hover:border-slate-500 transition-colors"><input placeholder="Nombre y Apellidos" className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder-slate-600" value={w.name} onChange={e => { const n = [...workers]; n[i].name = e.target.value; setWorkers(n); }} /><div className="flex items-center gap-2 border-l border-slate-700 pl-2"><div className="flex flex-col items-center"><span className="text-[9px] text-slate-500 uppercase">Firma</span><input type="checkbox" checked={w.signature} readOnly className="w-3 h-3 accent-green-500 cursor-not-allowed opacity-70" /></div>{workers.length > 1 && (<button type="button" onClick={() => removeWorker(i)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>)}</div></div>))}</div></div><div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"><h3 className="text-center text-sm font-bold text-slate-300 uppercase mb-2">Equipo de Protección Personal Necesario</h3><div className="flex flex-wrap justify-center gap-6">{PPE_LIST.map(ppe => { const isSelected = selectedPPE.includes(ppe.id); return (<div key={ppe.id} onClick={() => togglePPE(ppe.id)} className="flex flex-col items-center gap-2 cursor-pointer group"><div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${isSelected ? 'bg-blue-600 border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-110' : 'bg-slate-700 border-slate-600 group-hover:border-slate-400'}`}><ppe.icon size={24} className={`${isSelected ? 'text-white' : ppe.color}`} /></div><span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>{ppe.label}</span></div>) })}</div></div><div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"><h3 className="text-center text-sm font-bold text-slate-300 uppercase mb-4">Trabajos de Alto Riesgo Asociados</h3><div className="flex flex-wrap justify-center gap-6">{[{k: 'altura', l: 'Trabajos en Altura'},{k: 'caliente', l: 'Trabajos en Caliente'},{k: 'bloqueo', l: 'Bloqueo y Señalización'},{k: 'confinados', l: 'Espacios Confinados'},{k: 'izaje', l: 'Izaje'},{k: 'excavaciones', l: 'Excavaciones'}].map(risk => (<label key={risk.k} className="flex items-center gap-2 cursor-pointer select-none"><div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${highRisk[risk.k] ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-600'}`}>{highRisk[risk.k] && <CheckSquare size={14} className="text-white" />}</div><input type="checkbox" className="hidden" checked={highRisk[risk.k]} onChange={e => setHighRisk({...highRisk, [risk.k]: e.target.checked})} /><span className={`text-sm ${highRisk[risk.k] ? 'text-white font-medium' : 'text-slate-400'}`}>{risk.l}</span></label>))}</div></div><div><h3 className="text-center text-sm font-bold text-slate-300 uppercase mb-2">Procedimiento / Riesgos / Medidas de Control</h3><div className="border border-slate-600 rounded-lg overflow-hidden"><div className="grid grid-cols-12 gap-0 text-xs font-bold text-slate-400 bg-slate-800 border-b border-slate-700"><div className="col-span-1 p-3 text-center border-r border-slate-700">N°</div><div className="col-span-3 p-3 border-r border-slate-700">Procedimiento (Pasos)</div><div className="col-span-4 p-3 border-r border-slate-700">Riesgos/Aspectos Ambientales</div><div className="col-span-4 p-3">Medidas de Control</div></div><div className="bg-slate-900 divide-y divide-slate-700">{steps.map((step, i) => (<div key={i} className="grid grid-cols-12 gap-0 text-sm group"><div className="col-span-1 p-2 text-center text-slate-500 font-bold border-r border-slate-700 flex items-center justify-center relative">{i + 1}{steps.length > 1 && (<button type="button" onClick={() => setSteps(steps.filter((_, idx) => idx !== i))} className="absolute left-1 top-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>)}</div><div className="col-span-3 border-r border-slate-700"><textarea rows={3} value={step.step} onChange={e => { const n = [...steps]; n[i].step = e.target.value; setSteps(n); }} className="w-full h-full bg-transparent p-2 text-slate-300 outline-none resize-none placeholder-slate-700" placeholder="Ingrese el procedimiento" /></div><div className="col-span-4 border-r border-slate-700"><textarea rows={3} value={step.risk} onChange={e => { const n = [...steps]; n[i].risk = e.target.value; setSteps(n); }} className="w-full h-full bg-transparent p-2 text-slate-300 outline-none resize-none placeholder-slate-700" placeholder="Ingrese el riesgo" /></div><div className="col-span-4"><textarea rows={3} value={step.control} onChange={e => { const n = [...steps]; n[i].control = e.target.value; setSteps(n); }} className="w-full h-full bg-transparent p-2 text-slate-300 outline-none resize-none placeholder-slate-700" placeholder="Ingrese medida de control" /></div></div>))}</div></div><button type="button" onClick={addStep} className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus size={14} /> Agregar Nuevo Paso</button></div><div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30"><label className="block text-sm font-bold text-slate-300 uppercase mb-3 flex items-center gap-2"><Camera size={16} /> Foto / Evidencia (Opcional)</label><div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-6 hover:bg-slate-800 transition-colors">{evidence ? (<div className="relative w-full"><img src={evidence} alt="Evidencia" className="h-32 object-contain mx-auto rounded" /><button type="button" onClick={() => setEvidence(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><Trash2 size={12} /></button></div>) : (<><ImageIcon className="text-slate-500 mb-2" size={32} /><input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-blue-400 hover:file:bg-slate-600" /></>)}</div></div><DeclarationSection isVerified={isVerified} setIsVerified={setIsVerified} docType="ATS" /><div className="flex justify-end gap-3 pt-4 border-t border-slate-700"><button type="button" onClick={() => setActiveView('list')} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 text-slate-300">Cancelar</button><button type="submit" disabled={!isVerified} className={`px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all ${isVerified ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/50' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Save size={18} /> {user?.role === UserRole.SUPERVISOR ? 'Guardar y Aprobar' : 'Enviar a Revisión'}</button></div></form></div> );
  };

  const ChecklistForm = () => {
    const TEMPLATES: Record<string, { title: string, items: string[] }> = {
        'maquinaria': { 
            title: 'Inspección de Maquinaria Pesada', 
            items: ["Sistema de frenos operativo", "Luces delanteras y traseras", "Alarma de retroceso audible", "Estado de neumáticos / orugas", "Niveles de fluidos (Aceite, Hidráulico, Agua)", "Espejos y Parabrisas sin roturas", "Cinturón de seguridad funcional", "Extintor PQS cargado y vigente"]
        },
        'taller': { 
            title: 'Taller de Mantenimiento', 
            items: ["Orden y Limpieza (5S)", "Herramientas manuales en buen estado", "Cables eléctricos aislados y ordenados", "Iluminación adecuada en zona de trabajo", "Extintores accesibles y señalizados", "Esmeriles con guardas de seguridad", "Uso de EPP específico (Careta, Guantes)"]
        },
        'oficina': {
            title: 'Seguridad en Oficinas',
            items: ["Pasillos y salidas libres de obstáculos", "Extintores accesibles y señalizados", "Cables eléctricos ordenados y protegidos", "Sillas ergonómicas en buen estado", "Iluminación adecuada", "Señalización de seguridad visible"]
        }
    };

    const [selectedTemplate, setSelectedTemplate] = useState('maquinaria');
    const [refName, setRefName] = useState('');
    const [checks, setChecks] = useState<Record<string, 'pass' | 'fail' | 'na'>>({});
    const [observations, setObservations] = useState<Record<string, string>>({});
    const [evidence, setEvidence] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    const handleCheck = (item: string, status: 'pass' | 'fail' | 'na') => { setChecks(prev => ({ ...prev, [item]: status })); };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEvidence(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.companyId) return;
      if (!isVerified) return;

      const currentTemplate = TEMPLATES[selectedTemplate];
      const doc: SSTDocument = {
        id: `doc-${Date.now()}`,
        companyId: user.companyId,
        type: SSTDocumentType.CHECKLIST,
        title: `${currentTemplate.title}: ${refName}`,
        createdAt: new Date().toISOString().split('T')[0],
        status: getInitialStatus(),
        createdBy: user.name,
        data: { template: selectedTemplate, refName, checks, observations, evidence }
      };
      db.documents.create(doc);
      refreshDocs();
    };

    const currentTpl = TEMPLATES[selectedTemplate];

    return (
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 max-w-[1000px] mx-auto text-slate-200 font-sans">
        <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white"><CheckSquare className="text-green-500" /> Checklist Pre-Operacional</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Object.entries(TEMPLATES).map(([key, tpl]) => (<div key={key} onClick={() => { setSelectedTemplate(key); setChecks({}); }} className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col items-center gap-2 text-center ${selectedTemplate === key ? `bg-slate-800 border-green-500 ring-1 ring-green-500` : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}><span className={`text-xs font-bold ${selectedTemplate === key ? 'text-white' : 'text-slate-400'}`}>{tpl.title}</span></div>))}</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Referencia / Área / Equipo</label>
                    <input required value={refName} onChange={e => setRefName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white focus:border-green-500 outline-none" placeholder="Ej: Taller Norte / Excavadora 01" />
                </div>
                
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Fecha y Hora</label>
                        <div className="text-sm font-mono text-white pt-2">{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>

            <div className="border border-slate-700 rounded-lg overflow-hidden"><div className="grid grid-cols-12 bg-slate-800 text-xs font-bold text-slate-400 border-b border-slate-700"><div className="col-span-5 p-3">Punto de Inspección</div><div className="col-span-3 p-3 text-center">Estado</div><div className="col-span-4 p-3">Observaciones</div></div><div className="divide-y divide-slate-700 bg-slate-900">{currentTpl.items.map((item, idx) => (<div key={idx} className="grid grid-cols-12 text-sm items-center hover:bg-slate-800/50 transition-colors"><div className="col-span-5 p-3 font-medium text-slate-300 border-r border-slate-700/50">{idx + 1}. {item}</div><div className="col-span-3 p-2 flex justify-center gap-2 border-r border-slate-700/50"><button type="button" onClick={() => handleCheck(item, 'pass')} className={`p-1.5 rounded-full transition-all ${checks[item] === 'pass' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'bg-slate-800 text-slate-600 hover:bg-slate-700'}`} title="Conforme"><CheckCircle2 size={18} /></button><button type="button" onClick={() => handleCheck(item, 'fail')} className={`p-1.5 rounded-full transition-all ${checks[item] === 'fail' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'bg-slate-800 text-slate-600 hover:bg-slate-700'}`} title="No Conforme"><XCircle size={18} /></button><button type="button" onClick={() => handleCheck(item, 'na')} className={`p-1.5 rounded-full transition-all ${checks[item] === 'na' ? 'bg-slate-500 text-white' : 'bg-slate-800 text-slate-600 hover:bg-slate-700'}`} title="No Aplica"><MinusCircle size={18} /></button></div><div className="col-span-4 p-2"><input placeholder="Detalle si aplica..." className="w-full bg-transparent border-b border-slate-700 text-xs p-1 text-slate-300 outline-none focus:border-blue-500" value={observations[item] || ''} onChange={(e) => setObservations({...observations, [item]: e.target.value})} /></div></div>))}</div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="border border-slate-700 rounded-lg p-4 bg-slate-800/30"><label className="block text-sm font-bold text-slate-300 uppercase mb-3 flex items-center gap-2"><Camera size={16} /> Evidencia (Opcional)</label><div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-6 hover:bg-slate-800 transition-colors">{evidence ? (<div className="relative w-full"><img src={evidence} alt="Evidencia" className="h-32 object-contain mx-auto rounded" /><button type="button" onClick={() => setEvidence(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><Trash2 size={12} /></button></div>) : (<><ImageIcon className="text-slate-500 mb-2" size={32} /><input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-blue-400 hover:file:bg-slate-600" /></>)}</div></div></div>
            <DeclarationSection isVerified={isVerified} setIsVerified={setIsVerified} docType="CHECKLIST" />
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700"><button type="button" onClick={() => setActiveView('list')} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 text-slate-300">Cancelar</button><button type="submit" disabled={!isVerified} className={`px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all ${isVerified ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-900/50' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}><Save size={18} /> {user?.role === UserRole.SUPERVISOR ? 'Guardar y Aprobar' : 'Enviar a Revisión'}</button></div>
        </form>
      </div>
    );
  };

  const PETARForm = () => {
    // Only Supervisors and Admins can see this form
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Altura');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.companyId) return;
      const doc: SSTDocument = {
        id: `doc-${Date.now()}`,
        companyId: user.companyId,
        type: SSTDocumentType.PETAR,
        title: `PETAR: ${type} - ${title}`,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Approved', // Supervisor creates it approved directly for this demo
        createdBy: user.name,
      };
      db.documents.create(doc);
      refreshDocs();
    };

    return (
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 max-w-[800px] mx-auto text-slate-200">
        <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
            <h3 className="text-2xl font-bold flex items-center gap-2 text-white">
            <FileCheck className="text-purple-500" /> Emitir Permiso de Alto Riesgo (PETAR)
            </h3>
            <span className="text-xs text-purple-400 border border-purple-500/50 px-2 py-1 rounded bg-purple-500/10">Solo Supervisores</span>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Trabajo de Alto Riesgo</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-purple-500 outline-none">
                  <option>Trabajo en Altura</option>
                  <option>Espacio Confinado</option>
                  <option>Trabajo en Caliente</option>
                  <option>Excavaciones y Zanjas</option>
                  <option>Alta Tensión / Eléctrico</option>
                  <option>Izaje de Cargas</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ubicación / Equipo</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-3 text-white focus:border-purple-500 outline-none" placeholder="Ej: Nave Industrial B - Techo" />
             </div>
          </div>
          
          <div className="bg-purple-900/20 p-4 rounded border border-purple-500/30 text-sm text-purple-200">
            <p className="font-bold flex items-center gap-2 mb-1"><ShieldAlert size={16} /> Responsabilidad de Emisión</p>
            <p className="text-xs opacity-80">Como supervisor, al emitir este PETAR certificas que has verificado in-situ que todas las condiciones de seguridad se cumplen, que el personal cuenta con los EPPs específicos y las capacitaciones vigentes.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button type="button" onClick={() => setActiveView('list')} className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-800 text-slate-300">Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-500 shadow-lg shadow-purple-900/50 flex items-center gap-2">
                <FileCheck size={18} /> Autorizar y Emitir
            </button>
          </div>
        </form>
      </div>
    );
  };

  const PETSManager = () => {
    // ... (Keep existing PETS Manager - no changes needed for this prompt)
    const [petsFiles, setPetsFiles] = useState([
        { id: 'p1', name: 'PETS-001: Operación de Montacargas', size: '2.4 MB' },
        { id: 'p2', name: 'PETS-002: Bloqueo y Etiquetado (LOTO)', size: '1.1 MB' },
        { id: 'p3', name: 'PETS-003: Trabajos de Soldadura', size: '3.5 MB' },
        { id: 'p4', name: 'PETS-004: Manipulación de Sustancias Químicas', size: '1.8 MB' },
    ]);
    const [isUploading, setIsUploading] = useState(false);
    const [newPetsName, setNewPetsName] = useState('');
    const handleUpload = (e: React.FormEvent) => { e.preventDefault(); setIsUploading(true); setTimeout(() => { const newFile = { id: `p${Date.now()}`, name: `PETS-${newPetsName}`, size: '1.5 MB' }; setPetsFiles([newFile, ...petsFiles]); setIsUploading(false); setNewPetsName(''); }, 1500); };

    return (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 shadow-2xl animate-in fade-in slide-in-from-bottom-4 text-slate-200">
             <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4"><h3 className="text-xl font-bold flex items-center gap-2 text-blue-400"><FileText /> Procedimientos Escritos de Trabajo Seguro (PETS)</h3><button onClick={() => setActiveView('list')} className="text-slate-400 hover:text-white transition-colors"><ArrowLeft /></button></div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {canCreateHighLevelDocs && (<div className="lg:col-span-1"><div className="bg-slate-800 p-5 rounded-xl border border-slate-700"><h4 className="font-bold text-white mb-4 flex items-center gap-2"><Upload size={18} /> Subir Nuevo PETS</h4><form onSubmit={handleUpload} className="space-y-4"><div><label className="block text-xs font-bold text-slate-400 mb-1">Título del Procedimiento</label><input required value={newPetsName} onChange={e => setNewPetsName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-blue-500" placeholder="Ej: Uso de Esmeril" /></div><div className="border-2 border-dashed border-slate-600 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-700/50 transition-colors cursor-pointer"><FileUp size={24} className="mb-2" /><span className="text-xs">Arrastra el PDF aquí</span></div><button disabled={isUploading} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-sm transition-colors flex items-center justify-center gap-2">{isUploading ? 'Subiendo...' : 'Publicar PETS'}</button></form></div></div>)}
                 <div className={canCreateHighLevelDocs ? "lg:col-span-2" : "lg:col-span-3"}><h4 className="font-bold text-slate-400 mb-4 text-sm uppercase">Documentos Disponibles</h4><div className="space-y-3">{petsFiles.map(file => (<div key={file.id} className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500 transition-colors group"><div className="flex items-center gap-4"><div className="p-3 bg-slate-900 text-blue-400 rounded-lg border border-slate-700 group-hover:bg-blue-900/30 group-hover:text-blue-300"><FileText size={20} /></div><div><p className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{file.name}</p><p className="text-xs text-slate-500">{file.size} • PDF • Actualizado hace 2 días</p></div></div><button onClick={() => alert(`Descargando ${file.name}...`)} className="px-4 py-2 text-xs font-bold text-slate-300 border border-slate-600 rounded hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-all"><Eye size={14} /> Ver</button></div>))}</div></div>
             </div>
        </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <button onClick={() => setActiveView('create_iperc')} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-red-300 hover:bg-red-50 transition-all gap-3 group h-40">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldAlert size={24} /></div><span className="font-bold text-slate-700 group-hover:text-red-700">Nuevo IPERC</span>
            </button>
            <button onClick={() => setActiveView('create_ats')} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-orange-300 hover:bg-orange-50 transition-all gap-3 group h-40">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={24} /></div><span className="font-bold text-slate-700 group-hover:text-orange-700">Nuevo ATS</span>
            </button>
            <button onClick={() => setActiveView('create_checklist')} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-green-300 hover:bg-green-50 transition-all gap-3 group h-40">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><CheckSquare size={24} /></div><span className="font-bold text-slate-700 group-hover:text-green-700">Nuevo Checklist</span>
            </button>
            <button onClick={() => canCreateHighLevelDocs ? setActiveView('create_petar') : alert("Acceso restringido: Solo Supervisores pueden emitir PETAR.")} className={`flex flex-col items-center justify-center p-6 border rounded-xl transition-all gap-3 group h-40 ${canCreateHighLevelDocs ? 'bg-white border-slate-200 hover:shadow-lg hover:border-purple-300 hover:bg-purple-50' : 'bg-slate-50 border-slate-200 opacity-70 cursor-not-allowed'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${canCreateHighLevelDocs ? 'bg-purple-100 text-purple-600 group-hover:scale-110' : 'bg-slate-200 text-slate-400'}`}>{canCreateHighLevelDocs ? <FileCheck size={24} /> : <Lock size={24} />}</div><span className="font-bold text-slate-700 group-hover:text-purple-700">{canCreateHighLevelDocs ? 'Emitir PETAR' : 'PETAR (Restringido)'}</span>
            </button>
            <button onClick={() => setActiveView('view_pets')} className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-blue-300 hover:bg-blue-50 transition-all gap-3 group h-40">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Download size={24} /></div><span className="font-bold text-slate-700 group-hover:text-blue-700">{canCreateHighLevelDocs ? 'Gestionar PETS' : 'Ver PETS'}</span>
            </button>
       </div>

       {/* List of Recent Documents with Status Feedback */}
       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
               Historial de Documentos Generados
           </div>
           {documents.length === 0 ? (
               <div className="p-8 text-center text-slate-400">No hay documentos registrados.</div>
           ) : (
               <div className="divide-y divide-slate-100">
                   {documents.map(doc => (
                       <div key={doc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 gap-4">
                           <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-xs shrink-0
                                    ${doc.type === SSTDocumentType.IPERC ? 'bg-red-500' : ''}
                                    ${doc.type === SSTDocumentType.ATS ? 'bg-orange-500' : ''}
                                    ${doc.type === SSTDocumentType.CHECKLIST ? 'bg-green-500' : ''}
                                    ${doc.type === SSTDocumentType.PETAR ? 'bg-purple-500' : ''}
                                    ${doc.type === SSTDocumentType.PETS ? 'bg-blue-500' : ''}
                                `}>
                                    {doc.type.substring(0,3)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{doc.title}</p>
                                    <p className="text-xs text-slate-500">{doc.createdAt} • Creado por {doc.createdBy}</p>
                                    
                                    {/* Show Rejection Reason if applicable */}
                                    {doc.status === 'Rejected' && doc.approvalComment && (
                                        <div className="mt-1 flex items-start gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200 max-w-md">
                                            <MessageSquare size={12} className="mt-0.5 shrink-0" />
                                            <span>Supervisor: "{doc.approvalComment}"</span>
                                        </div>
                                    )}
                                </div>
                           </div>
                           <div className="flex items-center gap-2 self-end md:self-center">
                               <span className={`px-2 py-1 rounded text-xs font-bold border
                                   ${doc.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' : 
                                     doc.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                                     'bg-yellow-100 text-yellow-700 border-yellow-200'}
                               `}>
                                   {doc.status === 'Approved' ? 'Aprobado' : doc.status === 'Rejected' ? 'Rechazado' : 'Pendiente Revisión'}
                               </span>
                               {/* Only show download if not PETS (PETS logic handled separately) and Approved */}
                               {doc.type !== SSTDocumentType.PETS && (
                                   <button 
                                     onClick={() => handleDownload(doc)}
                                     className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                     title="Descargar PDF"
                                   >
                                       <Printer size={18} />
                                   </button>
                               )}
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </div>
    </div>
  );

  return (
    <div className="animate-in fade-in">
        {activeView === 'list' && renderDashboard()}
        {activeView === 'create_iperc' && <IPERCForm />}
        {activeView === 'create_ats' && <ATSForm />}
        {activeView === 'create_checklist' && <ChecklistForm />}
        {activeView === 'create_petar' && canCreateHighLevelDocs && <PETARForm />}
        {activeView === 'view_pets' && <PETSManager />}
    </div>
  );
};
