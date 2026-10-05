'use client';

/**
 * ============================================================================
 * TELA: CONFIGURAÇÕES DO MOTORISTA (INTEGRADA COM MONGODB ATLAS)
 * Localização no VS Code: motorista/app/configuracoes/page.tsx
 * Tecnologias: Next.js (React / TypeScript), Node.js (API Express)
 * Descrição: Carrega os dados reais dos caminhoneiros salvos no MongoDB
 *            e permite cadastrar novas placas via modal.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar, { MotoristaSessao } from '../components/Navbar';

export default function ConfiguracoesMotoristaPage() {
  const router = useRouter();

  // Estados principais da sessão local e banco
  const [motoristaLogado, setMotoristaLogado] = useState<MotoristaSessao | null>(null);
  const [listaPlacas, setListaPlacas] = useState<string[]>([]);

  // Estados do Modal de Cadastro de Nova Placa
  const [mostrarModal, setMostrarModal] = useState(false);
  const [novaPlacaInput, setNovaPlacaInput] = useState('');
  const [pixInput, setPixInput] = useState('');
  const [contatoInput, setContatoInput] = useState('');

  // Estados de feedback visual
  const [carregando, setCarregando] = useState(false);
  const [buscandoDadosBanco, setBuscandoDadosBanco] = useState(true);
  const [mensagemStatus, setMensagemStatus] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // 1. Carrega o motorista da sessão e sincroniza com os dados reais do MongoDB Atlas
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

        // Busca a lista atualizada de caminhoneiros no backend
        const resposta = await fetch(`${apiUrl}/caminhoneiros`);
        const dadosApi = await resposta.json();

        if (resposta.ok && dadosApi.sucesso && Array.isArray(dadosApi.dados)) {
          // Procura o motorista logado pelo CPF na coleção 'caminhoneiros'
          const cpfSessaoLimpo = String(objSessao.cpf || '').replace(/\D/g, '');
          const motoristaBanco = dadosApi.dados.find(
            (c: any) => String(c.cpf || '').replace(/\D/g, '') === cpfSessaoLimpo
          );

          if (motoristaBanco) {
            // Extrai as placas salvas no banco de dados
            const placasDoBanco = Array.isArray(motoristaBanco.placas) && motoristaBanco.placas.length > 0
              ? motoristaBanco.placas
              : motoristaBanco.placa ? [motoristaBanco.placa] : [];

            setListaPlacas(placasDoBanco.filter(Boolean));

            // Atualiza o estado da sessão local com os dados vindos do banco
            const motoristaAtualizado: MotoristaSessao = {
              ...objSessao,
              nome: motoristaBanco.nome || objSessao.nome,
              placas: placasDoBanco,
              pix: motoristaBanco.pix || objSessao.pix,
            };

            setMotoristaLogado(motoristaAtualizado);
            localStorage.setItem('motorista', JSON.stringify(motoristaAtualizado));
          } else {
            // Se não encontrou no banco, usa as placas guardadas na sessão
            const placasIniciais = Array.isArray(objSessao.placas) && objSessao.placas.length > 0
              ? objSessao.placas
              : objSessao.placa ? [objSessao.placa] : [];

            setListaPlacas(placasIniciais.filter(Boolean));
          }
        }
      } catch (erro) {
        console.error('⚠️ Erro ao consultar dados no backend:', erro);
      } finally {
        setBuscandoDadosBanco(false);
      }
    };

    carregarDadosDoBanco();
  }, [router, apiUrl]);

  // 2. Envia a nova placa para o backend (/caminhoneiros/adicionar-placa)
  const handleCadastrarNovaPlaca = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaPlacaInput.trim()) {
      setMensagemStatus('⚠️ Informe a placa do veículo.');
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

        setMensagemStatus(`✅ Placa ${novaPlacaInput.toUpperCase()} vinculada com sucesso no MongoDB!`);
        setNovaPlacaInput('');
        setPixInput('');
        setContatoInput('');
        setMostrarModal(false);
      } else {
        setMensagemStatus(`❌ ${resultado.mensagem || 'Erro ao cadastrar placa.'}`);
      }
    } catch (erro: any) {
      setMensagemStatus(`❌ ${erro.message || 'Erro ao conectar ao servidor.'}`);
    } finally {
      setCarregando(false);
    }
  };

  if (buscandoDadosBanco) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: 'bold' }}>
        <p>⏳ A carregar dados do caminhoneiro no banco de dados...</p>
      </div>
    );
  }

  if (!motoristaLogado) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', color: '#0f172a' }}>
      
      {/* NAVBAR PADRÃO (Com passagem de props tipada em TypeScript) */}
      <Navbar usuario={motoristaLogado} />

      {/* CONTEÚDO PRINCIPAL DA PÁGINA */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem 3rem' }}>
        
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              ⚙️ Configurações & Frota
            </h1>
            <p style={{ color: '#475569', margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: '500' }}>
              Gerencie seu perfil e consulte os veículos vinculados ao seu CPF ({motoristaLogado.cpf || 'Não informado'})
            </p>
          </div>

          <button
            onClick={() => setMostrarModal(true)}
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            ➕ Cadastrar Nova Placa
          </button>
        </header>

        {mensagemStatus && (
          <div style={{ marginBottom: '1.5rem', padding: '0.85rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '700', textAlign: 'center', backgroundColor: mensagemStatus.includes('❌') ? '#fef2f2' : '#f0fdf4', color: mensagemStatus.includes('❌') ? '#991b1b' : '#166534', border: '1px solid', borderColor: mensagemStatus.includes('❌') ? '#fecaca' : '#bbf7d0' }}>
            {mensagemStatus}
          </div>
        )}

        {/* LISTA DE PLACAS PUXADAS DIRETO DO MONGODB */}
        <section style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '900px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            🚚 Placas Cadastradas no Banco para {motoristaLogado.nome} ({listaPlacas.length})
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {listaPlacas.length > 0 ? (
              listaPlacas.map((placaItem, index) => (
                <div
                  key={index}
                  style={{
                    border: '2px solid #000000',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    textAlign: 'center',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ backgroundColor: '#003399', color: '#ffffff', fontSize: '0.65rem', fontWeight: '800', padding: '0.2rem 0' }}>
                    BRASIL
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#000000', padding: '0.4rem 0', letterSpacing: '2px' }}>
                    {placaItem}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Nenhuma placa cadastrada para este CPF no momento.</p>
            )}
          </div>
        </section>

        {/* MODAL DE CADASTRO DE NOVA PLACA */}
        {mostrarModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  🚚 Cadastrar Nova Placa
                </h3>
                <button
                  onClick={() => setMostrarModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
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
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={carregando}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '800', cursor: 'pointer' }}
                  >
                    {carregando ? '⏳ A salvar...' : '✅ Confirmar Placa'}
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

const estilos: { [key: string]: React.CSSProperties } = {
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
};