
import { createClient } from '@supabase/supabase-js';

// =======================================================
// CONFIGURACIÓN PARA PRODUCCIÓN
// =======================================================
// 1. Crea cuenta en supabase.com
// 2. Crea un proyecto
// 3. Copia las credenciales en un archivo .env.local:
//    VITE_SUPABASE_URL=tu_url_aqui
//    VITE_SUPABASE_ANON_KEY=tu_key_aqui
// =======================================================

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

// Exportamos el cliente solo si existen las keys, si no, retornamos null
// para que el sistema siga usando mockDb.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper para saber si estamos en modo Real o Mock
export const isProduction = () => !!supabase;
