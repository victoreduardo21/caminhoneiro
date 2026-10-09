'use client';

/**
 * ============================================================================
 * PORTAL DO CAMINHONEIRO - TELA DE LOGIN (CORRIGIDA E CONECTADA À API)
 * Localização: caminhoneiro/app/page.tsx
 * Tecnologias: Next.js (App Router), React, TypeScript, CSS-in-JS Inline
 * Descrição: Formulário de login de motoristas com sanitização de CPF,
 *            tratamento de erros de rede e compatibilidade local/Web.
 * ============================================================================
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginCaminhoneiroPage() {
  const router = useRouter();

  // Estados dos campos de entrada e controle de interface
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState('');

  // ENDEREÇO DA API BACKEND (Puxa da variável de ambiente ou usa localhost como padrão)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * Função para processar o envio do formulário de login
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cpf || !senha) {
      setMensagemStatus('⚠️ Preencha o CPF e a senha para acessar.');
      return;
    }

    setCarregando(true);
    setMensagemStatus('⏳ A autenticar no servidor...');

    // Limpa pontos e traços do CPF para enviar apenas dígitos numéricos
    const cpfLimpo = cpf.replace(/\D/g, '');

    try {
      // Remove barra final da URL se houver para evitar endpoints duplicados (//)
      const baseUrl = apiUrl.replace(/\/$/, '');
      const endpoint = `${baseUrl}/caminhoneiros/login`;

      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cpf: cpfLimpo, senha }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.sucesso) {
        throw new Error(resultado.mensagem || 'CPF ou senha incorretos.');
      }

      // Guarda os dados da sessão no localStorage para reutilização no app
      localStorage.setItem('token_motorista', resultado.token);
      localStorage.setItem('tokenCaminhoneiro', resultado.token);
      localStorage.setItem('token', resultado.token);
      localStorage.setItem(
        'motorista', 
        JSON.stringify(resultado.motorista || resultado.dado || { nome: 'Motorista' })
      );

      setMensagemStatus('🎉 Acesso permitido! A redirecionar...');
      
      // Redireciona para o Painel Principal do Motorista após 800ms
      setTimeout(() => {
        router.push('/minutas');
      }, 800);
    } catch (erro: any) {
      console.error('❌ Erro no login:', erro);

      // Tratamento amigável para falhas de rede/CORS na Web
      if (erro.message === 'Failed to fetch') {
        setMensagemStatus(`❌ Não foi possível conectar ao servidor (${apiUrl}). Verifique sua conexão com a internet ou status do servidor.`);
      } else {
        setMensagemStatus(`❌ ${erro.message}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={estilos.containerGeral}>
      <div style={estilos.cardElevado}>
        
        {/* Cabeçalho do Card */}
        <div style={estilos.cabecalho}>
          <div style={estilos.badgePortal}>PORTAL DO MOTORISTA</div>
          <h1 style={estilos.tituloModal}>Aceda à sua Conta</h1>
          <p style={estilos.subtituloModal}>
            Consulte as suas minutas e extratos de frete em tempo real
          </p>
        </div>

        {/* Mensagem de Alerta/Status */}
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

        {/* Formulário de Autenticação */}
        <form onSubmit={handleLogin} style={{ marginTop: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={estilos.label}>CPF do Motorista *</label>
            <input
              type="text"
              required
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              style={estilos.inputSofisticado}
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={estilos.label}>Palavra-Passe (Senha) *</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={estilos.inputSofisticado}
            />
          </div>

          <button type="submit" disabled={carregando} style={estilos.botaoPrincipal}>
            {carregando ? '⏳ A autenticar...' : 'Entrar no Portal →'}
          </button>
        </form>

        {/* Rodapé do Card */}
        <div style={estilos.rodapeCard}>
          <span style={{ color: '#64748b' }}>Ainda não tem cadastro? </span>
          <Link href="/cadastro" style={estilos.linkRegistro}>
            Criar conta agora
          </Link>
        </div>

      </div>
    </div>
  );
}

// Estilos inline do componente
const estilos: { [key: string]: React.CSSProperties } = {
  containerGeral: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#020617',
    backgroundImage: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #020617 70%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  cardElevado: {
    backgroundColor: '#ffffff',
    padding: '3rem 2.5rem',
    borderRadius: '24px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  cabecalho: { textAlign: 'center' },
  badgePortal: {
    display: 'inline-block',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    marginBottom: '1rem',
  },
  tituloModal: { margin: 0, fontSize: '1.75rem', fontWeight: '800', color: '#0f172a' },
  subtituloModal: { margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' },
  caixaStatus: { padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', marginTop: '1.25rem', textAlign: 'center', border: '1px solid' },
  label: { display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase' },
  inputSofisticado: { width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' },
  botaoPrincipal: { width: '100%', padding: '0.9rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' },
  rodapeCard: { textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', fontSize: '0.875rem' },
  linkRegistro: { color: '#2563eb', fontWeight: '700', textDecoration: 'none', marginLeft: '0.35rem' },
};