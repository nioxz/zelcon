
import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Building2, ShieldCheck, Database } from 'lucide-react';
import { db } from '../services/mockDb';
import { BrandLogo } from '../components/BrandLogo';

export const LoginView = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Update default to a valid SaaS User if not Super Admin
  const [email, setEmail] = useState('admin@zelcon.com'); 
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email)) {
      navigate('/redirect');
    } else {
      setError('Credenciales inválidas. Contacte al administrador.');
    }
  };

  const users = db.users.getAll();
  const companies = db.companies.getAll();

  // Helper to group users
  const superAdmins = users.filter(u => u.role === 'super_admin');
  const companyUsers = (companyId: string) => users.filter(u => u.companyId === companyId);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-900 skew-x-12 translate-x-32 z-0 hidden lg:block" />

      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-20">
            <Link to="/" className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full text-white transition-colors">
                <ArrowLeft size={20} />
            </Link>
        </div>

        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 z-0"></div>
           <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
                    <BrandLogo className="h-28 w-28 invert brightness-0" />
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-wide">ZELCON</h1>
                <p className="text-blue-200 text-sm font-medium mt-1 uppercase tracking-widest">Enterprise Access</p>
           </div>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-6">Simulación de Ecosistema</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                <ShieldCheck size={14} /> Seleccionar Actor (Demo)
              </label>
              <div className="relative">
                <select 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all appearance-none text-slate-700 font-medium text-xs"
                >
                    <optgroup label="PLATAFORMA (SaaS Owner)">
                        {superAdmins.map(u => (
                            <option key={u.id} value={u.email}>👑 {u.name} ({u.email})</option>
                        ))}
                    </optgroup>

                    {companies.map(c => (
                        <optgroup key={c.id} label={`EMPRESA: ${c.name}`}>
                            {companyUsers(c.id).map(u => (
                                <option key={u.id} value={u.email}>
                                    {u.role === 'company_admin' ? '💼' : u.role === 'supervisor' ? '👷‍♂️' : u.role === 'almacenero' ? '📦' : 'User'} {u.name} ({u.email})
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400">
                    <ArrowRight size={16} className="rotate-90" />
                </div>
              </div>
            </div>

            {error && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-slate-900/20"
            >
              Ingresar al Panel
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center bg-slate-50 p-4 rounded-lg border border-slate-100">
             <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                <Database size={14} />
                <p className="text-xs font-bold uppercase">Base de Datos Local</p>
             </div>
             <button onClick={() => { if(window.confirm('¿Reiniciar toda la DB a estado original?')) db.reset(); }} className="text-[10px] text-red-400 hover:text-red-600 font-bold underline transition-colors">
                Resetear Datos de Fábrica
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
