import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import PresencaPage from './modules/PresencaPage';
import FinanceiroPage from './modules/FinanceiroPage';
import ProgressoPage from './modules/ProgressoPage';
import MidiaPage from './modules/MidiaPage';
import ConfiguracoesPage from './modules/ConfiguracoesPage';
import GerenciarAlunos from './GerenciarAlunos';
import '../index.css';

const Dashboard = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeModule, setActiveModule] = useState('presenca');
    const [settingsVisible, setSettingsVisible] = useState(false);

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

    const getModules = () => {
        // Módulos para alunos
        if (user?.role === 'aluno') {
            return [
                { id: 'presenca', name: 'Presença', icon: '📍', color: '#1cb0f6' },
                { id: 'progresso', name: 'Progresso', icon: '📊', color: '#58cc02' },
                { id: 'midia', name: 'Mídia', icon: '📱', color: '#8b5cf6' }
            ];
        }

        // Módulos para professores e admins
        const baseModules = [
            { id: 'presenca', name: 'Presença', icon: '📍', color: '#1cb0f6' },
            { id: 'financeiro', name: 'Financeiro', icon: '💰', color: '#58cc02' },
            { id: 'midia', name: 'Mídia', icon: '📱', color: '#8b5cf6' }
        ];

        // Adicionar módulo de gerenciamento para professores e admins
        if (user?.role === 'professor' || user?.role === 'admin') {
            baseModules.push({ id: 'alunos', name: 'Alunos', icon: '👥', color: '#f59e0b' });
        }

        // Adicionar módulo de configurações apenas para admins
        if (user?.role === 'admin') {
            baseModules.push({ id: 'configuracoes', name: 'Configurações', icon: '⚙️', color: '#ef4444' });
        }

        return baseModules;
    };

    const modules = getModules();

    const renderModule = () => {
        switch (activeModule) {
            case 'presenca':
                return <PresencaPage />;
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
            default:
                return <PresencaPage />;
        }
    };

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header-left">
                    <button 
                        className="sim-icon-btn" 
                        type="button"
                        onClick={() => setSettingsVisible(true)}
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
                        ⚙️
                    </button>
                </div>
                <div className="app-header-center">
                    <p className="app-eyebrow">TatameCheck</p>
                    <div className="app-title">
                        <span>{modules.find(m => m.id === activeModule)?.icon}</span>
                        <span>{modules.find(m => m.id === activeModule)?.name}</span>
                    </div>
                    <p className="app-progress">
                        {user?.name || user?.email}
                    </p>
                </div>
                <div className="app-header-right"></div>
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
                {modules.map(module => (
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

            {/* Settings Menu */}
            {settingsVisible && (
                <div 
                    className="settings-menu visible"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 200,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        paddingTop: '80px',
                        visibility: 'visible',
                        opacity: 1
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSettingsVisible(false);
                        }
                    }}
                >
                    <div className="auth-card" style={{ maxWidth: '350px', width: '90%' }}>
                        <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Configurações</h3>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                            Usuário: {user?.name || user?.email}<br />
                            Tipo: {user?.role || 'aluno'}
                        </p>
                        <button 
                            className="btn danger" 
                            onClick={() => {
                                setSettingsVisible(false);
                                logout();
                                navigate('/login');
                            }}
                        >
                            Sair
                        </button>
                        <button 
                            className="btn secondary" 
                            style={{ marginTop: '1rem' }}
                            onClick={() => setSettingsVisible(false)}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

