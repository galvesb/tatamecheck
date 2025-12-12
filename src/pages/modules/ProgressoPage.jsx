import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const ProgressoPage = () => {
    const { user } = useAuth();
    const [progresso, setProgresso] = useState(null);
    const [presencas, setPresencas] = useState([]);
    const [graduacoes, setGraduacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'aluno') {
            carregarDados();
        }
    }, [user]);

    const carregarDados = async () => {
        if (!user || user.role !== 'aluno') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const [progressoRes, presencasRes, graduacoesRes] = await Promise.all([
                axios.get('/api/aluno/progresso').catch(err => {
                    console.error('Erro ao carregar progresso:', err);
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
            setLoading(false);
        }
    };

    if (user?.role !== 'aluno') {
        return (
            <div className="card">
                <h2>Acesso Restrito</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                    Esta página é apenas para alunos.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Carregando...</p>
            </div>
        );
    }

    if (!progresso) {
        return (
            <div className="card">
                <h2>Meu Progresso</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                    Seu perfil de aluno está sendo configurado. Entre em contato com o administrador se o problema persistir.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Progresso do Aluno */}
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

                {/* Tempo Restante para Próximo Grau */}
                {progresso.tempoRestanteProximoGrau && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '12px',
                        borderRadius: '12px',
                        background: progresso.tempoRestanteProximoGrau.completo 
                            ? 'rgba(34, 197, 94, 0.15)' 
                            : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${progresso.tempoRestanteProximoGrau.completo 
                            ? 'rgba(34, 197, 94, 0.3)' 
                            : 'rgba(59, 130, 246, 0.2)'}`,
                        fontSize: '0.9rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <strong>
                                Próximo Grau: {progresso.proximoGrau || `${progresso.grauAtual + 1}º Grau`}
                            </strong>
                            {progresso.tempoRestanteProximoGrau.completo ? (
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ Elegível</span>
                            ) : (
                                <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                                    {progresso.tempoRestanteProximoGrau.meses} mês(es) restante(s)
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Tempo decorrido: {progresso.tempoRestanteProximoGrau.mesesDecorridos} de {progresso.tempoRestanteProximoGrau.mesesNecessarios} meses necessários
                        </div>
                    </div>
                )}

                {/* Tempo Restante para Próxima Faixa */}
                {progresso.tempoRestanteProximaFaixa && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '12px',
                        borderRadius: '12px',
                        background: progresso.tempoRestanteProximaFaixa.completo 
                            ? 'rgba(34, 197, 94, 0.15)' 
                            : 'rgba(251, 191, 36, 0.1)',
                        border: `1px solid ${progresso.tempoRestanteProximaFaixa.completo 
                            ? 'rgba(34, 197, 94, 0.3)' 
                            : 'rgba(251, 191, 36, 0.3)'}`,
                        fontSize: '0.9rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <strong>
                                Próxima Faixa: {progresso.tempoRestanteProximaFaixa.nomeFaixa || progresso.proximaFaixa}
                            </strong>
                            {progresso.tempoRestanteProximaFaixa.completo ? (
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ Elegível</span>
                            ) : (
                                <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                                    {progresso.tempoRestanteProximaFaixa.meses} mês(es) restante(s)
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Tempo decorrido: {progresso.tempoRestanteProximaFaixa.mesesDecorridos} de {progresso.tempoRestanteProximaFaixa.mesesNecessarios} meses necessários
                        </div>
                    </div>
                )}

                {progresso.elegivel && !progresso.tempoRestanteProximoGrau && !progresso.tempoRestanteProximaFaixa && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        textAlign: 'center',
                        fontWeight: 600,
                        marginTop: '1rem'
                    }}>
                        ✅ Você está elegível para avaliação!
                    </div>
                )}

                {progresso.ultimaGraduacao && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        fontSize: '0.9rem'
                    }}>
                        <strong>Última Graduação:</strong> {progresso.ultimaGraduacao.faixa} - {progresso.ultimaGraduacao.grau}º Grau
                        <br />
                        <span style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                            {new Date(progresso.ultimaGraduacao.data).toLocaleDateString('pt-BR')}
                            {progresso.ultimaGraduacao.avaliadoPor && ` • Avaliado por: ${progresso.ultimaGraduacao.avaliadoPor}`}
                        </span>
                    </div>
                )}
            </div>

            {/* Histórico de Presenças */}
            {presencas.length > 0 && (
                <div className="card" style={{ marginBottom: '16px' }}>
                    <h3>Histórico de Presenças</h3>
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Últimas {Math.min(30, presencas.length)} presenças registradas
                    </p>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Todas as suas graduações conquistadas
                    </p>
                    {graduacoes.map((graduacao) => (
                        <div key={graduacao.id} className="list-item">
                            <div className="list-item-icon">🎯</div>
                            <div className="list-item-content">
                                <div className="list-item-title">
                                    {graduacao.faixa} - {graduacao.grau}º Grau
                                </div>
                                <div className="list-item-subtitle">
                                    {new Date(graduacao.data).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                    {graduacao.avaliadoPor && ` • Avaliado por: ${graduacao.avaliadoPor}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {presencas.length === 0 && graduacoes.length === 0 && (
                <div className="card">
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', textAlign: 'center' }}>
                        Ainda não há histórico de presenças ou graduações.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProgressoPage;

