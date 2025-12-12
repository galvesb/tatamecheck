import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PresencaPage from './modules/PresencaPage';
import FinanceiroPage from './modules/FinanceiroPage';
import ProgressoPage from './modules/ProgressoPage';
import MidiaPage from './modules/MidiaPage';
import ConfiguracoesPage from './modules/ConfiguracoesPage';
import PendenciasPage from './modules/PendenciasPage';
import HistoricoPresencaPage from './modules/HistoricoPresencaPage';
import HistoricoGraduacoesPage from './modules/HistoricoGraduacoesPage';
import GerenciarAlunos from './GerenciarAlunos';
import '../index.css';

const Dashboard = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeModule, setActiveModule] = useState('presenca');
    const [hamburgerMenuVisible, setHamburgerMenuVisible] = useState(false);

    // Se ainda está carregando a autenticação, mostrar loading
    if (authLoading) {
        return (
            <div className="app-shell">
                <div className="app-body">
                    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Carregando...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Se não tem usuário, redirecionar para login
    if (!user) {
        navigate('/login');
        return null;
    }

    // Ajustar módulo ativo inicial baseado no role
    useEffect(() => {
        if (user?.role === 'admin' && activeModule === 'presenca') {
            setActiveModule('pendencias');
        }
    }, [user]);

    const getMainModules = () => {
        // Módulos para alunos
        if (user?.role === 'aluno') {
            return [
                { id: 'presenca', name: 'Presença', icon: '📍', color: '#1cb0f6' },
                { id: 'progresso', name: 'Progresso', icon: '📊', color: '#58cc02' },
                { id: 'midia', name: 'Mídia', icon: '📱', color: '#8b5cf6' }
            ];
        }

        // Para admin: apenas Pendências, Financeiro e Mídia na barra principal
        if (user?.role === 'admin') {
            return [
                { id: 'pendencias', name: 'Pendências', icon: '⏳', color: '#ef4444' },
                { id: 'financeiro', name: 'Financeiro', icon: '💰', color: '#58cc02' },
                { id: 'midia', name: 'Mídia', icon: '📱', color: '#8b5cf6' }
            ];
        }

        // Para professores: Presença, Pendências, Financeiro e Mídia
        if (user?.role === 'professor') {
            return [
                { id: 'presenca', name: 'Presença', icon: '📍', color: '#1cb0f6' },
                { id: 'pendencias', name: 'Pendências', icon: '⏳', color: '#ef4444' },
                { id: 'financeiro', name: 'Financeiro', icon: '💰', color: '#58cc02' },
                { id: 'midia', name: 'Mídia', icon: '📱', color: '#8b5cf6' }
            ];
        }

        return [];
    };

    const getExtraModules = () => {
        const extraModules = [];
        
        // Para alunos: histórico de presença e graduações
        if (user?.role === 'aluno') {
            extraModules.push({ id: 'historicoPresenca', name: 'Histórico de Presenças', icon: '📋', color: '#1cb0f6' });
            extraModules.push({ id: 'historicoGraduacoes', name: 'Histórico de Graduações', icon: '🎯', color: '#58cc02' });
        }
        
        // Adicionar módulo de gerenciamento para professores e admins
        if (user?.role === 'professor' || user?.role === 'admin') {
            extraModules.push({ id: 'alunos', name: 'Alunos', icon: '👥', color: '#f59e0b' });
        }

        // Adicionar módulo de configurações apenas para admins
        if (user?.role === 'admin') {
            extraModules.push({ id: 'configuracoes', name: 'Configurações', icon: '⚙️', color: '#ef4444' });
            // Adicionar Presença no menu hambúrguer para admin
            extraModules.push({ id: 'presenca', name: 'Presença', icon: '📍', color: '#1cb0f6' });
        }

        return extraModules;
    };

    const mainModules = getMainModules();
    const extraModules = getExtraModules();
    const allModules = [...mainModules, ...extraModules];

    const renderModule = () => {
        switch (activeModule) {
            case 'presenca':
                return <PresencaPage />;
            case 'pendencias':
                return <PendenciasPage />;
            case 'financeiro':
                return <FinanceiroPage />;
            case 'progresso':
                return <ProgressoPage />;
            case 'midia':
                return <MidiaPage />;
            case 'alunos':
                return <GerenciarAlunos />;
            case 'configuracoes':
                return <ConfiguracoesPage />;
            case 'historicoPresenca':
                return <HistoricoPresencaPage />;
            case 'historicoGraduacoes':
                return <HistoricoGraduacoesPage />;
            default:
                return <PresencaPage />;
        }
    };

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header-left">
                </div>
                <div className="app-header-center">
                    <p className="app-eyebrow">TatameCheck</p>
                    <div className="app-title">
                        <span>{allModules.find(m => m.id === activeModule)?.icon}</span>
                        <span>{allModules.find(m => m.id === activeModule)?.name}</span>
                    </div>
                    <p className="app-progress">
                        {user?.name || user?.email}
                    </p>
                </div>
                <div className="app-header-right">
                    {extraModules.length > 0 && (
                        <button 
                            className="sim-icon-btn" 
                            type="button"
                            onClick={() => setHamburgerMenuVisible(true)}
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.15)', 
                                color: '#fff', 
                                width: '34px', 
                                height: '34px', 
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}
                        >
                            ☰
                        </button>
                    )}
                </div>
            </header>

            <div className="app-body">
                <div className="app-stage-scroll">
                    {user ? renderModule() : (
                        <div className="card">
                            <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Carregando...</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="app-tab-bar">
                {mainModules.map(module => (
                    <button
                        key={module.id}
                        type="button"
                        className={activeModule === module.id ? 'active' : ''}
                        onClick={() => setActiveModule(module.id)}
                    >
                        <span>{module.icon}</span>
                        <small>{module.name}</small>
                    </button>
                ))}
            </footer>

            {/* Hamburger Menu */}
            {hamburgerMenuVisible && extraModules.length > 0 && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 200,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'flex-start',
                        paddingTop: '80px',
                        paddingRight: '16px'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setHamburgerMenuVisible(false);
                        }
                    }}
                >
                    <div 
                        className="auth-card" 
                        style={{ 
                            maxWidth: '280px', 
                            width: '85%',
                            margin: 0
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: '#e2e8f0' }}>Menu</h3>
                            <button 
                                onClick={() => setHamburgerMenuVisible(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#e2e8f0',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '4px 8px'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        {extraModules.map(module => (
                            <button
                                key={module.id}
                                className={`btn ${activeModule === module.id ? 'primary' : 'secondary'}`}
                                style={{ 
                                    width: '100%', 
                                    marginBottom: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    justifyContent: 'flex-start',
                                    padding: '12px 16px'
                                }}
                                onClick={() => {
                                    setActiveModule(module.id);
                                    setHamburgerMenuVisible(false);
                                }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>{module.icon}</span>
                                <span>{module.name}</span>
                            </button>
                        ))}
                        {extraModules.length > 0 && (
                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '0.75rem' }}>
                                    {user?.name || user?.email}
                                </p>
                                <button 
                                    className="btn danger" 
                                    style={{ width: '100%' }}
                                    onClick={() => {
                                        setHamburgerMenuVisible(false);
                                        logout();
                                        navigate('/login');
                                    }}
                                >
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;

