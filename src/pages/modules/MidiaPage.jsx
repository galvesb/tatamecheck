import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const MidiaPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('feed');

    // Mock data - substituir por dados reais da API
    const posts = [
        { 
            id: 1, 
            autor: 'Professor João', 
            tipo: 'comunicado',
            titulo: 'Aula Especial de Finalização',
            conteudo: 'Nesta sexta-feira teremos uma aula especial focada em finalizações. Não percam!',
            data: '2024-01-15',
            fixado: true,
            curtidas: 12,
            comentarios: 3
        },
        { 
            id: 2, 
            autor: 'Admin', 
            tipo: 'foto',
            titulo: 'Treino de Hoje',
            conteudo: 'Fotos do treino de hoje!',
            data: '2024-01-14',
            fixado: false,
            curtidas: 25,
            comentarios: 5
        },
        { 
            id: 3, 
            autor: 'Professor Maria', 
            tipo: 'evento',
            titulo: 'Seminário de Jiu-Jitsu',
            conteudo: 'No próximo sábado teremos um seminário especial. Inscrições abertas!',
            data: '2024-01-13',
            fixado: false,
            curtidas: 8,
            comentarios: 2
        },
    ];

    const eventos = [
        { id: 1, titulo: 'Aula Regular', horario: '19:00', dia: 'Segunda a Sexta' },
        { id: 2, titulo: 'Aula Kids', horario: '17:00', dia: 'Terça e Quinta' },
        { id: 3, titulo: 'Seminário de Finalização', horario: '10:00', dia: 'Sábado, 20/01' },
    ];

    return (
        <div>
            {/* Feed de Notícias */}
            {activeTab === 'feed' && (
                <div>
                    {(user?.role === 'admin' || user?.role === 'professor') && (
                        <div className="card" style={{ marginBottom: '16px' }}>
                            <button className="btn primary" style={{ width: '100%', margin: 0 }}>
                                + Criar Nova Postagem
                            </button>
                        </div>
                    )}

                    {/* Posts Fixados */}
                    {posts.filter(p => p.fixado).map(post => (
                        <div key={post.id} className="card" style={{ 
                            marginBottom: '16px',
                            border: '2px solid rgba(251, 191, 36, 0.4)',
                            background: 'rgba(251, 191, 36, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <span className="badge warning">📌 Fixado</span>
                                <span style={{ color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.85rem' }}>
                                    {post.autor} • {new Date(post.data).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <h3 style={{ margin: '0.5rem 0' }}>{post.titulo}</h3>
                            <p style={{ color: 'rgba(226, 232, 240, 0.8)', marginBottom: '1rem' }}>
                                {post.conteudo}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.9rem' }}>
                                <span>👍 {post.curtidas}</span>
                                <span>💬 {post.comentarios}</span>
                            </div>
                        </div>
                    ))}

                    {/* Posts Normais */}
                    {posts.filter(p => !p.fixado).map(post => (
                        <div key={post.id} className="card" style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                <span style={{ color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.85rem' }}>
                                    {post.autor} • {new Date(post.data).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <h3 style={{ margin: '0.5rem 0' }}>{post.titulo}</h3>
                            <p style={{ color: 'rgba(226, 232, 240, 0.8)', marginBottom: '1rem' }}>
                                {post.conteudo}
                            </p>
                            <div style={{ display: 'flex', gap: '16px', color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.9rem' }}>
                                <span>👍 {post.curtidas}</span>
                                <span>💬 {post.comentarios}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Agenda */}
            {activeTab === 'agenda' && (
                <div className="card">
                    <h2>Agenda de Aulas e Eventos</h2>
                    {eventos.map(evento => (
                        <div key={evento.id} className="list-item">
                            <div className="list-item-icon">📅</div>
                            <div className="list-item-content">
                                <div className="list-item-title">{evento.titulo}</div>
                                <div className="list-item-subtitle">
                                    {evento.dia} • {evento.horario}
                                </div>
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
                    className={`btn ${activeTab === 'feed' ? 'primary' : 'ghost'}`}
                    style={{ flex: 1, margin: 0, padding: '8px' }}
                    onClick={() => setActiveTab('feed')}
                >
                    Feed
                </button>
                <button
                    className={`btn ${activeTab === 'agenda' ? 'primary' : 'ghost'}`}
                    style={{ flex: 1, margin: 0, padding: '8px' }}
                    onClick={() => setActiveTab('agenda')}
                >
                    Agenda
                </button>
            </div>
        </div>
    );
};

export default MidiaPage;

