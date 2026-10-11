'use client';

/**
 * ============================================================================
 * PORTAL DO CAMINHONEIRO: CONSULTA DE ROTAS E FRETES (MOBILE-FIRST E RESPONSIVO)
 * Localização no VS Code: caminhoneiro/app/rotas/page.tsx
 * Tecnologias: Next.js (App Router), React, TypeScript
 * Descrição: Exibe a tabela de fretes do motorista consultando a API backend.
 *            Possui layout totalmente adaptado para telemóveis e computadores.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  const [carregando, setCarregando] = useState(false);
  const [erroApi, setErroApi] = useState('');

  // Endpoint do Servidor Express
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Formatação de valores em Reais (R$)
  const formatarMoeda = (valor: number) => {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  /**
   * Função para carregar as rotas da API com tratamento de erros resiliente
   */
  const carregarRotas = useCallback(async (termo: string = '') => {
    setCarregando(true);
    setErroApi('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const baseUrl = apiUrl.replace(/\/$/, '');
      const url = `${baseUrl}/rotas-valores?busca=${encodeURIComponent(termo.trim())}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const textoResposta = await res.text();

      if (textoResposta.trim().startsWith('<')) {
        throw new Error('O servidor backend devolveu uma página HTML. Verifique se o servidor Express está ativo.');
      }

      const data = JSON.parse(textoResposta);

      if (res.ok && (data.sucesso || Array.isArray(data.dados) || Array.isArray(data.rotas))) {
        const listaRotas = Array.isArray(data.dados) 
          ? data.dados 
          : Array.isArray(data.rotas) 
          ? data.rotas 
          : Array.isArray(data) 
          ? data 
          : [];

        setRotas(listaRotas);
      } else {
        setErroApi(data.mensagem || 'Não foi possível carregar a tabela de fretes.');
      }
    } catch (erro: any) {
      clearTimeout(timeoutId);
      console.error('❌ Erro na consulta de rotas:', erro);

      if (erro.name === 'AbortError') {
        setErroApi('⏱️ O servidor demorou muito para responder. Verifique sua conexão com a internet.');
      } else if (erro.message === 'Failed to fetch') {
        setErroApi(`❌ Não foi possível conectar ao servidor (${apiUrl}). Verifique se o servidor backend está ativo.`);
      } else {
        setErroApi(`⚠️ ${erro.message || 'Erro ao conectar com o servidor backend.'}`);
      }
    } finally {
      setCarregando(false);
    }
  }, [apiUrl]);

  // Passo 1: Marca a montagem do componente no navegador
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Passo 2: Valida a sessão no localStorage após a montagem
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
      carregarRotas('');
    } else {
      console.warn('⚠️ Nenhuma sessão encontrada. Redirecionando para o login...');
      router.push('/');
    }
  }, [isMounted, router, carregarRotas]);

  if (!isMounted) return null;

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      
      {/* BARRA DE NAVEGAÇÃO LATERAL/TOPO RESPONSIVA */}
      <Sidebar usuario={motorista || { nome: 'Motorista' }} />

      {/* CONTEÚDO PRINCIPAL */}
      <main style={estilos.mainContainer}>
        
        {/* CABEÇALHO */}
        <header style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            🗺️ Rotas e Valores
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
            Consulte as rotas disponíveis e os valores de frete da tabela.
          </p>
        </header>

        {/* ALERTA DE ERRO DE CONEXÃO */}
        {erroApi && (
          <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: '600' }}>
            {erroApi}
          </div>
        )}

        {/* BARRA DE PESQUISA RESPONSIVA */}
        <section style={estilos.caixaPesquisa}>
          <input
            type="text"
            placeholder="🔍 Origem, Destino ou Cliente (ex: Cubatão, Santos)..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregarRotas(termoBusca)}
            style={estilos.inputPesquisa}
          />
          <button
            onClick={() => carregarRotas(termoBusca)}
            disabled={carregando}
            style={estilos.botaoBuscar}
          >
            {carregando ? '⏳' : 'Buscar'}
          </button>
        </section>

        {/* LISTA / CARDS DE FRETES */}
        <section style={estilos.gridRotas}>
          {carregando ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <span style={{ fontSize: '2rem' }}>⏳</span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.95rem', fontWeight: '600' }}>A consultar tabela de fretes no servidor...</p>
            </div>
          ) : rotas.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <span style={{ fontSize: '2.5rem' }}>🚛</span>
              <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                Nenhuma rota encontrada para a pesquisa efetuada.
              </p>
            </div>
          ) : (
            rotas.map((item, index) => (
              <div
                key={item._id || index}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      {item.cliente || 'FRETE'}
                    </span>
                    {item.tipoFatura && (
                      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                        {item.tipoFatura}
                      </span>
                    )}
                  </div>

                  <div style={{ margin: '0.5rem 0 1rem 0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                      ORIGEM → DESTINO
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem', wordBreak: 'break-word' }}>
                      <span style={{ color: '#2563eb' }}>{item.origem}</span>
                      <span style={{ margin: '0 0.3rem', color: '#94a3b8' }}>→</span>
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
                  <strong style={{ fontSize: '1.25rem', fontWeight: '800', color: '#16a34a' }}>
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

// Estilos Responsivos
const estilos: { [key: string]: React.CSSProperties } = {
  mainContainer: {
    padding: '1.25rem 1rem',
    boxSizing: 'border-box',
    width: '100%',
  },
  caixaPesquisa: {
    backgroundColor: '#ffffff',
    padding: '0.85rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '1.25rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.65rem',
  },
  inputPesquisa: {
    flex: '1 1 200px',
    minHeight: '44px',
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
  },
  botaoBuscar: {
    minHeight: '44px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '0.7rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    flex: '0 0 auto',
  },
  gridRotas: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
};