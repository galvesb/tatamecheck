import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const ConfiguracoesPage = () => {
    const { user } = useAuth();
    const [faixas, setFaixas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingFaixa, setEditingFaixa] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [formData, setFormData] = useState({
        nome: '',
        ordem: 1,
        tempoMinimoMeses: 0,
        tempoMinimoAnos: 0,
        numeroMaximoGraus: 4,
        graus: []
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            carregarFaixas();
        }
    }, [user]);

    const carregarFaixas = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/professor/configuracoes/faixas');
            setFaixas(res.data.faixas || []);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar faixas:', err);
            setError(err.response?.data?.message || 'Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            // Validar tempo mínimo
            const tempoMeses = parseInt(formData.tempoMinimoMeses) || 0;
            const tempoAnos = parseInt(formData.tempoMinimoAnos) || 0;
            if (tempoMeses === 0 && tempoAnos === 0) {
                setError('Pelo menos um tempo mínimo (anos ou meses) deve ser maior que zero');
                return;
            }

            // Validar graus
            if (formData.graus.length === 0) {
                setError('Adicione pelo menos um grau');
                return;
            }

            // Validar que os números dos graus estão em ordem e não duplicados
            const numerosGraus = formData.graus.map(g => g.numero).sort((a, b) => a - b);
            for (let i = 0; i < numerosGraus.length; i++) {
                if (numerosGraus[i] !== i + 1) {
                    setError(`Os graus devem ser numerados sequencialmente a partir de 1 (encontrado: ${numerosGraus[i]})`);
                    return;
                }
            }

            const payload = {
                ...formData,
                ordem: parseInt(formData.ordem),
                tempoMinimoMeses: parseInt(formData.tempoMinimoMeses),
                tempoMinimoAnos: parseInt(formData.tempoMinimoAnos),
                numeroMaximoGraus: parseInt(formData.numeroMaximoGraus),
                graus: formData.graus.map(g => ({
                    numero: parseInt(g.numero),
                    tempoMinimoMeses: parseInt(g.tempoMinimoMeses)
                }))
            };

            await axios.post('/api/professor/configuracoes/faixas', payload);
            setSuccess(editingFaixa ? 'Faixa atualizada com sucesso!' : 'Faixa criada com sucesso!');
            setShowForm(false);
            setEditingFaixa(null);
            resetForm();
            carregarFaixas();
        } catch (err) {
            console.error('Erro ao salvar faixa:', err);
            setError(err.response?.data?.message || 'Erro ao salvar configuração');
        }
    };

    const handleEdit = (faixa) => {
        setEditingFaixa(faixa.nome);
        setFormData({
            nome: faixa.nome,
            ordem: faixa.ordem,
            tempoMinimoMeses: faixa.tempoMinimoMeses,
            tempoMinimoAnos: faixa.tempoMinimoAnos || 0,
            numeroMaximoGraus: faixa.numeroMaximoGraus,
            graus: [...faixa.graus]
        });
        setShowForm(true);
    };

    const handleDelete = async (nome) => {
        if (!window.confirm(`Tem certeza que deseja deletar a faixa "${nome}"?`)) {
            return;
        }

        try {
            await axios.delete(`/api/professor/configuracoes/faixas/${nome}`);
            setSuccess('Faixa deletada com sucesso!');
            carregarFaixas();
        } catch (err) {
            console.error('Erro ao deletar faixa:', err);
            setError(err.response?.data?.message || 'Erro ao deletar faixa');
        }
    };

    const resetForm = () => {
        setFormData({
            nome: '',
            ordem: faixas.length + 1,
            tempoMinimoMeses: 0,
            tempoMinimoAnos: 0,
            numeroMaximoGraus: 4,
            graus: []
        });
    };

    const adicionarGrau = () => {
        const novoNumero = formData.graus.length + 1;
        if (novoNumero > formData.numeroMaximoGraus) {
            setError(`Número máximo de graus é ${formData.numeroMaximoGraus}`);
            return;
        }
        setFormData({
            ...formData,
            graus: [...formData.graus, { numero: novoNumero, tempoMinimoMeses: 2 }]
        });
    };

    const removerGrau = (index) => {
        const novosGraus = formData.graus.filter((_, i) => i !== index)
            .map((g, i) => ({ ...g, numero: i + 1 })); // Renumerar
        setFormData({ ...formData, graus: novosGraus });
    };

    const atualizarGrau = (index, campo, valor) => {
        const novosGraus = [...formData.graus];
        novosGraus[index] = { ...novosGraus[index], [campo]: valor };
        setFormData({ ...formData, graus: novosGraus });
    };

    if (user?.role !== 'admin') {
        return (
            <div className="card">
                <h2>Acesso Restrito</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                    Apenas administradores podem acessar as configurações.
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
            <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'stretch' : 'center', 
                    gap: isMobile ? '1rem' : '0',
                    marginBottom: '1rem' 
                }}>
                    <h2 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem' }}>Configurações de Faixas e Graus</h2>
                    <button
                        className="btn primary"
                        onClick={() => {
                            resetForm();
                            setEditingFaixa(null);
                            setShowForm(true);
                        }}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                    >
                        ➕ Nova Faixa
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'rgba(244, 63, 94, 0.15)',
                        color: '#f87171',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

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

                {!showForm && faixas.length === 0 && (
                    <p style={{ color: 'rgba(226, 232, 240, 0.7)', textAlign: 'center', padding: '2rem' }}>
                        Nenhuma faixa configurada. Clique em "Nova Faixa" para começar.
                    </p>
                )}

                {!showForm && faixas.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {faixas.map((faixa) => (
                            <div
                                key={faixa.nome}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                            >
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between', 
                                    alignItems: isMobile ? 'stretch' : 'start', 
                                    gap: isMobile ? '1rem' : '0.5rem',
                                    marginBottom: '0.5rem' 
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, marginBottom: '0.5rem', fontSize: isMobile ? '1rem' : '1.2rem' }}>
                                            {faixa.ordem}. {faixa.nome}
                                        </h3>
                                        <p style={{ 
                                            color: 'rgba(226, 232, 240, 0.7)', 
                                            fontSize: isMobile ? '0.8rem' : '0.9rem', 
                                            margin: 0,
                                            lineHeight: '1.4'
                                        }}>
                                            Tempo mínimo: {faixa.tempoMinimoAnos > 0 && `${faixa.tempoMinimoAnos} ano(s) e `}{faixa.tempoMinimoMeses} mês(es)
                                            {!isMobile && ' | '}
                                            {isMobile && <br />}
                                            Máximo de graus: {faixa.numeroMaximoGraus}
                                        </p>
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: isMobile ? 'column' : 'row',
                                        gap: '0.5rem',
                                        width: isMobile ? '100%' : 'auto'
                                    }}>
                                        <button
                                            className="btn secondary"
                                            style={{ 
                                                padding: '0.5rem 1rem', 
                                                fontSize: '0.85rem',
                                                width: isMobile ? '100%' : 'auto'
                                            }}
                                            onClick={() => handleEdit(faixa)}
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ 
                                                padding: '0.5rem 1rem', 
                                                fontSize: '0.85rem',
                                                background: 'rgba(244, 63, 94, 0.2)',
                                                color: '#f87171',
                                                border: '1px solid rgba(244, 63, 94, 0.3)',
                                                width: isMobile ? '100%' : 'auto'
                                            }}
                                            onClick={() => handleDelete(faixa.nome)}
                                        >
                                            🗑️ Deletar
                                        </button>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <p style={{ color: 'rgba(226, 232, 240, 0.6)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                        Graus configurados:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {faixa.graus.map((grau, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(59, 130, 246, 0.15)',
                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {grau.numero}º Grau: {grau.tempoMinimoMeses} mês(es)
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulário de Cadastro/Edição */}
            {showForm && (
                <div className="card">
                    <h2 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem' }}>{editingFaixa ? 'Editar Faixa' : 'Nova Faixa'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                    Nome da Faixa *
                                </label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                    disabled={!!editingFaixa}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: '#fff'
                                    }}
                                />
                            </div>

                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                                gap: '1rem' 
                            }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                        Ordem *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.ordem}
                                        onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#fff',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                        Número Máximo de Graus *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.numeroMaximoGraus}
                                        onChange={(e) => setFormData({ ...formData, numeroMaximoGraus: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#fff',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                                gap: '1rem' 
                            }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                        Tempo Mínimo (Anos)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.tempoMinimoAnos}
                                        onChange={(e) => setFormData({ ...formData, tempoMinimoAnos: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#fff',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                        Tempo Mínimo (Meses) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.tempoMinimoMeses}
                                        onChange={(e) => setFormData({ ...formData, tempoMinimoMeses: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#fff',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between', 
                                    alignItems: isMobile ? 'stretch' : 'center', 
                                    gap: isMobile ? '0.75rem' : '0.5rem',
                                    marginBottom: '0.5rem' 
                                }}>
                                    <label style={{ 
                                        color: 'rgba(226, 232, 240, 0.9)',
                                        fontSize: isMobile ? '0.9rem' : '1rem'
                                    }}>
                                        Graus ({formData.graus.length}/{formData.numeroMaximoGraus}) *
                                    </label>
                                    <button
                                        type="button"
                                        className="btn secondary"
                                        style={{ 
                                            padding: '0.5rem 1rem', 
                                            fontSize: '0.85rem',
                                            width: isMobile ? '100%' : 'auto'
                                        }}
                                        onClick={adicionarGrau}
                                        disabled={formData.graus.length >= formData.numeroMaximoGraus}
                                    >
                                        ➕ Adicionar Grau
                                    </button>
                                </div>

                                {formData.graus.length === 0 && (
                                    <p style={{ color: 'rgba(226, 232, 240, 0.5)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                        Nenhum grau adicionado. Clique em "Adicionar Grau" para começar.
                                    </p>
                                )}

                                {formData.graus.map((grau, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: isMobile ? '1fr auto' : '100px 1fr auto',
                                            gap: '0.5rem',
                                            alignItems: 'center',
                                            marginBottom: '0.5rem',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        <span style={{ 
                                            color: 'rgba(226, 232, 240, 0.7)', 
                                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                                            gridColumn: isMobile ? '1 / -1' : 'auto'
                                        }}>
                                            {grau.numero}º Grau
                                        </span>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Meses"
                                            value={grau.tempoMinimoMeses}
                                            onChange={(e) => atualizarGrau(index, 'tempoMinimoMeses', e.target.value)}
                                            required
                                            style={{
                                                padding: '0.5rem',
                                                borderRadius: '6px',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: '#fff',
                                                fontSize: '1rem',
                                                width: '100%'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removerGrau(index)}
                                            style={{
                                                padding: isMobile ? '0.5rem 1rem' : '0.5rem',
                                                background: 'rgba(244, 63, 94, 0.2)',
                                                color: '#f87171',
                                                border: '1px solid rgba(244, 63, 94, 0.3)',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: isMobile ? '0.85rem' : '1rem',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {isMobile ? '🗑️ Remover' : '🗑️'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: '1rem' 
                        }}>
                            <button type="submit" className="btn primary" style={{ 
                                flex: 1,
                                width: isMobile ? '100%' : 'auto'
                            }}>
                                {editingFaixa ? '💾 Salvar Alterações' : '✅ Criar Faixa'}
                            </button>
                            <button
                                type="button"
                                className="btn secondary"
                                style={{ 
                                    flex: 1,
                                    width: isMobile ? '100%' : 'auto'
                                }}
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingFaixa(null);
                                    resetForm();
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ConfiguracoesPage;

