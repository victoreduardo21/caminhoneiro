'use client';

/**
 * ============================================================================
 * TELA: MINUTAS DO CAMINHONEIRO (SUPORTE A MÚLTIPLAS PLACAS)
 * Localização no Projeto: caminhoneiro/app/minutas/page.tsx
 * Rota no Navegador: http://localhost:3000/minutas
 * Descrição: Exibe as minutas do motorista permitindo alternar entre todas
 *            as placas cadastradas no seu perfil ou consultar todas juntas.
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
  dataOp: string; // Data de Operação / Entrega
  dataVencimento?: string;
  dataPagamento?: string; // Data em que o financeiro deu baixa/pagou
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
  // Lista de placas do motorista e placa selecionada no momento
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

  // 1. Função para carregar as minutas conectando ao backend MongoDB via API
  const carregarMinutasDoMotorista = useCallback(async (placaBusca: string) => {
    if (!placaBusca || placaBusca.trim() === '') {
      setMensagemStatus('⚠️️ Nenhuma placa selecionada para consulta.');
      return;
    }

    setCarregando(true);
    setMensagemStatus(`⏳ A consultar fretes para o veículo ${placaBusca}...`);

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const resposta = await fetch(`${apiUrl}/importacao/minhas-minutas?placa=${encodeURIComponent(placaBusca.trim())}`);
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
      console.error('Erro na conexão com a API:', erro);
      setMensagemStatus('❌ Falha ao conectar ao servidor backend (Porta 3001).');
    } finally {
      setCarregando(false);
    }
  }, []);

  // 2. Leitura inicial da sessão local (localStorage) para buscar todas as placas salvas
  useEffect(() => {
    const dadosSalvos = localStorage.getItem('motorista') || localStorage.getItem('usuario') || localStorage.getItem('user');
    let listaPlacasMotorista: string[] = [];

    if (dadosSalvos) {
      try {
        const obj = JSON.parse(dadosSalvos);
        
        // Trata o array de placas ou campo único de placa
        if (Array.isArray(obj.placas) && obj.placas.length > 0) {
          listaPlacasMotorista = obj.placas.map((p: string) => String(p).trim().toUpperCase());
        } else if (obj.placa || obj.cavalo) {
          listaPlacasMotorista = [String(obj.placa || obj.cavalo).trim().toUpperCase()];
        }
      } catch (e) {
        console.warn('Falha ao ler dados da sessão local.');
      }
    }

    // Remove duplicados e entradas vazias
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

  // 3. Handler acionado ao trocar de placa no select
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

  // Filtra as minutas pela aba de status
  const minutasFiltradas = minutas.filter((item) => {
    if (abaAtiva === 'PENDENTE') return item.statusPagamento === 'PENDENTE';
    if (abaAtiva === 'PAGO') return item.statusPagamento === 'PAGO';
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', color: '#0f172a' }}>
      
      {/* Sidebar / Navbar */}
      <Navbar />

      <main style={{ marginLeft: '250px', flex: 1, padding: '2rem 3rem' }}>
        
        {/* CABEÇALHO COM SELETOR DE TODAS AS PLACAS DO MOTORISTA */}
        <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              🚚 Minhas Minutas de Transporte
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: '500' }}>
              Consulte os fretes e o status de pagamento dos seus veículos
            </p>
          </div>

          {/* SELETOR DINÂMICO DAS PLACAS CADASTRADAS */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#475569' }}>Veículo:</span>
            
            {minhasPlacas.length > 0 ? (
              <select
                value={placaSelecionada}
                onChange={(e) => handleTrocarPlaca(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #94a3b8',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {minhasPlacas.map((p, idx) => (
                  <option key={idx} value={p}>
                    🚚 Placa: {p}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={placaSelecionada}
                onChange={(e) => setPlacaSelecionada(e.target.value.toUpperCase())}
                placeholder="Digite a placa"
                style={{ width: '120px', padding: '0.35rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '800', textAlign: 'center' }}
              />
            )}

            <button
              onClick={() => carregarMinutasDoMotorista(placaSelecionada)}
              disabled={carregando}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {carregando ? '⏳' : '🔍 Atualizar'}
            </button>
          </div>
        </header>

        {/* MENSAGEM DE STATUS */}
        {mensagemStatus && (
          <div style={{
            padding: '0.85rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
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

        {/* CARDS DE RESUMO FINANCEIRO */}
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

        {/* TABELA DE MINUTAS */}
        <section style={estilos.cardBoxTabela}>
          <div style={{ overflowX: 'auto' }}>
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
                      Nenhuma minuta encontrada na base para a placa selecionada.
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

const estilos: { [key: string]: React.CSSProperties } = {
  gridTotais: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' },
  cardKpi: { backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' },
  tituloKpi: { fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  valorKpi: { margin: '0.4rem 0', fontSize: '1.5rem', fontWeight: '800' },
  containerAbas: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  botaoAba: { padding: '0.6rem 1.2rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem' },
  botaoAbaAtivo: { backgroundColor: '#2563eb', color: '#ffffff' },
  cardBoxTabela: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' },
  tabela: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  th: { padding: '0.85rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase' },
  td: { padding: '0.85rem 1rem', color: '#1e293b' },
};