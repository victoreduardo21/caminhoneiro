'use client';

/**
 * ============================================================================
 * TELA: MINUTAS DO CAMINHONEIRO (CARDS COM VALOR BRUTO PRIMEIRO E LÍQUIDO A RECEBER)
 * Localização no Projeto: caminhoneiro/app/minutas/page.tsx
 * Rota no Navegador: /minutas
 * Tecnologias: Next.js (App Router), React, TypeScript, jsPDF
 * Descrição: Exibe nos cards de topo o Valor Bruto primeiro, seguido pelo
 *            Líquido a Receber / Líquido Já Recebido.
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MinutaMotorista {
  _id: string;
  ref: string;
  conteiner: string;
  terminalOrigem: string;
  terminalDestino: string;
  dataOp: string;
  dataVencimento?: string;
  dataPagamento?: string;
  dataPagamentoRealizado?: string;
  tipoPgto: string;
  valorBruto: number;
  valorRpa: number;
  descontoDiesel?: number;
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
    totalLiquidoPendente: 0,
    totalBrutoPendente: 0,
    totalDieselPendente: 0,
    totalLiquidoPago: 0,
    totalBrutoPago: 0,
    totalDieselPago: 0,
    qtdPendentes: 0,
    qtdPagas: 0,
    totalMinutas: 0,
  });

  /**
   * RESOLUÇÃO DINÂMICA DA URL DA API
   */
  const obterUrlApi = useCallback(() => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3001`;
      }
    }

    return 'http://localhost:3001';
  }, []);

  /**
   * CÁLCULO DO RESUMO FINANCEIRO DOS CARDS
   */
  const calcularResumoFinanceiro = (lista: MinutaMotorista[]) => {
    let liqPendente = 0, brtPendente = 0, dslPendente = 0, qPendente = 0;
    let liqPago = 0, brtPago = 0, dslPago = 0, qPago = 0;

    lista.forEach((m) => {
      const vBruto = Number(m.valorBruto || 0);
      const vRpa = m.valorRpa !== undefined ? Number(m.valorRpa) : (vBruto * 0.027);
      const vDiesel = Number(m.descontoDiesel || 0);
      
      const vLiquido = m.statusPagamento === 'PAGO'
        ? Number(m.valorFinalPago || m.valorLiquidoFinal || (vBruto - vRpa - vDiesel))
        : Number(m.valorLiquidoFinal || (vBruto - vRpa - vDiesel));

      if (m.statusPagamento === 'PAGO') {
        liqPago += vLiquido;
        brtPago += vBruto;
        dslPago += vDiesel;
        qPago++;
      } else {
        liqPendente += vLiquido;
        brtPendente += vBruto;
        dslPendente += vDiesel;
        qPendente++;
      }
    });

    setResumo({
      totalLiquidoPendente: liqPendente,
      totalBrutoPendente: brtPendente,
      totalDieselPendente: dslPendente,
      totalLiquidoPago: liqPago,
      totalBrutoPago: brtPago,
      totalDieselPago: dslPago,
      qtdPendentes: qPendente,
      qtdPagas: qPago,
      totalMinutas: lista.length,
    });
  };

  /**
   * BUSCA DAS MINUTAS NO BACKEND
   */
  const carregarMinutasDoMotorista = useCallback(async (placaBusca: string) => {
    if (!placaBusca || placaBusca.trim() === '') {
      setMensagemStatus('⚠️ Nenhuma placa selecionada para consulta.');
      return;
    }

    setCarregando(true);
    setMensagemStatus(`⏳ A consultar fretes para o veículo ${placaBusca}...`);

    try {
      const baseUrl = obterUrlApi();
      const endpoint = `${baseUrl}/importacao/minhas-minutas?placa=${encodeURIComponent(placaBusca.trim())}`;

      const resposta = await fetch(endpoint);
      const contentType = resposta.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`A API não retornou um JSON válido. Verifique se o backend está a rodar na porta 3001.`);
      }

      const resultado = await resposta.json();

      if (resposta.ok && resultado.sucesso) {
        const dadosMinutas: MinutaMotorista[] = resultado.dados || [];
        setMinutas(dadosMinutas);
        calcularResumoFinanceiro(dadosMinutas);

        if (dadosMinutas.length === 0) {
          setMensagemStatus(`ℹ️ Nenhuma minuta encontrada para a placa ${placaBusca}.`);
        } else {
          setMensagemStatus(`✅ ${dadosMinutas.length} viagem(ns) encontrada(s) para a placa ${placaBusca}.`);
        }
      } else {
        setMensagemStatus(`⚠️ ${resultado.mensagem || 'Erro ao consultar a base de dados.'}`);
      }
    } catch (erro: any) {
      console.error('❌ Erro na conexão com a API:', erro.message);
      setMinutas([]);
      calcularResumoFinanceiro([]);

      if (erro.message && erro.message.includes('Failed to fetch')) {
        setMensagemStatus(`❌ Não foi possível conectar ao servidor backend. Verifique se a API está ligada.`);
      } else {
        setMensagemStatus(`❌ ${erro.message || 'Erro ao conectar à API.'}`);
      }
    } finally {
      setCarregando(false);
    }
  }, [obterUrlApi]);

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
    if (typeof dataTexto === 'string' && dataTexto.includes('/')) return dataTexto;

    try {
      const partes = String(dataTexto).split('T')[0].split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      const d = new Date(dataTexto);
      return isNaN(d.getTime()) ? dataTexto : d.toLocaleDateString('pt-BR');
    } catch {
      return dataTexto;
    }
  };

  const minutasFiltradas = minutas.filter((item) => {
    if (abaAtiva === 'PENDENTE') return item.statusPagamento === 'PENDENTE';
    if (abaAtiva === 'PAGO') return item.statusPagamento === 'PAGO';
    return true;
  });

  /**
   * RELATÓRIO PDF COM VALOR BRUTO E DESCONTO DE DIESEL INCLUÍDOS
   */
  const handleBaixarPDF = () => {
    try {
      const doc = new jsPDF();

      // Cabeçalho
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('PORTAL DO MOTORISTA - LOGÍSTICA', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Relatório de Extrato de Fretes - Veículo: ${placaSelecionada}`, 14, 25);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`, 14, 31);

      // Caixa de Resumo Financeiro no PDF
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 36, 182, 24, 'F');

      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9);
      doc.text(`TOTAL A RECEBER: Bruto: ${formatarMoeda(resumo.totalBrutoPendente)} | Líquido a Receber: ${formatarMoeda(resumo.totalLiquidoPendente)} (${resumo.qtdPendentes} pendentes)`, 18, 44);

      doc.setTextColor(22, 101, 52);
      doc.text(`TOTAL JÁ RECEBIDO: Bruto: ${formatarMoeda(resumo.totalBrutoPago)} | Líquido Já Recebido: ${formatarMoeda(resumo.totalLiquidoPago)} (${resumo.qtdPagas} pagas)`, 18, 52);

      // Dados Mapeados com Bruto e Diesel
      const dadosTabelaPDF = minutasFiltradas.map((m) => {
        const vBruto = Number(m.valorBruto || 0);
        const vRpa = m.valorRpa !== undefined ? Number(m.valorRpa) : (vBruto * 0.027);
        const vDiesel = Number(m.descontoDiesel || 0);

        const vLiquido = m.statusPagamento === 'PAGO'
          ? Number(m.valorFinalPago || m.valorLiquidoFinal || (vBruto - vRpa - vDiesel))
          : Number(m.valorLiquidoFinal || (vBruto - vRpa - vDiesel));

        const dataDoPagamento = m.dataPagamentoRealizado || m.dataPagamento;

        return [
          m.ref || 'N/D',
          m.conteiner || 'N/D',
          formatarData(m.dataOp),
          `${m.terminalOrigem} -> ${m.terminalDestino}`,
          formatarMoeda(vBruto),
          vDiesel > 0 ? `- ${formatarMoeda(vDiesel)}` : 'R$ 0,00',
          formatarMoeda(vLiquido),
          m.statusPagamento === 'PAGO' ? formatarData(dataDoPagamento) : 'Aguardando',
          m.statusPagamento === 'PAGO' ? 'PAGO' : 'PENDENTE'
        ];
      });

      // Tabela PDF com colunas reorganizadas
      autoTable(doc, {
        startY: 66,
        head: [['REF', 'Contêiner', 'Data Op.', 'Rota', 'Valor Bruto', 'Desc. Diesel', 'Valor Liq.', 'Data PGTO', 'Status']],
        body: dadosTabelaPDF,
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 2.5 },
      });

      doc.save(`Extrato_Fretes_${placaSelecionada}_${new Date().toISOString().split('T')[0]}.pdf`);

      setMensagemStatus('🎉 Relatório PDF transferido com sucesso!');
      setTimeout(() => setMensagemStatus(''), 4000);
    } catch (e) {
      console.error('❌ Erro ao gerar PDF:', e);
      setMensagemStatus('❌ Erro ao gerar o ficheiro PDF.');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#f8fafc', color: '#0f172a', overflowX: 'hidden' }}>
      
      <style jsx global>{`
        .area-conteudo-pagina {
          padding: 1.25rem;
          box-sizing: border-box;
          transition: margin-left 0.2s ease, width 0.2s ease;
        }

        @media (min-width: 769px) {
          .area-conteudo-pagina {
            margin-left: 260px !important;
            width: calc(100% - 260px) !important;
            max-width: calc(100% - 260px) !important;
          }
        }

        @media (max-width: 768px) {
          .area-conteudo-pagina {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 1rem !important;
          }
        }
      `}</style>

      <Navbar />

      <main className="area-conteudo-pagina">
        <header style={estilos.headerFlex}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              🚚 Minhas Minutas
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.85rem', fontWeight: '500' }}>
              Consulte os fretes, descontos de combustível e pagamentos
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleBaixarPDF} style={estilos.botaoPdf}>
              📄 Baixar Extrato PDF
            </button>

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
          </div>
        </header>

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

        {/* CARDS REORGANIZADOS: VALOR BRUTO EM PRIMEIRA COLUNA E LÍQUIDO A RECEBER À DIREITA */}
        <section style={estilos.gridTotais}>
          
          {/* CARD 1: PENDENTES (A RECEBER) */}
          <div style={estilos.cardKpiPendente}>
            <span style={estilos.tituloKpiPendente}>⏳ TOTAL A RECEBER (PENDENTES)</span>
            
            <div style={estilos.caixaValoresKpi}>
              <div>
                <span style={estilos.labelSubValor}>BRUTO:</span>
                <p style={{ ...estilos.valorKpiSecundario, color: '#b45309' }}>
                  {formatarMoeda(resumo.totalBrutoPendente)}
                </p>
              </div>

              <div style={estilos.divisorValoresKpi} />

              <div>
                <span style={estilos.labelSubValor}>LÍQUIDO A RECEBER:</span>
                <p style={{ ...estilos.valorKpi, color: '#d97706' }}>
                  {formatarMoeda(resumo.totalLiquidoPendente)}
                </p>
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', color: '#78350f', fontWeight: '600', marginTop: '0.35rem', display: 'block' }}>
              {resumo.qtdPendentes} viagem(ns) aguardando pagamento
            </span>
          </div>

          {/* CARD 2: PAGOS (JÁ RECEBIDO) */}
          <div style={estilos.cardKpiPago}>
            <span style={estilos.tituloKpiPago}>✅ TOTAL JÁ RECEBIDO (PAGOS)</span>
            
            <div style={estilos.caixaValoresKpi}>
              <div>
                <span style={estilos.labelSubValor}>BRUTO:</span>
                <p style={{ ...estilos.valorKpiSecundario, color: '#15803d' }}>
                  {formatarMoeda(resumo.totalBrutoPago)}
                </p>
              </div>

              <div style={estilos.divisorValoresKpi} />

              <div>
                <span style={estilos.labelSubValor}>LÍQUIDO JÁ RECEBIDO:</span>
                <p style={{ ...estilos.valorKpi, color: '#16a34a' }}>
                  {formatarMoeda(resumo.totalLiquidoPago)}
                </p>
              </div>
            </div>

            <span style={{ fontSize: '0.75rem', color: '#14532d', fontWeight: '600', marginTop: '0.35rem', display: 'block' }}>
              {resumo.qtdPagas} pagamento(s) efetuado(s)
            </span>
          </div>

          {/* CARD 3: TOTAL DE VIAGENS */}
          <div style={estilos.cardKpi}>
            <span style={estilos.tituloKpi}>🚚 TOTAL DE VIAGENS</span>
            <p style={{ ...estilos.valorKpi, color: '#2563eb', margin: '0.5rem 0' }}>
              {resumo.totalMinutas}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
              Pendentes: {resumo.qtdPendentes} | Pagas: {resumo.qtdPagas}
            </span>
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
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={estilos.tabela}>
              <thead>
                <tr>
                  <th style={estilos.th}>REF / Contêiner</th>
                  <th style={estilos.th}>Data Entrega/Op.</th>
                  <th style={estilos.th}>Origem ➔ Destino</th>
                  <th style={estilos.th}>Tipo PGTO</th>
                  <th style={estilos.th}>Valor Bruto</th>
                  <th style={estilos.th}>Desc. Diesel</th>
                  <th style={estilos.th}>Valor Líquido</th>
                  <th style={estilos.th}>Data PGTO</th>
                  <th style={estilos.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {minutasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontWeight: '600' }}>
                      Nenhuma minuta encontrada para a placa selecionada.
                    </td>
                  </tr>
                ) : (
                  minutasFiltradas.map((m) => {
                    const vBruto = Number(m.valorBruto || 0);
                    const vRpa = m.valorRpa !== undefined ? Number(m.valorRpa) : (vBruto * 0.027);
                    const vDiesel = Number(m.descontoDiesel || 0);

                    const vLiquido = m.statusPagamento === 'PAGO'
                      ? Number(m.valorFinalPago || m.valorLiquidoFinal || (vBruto - vRpa - vDiesel))
                      : Number(m.valorLiquidoFinal || (vBruto - vRpa - vDiesel));

                    const dataDoPagamento = m.dataPagamentoRealizado || m.dataPagamento;

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
                        
                        <td style={{ ...estilos.td, fontWeight: '700', color: '#334155' }}>
                          {formatarMoeda(vBruto)}
                        </td>

                        <td style={{ ...estilos.td, fontWeight: '700', color: vDiesel > 0 ? '#dc2626' : '#94a3b8' }}>
                          {vDiesel > 0 ? `- ${formatarMoeda(vDiesel)}` : 'R$ 0,00'}
                        </td>

                        <td style={{ ...estilos.td, fontWeight: '800', color: m.statusPagamento === 'PAGO' ? '#16a34a' : '#d97706' }}>
                          {formatarMoeda(vLiquido)}
                        </td>
                        
                        <td style={{ ...estilos.td, fontWeight: '700', color: m.statusPagamento === 'PAGO' ? '#16a34a' : '#64748b' }}>
                          {m.statusPagamento === 'PAGO' ? `✅ ${formatarData(dataDoPagamento)}` : '⏳ Aguardando'}
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
  },
  selectPlaca: {
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
    minHeight: '40px',
    padding: '0.4rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontWeight: '800',
    textAlign: 'center',
    width: '100px',
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
  botaoPdf: {
    minHeight: '40px',
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '10px',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '0.85rem',
    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
  },
  gridTotais: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
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
  cardKpiPendente: { 
    backgroundColor: '#fffbeb', 
    padding: '1rem', 
    borderRadius: '12px', 
    border: '1px solid #fde68a', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)' 
  },
  cardKpiPago: { 
    backgroundColor: '#f0fdf4', 
    padding: '1rem', 
    borderRadius: '12px', 
    border: '1px solid #bbf7d0', 
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)' 
  },
  tituloKpi: { fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  tituloKpiPendente: { fontSize: '0.75rem', fontWeight: '800', color: '#b45309', textTransform: 'uppercase' },
  tituloKpiPago: { fontSize: '0.75rem', fontWeight: '800', color: '#166534', textTransform: 'uppercase' },
  
  caixaValoresKpi: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    margin: '0.35rem 0',
  },
  divisorValoresKpi: {
    width: '1px',
    height: '28px',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  labelSubValor: {
    fontSize: '0.65rem',
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    display: 'block',
  },
  valorKpi: { margin: 0, fontSize: '1.25rem', fontWeight: '800' },
  valorKpiSecundario: { margin: 0, fontSize: '1.1rem', fontWeight: '800' },

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