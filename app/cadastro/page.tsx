'use client';


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroCaminhoneiroPage() {
  const router = useRouter();

  // Estados dos campos de cadastro
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [contato, setContato] = useState('');
  const [pis, setPis] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [pix, setPix] = useState('');
  const [placasTexto, setPlacasTexto] = useState('');
  const [senha, setSenha] = useState('');

  const [carregando, setCarregando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState('');

  // LÊ ESTRITAMENTE A VARIÁVEL DE AMBIENTE DO SERVIDOR/HOSPEDAGEM
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  // Envio do formulário de registo para o backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!API_URL) {
      setMensagemStatus('❌ Variável de ambiente NEXT_PUBLIC_API_URL não configurada no servidor.');
      return;
    }

    if (!nome || !cpf || !senha || !placasTexto) {
      setMensagemStatus('⚠️ Preencha os campos obrigatórios (Nome, CPF, Placas e Senha).');
      return;
    }

    setCarregando(true);
    setMensagemStatus('⏳ A criar o seu registo no sistema...');

    // Limpa pontos e hífen do CPF para enviar apenas os dígitos
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Converte a string de placas separadas por vírgula num array de maiúsculas
    const listaPlacas = placasTexto
      .split(',')
      .map((p) => p.trim().toUpperCase())
      .filter((p) => p !== '');

    const payload = {
      nome: nome.trim(),
      cpf: cpfLimpo,
      whatsapp: whatsapp || contato,
      contato: contato || whatsapp,
      pis: pis.trim(),
      dataNascimento: dataNascimento.trim(),
      pix: pix.trim(),
      placas: listaPlacas,
      senha,
    };

    try {
      // Formata a URL removendo barras no final para evitar erros de endpoint
      const baseUrl = API_URL.replace(/\/$/, '');
      const endpoint = `${baseUrl}/caminhoneiros/registro`;

      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.sucesso) {
        throw new Error(resultado.mensagem || 'Erro ao realizar o registo.');
      }

      setMensagemStatus(`🎉 ${resultado.mensagem}`);

      // Redireciona para a Tela de Login Principal (/) após o cadastro
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (erro: any) {
      console.error('❌ Erro no registo:', erro);

      if (erro.message === 'Failed to fetch') {
        setMensagemStatus(`❌ Não foi possível conectar ao servidor (${API_URL}). Verifique sua conexão ou status do backend.`);
      } else {
        setMensagemStatus(`❌ ${erro.message}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={estilos.containerGeral}>
      
      {/* CARD PRINCIPAL ELEVADO */}
      <div style={estilos.cardElevado}>
        
        {/* CABEÇALHO DO CARD */}
        <div style={estilos.cabecalho}>
          <div style={estilos.badgePortal}>NOVO REGISTO • MOTORISTA</div>
          <h1 style={estilos.tituloModal}>Crie a sua Conta</h1>
          <p style={estilos.subtituloModal}>
            Preencha os seus dados para consultar minutas e extratos de frete
          </p>
        </div>

        {/* ALERTA / MENSAGEM DE STATUS */}
        {mensagemStatus && (
          <div style={{
            ...estilos.caixaStatus,
            backgroundColor: mensagemStatus.includes('❌') ? '#fef2f2' : mensagemStatus.includes('🎉') ? '#f0fdf4' : '#eff6ff',
            color: mensagemStatus.includes('❌') ? '#991b1b' : mensagemStatus.includes('🎉') ? '#166534' : '#1e40af',
            borderColor: mensagemStatus.includes('❌') ? '#fecaca' : mensagemStatus.includes('🎉') ? '#bbf7d0' : '#bfdbfe',
          }}>
            {mensagemStatus}
          </div>
        )}

        {/* FORMULÁRIO DE CADASTRO */}
        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          
          <div style={estilos.gridForm}>
            
            {/* NOME COMPLETO */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={estilos.label}>Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Digite o nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            {/* CPF */}
            <div>
              <label style={estilos.label}>CPF *</label>
              <input
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            {/* CONTATO / WHATSAPP */}
            <div>
              <label style={estilos.label}>Contato / WhatsApp</label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            {/* PIS */}
            <div>
              <label style={estilos.label}>PIS</label>
              <input
                type="text"
                placeholder="000.00000.00-0"
                value={pis}
                onChange={(e) => setPis(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            {/* DATA DE NASCIMENTO */}
            <div>
              <label style={estilos.label}>Data de Nascimento</label>
              <input
                type="text"
                placeholder="DD/MM/AAAA"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            {/* CHAVE PIX */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={estilos.label}>Chave PIX / Dados Bancários</label>
              <input
                type="text"
                placeholder="Digite a chave PIX ou dados da conta"
                value={pix}
                onChange={(e) => setPix(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            {/* PLACAS DOS CAMINHÕES */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={estilos.label}>Placas dos Caminhões (Separe por vírgula se tiver mais de um) *</label>
              <input
                type="text"
                required
                placeholder="Informe a placa ou placas separadas por vírgula"
                value={placasTexto}
                onChange={(e) => setPlacasTexto(e.target.value)}
                style={estilos.inputSofisticado}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.35rem' }}>
                💡 As minutas emitidas para estas placas serão vinculadas automaticamente ao seu painel.
              </span>
            </div>

            {/* PALAVRA-PASSE (SENHA) */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={estilos.label}>Crie uma Palavra-Passe (Senha) para Login *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

          </div>

          {/* BOTÃO DE REGISTO */}
          <button type="submit" disabled={carregando} style={estilos.botaoPrincipal}>
            {carregando ? '⏳ A criar registo...' : '💾 Finalizar Registo'}
          </button>
        </form>

        {/* RODAPÉ DO CARD */}
        <div style={estilos.rodapeCard}>
          <span style={{ color: '#64748b' }}>Já tem uma conta? </span>
          <Link href="/" style={estilos.linkLogin}>
            Fazer Login
          </Link>
        </div>

      </div>

    </div>
  );
}

const estilos: { [key: string]: React.CSSProperties } = {
  containerGeral: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#020617',
    backgroundImage: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 70%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1.5rem',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  cardElevado: {
    backgroundColor: '#ffffff',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    maxWidth: '680px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  },
  cabecalho: {
    textAlign: 'center',
  },
  badgePortal: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '0.7rem',
    fontWeight: '800',
    letterSpacing: '1px',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    marginBottom: '0.75rem',
  },
  tituloModal: {
    margin: 0,
    fontSize: '1.75rem',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  subtituloModal: {
    margin: '0.35rem 0 0 0',
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  caixaStatus: {
    padding: '0.85rem',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '600',
    marginTop: '1.25rem',
    textAlign: 'center',
    border: '1px solid',
  },
  gridForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.35rem',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputSofisticado: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontSize: '0.9rem',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease-in-out',
  },
  botaoPrincipal: {
    width: '100%',
    marginTop: '1.75rem',
    padding: '0.9rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
  },
  rodapeCard: {
    textAlign: 'center',
    marginTop: '1.75rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid #f1f5f9',
    fontSize: '0.875rem',
  },
  linkLogin: {
    color: '#2563eb',
    fontWeight: '700',
    textDecoration: 'none',
    marginLeft: '0.35rem',
  },
};