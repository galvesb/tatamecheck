import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import CheckInMap from '../../components/CheckInMap';
import '../../index.css';

const PresencaPage = () => {
    const { user } = useAuth();
    const [checkInStatus, setCheckInStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progresso, setProgresso] = useState(null);
    const [presencas, setPresencas] = useState([]);
    const [graduacoes, setGraduacoes] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [mapKey, setMapKey] = useState(0);

    // Carregar dados do aluno
    useEffect(() => {
        if (user?.role === 'aluno') {
            carregarDadosAluno();
        }
    }, [user]);

    // Se não for aluno, mostrar painel de professor/admin
    if (user?.role !== 'aluno') {
        return (
            <div>
                <div className="card" style={{ marginBottom: '16px' }}>
                    <h2>Painel de Presença e Progressão</h2>
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                        Visualize o progresso dos alunos e identifique quem está elegível para graduação.
                    </p>
                    <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.9rem' }}>
                        Acesse o módulo "Alunos" para gerenciar os cadastros e visualizar detalhes.
                    </p>
                </div>
            </div>
        );
    }

    const carregarDadosAluno = async () => {
        if (!user || user.role !== 'aluno') {
            setLoadingData(false);
            return;
        }

        try {
            setLoadingData(true);
            const [progressoRes, presencasRes, graduacoesRes] = await Promise.all([
                axios.get('/api/aluno/progresso').catch(err => {
                    console.error('Erro ao carregar progresso:', err);
                    // Se for erro 404, o aluno pode não ter perfil ainda
                    if (err.response?.status === 404) {
                        return { data: null };
                    }
                    return { data: null };
                }),
                axios.get('/api/aluno/presenca').catch(err => {
                    console.error('Erro ao carregar presenças:', err);
                    return { data: { presencas: [] } };
                }),
                axios.get('/api/aluno/graduacoes').catch(err => {
                    console.error('Erro ao carregar graduações:', err);
                    return { data: { graduacoes: [] } };
                })
            ]);
            setProgresso(progressoRes.data);
            setPresencas(presencasRes.data?.presencas || []);
            setGraduacoes(graduacoesRes.data?.graduacoes || []);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleCheckInClick = () => {
        setMapKey(prev => prev + 1); // Força remontagem do mapa
        setShowMap(true);
        setCheckInStatus(null);
    };

    const handleCheckInSuccess = (data) => {
        setCheckInStatus({ 
            success: true, 
            message: data.message,
            progresso: data.progresso
        });
        setShowMap(false);
        carregarDadosAluno();
    };

    const handleMapClose = () => {
        setShowMap(false);
        // Forçar remontagem do mapa na próxima abertura
        setTimeout(() => {
            // Pequeno delay para garantir que o componente seja desmontado
        }, 100);
    };

    return (
        <div>
            {/* Modal do Mapa */}
            {showMap && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '1rem'
                }} key={`modal-${mapKey}`}>
                    <div style={{ 
                        width: '100%', 
                        maxWidth: '800px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }} key={`map-wrapper-${mapKey}`}>
                        <CheckInMap 
                            key={`checkin-map-${mapKey}-${Date.now()}`}
                            onCheckIn={handleCheckInSuccess}
                            onClose={handleMapClose}
                        />
                    </div>
                </div>
            )}

            {/* Card de Check-in para Alunos */}
            {user?.role === 'aluno' && (
                <>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <h2>Check-in de Presença</h2>
                        <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                            Faça check-in quando estiver na academia. O sistema verifica sua localização via GPS.
                        </p>
                        <button 
                            className="btn primary" 
                            onClick={handleCheckInClick}
                        >
                            📍 Fazer Check-in
                        </button>
                        {checkInStatus && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '12px',
                                borderRadius: '12px',
                                background: checkInStatus.success 
                                    ? 'rgba(34, 197, 94, 0.15)' 
                                    : 'rgba(244, 63, 94, 0.15)',
                                color: checkInStatus.success ? '#22c55e' : '#f87171',
                                border: `1px solid ${checkInStatus.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                            }}>
                                {checkInStatus.message}
                                {checkInStatus.progresso && (
                                    <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                                        Progresso: {checkInStatus.progresso.diasPresenca}/{checkInStatus.progresso.diasNecessarios} dias
                                        {checkInStatus.progresso.diasRestantes > 0 && (
                                            <span> • Faltam {checkInStatus.progresso.diasRestantes} dias</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Progresso do Aluno */}
                    {loadingData ? (
                        <div className="card">
                            <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Carregando...</p>
                        </div>
                    ) : progresso ? (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h2>Meu Progresso</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="stats-card">
                                    <div className="stats-value" style={{ fontSize: '1.5rem' }}>
                                        {progresso.faixaAtual}
                                    </div>
                                    <div className="stats-label">Faixa Atual</div>
                                </div>
                                <div className="stats-card">
                                    <div className="stats-value" style={{ fontSize: '1.5rem' }}>
                                        {progresso.grauAtual}
                                    </div>
                                    <div className="stats-label">Grau Atual</div>
                                </div>
                                <div className="stats-card">
                                    <div className="stats-value" style={{ color: '#60a5fa' }}>
                                        {progresso.diasPresenca}
                                    </div>
                                    <div className="stats-label">Dias de Presença</div>
                                </div>
                                <div className="stats-card">
                                    <div className="stats-value" style={{ color: progresso.elegivel ? '#22c55e' : '#fbbf24' }}>
                                        {progresso.diasRestantes}
                                    </div>
                                    <div className="stats-label">Dias Restantes</div>
                                </div>
                            </div>

                            {/* Barra de Progresso */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    marginBottom: '0.5rem',
                                    fontSize: '0.9rem',
                                    color: 'rgba(226, 232, 240, 0.7)'
                                }}>
                                    <span>Progresso para próxima graduação</span>
                                    <span>{progresso.percentualProgresso}%</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${progresso.percentualProgresso}%`,
                                        height: '100%',
                                        background: progresso.elegivel 
                                            ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                                            : 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                                        transition: 'width 0.3s ease'
                                    }}></div>
                                </div>
                            </div>

                            {progresso.elegivel && (
                                <div style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: 'rgba(34, 197, 94, 0.15)',
                                    color: '#22c55e',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    textAlign: 'center',
                                    fontWeight: 600
                                }}>
                                    ✅ Você está elegível para avaliação!
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h2>Meu Progresso</h2>
                            <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                                Seu perfil de aluno está sendo configurado. Entre em contato com o administrador se o problema persistir.
                            </p>
                        </div>
                    )}

                    {/* Histórico de Presenças */}
                    {presencas.length > 0 && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <h3>Histórico de Presenças</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {presencas.slice(0, 30).map((presenca) => (
                                    <div key={presenca.id} className="list-item">
                                        <div className="list-item-icon">✅</div>
                                        <div className="list-item-content">
                                            <div className="list-item-title">
                                                {new Date(presenca.data).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            <div className="list-item-subtitle">
                                                {presenca.validada ? 'Validada' : 'Pendente'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Histórico de Graduações */}
                    {graduacoes.length > 0 && (
                        <div className="card">
                            <h3>Histórico de Graduações</h3>
                            {graduacoes.map((graduacao) => (
                                <div key={graduacao.id} className="list-item">
                                    <div className="list-item-icon">🎯</div>
                                    <div className="list-item-content">
                                        <div className="list-item-title">
                                            {graduacao.faixa} - {graduacao.grau}º Grau
                                        </div>
                                        <div className="list-item-subtitle">
                                            {new Date(graduacao.data).toLocaleDateString('pt-BR')} • 
                                            {graduacao.avaliadoPor && ` Avaliado por: ${graduacao.avaliadoPor}`}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

        </div>
    );
};

export default PresencaPage;

