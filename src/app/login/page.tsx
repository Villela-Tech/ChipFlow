'use client';

import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function Login() {
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
          
          <Suspense fallback={<div>Carregando...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
