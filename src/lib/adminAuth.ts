// Este arquivo é mantido apenas para compatibilidade
// Não contém funcionalidade real de autenticação de administrador

export interface AdminAuthResponse {
  success: boolean;
  error?: string;
}

export const adminLogin = async (email: string, password: string): Promise<AdminAuthResponse> => {
  // Simulação de login de administrador
  if (email === 'admin@admin.com' && password === 'admin123') {
    return { success: true };
  }
  
  return { 
    success: false, 
    error: 'Credenciais inválidas'
  };
};