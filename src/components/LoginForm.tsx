'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await login(email, password);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer login');
      }

      toast.success('Login realizado com sucesso!');
      
      // Redirecionar para a página anterior ou para a home
      const from = searchParams.get('from');
      if (from && !from.startsWith('/login')) {
        router.push(from);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        className="w-full bg-[#38BDF8] text-white py-4 rounded-md hover:bg-[#38BDF8]/90 transition-colors font-medium text-lg mt-8 cursor-pointer disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Login'}
      </button>
    </form>
  );
} 