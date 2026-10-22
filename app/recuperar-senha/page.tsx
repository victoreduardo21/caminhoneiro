'use client';

/**
 * ============================================================================
 * PORTAL DO CAMINHONEIRO - RECUPERAÇÃO DE SENHA PROGRESSIVA (3 ETAPAS)
 * Localização no Projeto: caminhoneiro/app/recuperar-senha/page.tsx
 * Rota no Navegador: /recuperar-senha
 * Tecnologias: Next.js (App Router), React, TypeScript
 * Descrição: Valida progressivamente CPF ➔ Placa ➔ Redefinição de Senha.
 * ============================================================================
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RecuperarSenhaCaminhoneiroPage() {
  const router = useRouter();

  // Controle de Etapas: 1 = CPF, 2 = Placa, 3 = Nova Senha
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);

  // Estados dos Formulários
  const [cpf, setCpf] = useState('');
  const [placa, setPlaca] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Estados de Controle e Feedback
  const [carregando, setCarregando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState('');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  /**
   * ETAPA 1: Validar se o CPF existe na base de dados
   */
  const handleValidarCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (!cpfLimpo || cpfLimpo.length < 11) {
      setMensagemStatus('⚠️ Informe um CPF válido com 11 dígitos.');
      return;
    }

    setCarregando(true);
    setMensagemStatus('⏳ A verificar CPF na base de dados...');

    try {
      const baseUrl = apiUrl.replace(/\/$/, '');
      const endpoint = `${baseUrl}/caminhoneiros/verificar-cpf`;

      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfLimpo }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.sucesso) {
        throw new Error(resultado.mensagem || 'CPF não encontrado na base de dados.');
      }

      setMensagemStatus('✅ CPF verificado com sucesso! Agora informe a placa.');
      setEtapa(2);
    } catch (erro: any) {
      console.error('❌ Erro na validação do CPF:', erro);
      setMensagemStatus(`❌ ${erro.message || 'Erro ao conectar com o servidor.'}`);
    } finally {
      setCarregando(false);
    }
  };

  /**
   * ETAPA 2: Validar se a Placa informada pertence ao CPF
   */
  const handleValidarPlaca = async (e: React.FormEvent) => {
    e.preventDefault();
    const placaLimpa = placa.trim().toUpperCase();

    if (!placaLimpa) {
      setMensagemStatus('⚠️ Informe a placa do veículo.');
      return;
    }

    setCarregando(true);
    setMensagemStatus('⏳ A verificar vínculo do veículo...');

    try {
      const baseUrl = apiUrl.replace(/\/$/, '');
      const endpoint = `${baseUrl}/caminhoneiros/verificar-placa`;

      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cpf.replace(/\D/g, ''),
          placa: placaLimpa,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.sucesso) {
        throw new Error(resultado.mensagem || 'Placa não confere com o CPF informado.');
      }

      setMensagemStatus('✅ Veículo confirmado! Crie a sua nova senha.');
      setEtapa(3);
    } catch (erro: any) {
      console.error('❌ Erro na validação da Placa:', erro);
      setMensagemStatus(`❌ ${erro.message || 'Erro ao validar o veículo.'}`);
    } finally {
      setCarregando(false);
    }
  };

  /**
   * ETAPA 3: Redefinir a nova senha
   */
  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!novaSenha || !confirmarSenha) {
      setMensagemStatus('⚠️ Preencha os dois campos de senha.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemStatus('⚠️ As senhas digitadas não são iguais.');
      return;
    }

    if (novaSenha.length < 6) {
      setMensagemStatus('⚠️ A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setCarregando(true);
    setMensagemStatus('⏳ A redefinir a palavra-passe...');

    try {
      const baseUrl = apiUrl.replace(/\/$/, '');
      const endpoint = `${baseUrl}/caminhoneiros/recuperar-senha`;

      const resposta = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cpf.replace(/\D/g, ''),
          placa: placa.trim().toUpperCase(),
          novaSenha,
        }),
      });

      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.sucesso) {
        throw new Error(resultado.mensagem || 'Não foi possível redefinir a senha.');
      }

      setMensagemStatus('🎉 Senha redefinida com sucesso! A redirecionar...');

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (erro: any) {
      console.error('❌ Erro ao atualizar senha:', erro);
      setMensagemStatus(`❌ ${erro.message || 'Erro ao conectar com o servidor.'}`);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={estilos.containerGeral}>
      <div style={estilos.cardElevado}>
        
        {/* CABEÇALHO */}
        <div style={estilos.cabecalho}>
          <div style={estilos.badgePortal}>PASSO {etapa} DE 3</div>
          <h1 style={estilos.tituloModal}>
            {etapa === 1 && 'Identificação por CPF'}
            {etapa === 2 && 'Confirmação do Veículo'}
            {etapa === 3 && 'Criar Nova Senha'}
          </h1>
          <p style={estilos.subtituloModal}>
            {etapa === 1 && 'Digite o seu CPF para iniciar a verificação de segurança.'}
            {etapa === 2 && `CPF verificado. Informe a placa do veículo associada ao CPF.`}
            {etapa === 3 && 'Defina uma nova senha de acesso segura para a sua conta.'}
          </p>
        </div>

        {/* FEEDBACK DE STATUS */}
        {mensagemStatus && (
          <div style={{
            ...estilos.caixaStatus,
            backgroundColor: mensagemStatus.includes('❌') ? '#fef2f2' : mensagemStatus.includes('✅') || mensagemStatus.includes('🎉') ? '#f0fdf4' : '#eff6ff',
            color: mensagemStatus.includes('❌') ? '#991b1b' : mensagemStatus.includes('✅') || mensagemStatus.includes('🎉') ? '#166534' : '#1e40af',
            borderColor: mensagemStatus.includes('❌') ? '#fecaca' : mensagemStatus.includes('✅') || mensagemStatus.includes('🎉') ? '#bbf7d0' : '#bfdbfe',
          }}>
            {mensagemStatus}
          </div>
        )}

        {/* FORMULÁRIO - ETAPA 1: CPF */}
        {etapa === 1 && (
          <form onSubmit={handleValidarCpf} style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
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

            <button type="submit" disabled={carregando} style={estilos.botaoPrincipal}>
              {carregando ? '⏳ A verificar...' : 'Verificar CPF →'}
            </button>
          </form>
        )}

        {/* FORMULÁRIO - ETAPA 2: PLACA (SÓ APARECE APÓS O CPF ESTAR CERTO) */}
        {etapa === 2 && (
          <form onSubmit={handleValidarPlaca} style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={estilos.label}>CPF Confirmado</label>
              <input
                type="text"
                disabled
                value={cpf}
                style={{ ...estilos.inputSofisticado, backgroundColor: '#e2e8f0', color: '#64748b' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={estilos.label}>Placa do Veículo *</label>
              <input
                type="text"
                required
                placeholder="ABC1D23 ou ABC1234"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                style={estilos.inputSofisticado}
              />
            </div>

            <button type="submit" disabled={carregando} style={estilos.botaoPrincipal}>
              {carregando ? '⏳ A validar...' : 'Validar Placa →'}
            </button>
          </form>
        )}

        {/* FORMULÁRIO - ETAPA 3: SENHA (SÓ APARECE APÓS CPF E PLACA ESTAREM CERTO) */}
        {etapa === 3 && (
          <form onSubmit={handleAtualizarSenha} style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={estilos.label}>Nova Senha *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={estilos.label}>Confirmar Nova Senha *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                style={estilos.inputSofisticado}
              />
            </div>

            <button type="submit" disabled={carregando} style={estilos.botaoPrincipal}>
              {carregando ? '⏳ A redefinir...' : 'Atualizar Senha →'}
            </button>
          </form>
        )}

        {/* RODAPÉ */}
        <div style={estilos.rodapeCard}>
          <Link href="/" style={estilos.linkVoltar}>
            ← Voltar para o Login
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
    backgroundColor: '#fffbeb',
    color: '#b45309',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    marginBottom: '1rem',
  },
  tituloModal: { margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#0f172a' },
  subtituloModal: { margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b', lineHeight: '1.4' },
  caixaStatus: { padding: '0.85rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', marginTop: '1.25rem', textAlign: 'center', border: '1px solid' },
  label: { display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase' },
  inputSofisticado: { width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '0.95rem', fontWeight: '600', outline: 'none', boxSizing: 'border-box' },
  botaoPrincipal: { width: '100%', padding: '0.9rem', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' },
  rodapeCard: { textAlign: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9' },
  linkVoltar: { color: '#64748b', fontWeight: '700', textDecoration: 'none', fontSize: '0.875rem' },
};