
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useLocation } from 'react-router-dom';
import { db } from '../services/mockDb';
import { User, UserRole, Company } from '../types';
import { SSTModule } from '../components/SSTModule';
import { WarehouseModule } from '../components/WarehouseModule';
import { 
  Users, 
  ShieldAlert, 
  GraduationCap, 
  TrendingUp,
  Plus,
  ArrowLeft,
  Briefcase,
  FileCheck,
  PackageSearch,
  ShieldCheck,
  Pencil,
  Trash2,
  Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type AdminView = 'menu' | 'admin_panel' | 'sst_docs' | 'warehouse';

export const CompanyAdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [view, setView] = useState<AdminView>('menu');
  
  // --- Admin Panel States ---
  const [users, setUsers] = useState<User[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  
  // Form State for User Management
  const [editingUser, setEditingUser] = useState<User | null>(null); // To track if we are editing
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.TRABAJADOR);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/company/users')) setView('admin_panel');
    else if (path.includes('/company/sst')) setView('sst_docs');
    else setView('menu');

    if (user?.companyId) {
      setUsers(db.users.getByCompany(user.companyId));
      setCompany(db.companies.getById(user.companyId) || null);
    }
  }, [user, location.pathname]); 

  // --- Handlers ---

  const openUserModal = (userToEdit?: User) => {
      if (userToEdit) {
          setEditingUser(userToEdit);
          setNewName(userToEdit.name);
          // Try to extract username from email
          setNewUsername(userToEdit.email.split('@')[0]);
          setNewRole(userToEdit.role);
      } else {
          setEditingUser(null);
          setNewName('');
          setNewUsername('');
          setNewRole(UserRole.TRABAJADOR);
      }
      setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !company) return;

    const fullEmail = `${newUsername}@${company.domain}`;
    
    if (editingUser) {
        // UPDATE MODE
        const updatedUser: User = {
            ...editingUser,
            name: newName,
            email: fullEmail,
            role: newRole
        };
        db.users.update(updatedUser);
        alert("Usuario actualizado correctamente.");
    } else {
        // CREATE MODE
        const u: User = {
            id: `u${Date.now()}`,
            name: newName,
            email: fullEmail,
            role: newRole,
            companyId: user.companyId,
            isActive: true,
            termsAccepted: false,
            profileCompleted: false
        };
        db.users.create(u);
        alert("Usuario creado. Deberá completar su perfil al iniciar sesión.");
    }

    setUsers(db.users.getByCompany(user.companyId));
    setIsUserModalOpen(false);
    
    // Reset Form
    setNewName('');
    setNewUsername('');
    setNewRole(UserRole.TRABAJADOR);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
      if(window.confirm("¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.")) {
          db.users.delete(userId);
          if(user?.companyId) setUsers(db.users.getByCompany(user.companyId));
      }
  };

  const renderMenu = () => (
    <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Panel Gerencial</h1>
            <p className="text-slate-500 text-lg">Bienvenido, {user?.name}. Seleccione un módulo de gestión.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
                onClick={() => setView('admin_panel')}
                className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-blue-200 transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                <div className="relative w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Briefcase size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">Administración</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                    Gestión de recursos humanos, roles jerárquicos y métricas globales de la empresa.
                </p>
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
                <p className="text-slate-500 font-medium leading-relaxed">
                    Control documental de Seguridad, Salud y Medio Ambiente. IPERC, ATS y Auditorías.
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
                <p className="text-slate-500 font-medium leading-relaxed">
                    Logística interna. Requerimientos de materiales, EPPs y herramientas.
                </p>
            </div>
        </div>
    </div>
  );

  const renderAdminPanel = () => {
     // Reduced stats as requested
     const stats = [
        { title: 'Total Empleados', value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { title: 'Cursos Completados', value: '15', icon: GraduationCap, color: 'text-green-600', bg: 'bg-green-50' },
      ];
      
      const chartData = [
        { name: 'Ene', incidentes: 4 }, { name: 'Feb', incidentes: 3 }, { name: 'Mar', incidentes: 2 },
        { name: 'Abr', incidentes: 5 }, { name: 'May', incidentes: 1 }, { name: 'Jun', incidentes: 2 },
      ];

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-4">
                <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Panel Administrativo</h2>
                    <p className="text-slate-500 text-sm">Gestión de recursos humanos y métricas</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat, idx) => (
                <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                        <stat.icon size={24} />
                    </div>
                    <span className="text-3xl font-bold text-slate-800">{stat.value}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">{stat.title}</h3>
                </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Personal de la Empresa</h2>
                        <button onClick={() => openUserModal()} className="text-sm bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 flex items-center gap-2 font-medium transition-colors shadow-lg shadow-slate-900/20">
                            <Plus size={18} /> Agregar Usuario
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Nombre</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{u.name}</div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</div>
                                    {!u.profileCompleted && <div className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded inline-block mt-1 font-bold border border-orange-100">Perfil Pendiente</div>}
                                </td>
                                <td className="px-6 py-4"><span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 capitalize border border-blue-100">{u.role.replace('_', ' ')}</span></td>
                                <td className="px-6 py-4"><span className={`inline-block w-2.5 h-2.5 rounded-full ${u.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span></td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => openUserModal(u)} 
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Rol/Usuario"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(u.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar Usuario"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Tendencia de Incidentes</h2>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="incidentes" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
             {isUserModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-200">
                    <h2 className="text-2xl font-bold mb-6 text-slate-900">
                        {editingUser ? 'Editar Empleado' : 'Registrar Empleado'}
                    </h2>
                    <form onSubmit={handleSaveUser} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nombre y Apellidos</label>
                        <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full border border-slate-300 bg-slate-50 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-medium text-slate-900 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Usuario / Email Corporativo</label>
                        <div className="flex items-center">
                            <input 
                                required 
                                value={newUsername} 
                                onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} 
                                className="w-full border border-slate-300 bg-slate-50 rounded-l-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-right font-mono font-bold text-slate-900 transition-all" 
                                placeholder="juan.perez"
                            />
                            <span className="bg-slate-200 border border-l-0 border-slate-300 py-3 px-4 rounded-r-lg text-sm text-slate-600 font-bold font-mono">
                                @{company?.domain || 'empresa.com'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Rol Asignado</label>
                        <select value={newRole} onChange={e => setNewRole(e.target.value as UserRole)} className="w-full border border-slate-300 bg-slate-50 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium cursor-pointer">
                        <option value={UserRole.SUPERVISOR}>Supervisor SST</option>
                        <option value={UserRole.ALMACENERO}>Almacenero</option>
                        <option value={UserRole.TRABAJADOR}>Trabajador Operativo</option>
                        <option value={UserRole.COMPANY_ADMIN}>Gerencia / Admin</option>
                        </select>
                    </div>
                    
                    {!editingUser && (
                        <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-800 font-medium border border-blue-100 leading-relaxed">
                            El usuario deberá completar su perfil (DNI, Edad, etc.) y aceptar el acuerdo legal en su primer inicio de sesión para activar su cuenta.
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 font-bold text-slate-600 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-bold shadow-lg transition-colors flex items-center justify-center gap-2">
                            <Save size={18} /> {editingUser ? 'Guardar Cambios' : 'Registrar'}
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}
        </div>
    );
  };

  const renderSSTDocs = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center gap-4">
            <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Documentación SSOMA</h2>
                <p className="text-slate-500 text-sm">Centro de gestión documental y formularios.</p>
            </div>
        </div>
        <SSTModule />
    </div>
  );

  const renderWarehouse = () => (
    <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => setView('menu')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Pedidos Almacén</h2>
                    <p className="text-slate-500 text-sm">Vista de solicitante - Requerimiento de materiales</p>
                </div>
            </div>
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-orange-200">
                <PackageSearch size={18} /> Modo Solicitante
            </div>
        </div>
        <WarehouseModule />
    </div>
  );

  return (
    <div className="min-h-screen">
       {view === 'menu' && renderMenu()}
       {view === 'admin_panel' && renderAdminPanel()}
       {view === 'sst_docs' && renderSSTDocs()}
       {view === 'warehouse' && renderWarehouse()}
    </div>
  );
};
