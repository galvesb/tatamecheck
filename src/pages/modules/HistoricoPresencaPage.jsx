import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const HistoricoPresencaPage = () => {
    const { user } = useAuth();
    const [presencas, setPresencas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'aluno') {
            carregarPresencas();
        }
    }, [user]);

    const carregarPresencas = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/aluno/presenca');
            setPresencas(res.data?.presencas || []);
        } catch (err) {
            console.error('Erro ao carregar presenças:', err);
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
                <h2>Histórico de Presenças</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Todas as suas presenças registradas
                </p>
                {presencas.length === 0 ? (
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', textAlign: 'center', padding: '2rem' }}>
                        Ainda não há histórico de presenças.
                    </p>
                ) : (
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {presencas.map((presenca) => (
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
                                        {presenca.validada ? '✅ Validada' : '⏳ Pendente'}
                                        {presenca.localizacao && (
                                            <>
                                                {presenca.localizacao.dentroDoRaio ? (
                                                    <span style={{ color: '#22c55e', marginLeft: '8px' }}>
                                                        • Dentro do raio
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#f87171', marginLeft: '8px' }}>
                                                        • Fora do raio
                                                    </span>
                                                )}
                                                {presenca.localizacao.distancia && (
                                                    <span style={{ marginLeft: '8px' }}>
                                                        ({Math.round(presenca.localizacao.distancia)}m)
                                                    </span>
                                                )}
                                            </>
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

export default HistoricoPresencaPage;

