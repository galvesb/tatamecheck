const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const Despesa = require('../models/Despesa');
const Receita = require('../models/Receita');
const PagamentoReceber = require('../models/PagamentoReceber');
const Aluno = require('../models/Aluno');
const Academia = require('../models/Academia');

// Middleware para obter academiaId do usuário
const getAcademiaId = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        
        // Se for admin, pode ter academiaId no body/query (apenas para POST/PUT)
        if (req.user.role === 'admin' && req.body && req.body.academiaId) {
            req.academiaId = req.body.academiaId;
            return next();
        }

        // Buscar academia do usuário
        let academiaId = null;
        
        if (req.user.role === 'aluno') {
            const aluno = await Aluno.findOne({ userId });
            if (aluno && aluno.academiaId) {
                academiaId = aluno.academiaId;
            }
        } else if (req.user.role === 'professor' || req.user.role === 'admin') {
            const academia = await Academia.findOne({ 
                $or: [
                    { administradorId: userId },
                    { professores: userId }
                ]
            });
            if (academia) {
                academiaId = academia._id;
            }
        }

        if (!academiaId) {
            return res.status(404).json({ message: 'Academia não encontrada' });
        }

        req.academiaId = academiaId;
        next();
    } catch (err) {
        console.error('Erro ao obter academiaId:', err);
        res.status(500).json({ message: 'Erro ao processar requisição', error: err.message });
    }
};

// ==================== DESPESAS ====================

// Listar despesas com filtros
router.get('/despesas', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const { 
            dataInicio, 
            dataFim, 
            categoria, 
            pago, 
            recorrente,
            limit = 50,
            skip = 0
        } = req.query;

        const filtro = { academiaId: req.academiaId };

        if (dataInicio || dataFim) {
            filtro.data = {};
            if (dataInicio) filtro.data.$gte = new Date(dataInicio);
            if (dataFim) filtro.data.$lte = new Date(dataFim);
        }

        if (categoria) filtro.categoria = categoria;
        if (pago !== undefined) filtro.pago = pago === 'true';
        if (recorrente !== undefined) filtro.recorrente = recorrente === 'true';

        const despesas = await Despesa.find(filtro)
            .populate('criadoPor', 'name email')
            .sort({ data: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Despesa.countDocuments(filtro);

        res.json({
            despesas,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (err) {
        console.error('Erro ao listar despesas:', err);
        res.status(500).json({ message: 'Erro ao listar despesas', error: err.message });
    }
});

// Criar despesa
router.post('/despesas', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const {
            descricao,
            valor,
            categoria,
            data,
            dataVencimento,
            pago,
            dataPagamento,
            recorrente,
            frequenciaRecorrencia,
            proximaOcorrencia,
            observacoes
        } = req.body;

        if (!descricao || !valor) {
            return res.status(400).json({ message: 'Descrição e valor são obrigatórios' });
        }

        const despesa = new Despesa({
            academiaId: req.academiaId,
            descricao,
            valor: parseFloat(valor),
            categoria: categoria || 'outros',
            data: data ? new Date(data) : new Date(),
            dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
            pago: pago || false,
            dataPagamento: dataPagamento ? new Date(dataPagamento) : (pago ? new Date() : null),
            recorrente: recorrente || false,
            frequenciaRecorrencia: frequenciaRecorrencia || 'mensal',
            proximaOcorrencia: proximaOcorrencia ? new Date(proximaOcorrencia) : null,
            observacoes: observacoes || '',
            criadoPor: req.user.userId
        });

        await despesa.save();
        await despesa.populate('criadoPor', 'name email');

        res.status(201).json({ message: 'Despesa criada com sucesso', despesa });
    } catch (err) {
        console.error('Erro ao criar despesa:', err);
        res.status(500).json({ message: 'Erro ao criar despesa', error: err.message });
    }
});

// Atualizar despesa
router.put('/despesas/:id', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const despesa = await Despesa.findOne({ 
            _id: req.params.id, 
            academiaId: req.academiaId 
        });

        if (!despesa) {
            return res.status(404).json({ message: 'Despesa não encontrada' });
        }

        const camposPermitidos = [
            'descricao', 'valor', 'categoria', 'data', 'dataVencimento',
            'pago', 'dataPagamento', 'recorrente', 'frequenciaRecorrencia',
            'proximaOcorrencia', 'observacoes'
        ];

        camposPermitidos.forEach(campo => {
            if (req.body[campo] !== undefined) {
                if (campo.includes('data') || campo.includes('Data')) {
                    despesa[campo] = req.body[campo] ? new Date(req.body[campo]) : null;
                } else {
                    despesa[campo] = req.body[campo];
                }
            }
        });

        // Se marcar como pago e não tiver dataPagamento, definir agora
        if (despesa.pago && !despesa.dataPagamento) {
            despesa.dataPagamento = new Date();
        }

        await despesa.save();
        await despesa.populate('criadoPor', 'name email');

        res.json({ message: 'Despesa atualizada com sucesso', despesa });
    } catch (err) {
        console.error('Erro ao atualizar despesa:', err);
        res.status(500).json({ message: 'Erro ao atualizar despesa', error: err.message });
    }
});

