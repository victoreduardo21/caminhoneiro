'use client';

import React from 'react';
import Navbar from '../components/Navbar';

export default function RotasPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', color: '#0f172a' }}>
      <Navbar />
      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem 3rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          🗺 Rotas e Valores
        </h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Consulte as rotas disponíveis e os valores de frete da tabela.
        </p>
      </main>
    </div>
  );
}