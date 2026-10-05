'use client';

/**
 * ============================================================================
 * COMPONENTE: NAVBAR / SIDEBAR COM TIPO DE USUÁRIO
 * Localização: app/components/Navbar.tsx (ou Sidebar.tsx)
 * Descrição: Componente de navegação lateral que recebe o usuário logado
 * ============================================================================
 */

import React from 'react';
import Link from 'next/link';

// 1. Definição da estrutura da sessão do motorista/usuário
export interface MotoristaSessao {
  nome: string;
  perfil: string;
  placa?: string;
  email?: string;
}

// 2. Definição explicita das PROPS aceitas pelo componente para corrigir o erro TS2322
interface NavbarProps {
  usuario: MotoristaSessao;
}

export default function Sidebar({ usuario }: NavbarProps) {
  return (
    <aside style={estilos.sidebar}>
      <div style={estilos.logoArea}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#3b82f6' }}>FinLog</h2>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Painel Financeiro</span>
      </div>

      <nav style={estilos.nav}>
        <Link href="/importacao" style={estilos.link}>
          📊 Importação
        </Link>
        <Link href="/configuracoes" style={estilos.link}>
          ⚙️ Configurações
        </Link>
      </nav>

      <div style={estilos.usuarioArea}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>👤 {usuario?.nome || 'Utilizador'}</span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{usuario?.perfil || 'OPERADOR'}</span>
      </div>
    </aside>
  );
}

const estilos: { [key: string]: React.CSSProperties } = {
  sidebar: { width: '240px', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0 },
  logoArea: { marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 },
  link: { color: '#cbd5e1', textDecoration: 'none', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '500' },
  usuarioArea: { borderTop: '1px solid #334155', paddingTop: '1rem', display: 'flex', flexDirection: 'column' },
};