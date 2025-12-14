import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import GerenciarAlunos from '../GerenciarAlunos';
import '../../index.css';

const FinanceiroPage = ({ activeTab: externalActiveTab, onTabChange, onCreateClick }) => {
    const { user } = useAuth();
    const [internalActiveTab, setInternalActiveTab] = useState('overview');
    
    // Usar tab externo se fornecido, senão usar interno
    const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
    const setActiveTab = onTabChange || setInternalActiveTab;
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }
    const toastTimerRef = React.useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // Estado para modal de confirmação
    const [confirmModal, setConfirmModal] = useState(null); // { message: string, onConfirm: function }
    
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
    
    // Estados para seleção múltipla de receitas
    const [receitasSelecionadas, setReceitasSelecionadas] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [bulkActionModal, setBulkActionModal] = useState(null); // 'marcar-recebido', 'deletar', 'alterar-valor'
    const [novoValorBulk, setNovoValorBulk] = useState('');

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

    // Função para mostrar toast
    const showToast = (message, type = 'success') => {
        // Limpa timer anterior se existir
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
        
        setToast({ message, type });
        
        // Remove o toast após 2 segundos
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 2000);
    };

    // Cleanup do timer ao desmontar
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'despesas') {
            carregarDespesas();
        } else if (activeTab === 'receitas') {
            carregarReceitas();
        } else if (activeTab === 'alunos') {
            // Tab de alunos - não precisa carregar dados aqui, o componente GerenciarAlunos faz isso
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

    const carregarResumo = async (controlarLoading = true) => {
        try {
            if (controlarLoading) setLoading(true);
            const params = {};
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;
            
            const res = await axios.get('/api/financeiro/resumo', { params });
            setResumo(res.data);
        } catch (err) {
            console.error('Erro ao carregar resumo:', err);
            showToast('Erro ao carregar resumo financeiro', 'error');
        } finally {
            if (controlarLoading) setLoading(false);
        }
    };

    const carregarDespesas = async (controlarLoading = true) => {
        try {
            if (controlarLoading) setLoading(true);
            const params = {};
            if (filtros.dataInicio) params.dataInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataFim = filtros.dataFim;
            if (filtros.categoria) params.categoria = filtros.categoria;
            if (filtros.status) params.pago = filtros.status === 'pago';
            
            const res = await axios.get('/api/financeiro/despesas', { params });
            setDespesas(res.data.despesas || []);
        } catch (err) {
            console.error('Erro ao carregar despesas:', err);
            showToast('Erro ao carregar despesas', 'error');
        } finally {
            if (controlarLoading) setLoading(false);
        }
    };

    const carregarReceitas = async (controlarLoading = true) => {
        try {
            if (controlarLoading) setLoading(true);
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
            showToast('Erro ao carregar receitas', 'error');
        } finally {
            if (controlarLoading) setLoading(false);
        }
    };

    const carregarPagamentosReceber = async (controlarLoading = true) => {
        try {
            if (controlarLoading) setLoading(true);
            const params = {}; // Todos os pagamentos a receber são mensalidades
            if (filtros.dataInicio) params.dataVencimentoInicio = filtros.dataInicio;
            if (filtros.dataFim) params.dataVencimentoFim = filtros.dataFim;
            if (filtros.status) params.recebido = filtros.status === 'recebido';
            if (filtros.alunoId) params.alunoId = filtros.alunoId;
            
            const res = await axios.get('/api/financeiro/pagamentos-receber', { params });
            setPagamentosReceber(res.data.pagamentos || []);
        } catch (err) {
            console.error('Erro ao carregar mensalidades:', err);
            showToast('Erro ao carregar mensalidades', 'error');
        } finally {
            if (controlarLoading) setLoading(false);
        }
    };

    const marcarComoRecebido = async (pagamentoId) => {
        try {
            setLoading(true);
            const res = await axios.patch(`/api/financeiro/pagamentos-receber/${pagamentoId}/marcar-recebido`);
            showToast('Mensalidade marcada como recebida com sucesso!', 'success');
            setLoading(false);
            
            // Atualizar resumo sem controlar loading para evitar conflito
            await carregarResumo(false);
            await carregarPagamentosReceber(false);
        } catch (err) {
            console.error('Erro ao marcar como recebido:', err);
            showToast('Erro ao marcar mensalidade como recebida', 'error');
            setLoading(false);
        }
    };

    const marcarReceitaComoRecebida = async (receitaId) => {
        try {
            setLoading(true);
            const res = await axios.patch(`/api/financeiro/receitas/${receitaId}/marcar-recebido`);
            showToast('Receita marcada como recebida com sucesso!', 'success');
            setLoading(false);
            
            // Atualizar resumo e receitas sem controlar loading para evitar conflito
            await Promise.all([
                carregarResumo(false),
                carregarReceitas(false)
            ]);
        } catch (err) {
            console.error('Erro ao marcar receita como recebida:', err);
            showToast('Erro ao marcar receita como recebida', 'error');
            setLoading(false);
        }
    };

    // Funções de seleção múltipla
    const toggleSelecionarReceita = (receitaId) => {
        setReceitasSelecionadas(prev => {
            if (prev.includes(receitaId)) {
                const novas = prev.filter(id => id !== receitaId);
                setShowBulkActions(novas.length > 0);
                return novas;
            } else {
                const novas = [...prev, receitaId];
                setShowBulkActions(novas.length > 0);
                return novas;
            }
        });
    };

    const selecionarTodasReceitas = () => {
        const todasIds = receitas.map(r => r._id);
        setReceitasSelecionadas(todasIds);
        setShowBulkActions(true);
    };

    const deselecionarTodasReceitas = () => {
        setReceitasSelecionadas([]);
        setShowBulkActions(false);
    };

    // Ações em massa
    const marcarReceitasComoRecebidas = async () => {
        if (receitasSelecionadas.length === 0) return;
        
        try {
            setLoading(true);
            await Promise.all(
                receitasSelecionadas.map(id => 
                    axios.patch(`/api/financeiro/receitas/${id}/marcar-recebido`)
                )
            );
            showToast(`${receitasSelecionadas.length} receita(s) marcada(s) como recebida(s)!`, 'success');
            setReceitasSelecionadas([]);
            setShowBulkActions(false);
            setBulkActionModal(null);
            
            await Promise.all([
                carregarResumo(false),
                carregarReceitas(false)
            ]);
        } catch (err) {
            console.error('Erro ao marcar receitas como recebidas:', err);
            showToast('Erro ao marcar receitas como recebidas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deletarReceitasSelecionadas = async () => {
        if (receitasSelecionadas.length === 0) return;
        
        setConfirmModal({
            message: `Tem certeza que deseja deletar ${receitasSelecionadas.length} receita(s)?`,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await Promise.all(
                        receitasSelecionadas.map(id => 
                            axios.delete(`/api/financeiro/receitas/${id}`)
                        )
                    );
                    showToast(`${receitasSelecionadas.length} receita(s) deletada(s) com sucesso!`, 'success');
                    setReceitasSelecionadas([]);
                    setShowBulkActions(false);
                    setBulkActionModal(null);
                    
                    await Promise.all([
                        carregarResumo(false),
                        carregarReceitas(false)
                    ]);
                } catch (err) {
                    console.error('Erro ao deletar receitas:', err);
                    showToast('Erro ao deletar receitas', 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const alterarValorReceitas = async () => {
        if (receitasSelecionadas.length === 0 || !novoValorBulk) return;
        
        const novoValor = parseFloat(novoValorBulk);
        if (isNaN(novoValor) || novoValor <= 0) {
            showToast('Valor inválido', 'error');
            return;
        }
        
        try {
            setLoading(true);
            await Promise.all(
                receitasSelecionadas.map(id => 
                    axios.put(`/api/financeiro/receitas/${id}`, { valor: novoValor })
                )
            );
            showToast(`Valor de ${receitasSelecionadas.length} receita(s) alterado(s) para ${formatarMoeda(novoValor)}!`, 'success');
            setReceitasSelecionadas([]);
            setShowBulkActions(false);
            setBulkActionModal(null);
            setNovoValorBulk('');
            
            await Promise.all([
                carregarResumo(false),
                carregarReceitas(false)
            ]);
        } catch (err) {
            console.error('Erro ao alterar valor das receitas:', err);
            showToast('Erro ao alterar valor das receitas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const abrirFormulario = (tipo, item = null) => {
        setFormType(tipo);
        setEditingItem(item);
        setShowForm(true);
        
        // Mudar para a tab de cadastro quando abrir formulário
        if (onTabChange) {
            onTabChange('cadastro');
        } else {
            setActiveTab('cadastro');
        }
        
        if (item) {
            // Se for um pagamento, usar dataVencimento como data
            const dataValue = item.tipo === 'pagamento' 
                ? (item.dataVencimento ? new Date(item.dataVencimento).toISOString().split('T')[0] : '')
                : (item.data ? new Date(item.data).toISOString().split('T')[0] : '');
            
            setFormData({
                descricao: item.descricao || '',
                valor: item.valor || '',
                categoria: item.categoria || (item.tipo === 'pagamento' ? 'mensalidade' : ''),
                data: dataValue,
                dataVencimento: item.dataVencimento ? new Date(item.dataVencimento).toISOString().split('T')[0] : '',
                dataRecebimento: item.dataRecebimento ? new Date(item.dataRecebimento).toISOString().split('T')[0] : '',
                dataPagamento: item.dataPagamento ? new Date(item.dataPagamento).toISOString().split('T')[0] : '',
                pago: item.pago || false,
                recebido: item.recebido || false,
                alunoId: item.alunoId?._id || item.alunoId || '',
                recorrente: item.recorrente || false,
                frequenciaRecorrencia: item.frequenciaRecorrencia || 'mensal',
                dataInicio: item.dataInicio || (item.data ? new Date(item.data).toISOString().split('T')[0] : (item.dataVencimento ? new Date(item.dataVencimento).toISOString().split('T')[0] : '')),
                dataFinal: item.dataFinal || '',
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
                dataInicio: '',
                dataFinal: '',
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

        try {
            setLoading(true);
            const method = editingItem ? 'put' : 'post';
            const payload = { ...formData };
            
            // Se estiver editando uma receita, remover campos recorrentes (não devem ser atualizados)
            if (editingItem && formType === 'receita' && editingItem.tipo !== 'pagamento') {
                delete payload.recorrente;
                delete payload.dataInicio;
                delete payload.dataFinal;
                delete payload.frequenciaRecorrencia;
                delete payload.proximaOcorrencia;
            }
            
            // Se houver data de recebimento/pagamento, marcar automaticamente como recebido/pago
            if (formType === 'receita' && payload.dataRecebimento) {
                payload.recebido = true;
            }
            if (formType === 'despesa' && payload.dataPagamento) {
                payload.pago = true;
            }
            
            // Validar campos obrigatórios para recorrentes (apenas ao criar, não ao editar)
            if (!editingItem) {
                // Se dataInicio não estiver preenchido explicitamente, usar data ou dataVencimento
                const dataInicioParaValidacao = payload.dataInicio || payload.data || payload.dataVencimento;
                const dataInicioValida = dataInicioParaValidacao && 
                    (typeof dataInicioParaValidacao === 'string' ? dataInicioParaValidacao.trim() !== '' : true);
                const dataFinalValida = payload.dataFinal && 
                    (typeof payload.dataFinal === 'string' ? payload.dataFinal.trim() !== '' : true);
                
                // Atualizar payload com dataInicio se não estiver preenchido
                if (payload.recorrente && !payload.dataInicio && dataInicioParaValidacao) {
                    payload.dataInicio = dataInicioParaValidacao;
                }
                
                if (payload.recorrente && (!dataInicioValida || !dataFinalValida)) {
                    console.log('Erro de validação:', { 
                        recorrente: payload.recorrente, 
                        dataInicio: payload.dataInicio, 
                        dataFinal: payload.dataFinal,
                        dataInicioParaValidacao,
                        dataInicioValida,
                        dataFinalValida,
                        formData: formData
                    });
                showToast('Para receitas recorrentes, é necessário informar Data Início e Data Final', 'error');
                setLoading(false);
                return;
                }
            }
            
            // Verificar se está editando um pagamento (tem _id e tipo === 'pagamento')
            const isEditingPagamento = editingItem && editingItem._id && editingItem.tipo === 'pagamento';
            
            // Se for receita com aluno e dataVencimento, ou se estiver editando um pagamento, usar endpoint de pagamentos
            if ((formType === 'receita' && payload.alunoId && payload.dataVencimento) || isEditingPagamento) {
                const pagamentoUrl = isEditingPagamento
                    ? `/api/financeiro/pagamentos-receber/${editingItem._id}`
                    : `/api/financeiro/pagamentos-receber`;
                
                // Preparar dados do pagamento
                const pagamentoData = {
                    alunoId: payload.alunoId,
                    descricao: payload.descricao,
                    valor: payload.valor,
                    dataVencimento: payload.dataVencimento,
                    dataRecebimento: payload.dataRecebimento,
                    recebido: payload.recebido || (payload.dataRecebimento ? true : false),
                    recorrente: payload.recorrente || false,
                    frequenciaRecorrencia: payload.frequenciaRecorrencia || 'mensal',
                    observacoes: payload.observacoes
                };
                
                // Se for recorrente com dataFinal, incluir dataInicio e dataFinal
                if (payload.recorrente && payload.dataInicio && payload.dataFinal) {
                    pagamentoData.dataInicio = payload.dataInicio;
                    pagamentoData.dataFinal = payload.dataFinal;
                } else if (payload.proximaOcorrencia) {
                    pagamentoData.proximaOcorrencia = payload.proximaOcorrencia;
                }
                
                const resPagamento = await axios[method](pagamentoUrl, pagamentoData);
                
                // Se for criação recorrente, usar mensagem do backend
                if (!editingItem && payload.recorrente && payload.dataInicio && payload.dataFinal && resPagamento.data.total) {
                    showToast(resPagamento.data.message || `${resPagamento.data.total} pagamento(s) recorrente(s) criado(s) com sucesso!`, 'success');
                } else {
                    const tipoCriado = 'pagamento a receber';
                    showToast(editingItem ? `${tipoCriado} atualizado com sucesso!` : `${tipoCriado} criado com sucesso!`, 'success');
                }
            } else {
                // Criar como receita normal
                const url = editingItem 
                    ? `/api/financeiro/${formType}s/${editingItem._id}`
                    : `/api/financeiro/${formType}s`;
                    
                // Se for recorrente, garantir que dataInicio e dataFinal estão no payload
                if (formType === 'receita' && payload.recorrente) {
                    // Se dataInicio não estiver preenchido explicitamente, usar data ou dataVencimento
                    if (!payload.dataInicio || (typeof payload.dataInicio === 'string' && payload.dataInicio.trim() === '')) {
                        payload.dataInicio = payload.data || payload.dataVencimento || new Date().toISOString().split('T')[0];
                    }
                    // Garantir que dataFinal está presente
                    if (!payload.dataFinal || (typeof payload.dataFinal === 'string' && payload.dataFinal.trim() === '')) {
                        // Se dataFinal não estiver preenchido, não podemos criar receitas recorrentes
                        console.warn('⚠️ Receita recorrente sem dataFinal definida');
                    }
                    payload.data = payload.dataInicio; // Usar dataInicio como data base também
                    // Sempre usar frequência mensal para receitas
                    payload.frequenciaRecorrencia = 'mensal';
                    console.log('📤 Enviando receita recorrente:', { 
                        recorrente: payload.recorrente, 
                        dataInicio: payload.dataInicio, 
                        dataFinal: payload.dataFinal,
                        frequencia: payload.frequenciaRecorrencia,
                        payloadCompleto: JSON.stringify(payload, null, 2)
                    });
                }
                
                const resReceita = await axios[method](url, payload);
                
                // Se for criação recorrente, usar mensagem do backend
                if (!editingItem && payload.recorrente && payload.dataInicio && payload.dataFinal && resReceita.data.total) {
                    showToast(resReceita.data.message || `${resReceita.data.total} receita(s) recorrente(s) criada(s) com sucesso!`, 'success');
                } else {
                    const tipoCriado = formType;
                    showToast(editingItem ? `${tipoCriado} atualizado com sucesso!` : `${tipoCriado} criado com sucesso!`, 'success');
                }
            }
            fecharFormulario();
            
            // Atualizar tudo em paralelo para garantir que está tudo atualizado
            // Sempre atualizar o resumo e todas as listas, independente da aba ativa
            await Promise.all([
                carregarResumo(false),
                carregarDespesas(false),
                carregarReceitas(false),
                carregarPagamentosReceber(false)
            ]);
            
            setLoading(false);
        } catch (err) {
            console.error(`Erro ao ${editingItem ? 'atualizar' : 'criar'} ${formType}:`, err);
            showToast(err.response?.data?.message || `Erro ao ${editingItem ? 'atualizar' : 'criar'} ${formType}`, 'error');
            setLoading(false);
        }
    };

    const handleDelete = async (tipo, id) => {
        if (!window.confirm(`Tem certeza que deseja deletar este ${tipo}?`)) {
            return;
        }

        setConfirmModal({
            message: `Tem certeza que deseja deletar este ${tipo}?`,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    const url = tipo === 'pagamento' 
                        ? `/api/financeiro/pagamentos-receber/${id}`
                        : `/api/financeiro/${tipo}s/${id}`;
                    await axios.delete(url);
                    showToast(`${tipo} deletado com sucesso!`, 'success');
                    
                    // Atualizar tudo em paralelo para garantir que está tudo atualizado
                    // Sempre atualizar o resumo, independente da aba ativa
                    await Promise.all([
                        carregarResumo(false),
                        carregarDespesas(false),
                        carregarReceitas(false),
                        carregarPagamentosReceber(false)
                    ]);
                    
                    setLoading(false);
                } catch (err) {
                    console.error(`Erro ao deletar ${tipo}:`, err);
                    showToast(err.response?.data?.message || `Erro ao deletar ${tipo}`, 'error');
                    setLoading(false);
                }
            }
        });
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

    // Verificar se há algum filtro ativo
    const temFiltrosAtivos = () => {
        return !!(filtros.dataInicio || filtros.dataFim || filtros.categoria || filtros.status || filtros.alunoId);
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const renderFormulario = () => {
        if (!showForm) return null;
        
        return (
            <div className="card" style={{ marginBottom: '16px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
                        {editingItem 
                            ? `Editar ${formType === 'despesa' ? 'Despesa' : editingItem.tipo === 'pagamento' ? 'Pagamento a Receber' : 'Receita'}` 
                            : `Nova ${formType === 'despesa' ? 'Despesa' : 'Receita'}`}
                    </h2>
                    <button
                        onClick={fecharFormulario}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#e2e8f0',
                            fontSize: '1.25rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
                            e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        ×
                    </button>
                </div>
                {renderFormContent()}
            </div>
        );
    };

    const renderFormContent = () => {
        return (
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
                                    onChange={(e) => setFormData({ ...formData, pago: e.target.checked, dataPagamento: e.target.checked ? (formData.dataPagamento || new Date().toISOString().split('T')[0]) : '' })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }}
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
                                        onChange={(e) => {
                                            const dataPagamento = e.target.value;
                                            setFormData({ 
                                                ...formData, 
                                                dataPagamento,
                                                pago: dataPagamento ? true : formData.pago // Se preencher data, marca como pago
                                            });
                                        }}
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
                                        Data Vencimento (opcional)
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
                                        placeholder="Para criar um pagamento a receber, preencha aluno e data de vencimento"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.recebido || false}
                                    onChange={(e) => setFormData({ ...formData, recebido: e.target.checked, dataRecebimento: e.target.checked ? (formData.dataRecebimento || new Date().toISOString().split('T')[0]) : '' })}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#3b82f6' }}
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
                                        onChange={(e) => {
                                            const dataRecebimento = e.target.value;
                                            setFormData({ 
                                                ...formData, 
                                                dataRecebimento,
                                                recebido: dataRecebimento ? true : formData.recebido // Se preencher data, marca como recebido
                                            });
                                        }}
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
                            {formData.alunoId && formData.dataVencimento && (
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.2)',
                                    color: '#fbbf24',
                                    fontSize: '0.85rem'
                                }}>
                                    💡 Esta receita será criada como um <strong>Pagamento a Receber</strong> vinculado ao aluno.
                                </div>
                            )}
                        </>
                    )}

                    {/* Campos comuns para recorrentes - apenas ao criar, não ao editar */}
                    {!editingItem && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px' }}>
                            <input
                                type="checkbox"
                                checked={formData.recorrente || false}
                                onChange={(e) => {
                                    const isRecorrente = e.target.checked;
                                    // Se marcar como recorrente e dataInicio estiver vazio, preencher com data/dataVencimento
                                    const novoDataInicio = (!formData.dataInicio || formData.dataInicio.trim() === '') && isRecorrente
                                        ? (formData.data || formData.dataVencimento || new Date().toISOString().split('T')[0])
                                        : formData.dataInicio;
                                    setFormData({ 
                                        ...formData, 
                                        recorrente: isRecorrente,
                                        dataInicio: novoDataInicio
                                    });
                                }}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <label style={{ color: 'rgba(226, 232, 240, 0.9)', cursor: 'pointer', fontSize: '0.95rem' }}>Recorrente</label>
                        </div>
                    )}

                    {formData.recorrente && !editingItem && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.625rem', color: 'rgba(226, 232, 240, 0.9)', fontWeight: 500, fontSize: '0.95rem' }}>
                                        Data Início *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dataInicio || (formData.data || formData.dataVencimento || '')}
                                        onChange={(e) => {
                                            const dataInicio = e.target.value;
                                            setFormData({ 
                                                ...formData, 
                                                dataInicio: dataInicio || '', // Garantir que sempre salve no formData, mesmo se vazio
                                                // Atualizar também data/dataVencimento se não estiverem preenchidas
                                                data: formData.data || dataInicio,
                                                dataVencimento: formData.dataVencimento || dataInicio
                                            });
                                        }}
                                        required={formData.recorrente}
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
                                        Data Final *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dataFinal || ''}
                                        onChange={(e) => setFormData({ ...formData, dataFinal: e.target.value })}
                                        required={formData.recorrente}
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
                            {formData.dataInicio && formData.dataFinal && (
                                <div style={{
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    color: '#60a5fa',
                                    fontSize: '0.85rem'
                                }}>
                                    💡 Serão criadas automaticamente todas as ocorrências mensais de {new Date(formData.dataInicio).toLocaleDateString('pt-BR')} até {new Date(formData.dataFinal).toLocaleDateString('pt-BR')}.
                                </div>
                            )}
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
        );
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
            {/* Toast Notification */}
            {toast && (
                <div className={`toast-notification ${toast.type} show`}>
                    <div className="toast-content">
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação */}
            {confirmModal && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.5)',
                            zIndex: 10001,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onClick={() => setConfirmModal(null)}
                    >
                        <div
                            style={{
                                background: 'rgba(15, 23, 42, 0.98)',
                                borderRadius: '16px',
                                padding: '2rem',
                                maxWidth: '90%',
                                width: '400px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ margin: '0 0 1rem 0', color: '#e2e8f0', fontSize: '1.25rem' }}>
                                Confirmar ação
                            </h3>
                            <p style={{ margin: '0 0 2rem 0', color: 'rgba(226, 232, 240, 0.7)', fontSize: '0.95rem' }}>
                                {confirmModal.message}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn secondary"
                                    onClick={() => setConfirmModal(null)}
                                    style={{ padding: '0.75rem 1.5rem' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn danger"
                                    onClick={() => {
                                        confirmModal.onConfirm();
                                        setConfirmModal(null);
                                    }}
                                    style={{ padding: '0.75rem 1.5rem' }}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Tabs - Estilo Organizze (apenas se não controlado externamente) */}
            {externalActiveTab === undefined && (
                <div className="card" style={{ marginBottom: '16px', padding: '1.5rem' }}>
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
                        onClick={() => setActiveTab('alunos')}
                        style={{
                            border: 'none',
                            borderBottom: activeTab === 'alunos' ? '3px solid #1cb0f6' : '3px solid transparent',
                            borderRadius: '0',
                            background: 'transparent',
                            color: activeTab === 'alunos' ? '#1cb0f6' : 'rgba(226, 232, 240, 0.6)',
                            padding: '0.875rem 1.25rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            fontWeight: activeTab === 'alunos' ? 600 : 400,
                            fontSize: '0.95rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Alunos
                    </button>
                </div>
                </div>
                )}

            {/* Resumo - Estilo Organizze */}
            {activeTab === 'overview' && (
                <div>
                    {loading ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                            Carregando...
                        </div>
                    ) : resumo ? (
                        <>
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
                                        {temFiltrosAtivos() && (
                                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                                <button 
                                                    className="btn secondary" 
                                                    onClick={limparFiltros} 
                                                    style={{ width: '100%', padding: '0.75rem' }}
                                                >
                                                    Limpar Filtros
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

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
                                        {formatarMoeda(resumo.totalAReceber || (resumo.totalPagamentosPendentes || 0) + (resumo.totalReceitasPendentes || 0))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {/* Cadastro - Tela Dedicada para Formulários */}
            {activeTab === 'cadastro' && (
                <div>
                    {showForm ? (
                        renderFormulario()
                    ) : (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>➕</div>
                            <h2 style={{ marginBottom: '1rem', color: '#e2e8f0' }}>Novo Cadastro</h2>
                            <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '2rem' }}>
                                Clique no botão "+" no menu inferior para criar uma nova despesa, receita ou pagamento.
                            </p>
                        </div>
                    )}
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
                            {temFiltrosAtivos() && (
                                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                    <button 
                                        onClick={limparFiltros}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#e2e8f0',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                    >
                                        🗑️ Limpar Filtros
                                    </button>
                                </div>
                            )}
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
                            {temFiltrosAtivos() && (
                                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                    <button 
                                        onClick={limparFiltros}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#e2e8f0',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                    >
                                        🗑️ Limpar Filtros
                                    </button>
                                </div>
                            )}
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
                            <>
                                {/* Barra de ações em massa */}
                                {showBulkActions && (
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '1rem'
                                    }}>
                                        <div style={{ 
                                            color: '#60a5fa', 
                                            fontWeight: 600,
                                            fontSize: '0.95rem'
                                        }}>
                                            {receitasSelecionadas.length} receita(s) selecionada(s)
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => setBulkActionModal('marcar-recebido')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(34, 197, 94, 0.15)',
                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                    color: '#22c55e',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                ✓ Marcar como Recebido
                                            </button>
                                            <button
                                                onClick={() => setBulkActionModal('alterar-valor')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(251, 191, 36, 0.15)',
                                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                                    color: '#fbbf24',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                💰 Alterar Valor
                                            </button>
                                            <button
                                                onClick={() => setBulkActionModal('deletar')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(244, 63, 94, 0.15)',
                                                    border: '1px solid rgba(244, 63, 94, 0.3)',
                                                    color: '#f87171',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                🗑️ Deletar
                                            </button>
                                            <button
                                                onClick={deselecionarTodasReceitas}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#e2e8f0',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 500
                                                }}
                                            >
                                                ✕ Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Checkbox selecionar todas */}
                                <div style={{
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={receitasSelecionadas.length === receitas.length && receitas.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                selecionarTodasReceitas();
                                            } else {
                                                deselecionarTodasReceitas();
                                            }
                                        }}
                                        style={{ 
                                            width: '18px', 
                                            height: '18px', 
                                            cursor: 'pointer',
                                            accentColor: '#3b82f6'
                                        }}
                                    />
                                    <label style={{ 
                                        color: 'rgba(226, 232, 240, 0.7)', 
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}>
                                        Selecionar todas ({receitas.length})
                                    </label>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {receitas.map(receita => (
                                        <div
                                            key={receita._id}
                                            style={{
                                                padding: '1.25rem',
                                                borderRadius: '12px',
                                                background: receitasSelecionadas.includes(receita._id) 
                                                    ? 'rgba(59, 130, 246, 0.1)' 
                                                    : 'rgba(255, 255, 255, 0.04)',
                                                border: receitasSelecionadas.includes(receita._id)
                                                    ? '1px solid rgba(59, 130, 246, 0.3)'
                                                    : '1px solid rgba(255, 255, 255, 0.08)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '1rem',
                                                transition: 'all 0.2s',
                                                cursor: 'default'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!receitasSelecionadas.includes(receita._id)) {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!receitasSelecionadas.includes(receita._id)) {
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                }
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={receitasSelecionadas.includes(receita._id)}
                                                    onChange={() => {
                                                        toggleSelecionarReceita(receita._id);
                                                    }}
                                                    style={{ 
                                                        width: '18px', 
                                                        height: '18px', 
                                                        cursor: 'pointer',
                                                        flexShrink: 0,
                                                        accentColor: '#3b82f6'
                                                    }}
                                                />
                                                <div style={{ flex: 1 }}>
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
                                            <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                                                {!receita.recebido && (
                                                    <button
                                                        onClick={() => marcarReceitaComoRecebida(receita._id)}
                                                        style={{ 
                                                            padding: '0.5rem',
                                                            background: 'rgba(34, 197, 94, 0.15)',
                                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                                            borderRadius: '8px',
                                                            color: '#22c55e',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem'
                                                        }}
                                                        title="Marcar como recebida"
                                                    >
                                                        ✓
                                                    </button>
                                                )}
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

                                {/* Modal de ações em massa */}
                                {bulkActionModal === 'marcar-recebido' && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000
                                }}>
                                    <div style={{
                                        background: 'rgba(30, 41, 59, 0.95)',
                                        padding: '2rem',
                                        borderRadius: '16px',
                                        maxWidth: '400px',
                                        width: '90%',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#e2e8f0' }}>
                                            Marcar como Recebido
                                        </h3>
                                        <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                                            Deseja marcar {receitasSelecionadas.length} receita(s) como recebida(s)?
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setBulkActionModal(null);
                                                    deselecionarTodasReceitas();
                                                }}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#e2e8f0',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={marcarReceitasComoRecebidas}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(34, 197, 94, 0.15)',
                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                    color: '#22c55e',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {bulkActionModal === 'deletar' && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000
                                }}>
                                    <div style={{
                                        background: 'rgba(30, 41, 59, 0.95)',
                                        padding: '2rem',
                                        borderRadius: '16px',
                                        maxWidth: '400px',
                                        width: '90%',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#e2e8f0' }}>
                                            Deletar Receitas
                                        </h3>
                                        <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1.5rem' }}>
                                            Tem certeza que deseja deletar {receitasSelecionadas.length} receita(s)? Esta ação não pode ser desfeita.
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setBulkActionModal(null);
                                                    deselecionarTodasReceitas();
                                                }}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#e2e8f0',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={deletarReceitasSelecionadas}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(244, 63, 94, 0.15)',
                                                    border: '1px solid rgba(244, 63, 94, 0.3)',
                                                    color: '#f87171',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Deletar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {bulkActionModal === 'alterar-valor' && (
                                <div style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000
                                }}>
                                    <div style={{
                                        background: 'rgba(30, 41, 59, 0.95)',
                                        padding: '2rem',
                                        borderRadius: '16px',
                                        maxWidth: '400px',
                                        width: '90%',
                                        border: '1px solid rgba(255, 255, 255, 0.1)'
                                    }}>
                                        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#e2e8f0' }}>
                                            Alterar Valor
                                        </h3>
                                        <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginBottom: '1rem' }}>
                                            Novo valor para {receitasSelecionadas.length} receita(s):
                                        </p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={novoValorBulk}
                                            onChange={(e) => setNovoValorBulk(e.target.value)}
                                            placeholder="0.00"
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem',
                                                borderRadius: '8px',
                                                background: 'rgba(255, 255, 255, 0.08)',
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                color: '#fff',
                                                fontSize: '1rem',
                                                marginBottom: '1.5rem'
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => {
                                                    setBulkActionModal(null);
                                                    setNovoValorBulk('');
                                                }}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    background: 'rgba(255, 255, 255, 0.08)',
                                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                                    color: '#e2e8f0',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={alterarValorReceitas}
                                                disabled={!novoValorBulk || parseFloat(novoValorBulk) <= 0}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    borderRadius: '8px',
                                                    background: (!novoValorBulk || parseFloat(novoValorBulk) <= 0)
                                                        ? 'rgba(255, 255, 255, 0.05)'
                                                        : 'rgba(251, 191, 36, 0.15)',
                                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                                    color: (!novoValorBulk || parseFloat(novoValorBulk) <= 0)
                                                        ? 'rgba(226, 232, 240, 0.3)'
                                                        : '#fbbf24',
                                                    cursor: (!novoValorBulk || parseFloat(novoValorBulk) <= 0) ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 600
                                                }}
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Gerenciar Alunos */}
            {activeTab === 'alunos' && (
                <div>
                    <GerenciarAlunos />
                </div>
            )}

            {/* Controle de Mensalidades - REMOVIDO - Substituído por Alunos */}
            {false && activeTab === 'pagamentos' && (
                <div>
                    <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
                        <div style={{ 
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Controle de Mensalidades</h3>
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
                                    <option value="recebido">Pagas</option>
                                    <option value="pendente">Pendentes</option>
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
                            {temFiltrosAtivos() && (
                                <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                    <button 
                                        onClick={limparFiltros}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem',
                                            borderRadius: '8px',
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            color: '#e2e8f0',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                        }}
                                    >
                                        🗑️ Limpar Filtros
                                    </button>
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                Carregando...
                            </div>
                        ) : pagamentosReceber.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(226, 232, 240, 0.7)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                <p style={{ fontSize: '0.95rem' }}>Nenhuma mensalidade encontrada</p>
                            </div>
                        ) : (() => {
                            const hoje = new Date();
                            hoje.setHours(0, 0, 0, 0);
                            
                            // Organizar mensalidades por status
                            const mensalidadesVencidas = pagamentosReceber.filter(p => {
                                const vencimento = new Date(p.dataVencimento);
                                vencimento.setHours(0, 0, 0, 0);
                                return vencimento < hoje && !p.recebido;
                            });
                            
                            const mensalidadesPendentes = pagamentosReceber.filter(p => {
                                const vencimento = new Date(p.dataVencimento);
                                vencimento.setHours(0, 0, 0, 0);
                                return vencimento >= hoje && !p.recebido;
                            });
                            
                            const mensalidadesPagas = pagamentosReceber.filter(p => p.recebido);

                            const renderMensalidade = (pagamento) => {
                                const vencido = new Date(pagamento.dataVencimento) < hoje && !pagamento.recebido;
                                return (
                                    <div
                                        key={pagamento._id}
                                        style={{
                                            padding: '1.25rem',
                                            borderRadius: '12px',
                                            background: vencido 
                                                ? 'rgba(244, 63, 94, 0.08)' 
                                                : pagamento.recebido
                                                ? 'rgba(34, 197, 94, 0.05)'
                                                : 'rgba(255, 255, 255, 0.04)',
                                            border: `1px solid ${vencido 
                                                ? 'rgba(244, 63, 94, 0.2)' 
                                                : pagamento.recebido
                                                ? 'rgba(34, 197, 94, 0.2)'
                                                : 'rgba(255, 255, 255, 0.08)'}`,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = vencido 
                                                ? 'rgba(244, 63, 94, 0.12)' 
                                                : pagamento.recebido
                                                ? 'rgba(34, 197, 94, 0.08)'
                                                : 'rgba(255, 255, 255, 0.06)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = vencido 
                                                ? 'rgba(244, 63, 94, 0.08)' 
                                                : pagamento.recebido
                                                ? 'rgba(34, 197, 94, 0.05)'
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
                                                {pagamento.recebido && pagamento.dataRecebimento && (
                                                    <span style={{ color: '#22c55e' }}>
                                                        Pago em: {new Date(pagamento.dataRecebimento).toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ 
                                                    fontWeight: 700, 
                                                    color: pagamento.recebido ? '#22c55e' : '#fbbf24', 
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
                                                    {pagamento.recebido ? '✓ Pago' : 'Pendente'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {!pagamento.recebido && (
                                                    <button
                                                        onClick={() => marcarComoRecebido(pagamento._id)}
                                                        style={{ 
                                                            padding: '0.625rem 1rem',
                                                            background: 'rgba(34, 197, 94, 0.15)',
                                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                                            borderRadius: '8px',
                                                            color: '#22c55e',
                                                            cursor: 'pointer',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600,
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)';
                                                        }}
                                                    >
                                                        ✓ Marcar como Pago
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        const receitaFormat = {
                                                            ...pagamento,
                                                            categoria: 'mensalidade',
                                                            data: pagamento.dataVencimento,
                                                            tipo: 'pagamento'
                                                        };
                                                        abrirFormulario('receita', receitaFormat);
                                                    }}
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
                            };

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {/* Mensalidades Vencidas */}
                                    {mensalidadesVencidas.length > 0 && (
                                        <div>
                                            <h4 style={{ 
                                                margin: '0 0 1rem 0', 
                                                fontSize: '1.1rem', 
                                                fontWeight: 600, 
                                                color: '#f87171',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                ⚠️ Vencidas ({mensalidadesVencidas.length})
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {mensalidadesVencidas.map(renderMensalidade)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mensalidades Pendentes */}
                                    {mensalidadesPendentes.length > 0 && (
                                        <div>
                                            <h4 style={{ 
                                                margin: '0 0 1rem 0', 
                                                fontSize: '1.1rem', 
                                                fontWeight: 600, 
                                                color: '#fbbf24',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                📅 Pendentes ({mensalidadesPendentes.length})
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {mensalidadesPendentes.map(renderMensalidade)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mensalidades Pagas */}
                                    {mensalidadesPagas.length > 0 && (
                                        <div>
                                            <h4 style={{ 
                                                margin: '0 0 1rem 0', 
                                                fontSize: '1.1rem', 
                                                fontWeight: 600, 
                                                color: '#22c55e',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                ✓ Pagas ({mensalidadesPagas.length})
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {mensalidadesPagas.map(renderMensalidade)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceiroPage;