// Deletar despesa
router.delete('/despesas/:id', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const despesa = await Despesa.findOneAndDelete({ 
            _id: req.params.id, 
            academiaId: req.academiaId 
        });

        if (!despesa) {
            return res.status(404).json({ message: 'Despesa não encontrada' });
        }

        res.json({ message: 'Despesa deletada com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar despesa:', err);
        res.status(500).json({ message: 'Erro ao deletar despesa', error: err.message });
    }
});

// ==================== RECEITAS ====================

// Listar receitas com filtros
router.get('/receitas', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const { 
            dataInicio, 
            dataFim, 
            categoria, 
            recebido, 
            recorrente,
            alunoId,
            limit = 50,
            skip = 0
        } = req.query;

        const filtro = { academiaId: req.academiaId };

        if (dataInicio || dataFim) {
            filtro.data = {};
            if (dataInicio) filtro.data.$gte = new Date(dataInicio);
            if (dataFim) filtro.data.$lte = new Date(dataFim);
        }

        if (categoria) filtro.categoria = categoria;
        if (recebido !== undefined) filtro.recebido = recebido === 'true';
        if (recorrente !== undefined) filtro.recorrente = recorrente === 'true';
        if (alunoId) filtro.alunoId = alunoId;

        const receitas = await Receita.find(filtro)
            .populate('criadoPor', 'name email')
            .populate('alunoId', 'userId')
            .populate({
                path: 'alunoId',
                populate: { path: 'userId', select: 'name email' }
            })
            .sort({ data: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await Receita.countDocuments(filtro);

        res.json({
            receitas,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (err) {
        console.error('Erro ao listar receitas:', err);
        res.status(500).json({ message: 'Erro ao listar receitas', error: err.message });
    }
});

// Criar receita
router.post('/receitas', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const {
            descricao,
            valor,
            categoria,
            data,
            dataRecebimento,
            recebido,
            alunoId,
            recorrente,
            frequenciaRecorrencia,
            proximaOcorrencia,
            observacoes
        } = req.body;

        if (!descricao || !valor) {
            return res.status(400).json({ message: 'Descrição e valor são obrigatórios' });
        }

        const receita = new Receita({
            academiaId: req.academiaId,
            descricao,
            valor: parseFloat(valor),
            categoria: categoria || 'outros',
            data: data ? new Date(data) : new Date(),
            dataRecebimento: dataRecebimento ? new Date(dataRecebimento) : null,
            recebido: recebido || false,
            alunoId: alunoId || null,
            recorrente: recorrente || false,
            frequenciaRecorrencia: frequenciaRecorrencia || 'mensal',
            proximaOcorrencia: proximaOcorrencia ? new Date(proximaOcorrencia) : null,
            observacoes: observacoes || '',
            criadoPor: req.user.userId
        });

        await receita.save();
        await receita.populate('criadoPor', 'name email');
        if (receita.alunoId) {
            await receita.populate({
                path: 'alunoId',
                populate: { path: 'userId', select: 'name email' }
            });
        }

        res.status(201).json({ message: 'Receita criada com sucesso', receita });
    } catch (err) {
        console.error('Erro ao criar receita:', err);
        res.status(500).json({ message: 'Erro ao criar receita', error: err.message });
    }
});

// Atualizar receita
router.put('/receitas/:id', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const receita = await Receita.findOne({ 
            _id: req.params.id, 
            academiaId: req.academiaId 
        });

        if (!receita) {
            return res.status(404).json({ message: 'Receita não encontrada' });
        }

        const camposPermitidos = [
            'descricao', 'valor', 'categoria', 'data', 'dataRecebimento',
            'recebido', 'alunoId', 'recorrente', 'frequenciaRecorrencia',
            'proximaOcorrencia', 'observacoes'
        ];

        camposPermitidos.forEach(campo => {
            if (req.body[campo] !== undefined) {
                if (campo.includes('data') || campo.includes('Data')) {
                    receita[campo] = req.body[campo] ? new Date(req.body[campo]) : null;
                } else {
                    receita[campo] = req.body[campo];
                }
            }
        });

        // Se marcar como recebido e não tiver dataRecebimento, definir agora
        if (receita.recebido && !receita.dataRecebimento) {
            receita.dataRecebimento = new Date();
        }

        await receita.save();
        await receita.populate('criadoPor', 'name email');
        if (receita.alunoId) {
            await receita.populate({
                path: 'alunoId',
                populate: { path: 'userId', select: 'name email' }
            });
        }

        res.json({ message: 'Receita atualizada com sucesso', receita });
    } catch (err) {
        console.error('Erro ao atualizar receita:', err);
        res.status(500).json({ message: 'Erro ao atualizar receita', error: err.message });
    }
});

