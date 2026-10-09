'use client';

/**
 * ============================================================================
 * TELA: CONFIGURAÇÕES E FROTA DO MOTORISTA (INTEGRADA AO MONGODB ATLAS)
 * Localização no VS Code: motorista/app/configuracoes/page.tsx
 * Tecnologias: Next.js (React / TypeScript), API Express, MongoDB Atlas
 * Descrição: Carrega os dados reais e as placas registradas na coleção
 *            'caminhoneiros' consumindo os endpoints do servidor Express.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';

interface MotoristaSessao {
  id?: string;
  nome: string;
  cpf?: string;
  placa?: string;
  placas?: string[];
  pix?: string;
  whatsapp?: string;
}

export default function ConfiguracoesMotoristaPage() {
  const router = useRouter();

  // Estados dos dados e placas do motorista
  const [motoristaLogado, setMotoristaLogado] = useState<MotoristaSessao | null>(null);
  const [listaPlacas, setListaPlacas] = useState<string[]>([]);

  // Estados do Modal para adição de novos veículos
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novaPlacaInput, setNovaPlacaInput] = useState('');
  const [pixInput, setPixInput] = useState('');
  const [contatoInput, setContatoInput] = useState('');

  // Estados de controlo de carregamento e mensagens de status
  const [carregando, setCarregando] = useState(false);
  const [carregandoBanco, setCarregandoBanco] = useState(true);
  const [mensagemStatus, setMensagemStatus] = useState('');

  // URL da API backend (utiliza a variável do Vercel/Render ou localhost)
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // 1. Efeito para buscar os dados em tempo real no MongoDB Atlas ao abrir a página
  useEffect(() => {
    const carregarDadosDoBanco = async () => {
      const dadosSalvos = localStorage.getItem('motorista') || localStorage.getItem('usuario') || localStorage.getItem('user');

      if (!dadosSalvos) {
        router.push('/');
        return;
      }

      try {
        const objSessao: MotoristaSessao = JSON.parse(dadosSalvos);
        setMotoristaLogado(objSessao);

        // Chamada à API Express na rota GET /caminhoneiros
        const resposta = await fetch(`${apiUrl}/caminhoneiros`);
        const dadosApi = await resposta.json();

        if (resposta.ok && dadosApi.sucesso && Array.isArray(dadosApi.dados)) {
          // Localiza o motorista logado comparando o CPF cadastrado no banco
          const cpfSessaoLimpo = String(objSessao.cpf || '').replace(/\D/g, '');
          const motoristaBanco = dadosApi.dados.find(
            (c: any) => String(c.cpf || '').replace(/\D/g, '') === cpfSessaoLimpo
          );

          if (motoristaBanco) {
            // Extrai a lista de placas salvas na coleção 'caminhoneiros'
            const placasDoBanco = Array.isArray(motoristaBanco.placas) && motoristaBanco.placas.length > 0
              ? motoristaBanco.placas
              : motoristaBanco.placa ? [motoristaBanco.placa] : [];

            setListaPlacas(placasDoBanco.filter(Boolean));

            // Atualiza os dados locais com as informações oficiais do banco de dados
            const motoristaAtualizado: MotoristaSessao = {
              ...objSessao,
              nome: motoristaBanco.nome || objSessao.nome,
              placas: placasDoBanco,
              pix: motoristaBanco.pix || objSessao.pix,
            };

            setMotoristaLogado(motoristaAtualizado);
            localStorage.setItem('motorista', JSON.stringify(motoristaAtualizado));
          } else {
            // Fallback caso o CPF ainda não tenha sido encontrado
            const placasIniciais = Array.isArray(objSessao.placas) && objSessao.placas.length > 0
              ? objSessao.placas
              : objSessao.placa ? [objSessao.placa] : [];

            setListaPlacas(placasIniciais.filter(Boolean));
          }
        }
      } catch (erro) {
        console.error('⚠️ Erro ao consultar o banco de dados:', erro);
      } finally {
        setCarregandoBanco(false);
      }
    };

    carregarDadosDoBanco();
  }, [router, apiUrl]);

  // 2. Envia uma nova placa para ser gravada diretamente no MongoDB Atlas
  const handleCadastrarNovaPlaca = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaPlacaInput.trim()) {
      setMensagemStatus('⚠️ Por favor, informe a placa do veículo.');
      return;
    }

    setCarregando(true);
    setMensagemStatus('⏳ A registar nova placa no banco de dados...');

    try {
      const resposta = await fetch(`${apiUrl}/caminhoneiros/adicionar-placa`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: motoristaLogado?.cpf,
          novaPlaca: novaPlacaInput.trim().toUpperCase(),
          pix: pixInput.trim(),
          contato: contatoInput.trim(),
        }),
      });

      const textoResposta = await resposta.text();

      if (textoResposta.trim().startsWith('<')) {
        throw new Error('A rota do servidor (/caminhoneiros/adicionar-placa) não foi encontrada.');
      }

      const resultado = JSON.parse(textoResposta);

      if (resposta.ok && resultado.sucesso) {
        const novasPlacasAtualizadas = resultado.placas || [...listaPlacas, novaPlacaInput.trim().toUpperCase()];
        setListaPlacas(novasPlacasAtualizadas);

        const motoristaAtualizado = {
          ...motoristaLogado,
          nome: motoristaLogado?.nome || 'Motorista',
          placas: novasPlacasAtualizadas,
          pix: pixInput.trim() || motoristaLogado?.pix,
        };

        localStorage.setItem('motorista', JSON.stringify(motoristaAtualizado));
        setMotoristaLogado(motoristaAtualizado);

        setMensagemStatus(`✅ Placa ${novaPlacaInput.toUpperCase()} gravada no MongoDB com sucesso!`);
        setNovaPlacaInput('');
        setPixInput('');
        setContatoInput('');
        setMostrarModal(false);
      } else {
        setMensagemStatus(`❌ ${resultado.mensagem || 'Erro ao registar a placa.'}`);
      }
    } catch (erro: any) {
      setMensagemStatus(`❌ ${erro.message || 'Erro de ligação ao servidor.'}`);
    } finally {
      setCarregando(false);
    }
  };

  if (carregandoBanco) {
    return (
      <div style={estilos.carregandoContainer}>
        <p>⏳ A carregar veículos registados no banco de dados...</p>
      </div>
    );
  }

  if (!motoristaLogado) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', color: '#0f172a' }}>
      
      {/* COMPONENTE NAVBAR (Sem enviar props para evitar erro no build do TypeScript) */}
      <Navbar />

      {/* CONTEÚDO DA PÁGINA */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem 3rem' }}>
        
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              ⚙️ Configurações & Frota
            </h1>
            <p style={{ color: '#475569', margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: '500' }}>
              Consulte e gira os veículos vinculados ao seu CPF ({motoristaLogado.cpf || 'Não informado'})
            </p>
          </div>

          <button
            onClick={() => setMostrarModal(true)}
            style={estilos.botaoAdicionar}
          >
            ➕ Cadastrar Nova Placa
          </button>
        </header>

        {mensagemStatus && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '0.85rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '700',
            textAlign: 'center',
            backgroundColor: mensagemStatus.includes('❌') ? '#fef2f2' : '#f0fdf4',
            color: mensagemStatus.includes('❌') ? '#991b1b' : '#166534',
            border: '1px solid',
            borderColor: mensagemStatus.includes('❌') ? '#fecaca' : '#bbf7d0',
          }}>
            {mensagemStatus}
          </div>
        )}

        {/* EXIBIÇÃO DAS PLACAS CONSULTADAS DO MONGODB ATLAS */}
        <section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '900px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            🚚 Veículos no Banco de Dados ({listaPlacas.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {listaPlacas.length > 0 ? (
              listaPlacas.map((placaItem, index) => (
                <div key={index} style={estilos.cartaoPlaca}>
                  <div style={estilos.cabecalhoPlaca}>BRASIL</div>
                  <div style={estilos.textoPlaca}>{placaItem}</div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nenhum veículo encontrado para este CPF no banco de dados.</p>
            )}
          </div>
        </section>

        {/* MODAL PARA VINCULAR NOVO VEÍCULO */}
        {mostrarModal && (
          <div style={estilos.overlayModal}>
            <div style={estilos.conteudoModal}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  🚚 Cadastrar Nova Placa
                </h3>
                <button onClick={() => setMostrarModal(false)} style={estilos.botaoFecharModal}>
                  ✖
                </button>
              </div>

              <form onSubmit={handleCadastrarNovaPlaca} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={estilos.label}>Placa do Veículo *</label>
                  <input
                    type="text"
                    value={novaPlacaInput}
                    onChange={(e) => setNovaPlacaInput(e.target.value.toUpperCase())}
                    placeholder="Ex: XYZ9876"
                    required
                    style={{ ...estilos.input, textTransform: 'uppercase', fontWeight: '800' }}
                  />
                </div>

                <div>
                  <label style={estilos.label}>Chave Pix para Recebimento (Opcional)</label>
                  <input
                    type="text"
                    value={pixInput}
                    onChange={(e) => setPixInput(e.target.value)}
                    placeholder="E-mail, Telefone, CPF ou Chave Aleatória"
                    style={estilos.input}
                  />
                </div>

                <div>
                  <label style={estilos.label}>Telefone / Contacto do Veículo (Opcional)</label>
                  <input
                    type="tel"
                    value={contatoInput}
                    onChange={(e) => setContatoInput(e.target.value)}
                    placeholder="(00) 00000-0000"
                    style={estilos.input}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    style={estilos.botaoCancelarModal}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={carregando}
                    style={estilos.botaoConfirmarModal}
                  >
                    {carregando ? '⏳ A gravar...' : '✅ Confirmar e Salvar'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// Estilos padronizados
const estilos: { [key: string]: React.CSSProperties } = {
  carregandoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontWeight: 'bold',
  },
  label: {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: '0.4rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #94a3b8',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '0.95rem',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
  },
  botaoAdicionar: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '800',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cartaoPlaca: {
    border: '2px solid #000000',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  cabecalhoPlaca: {
    backgroundColor: '#003399',
    color: '#ffffff',
    fontSize: '0.65rem',
    fontWeight: '800',
    padding: '0.2rem 0',
  },
  textoPlaca: {
    fontSize: '1.6rem',
    fontWeight: '900',
    color: '#000000',
    padding: '0.4rem 0',
    letterSpacing: '2px',
  },
  overlayModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  conteudoModal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  },
  botaoFecharModal: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  botaoCancelarModal: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontWeight: '700',
    cursor: 'pointer',
  },
  botaoConfirmarModal: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontWeight: '800',
    cursor: 'pointer',
  },
};