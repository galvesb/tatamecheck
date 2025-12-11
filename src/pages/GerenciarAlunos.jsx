import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const GerenciarAlunos = () => {
    const { user } = useAuth();
    const [alunos, setAlunos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        faixaInicial: 'Branca',
        grauInicial: 0
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        carregarAlunos();
    }, []);

    const carregarAlunos = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/professor/alunos');
            setAlunos(res.data.alunos || []);
        } catch (err) {
            console.error('Erro ao carregar alunos:', err);
            setError('Erro ao carregar lista de alunos');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await axios.post('/api/professor/alunos', formData);
            setSuccess('Aluno cadastrado com sucesso!');
            setFormData({
                name: '',
                email: '',
                password: '',
                faixaInicial: 'Branca',
                grauInicial: 0
            });
            setShowForm(false);
            carregarAlunos();
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao cadastrar aluno');
        }
    };

    if (loading) {
        return (
            <div className="card">
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>Carregando...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Gerenciar Alunos</h2>
                    <button 
                        className="btn primary" 
                        style={{ width: 'auto', margin: 0, padding: '8px 16px' }}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? '✕ Cancelar' : '+ Cadastrar Aluno'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        {error && <p className="auth-error">{error}</p>}
                        {success && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '12px',
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#22c55e',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                marginBottom: '1rem'
                            }}>
                                {success}
                            </div>
                        )}

                        <div className="auth-form">
                            <label>
                                <span>Nome Completo</span>
                                <input
                                    type="text"
                                    placeholder="Nome do aluno"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                <span>E-mail</span>
                                <input
                                    type="email"
                                    placeholder="aluno@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </label>
                            <label>
                                <span>Senha Inicial</span>
                                <input
                                    type="password"
                                    placeholder="Senha temporária"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <label>
                                    <span>Faixa Inicial</span>
                                    <select
                                        className="form-select"
                                        value={formData.faixaInicial}
                                        onChange={(e) => setFormData({ ...formData, faixaInicial: e.target.value })}
                                    >
                                        <option value="Branca">Branca</option>
                                        <option value="Azul">Azul</option>
                                        <option value="Roxa">Roxa</option>
                                        <option value="Marrom">Marrom</option>
                                        <option value="Preta">Preta</option>
                                    </select>
                                </label>
                                <label>
                                    <span>Grau Inicial</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="4"
                                        value={formData.grauInicial}
                                        onChange={(e) => setFormData({ ...formData, grauInicial: parseInt(e.target.value) || 0 })}
                                        required
                                    />
                                </label>
                            </div>
                            <button type="submit" className="btn primary" style={{ marginTop: '1rem' }}>
                                Cadastrar Aluno
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Lista de Alunos */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>
                    Alunos Cadastrados ({alunos.length})
                </h3>
                {alunos.length === 0 ? (
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', textAlign: 'center', padding: '2rem' }}>
                        Nenhum aluno cadastrado ainda.
                    </p>
                ) : (
                    <div>
                        {alunos.map((aluno) => (
                            <div key={aluno.id} className="list-item">
                                <div className="list-item-icon">
                                    {aluno.elegivel ? '✅' : '⏳'}
                                </div>
                                <div className="list-item-content">
                                    <div className="list-item-title">{aluno.name}</div>
                                    <div className="list-item-subtitle">
                                        {aluno.email} • {aluno.faixaAtual} - {aluno.grauAtual}º Grau
                                    </div>
                                    <div className="list-item-subtitle" style={{ marginTop: '4px' }}>
                                        {aluno.diasPresenca}/{aluno.diasNecessarios} dias de presença
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {aluno.elegivel && (
                                        <span className="badge success" style={{ display: 'block', marginBottom: '4px' }}>
                                            Apto
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.6)' }}>
                                        {aluno.academia}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GerenciarAlunos;

