'use client';

/**
 * ============================================================================
 * TELA: MINUTAS DO CAMINHONEIRO (MOBILE-FIRST E RESPONSIVA)
 * Localização no Projeto: caminhoneiro/app/minutas/page.tsx
 * Rota no Navegador: /minutas
 * Tecnologias: Next.js (App Router), React, TypeScript
 * Descrição: Exibe as minutas do motorista permitindo alternar entre todas
 *            as placas cadastradas, 100% adaptado para celulares.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';

interface MinutaMotorista {
  _id: string;
  ref: string;
  conteiner: string;
  terminalOrigem: string;
  terminalDestino: string;
  dataOp: string;
  dataVencimento?: string;
  dataPagamento?: string;
  tipoPgto: string;
  valorBruto: number;
  valorRpa: number;
  descontoAdicionalAplicado?: number;
  valorLiquidoFinal: number;
  valorFinalPago?: number;
  statusPagamento: 'PENDENTE' | 'PAGO';
  placa?: string;
}

export default function MinutasCaminhoneiroPage() {
  const [minhasPlacas, setMinhasPlacas] = useState<string[]>([]);
  const [placaSelecionada, setPlacaSelecionada] = useState<string>('');
  
  const [minutas, setMinutas] = useState<MinutaMotorista[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'TODAS' | 'PENDENTE' | 'PAGO'>('TODAS');
  const [carregando, setCarregando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState('');

  const [resumo, setResumo] = useState({
    totalBruto: 0,
    totalRpa: 0,
    totalDescontoAdicional: 0,
    totalLiquido: 0,
    qtdPendentes: 0,
    qtdPagas: 0,
    totalMinutas: 0,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const carregarMinutasDoMotorista = useCallback(async (placaBusca: string) => {
    if (!placaBusca || placaBusca.trim() === '') {
      setMensagemStatus('⚠️ Nenhuma placa selecionada para consulta.');
      return;
    }

    setCarregando(true);
    setMensagemStatus(`⏳ A consultar fretes para o veículo ${placaBusca}...`);

    try {
      const baseUrl = apiUrl.replace(/\/$/, '');
      const endpoint = `${baseUrl}/importacao/minhas-minutas?placa=${encodeURIComponent(placaBusca.trim())}`;

      const resposta = await fetch(endpoint);
      const resultado = await resposta.json();

      if (resposta.ok && resultado.sucesso) {
        setMinutas(resultado.dados || []);
        setResumo(resultado.resumo || {
          totalBruto: 0,
          totalRpa: 0,
          totalDescontoAdicional: 0,
          totalLiquido: 0,
          qtdPendentes: 0,
          qtdPagas: 0,
          totalMinutas: 0,
        });

        if (!resultado.dados || resultado.dados.length === 0) {
          setMensagemStatus(`ℹ️ Nenhuma minuta encontrada para a placa ${placaBusca}.`);
        } else {
          setMensagemStatus(`✅ ${resultado.dados.length} viagem(ns) encontrada(s) para a placa ${placaBusca}.`);
        }
      } else {
        setMensagemStatus(`⚠️ ${resultado.mensagem || 'Erro ao consultar a base de dados.'}`);
      }
    } catch (erro: any) {
      console.error('❌ Erro na conexão com a API:', erro);

      if (erro.message === 'Failed to fetch') {
        setMensagemStatus(`❌ Não foi possível conectar ao servidor (${apiUrl}). Verifique sua conexão ou status da API.`);
      } else {
        setMensagemStatus(`❌ ${erro.message || 'Falha ao conectar ao servidor backend.'}`);
      }
    } finally {
      setCarregando(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const dadosSalvos = localStorage.getItem('motorista') || localStorage.getItem('usuario') || localStorage.getItem('user');
    let listaPlacasMotorista: string[] = [];

    if (dadosSalvos) {
      try {
        const obj = JSON.parse(dadosSalvos);
        
        if (Array.isArray(obj.placas) && obj.placas.length > 0) {
          listaPlacasMotorista = obj.placas.map((p: string) => String(p).trim().toUpperCase());
        } else if (obj.placa || obj.cavalo) {
          listaPlacasMotorista = [String(obj.placa || obj.cavalo).trim().toUpperCase()];
        }
      } catch (e) {
        console.warn('⚠️ Falha ao ler dados da sessão local.');
      }
    }

    const placasLimpas = Array.from(new Set(listaPlacasMotorista.filter(Boolean)));
    setMinhasPlacas(placasLimpas);

    if (placasLimpas.length > 0) {
      const primeiraPlaca = placasLimpas[0];
      setPlacaSelecionada(primeiraPlaca);
      carregarMinutasDoMotorista(primeiraPlaca);
    } else {
      setMensagemStatus('ℹ️ Nenhuma placa encontrada na sua conta. Cadastre uma placa nas Configurações.');
    }
  }, [carregarMinutasDoMotorista]);

  const handleTrocarPlaca = (novaPlaca: string) => {
    setPlacaSelecionada(novaPlaca);
    if (novaPlaca) {
      carregarMinutasDoMotorista(novaPlaca);
    }
  };

  const formatarMoeda = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarData = (dataTexto?: string) => {
    if (!dataTexto) return 'N/A';
    try {
      const d = new Date(dataTexto);
      if (isNaN(d.getTime())) return dataTexto;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dataTexto;
    }
  };

  const minutasFiltradas = minutas.filter((item) => {
    if (abaAtiva === 'PENDENTE') return item.statusPagamento === 'PENDENTE';
    if (abaAtiva === 'PAGO') return item.statusPagamento === 'PAGO';
    return true;
  });

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      
      {/* Componente Navbar Híbrido */}
      <Navbar />

      <main style={estilos.mainContainer}>
        
        {/* CABEÇALHO COM SELETOR DE PLACAS RESPONSIVO */}
        <header style={estilos.headerFlex}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              🚚 Minhas Minutas
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.85rem', fontWeight: '500' }}>
              Consulte os fretes e pagamentos dos seus veículos
            </p>
          </div>

          {/* SELETOR DE PLACAS COM ÁREA DE TOQUE AMPLIADA */}
          <div style={estilos.caixaSeletor}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>Veículo:</span>
            
            {minhasPlacas.length > 0 ? (
              <select
                value={placaSelecionada}
                onChange={(e) => handleTrocarPlaca(e.target.value)}
                style={estilos.selectPlaca}
              >
                {minhasPlacas.map((p, idx) => (
                  <option key={idx} value={p}>
                    🚚 {p}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={placaSelecionada}
                onChange={(e) => setPlacaSelecionada(e.target.value.toUpperCase())}
                placeholder="Placa"
                style={estilos.inputPlaca}
              />
            )}

            <button
              onClick={() => carregarMinutasDoMotorista(placaSelecionada)}
              disabled={carregando}
              style={estilos.botaoAtualizar}
            >
              {carregando ? '⏳' : '🔍 Buscar'}
            </button>
          </div>
        </header>

        {/* MENSAGEM DE STATUS */}
        {mensagemStatus && (
          <div style={{
            padding: '0.85rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            fontWeight: '700',
            marginBottom: '1.25rem',
            backgroundColor: mensagemStatus.includes('❌') ? '#fef2f2' : mensagemStatus.includes('✅') ? '#f0fdf4' : '#eff6ff',
            color: mensagemStatus.includes('❌') ? '#991b1b' : mensagemStatus.includes('✅') ? '#166534' : '#1e40af',
            border: '1px solid',
            borderColor: mensagemStatus.includes('❌') ? '#fecaca' : mensagemStatus.includes('✅') ? '#bbf7d0' : '#bfdbfe',
          }}>
            {mensagemStatus}
          </div>
        )}

        {/* CARDS DE RESUMO FINANCEIRO (KPIs) */}
        <section style={estilos.gridTotais}>
          <div style={estilos.cardKpi}>
            <span style={estilos.tituloKpi}>TOTAL LÍQUIDO A RECEBER</span>
            <p style={{ ...estilos.valorKpi, color: '#16a34a' }}>
              {formatarMoeda(resumo.totalLiquido)}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
              Bruto: {formatarMoeda(resumo.totalBruto)} | RPA: -{formatarMoeda(resumo.totalRpa)}
            </span>
          </div>

          <div style={estilos.cardKpi}>
            <span style={estilos.tituloKpi}>FRETES PENDENTES</span>
            <p style={{ ...estilos.valorKpi, color: '#d97706' }}>
              {resumo.qtdPendentes}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Aguardando pagamento</span>
          </div>

          <div style={estilos.cardKpi}>
            <span style={estilos.tituloKpi}>FRETES PAGOS</span>
            <p style={{ ...estilos.valorKpi, color: '#2563eb' }}>
              {resumo.qtdPagas}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Pagamentos efetuados</span>
          </div>
        </section>

        {/* ABAS DE FILTRO */}
        <div style={estilos.containerAbas}>
          <button
            onClick={() => setAbaAtiva('TODAS')}
            style={{ ...estilos.botaoAba, ...(abaAtiva === 'TODAS' ? estilos.botaoAbaAtivo : {}) }}
          >
            Todas ({resumo.totalMinutas})
          </button>
          <button
            onClick={() => setAbaAtiva('PENDENTE')}
            style={{ ...estilos.botaoAba, ...(abaAtiva === 'PENDENTE' ? estilos.botaoAbaAtivo : {}) }}
          >
            ⏳ Pendentes ({resumo.qtdPendentes})
          </button>
          <button
            onClick={() => setAbaAtiva('PAGO')}
            style={{ ...estilos.botaoAba, ...(abaAtiva === 'PAGO' ? estilos.botaoAbaAtivo : {}) }}
          >
            ✅ Pagas ({resumo.qtdPagas})
          </button>
        </div>

        {/* TABELA DE MINUTAS COM ROLAGEM HORIZONTAL SUAVE NO TELEMÓVEL */}
        <section style={estilos.cardBoxTabela}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={estilos.tabela}>
              <thead>
                <tr>
                  <th style={estilos.th}>REF / Contêiner</th>
                  <th style={estilos.th}>Data Entrega/Op.</th>
                  <th style={estilos.th}>Origem ➔ Destino</th>
                  <th style={estilos.th}>Tipo PGTO</th>
                  <th style={estilos.th}>Valor Líquido</th>
                  <th style={estilos.th}>Data PGTO</th>
                  <th style={estilos.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {minutasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontWeight: '600' }}>
                      Nenhuma minuta encontrada para a placa selecionada.
                    </td>
                  </tr>
                ) : (
                  minutasFiltradas.map((m) => {
                    const vBruto = m.valorBruto || 0;
                    const vRpa = m.valorRpa || (vBruto * 0.027);
                    const descAdd = m.descontoAdicionalAplicado || 0;
                    const vLiquido = m.valorFinalPago || m.valorLiquidoFinal || (vBruto - vRpa - descAdd);

                    return (
                      <tr key={m._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={estilos.td}>
                          <strong>{m.ref}</strong>
                          <br />
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.conteiner}</span>
                        </td>
                        <td style={{ ...estilos.td, fontWeight: '700', color: '#0f172a' }}>
                          📅 {formatarData(m.dataOp)}
                        </td>
                        <td style={estilos.td}>
                          {m.terminalOrigem} ➔ {m.terminalDestino}
                        </td>
                        <td style={estilos.td}>{m.tipoPgto}</td>
                        <td style={{ ...estilos.td, fontWeight: '800', color: '#16a34a' }}>
                          {formatarMoeda(vLiquido)}
                        </td>
                        <td style={{ ...estilos.td, fontWeight: '700', color: m.statusPagamento === 'PAGO' ? '#16a34a' : '#64748b' }}>
                          {m.statusPagamento === 'PAGO' ? `✅ ${formatarData(m.dataPagamento)}` : '⏳ Aguardando'}
                        </td>
                        <td style={estilos.td}>
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            backgroundColor: m.statusPagamento === 'PAGO' ? '#f0fdf4' : '#fffbeb',
                            color: m.statusPagamento === 'PAGO' ? '#166534' : '#b45309',
                            border: '1px solid',
                            borderColor: m.statusPagamento === 'PAGO' ? '#bbf7d0' : '#fde68a',
                          }}>
                            {m.statusPagamento === 'PAGO' ? '✅ PAGO' : '⏳ PENDENTE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  );
}

// Estilos Responsivos Otimizados para Celular
const estilos: { [key: string]: React.CSSProperties } = {
  mainContainer: {
    padding: '1.25rem 1rem',
    boxSizing: 'border-box',
    width: '100%',
  },
  headerFlex: {
    marginBottom: '1.25rem',
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '1rem',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caixaSeletor: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '0.5rem 0.75rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
    width: '100%',
    maxWidth: '360px',
  },
  selectPlaca: {
    flex: 1,
    minHeight: '40px',
    padding: '0.4rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #94a3b8',
    fontWeight: '800',
    fontSize: '0.9rem',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  inputPlaca: {
    flex: 1,
    minHeight: '40px',
    padding: '0.4rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontWeight: '800',
    textAlign: 'center',
  },
  botaoAtualizar: {
    minHeight: '40px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  gridTotais: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
    gap: '1rem', 
    marginBottom: '1.25rem' 
  },
  cardKpi: { 
    backgroundColor: '#ffffff', 
    padding: '1rem', 
    borderRadius: '12px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)' 
  },
  tituloKpi: { fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  valorKpi: { margin: '0.3rem 0', fontSize: '1.35rem', fontWeight: '800' },
  containerAbas: { display: 'flex', gap: '0.35rem', marginBottom: '1rem', overflowX: 'auto' },
  botaoAba: { 
    flex: 1, 
    minHeight: '42px', 
    padding: '0.5rem 0.75rem', 
    backgroundColor: '#e2e8f0', 
    color: '#475569', 
    border: 'none', 
    borderRadius: '8px', 
    fontWeight: '800', 
    cursor: 'pointer', 
    fontSize: '0.8rem',
    whiteSpace: 'nowrap'
  },
  botaoAbaAtivo: { backgroundColor: '#2563eb', color: '#ffffff' },
  cardBoxTabela: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' },
  tabela: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  th: { padding: '0.75rem 0.85rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  td: { padding: '0.75rem 0.85rem', color: '#1e293b', whiteSpace: 'nowrap' },
};