// Deletar receita
router.delete('/receitas/:id', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const receita = await Receita.findOneAndDelete({ 
            _id: req.params.id, 
            academiaId: req.academiaId 
        });

        if (!receita) {
            return res.status(404).json({ message: 'Receita não encontrada' });
        }

        res.json({ message: 'Receita deletada com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar receita:', err);
        res.status(500).json({ message: 'Erro ao deletar receita', error: err.message });
    }
});

// ==================== PAGAMENTOS A RECEBER ====================

// Listar pagamentos a receber com filtros
router.get('/pagamentos-receber', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const { 
            dataVencimentoInicio, 
            dataVencimentoFim, 
            recebido, 
            recorrente,
            alunoId,
            limit = 50,
            skip = 0
        } = req.query;

        const filtro = { academiaId: req.academiaId };

        if (dataVencimentoInicio || dataVencimentoFim) {
            filtro.dataVencimento = {};
            if (dataVencimentoInicio) filtro.dataVencimento.$gte = new Date(dataVencimentoInicio);
            if (dataVencimentoFim) filtro.dataVencimento.$lte = new Date(dataVencimentoFim);
        }

        if (recebido !== undefined) filtro.recebido = recebido === 'true';
        if (recorrente !== undefined) filtro.recorrente = recorrente === 'true';
        if (alunoId) filtro.alunoId = alunoId;

        const pagamentos = await PagamentoReceber.find(filtro)
            .populate('criadoPor', 'name email')
            .populate('alunoId', 'userId')
            .populate({
                path: 'alunoId',
                populate: { path: 'userId', select: 'name email' }
            })
            .sort({ dataVencimento: 1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await PagamentoReceber.countDocuments(filtro);

        res.json({
            pagamentos,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (err) {
        console.error('Erro ao listar pagamentos a receber:', err);
        res.status(500).json({ message: 'Erro ao listar pagamentos a receber', error: err.message });
    }
});

// Criar pagamento a receber
router.post('/pagamentos-receber', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const {
            alunoId,
            descricao,
            valor,
            dataVencimento,
            recorrente,
            frequenciaRecorrencia,
            proximaOcorrencia,
            observacoes
        } = req.body;

        if (!alunoId || !descricao || !valor || !dataVencimento) {
            return res.status(400).json({ message: 'Aluno, descrição, valor e data de vencimento são obrigatórios' });
        }

        const pagamento = new PagamentoReceber({
            academiaId: req.academiaId,
            alunoId,
            descricao,
            valor: parseFloat(valor),
            dataVencimento: new Date(dataVencimento),
            recebido: false,
            recorrente: recorrente || false,
            frequenciaRecorrencia: frequenciaRecorrencia || 'mensal',
            proximaOcorrencia: proximaOcorrencia ? new Date(proximaOcorrencia) : null,
            observacoes: observacoes || '',
            criadoPor: req.user.userId
        });

        await pagamento.save();
        await pagamento.populate('criadoPor', 'name email');
        await pagamento.populate({
            path: 'alunoId',
            populate: { path: 'userId', select: 'name email' }
        });

        res.status(201).json({ message: 'Pagamento a receber criado com sucesso', pagamento });
    } catch (err) {
        console.error('Erro ao criar pagamento a receber:', err);
        res.status(500).json({ message: 'Erro ao criar pagamento a receber', error: err.message });
    }
});

// Atualizar pagamento a receber
router.put('/pagamentos-receber/:id', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const pagamento = await PagamentoReceber.findOne({ 
            _id: req.params.id, 
            academiaId: req.academiaId 
        });

        if (!pagamento) {
            return res.status(404).json({ message: 'Pagamento a receber não encontrado' });
        }

        const camposPermitidos = [
            'descricao', 'valor', 'dataVencimento', 'dataRecebimento',
            'recebido', 'recorrente', 'frequenciaRecorrencia',
            'proximaOcorrencia', 'observacoes'
        ];

        camposPermitidos.forEach(campo => {
            if (req.body[campo] !== undefined) {
                if (campo.includes('data') || campo.includes('Data')) {
                    pagamento[campo] = req.body[campo] ? new Date(req.body[campo]) : null;
                } else {
                    pagamento[campo] = req.body[campo];
                }
            }
        });

        // Se marcar como recebido e não tiver dataRecebimento, definir agora
        if (pagamento.recebido && !pagamento.dataRecebimento) {
            pagamento.dataRecebimento = new Date();
        }

        await pagamento.save();
        await pagamento.populate('criadoPor', 'name email');
        await pagamento.populate({
            path: 'alunoId',
            populate: { path: 'userId', select: 'name email' }
        });

        res.json({ message: 'Pagamento a receber atualizado com sucesso', pagamento });
    } catch (err) {
        console.error('Erro ao atualizar pagamento a receber:', err);
        res.status(500).json({ message: 'Erro ao atualizar pagamento a receber', error: err.message });
    }
});

