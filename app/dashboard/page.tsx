'use client';

/**
 * ============================================================================
 * PORTAL DO CAMINHONEIRO - DASHBOARD COM BARRA LATERAL (SIDEBAR)
 * Localização: caminhoneiro/app/dashboard/page.tsx
 * Tecnologias: Next.js (App Router), React, CSS-in-JS Inline
 * ============================================================================
 */

import React from 'react';
import Sidebar from '@/app/components/Navbar';

export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', display: 'flex' }}>
      
      {/* BARRA LATERAL FIXA */}
      <Sidebar />

      {/* ÁREA DE CONTEÚDO PRINCIPAL (COM MARGEM DA SIDEBAR) */}
      <main style={{ marginLeft: '250px', flex: 1, padding: '2.5rem 3rem' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800' }}>Painel do Motorista</h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            Resumo das suas atividades, minutas e saldos pendentes
          </p>
        </header>

        {/* CARDS DE RESUMO */}
        <div style={estilos.gridCards}>
          <div style={estilos.cardMetrica}>
            <div style={estilos.rotulo}>Minutas Aprovadas</div>
            <div style={estilos.valor}>12 Viagens</div>
            <span style={estilos.sub}>Vinculadas às suas placas</span>
          </div>

          <div style={estilos.cardMetrica}>
            <div style={estilos.rotulo}>Total Bruto Estimado</div>
            <div style={estilos.valor}>R$ 18.450,00</div>
            <span style={estilos.sub}>Valores de frete cadastrados</span>
          </div>

          <div style={estilos.cardMetrica}>
            <div style={estilos.rotulo}>Retenção RPA (2,7%)</div>
            <div style={{ ...estilos.valor, color: '#dc2626' }}>- R$ 498,15</div>
            <span style={estilos.sub}>Desconto de imposto obrigatório</span>
          </div>

          <div style={estilos.cardMetrica}>
            <div style={estilos.rotulo}>Valor Líquido Estimado</div>
            <div style={{ ...estilos.valor, color: '#16a34a' }}>R$ 17.951,85</div>
            <span style={estilos.sub}>Líquido a receber via PIX</span>
          </div>
        </div>
      </main>

    </div>
  );
}

const estilos = {
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '1.25rem',
  },
  cardMetrica: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  rotulo: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  valor: {
    fontSize: '1.6rem',
    fontWeight: '800' as const,
    margin: '0.5rem 0',
    color: '#ffffff',
  },
  sub: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
};