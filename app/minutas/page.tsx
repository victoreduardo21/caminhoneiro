'use client';

/**
 * ============================================================================
 * TELA: MINUTAS DO CAMINHONEIRO (SISTEMA DOS CAMINHONEIROS)
 * Localização no Projeto: caminhoneiro/app/minutas/page.tsx
 * Rota no Navegador: http://localhost:3000/minutas
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
  tipoPgto: string;
  valorBruto: number;
  valorRpa: number;
  descontoAdicionalAplicado?: number;
  valorLiquidoFinal: number;
  valorFinalPago?: number;
  statusPagamento: 'PENDENTE' | 'PAGO';
}

export default function MinutasCaminhoneiroPage() {
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

  // Busca as minutas conectando diretamente ao banco MongoDB Atlas via API
  const carregarMinutasDoMotorista = useCallback(async (placaBusca: string) => {
    if (!placaBusca || placaBusca.trim() === '') {
      setMensagemStatus('⚠️ Informe uma placa válida para consultar as minutas na base de dados.');
      return;
    }

    setCarregando(true);
    setMensagemStatus(`⏳ A consultar base de dados para o veículo ${placaBusca}...`);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    try {
      const resposta = await fetch(`${apiUrl}/importacao/minhas-minutas?placa=${encodeURIComponent(placaBusca.trim())}`);
      const resultado = await resposta.json();

      if (resposta.ok && resultado.sucesso) {
        setMinutas(resultado.dados);
        setResumo(resultado.resumo);
        if (resultado.dados.length === 0) {
          setMensagemStatus(`ℹ️ Nenhuma minuta registrada na base para a placa ${placaBusca}.`);
        } else {
          setMensagemStatus(`✅ ${resultado.dados.length} viagem(ns) encontrada(s) no banco de dados para a placa ${placaBusca}.`);
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

  useEffect(() => {
    // Tenta obter a placa salva na sessão do banco
    const dadosSalvos = localStorage.getItem('motorista');
    let placaInicial = '';

    if (dadosSalvos) {
      try {
        const obj = JSON.parse(dadosSalvos);
        if (obj.placas && obj.placas.length > 0) {
          placaInicial = obj.placas[0];
        } else if (obj.placa || obj.cavalo) {
          placaInicial = obj.placa || obj.cavalo;
        }
      } catch (e) {
        console.warn('Falha ao ler dados da sessão');
      }
    }

    if (placaInicial) {
      setPlacaSelecionada(placaInicial);
      carregarMinutasDoMotorista(placaInicial);
    } else {
      setMensagemStatus('ℹ️ Digite a placa do teu veículo para visualizar os teus fretes.');
    }
  }, [carregarMinutasDoMotorista]);

  const formatarMoeda = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const minutasFiltradas = minutas.filter((item) => {
    if (abaAtiva === 'PENDENTE') return item.statusPagamento === 'PENDENTE';
    if (abaAtiva === 'PAGO') return item.statusPagamento === 'PAGO';
    return true;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex' }}>
      
      {/* Componente Navbar (Sidebar) */}
      <Navbar />

      <main style={{ marginLeft: '250px', flex: 1, padding: '2rem 3rem' }}>
        
        {/* CABEÇALHO */}
        <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              🚚 Minhas Minutas de Transporte
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              Consulta em tempo real na base de dados dos teus fretes e valores
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Placa:</span>
            <input
              type="text"
              value={placaSelecionada}
              onChange={(e) => setPlacaSelecionada(e.target.value.toUpperCase())}
              placeholder="Digite a placa"
              style={{ width: '110px', padding: '0.35rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '800', textAlign: 'center', fontSize: '0.9rem' }}
            />
            <button
              onClick={() => carregarMinutasDoMotorista(placaSelecionada)}
              disabled={carregando}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.4rem 0.85rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🔍 Consultar Banco
            </button>
          </div>
        </header>

        {/* MENSAGEM DE STATUS */}
        {mensagemStatus && (
          <div style={{
            padding: '0.85rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
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
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Bruto: {formatarMoeda(resumo.totalBruto)} | RPA (2,7%): -{formatarMoeda(resumo.totalRpa)}
            </span>
          </div>

          <div style={estilos.cardKpi}>
            <span style={estilos.tituloKpi}>FRETES PENDENTES</span>
            <p style={{ ...estilos.valorKpi, color: '#d97706' }}>
              {resumo.qtdPendentes}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Aguardando pagamento</span>
          </div>

          <div style={estilos.cardKpi}>
            <span style={estilos.tituloKpi}>FRETES PAGOS</span>
            <p style={{ ...estilos.valorKpi, color: '#2563eb' }}>
              {resumo.qtdPagas}
            </p>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Pagamentos baixados</span>
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

        {/* TABELA DE FRETES DA BASE DE DADOS */}
        <section style={estilos.cardBoxTabela}>
          <div style={{ overflowX: 'auto' }}>
            <table style={estilos.tabela}>
              <thead>
                <tr>
                  <th style={estilos.th}>REF / Contêiner</th>
                  <th style={estilos.th}>Origem ➔ Destino</th>
                  <th style={estilos.th}>Tipo PGTO</th>
                  <th style={estilos.th}>Valor Bruto</th>
                  <th style={estilos.th}>RPA (2,7%)</th>
                  <th style={estilos.th}>Desconto Add.</th>
                  <th style={estilos.th}>Valor Líquido</th>
                  <th style={estilos.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {minutasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      Nenhuma minuta encontrada na base de dados para o filtro selecionado.
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
                        <td style={estilos.td}>
                          {m.terminalOrigem} ➔ {m.terminalDestino}
                        </td>
                        <td style={estilos.td}>{m.tipoPgto}</td>
                        <td style={{ ...estilos.td, fontWeight: '700', color: '#0f172a' }}>
                          {formatarMoeda(vBruto)}
                        </td>
                        <td style={{ ...estilos.td, color: '#dc2626' }}>
                          - {formatarMoeda(vRpa)}
                        </td>
                        <td style={{ ...estilos.td, color: '#d97706' }}>
                          {descAdd > 0 ? `- ${formatarMoeda(descAdd)}` : '-'}
                        </td>
                        <td style={{ ...estilos.td, fontWeight: '800', color: '#16a34a' }}>
                          {formatarMoeda(vLiquido)}
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
  cardKpi: { backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0' },
  tituloKpi: { fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  valorKpi: { margin: '0.4rem 0', fontSize: '1.5rem', fontWeight: '800' },
  containerAbas: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  botaoAba: { padding: '0.6rem 1.2rem', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
  botaoAbaAtivo: { backgroundColor: '#2563eb', color: '#ffffff' },
  cardBoxTabela: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  tabela: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' },
  th: { padding: '0.85rem 1rem', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase' },
  td: { padding: '0.85rem 1rem', color: '#1e293b' },
};