// Deletar pagamento a receber
router.delete('/pagamentos-receber/:id', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const pagamento = await PagamentoReceber.findOneAndDelete({ 
            _id: req.params.id, 
            academiaId: req.academiaId 
        });

        if (!pagamento) {
            return res.status(404).json({ message: 'Pagamento a receber não encontrado' });
        }

        res.json({ message: 'Pagamento a receber deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao deletar pagamento a receber:', err);
        res.status(500).json({ message: 'Erro ao deletar pagamento a receber', error: err.message });
    }
});

// ==================== DASHBOARD/RESUMO ====================

// Obter resumo financeiro
router.get('/resumo', authMiddleware, requireRole(['admin', 'professor']), getAcademiaId, async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;
        
        const filtroData = {};
        if (dataInicio) filtroData.$gte = new Date(dataInicio);
        if (dataFim) filtroData.$lte = new Date(dataFim);

        // Receitas recebidas
        const filtroReceitas = { 
            academiaId: req.academiaId, 
            recebido: true 
        };
        if (dataInicio || dataFim) {
            filtroReceitas.dataRecebimento = filtroData;
        }
        const totalReceitas = await Receita.aggregate([
            { $match: filtroReceitas },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]);

        // Despesas pagas
        const filtroDespesas = { 
            academiaId: req.academiaId, 
            pago: true 
        };
        if (dataInicio || dataFim) {
            filtroDespesas.dataPagamento = filtroData;
        }
        const totalDespesas = await Despesa.aggregate([
            { $match: filtroDespesas },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]);

        // Pagamentos a receber (pendentes)
        const filtroPagamentosPendentes = { 
            academiaId: req.academiaId, 
            recebido: false 
        };
        if (dataInicio || dataFim) {
            filtroPagamentosPendentes.dataVencimento = filtroData;
        }
        const totalPagamentosPendentes = await PagamentoReceber.aggregate([
            { $match: filtroPagamentosPendentes },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]);

        // Despesas pendentes
        const filtroDespesasPendentes = { 
            academiaId: req.academiaId, 
            pago: false 
        };
        if (dataInicio || dataFim) {
            filtroDespesasPendentes.dataVencimento = filtroData;
        }
        const totalDespesasPendentes = await Despesa.aggregate([
            { $match: filtroDespesasPendentes },
            { $group: { _id: null, total: { $sum: '$valor' } } }
        ]);

        // Receitas por categoria
        const receitasPorCategoria = await Receita.aggregate([
            { $match: { ...filtroReceitas, recebido: true } },
            { $group: { _id: '$categoria', total: { $sum: '$valor' } } },
            { $sort: { total: -1 } }
        ]);

        // Despesas por categoria
        const despesasPorCategoria = await Despesa.aggregate([
            { $match: { ...filtroDespesas, pago: true } },
            { $group: { _id: '$categoria', total: { $sum: '$valor' } } },
            { $sort: { total: -1 } }
        ]);

        res.json({
            totalReceitas: totalReceitas[0]?.total || 0,
            totalDespesas: totalDespesas[0]?.total || 0,
            saldo: (totalReceitas[0]?.total || 0) - (totalDespesas[0]?.total || 0),
            totalPagamentosPendentes: totalPagamentosPendentes[0]?.total || 0,
            totalDespesasPendentes: totalDespesasPendentes[0]?.total || 0,
            receitasPorCategoria,
            despesasPorCategoria
        });
    } catch (err) {
        console.error('Erro ao obter resumo financeiro:', err);
        res.status(500).json({ message: 'Erro ao obter resumo financeiro', error: err.message });
    }
});

module.exports = router;

