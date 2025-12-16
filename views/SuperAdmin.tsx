
import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { Company, User, UserRole } from '../types';
import { 
  Plus, 
  Building2, 
  Settings, 
  Users, 
  Save, 
  X, 
  CheckSquare, 
  Square,
  Trash2,
  Shield,
  Briefcase,
  Globe,
  Package,
  Activity,
  HardHat,
  UserPlus
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>(db.companies.getAll());
  
  // Modal States
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  
  // Data States
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  
  // Form States
  const [editingCompany, setEditingCompany] = useState<Partial<Company>>({ 
    name: '', ruc: '', address: '', domain: '', modules: { sst: true, training: true, warehouse: true, operations: false } 
  });
  const [companySlug, setCompanySlug] = useState(''); // For internal domain generation
  
  // Admin Creation State (For new company modal)
  const [newCompanyAdmin, setNewCompanyAdmin] = useState({ name: '', username: '' });

  // User Management State (For existing companies)
  // We'll store the raw username here for the UI logic
  const [newUsername, setNewUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.TRABAJADOR);
  const [newUserName, setNewUserName] = useState('');

  // --- Company Logic ---

  const openNewCompanyModal = () => {
    setCurrentCompany(null);
    setEditingCompany({ 
      name: '', ruc: '', address: '', domain: '', modules: { sst: true, training: true, warehouse: true, operations: false } 
    });
    setCompanySlug('');
    setNewCompanyAdmin({ name: '', username: 'gerente' });
    setIsCompanyModalOpen(true);
  };

  const openEditCompanyModal = (company: Company) => {
    setCurrentCompany(company);
    setEditingCompany({ ...company });
    // Reset admin fields as we are editing company settings, not creating initial admin
    setNewCompanyAdmin({ name: '', username: '' });
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentCompany) {
      // Edit Mode
      const updated = { ...currentCompany, ...editingCompany } as Company;
      db.companies.update(updated);
      alert('Configuración de empresa actualizada.');
    } else {
      // Create Mode
      // Validate Admin Fields
      if (!newCompanyAdmin.name || !newCompanyAdmin.username || !companySlug) {
          alert('Todos los campos son obligatorios.');
          return;
      }

      const companyId = `c${Date.now()}`;
      // Internal Domain Logic: zelcon-[slug].com
      const internalDomain = `zelcon-${companySlug.toLowerCase().replace(/\s+/g, '')}.com`;
      
      const newComp: Company = {
        id: companyId,
        name: editingCompany.name!,
        ruc: editingCompany.ruc!,
        address: editingCompany.address!,
        phone: '',
        domain: internalDomain,
        modules: editingCompany.modules || { sst: true, training: true, warehouse: true, operations: false }
      };
      db.companies.create(newComp);
      
      // Mandatory Admin Creation
      const adminEmail = `${newCompanyAdmin.username}@${internalDomain}`;
      const adminUser: User = {
        id: `u${Date.now()}`,
        name: newCompanyAdmin.name,
        email: adminEmail,
        role: UserRole.COMPANY_ADMIN,
        companyId: companyId,
        isActive: true,
        termsAccepted: false,
        profileCompleted: false
      };
      db.users.create(adminUser);
      alert(`Empresa creada exitosamente.\n\nDominio Interno: @${internalDomain}\nAdmin: ${adminEmail}\n\nEl usuario deberá completar su perfil al ingresar.`);
    }

    setCompanies(db.companies.getAll());
    setIsCompanyModalOpen(false);
  };

  // --- Users Logic ---

  const openUsersModal = (company: Company) => {
    setCurrentCompany(company);
    setCompanyUsers(db.users.getByCompany(company.id));
    setNewUserName('');
    setNewUsername('');
    setNewUserRole(UserRole.TRABAJADOR);
    setIsUsersModalOpen(true);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    // Email is guaranteed to be @zelcon-[slug].com because company.domain is now set that way
    const fullEmail = `${newUsername}@${currentCompany.domain}`;

    const u: User = {
      id: `u${Date.now()}`,
      name: newUserName,
      email: fullEmail,
      role: newUserRole,
      companyId: currentCompany.id,
      isActive: true,
      termsAccepted: false,
      profileCompleted: false
    };
    db.users.create(u);
    setCompanyUsers(db.users.getByCompany(currentCompany.id));
    setNewUserName('');
    setNewUsername('');
    setNewUserRole(UserRole.TRABAJADOR);
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    const user = companyUsers.find(u => u.id === userId);
    if (user) {
      const updated = { ...user, role: newRole };
      db.users.update(updated);
      setCompanyUsers(db.users.getByCompany(currentCompany!.id));
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      db.users.delete(userId);
      setCompanyUsers(db.users.getByCompany(currentCompany!.id));
    }
  };

  const toggleModule = (module: 'sst' | 'training' | 'warehouse' | 'operations') => {
    if (editingCompany.modules) {
      setEditingCompany({
        ...editingCompany,
        modules: {
          ...editingCompany.modules,
          [module]: !editingCompany.modules[module]
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestión Global de Empresas</h1>
          <p className="text-slate-500">Administra los tenants, accesos a módulos y roles jerárquicos.</p>
        </div>
        <button 
          onClick={openNewCompanyModal}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          <Plus size={18} />
          Nueva Empresa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map(company => (
          <div key={company.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                <Building2 size={24} />
              </div>
              <div className="flex gap-2">
                 <button 
                  onClick={() => openEditCompanyModal(company)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Configurar Empresa y Módulos"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1">{company.name}</h3>
            <p className="text-sm text-slate-500 mb-2">RUC: {company.ruc}</p>
            {company.domain && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded w-fit mb-4">
                    <Globe size={12} /> {company.domain}
                </div>
            )}
            
            <div className="flex-1">
               <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-1 ${company.modules.sst ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckSquare size={14} className={company.modules.sst ? 'text-green-500' : 'text-slate-300'} /> SST
                  </div>
                  <div className={`flex items-center gap-1 ${company.modules.training ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckSquare size={14} className={company.modules.training ? 'text-green-500' : 'text-slate-300'} /> Capacitación
                  </div>
                  <div className={`flex items-center gap-1 ${company.modules.warehouse ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckSquare size={14} className={company.modules.warehouse ? 'text-green-500' : 'text-slate-300'} /> Almacén
                  </div>
                  <div className={`flex items-center gap-1 ${company.modules.operations ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckSquare size={14} className={company.modules.operations ? 'text-green-500' : 'text-slate-300'} /> Operaciones
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <button 
                onClick={() => openUsersModal(company)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Users size={16} />
                Gestionar Usuarios y Roles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL: Company Edit/Create --- */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                {currentCompany ? 'Configurar Empresa' : 'Registrar Nueva Empresa'}
              </h2>
              <button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveCompany} className="space-y-5">
              {/* --- Sección Datos Generales --- */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2">1. Datos Generales</h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase mb-1">Razón Social</label>
                    <input 
                      required
                      value={editingCompany.name}
                      onChange={e => setEditingCompany({...editingCompany, name: e.target.value})}
                      className="w-full border border-slate-400 bg-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" 
                      placeholder="Ej. Consorcio Minero S.A.C." 
                    />
                  </div>
                  
                  {/* Internal Domain Generation Logic */}
                  <div>
                      <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                          {currentCompany ? 'Dominio Interno (Solo Lectura)' : 'Identificador Único (Slug)'}
                      </label>
                      {currentCompany ? (
                          <div className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2.5 text-slate-600 font-mono text-sm">
                              @{currentCompany.domain}
                          </div>
                      ) : (
                          <div className="flex items-center gap-2">
                              <span className="text-slate-500 font-mono text-sm">@zelcon-</span>
                              <input 
                                  required
                                  value={companySlug}
                                  onChange={e => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                  className="flex-1 border border-slate-400 bg-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-bold font-mono" 
                                  placeholder="empresa" 
                              />
                              <span className="text-slate-500 font-mono text-sm">.com</span>
                          </div>
                      )}
                      {!currentCompany && <p className="text-[10px] text-slate-500 mt-1">Esto generará los correos de acceso como: usuario@zelcon-{companySlug || 'empresa'}.com</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-900 uppercase mb-1">RUC</label>
                        <input 
                        required
                        value={editingCompany.ruc}
                        onChange={e => setEditingCompany({...editingCompany, ruc: e.target.value})}
                        className="w-full border border-slate-400 bg-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" 
                        placeholder="20..." 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-900 uppercase mb-1">Dirección</label>
                        <input 
                        required
                        value={editingCompany.address}
                        onChange={e => setEditingCompany({...editingCompany, address: e.target.value})}
                        className="w-full border border-slate-400 bg-white rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium" 
                        placeholder="Av..." 
                        />
                    </div>
                  </div>
              </div>

              {/* --- Sección Admin Company (Solo al crear) --- */}
              {!currentCompany && (
                  <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-sm font-bold text-blue-900 border-b border-blue-200 pb-2 flex items-center gap-2">
                          <UserPlus size={16} /> 2. Datos del Administrador Principal
                      </h3>
                      <p className="text-xs text-blue-700 mb-2">Este usuario tendrá rol <strong>COMPANY_ADMIN</strong> y control total sobre la empresa.</p>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Nombre Completo</label>
                              <input 
                                  required
                                  value={newCompanyAdmin.name}
                                  onChange={e => setNewCompanyAdmin({...newCompanyAdmin, name: e.target.value})}
                                  className="w-full border border-blue-400 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-bold" 
                                  placeholder="Nombre del Admin" 
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Usuario de Acceso</label>
                              <div className="flex items-center">
                                  <input 
                                      required
                                      value={newCompanyAdmin.username}
                                      onChange={e => setNewCompanyAdmin({...newCompanyAdmin, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                                      className="w-full border border-blue-400 rounded-l-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-bold text-right" 
                                      placeholder="gerente" 
                                  />
                                  <span className="bg-blue-100 border border-blue-400 border-l-0 text-blue-800 text-xs font-bold px-2 py-3 rounded-r-lg font-mono">
                                      @zelcon-{companySlug || '...'}.com
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* --- Sección Módulos --- */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-3">
                    {currentCompany ? '2. Acceso a Módulos' : '3. Acceso a Módulos'}
                </h3>
                <div className="space-y-2">
                    <label className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-blue-300">
                        <input type="checkbox" checked={editingCompany.modules?.sst} onChange={() => toggleModule('sst')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><Shield size={16} className="text-slate-400"/> Módulo SST (Seguridad y Salud)</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-blue-300">
                        <input type="checkbox" checked={editingCompany.modules?.training} onChange={() => toggleModule('training')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><Briefcase size={16} className="text-slate-400"/> Módulo Capacitaciones</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-blue-300">
                        <input type="checkbox" checked={editingCompany.modules?.warehouse} onChange={() => toggleModule('warehouse')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><Package size={16} className="text-slate-400"/> Módulo Almacén y Logística</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 bg-white rounded border border-slate-200 cursor-pointer hover:border-blue-300">
                        <input type="checkbox" checked={editingCompany.modules?.operations} onChange={() => toggleModule('operations')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-700"><Activity size={16} className="text-slate-400"/> Módulo Operaciones (Próximamente)</span>
                    </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                  <Save size={18} />
                  {currentCompany ? 'Guardar Cambios' : 'Crear Empresa y Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: User Management (For existing companies) --- */}
      {isUsersModalOpen && currentCompany && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Gestión de Usuarios</h2>
                <p className="text-slate-500 text-sm">Empresa: {currentCompany.name} | Dominio: <span className="text-blue-600 font-mono">@{currentCompany.domain}</span></p>
              </div>
              <button onClick={() => setIsUsersModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {/* Add User Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Plus size={16} /> Añadir Usuario a esta Empresa
                    </h3>
                    <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                            <input 
                                required
                                placeholder="Nombre Completo"
                                value={newUserName}
                                onChange={e => setNewUserName(e.target.value)}
                                className="w-full border border-slate-400 bg-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium"
                            />
                        </div>
                        <div className="flex-1 flex items-center">
                             <input 
                                required
                                placeholder="usuario"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                className="w-full border border-slate-400 bg-white rounded-l-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-right font-mono text-slate-900 font-bold"
                            />
                            <span className="bg-slate-200 border border-l-0 border-slate-400 py-2 px-3 rounded-r-lg text-sm text-slate-700 font-medium font-mono border-l-0">
                                @{currentCompany.domain}
                            </span>
                        </div>
                        <select
                            value={newUserRole}
                            onChange={e => setNewUserRole(e.target.value as UserRole)}
                            className="w-40 border border-slate-400 bg-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 font-medium"
                        >
                             <option value={UserRole.COMPANY_ADMIN}>Admin Empresa</option>
                             <option value={UserRole.SUPERVISOR}>Supervisor</option>
                             <option value={UserRole.ALMACENERO}>Almacenero</option>
                             <option value={UserRole.TRABAJADOR}>Trabajador</option>
                        </select>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap">
                            Añadir
                        </button>
                    </form>
                </div>

                {/* User List Table */}
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-white sticky top-0 border-b border-slate-200">
                        <tr>
                            <th className="py-3 font-semibold">Nombre</th>
                            <th className="py-3 font-semibold">Email Corporativo</th>
                            <th className="py-3 font-semibold">Rol Actual</th>
                            <th className="py-3 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {companyUsers.map(u => (
                            <tr key={u.id} className="group hover:bg-slate-50">
                                <td className="py-3 font-medium text-slate-900">{u.name}</td>
                                <td className="py-3">{u.email}</td>
                                <td className="py-3">
                                    <select 
                                        value={u.role}
                                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value as UserRole)}
                                        className="bg-transparent border-none py-1 pl-2 pr-8 rounded focus:ring-2 focus:ring-blue-500 text-sm font-medium text-blue-700 cursor-pointer hover:bg-blue-50"
                                    >
                                        <option value={UserRole.COMPANY_ADMIN}>Admin Empresa</option>
                                        <option value={UserRole.SUPERVISOR}>Supervisor</option>
                                        <option value={UserRole.ALMACENERO}>Almacenero</option>
                                        <option value={UserRole.TRABAJADOR}>Trabajador</option>
                                    </select>
                                </td>
                                <td className="py-3 text-right">
                                    <button 
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                                        title="Eliminar Usuario"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {companyUsers.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-8 text-center text-slate-400">No hay usuarios registrados en esta empresa.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
