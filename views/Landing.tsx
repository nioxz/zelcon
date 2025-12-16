import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../App';
import { BrandLogo } from '../components/BrandLogo';

export const LandingView = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden font-sans text-slate-100">
      
      {/* Background Abstract Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600 blur-[100px]" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="bg-white/5 p-1 rounded-lg backdrop-blur-sm border border-white/10">
                <BrandLogo className="h-10 w-10" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">ZELCON</span>
        </div>
        <div>
            {user ? (
                <Link to="/redirect" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full font-medium transition-all flex items-center gap-2">
                   <LayoutDashboard size={18} /> Ir al Dashboard
                </Link>
            ) : (
                <Link to="/login" className="px-6 py-2 border border-slate-600 hover:bg-slate-800 rounded-full font-medium transition-all">
                    Acceder
                </Link>
            )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4">
         <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-700">
             
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 backdrop-blur-sm text-sm font-medium text-blue-300 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Plataforma Integral v2.0
             </div>

             <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
                Transformamos la <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Gestión Operativa</span>
             </h1>
             
             <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
               "Soluciones que elevan los estándares de la industria."
               <br />
               <span className="font-medium text-white block mt-2">Seguridad, Eficiencia y Control en cada operación.</span>
             </p>

             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <Link to="/login" className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2 group w-full sm:w-auto justify-center">
                    Ingresar a ZELCON
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
         </div>
      </main>

      {/* Features Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm py-8">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
              <div>
                  <h4 className="font-bold text-white mb-1">Seguridad (SST)</h4>
                  <p className="text-sm text-slate-500">Control de incidentes y normativa.</p>
              </div>
              <div>
                  <h4 className="font-bold text-white mb-1">Logística</h4>
                  <p className="text-sm text-slate-500">Gestión de almacén inteligente.</p>
              </div>
              <div>
                  <h4 className="font-bold text-white mb-1">Capacitación</h4>
                  <p className="text-sm text-slate-500">Desarrollo continuo del personal.</p>
              </div>
          </div>
          <div className="text-center mt-8 text-xs text-slate-600">
              &copy; {new Date().getFullYear()} ZELCON SYSTEMS. Todos los derechos reservados.
          </div>
      </footer>

    </div>
  );
};
