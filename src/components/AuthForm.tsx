import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Lock, Mail, User, Loader, Phone, FileText, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthFormProps {
  onSuccess: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    cpf: '',
    birth_date: ''
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      cpf?: string;
      birth_date?: string;
    } = {};
    let isValid = true;

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      isValid = false;
    } else if (isSignUp && formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    // Name validation (only for signup)
    if (isSignUp) {
      if (!formData.name) {
        newErrors.name = 'Nome é obrigatório';
        isValid = false;
      }

      // Phone validation
      if (!formData.phone) {
        newErrors.phone = 'Telefone é obrigatório';
        isValid = false;
      } else if (!/^\+?[1-9]\d{10,14}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Telefone inválido';
        isValid = false;
      }

      // CPF validation
      if (!formData.cpf) {
        newErrors.cpf = 'CPF é obrigatório';
        isValid = false;
      } else if (!/^\d{11}$/.test(formData.cpf.replace(/\D/g, ''))) {
        newErrors.cpf = 'CPF inválido';
        isValid = false;
      }

      // Birth date validation
      if (!formData.birth_date) {
        newErrors.birth_date = 'Data de nascimento é obrigatória';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário
    console.log('Formulário enviado:', formData); // Log para depuração

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.phone.replace(/\D/g, ''),
          formData.cpf.replace(/\D/g, ''),
          formData.birth_date
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        toast.success('Conta criada com sucesso! Faça login para continuar.');
        setIsSignUp(false);
        setFormData((prev) => ({
          ...prev,
          password: '',
          name: '',
          phone: '',
          cpf: '',
          birth_date: ''
        }));
      } else {
        const result = await signIn(formData.email, formData.password);

        if (!result.success) {
          throw new Error(result.error);
        }

        toast.success('Login realizado com sucesso!');
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      toast.error(error.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      // Simulate Google sign in
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, create a mock Google user
      const mockGoogleUser = {
        email: 'usuario.google@gmail.com',
        name: 'Usuário Google',
        password: crypto.randomUUID() // Random secure password
      };
      
      const result = await signIn(mockGoogleUser.email, mockGoogleUser.password);
      
      if (!result.success) {
        // If login fails, try to register the user first
        const signUpResult = await signUp(
          mockGoogleUser.email, 
          mockGoogleUser.password,
          mockGoogleUser.name,
          '',
          '',
          ''
        );
        
        if (!signUpResult.success) {
          throw new Error(signUpResult.error);
        }
        
        // Then try to login again
        const retryResult = await signIn(mockGoogleUser.email, mockGoogleUser.password);
        
        if (!retryResult.success) {
          throw new Error('Falha ao autenticar com Google');
        }
      }
      
      toast.success('Login com Google realizado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(error.message || 'Erro na autenticação com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-gray-900 to-black md:flex md:items-center md:justify-center">
      <div className="w-full h-full md:max-w-md md:h-auto md:p-4">
        {/* Mobile-optimized container with more transparency */}
        <div className="min-h-screen w-full bg-black/5 backdrop-blur-sm md:min-h-0 md:rounded-2xl md:shadow-xl md:border md:border-white/10">
          {/* Header */}
          <div className="relative px-6 pt-8 pb-4 border-b border-white/10">
            {isSignUp && (
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setErrors({});
                  setFormData({
                    email: '',
                    password: '',
                    name: '',
                    phone: '',
                    cpf: '',
                    birth_date: ''
                  });
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <h1 className="text-center text-xl font-semibold text-white">
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </h1>
          </div>

          {/* Logo */}
          <div className="px-6 py-8">
            <div className="h-16 w-32 mx-auto mb-4">
              <picture>
                <source srcSet="/logobranca.png" type="image/png" />
                <img
                  src="/logobranca.png"
                  alt="Cashzy Logo"
                  className="h-full w-auto object-contain"
                  loading="eager"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.onerror = null;
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjUwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiNmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYXNoenk8L3RleHQ+PC9zdmc+';
                  }}
                />
              </picture>
            </div>
            <p className="text-center text-sm text-gray-400">
              {isSignUp
                ? 'Crie sua conta para gerenciar suas finanças'
                : 'Entre para continuar gerenciando suas finanças'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full h-12 pl-10 pr-4 bg-white/5 border ${
                        errors.name ? 'border-red-500' : 'border-gray-700'
                      } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500`}
                      placeholder="Seu nome completo"
                      disabled={loading}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                      className={`w-full h-12 pl-10 pr-4 bg-white/5 border ${
                        errors.phone ? 'border-red-500' : 'border-gray-700'
                      } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500`}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    CPF
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      className={`w-full h-12 pl-10 pr-4 bg-white/5 border ${
                        errors.cpf ? 'border-red-500' : 'border-gray-700'
                      } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500`}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      disabled={loading}
                    />
                  </div>
                  {errors.cpf && (
                    <p className="mt-1 text-sm text-red-500">{errors.cpf}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Data de Nascimento
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className={`w-full h-12 pl-3 pr-4 bg-white/5 border ${
                        errors.birth_date ? 'border-red-500' : 'border-gray-700'
                      } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500`}
                      placeholder="DD/MM/AAAA"
                      disabled={loading}
                    />
                  </div>
                  {errors.birth_date && (
                    <p className="mt-1 text-sm text-red-500">{errors.birth_date}</p>
                  )}
                </div>
              </>
            )}

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
                  className={`w-full h-12 pl-10 pr-4 bg-white/5 border ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500`}
                  placeholder="seu@email.com"
                  disabled={loading}
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
                  className={`w-full h-12 pl-10 pr-4 bg-white/5 border ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
                  } rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500`}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
              {isSignUp && !errors.password && (
                <p className="mt-1 text-xs text-gray-400">A senha deve ter pelo menos 6 caracteres</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-purple-600 text-white font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    {isSignUp ? 'Criando conta...' : 'Entrando...'}
                  </>
                ) : (
                  isSignUp ? 'Criar Conta' : 'Entrar'
                )}
              </button>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  className="w-full h-12 bg-white text-gray-900 font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {googleLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                        <path fill="none" d="M1 1h22v22H1z" />
                      </svg>
                      Continuar com Google
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Toggle Sign Up/Sign In */}
            {!isSignUp && (
              <div className="py-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrors({});
                    setFormData({
                      email: '',
                      password: '',
                      name: '',
                      phone: '',
                      cpf: '',
                      birth_date: ''
                    });
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  Não tem uma conta? <span className="text-purple-400">Crie aqui</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;