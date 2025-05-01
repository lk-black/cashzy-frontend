import React, { useState } from 'react';
import { adminLogin } from '../lib/adminAuth';
import { toast } from 'react-hot-toast';
import { Lock, Mail, ArrowRight, Loader } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [animateBackground, setAnimateBackground] = useState(false);

  React.useEffect(() => {
    // Start background animation after component mounts
    const timer = setTimeout(() => {
      setAnimateBackground(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};
    let isValid = true;

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const result = await adminLogin(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login admin realizado com sucesso!');
        onSuccess();
      } else {
        toast.error(result.error || 'Credenciais inválidas');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-gray-900 to-black p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600/20 blur-3xl transition-all duration-3000 ease-in-out ${animateBackground ? 'translate-x-32 translate-y-16' : ''}`}></div>
        
        <div className={`absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl transition-all duration-3000 ease-in-out ${animateBackground ? '-translate-x-24 -translate-y-12' : ''}`}></div>
        
        <div className={`absolute top-2/3 right-1/3 w-80 h-80 rounded-full bg-pink-600/20 blur-3xl transition-all duration-3000 ease-in-out ${animateBackground ? 'translate-x-16 -translate-y-20' : ''}`}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20 transition-all duration-500 hover:border-purple-500/30 hover:shadow-purple-500/10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Lock className="w-10 h-10 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Painel Administrativo
            </h1>
            <p className="text-gray-300">
              Faça login para acessar o painel admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 bg-white/5 border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400`}
                  placeholder="admin@admin.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 bg-white/5 border ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar como Admin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Voltar para o login normal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;