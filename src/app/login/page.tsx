'use client';

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      
      // Salvar o token no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Login realizado com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      toast.error('Email ou senha inválidos');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#38BDF8] flex">
      {/* Left side with logo and welcome message */}
      <div className="flex-1 flex flex-col justify-start px-16 lg:px-24 pt-14">
        <div className="flex items-start mb-24">
          <Image src="/images/Logo.png" alt="ChipFlow Logo" width={83} height={83} priority className="object-contain" />
        </div>
        <h1 className="text-white text-7xl font-bold leading-tight mb-6 mt-30">
          Bem-Vindo ao<br />ChipFlow
        </h1>
        <p className="text-white/80 text-sm">© Desenvolvido por VillelaTech</p>
      </div>

      {/* Right side with login form */}
      <div className="flex-1 bg-white rounded-l-[2.5rem] shadow-lg flex items-center">
        <div className="w-full max-w-md mx-auto px-16">
          <h2 className="text-4xl font-bold mb-20">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div>
              <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:outline-none focus:border-[#38BDF8] transition-colors text-lg placeholder:text-gray-400"
                placeholder="Digite seu email"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-0 py-2 border-0 border-b border-gray-300 focus:outline-none focus:border-[#38BDF8] transition-colors text-lg placeholder:text-gray-400"
                placeholder="Digite sua senha"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-center pt-6">
              <div className="border-t border-gray-200 w-full" />
              <span className="px-8 text-base text-gray-500 whitespace-nowrap">Ou</span>
              <div className="border-t border-gray-200 w-full" />
            </div>

            <div className="text-center">
              <span className="text-base text-gray-600">
                Não possui conta?{" "}
                <a href="#" className="text-[#38BDF8] hover:underline font-medium">
                  Inscreva-se
                </a>
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#38BDF8] text-white py-4 rounded-md hover:bg-[#6BD14F]/90 transition-colors font-medium text-lg mt-8 cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
