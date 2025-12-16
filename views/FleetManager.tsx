
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db } from '../services/mockDb';
import { Vehicle, VehicleStatus } from '../types';
import { 
  Truck, 
  Activity, 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  CalendarClock,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

type FleetView = 'overview' | 'list' | 'schedule';

export const FleetManagerDashboard = () => {
  const { user } = useAuth();
  const [view, setView] = useState<FleetView>('overview');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit/Schedule State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newMaintenanceHours, setNewMaintenanceHours] = useState(0);

  useEffect(() => {
    if (user?.companyId) {
      setVehicles(db.fleet.getByCompany(user.companyId));
    }
  }, [user, view, isScheduleModalOpen]);

  const handleUpdateSchedule = (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedVehicle || !user?.companyId) return;

      const updatedVehicle: Vehicle = {
          ...selectedVehicle,
          nextMaintenanceHours: newMaintenanceHours,
          maintenanceAlert: 'Normal' // Reset alert
      };

      db.fleet.update(updatedVehicle);
      setVehicles(db.fleet.getByCompany(user.companyId));
      setIsScheduleModalOpen(false);
      alert(`Programación actualizada para ${selectedVehicle.code}`);
  };

  const openScheduleModal = (v: Vehicle) => {
      setSelectedVehicle(v);
      setNewMaintenanceHours(v.nextMaintenanceHours + 250); // Suggest next cycle
      setIsScheduleModalOpen(true);
  };

  const getStatusColor = (status: VehicleStatus) => {
      switch(status) {
          case VehicleStatus.OPERATIVO: return 'bg-green-100 text-green-700 border-green-200';
          case VehicleStatus.MANTENIMIENTO: return 'bg-blue-100 text-blue-700 border-blue-200';
          case VehicleStatus.INOPERATIVO: return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
  };

  const filteredVehicles = vehicles.filter(v => 
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const operativeCount = vehicles.filter(v => v.status === VehicleStatus.OPERATIVO).length;
  const maintenanceCount = vehicles.filter(v => v.status === VehicleStatus.MANTENIMIENTO).length;
  const criticalCount = vehicles.filter(v => v.status === VehicleStatus.INOPERATIVO).length;
  
  const pieData = [
      { name: 'Operativo', value: operativeCount, color: '#22c55e' },
      { name: 'Mantenimiento', value: maintenanceCount, color: '#3b82f6' },
      { name: 'Crítico', value: criticalCount, color: '#ef4444' },
  ];

  const renderOverview = () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* KPIs */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase">Disponibilidad</p>
                          <h3 className="text-3xl font-bold text-slate-900 mt-1">{Math.round((operativeCount / vehicles.length) * 100) || 0}%</h3>
                      </div>
                      <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Activity size={24} /></div>
                  </div>
                  <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(operativeCount / vehicles.length) * 100}%` }}></div>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase">En Taller</p>
                          <h3 className="text-3xl font-bold text-slate-900 mt-1">{maintenanceCount}</h3>
                      </div>
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Wrench size={24} /></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Unidades en servicio preventivo.</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-slate-500 text-xs font-bold uppercase">Críticos / Parada</p>
                          <h3 className="text-3xl font-bold text-red-600 mt-1">{criticalCount}</h3>
                      </div>
                      <div className="bg-red-100 text-red-600 p-2 rounded-lg"><AlertTriangle size={24} /></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Requieren atención inmediata.</p>
              </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
              <h4 className="text-slate-700 font-bold mb-4 w-full text-left">Estado de la Flota</h4>
              <div className="w-full h-40">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                              {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                  {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>
                          {d.name}
                      </div>
                  ))}
              </div>
          </div>

          {/* Alert List */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Alertas de Mantenimiento y Horómetros</h3>
                  <button onClick={() => setView('list')} className="text-xs text-blue-600 font-bold hover:underline">Ver Todo</button>
              </div>
              <div className="divide-y divide-slate-100">
                  {vehicles.filter(v => v.maintenanceAlert !== 'Normal').length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">No hay alertas de mantenimiento pendientes.</div>
                  ) : (
                      vehicles.filter(v => v.maintenanceAlert !== 'Normal').map(v => (
                          <div key={v.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">{v.code}</div>
                                  <div>
                                      <h4 className="font-bold text-slate-900 text-sm">{v.name}</h4>
                                      <div className="flex items-center gap-2 text-xs text-slate-500">
                                          <Clock size={12} /> Horómetro: <span className="font-mono font-bold text-slate-700">{v.currentHours} h</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="text-right">
                                      <p className="text-xs text-slate-400 uppercase font-bold">Próximo Service</p>
                                      <p className={`text-sm font-bold font-mono ${v.maintenanceAlert === 'Vencido' ? 'text-red-600' : 'text-orange-500'}`}>
                                          {v.nextMaintenanceHours} h
                                      </p>
                                  </div>
                                  <button onClick={() => openScheduleModal(v)} className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-800">Programar</button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
  );

  const renderList = () => (
      <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <Search className="text-slate-400 ml-2" size={20} />
              <input 
                  type="text" 
                  placeholder="Buscar por código o nombre..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 outline-none text-sm p-2"
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map(v => (
                  <div key={v.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="h-32 bg-slate-100 relative flex items-center justify-center">
                          {v.image ? (
                              <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                          ) : (
                              <Truck size={48} className="text-slate-300" />
                          )}
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(v.status)}`}>
                              {v.status}
                          </div>
                          <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-0.5 rounded text-xs font-mono backdrop-blur-sm">
                              {v.code}
                          </div>
                      </div>
                      <div className="p-5">
                          <h4 className="font-bold text-slate-900 text-lg mb-1">{v.brand} {v.model}</h4>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">{v.type}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4 border-t border-slate-100 pt-4">
                              <div>
                                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Horómetro Actual</p>
                                  <p className="text-lg font-mono font-bold text-slate-800 flex items-center gap-1">
                                      <Clock size={14} className="text-blue-500" /> {v.currentHours}
                                  </p>
                              </div>
                              <div className="text-right">
                                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Mantenimiento</p>
                                  <p className={`text-lg font-mono font-bold ${v.currentHours >= v.nextMaintenanceHours ? 'text-red-500' : 'text-green-600'}`}>
                                      {v.nextMaintenanceHours}
                                  </p>
                              </div>
                          </div>

                          <button 
                              onClick={() => openScheduleModal(v)}
                              className="w-full py-2 bg-slate-50 text-slate-600 font-bold text-sm rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors"
                          >
                              <Settings size={16} /> Gestionar Unidad
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto py-8 px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                  <h1 className="text-3xl font-bold text-slate-900">Control de Flota</h1>
                  <p className="text-slate-500">Gestión operativa y mantenimiento de maquinaria.</p>
              </div>
              <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                  <button onClick={() => setView('overview')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Panel General</button>
                  <button onClick={() => setView('list')} className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${view === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}>Inventario Flota</button>
              </div>
          </div>

          {view === 'overview' && renderOverview()}
          {view === 'list' && renderList()}

          {/* Modal for Scheduling */}
          {isScheduleModalOpen && selectedVehicle && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                          <h3 className="text-lg font-bold text-slate-900">Programar Mantenimiento</h3>
                          <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Settings size={20} /></button>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6 bg-slate-50 p-3 rounded-lg">
                          <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-slate-500 font-bold border border-slate-200">{selectedVehicle.code}</div>
                          <div>
                              <h4 className="font-bold text-slate-900">{selectedVehicle.name}</h4>
                              <p className="text-xs text-slate-500">Horómetro Actual: <span className="font-mono">{selectedVehicle.currentHours}</span></p>
                          </div>
                      </div>

                      <form onSubmit={handleUpdateSchedule} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Próximo Mantenimiento (Horas)</label>
                              <div className="relative">
                                  <Clock className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                  <input 
                                      type="number" 
                                      required
                                      min={selectedVehicle.currentHours}
                                      value={newMaintenanceHours}
                                      onChange={e => setNewMaintenanceHours(parseInt(e.target.value))}
                                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                                  />
                              </div>
                              <p className="text-[10px] text-blue-600 mt-1">Se recomienda programar cada 250h o 500h.</p>
                          </div>

                          <div className="pt-2 flex gap-3">
                              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md">Guardar</button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};
