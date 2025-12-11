import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const Landing = () => {
    const { user } = useAuth();

    return (
        <div className="auth-wrapper" style={{ minHeight: '100vh', padding: 'clamp(32px, 8vw, 80px) clamp(24px, 6vw, 64px)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {/* Hero Section */}
                <section style={{ textAlign: 'center', marginBottom: 'clamp(60px, 12vw, 120px)' }}>
                    <div className="auth-badge" style={{ marginBottom: '2rem' }}>
                        TatameCheck
                    </div>
                    <h1 style={{ 
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)', 
                        fontWeight: 800, 
                        lineHeight: 1.2, 
                        color: '#e2e8f0', 
                        margin: '0 0 1.5rem' 
                    }}>
                        Gestão Completa para
                        <span style={{ display: 'block', color: '#60a5fa' }}>
                            Academias de Jiu-Jitsu
                        </span>
                    </h1>
                    <p style={{ 
                        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
                        color: 'rgba(226, 232, 240, 0.7)', 
                        maxWidth: '700px', 
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.6 
                    }}>
                        Automatize a administração da sua academia. Controle de frequência por geolocalização, 
                        gestão financeira completa e comunicação interna da comunidade.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {user ? (
                            <Link to="/" className="btn primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 600, minWidth: '160px' }}>
                                Acessar Plataforma
                            </Link>
                        ) : (
                            <Link to="/login" className="btn primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 600, minWidth: '160px' }}>
                                Fazer Login
                            </Link>
                        )}
                    </div>
                </section>

                {/* Features Section */}
                <section style={{ marginBottom: 'clamp(60px, 12vw, 120px)' }}>
                    <h2 style={{ 
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
                        fontWeight: 700, 
                        color: '#e2e8f0', 
                        textAlign: 'center', 
                        margin: '0 0 clamp(40px, 8vw, 60px)' 
                    }}>
                        Funcionalidades Principais
                    </h2>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                        gap: '1.5rem' 
                    }}>
                        <div className="auth-card" style={{ textAlign: 'center', padding: '2rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                 e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                             }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 0.75rem' }}>
                                Check-in por Geolocalização
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: 'rgba(226, 232, 240, 0.7)', lineHeight: 1.6, margin: 0 }}>
                                Registro de presença automático via GPS. O aluno só pode fazer check-in quando estiver 
                                dentro do raio da academia, garantindo precisão total.
                            </p>
                        </div>
                        <div className="auth-card" style={{ textAlign: 'center', padding: '2rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                 e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                             }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 0.75rem' }}>
                                Gestão Financeira
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: 'rgba(226, 232, 240, 0.7)', lineHeight: 1.6, margin: 0 }}>
                                Controle completo de receitas e despesas. Lembretes automáticos de cobrança e 
                                relatórios detalhados de fluxo de caixa.
                            </p>
                        </div>
                        <div className="auth-card" style={{ textAlign: 'center', padding: '2rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                 e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                             }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 0.75rem' }}>
                                Comunidade e Mídia
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: 'rgba(226, 232, 240, 0.7)', lineHeight: 1.6, margin: 0 }}>
                                Feed de notícias interno, mural de avisos, agenda de aulas e eventos. 
                                Mantenha toda a comunidade engajada e informada.
                            </p>
                        </div>
                        <div className="auth-card" style={{ textAlign: 'center', padding: '2rem', transition: 'all 0.3s ease', cursor: 'pointer' }}
                             onMouseEnter={(e) => {
                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                 e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                             }}
                             onMouseLeave={(e) => {
                                 e.currentTarget.style.transform = 'translateY(0)';
                                 e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                             }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e2e8f0', margin: '0 0 0.75rem' }}>
                                Progressão e Graduação
                            </h3>
                            <p style={{ fontSize: '0.95rem', color: 'rgba(226, 232, 240, 0.7)', lineHeight: 1.6, margin: 0 }}>
                                Sistema automático de cálculo de elegibilidade para graduação. 
                                Painel do professor com alertas de alunos aptos para avaliação.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Final */}
                <section style={{ 
                    textAlign: 'center', 
                    padding: 'clamp(40px, 8vw, 80px) 0',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    <h2 style={{ 
                        fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
                        fontWeight: 700, 
                        color: '#e2e8f0', 
                        margin: '0 0 1rem' 
                    }}>
                        Pronto para otimizar sua academia?
                    </h2>
                    <p style={{ 
                        fontSize: 'clamp(1rem, 2.5vw, 1.125rem)', 
                        color: 'rgba(226, 232, 240, 0.7)', 
                        margin: '0 0 2rem',
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Simplifique a gestão da sua academia de Jiu-Jitsu com tecnologia de ponta.
                    </p>
                    {!user && (
                        <Link to="/login" className="btn primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
                            Fazer Login
                        </Link>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Landing;

