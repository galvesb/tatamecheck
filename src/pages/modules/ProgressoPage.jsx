import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const ProgressoPage = () => {
    const { user } = useAuth();
    const [progresso, setProgresso] = useState(null);
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
            const progressoRes = await axios.get('/api/aluno/progresso').catch(err => {
                console.error('Erro ao carregar progresso:', err);
                if (err.response?.status === 404) {
                    return { data: null };
                }
                return { data: null };
            });
            setProgresso(progressoRes.data);
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
        <div style={{ width: '100%' }}>
            {/* Progresso do Aluno */}
            <div className="card" style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}>
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
                        fontSize: '0.9rem',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <strong>
                                Próximo Grau: {progresso.proximoGrau || `${progresso.grauAtual + 1}º Grau`}
                            </strong>
                            {progresso.tempoRestanteProximoGrau.completo ? (
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ Elegível</span>
                            ) : (
                                <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                                    {progresso.tempoRestanteProximoGrau.dias} dia(s) restante(s)
                                </span>
                            )}
                        </div>
                        
                        {/* Barra de Progresso para Próximo Grau */}
                        {(() => {
                            const percentual = progresso.tempoRestanteProximoGrau.diasNecessarios > 0
                                ? Math.min(100, Math.round((progresso.tempoRestanteProximoGrau.diasPresenca / progresso.tempoRestanteProximoGrau.diasNecessarios) * 100))
                                : 0;
                            
                            return (
                                <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        marginBottom: '0.5rem',
                                        fontSize: '0.85rem',
                                        color: 'rgba(226, 232, 240, 0.7)'
                                    }}>
                                        <span>
                                            {progresso.tempoRestanteProximoGrau.diasPresenca} de {progresso.tempoRestanteProximoGrau.diasNecessarios} dias
                                        </span>
                                        <span>{percentual}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '12px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentual}%`,
                                            height: '100%',
                                            background: progresso.tempoRestanteProximoGrau.completo 
                                                ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                                                : 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })()}
                        
                        <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            {progresso.tempoRestanteProximoGrau.mesesNecessarios && (
                                <span>Requisito: {progresso.tempoRestanteProximoGrau.mesesNecessarios} mês(es) ({progresso.tempoRestanteProximoGrau.diasNecessarios} dias)</span>
                            )}
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
                            : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${progresso.tempoRestanteProximaFaixa.completo 
                            ? 'rgba(34, 197, 94, 0.3)' 
                            : 'rgba(59, 130, 246, 0.2)'}`,
                        fontSize: '0.9rem',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <strong>
                                Próxima Faixa: {progresso.tempoRestanteProximaFaixa.nomeFaixa || progresso.proximaFaixa || 'N/A'}
                            </strong>
                            {progresso.tempoRestanteProximaFaixa.completo ? (
                                <span style={{ color: '#22c55e', fontWeight: 600 }}>✅ Elegível</span>
                            ) : (
                                <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                                    {progresso.tempoRestanteProximaFaixa.dias} dia(s) restante(s)
                                </span>
                            )}
                        </div>
                        
                        {/* Barra de Progresso para Próxima Faixa */}
                        {(() => {
                            const percentual = progresso.tempoRestanteProximaFaixa.diasNecessarios > 0
                                ? Math.min(100, Math.round((progresso.tempoRestanteProximaFaixa.diasPresenca / progresso.tempoRestanteProximaFaixa.diasNecessarios) * 100))
                                : 0;
                            
                            return (
                                <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        marginBottom: '0.5rem',
                                        fontSize: '0.85rem',
                                        color: 'rgba(226, 232, 240, 0.7)'
                                    }}>
                                        <span>
                                            {progresso.tempoRestanteProximaFaixa.diasPresenca} de {progresso.tempoRestanteProximaFaixa.diasNecessarios} dias
                                        </span>
                                        <span>{percentual}%</span>
                                    </div>
                                    <div style={{
                                        width: '100%',
                                        height: '12px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${percentual}%`,
                                            height: '100%',
                                            background: progresso.tempoRestanteProximaFaixa.completo 
                                                ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
                                                : 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })()}
                        
                        <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            {progresso.tempoRestanteProximaFaixa.mesesNecessarios && (
                                <span>Requisito: {progresso.tempoRestanteProximaFaixa.mesesNecessarios} mês(es) ({progresso.tempoRestanteProximaFaixa.diasNecessarios} dias)</span>
                            )}
                        </div>
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
        </div>
    );
};

export default ProgressoPage;

