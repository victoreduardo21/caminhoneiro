'use client';

/**
 * ============================================================================
 * COMPONENTE: NAVBAR HÍBRIDA (BARRA LATERAL NO PC / HEADER COM 3 PONTOS NO CELULAR)
 * Localização no VS Code: caminhoneiro/app/components/Navbar.tsx
 * Tecnologias: Next.js (React / TypeScript)
 * Descrição: Exibe a Barra Lateral no computador e o Menu dos 3 Pontos
 *            exclusivamente quando acessado por dispositivos móveis/celulares.
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface MotoristaSessao {
  id?: string;
  nome: string;
  cpf?: string;
  placa?: string;
  placas?: string[];
  pix?: string;
  whatsapp?: string;
}

export interface NavbarProps {
  usuario?: MotoristaSessao | null;
}

export default function Navbar({ usuario }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Previne erros de hidratação (Hydration Mismatch) no Next.js
  const [montado, setMontado] = useState(false);

  // Estado que controla a abertura do menu suspenso pelos 3 pontos no celular
  const [menuAbertoMobile, setMenuAbertoMobile] = useState(false);

  const [motorista, setMotorista] = useState<{ nome: string; placas: string[] }>({
    nome: 'Caminhoneiro',
    placas: [],
  });

  useEffect(() => {
    setMontado(true);

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

    // Lê a sessão salva no localStorage do navegador
    const dadosSalvos = typeof window !== 'undefined' 
      ? localStorage.getItem('motorista') || localStorage.getItem('usuario') || localStorage.getItem('user')
      : null;

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
        console.warn('Erro ao ler sessão do motorista no localStorage');
      }
    }
  }, [usuario]);

  // Fecha o menu suspenso do celular automaticamente ao trocar de página
  useEffect(() => {
    setMenuAbertoMobile(false);
  }, [pathname]);

  const itensMenu = [
    { nome: '📋 Minutas', rota: '/minutas' },
    { nome: '🗺️ Rotas e Valores', rota: '/rotas' },
    { nome: '⚙️ Configurações', rota: '/configuracoes' },
  ];

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.confirm('Deseja realmente encerrar a sessão?')) {
      localStorage.removeItem('tokenCaminhoneiro');
      localStorage.removeItem('token_motorista');
      localStorage.removeItem('motorista');
      localStorage.removeItem('usuario');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  if (!montado) return null;

  return (
    <>
      {/* --- REGRAS DE CSS RESPONSIVO PARA ALTERNAR ENTRE CELULAR E COMPUTADOR --- */}
      <style jsx global>{`
        /* --- ESTILOS PARA COMPUTADORES E MONITORES (> 768px) --- */
        @media (min-width: 769px) {
          .navbar-container-sidebar {
            width: 250px !important;
            height: 100vh !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            opacity: 1 !important;
            pointer-events: all !important;
            box-shadow: 4px 0 15px rgba(0, 0, 0, 0.25) !important;
          }

          /* OCULTA O BOTÃO DOS 3 PONTOS NO COMPUTADOR */
          .botao-tres-pontos-mobile {
            display: none !important;
          }

          .topo-barra-mobile {
            display: none !important;
          }

          /* AJUSTA O CONTEÚDO DAS PÁGINAS DO COMPUTADOR PARA NÃO FICAR ATRÁS DA BARRA */
          main {
            margin-left: 250px !important;
            padding-top: 2rem !important;
          }
        }

        /* --- ESTILOS EXCLUSIVOS PARA CELULARES (≤ 768px) --- */
        @media (max-width: 768px) {
          .navbar-container-sidebar {
            width: 100vw !important;
            height: auto !important;
            position: fixed !important;
            top: 60px !important;
            left: 0 !important;
            right: 0 !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
            max-height: calc(100dvh - 60px) !important;
            overflow-y: auto !important;
          }

          /* EXIBE O BOTÃO DOS 3 PONTOS NO CELULAR */
          .botao-tres-pontos-mobile {
            display: flex !important;
          }

          .topo-barra-mobile {
            display: flex !important;
          }

          /* AJUSTA O CONTEÚDO DA PÁGINA DO CELULAR PARA FICAR ABAIXO DO TOPO */
          main {
            margin-left: 0 !important;
            padding-top: 75px !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>

      {/* --- BARRA SUPERIOR FIXA DO CELULAR (HEADER COM OS 3 PONTOS) --- */}
      <header className="topo-barra-mobile" style={estilos.topoBarraMobile}>
        <div style={estilos.cabecalhoLogo}>
          <div style={estilos.iconeLogo}>🚛</div>
          <div>
            <h2 style={estilos.tituloLogo}>PORTAL MOTORISTA</h2>
            <p style={estilos.subtituloLogo}>Sistema Logístico</p>
          </div>
        </div>

        {/* BOTÃO DOS 3 PONTOS (EXIBIDO APENAS NO CELULAR) */}
        <button
          onClick={() => setMenuAbertoMobile(!menuAbertoMobile)}
          className="botao-tres-pontos-mobile"
          style={estilos.botaoTresPontos}
          aria-label="Opções do Menu"
        >
          ⋮
        </button>
      </header>

      {/* --- BARRA LATERAL (PC) / MENU SUSPENSO (CELULAR) --- */}
      <aside
        className="navbar-container-sidebar"
        style={{
          ...estilos.containerSidebar,
          transform: menuAbertoMobile ? 'translateY(0)' : 'translateY(-120%)',
          opacity: menuAbertoMobile ? 1 : 0,
          pointerEvents: menuAbertoMobile ? 'all' : 'none',
        }}
      >
        {/* Cabeçalho visível na barra lateral do Computador */}
        <div style={estilos.cabecalhoSidebar}>
          <div style={estilos.iconeLogo}>🚛</div>
          <div>
            <h2 style={estilos.tituloLogo}>PORTAL MOTORISTA</h2>
            <p style={estilos.subtituloLogo}>Sistema Logístico</p>
          </div>
        </div>

        {/* Card do Motorista */}
        <div style={estilos.cardMotorista}>
          <div style={estilos.avatar}>
            {motorista.nome ? motorista.nome.charAt(0).toUpperCase() : 'M'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <p style={estilos.nomeMotorista}>{motorista.nome}</p>
            <span style={estilos.placasMotorista}>
              {motorista.placas.length > 0 ? `Placa: ${motorista.placas.join(', ')}` : 'Sem placa vinculada'}
            </span>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav style={estilos.navegacao}>
          {itensMenu.map((item) => {
            const estaAtivo = pathname === item.rota;

            return (
              <Link
                key={item.rota}
                href={item.rota}
                onClick={() => setMenuAbertoMobile(false)}
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

        {/* Rodapé com botão de Sair */}
        <div style={estilos.rodape}>
          <button onClick={handleLogout} style={estilos.botaoSair}>
            🚪 Sair do Portal
          </button>
        </div>
      </aside>
    </>
  );
}

// Estilos Base Inline
const estilos: { [key: string]: React.CSSProperties } = {
  topoBarraMobile: {
    height: '60px',
    width: '100vw',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    position: 'fixed',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.25rem',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  cabecalhoLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
  },
  iconeLogo: { fontSize: '1.5rem' },
  tituloLogo: { margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#38bdf8', letterSpacing: '0.5px' },
  subtituloLogo: { margin: 0, fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' },
  botaoTresPontos: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: '1px solid #334155',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  containerSidebar: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem 1rem',
    zIndex: 999,
    boxSizing: 'border-box',
    transition: 'all 0.3s ease-in-out',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  cabecalhoSidebar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
    paddingBottom: '0.85rem',
    borderBottom: '1px solid #1e293b',
  },
  cardMotorista: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.75rem', 
    backgroundColor: '#1e293b', 
    padding: '0.85rem', 
    borderRadius: '12px', 
    marginBottom: '1.25rem', 
    border: '1px solid #334155' 
  },
  avatar: { 
    width: '38px', 
    height: '38px', 
    borderRadius: '50%', 
    backgroundColor: '#2563eb', 
    color: '#ffffff', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: '800', 
    fontSize: '1rem', 
    flexShrink: 0 
  },
  nomeMotorista: { margin: 0, fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  placasMotorista: { fontSize: '0.7rem', color: '#38bdf8', fontWeight: '600', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  navegacao: { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 },
  linkItem: { 
    display: 'flex', 
    alignItems: 'center', 
    minHeight: '44px',
    padding: '0.75rem 1rem', 
    borderRadius: '10px', 
    color: '#94a3b8', 
    textDecoration: 'none', 
    fontSize: '0.9rem', 
    fontWeight: '600',
    backgroundColor: '#1e293b'
  },
  linkItemAtivo: { backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '700' },
  indicador: { width: '8px', height: '8px', borderRadius: '50%', marginRight: '0.75rem', flexShrink: 0 },
  textoItem: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rodape: { paddingTop: '1rem', borderTop: '1px solid #1e293b', marginTop: 'auto' },
  botaoSair: { 
    width: '100%', 
    minHeight: '44px',
    padding: '0.75rem', 
    backgroundColor: '#ef4444', 
    color: '#ffffff', 
    border: 'none', 
    borderRadius: '10px', 
    fontSize: '0.85rem', 
    fontWeight: '700', 
    cursor: 'pointer', 
    textAlign: 'center' 
  },
};