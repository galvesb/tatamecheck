import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const FinanceiroPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Estados para dados
    const [resumo, setResumo] = useState(null);
    const [despesas, setDespesas] = useState([]);
    const [receitas, setReceitas] = useState([]);
    const [pagamentosReceber, setPagamentosReceber] = useState([]);
    const [alunos, setAlunos] = useState([]);
    
    // Estados para formulários
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    
    // Estados para filtros
    const [filtros, setFiltros] = useState({
        dataInicio: '',
        dataFim: '',
        categoria: '',
        status: '',
        alunoId: ''
    });
    const [showFiltros, setShowFiltros] = useState(false);

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'professor')) {
            carregarResumo();
            carregarAlunos();
        }
    }, [user]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (activeTab === 'despesas') {
            carregarDespesas();
        } else if (activeTab === 'receitas') {
            carregarReceitas();
        } else if (activeTab === 'pagamentos') {
            carregarPagamentosReceber();
        } else if (activeTab === 'overview') {
            carregarResumo();
        }
    }, [activeTab, filtros]);

    const carregarAlunos = async () => {
        try {
            const res = await axios.get('/api/professor/alunos');
            setAlunos(res.data.alunos || []);
        } catch (err) {
            console.error('Erro ao carregar alunos:', err);
        }
    };

    const carregarResumo = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;
            
            const res = await axios.get('/api/financeiro/resumo', { params });
            setResumo(res.data);
        } catch (err) {
            console.error('Erro ao carregar resumo:', err);
            setError('Erro ao carregar resumo financeiro');
        } finally {
            setLoading(false);
        }
    };

    const carregarDespesas = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;
            if (filtros.categoria) params.categoria = filtros.categoria;
            if (filtros.status) params.pago = filtros.status === 'pago';
            
            const res = await axios.get('/api/financeiro/despesas', { params });
            setDespesas(res.data.despesas || []);
        } catch (err) {
            console.error('Erro ao carregar despesas:', err);
            setError('Erro ao carregar despesas');
        } finally {
            setLoading(false);
        }
    };

    const carregarReceitas = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;
            if (filtros.categoria) params.categoria = filtros.categoria;
            if (filtros.status) params.recebido = filtros.status === 'recebido';
            if (filtros.alunoId) params.alunoId = filtros.alunoId;
            
            const res = await axios.get('/api/financeiro/receitas', { params });
            setReceitas(res.data.receitas || []);
        } catch (err) {
            console.error('Erro ao carregar receitas:', err);
            setError('Erro ao carregar receitas');
        } finally {
            setLoading(false);
        }
    };

    const carregarPagamentosReceber = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filtros.dataInicio) params.dataVencimentoInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataVencimentoFim = filtros.dataFim;
            if (filtros.status) params.recebido = filtros.status === 'recebido';
            if (filtros.alunoId) params.alunoId = filtros.alunoId;
            
            const res = await axios.get('/api/financeiro/pagamentos-receber', { params });
            setPagamentosReceber(res.data.pagamentos || []);
        } catch (err) {
            console.error('Erro ao carregar pagamentos a receber:', err);
            setError('Erro ao carregar pagamentos a receber');
        } finally {
            setLoading(false);
        }
    };

    const abrirFormulario = (tipo, item = null) => {
        setFormType(tipo);
        setEditingItem(item);
        setShowForm(true);
        
        if (item) {
            setFormData({
                descricao: item.descricao || '',
                valor: item.valor || '',
                categoria: item.categoria || '',
                data: item.data ? new Date(item.data).toISOString().split('T')[0] : '',
                dataVencimento: item.dataVencimento ? new Date(item.dataVencimento).toISOString().split('T')[0] : '',
                dataRecebimento: item.dataRecebimento ? new Date(item.dataRecebimento).toISOString().split('T')[0] : '',
                dataPagamento: item.dataPagamento ? new Date(item.dataPagamento).toISOString().split('T')[0] : '',
                pago: item.pago || false,
                recebido: item.recebido || false,
                alunoId: item.alunoId?._id || item.alunoId || '',
                recorrente: item.recorrente || false,
                frequenciaRecorrencia: item.frequenciaRecorrencia || 'mensal',
                proximaOcorrencia: item.proximaOcorrencia ? new Date(item.proximaOcorrencia).toISOString().split('T')[0] : '',
                observacoes: item.observacoes || ''
            });
        } else {
            setFormData({
                descricao: '',
                valor: '',
                categoria: '',
                data: new Date().toISOString().split('T')[0],
                dataVencimento: '',
                dataRecebimento: '',
                dataPagamento: '',
                pago: false,
                recebido: false,
                alunoId: '',
                recorrente: false,
                frequenciaRecorrencia: 'mensal',
                proximaOcorrencia: '',
                observacoes: ''
            });
        }
    };

    const fecharFormulario = () => {
        setShowForm(false);
        setFormType(null);
        setEditingItem(null);
        setFormData({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            let url;
            if (formType === 'pagamento') {
                url = editingItem 
                    ? `/api/financeiro/pagamentos-receber/${editingItem._id}`
                    : `/api/financeiro/pagamentos-receber`;
            } else {
                url = editingItem 
                    ? `/api/financeiro/${formType}s/${editingItem._id}`
                    : `/api/financeiro/${formType}s`;
            }
            
            const method = editingItem ? 'put' : 'post';
            const payload = { ...formData };
            if (formType === 'pagamento' && !payload.alunoId) {
                setError('Selecione um aluno');
                return;
            }

            await axios[method](url, payload);
            
            setSuccess(editingItem ? `${formType} atualizado com sucesso!` : `${formType} criado com sucesso!`);
            fecharFormulario();
            
            // Sempre atualizar o resumo quando houver mudanças
            await carregarResumo();
            
            // Atualizar a lista da tab ativa
            if (activeTab === 'despesas') {
                await carregarDespesas();
            } else if (activeTab === 'receitas') {
                await carregarReceitas();
            } else if (activeTab === 'pagamentos') {
                await carregarPagamentosReceber();
            }
        } catch (err) {
            console.error(`Erro ao ${editingItem ? 'atualizar' : 'criar'} ${formType}:`, err);
            setError(err.response?.data?.message || `Erro ao ${editingItem ? 'atualizar' : 'criar'} ${formType}`);
        }
    };

    const handleDelete = async (tipo, id) => {
        if (!window.confirm(`Tem certeza que deseja deletar este ${tipo}?`)) {
            return;
        }

        try {
            const url = tipo === 'pagamento' 
                ? `/api/financeiro/pagamentos-receber/${id}`
                : `/api/financeiro/${tipo}s/${id}`;
            await axios.delete(url);
            setSuccess(`${tipo} deletado com sucesso!`);
            
            // Sempre atualizar o resumo quando houver mudanças
            await carregarResumo();
            
            // Atualizar a lista da tab ativa
            if (activeTab === 'despesas') {
                await carregarDespesas();
            } else if (activeTab === 'receitas') {
                await carregarReceitas();
            } else if (activeTab === 'pagamentos') {
                await carregarPagamentosReceber();
            }
        } catch (err) {
            console.error(`Erro ao deletar ${tipo}:`, err);
            setError(err.response?.data?.message || `Erro ao deletar ${tipo}`);
        }
    };

    const limparFiltros = () => {
        setFiltros({
            dataInicio: '',
            dataFim: '',
            categoria: '',
            status: '',
            alunoId: ''
        });
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    if (user?.role !== 'admin' && user?.role !== 'professor') {
        return (
            <div className="card">
                <h2>Acesso Restrito</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)' }}>
                    Apenas administradores e professores podem acessar o módulo financeiro.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Header com Tabs */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Financeiro</h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Gerencie receitas, despesas e pagamentos a receber da academia.
                </p>

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

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'overview' ? '2px solid #1cb0f6' : '2px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'overview' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.7)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'overview' ? 600 : 400
                        }}
                    >
                        📊 Resumo
                    </button>
                    <button
                        onClick={() => setActiveTab('despesas')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'despesas' ? '2px solid #1cb0f6' : '2px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'despesas' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.7)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'despesas' ? 600 : 400
                        }}
                    >
                        💸 Despesas
                    </button>
                    <button
                        onClick={() => setActiveTab('receitas')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'receitas' ? '2px solid #1cb0f6' : '2px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'receitas' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.7)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'receitas' ? 600 : 400
                        }}
                    >
                        💰 Receitas
                    </button>
                    <button
                        onClick={() => setActiveTab('pagamentos')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'pagamentos' ? '2px solid #1cb0f6' : '2px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'pagamentos' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.7)',
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'pagamentos' ? 600 : 400
                        }}
                    >
                        📋 A Receber
                    </button>
                </div>
            </div>

            {/* Conteúdo das Tabs */}
            {activeTab === 'overview' && (
                <div className="card">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Carregando...
                        </div>
                    ) : resumo ? (
                        <>
                            {/* Cards de Resumo */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                                gap: '1rem', 
                                marginBottom: '2rem' 
                            }}>
                                <div style={{
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
                                    border: '1px solid rgba(34, 197, 94, 0.3)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '0.5rem' }}>
                                        Total Receitas
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#22c55e' }}>
                                        {formatarMoeda(resumo.totalReceitas)}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.05))',
                                    border: '1px solid rgba(244, 63, 94, 0.3)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '0.5rem' }}>
                                        Total Despesas
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f87171' }}>
                                        {formatarMoeda(resumo.totalDespesas)}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    background: resumo.saldo >= 0 
                                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))'
                                        : 'linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.05))',
                                    border: resumo.saldo >= 0 
                                        ? '1px solid rgba(59, 130, 246, 0.3)'
                                        : '1px solid rgba(244, 63, 94, 0.3)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '0.5rem' }}>
                                        Saldo
                                    </div>
                                    <div style={{ 
                                        fontSize: '2rem', 
                                        fontWeight: 700, 
                                        color: resumo.saldo >= 0 ? '#60a5fa' : '#f87171' 
                                    }}>
                                        {formatarMoeda(resumo.saldo)}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.5rem',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05))',
                                    border: '1px solid rgba(251, 191, 36, 0.3)'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', marginBottom: '0.5rem' }}>
                                        A Receber
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24' }}>
                                        {formatarMoeda(resumo.totalPagamentosPendentes)}
                                    </div>
                                </div>
                            </div>

                            {/* Filtros Colapsáveis */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <button
                                    className="btn secondary"
                                    onClick={() => setShowFiltros(!showFiltros)}
                                    style={{ 
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: showFiltros ? '1rem' : '0'
                                    }}
                                >
                                    <span>🔍 {showFiltros ? 'Ocultar' : 'Mostrar'} Filtros</span>
                                    <span>{showFiltros ? '▲' : '▼'}</span>
                                </button>

                                {showFiltros && (
                                    <div style={{ 
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                                Data Início
                                            </label>
                                            <input
                                                type="date"
                                                value={filtros.dataInicio}
                                                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
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
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                                Data Fim
                                            </label>
                                            <input
                                                type="date"
                                                value={filtros.dataFim}
                                                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
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
                                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                            <button className="btn secondary" onClick={limparFiltros} style={{ width: '100%' }}>
                                                Limpar Filtros
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {activeTab === 'despesas' && (
                <div className="card">
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'stretch' : 'center', 
                        marginBottom: '1.5rem', 
                        gap: '1rem' 
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Despesas</h3>
                        <button 
                            className="btn primary" 
                            onClick={() => abrirFormulario('despesa')}
                            style={{ width: isMobile ? '100%' : 'auto' }}
                        >
                            ➕ Nova Despesa
                        </button>
                    </div>

                    {/* Filtros */}
                    <div style={{ 
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '1.5rem',
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Data Início
                            </label>
                            <input
                                type="date"
                                value={filtros.dataInicio}
                                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Data Fim
                            </label>
                            <input
                                type="date"
                                value={filtros.dataFim}
                                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Categoria
                            </label>
                            <select
                                value={filtros.categoria}
                                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Todas</option>
                                <option value="fixa">Fixa</option>
                                <option value="pessoal">Pessoal</option>
                                <option value="material">Material</option>
                                <option value="manutencao">Manutenção</option>
                                <option value="marketing">Marketing</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Status
                            </label>
                            <select
                                value={filtros.status}
                                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Todos</option>
                                <option value="pago">Pago</option>
                                <option value="pendente">Pendente</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Carregando...
                        </div>
                    ) : despesas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                            <p>Nenhuma despesa encontrada</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {despesas.map(despesa => (
                                <div
                                    key={despesa._id}
                                    style={{
                                        padding: '1.25rem',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                                            {despesa.descricao}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <span>{new Date(despesa.data).toLocaleDateString('pt-BR')}</span>
                                            <span>•</span>
                                            <span style={{ textTransform: 'capitalize' }}>{despesa.categoria}</span>
                                            {despesa.recorrente && <span>• 🔄 Recorrente</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                                                {formatarMoeda(despesa.valor)}
                                            </div>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                background: despesa.pago ? 'rgba(34, 197, 94, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                                color: despesa.pago ? '#22c55e' : '#f87171',
                                                fontWeight: 600
                                            }}>
                                                {despesa.pago ? '✓ Pago' : 'Pendente'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn secondary"
                                                style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                onClick={() => abrirFormulario('despesa', despesa)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn"
                                                style={{
                                                    padding: '0.5rem',
                                                    fontSize: '0.85rem',
                                                    background: 'rgba(244, 63, 94, 0.2)',
                                                    color: '#f87171',
                                                    border: '1px solid rgba(244, 63, 94, 0.3)'
                                                }}
                                                onClick={() => handleDelete('despesa', despesa._id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'receitas' && (
                <div className="card">
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'stretch' : 'center', 
                        marginBottom: '1.5rem', 
                        gap: '1rem' 
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Receitas</h3>
                        <button 
                            className="btn primary" 
                            onClick={() => abrirFormulario('receita')}
                            style={{ width: isMobile ? '100%' : 'auto' }}
                        >
                            ➕ Nova Receita
                        </button>
                    </div>

                    {/* Filtros */}
                    <div style={{ 
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '1.5rem',
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Data Início
                            </label>
                            <input
                                type="date"
                                value={filtros.dataInicio}
                                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Data Fim
                            </label>
                            <input
                                type="date"
                                value={filtros.dataFim}
                                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Categoria
                            </label>
                            <select
                                value={filtros.categoria}
                                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Todas</option>
                                <option value="mensalidade">Mensalidade</option>
                                <option value="matricula">Matrícula</option>
                                <option value="evento">Evento</option>
                                <option value="produto">Produto</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Status
                            </label>
                            <select
                                value={filtros.status}
                                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Todos</option>
                                <option value="recebido">Recebido</option>
                                <option value="pendente">Pendente</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Aluno
                            </label>
                            <select
                                value={filtros.alunoId}
                                onChange={(e) => setFiltros({ ...filtros, alunoId: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Todos</option>
                                {alunos.map(aluno => (
                                    <option key={aluno.id} value={aluno.id}>{aluno.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Carregando...
                        </div>
                    ) : receitas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
                            <p>Nenhuma receita encontrada</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {receitas.map(receita => (
                                <div
                                    key={receita._id}
                                    style={{
                                        padding: '1.25rem',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                                            {receita.descricao}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <span>{new Date(receita.data).toLocaleDateString('pt-BR')}</span>
                                            <span>•</span>
                                            <span style={{ textTransform: 'capitalize' }}>{receita.categoria}</span>
                                            {receita.alunoId?.userId?.name && <span>• {receita.alunoId.userId.name}</span>}
                                            {receita.recorrente && <span>• 🔄 Recorrente</span>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                                                {formatarMoeda(receita.valor)}
                                            </div>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                background: receita.recebido ? 'rgba(34, 197, 94, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                                color: receita.recebido ? '#22c55e' : '#f87171',
                                                fontWeight: 600
                                            }}>
                                                {receita.recebido ? '✓ Recebido' : 'Pendente'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn secondary"
                                                style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                onClick={() => abrirFormulario('receita', receita)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn"
                                                style={{
                                                    padding: '0.5rem',
                                                    fontSize: '0.85rem',
                                                    background: 'rgba(244, 63, 94, 0.2)',
                                                    color: '#f87171',
                                                    border: '1px solid rgba(244, 63, 94, 0.3)'
                                                }}
                                                onClick={() => handleDelete('receita', receita._id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'pagamentos' && (
                <div className="card">
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'stretch' : 'center', 
                        marginBottom: '1.5rem', 
                        gap: '1rem' 
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Pagamentos a Receber</h3>
                        <button 
                            className="btn primary" 
                            onClick={() => abrirFormulario('pagamento')}
                            style={{ width: isMobile ? '100%' : 'auto' }}
                        >
                            ➕ Novo Pagamento
                        </button>
                    </div>

                    {/* Filtros */}
                    <div style={{ 
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: '1.5rem',
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '1rem'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Vencimento Início
                            </label>
                            <input
                                type="date"
                                value={filtros.dataInicio}
                                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Vencimento Fim
                            </label>
                            <input
                                type="date"
                                value={filtros.dataFim}
                                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Status
                            </label>
                            <select
                                value={filtros.status}
                                onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Todos</option>
                                <option value="recebido">Recebido</option>
                                <option value="pendente">Pendente</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Aluno
                            </label>
                            <select
                                value={filtros.alunoId}
                                onChange={(e) => setFiltros({ ...filtros, alunoId: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >
                                <option value="">Todos</option>
                                {alunos.map(aluno => (
                                    <option key={aluno.id} value={aluno.id}>{aluno.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Carregando...
                        </div>
                    ) : pagamentosReceber.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                            <p>Nenhum pagamento a receber encontrado</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {pagamentosReceber.map(pagamento => {
                                const vencido = new Date(pagamento.dataVencimento) < new Date() && !pagamento.recebido;
                                return (
                                    <div
                                        key={pagamento._id}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: '12px',
                                            background: vencido 
                                                ? 'rgba(244, 63, 94, 0.1)' 
                                                : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${vencido ? 'rgba(244, 63, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#e2e8f0', fontSize: '1.1rem' }}>
                                                {pagamento.descricao}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'rgba(226, 232, 240, 0.7)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <span>{pagamento.alunoId?.userId?.name || 'N/A'}</span>
                                                <span>•</span>
                                                <span>Vencimento: {new Date(pagamento.dataVencimento).toLocaleDateString('pt-BR')}</span>
                                                {pagamento.recorrente && <span>• 🔄 Recorrente</span>}
                                                {vencido && <span style={{ color: '#f87171', fontWeight: 600 }}>• ⚠️ Vencido</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                                                    {formatarMoeda(pagamento.valor)}
                                                </div>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    background: pagamento.recebido ? 'rgba(34, 197, 94, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                                                    color: pagamento.recebido ? '#22c55e' : '#f87171',
                                                    fontWeight: 600
                                                }}>
                                                    {pagamento.recebido ? '✓ Recebido' : 'Pendente'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn secondary"
                                                    style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                    onClick={() => abrirFormulario('pagamento', pagamento)}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn"
                                                    style={{
                                                        padding: '0.5rem',
                                                        fontSize: '0.85rem',
                                                        background: 'rgba(244, 63, 94, 0.2)',
                                                        color: '#f87171',
                                                        border: '1px solid rgba(244, 63, 94, 0.3)'
                                                    }}
                                                    onClick={() => handleDelete('pagamento', pagamento._id)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Formulário Modal */}
            {showForm && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.7)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            fecharFormulario();
                        }
                    }}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>
                                {editingItem ? `Editar ${formType === 'despesa' ? 'Despesa' : formType === 'receita' ? 'Receita' : 'Pagamento'}` : `Nova ${formType === 'despesa' ? 'Despesa' : formType === 'receita' ? 'Receita' : 'Pagamento'}`}
                            </h2>
                            <button
                                onClick={fecharFormulario}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#e2e8f0',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '4px 8px'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                        Descrição *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.descricao || ''}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        required
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

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                        Valor *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.valor || ''}
                                        onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                        required
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

                                {formType === 'despesa' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                Categoria *
                                            </label>
                                            <select
                                                value={formData.categoria || ''}
                                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    color: '#fff'
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="fixa">Fixa</option>
                                                <option value="pessoal">Pessoal</option>
                                                <option value="material">Material</option>
                                                <option value="manutencao">Manutenção</option>
                                                <option value="marketing">Marketing</option>
                                                <option value="outros">Outros</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                    Data
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.data || ''}
                                                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
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
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                    Data Vencimento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataVencimento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
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
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.pago || false}
                                                onChange={(e) => setFormData({ ...formData, pago: e.target.checked, dataPagamento: e.target.checked ? new Date().toISOString().split('T')[0] : '' })}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <label style={{ color: 'rgba(226, 232, 240, 0.9)' }}>Marcar como pago</label>
                                        </div>
                                        {formData.pago && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                    Data Pagamento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataPagamento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
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
                                        )}
                                    </>
                                )}

                                {formType === 'receita' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                Categoria *
                                            </label>
                                            <select
                                                value={formData.categoria || ''}
                                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    color: '#fff'
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                <option value="mensalidade">Mensalidade</option>
                                                <option value="matricula">Matrícula</option>
                                                <option value="evento">Evento</option>
                                                <option value="produto">Produto</option>
                                                <option value="outros">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                Aluno (opcional)
                                            </label>
                                            <select
                                                value={formData.alunoId || ''}
                                                onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    color: '#fff'
                                                }}
                                            >
                                                <option value="">Nenhum</option>
                                                {alunos.map(aluno => (
                                                    <option key={aluno.id} value={aluno.id}>{aluno.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                    Data
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.data || ''}
                                                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
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
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                    Data Recebimento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataRecebimento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
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
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.recebido || false}
                                                onChange={(e) => setFormData({ ...formData, recebido: e.target.checked, dataRecebimento: e.target.checked ? new Date().toISOString().split('T')[0] : '' })}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <label style={{ color: 'rgba(226, 232, 240, 0.9)' }}>Marcar como recebido</label>
                                        </div>
                                    </>
                                )}

                                {formType === 'pagamento' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                Aluno *
                                            </label>
                                            <select
                                                value={formData.alunoId || ''}
                                                onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    color: '#fff'
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                {alunos.map(aluno => (
                                                    <option key={aluno.id} value={aluno.id}>{aluno.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                Data Vencimento *
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.dataVencimento || ''}
                                                onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                                required
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.recebido || false}
                                                onChange={(e) => setFormData({ ...formData, recebido: e.target.checked, dataRecebimento: e.target.checked ? new Date().toISOString().split('T')[0] : '' })}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            <label style={{ color: 'rgba(226, 232, 240, 0.9)' }}>Marcar como recebido</label>
                                        </div>
                                        {formData.recebido && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                    Data Recebimento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataRecebimento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
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
                                        )}
                                    </>
                                )}

                                {/* Campos comuns para recorrentes */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.recorrente || false}
                                        onChange={(e) => setFormData({ ...formData, recorrente: e.target.checked })}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <label style={{ color: 'rgba(226, 232, 240, 0.9)' }}>Recorrente</label>
                                </div>

                                {formData.recorrente && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                Frequência
                                            </label>
                                            <select
                                                value={formData.frequenciaRecorrencia || 'mensal'}
                                                onChange={(e) => setFormData({ ...formData, frequenciaRecorrencia: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                    color: '#fff'
                                                }}
                                            >
                                                <option value="mensal">Mensal</option>
                                                <option value="trimestral">Trimestral</option>
                                                <option value="semestral">Semestral</option>
                                                <option value="anual">Anual</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                                Próxima Ocorrência
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.proximaOcorrencia || ''}
                                                onChange={(e) => setFormData({ ...formData, proximaOcorrencia: e.target.value })}
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
                                    </>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(226, 232, 240, 0.9)' }}>
                                        Observações
                                    </label>
                                    <textarea
                                        value={formData.observacoes || ''}
                                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: '#fff',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="submit" className="btn primary" style={{ flex: 1 }}>
                                    {editingItem ? '💾 Salvar' : '✅ Criar'}
                                </button>
                                <button type="button" className="btn secondary" style={{ flex: 1 }} onClick={fecharFormulario}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceiroPage;
