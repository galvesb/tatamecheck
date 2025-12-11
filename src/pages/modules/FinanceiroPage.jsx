import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const FinanceiroPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    // Mock data - substituir por dados reais da API
    const receitas = [
        { id: 1, descricao: 'Mensalidade - João Silva', valor: 150, status: 'pago', data: '2024-01-15' },
        { id: 2, descricao: 'Mensalidade - Maria Santos', valor: 150, status: 'pendente', data: '2024-01-15' },
        { id: 3, descricao: 'Taxa de Matrícula', valor: 50, status: 'pago', data: '2024-01-10' },
    ];

    const despesas = [
        { id: 1, descricao: 'Aluguel', valor: 2000, categoria: 'fixa', data: '2024-01-05' },
        { id: 2, descricao: 'Salário Professor', valor: 1500, categoria: 'pessoal', data: '2024-01-10' },
        { id: 3, descricao: 'Material de Treino', valor: 300, categoria: 'material', data: '2024-01-12' },
    ];

    const totalReceitas = receitas.filter(r => r.status === 'pago').reduce((sum, r) => sum + r.valor, 0);
    const totalDespesas = despesas.reduce((sum, d) => sum + d.valor, 0);
    const saldo = totalReceitas - totalDespesas;

    return (
        <div>
            {/* Visão Geral */}
            {activeTab === 'overview' && (
                <>
                    <div className="dashboard-grid">
                        <div className="stats-card">
                            <div className="stats-value" style={{ color: '#22c55e' }}>
                                R$ {totalReceitas.toFixed(2)}
                            </div>
                            <div className="stats-label">Total Receitas (Pago)</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value" style={{ color: '#f87171' }}>
                                R$ {totalDespesas.toFixed(2)}
                            </div>
                            <div className="stats-label">Total Despesas</div>
                        </div>
                        <div className="stats-card">
                            <div className="stats-value" style={{ color: saldo >= 0 ? '#60a5fa' : '#f87171' }}>
                                R$ {saldo.toFixed(2)}
                            </div>
                            <div className="stats-label">Saldo Atual</div>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '16px' }}>
                        <h3>Pendências</h3>
                        <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                            {receitas.filter(r => r.status === 'pendente').length} mensalidades pendentes
                        </p>
                    </div>
                </>
            )}

            {/* Receitas */}
            {activeTab === 'receitas' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Receitas</h2>
                        {(user?.role === 'admin' || user?.role === 'professor') && (
                            <button className="btn primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
                                + Nova Receita
                            </button>
                        )}
                    </div>
                    {receitas.map(receita => (
                        <div key={receita.id} className="list-item">
                            <div className="list-item-icon">💰</div>
                            <div className="list-item-content">
                                <div className="list-item-title">{receita.descricao}</div>
                                <div className="list-item-subtitle">
                                    {new Date(receita.data).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                                    R$ {receita.valor.toFixed(2)}
                                </div>
                                <span className={`badge ${receita.status === 'pago' ? 'success' : 'warning'}`}>
                                    {receita.status === 'pago' ? 'Pago' : 'Pendente'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Despesas */}
            {activeTab === 'despesas' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2>Despesas</h2>
                        {(user?.role === 'admin' || user?.role === 'professor') && (
                            <button className="btn primary" style={{ width: 'auto', margin: 0, padding: '8px 16px' }}>
                                + Nova Despesa
                            </button>
                        )}
                    </div>
                    {despesas.map(despesa => (
                        <div key={despesa.id} className="list-item">
                            <div className="list-item-icon">💸</div>
                            <div className="list-item-content">
                                <div className="list-item-title">{despesa.descricao}</div>
                                <div className="list-item-subtitle">
                                    {new Date(despesa.data).toLocaleDateString('pt-BR')} • {despesa.categoria}
                                </div>
                            </div>
                            <div style={{ fontWeight: 600, color: '#f87171' }}>
                                R$ {despesa.valor.toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs de Navegação */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '16px',
                position: 'sticky',
                bottom: '80px',
                background: 'rgba(3, 10, 18, 0.95)',
                padding: '12px',
                borderRadius: '18px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <button
                    className={`btn ${activeTab === 'overview' ? 'primary' : 'ghost'}`}
                    style={{ flex: 1, margin: 0, padding: '8px' }}
                    onClick={() => setActiveTab('overview')}
                >
                    Visão Geral
                </button>
                <button
                    className={`btn ${activeTab === 'receitas' ? 'primary' : 'ghost'}`}
                    style={{ flex: 1, margin: 0, padding: '8px' }}
                    onClick={() => setActiveTab('receitas')}
                >
                    Receitas
                </button>
                <button
                    className={`btn ${activeTab === 'despesas' ? 'primary' : 'ghost'}`}
                    style={{ flex: 1, margin: 0, padding: '8px' }}
                    onClick={() => setActiveTab('despesas')}
                >
                    Despesas
                </button>
            </div>
        </div>
    );
};

export default FinanceiroPage;

