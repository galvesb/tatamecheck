import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const HistoricoGraduacoesPage = () => {
    const { user } = useAuth();
    const [graduacoes, setGraduacoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'aluno') {
            carregarGraduacoes();
        }
    }, [user]);

    const carregarGraduacoes = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/aluno/graduacoes');
            setGraduacoes(res.data?.graduacoes || []);
        } catch (err) {
            console.error('Erro ao carregar graduações:', err);
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

    return (
        <div>
            <div className="card">
                <h2>Histórico de Graduações</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Todas as suas graduações conquistadas
                </p>
                {graduacoes.length === 0 ? (
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', textAlign: 'center', padding: '2rem' }}>
                        Ainda não há histórico de graduações.
                    </p>
                ) : (
                    <div>
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
                                        {graduacao.observacoes && (
                                            <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.6)' }}>
                                                {graduacao.observacoes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoricoGraduacoesPage;

