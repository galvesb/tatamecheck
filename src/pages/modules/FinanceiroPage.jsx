import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const FinanceiroPage = ({ activeTab: externalActiveTab, onTabChange, onCreateClick }) => {
    const { user } = useAuth();
    const [internalActiveTab, setInternalActiveTab] = useState('overview');
    
    // Usar tab externo se fornecido, senão usar interno
    const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
    const setActiveTab = onTabChange || setInternalActiveTab;
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

    // Expor função para abrir formulário externamente
    useEffect(() => {
        if (onCreateClick) {
            onCreateClick.current = abrirFormulario;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onCreateClick]);

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
            {/* Header com Tabs - Estilo Organizze */}
            <div className="card" style={{ marginBottom: '16px', padding: '1.5rem' }}>
                <h2 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: 600 }}>
                    Financeiro
                </h2>
                <p style={{ color: 'rgba(226, 232, 240, 0.6)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Controle suas receitas, despesas e pagamentos
                </p>

                {error && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'rgba(244, 63, 94, 0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(244, 63, 94, 0.2)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        {success}
                    </div>
                )}

                {/* Tabs - Estilo Organizze (apenas se não controlado externamente) */}
                {externalActiveTab === undefined && (
                <div style={{
                    display: 'flex',
                    gap: '0',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    marginBottom: '0'
                }}>
                    <button
                        onClick={() => setActiveTab('overview')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'overview' ? '3px solid #1cb0f6' : '3px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'overview' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.6)',
                            padding: '0.875rem 1.25rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'overview' ? 600 : 400,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Resumo
                    </button>
                    <button
                        onClick={() => setActiveTab('despesas')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'despesas' ? '3px solid #1cb0f6' : '3px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'despesas' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.6)',
                            padding: '0.875rem 1.25rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'despesas' ? 600 : 400,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Despesas
                    </button>
                    <button
                        onClick={() => setActiveTab('receitas')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'receitas' ? '3px solid #1cb0f6' : '3px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'receitas' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.6)',
                            padding: '0.875rem 1.25rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'receitas' ? 600 : 400,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Receitas
                    </button>
                    <button
                        onClick={() => setActiveTab('pagamentos')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'pagamentos' ? '3px solid #1cb0f6' : '3px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'pagamentos' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.6)',
                            padding: '0.875rem 1.25rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'pagamentos' ? 600 : 400,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        A Receber
                    </button>
                </div>
                )}
            </div>

            {/* Resumo - Estilo Organizze */}
            {activeTab === 'overview' && (
                <div>
                    {loading ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Carregando...
                        </div>
                    ) : resumo ? (
                        <>
                            {/* Cards de Resumo - Estilo Organizze */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                                gap: '1rem', 
                                marginBottom: '1.5rem' 
                            }}>
                                <div style={{
                                    padding: '1.75rem',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.04))',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ 
                                        fontSize: '0.875rem', 
                                        color: 'rgba(226, 232, 240, 0.7)', 
                                        marginBottom: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        Total Receitas
                                    </div>
                                    <div style={{ 
                                        fontSize: '2.25rem', 
                                        fontWeight: 700, 
                                        color: '#22c55e',
                                        lineHeight: '1.2'
                                    }}>
                                        {formatarMoeda(resumo.totalReceitas)}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.75rem',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(244, 63, 94, 0.04))',
                                    border: '1px solid rgba(244, 63, 94, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ 
                                        fontSize: '0.875rem', 
                                        color: 'rgba(226, 232, 240, 0.7)', 
                                        marginBottom: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        Total Despesas
                                    </div>
                                    <div style={{ 
                                        fontSize: '2.25rem', 
                                        fontWeight: 700, 
                                        color: '#f87171',
                                        lineHeight: '1.2'
                                    }}>
                                        {formatarMoeda(resumo.totalDespesas)}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.75rem',
                                    borderRadius: '16px',
                                    background: resumo.saldo >= 0 
                                        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(59, 130, 246, 0.04))'
                                        : 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(244, 63, 94, 0.04))',
                                    border: resumo.saldo >= 0 
                                        ? '1px solid rgba(59, 130, 246, 0.2)'
                                        : '1px solid rgba(244, 63, 94, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ 
                                        fontSize: '0.875rem', 
                                        color: 'rgba(226, 232, 240, 0.7)', 
                                        marginBottom: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        Saldo
                                    </div>
                                    <div style={{ 
                                        fontSize: '2.25rem', 
                                        fontWeight: 700, 
                                        color: resumo.saldo >= 0 ? '#60a5fa' : '#f87171',
                                        lineHeight: '1.2'
                                    }}>
                                        {formatarMoeda(resumo.saldo)}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '1.75rem',
                                    borderRadius: '16px',
                                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(251, 191, 36, 0.04))',
                                    border: '1px solid rgba(251, 191, 36, 0.2)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ 
                                        fontSize: '0.875rem', 
                                        color: 'rgba(226, 232, 240, 0.7)', 
                                        marginBottom: '0.75rem',
                                        fontWeight: 500
                                    }}>
                                        A Receber
                                    </div>
                                    <div style={{ 
                                        fontSize: '2.25rem', 
                                        fontWeight: 700, 
                                        color: '#fbbf24',
                                        lineHeight: '1.2'
                                    }}>
                                        {formatarMoeda(resumo.totalPagamentosPendentes)}
                                    </div>
                                </div>
                            </div>

                            {/* Filtros Colapsáveis */}
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <button
                                    onClick={() => setShowFiltros(!showFiltros)}
                                    style={{ 
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#e2e8f0',
                                        padding: '0.75rem 0',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 500
                                    }}
                                >
                                    <span>🔍 Filtros</span>
                                    <span style={{ fontSize: '0.75rem' }}>{showFiltros ? '▲' : '▼'}</span>
                                </button>

                                {showFiltros && (
                                    <div style={{ 
                                        paddingTop: '1rem',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                        marginTop: '1rem',
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                                        gap: '1rem'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(226, 232, 240, 0.7)', fontWeight: 500 }}>
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
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(226, 232, 240, 0.7)', fontWeight: 500 }}>
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
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        </div>
                                        <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                            <button 
                                                className="btn secondary" 
                                                onClick={limparFiltros} 
                                                style={{ width: '100%', padding: '0.75rem' }}
                                            >
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

            {/* Despesas - Estilo Organizze */}
            {activeTab === 'despesas' && (
                <div>
                    <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <div style={{ 
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Despesas</h3>
                        </div>

                        {/* Filtros Compactos */}
                        <div style={{ 
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            marginBottom: '1.5rem',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={filtros.dataInicio}
                                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    value={filtros.dataFim}
                                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Categoria
                                </label>
                                <select
                                    value={filtros.categoria}
                                    onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Status
                                </label>
                                <select
                                    value={filtros.status}
                                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
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
                                <p style={{ fontSize: '0.95rem' }}>Nenhuma despesa encontrada</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {despesas.map(despesa => (
                                    <div
                                        key={despesa._id}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1rem',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ 
                                                fontWeight: 600, 
                                                marginBottom: '0.5rem', 
                                                color: '#e2e8f0', 
                                                fontSize: '1.05rem' 
                                            }}>
                                                {despesa.descricao}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.85rem', 
                                                color: 'rgba(226, 232, 240, 0.6)', 
                                                display: 'flex', 
                                                gap: '0.75rem', 
                                                flexWrap: 'wrap' 
                                            }}>
                                                <span>{new Date(despesa.data).toLocaleDateString('pt-BR')}</span>
                                                <span>•</span>
                                                <span style={{ textTransform: 'capitalize' }}>{despesa.categoria}</span>
                                                {despesa.recorrente && <span>🔄</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ 
                                                    fontWeight: 700, 
                                                    color: '#f87171', 
                                                    fontSize: '1.35rem', 
                                                    marginBottom: '0.25rem',
                                                    lineHeight: '1.2'
                                                }}>
                                                    {formatarMoeda(despesa.valor)}
                                                </div>
                                                <span style={{
                                                    padding: '0.25rem 0.625rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    background: despesa.pago ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                                    color: despesa.pago ? '#22c55e' : '#f87171',
                                                    fontWeight: 600
                                                }}>
                                                    {despesa.pago ? '✓ Pago' : 'Pendente'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => abrirFormulario('despesa', despesa)}
                                                    style={{ 
                                                        padding: '0.5rem',
                                                        background: 'rgba(59, 130, 246, 0.15)',
                                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                                        borderRadius: '8px',
                                                        color: '#60a5fa',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('despesa', despesa._id)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        background: 'rgba(244, 63, 94, 0.15)',
                                                        border: '1px solid rgba(244, 63, 94, 0.3)',
                                                        borderRadius: '8px',
                                                        color: '#f87171',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
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
                </div>
            )}

            {/* Receitas - Estilo Organizze */}
            {activeTab === 'receitas' && (
                <div>
                    <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <div style={{ 
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Receitas</h3>
                        </div>

                        {/* Filtros Compactos */}
                        <div style={{ 
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            marginBottom: '1.5rem',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={filtros.dataInicio}
                                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    value={filtros.dataFim}
                                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Categoria
                                </label>
                                <select
                                    value={filtros.categoria}
                                    onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
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
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Status
                                </label>
                                <select
                                    value={filtros.status}
                                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="">Todos</option>
                                    <option value="recebido">Recebido</option>
                                    <option value="pendente">Pendente</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Aluno
                                </label>
                                <select
                                    value={filtros.alunoId}
                                    onChange={(e) => setFiltros({ ...filtros, alunoId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
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
                                <p style={{ fontSize: '0.95rem' }}>Nenhuma receita encontrada</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {receitas.map(receita => (
                                    <div
                                        key={receita._id}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1rem',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                        }}
                                    >
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ 
                                                fontWeight: 600, 
                                                marginBottom: '0.5rem', 
                                                color: '#e2e8f0', 
                                                fontSize: '1.05rem' 
                                            }}>
                                                {receita.descricao}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.85rem', 
                                                color: 'rgba(226, 232, 240, 0.6)', 
                                                display: 'flex', 
                                                gap: '0.75rem', 
                                                flexWrap: 'wrap' 
                                            }}>
                                                <span>{new Date(receita.data).toLocaleDateString('pt-BR')}</span>
                                                <span>•</span>
                                                <span style={{ textTransform: 'capitalize' }}>{receita.categoria}</span>
                                                {receita.alunoId?.userId?.name && <span>• {receita.alunoId.userId.name}</span>}
                                                {receita.recorrente && <span>🔄</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ 
                                                    fontWeight: 700, 
                                                    color: '#22c55e', 
                                                    fontSize: '1.35rem', 
                                                    marginBottom: '0.25rem',
                                                    lineHeight: '1.2'
                                                }}>
                                                    {formatarMoeda(receita.valor)}
                                                </div>
                                                <span style={{
                                                    padding: '0.25rem 0.625rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    background: receita.recebido ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                                    color: receita.recebido ? '#22c55e' : '#f87171',
                                                    fontWeight: 600
                                                }}>
                                                    {receita.recebido ? '✓ Recebido' : 'Pendente'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => abrirFormulario('receita', receita)}
                                                    style={{ 
                                                        padding: '0.5rem',
                                                        background: 'rgba(59, 130, 246, 0.15)',
                                                        border: '1px solid rgba(59, 130, 246, 0.3)',
                                                        borderRadius: '8px',
                                                        color: '#60a5fa',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('receita', receita._id)}
                                                    style={{
                                                        padding: '0.5rem',
                                                        background: 'rgba(244, 63, 94, 0.15)',
                                                        border: '1px solid rgba(244, 63, 94, 0.3)',
                                                        borderRadius: '8px',
                                                        color: '#f87171',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem'
                                                    }}
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
                </div>
            )}

            {/* Pagamentos a Receber - Estilo Organizze */}
            {activeTab === 'pagamentos' && (
                <div>
                    <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <div style={{ 
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Pagamentos a Receber</h3>
                        </div>

                        {/* Filtros Compactos */}
                        <div style={{ 
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            marginBottom: '1.5rem',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1rem'
                        }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Vencimento Início
                                </label>
                                <input
                                    type="date"
                                    value={filtros.dataInicio}
                                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Vencimento Fim
                                </label>
                                <input
                                    type="date"
                                    value={filtros.dataFim}
                                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Status
                                </label>
                                <select
                                    value={filtros.status}
                                    onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="">Todos</option>
                                    <option value="recebido">Recebido</option>
                                    <option value="pendente">Pendente</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'rgba(226, 232, 240, 0.6)', fontWeight: 500 }}>
                                    Aluno
                                </label>
                                <select
                                    value={filtros.alunoId}
                                    onChange={(e) => setFiltros({ ...filtros, alunoId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem',
                                        borderRadius: '8px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        color: '#fff',
                                        fontSize: '0.9rem'
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
                                <p style={{ fontSize: '0.95rem' }}>Nenhum pagamento a receber encontrado</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {pagamentosReceber.map(pagamento => {
                                    const vencido = new Date(pagamento.dataVencimento) < new Date() && !pagamento.recebido;
                                    return (
                                        <div
                                            key={pagamento._id}
                                            style={{
                                                padding: '1.25rem',
                                                borderRadius: '12px',
                                                background: vencido 
                                                    ? 'rgba(244, 63, 94, 0.08)' 
                                                    : 'rgba(255, 255, 255, 0.04)',
                                                border: `1px solid ${vencido ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)'}`,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '1rem',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = vencido 
                                                    ? 'rgba(244, 63, 94, 0.12)' 
                                                    : 'rgba(255, 255, 255, 0.06)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = vencido 
                                                    ? 'rgba(244, 63, 94, 0.08)' 
                                                    : 'rgba(255, 255, 255, 0.04)';
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <div style={{ 
                                                    fontWeight: 600, 
                                                    marginBottom: '0.5rem', 
                                                    color: '#e2e8f0', 
                                                    fontSize: '1.05rem' 
                                                }}>
                                                    {pagamento.descricao}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: 'rgba(226, 232, 240, 0.6)', 
                                                    display: 'flex', 
                                                    gap: '0.75rem', 
                                                    flexWrap: 'wrap' 
                                                }}>
                                                    <span>{pagamento.alunoId?.userId?.name || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>Venc: {new Date(pagamento.dataVencimento).toLocaleDateString('pt-BR')}</span>
                                                    {pagamento.recorrente && <span>🔄</span>}
                                                    {vencido && <span style={{ color: '#f87171', fontWeight: 600 }}>⚠️ Vencido</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ 
                                                        fontWeight: 700, 
                                                        color: '#fbbf24', 
                                                        fontSize: '1.35rem', 
                                                        marginBottom: '0.25rem',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        {formatarMoeda(pagamento.valor)}
                                                    </div>
                                                    <span style={{
                                                        padding: '0.25rem 0.625rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        background: pagamento.recebido ? 'rgba(34, 197, 94, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                                        color: pagamento.recebido ? '#22c55e' : '#f87171',
                                                        fontWeight: 600
                                                    }}>
                                                        {pagamento.recebido ? '✓ Recebido' : 'Pendente'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => abrirFormulario('pagamento', pagamento)}
                                                        style={{ 
                                                            padding: '0.5rem',
                                                            background: 'rgba(59, 130, 246, 0.15)',
                                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                                            borderRadius: '8px',
                                                            color: '#60a5fa',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete('pagamento', pagamento._id)}
                                                        style={{
                                                            padding: '0.5rem',
                                                            background: 'rgba(244, 63, 94, 0.15)',
                                                            border: '1px solid rgba(244, 63, 94, 0.3)',
                                                            borderRadius: '8px',
                                                            color: '#f87171',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem'
                                                        }}
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
                </div>
            )}

            {/* Formulário Modal - Estilo Organizze */}
            {showForm && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.75)',
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
                            overflowY: 'auto',
                            padding: '2rem'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>
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
                                    padding: '4px 8px',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                        Descrição *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.descricao || ''}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem',
                                            borderRadius: '10px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#fff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
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
                                            padding: '0.875rem',
                                            borderRadius: '10px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#fff',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>

                                {formType === 'despesa' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                Categoria *
                                            </label>
                                            <select
                                                value={formData.categoria || ''}
                                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '10px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
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
                                                <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                    Data
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.data || ''}
                                                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: '#fff',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                    Data Vencimento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataVencimento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: '#fff',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.pago || false}
                                                onChange={(e) => setFormData({ ...formData, pago: e.target.checked, dataPagamento: e.target.checked ? new Date().toISOString().split('T')[0] : '' })}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <label style={{ color: 'rgba(226, 232, 240, 0.9)', cursor: 'pointer', fontSize: '0.95rem' }}>Marcar como pago</label>
                                        </div>
                                        {formData.pago && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                    Data Pagamento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataPagamento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: '#fff',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {formType === 'receita' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                Categoria *
                                            </label>
                                            <select
                                                value={formData.categoria || ''}
                                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '10px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
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
                                            <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                Aluno (opcional)
                                            </label>
                                            <select
                                                value={formData.alunoId || ''}
                                                onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '10px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
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
                                                <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                    Data
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.data || ''}
                                                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: '#fff',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                    Data Recebimento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataRecebimento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: '#fff',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.recebido || false}
                                                onChange={(e) => setFormData({ ...formData, recebido: e.target.checked, dataRecebimento: e.target.checked ? new Date().toISOString().split('T')[0] : '' })}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <label style={{ color: 'rgba(226, 232, 240, 0.9)', cursor: 'pointer', fontSize: '0.95rem' }}>Marcar como recebido</label>
                                        </div>
                                    </>
                                )}

                                {formType === 'pagamento' && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                Aluno *
                                            </label>
                                            <select
                                                value={formData.alunoId || ''}
                                                onChange={(e) => setFormData({ ...formData, alunoId: e.target.value })}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '10px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                <option value="">Selecione...</option>
                                                {alunos.map(aluno => (
                                                    <option key={aluno.id} value={aluno.id}>{aluno.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                Data Vencimento *
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.dataVencimento || ''}
                                                onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                                required
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '10px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.recebido || false}
                                                onChange={(e) => setFormData({ ...formData, recebido: e.target.checked, dataRecebimento: e.target.checked ? new Date().toISOString().split('T')[0] : '' })}
                                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                            />
                                            <label style={{ color: 'rgba(226, 232, 240, 0.9)', cursor: 'pointer', fontSize: '0.95rem' }}>Marcar como recebido</label>
                                        </div>
                                        {formData.recebido && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                    Data Recebimento
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.dataRecebimento || ''}
                                                    onChange={(e) => setFormData({ ...formData, dataRecebimento: e.target.value })}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255, 255, 255, 0.08)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: '#fff',
                                                        fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Campos comuns para recorrentes */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.recorrente || false}
                                        onChange={(e) => setFormData({ ...formData, recorrente: e.target.checked })}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    />
                                    <label style={{ color: 'rgba(226, 232, 240, 0.9)', cursor: 'pointer', fontSize: '0.95rem' }}>Recorrente</label>
                                </div>

                                {formData.recorrente && (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                Frequência
                                            </label>
                                            <select
                                                value={formData.frequenciaRecorrencia || 'mensal'}
                                                onChange={(e) => setFormData({ ...formData, frequenciaRecorrencia: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '10px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
                                                }}
                                            >
                                                <option value="mensal">Mensal</option>
                                                <option value="trimestral">Trimestral</option>
                                                <option value="semestral">Semestral</option>
                                                <option value="anual">Anual</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                                Próxima Ocorrência
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.proximaOcorrencia || ''}
                                                onChange={(e) => setFormData({ ...formData, proximaOcorrencia: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem',
                                                    borderRadius: '10px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#fff',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                        Observações
                                    </label>
                                    <textarea
                                        value={formData.observacoes || ''}
                                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                        rows="3"
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem',
                                            borderRadius: '10px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#fff',
                                            resize: 'vertical',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="submit" className="btn primary" style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', fontWeight: 600 }}>
                                    {editingItem ? '💾 Salvar' : '✅ Criar'}
                                </button>
                                <button type="button" className="btn secondary" style={{ flex: 1, padding: '0.875rem', borderRadius: '10px', fontWeight: 600 }} onClick={fecharFormulario}>
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
