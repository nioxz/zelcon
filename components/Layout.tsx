
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { UserRole } from '../types';
import { db } from '../services/mockDb'; // Import DB for notifications
import { Link, useLocation } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { 
  LayoutGrid, 
  Building2, 
  Users, 
  ShieldCheck, 
  LogOut, 
  PackageSearch, 
  FileText,
  AlertTriangle, 
  BookOpenCheck, 
  Menu,
  X,
  HardHat, 
  ClipboardList, 
  Truck,
  Bell,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// --- Notification Types ---
type Notification = {
  id: string;
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  link: string;
  date: string;
};

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Notifications Logic based on Role
  useEffect(() => {
    if (!user?.companyId) return;

    const newNotifs: Notification[] = [];
    const companyId = user.companyId;

    // Logic for SUPERVISOR
    if (user.role === UserRole.SUPERVISOR) {
        const pendingIncidents = db.incidents.getByCompany(companyId).filter(i => i.status === 'Pendiente');
        const pendingDocs = db.documents.getByCompany(companyId).filter(d => d.status === 'Pending');
        
        pendingIncidents.forEach(i => newNotifs.push({
            id: `inc-${i.id}`, type: 'danger', title: 'Nuevo Incidente', 
            message: `${i.userName} reportó: ${i.description.substring(0,30)}...`, link: '/supervisor/incidents', date: i.date
        }));
        pendingDocs.forEach(d => newNotifs.push({
            id: `doc-${d.id}`, type: 'warning', title: 'Documento por Aprobar', 
            message: `${d.type} creado por ${d.createdBy}`, link: '/supervisor/sst', date: d.createdAt
        }));
    }

    // Logic for ALMACENERO
    if (user.role === UserRole.ALMACENERO) {
        const lowStock = db.inventory.getByCompany(companyId).filter(i => i.stock <= i.minStock);
        const pendingReqs = db.inventory.requests.getByCompany(companyId).filter(r => r.status === 'Pendiente');

        lowStock.forEach(i => newNotifs.push({
            id: `stk-${i.id}`, type: 'danger', title: 'Alerta de Stock Crítico', 
            message: `${i.name} tiene ${i.stock} ${i.unit} (Mín: ${i.minStock})`, link: '/almacenero/inventory', date: 'Hoy'
        }));
        pendingReqs.forEach(r => newNotifs.push({
            id: `req-${r.id}`, type: 'info', title: 'Nueva Solicitud', 
            message: `${r.userName} solicita ${r.quantity} ${r.itemName}`, link: '/almacenero/requests', date: r.date
        }));
    }

    // Logic for COMPANY_ADMIN
    if (user.role === UserRole.COMPANY_ADMIN) {
        // Fleet notifications removed as requested
        const pendingDocs = db.documents.getByCompany(companyId).filter(d => d.status === 'Pending');
        if (pendingDocs.length > 0) {
             newNotifs.push({
                id: `docs-admin`, type: 'info', title: 'Resumen SSOMA', 
                message: `Hay ${pendingDocs.length} documentos pendientes de revisión en la empresa.`, link: '/company/sst', date: 'Hoy'
            });
        }
    }

    // Logic for TRABAJADOR
    if (user.role === UserRole.TRABAJADOR) {
        const myRequests = db.inventory.requests.getByCompany(companyId).filter(r => r.userId === user.id && r.status === 'Aprobado');
        myRequests.forEach(r => newNotifs.push({
            id: `myreq-${r.id}`, type: 'success', title: 'Pedido Listo', 
            message: `Tu solicitud de ${r.itemName} fue aprobada.`, link: '/employee/warehouse', date: r.date
        }));
    }

    setNotifications(newNotifs);
  }, [user, location.pathname]); // Refresh on route change

  if (!user) return null;

  const getLinks = () => {
    const commonClasses = "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group";
    const activeClasses = "bg-blue-600 text-white shadow-md transform scale-[1.02]";
    const inactiveClasses = "text-slate-400 hover:bg-slate-800 hover:text-white hover:pl-5";

    const LinkItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
      <Link 
        to={to} 
        onClick={() => setMobileMenuOpen(false)}
        className={`${commonClasses} ${location.pathname.includes(to) ? activeClasses : inactiveClasses}`}
      >
        <Icon size={20} className={location.pathname.includes(to) ? "text-white" : "text-slate-500 group-hover:text-blue-400 transition-colors"} />
        {label}
      </Link>
    );

    switch (user.role) {
      case UserRole.SUPER_ADMIN:
        return (
          <>
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-bold mt-2">Plataforma</div>
            <LinkItem to="/superadmin/dashboard" icon={Building2} label="Gestión Empresas" />
          </>
        );
      case UserRole.COMPANY_ADMIN:
        return (
          <>
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-bold mt-2">Gerencia</div>
            <LinkItem to="/company/dashboard" icon={LayoutGrid} label="Panel General" />
            <LinkItem to="/company/users" icon={Users} label="Usuarios y Roles" />
            <LinkItem to="/company/sst" icon={ShieldCheck} label="Documentos SSOMA" />
            {/* Fleet Link Removed */}
          </>
        );
      case UserRole.SUPERVISOR:
        return (
          <>
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-bold mt-2">Supervisión</div>
            <LinkItem to="/supervisor/dashboard" icon={LayoutGrid} label="Panel de Control" />
            <LinkItem to="/supervisor/incidents" icon={AlertTriangle} label="Gestión Incidentes" />
            <LinkItem to="/supervisor/sst" icon={FileText} label="Documentos SSOMA" />
            <LinkItem to="/supervisor/training" icon={BookOpenCheck} label="Capacitaciones" />
          </>
        );
      case UserRole.ALMACENERO:
        return (
          <>
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-bold mt-2">Logística</div>
            <LinkItem to="/almacenero/dashboard" icon={LayoutGrid} label="Panel Logístico" />
            <LinkItem to="/almacenero/inventory" icon={PackageSearch} label="Inventario y Kardex" />
            <LinkItem to="/almacenero/requests" icon={ClipboardList} label="Despacho Pedidos" />
          </>
        );
      case UserRole.TRABAJADOR:
        return (
          <>
            <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-600 font-bold mt-2">Mi Espacio</div>
            <LinkItem to="/employee/dashboard" icon={HardHat} label="Panel Personal" />
            <LinkItem to="/employee/sst" icon={ShieldCheck} label="Documentos SSOMA" />
            <LinkItem to="/employee/training" icon={BookOpenCheck} label="Mis Cursos" />
            <LinkItem to="/employee/warehouse" icon={PackageSearch} label="Pedidos Almacén" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-out shadow-2xl
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Container */}
        <div className="h-24 flex items-center justify-center px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-shrink-0 bg-blue-600/20 p-2 rounded-xl border border-blue-500/30">
                <BrandLogo className="h-8 w-8 invert brightness-0 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-white leading-none tracking-tight">ZELCON</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mt-1">Systems</span>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">
          {getLinks()}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-4 px-2 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-default">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white border border-slate-600 shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-200">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-600 hover:text-white text-sm font-medium transition-all text-red-400 border border-red-500/20 hover:border-red-500"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="ml-auto flex items-center gap-4">
             
             {/* Notification Center */}
             <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>

                {showNotifs && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm">Notificaciones</h3>
                            <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{notifications.length}</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                    <CheckCircle2 size={24} className="text-green-500/50" />
                                    Todo está al día.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <Link 
                                        key={notif.id} 
                                        to={notif.link}
                                        onClick={() => setShowNotifs(false)}
                                        className="block p-4 border-b border-slate-100 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${notif.type === 'danger' ? 'bg-red-500' : notif.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notif.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{notif.date}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                )}
             </div>

             <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Sistema Operativo
             </div>
          </div>
        </header>
        
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
