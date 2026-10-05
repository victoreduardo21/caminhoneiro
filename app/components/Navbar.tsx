'use client';

/**
 * ============================================================================
 * COMPONENTE: BARRA DE NAVEGAÇÃO LATERAL (NAVBAR DO PORTAL DO CAMINHONEIRO)
 * Localização no VS Code: caminhoneiro/app/components/Navbar.tsx
 * Tecnologias: Next.js 13+ (App Router), React, TypeScript
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Interface que define os dados da sessão do motorista
export interface MotoristaSessao {
  id?: string;
  nome: string;
  cpf?: string;
  placa?: string;
  placas?: string[];
  pix?: string;
  whatsapp?: string;
}

// CORREÇÃO DO ERRO TS2322: Declaração explícita da propriedade 'usuario'
export interface NavbarProps {
  usuario?: MotoristaSessao | null;
}

export default function Navbar({ usuario }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [motorista, setMotorista] = useState<{ nome: string; placas: string[] }>({
    nome: 'Caminhoneiro',
    placas: [],
  });

  useEffect(() => {
    // Se a prop 'usuario' for fornecida pela página, utiliza os dados diretamente
    if (usuario) {
      const placasArray = Array.isArray(usuario.placas) && usuario.placas.length > 0
        ? usuario.placas
        : usuario.placa ? [usuario.placa] : [];

      setMotorista({
        nome: usuario.nome || 'Motorista',
        placas: placasArray.filter(Boolean),
      });
      return;
    }

    // Fallback: Tenta obter os dados da sessão local no localStorage
    const dadosSalvos = localStorage.getItem('motorista') || localStorage.getItem('usuario') || localStorage.getItem('user');

    if (dadosSalvos) {
      try {
        const parsed = JSON.parse(dadosSalvos);
        const placasArray = Array.isArray(parsed.placas) && parsed.placas.length > 0
          ? parsed.placas
          : parsed.placa ? [parsed.placa] : [];

        setMotorista({
          nome: parsed.nome || 'Motorista',
          placas: placasArray.filter(Boolean),
        });
      } catch (e) {
        console.warn('Sessão não encontrada no localStorage');
      }
    }
  }, [usuario]);

  const itensMenu = [
    { nome: '📋 Minutas', rota: '/minutas' },
    { nome: '🗺️️ Rotas e Valores', rota: '/rotas' },
    { nome: '⚙️ Configurações', rota: '/configuracoes' },
  ];

  const handleLogout = () => {
    if (window.confirm('Deseja realmente encerrar a sessão?')) {
      localStorage.removeItem('tokenCaminhoneiro');
      localStorage.removeItem('motorista');
      localStorage.removeItem('usuario');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  return (
    <aside style={estilos.containerSidebar}>
      <div style={estilos.cabecalho}>
        <div style={estilos.iconeLogo}>🚛</div>
        <div>
          <h2 style={estilos.tituloLogo}>PORTAL MOTORISTA</h2>
          <p style={estilos.subtituloLogo}>Sistema Logístico</p>
        </div>
      </div>

      <div style={estilos.cardMotorista}>
        <div style={estilos.avatar}>
          {motorista.nome ? motorista.nome.charAt(0).toUpperCase() : 'M'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={estilos.nomeMotorista}>{motorista.nome}</p>
          <span style={estilos.placasMotorista}>
            {motorista.placas.length > 0 ? `Placa: ${motorista.placas.join(', ')}` : 'Sem placa vinculada'}
          </span>
        </div>
      </div>

      <nav style={estilos.navegacao}>
        {itensMenu.map((item) => {
          const estaAtivo = pathname === item.rota;

          return (
            <Link
              key={item.rota}
              href={item.rota}
              style={{
                ...estilos.linkItem,
                ...(estaAtivo ? estilos.linkItemAtivo : {}),
              }}
            >
              <span
                style={{
                  ...estilos.indicador,
                  backgroundColor: estaAtivo ? '#ffffff' : '#64748b',
                }}
              ></span>
              <span style={estilos.textoItem}>{item.nome}</span>
            </Link>
          );
        })}
      </nav>

      <div style={estilos.rodape}>
        <button onClick={handleLogout} style={estilos.botaoSair}>
          🚪 Sair do Portal
        </button>
      </div>
    </aside>
  );
}

const estilos: { [key: string]: React.CSSProperties } = {
  containerSidebar: {
    width: '250px',
    height: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    position: 'fixed',
    top: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem 1rem',
    boxShadow: '4px 0 15px rgba(0, 0, 0, 0.25)',
    zIndex: 100,
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  cabecalho: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    paddingBottom: '0.85rem',
    borderBottom: '1px solid #1e293b',
  },
  iconeLogo: { fontSize: '1.8rem' },
  tituloLogo: { margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.5px' },
  subtituloLogo: { margin: '0.1rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' },
  cardMotorista: { display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#1e293b', padding: '0.75rem 0.85rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid #334155' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 },
  nomeMotorista: { margin: 0, fontSize: '0.8rem', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  placasMotorista: { fontSize: '0.7rem', color: '#38bdf8', fontWeight: '600', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  navegacao: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem', overflowY: 'auto' },
  linkItem: { display: 'flex', alignItems: 'center', padding: '0.65rem 0.85rem', borderRadius: '8px', color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.15s ease-in-out' },
  linkItemAtivo: { backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700' },
  indicador: { width: '6px', height: '6px', borderRadius: '50%', marginRight: '0.65rem', flexShrink: 0 },
  textoItem: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rodape: { paddingTop: '0.85rem', borderTop: '1px solid #1e293b', marginTop: 'auto' },
  botaoSair: { width: '100%', padding: '0.65rem', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', textAlign: 'center' },
};