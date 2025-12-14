import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const PendenciasPage = () => {
    const { user } = useAuth();
    const [pendencias, setPendencias] = useState({ graduacoes: [], presencas: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('graduacoes'); // 'graduacoes' ou 'presencas'
    const [confirmando, setConfirmando] = useState(null);
    const [observacoes, setObservacoes] = useState({});
    const [toast, setToast] = useState(null);
    const toastTimerRef = useRef(null);

    // Função para mostrar toast
    const showToast = (message, type = 'success') => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        
        setToast({ message, type });
        
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 2000);
    };

    // Cleanup do timer ao desmontar
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (user?.role === 'professor' || user?.role === 'admin') {
            carregarPendencias();
        }
    }, [user]);

    const carregarPendencias = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/professor/pendencias');
            setPendencias(res.data);
        } catch (err) {
            console.error('Erro ao carregar pendências:', err);
            showToast('Erro ao carregar pendências', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmarGraduacao = async (alunoId, faixa, grau) => {
        try {
            setConfirmando(alunoId);

            const res = await axios.post(`/api/professor/pendencias/${alunoId}/confirmar-graduacao`, {
                faixa,
                grau,
                observacoes: observacoes[alunoId] || ''
            });

            showToast(`Graduação confirmada para ${res.data.aluno.faixaAtual} - ${res.data.aluno.grauAtual}º Grau`, 'success');
            setObservacoes(prev => {
                const newObs = { ...prev };
                delete newObs[alunoId];
                return newObs;
            });
            await carregarPendencias();
        } catch (err) {
            showToast(err.response?.data?.message || 'Erro ao confirmar graduação', 'error');
        } finally {
            setConfirmando(null);
        }
    };

    const handleValidarPresenca = async (presencaId) => {
        try {
            await axios.post(`/api/professor/pendencias/presencas/${presencaId}/validar`);
            showToast('Presença validada com sucesso', 'success');
            await carregarPendencias();
        } catch (err) {
            showToast(err.response?.data?.message || 'Erro ao validar presença', 'error');
        }
    };

    if (user?.role !== 'professor' && user?.role !== 'admin') {
        return (
            <div className="card">
                <h2>Acesso Restrito</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                    Esta página é apenas para professores e administradores.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Carregando pendências...</p>
            </div>
        );
    }

    const totalPendencias = pendencias.graduacoes.length + pendencias.presencas.length;

    return (
        <div>
            {/* Toast Notification */}
            {toast && (
                <div className={`toast-notification ${toast.type} show`}>
                    <div className="toast-content">
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: '16px' }}>
                <h2>Pendências</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                    Gerencie graduações pendentes e valide presenças dos alunos.
                </p>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <button
                        className={activeTab === 'graduacoes' ? 'btn primary' : 'btn secondary'}
                        onClick={() => setActiveTab('graduacoes')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'graduacoes' ? '2px solid #1cb0f6' : '2px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'graduacoes' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.7)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer'
                        }}
                    >
                        🎯 Graduações ({pendencias.graduacoes.length})
                    </button>
                    <button
                        className={activeTab === 'presencas' ? 'btn primary' : 'btn secondary'}
                        onClick={() => setActiveTab('presencas')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'presencas' ? '2px solid #1cb0f6' : '2px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'presencas' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.7)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer'
                        }}
                    >
                        ✅ Presenças ({pendencias.presencas.length})
                    </button>
                </div>

                {totalPendencias === 0 && (
                    <div style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: 'rgba(226, 232, 240, 0.7)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <p>Nenhuma pendência no momento!</p>
                    </div>
                )}

                {/* Tab de Graduações */}
                {activeTab === 'graduacoes' && pendencias.graduacoes.length > 0 && (
                    <div>
                        {pendencias.graduacoes.map((pendencia) => (
                            <div key={pendencia.alunoId} className="list-item" style={{
                                marginBottom: '1rem',
                                padding: '1rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '12px'
                            }}>
                                <div className="list-item-content" style={{ flex: 1 }}>
                                    <div className="list-item-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        {pendencia.alunoNome}
                                    </div>
                                    <div className="list-item-subtitle" style={{ marginBottom: '0.5rem' }}>
                                        {pendencia.alunoEmail}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: '1rem',
                                        flexWrap: 'wrap',
                                        marginBottom: '0.75rem'
                                    }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            background: 'rgba(59, 130, 246, 0.2)',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem'
                                        }}>
                                            Atual: {pendencia.faixaAtual} - {pendencia.grauAtual}º Grau
                                        </span>
                                        <span style={{
                                            padding: '4px 8px',
                                            background: 'rgba(34, 197, 94, 0.2)',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            color: '#22c55e'
                                        }}>
                                            → {pendencia.tipo === 'faixa' ? pendencia.proximaFaixa : pendencia.faixaAtual} - {pendencia.proximoGrau}º Grau
                                        </span>
                                        <span style={{
                                            padding: '4px 8px',
                                            background: 'rgba(251, 191, 36, 0.2)',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            color: '#fbbf24'
                                        }}>
                                            {pendencia.diasPresenca}/{pendencia.diasNecessarios} dias
                                        </span>
                                    </div>

                                    <textarea
                                        placeholder="Observações (opcional)"
                                        value={observacoes[pendencia.alunoId] || ''}
                                        onChange={(e) => setObservacoes(prev => ({
                                            ...prev,
                                            [pendencia.alunoId]: e.target.value
                                        }))}
                                        style={{
                                            width: '100%',
                                            minHeight: '60px',
                                            padding: '0.5rem',
                                            background: 'rgba(0, 0, 0, 0.2)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: '#e2e8f0',
                                            fontSize: '0.9rem',
                                            marginBottom: '0.75rem',
                                            resize: 'vertical'
                                        }}
                                    />

                                    <button
                                        className="btn primary"
                                        onClick={() => handleConfirmarGraduacao(
                                            pendencia.alunoId,
                                            pendencia.tipo === 'faixa' ? pendencia.proximaFaixa : pendencia.proximaFaixa,
                                            pendencia.proximoGrau
                                        )}
                                        disabled={confirmando === pendencia.alunoId}
                                        style={{ width: '100%' }}
                                    >
                                        {confirmando === pendencia.alunoId 
                                            ? 'Confirmando...' 
                                            : `✅ Confirmar ${pendencia.tipo === 'faixa' ? 'Faixa' : 'Grau'}`
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab de Presenças */}
                {activeTab === 'presencas' && pendencias.presencas.length > 0 && (
                    <div>
                        {pendencias.presencas.map((presenca) => (
                            <div key={presenca.id} className="list-item" style={{
                                marginBottom: '1rem',
                                padding: '1rem',
                                background: 'rgba(251, 191, 36, 0.1)',
                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                borderRadius: '12px'
                            }}>
                                <div className="list-item-content" style={{ flex: 1 }}>
                                    <div className="list-item-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                        {presenca.alunoNome}
                                    </div>
                                    <div className="list-item-subtitle" style={{ marginBottom: '0.5rem' }}>
                                        {presenca.alunoEmail}
                                    </div>
                                    <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                        Data: {new Date(presenca.data).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    {presenca.localizacao && (
                                        <div style={{
                                            padding: '0.5rem',
                                            background: 'rgba(0, 0, 0, 0.2)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            marginBottom: '0.75rem',
                                            color: 'rgba(226, 232, 240, 0.7)'
                                        }}>
                                            {presenca.localizacao.dentroDoRaio ? (
                                                <span style={{ color: '#22c55e' }}>✅ Dentro do raio permitido</span>
                                            ) : (
                                                <span style={{ color: '#f87171' }}>
                                                    ⚠️ Fora do raio ({presenca.localizacao.distancia ? `${Math.round(presenca.localizacao.distancia)}m` : 'N/A'})
                                                </span>
                                            )}
                                            {presenca.localizacao.latitude && presenca.localizacao.longitude && (
                                                <div style={{ marginTop: '4px' }}>
                                                    Coordenadas: {presenca.localizacao.latitude.toFixed(6)}, {presenca.localizacao.longitude.toFixed(6)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button
                                        className="btn primary"
                                        onClick={() => handleValidarPresenca(presenca.id)}
                                        style={{ width: '100%' }}
                                    >
                                        ✅ Validar Presença
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendenciasPage;

