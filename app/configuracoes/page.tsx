'use client';

/**
 * ============================================================================
 * TELA: CONFIGURAÇÕES DO USUÁRIO
 * Localização: app/configuracoes/page.tsx
 * Descrição: Tela de gestão de conta e preferências
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { MotoristaSessao } from '../components/Navbar';

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<MotoristaSessao | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioSalvo = localStorage.getItem('usuario');

    if (!token || !usuarioSalvo) {
      router.push('/');
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioSalvo));
    } catch (erro) {
      router.push('/');
    }
  }, [router]);

  if (!usuario) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex' }}>
      {/* LINHA 140: Agora aceita a prop 'usuario' sem erros de tipo */}
      <Sidebar usuario={usuario} />

      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem 3rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' }}>
            Configurações da Conta
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Gerencie suas informações de perfil e preferências do sistema.
          </p>
        </header>

        <section style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#0f172a' }}>Perfil do Utilizador</h3>
          <p><strong>Nome:</strong> {usuario.nome}</p>
          <p><strong>Perfil:</strong> {usuario.perfil}</p>
          {usuario.placa && <p><strong>Placa Vinculada:</strong> {usuario.placa}</p>}
        </section>
      </main>
    </div>
  );
}