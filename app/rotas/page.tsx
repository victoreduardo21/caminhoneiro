'use client';

/**
 * ============================================================================
 * PORTAL DO CAMINHONEIRO: PÁGINA DE CONSULTA DE ROTAS E FRETES (COM NAVBAR)
 * Localização no VS Code: caminhoneiro/app/rotas/page.tsx
 * Tecnologias: Next.js (App Router), React, TypeScript
 * Descrição: Inclui a barra de navegação lateral (Sidebar/Navbar) e exibe a
 *            tabela de fretes cadastrada para o motorista.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// Importa o componente da Barra de Navegação do projeto caminhoneiro
import Sidebar from '../components/Navbar'; 

interface RotaItem {
  _id: string;
  cliente: string;
  origem: string;
  destino: string;
  regime?: string;
  tipoFatura?: string;
  valorFreteCarreteiro: number;
}

export default function RotasCaminhoneiroPage() {
  const router = useRouter();
  
  const [isMounted, setIsMounted] = useState(false);
  const [motorista, setMotorista] = useState<any>(null);
  const [rotas, setRotas] = useState<RotaItem[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // Endpoint da API Express
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Formatação em Moeda BRL (R$)
  const formatarMoeda = (valor: number) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Carrega as rotas da API
  const carregarRotas = useCallback(async () => {
    setCarregando(true);
    try {
      const res = await fetch(`${apiUrl}/rotas-valores?busca=${encodeURIComponent(termoBusca)}`);
      const data = await res.json();

      if (res.ok && data.dados) {
        setRotas(data.dados);
      } else {
        setRotas([]);
      }
    } catch (erro) {
      console.error('❌ Erro ao carregar rotas no portal do caminhoneiro:', erro);
    } finally {
      setCarregando(false);
    }
  }, [apiUrl, termoBusca]);

  // Garante a montagem no navegador no Next.js
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validação de Sessão Flexível
  useEffect(() => {
    if (!isMounted) return;

    const token = localStorage.getItem('token_motorista') || localStorage.getItem('token');
    const dadosSessao = 
      localStorage.getItem('motorista') || 
      localStorage.getItem('caminhoneiro') || 
      localStorage.getItem('usuario');

    if (dadosSessao || token) {
      try {
        const parsed = dadosSessao ? JSON.parse(dadosSessao) : { nome: 'Motorista' };
        setMotorista(parsed);
      } catch (e) {
        setMotorista({ nome: 'Motorista' });
      }
      carregarRotas();
    } else {
      console.warn('⚠️ Nenhuma sessão encontrada. Redirecionando...');
      router.push('/');
    }
  }, [isMounted, router, carregarRotas]);

  if (!isMounted || !motorista) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <p style={{ color: '#64748b', fontWeight: '600' }}>⏳ A carregar tabela de fretes...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex' }}>
      
      {/* BARRA DE NAVEGAÇÃO LATERAL */}
      <Sidebar usuario={motorista} />

      {/* CONTEÚDO PRINCIPAL (Alinhado à direita da Sidebar) */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem 3rem' }}>
        
        {/* CABEÇALHO */}
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            🚚 Tabela de Fretes
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Bem-vindo, <strong>{motorista.nome || 'Motorista'}</strong>! Consulte os valores pagos por cada rota.
          </p>
        </header>

        {/* BARRA DE PESQUISA DE ROTAS */}
        <section style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <input
            type="text"
            placeholder="🔍 Pesquisar por Origem, Destino ou Cliente (ex: Cubatão, Santos, Brado)..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregarRotas()}
            style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#0f172a', outline: 'none' }}
          />
          <button
            onClick={carregarRotas}
            disabled={carregando}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
          >
            {carregando ? '⏳' : 'Buscar'}
          </button>
        </section>

        {/* LISTA / CARDS DE FRETES */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {rotas.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <span style={{ fontSize: '2.5rem' }}>🚛</span>
              <p style={{ marginTop: '0.5rem', fontSize: '1rem' }}>
                {carregando ? 'A carregar rotas...' : 'Nenhuma rota encontrada para esta pesquisa.'}
              </p>
            </div>
          ) : (
            rotas.map((item) => (
              <div
                key={item._id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {item.cliente}
                    </span>
                    {item.tipoFatura && (
                      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                        {item.tipoFatura}
                      </span>
                    )}
                  </div>

                  <div style={{ margin: '0.5rem 0 1rem 0' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                      ORIGEM → DESTINO
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
                      <span style={{ color: '#2563eb' }}>{item.origem}</span>
                      <span style={{ margin: '0 0.4rem', color: '#94a3b8' }}>→</span>
                      <span style={{ color: '#16a34a' }}>{item.destino}</span>
                    </div>
                  </div>

                  {item.regime && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      Regime: <strong style={{ color: '#334155' }}>{item.regime}</strong>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.85rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b' }}>VALOR CARRETEIRO</span>
                  <strong style={{ fontSize: '1.3rem', fontWeight: '800', color: '#16a34a' }}>
                    {formatarMoeda(item.valorFreteCarreteiro)}
                  </strong>
                </div>
              </div>
            ))
          )}
        </section>

      </main>
    </div>
  );
}