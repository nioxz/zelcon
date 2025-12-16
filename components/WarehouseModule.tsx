import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db } from '../services/mockDb';
import { InventoryItem, WarehouseRequest, RequestStatus, ReturnStatus } from '../types';
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
  FileText,
  AlertCircle,
  ArrowDown,
  ArrowUp
} from 'lucide-react';

export const WarehouseModule = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_requests'>('catalog');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [myRequests, setMyRequests] = useState<WarehouseRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [requestForm, setRequestForm] = useState({
      quantity: 1,
      area: user?.area || '',
      priority: 'Media' as 'Alta' | 'Media' | 'Baja',
      justification: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      setInventory(db.inventory.getByCompany(user.companyId));
      const allRequests = db.inventory.requests.getByCompany(user.companyId);
      // Sort: Pending first, then by date
      setMyRequests(allRequests.filter(r => r.userId === user.id).sort((a,b) => {
          if (a.status === 'Pendiente' && b.status !== 'Pendiente') return -1;
          return 0;
      }));
    }
  }, [user, activeTab]);

  const openRequestModal = (item: InventoryItem) => {
      // Check for pending duplicate requests
      const existingPending = myRequests.find(r => r.itemId === item.id && r.status === RequestStatus.PENDING);
      if(existingPending) {
          alert('Ya tienes una solicitud pendiente para este artículo. Espera a que sea atendida.');
          return;
      }
      
      setSelectedItem(item);
      setRequestForm({
          quantity: 1,
          area: user?.area || '', 
          priority: 'Media',
          justification: ''
      });
      setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !selectedItem) return;

    if (requestForm.quantity > selectedItem.stock) {
        alert(`Stock insuficiente. Solo hay ${selectedItem.stock} unidades disponibles.`);
        return;
    }

    const newRequest: WarehouseRequest = {
        id: `req-${Date.now()}`,
        companyId: user.companyId,
        userId: user.id,
        userName: user.name,
        userArea: requestForm.area,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity: requestForm.quantity,
        date: new Date().toISOString().split('T')[0],
        status: RequestStatus.PENDING,
        returnStatus: ReturnStatus.NOT_REQUIRED, // Almacenero will confirm this logic on dispatch
        
        priority: requestForm.priority,
        justification: requestForm.justification
    };

    db.inventory.requests.create(newRequest);
    
    // Update local state
    setActiveTab('my_requests');
    setIsRequestModalOpen(false);
    setSelectedItem(null);
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityBadge = (priority?: string) => {
      switch (priority) {
          case 'Alta': 
            return (
                <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200">
                    <ArrowUp size={10} strokeWidth={3} /> ALTA
                </span>
            );
          case 'Media': 
            return (
                <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold border border-orange-200">
                    <Clock size={10} strokeWidth={3} /> MEDIA
                </span>
            );
          case 'Baja': 
            return (
                <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200">
                    <ArrowDown size={10} strokeWidth={3} /> BAJA
                </span>
            );
          default: 
            return <span className="text-slate-500 text-xs">Normal</span>;
      }
  };

  return (
    <div className="space-y-6">
       <div className="flex gap-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'catalog' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'}`}
          >
            <Warehouse size={16} /> Catálogo General
          </button>
          <button 
            onClick={() => setActiveTab('my_requests')}
            className={`pb-3 px-4 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'my_requests' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'}`}
          >
            <History size={16} /> Mis Solicitudes
          </button>
       </div>

       {activeTab === 'catalog' && (
         <div className="space-y-4 animate-in fade-in">
             <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Buscar por nombre, categoría o SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                 />
             </div>
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                    <div className="col-span-5">Ítem</div>
                    <div className="col-span-3">Categoría</div>
                    <div className="col-span-2 text-center">Tipo</div>
                    <div className="col-span-2 text-right">Stock</div>
                </div>
                <div className="divide-y divide-slate-100">
                    {filteredInventory.map(item => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
                            <div className="col-span-5 font-medium text-slate-900 flex items-center gap-3">
                                {item.image ? (
                                    <img src={item.image} alt="pic" className="w-10 h-10 rounded object-cover border border-slate-200" />
                                ) : (
                                    <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                                        {item.requiresReturn ? <Wrench size={18}/> : <HardHat size={18}/>}
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold text-sm">{item.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                                </div>
                            </div>
                            <div className="col-span-3 text-sm text-slate-500">{item.category}</div>
                            <div className="col-span-2 text-center">
                                {item.requiresReturn ? (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold border border-blue-200">Préstamo</span>
                                ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-bold border border-slate-200">Consumible</span>
                                )}
                            </div>
                            <div className="col-span-2 text-right flex items-center justify-end gap-3">
                                <div className="text-right">
                                    {item.stock > 0 ? (
                                        <span className="text-sm font-bold text-slate-700 block">{item.stock} {item.unit}</span>
                                    ) : (
                                        <span className="text-xs font-bold text-red-500 block">Agotado</span>
                                    )}
                                    <span className="text-[10px] text-slate-400">{item.location}</span>
                                </div>
                                <button 
                                    onClick={() => openRequestModal(item)}
                                    disabled={item.stock <= 0}
                                    className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:shadow-md rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-orange-100"
                                    title="Solicitar al Almacén"
                                >
                                    <ShoppingCart size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredInventory.length === 0 && (
                        <div className="p-8 text-center text-slate-400">No se encontraron productos en el catálogo.</div>
                    )}
                </div>
             </div>
         </div>
       )}

       {activeTab === 'my_requests' && (
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
               {myRequests.length === 0 ? (
                   <div className="p-12 text-center text-slate-400">No has realizado ninguna solicitud reciente.</div>
               ) : (
                   <div className="divide-y divide-slate-100">
                       {myRequests.map(req => (
                           <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors">
                               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                   <div className="flex items-center gap-4">
                                       <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm
                                           ${req.status === RequestStatus.PENDING ? 'bg-yellow-100 text-yellow-600' : ''}
                                           ${req.status === RequestStatus.DELIVERED ? 'bg-green-100 text-green-600' : ''}
                                           ${req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-600' : ''}
                                           ${req.status === RequestStatus.APPROVED ? 'bg-blue-100 text-blue-600' : ''}
                                       `}>
                                           {req.status === RequestStatus.PENDING && <Clock size={24} />}
                                           {req.status === RequestStatus.DELIVERED && <CheckCircle2 size={24} />}
                                           {req.status === RequestStatus.REJECTED && <XCircle size={24} />}
                                           {req.status === RequestStatus.APPROVED && <CheckCircle2 size={24} />}
                                       </div>
                                       <div>
                                           <h4 className="font-bold text-slate-900 text-lg">{req.itemName} <span className="text-slate-500 font-normal text-sm">x{req.quantity}</span></h4>
                                           <p className="text-xs text-slate-500">Solicitado el: {req.date} • Destino: <span className="font-bold text-slate-700">{req.userArea}</span></p>
                                       </div>
                                   </div>
                                   <div className="flex flex-col items-end gap-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border
                                            ${req.status === RequestStatus.PENDING ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                                            ${req.status === RequestStatus.DELIVERED ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                            ${req.status === RequestStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            ${req.status === RequestStatus.APPROVED ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                        `}>
                                            {req.status.toUpperCase()}
                                        </span>
                                        {/* Show Return Status if Delivered */}
                                        {req.status === RequestStatus.DELIVERED && req.returnStatus === ReturnStatus.PENDING_RETURN && (
                                            <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                                                <CornerDownLeft size={10} /> EN PRÉSTAMO
                                            </span>
                                        )}
                                   </div>
                               </div>

                               {/* Feedback Section */}
                               <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2 border border-slate-200">
                                   <div className="flex flex-col md:flex-row gap-4 text-xs text-slate-500 mb-2">
                                       <div className="flex items-center gap-2">
                                           <span className="font-bold">Prioridad:</span> 
                                           {getPriorityBadge(req.priority)}
                                       </div>
                                       <div className="truncate flex-1"><span className="font-bold">Motivo:</span> {req.justification || 'Sin justificación'}</div>
                                   </div>

                                   {(req.status === RequestStatus.APPROVED || req.status === RequestStatus.DELIVERED) && (
                                       <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-2">
                                           <div className="flex items-center gap-2 text-slate-600">
                                               <CalendarClock size={16} className="text-blue-500" />
                                               <span className="font-semibold text-xs uppercase">Recojo:</span>
                                               <span>{req.pickupTime || 'Pendiente'}</span>
                                           </div>
                                           <div className="flex items-center gap-2 text-slate-600">
                                               <MapPin size={16} className="text-blue-500" />
                                               <span className="font-semibold text-xs uppercase">Lugar:</span>
                                               <span>{req.pickupLocation || 'Almacén Central'}</span>
                                           </div>
                                       </div>
                                   )}
                                   
                                   {req.approvalComment && (
                                       <div className={`flex items-start gap-2 pt-2 border-t border-slate-200 ${req.status === RequestStatus.REJECTED ? 'text-red-600' : 'text-slate-600'}`}>
                                           <Info size={16} className="mt-0.5 shrink-0" />
                                           <span className="italic">Almacén: "{req.approvalComment}"</span>
                                       </div>
                                   )}
                               </div>
                           </div>
                       ))}
                   </div>
               )}
           </div>
       )}

       {/* REQUEST MODAL */}
       {isRequestModalOpen && selectedItem && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-lg p-0 shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
                   <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
                       <div>
                           <h3 className="text-lg font-bold text-orange-800">Solicitud de Material</h3>
                           <p className="text-xs text-orange-600">Complete los datos para procesar su vale de salida.</p>
                       </div>
                       <button onClick={() => setIsRequestModalOpen(false)} className="text-orange-400 hover:text-orange-700 transition-colors">
                           <X size={24} />
                       </button>
                   </div>
                   
                   <form onSubmit={handleSubmitRequest} className="p-6 space-y-5">
                       {/* Item Summary */}
                       <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                           {selectedItem.image ? (
                               <img src={selectedItem.image} alt="ref" className="w-14 h-14 rounded object-cover border border-slate-200" />
                           ) : (
                               <div className="w-14 h-14 bg-white rounded flex items-center justify-center border border-slate-200 text-slate-400">
                                   <Warehouse size={24} />
                               </div>
                           )}
                           <div className="flex-1">
                               <h4 className="font-bold text-slate-800">{selectedItem.name}</h4>
                               <div className="flex justify-between items-center mt-1">
                                   <span className="text-xs text-slate-500 font-mono">{selectedItem.sku}</span>
                                   <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">Stock: {selectedItem.stock} {selectedItem.unit}</span>
                               </div>
                           </div>
                       </div>

                       {/* Form Fields */}
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad</label>
                               <input 
                                   type="number" 
                                   min="1" 
                                   max={selectedItem.stock}
                                   required
                                   value={requestForm.quantity}
                                   onChange={e => setRequestForm({...requestForm, quantity: parseInt(e.target.value)})}
                                   className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-center"
                               />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridad</label>
                               <select 
                                   value={requestForm.priority}
                                   onChange={e => setRequestForm({...requestForm, priority: e.target.value as any})}
                                   className={`w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 font-bold ${
                                       requestForm.priority === 'Alta' ? 'text-red-600 bg-red-50 focus:ring-red-500' :
                                       requestForm.priority === 'Media' ? 'text-orange-600 bg-orange-50 focus:ring-orange-500' :
                                       'text-blue-600 bg-blue-50 focus:ring-blue-500'
                                   }`}
                               >
                                   <option value="Baja">Baja (Normal)</option>
                                   <option value="Media">Media</option>
                                   <option value="Alta">Alta (Urgente)</option>
                               </select>
                           </div>
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Área / Centro de Costo (Destino)</label>
                           <input 
                               type="text" 
                               required
                               placeholder="Ej: Taller Mecánico, Frente 3, Oficinas..."
                               value={requestForm.area}
                               onChange={e => setRequestForm({...requestForm, area: e.target.value})}
                               className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                           />
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Justificación / Motivo</label>
                           <textarea 
                               required
                               placeholder="¿Para qué se utilizará este material?"
                               value={requestForm.justification}
                               onChange={e => setRequestForm({...requestForm, justification: e.target.value})}
                               className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-500 resize-none h-20 text-sm"
                           />
                       </div>

                       {/* Action Buttons */}
                       <div className="flex gap-3 pt-2">
                           <button 
                               type="button" 
                               onClick={() => setIsRequestModalOpen(false)}
                               className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                           >
                               Cancelar
                           </button>
                           <button 
                               type="submit" 
                               className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 transition-colors"
                           >
                               <FileText size={18} />
                               Generar Pedido
                           </button>
                       </div>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};
