import React, { useState } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../components/BrandLogo';
import { db } from '../services/mockDb';
import { CheckCircle2, User, Shield, FileText, ArrowRight, Save, MapPin, Phone, Heart, UserCheck } from 'lucide-react';

export const OnboardingView = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  
  // Form State - Fiscalization Fields
  const [formData, setFormData] = useState({
    dni: '',
    birthDate: '',
    birthPlace: '', // New
    parentName: '', // New
    phone: '',
    address: '',
    position: user?.position || '',
    area: user?.area || '',
    secondaryEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });

  const [legalAccepted, setLegalAccepted] = useState(false);

  if (!user) return null;

  const calculateAge = (birthDate: string) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
      }
      return age;
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
        setStep(2);
    } else {
        // Final Submit
        if(!legalAccepted) return;

        const age = formData.birthDate ? calculateAge(formData.birthDate) : 0;

        const updatedUser = {
            ...user,
            ...formData,
            age: age,
            termsAccepted: true,
            termsAcceptedAt: new Date().toISOString(),
            profileCompleted: true
        };

        // 1. Update Database
        db.users.update(updatedUser);
        
        // 2. Refresh Context (Trigger re-login with existing email to fetch updated user)
        // This ensures the 'profileCompleted' check passes in ProtectedRoute
        login(user.email);

        // 3. Navigate cleanly
        navigate('/redirect');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[650px]">
        
        {/* Left Panel: Progress */}
        <div className="bg-slate-900 w-full md:w-80 p-8 flex flex-col justify-between text-white relative overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 z-0"></div>
            <div className="relative z-10">
                <div className="mb-8">
                    <BrandLogo className="h-10 w-10 mb-4" />
                    <h1 className="text-2xl font-bold">Activación de Cuenta</h1>
                    <p className="text-slate-300 text-sm mt-2">Complete su ficha de personal para cumplimiento normativo.</p>
                </div>

                <div className="space-y-6">
                    <div className={`flex items-start gap-4 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > 1 ? 'bg-green-500 border-green-500' : 'border-white'} shrink-0`}>
                            {step > 1 ? <CheckCircle2 size={16} /> : <span className="font-bold">1</span>}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Ficha de Personal</h3>
                            <p className="text-xs text-slate-300">Datos para Fiscalización</p>
                        </div>
                    </div>
                    
                    <div className={`w-0.5 h-10 bg-slate-700 ml-4`}></div>

                    <div className={`flex items-start gap-4 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${legalAccepted ? 'bg-green-500 border-green-500' : 'border-white'} shrink-0`}>
                            <span className="font-bold">2</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Acuerdo Legal</h3>
                            <p className="text-xs text-slate-300">Firma Digital Vinculante</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10 mt-8">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Auditoría</p>
                <p className="text-xs text-slate-400 font-mono">ID: {user.id}</p>
                <p className="text-xs text-slate-400 font-mono">IP: 192.168.1.X (Registrado)</p>
            </div>
        </div>

        {/* Right Panel: Content */}
        <div className="flex-1 p-8 md:p-10 overflow-y-auto bg-white">
            {step === 1 && (
                <form onSubmit={handleUpdateProfile} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="border-b border-slate-200 pb-4 mb-6">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <User className="text-blue-700" /> Información del Colaborador
                        </h2>
                        <p className="text-xs text-slate-600 mt-1 font-medium">Los datos ingresados tienen carácter de declaración jurada para fines laborales.</p>
                    </div>
                    
                    {/* SECTION 1: IDENTIFICATION */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
                            <Shield size={14} className="text-slate-700"/> Datos de Identificación y Verificación
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">DNI / C.E. / Pasaporte <span className="text-red-600">*</span></label>
                                <input required value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium" placeholder="Número de documento" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">Fecha de Nacimiento <span className="text-red-600">*</span></label>
                                <input type="date" required value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">Lugar de Nacimiento <span className="text-red-600">*</span></label>
                                <input required value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium" placeholder="Ciudad o Provincia" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">Datos de Verificación Familiar <span className="text-red-600">*</span></label>
                                <div className="relative">
                                    <UserCheck className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                    <input required value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium" placeholder="Nombre completo del padre o madre" />
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">Para validar identidad en procesos virtuales.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1">Dirección de Domicilio Actual <span className="text-red-600">*</span></label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 text-slate-500" size={16} />
                                <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-sm font-medium" placeholder="Av. Calle, Nro, Distrito, Provincia" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: HEALTH & EMERGENCY */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
                            <Heart size={14} className="text-slate-700"/> Salud y Emergencia (SST)
                        </h3>
                        <div>
                            <label className="block text-xs font-bold text-slate-900 mb-1">Celular Personal <span className="text-red-600">*</span></label>
                            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-300 bg-white text-slate-900 p-2.5 rounded-lg outline-none text-sm font-medium" placeholder="999 000 000" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-red-50 p-4 rounded-lg border border-red-200">
                            <div>
                                <label className="block text-xs font-bold text-red-900 mb-1">Contacto de Emergencia (Nombre)</label>
                                <input required value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="w-full border border-red-300 bg-white text-slate-900 p-2.5 rounded-lg outline-none text-sm font-medium placeholder-slate-400" placeholder="Nombre del familiar" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-red-900 mb-1">Teléfono de Emergencia</label>
                                <input required type="tel" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="w-full border border-red-300 bg-white text-slate-900 p-2.5 rounded-lg outline-none text-sm font-medium placeholder-slate-400" placeholder="Celular de contacto" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: CORPORATE */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
                            <BriefcaseIcon /> Datos Corporativos
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-900 mb-1">Cargo / Puesto</label>
                                <input required value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full border border-slate-300 p-2.5 rounded-lg outline-none text-sm bg-slate-100 text-slate-600 font-medium cursor-not-allowed" readOnly={!!user.position} />
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <label className="block text-xs font-bold text-slate-900 mb-1">Correo Electrónico <span className="text-red-600">*</span></label>
                                <input required type="email" value={formData.secondaryEmail} onChange={e => setFormData({...formData, secondaryEmail: e.target.value})} className="w-full border border-blue-300 bg-white text-slate-900 p-2.5 rounded-lg outline-none text-sm font-medium" placeholder="email@personal.com" />
                                <p className="text-[11px] text-blue-800 mt-1 font-semibold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full inline-block"></span>
                                    Obligatorio para recibir notificaciones, confirmaciones y alertas del sistema.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg transition-all">
                            Siguiente Paso <ArrowRight size={18} />
                        </button>
                    </div>
                </form>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-blue-700" /> Acuerdo de Usuario y Responsabilidad
                    </h2>
                    <p className="text-sm text-slate-600 font-medium">
                        LEA ESTE ACUERDO CUIDADOSAMENTE. AL CREAR UNA CUENTA Y UTILIZAR ESTA PLATAFORMA, USTED ACEPTA Y SE OBLIGA LEGALMENTE A CUMPLIR CON TODOS LOS TÉRMINOS Y CONDICIONES AQUÍ DESCRITOS.
                    </p>

                    <div className="flex-1 border-2 border-slate-300 rounded-lg p-8 bg-slate-50 overflow-y-scroll text-justify text-sm text-slate-900 font-serif leading-relaxed max-h-[400px] shadow-inner selection:bg-yellow-200">
                        <h3 className="text-center font-bold text-lg mb-6 text-black uppercase underline decoration-2 underline-offset-4">Acuerdo de Usuario y Responsabilidad en la Gestión de SST</h3>
                        
                        <p className="font-bold mb-2">1. Objeto y Aceptación del Acuerdo</p>
                        <p className="mb-4">
                            El presente Acuerdo de Usuario (en adelante, "Acuerdo") regula el uso de la plataforma 
                            <span className="font-bold"> ZELCON </span> (en adelante, la "Plataforma"), destinada a la creación, llenado y gestión de 
                            documentos de Seguridad y Salud en el Trabajo (SST), así como al control y solicitud 
                            de items de almacén.
                            <br/><br/>
                            Al marcar la casilla de aceptación y crear una cuenta de usuario, usted ("el Usuario") 
                            celebra un contrato legalmente vinculante y declara haber leído, entendido y aceptado 
                            en su totalidad los términos aquí presentes, así como nuestra Política de Privacidad.
                        </p>

                        <p className="font-bold mb-2">2. Creación de Cuenta y Tratamiento de Datos Personales</p>
                        <p className="mb-4">
                            El Usuario se compromete a proporcionar información personal veraz, precisa y 
                            actualizada durante el proceso de registro (nombres, apellidos, DNI, cargo, etc.). Estos 
                            datos serán asociados a todas las acciones y documentos generados por el Usuario 
                            dentro de la Plataforma.
                            <br/><br/>
                            En cumplimiento de la Ley N° 29733, Ley de Protección de Datos Personales, y su 
                            reglamento, el Decreto Supremo N° 003-2013-JUS, el Usuario otorga su consentimiento 
                            explícito para que <span className="font-bold"> ZELCON </span> trate sus datos personales con la finalidad de:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Identificar al autor de cada documento de SST generado y de cada solicitud de almacén.</li>
                                <li>Garantizar la trazabilidad de las gestiones de seguridad y de inventario.</li>
                                <li>Cumplir con las obligaciones de fiscalización y auditoría exigidas por ley.</li>
                            </ul>
                        </p>

                        <p className="font-bold mb-2">3. Uso Consciente y Responsabilidad Legal en la Generación de Documentos SST</p>
                        <p className="mb-4">
                            La finalidad principal de la Plataforma es facilitar el cumplimiento de las normativas de 
                            SST. El Usuario declara entender y aceptar que su cuenta es personal e intransferible. Al 
                            utilizar esta Plataforma para crear y/o aprobar documentos como IPERC, ATS, PETAR, 
                            y otros, el Usuario acepta que:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Cada documento generado constituye una declaración jurada sobre las condiciones de seguridad, los peligros identificados y los controles establecidos.</li>
                                <li>Su identidad digital (usuario y contraseña) actúa como firma y manifestación de voluntad, atribuyéndole la autoría y la responsabilidad legal por el contenido del documento.</li>
                                <li>Esta responsabilidad se enmarca en lo dispuesto por la Ley N° 29783, Ley de Seguridad y Salud en el Trabajo, y su reglamento, el Decreto Supremo N° 005-2012-TR.</li>
                            </ul>
                        </p>

                        <p className="font-bold mb-2">4. Responsabilidad en la Solicitud y Uso de Items de Almacén</p>
                        <p className="mb-4">
                            El Usuario reconoce que la Plataforma también gestiona la solicitud y despacho de 
                            herramientas, equipos de protección personal (EPP), materiales y otros artículos (en 
                            adelante, "Items") del almacén. Al realizar una solicitud a través de su cuenta, el 
                            Usuario acepta y se compromete a lo siguiente:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Solicitud Vinculante:</strong> Cada solicitud de Items realizada desde su cuenta se considera una petición formal y vinculante, asociando la entrega de dichos Items a su responsabilidad personal y/o a su área de trabajo.</li>
                                <li><strong>Uso Adecuado y Cuidado:</strong> El Usuario es responsable del uso correcto, cuidado y custodia de las herramientas y equipos que le sean asignados. Deberá utilizarlos para los fines laborales previstos y de acuerdo con las normas de seguridad.</li>
                                <li><strong>Responsabilidad por Pérdida o Daño:</strong> En caso de pérdida, daño o deterioro de los Items por negligencia o mal uso, el Usuario asumirá la responsabilidad correspondiente, la cual podrá ser determinada por los procedimientos internos de la empresa.</li>
                                <li><strong>Devolución de Items:</strong> El Usuario se compromete a devolver los Items (especialmente herramientas y equipos reutilizables) en el plazo y las condiciones estipuladas por la administración del almacén.</li>
                            </ul>
                        </p>

                        <p className="font-bold mb-2">5. Cumplimiento de Normativa Sectorial (Minería y Energía)</p>
                        <p className="mb-4">
                            Para los usuarios que desarrollen actividades en los sectores de minería y energía, este 
                            Acuerdo se rige y complementa con la normativa sectorial específica. El llenado del 
                            IPERC Continuo y otros documentos a través de la Plataforma debe cumplir con las 
                            exigencias del Decreto Supremo N° 024-2016-EM, Reglamento de Seguridad y Salud 
                            Ocupacional en Minería, y sus modificatorias. El Usuario reconoce que los documentos 
                            generados están sujetos a la fiscalización del MINEM, la DREM y OSINERGMIN.
                        </p>

                        <p className="font-bold mb-2">6. Validez de los Registros Digitales</p>
                        <p className="mb-4">
                            Ambas partes acuerdan que los registros electrónicos generados por la Plataforma (logs 
                            de acceso, historial de creación de documentos y solicitudes de almacén, direcciones IP) 
                            constituirán prueba suficiente de las acciones realizadas por el Usuario, y podrán ser 
                            utilizados en caso de auditorías, fiscalizaciones o investigaciones.
                        </p>

                        <p className="font-bold mb-2">7. Prohibiciones</p>
                        <p className="mb-4">
                            Queda estrictamente prohibido:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Compartir las credenciales de acceso (usuario y contraseña) con terceros.</li>
                                <li>Consignar información deliberadamente falsa, incompleta o engañosa en los formularios de SST o en las solicitudes de almacén.</li>
                                <li>Utilizar la cuenta de otro usuario para generar documentos o solicitar Items.</li>
                            </ul>
                            El incumplimiento de estas prohibiciones será considerado una falta grave y podrá 
                            acarrear la suspensión de la cuenta, además de las responsabilidades civiles, penales y 
                            administrativas que correspondan.
                        </p>

                        <p className="font-bold mb-2">8. Ley Aplicable y Jurisdicción</p>
                        <p className="mb-4">
                            Este Acuerdo se rige e interpreta de acuerdo con las leyes de la República del Perú. 
                            Cualquier disputa o controversia derivada de este Acuerdo será sometida a la 
                            jurisdicción de los tribunales del Perú.
                        </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-start gap-3">
                        <input 
                            type="checkbox" 
                            id="acceptLegal" 
                            checked={legalAccepted} 
                            onChange={e => setLegalAccepted(e.target.checked)} 
                            className="mt-1 w-5 h-5 cursor-pointer text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="acceptLegal" className="text-sm text-slate-800 font-medium cursor-pointer select-none">
                            <strong>DECLARACIÓN JURADA:</strong> Declaro bajo juramento que los datos ingresados en mi ficha de personal son verdaderos y que he leído y acepto el Acuerdo de Usuario en su totalidad. Entiendo que mi contraseña es mi firma digital.
                        </label>
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 font-bold hover:bg-slate-100">
                            Atrás (Corregir Datos)
                        </button>
                        <button 
                            type="button" 
                            onClick={handleUpdateProfile}
                            disabled={!legalAccepted}
                            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${legalAccepted ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            <Save size={18} /> Confirmar y Acceder
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Helper Icon
const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
