const express = require('express');
const bcrypt = require('bcryptjs');
const { authMiddleware, professorMiddleware } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Aluno = require('../models/Aluno');
const Academia = require('../models/Academia');
const Presenca = require('../models/Presenca');
const Graduacao = require('../models/Graduacao');

const router = express.Router();

// Todas as rotas requerem autenticação e permissão de professor/admin
router.use(authMiddleware);
router.use(professorMiddleware);

// Cadastrar novo aluno
router.post('/alunos', async (req, res) => {
    try {
        const { name, email, password, faixaInicial = 'Branca', grauInicial = 0 } = req.body;

        // Validar campos obrigatórios
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
        }

        // Verificar se email já existe
        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Criar usuário com role 'aluno'
        const user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'aluno'
        });

        await user.save();

        // Buscar academia (por enquanto, busca a primeira ou cria uma padrão)
        let academia = await Academia.findOne();
        if (!academia) {
            // Se não existe academia, cria uma padrão com localização de Caraguatatuba
            // R. Victor Augusto Mesquita - Massaguaçu, Caraguatatuba - SP, 11677-390
            academia = new Academia({
                nome: 'TatameCheck Academia',
                endereco: 'R. Victor Augusto Mesquita - Massaguaçu, Caraguatatuba - SP, 11677-390',
                localizacao: {
                    latitude: -23.6183,  // Aproximado - pode ser ajustado via API
                    longitude: -45.4211, // Aproximado - pode ser ajustado via API
                    raioMetros: 100
                },
                administradorId: req.user.userId
            });
            await academia.save();
        }

        // Criar perfil de aluno
        const aluno = new Aluno({
            userId: user._id,
            academiaId: academia._id,
            faixaAtual: faixaInicial,
            grauAtual: grauInicial,
            diasPresencaDesdeUltimaGraduacao: 0,
            diasNecessariosParaProximoGrau: academia.configuracoes?.diasMinimosParaGraduacao || 50
        });

        await aluno.save();

        res.status(201).json({
            message: 'Aluno cadastrado com sucesso',
            aluno: {
                id: aluno._id,
                userId: user._id,
                name: user.name,
                email: user.email,
                faixaAtual: aluno.faixaAtual,
                grauAtual: aluno.grauAtual
            }
        });
    } catch (err) {
        console.error('Erro ao cadastrar aluno:', err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        res.status(500).json({ 
            message: 'Erro ao cadastrar aluno',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Listar todos os alunos
router.get('/alunos', async (req, res) => {
    try {
        const alunos = await Aluno.find()
            .populate('userId', 'name email')
            .populate('academiaId', 'nome')
            .sort({ createdAt: -1 });

        res.json({
            total: alunos.length,
            alunos: alunos.map(aluno => ({
                id: aluno._id,
                userId: aluno.userId._id,
                name: aluno.userId.name,
                email: aluno.userId.email,
                faixaAtual: aluno.faixaAtual,
                grauAtual: aluno.grauAtual,
                diasPresenca: aluno.diasPresencaDesdeUltimaGraduacao,
                diasNecessarios: aluno.diasNecessariosParaProximoGrau,
                elegivel: aluno.diasPresencaDesdeUltimaGraduacao >= aluno.diasNecessariosParaProximoGrau,
                academia: aluno.academiaId?.nome
            }))
        });
    } catch (err) {
        console.error('Erro ao listar alunos:', err);
        res.status(500).json({ message: 'Erro ao listar alunos', error: err.message });
    }
});

// Obter detalhes de um aluno específico
router.get('/alunos/:id', async (req, res) => {
    try {
        const aluno = await Aluno.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('academiaId', 'nome localizacao');

        if (!aluno) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }

        // Buscar presenças recentes
        const presencas = await Presenca.find({ alunoId: aluno._id })
            .sort({ data: -1 })
            .limit(30);

        // Buscar graduações
        const graduacoes = await Graduacao.find({ alunoId: aluno._id })
            .sort({ data: -1 })
            .populate('avaliadoPor', 'name');

        res.json({
            aluno: {
                id: aluno._id,
                userId: aluno.userId._id,
                name: aluno.userId.name,
                email: aluno.userId.email,
                faixaAtual: aluno.faixaAtual,
                grauAtual: aluno.grauAtual,
                diasPresenca: aluno.diasPresencaDesdeUltimaGraduacao,
                diasNecessarios: aluno.diasNecessariosParaProximoGrau,
                elegivel: aluno.diasPresencaDesdeUltimaGraduacao >= aluno.diasNecessariosParaProximoGrau,
                academia: aluno.academiaId?.nome
            },
            presencas: presencas.map(p => ({
                id: p._id,
                data: p.data,
                validada: p.validada
            })),
            graduacoes: graduacoes.map(g => ({
                id: g._id,
                faixa: g.faixa,
                grau: g.grau,
                data: g.data,
                avaliadoPor: g.avaliadoPor?.name
            }))
        });
    } catch (err) {
        console.error('Erro ao buscar aluno:', err);
        res.status(500).json({ message: 'Erro ao buscar aluno', error: err.message });
    }
});

// Configurar/Atualizar localização da academia
router.put('/academia', async (req, res) => {
    try {
        const { nome, endereco, latitude, longitude, raioMetros } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Latitude e longitude são obrigatórios' });
        }

        // Buscar ou criar academia
        let academia = await Academia.findOne();
        
        if (academia) {
            // Atualizar academia existente
            academia.nome = nome || academia.nome;
            academia.endereco = endereco || academia.endereco;
            academia.localizacao.latitude = latitude;
            academia.localizacao.longitude = longitude;
            if (raioMetros !== undefined) {
                academia.localizacao.raioMetros = raioMetros;
            }
            await academia.save();
        } else {
            // Criar nova academia
            academia = new Academia({
                nome: nome || 'TatameCheck Academia',
                endereco: endereco || '',
                localizacao: {
                    latitude,
                    longitude,
                    raioMetros: raioMetros || 100
                },
                administradorId: req.user.userId
            });
            await academia.save();
        }

        res.json({
            message: 'Localização da academia configurada com sucesso',
            academia: {
                id: academia._id,
                nome: academia.nome,
                endereco: academia.endereco,
                localizacao: {
                    latitude: academia.localizacao.latitude,
                    longitude: academia.localizacao.longitude,
                    raioMetros: academia.localizacao.raioMetros
                }
            }
        });
    } catch (err) {
        console.error('Erro ao configurar academia:', err);
        res.status(500).json({ message: 'Erro ao configurar academia', error: err.message });
    }
});

// Obter informações da academia
router.get('/academia', async (req, res) => {
    try {
        const academia = await Academia.findOne();
        
        if (!academia) {
            return res.status(404).json({ message: 'Academia não configurada' });
        }

        res.json({
            id: academia._id,
            nome: academia.nome,
            endereco: academia.endereco,
            localizacao: {
                latitude: academia.localizacao.latitude,
                longitude: academia.localizacao.longitude,
                raioMetros: academia.localizacao.raioMetros
            },
            configuracoes: {
                faixas: academia.configuracoes?.faixas || []
            }
        });
    } catch (err) {
        console.error('Erro ao buscar academia:', err);
        res.status(500).json({ message: 'Erro ao buscar academia', error: err.message });
    }
});

// ====== ROTAS DE CONFIGURAÇÃO DE FAIXAS E GRAUS ======

// Obter todas as configurações de faixas
router.get('/configuracoes/faixas', async (req, res) => {
    try {
        const academia = await Academia.findOne();
        
        if (!academia) {
            return res.status(404).json({ message: 'Academia não configurada' });
        }

        res.json({
            faixas: academia.configuracoes?.faixas || []
        });
    } catch (err) {
        console.error('Erro ao buscar configurações de faixas:', err);
        res.status(500).json({ message: 'Erro ao buscar configurações', error: err.message });
    }
});

// Criar ou atualizar configuração de faixa
router.post('/configuracoes/faixas', async (req, res) => {
    try {
        const { nome, ordem, tempoMinimoMeses, tempoMinimoAnos, numeroMaximoGraus, graus } = req.body;

        if (!nome || !ordem || !numeroMaximoGraus || !graus || !Array.isArray(graus)) {
            return res.status(400).json({ 
                message: 'Nome, ordem, número máximo de graus e array de graus são obrigatórios' 
            });
        }

        // Validar que pelo menos um tempo (anos ou meses) foi definido
        const tempoMeses = parseInt(tempoMinimoMeses) || 0;
        const tempoAnos = parseInt(tempoMinimoAnos) || 0;
        if (tempoMeses === 0 && tempoAnos === 0) {
            return res.status(400).json({ 
                message: 'Pelo menos um tempo mínimo (anos ou meses) deve ser maior que zero' 
            });
        }

        let academia = await Academia.findOne();
        
        if (!academia) {
            return res.status(404).json({ message: 'Academia não configurada. Configure a academia primeiro.' });
        }

        // Validar graus
        if (graus.length === 0 || graus.length > numeroMaximoGraus) {
            return res.status(400).json({ 
                message: `O número de graus deve estar entre 1 e ${numeroMaximoGraus}` 
            });
        }

        // Verificar se a faixa já existe
        if (!academia.configuracoes.faixas) {
            academia.configuracoes.faixas = [];
        }

        const faixaIndex = academia.configuracoes.faixas.findIndex(f => f.nome === nome);

        const novaFaixa = {
            nome: nome.trim(),
            ordem: parseInt(ordem),
            tempoMinimoMeses: parseInt(tempoMinimoMeses) || 0,
            tempoMinimoAnos: parseInt(tempoMinimoAnos) || 0,
            numeroMaximoGraus: parseInt(numeroMaximoGraus),
            graus: graus.map(g => ({
                numero: parseInt(g.numero),
                tempoMinimoMeses: parseInt(g.tempoMinimoMeses)
            })).sort((a, b) => a.numero - b.numero)
        };

        if (faixaIndex >= 0) {
            // Atualizar faixa existente
            academia.configuracoes.faixas[faixaIndex] = novaFaixa;
        } else {
            // Adicionar nova faixa
            academia.configuracoes.faixas.push(novaFaixa);
        }

        // Ordenar faixas por ordem
        academia.configuracoes.faixas.sort((a, b) => a.ordem - b.ordem);

        await academia.save();

        res.json({
            message: faixaIndex >= 0 ? 'Faixa atualizada com sucesso' : 'Faixa criada com sucesso',
            faixa: novaFaixa
        });
    } catch (err) {
        console.error('Erro ao salvar configuração de faixa:', err);
        res.status(500).json({ message: 'Erro ao salvar configuração', error: err.message });
    }
});

// Atualizar uma faixa específica
router.put('/configuracoes/faixas/:nome', async (req, res) => {
    try {
        const { nome } = req.params;
        const { ordem, tempoMinimoMeses, tempoMinimoAnos, numeroMaximoGraus, graus } = req.body;

        const academia = await Academia.findOne();
        
        if (!academia || !academia.configuracoes?.faixas) {
            return res.status(404).json({ message: 'Academia não configurada ou faixa não encontrada' });
        }

        const faixaIndex = academia.configuracoes.faixas.findIndex(f => f.nome === nome);
        
        if (faixaIndex < 0) {
            return res.status(404).json({ message: 'Faixa não encontrada' });
        }

        // Atualizar campos fornecidos
        if (ordem !== undefined) academia.configuracoes.faixas[faixaIndex].ordem = parseInt(ordem);
        if (tempoMinimoMeses !== undefined) academia.configuracoes.faixas[faixaIndex].tempoMinimoMeses = parseInt(tempoMinimoMeses);
        if (tempoMinimoAnos !== undefined) academia.configuracoes.faixas[faixaIndex].tempoMinimoAnos = parseInt(tempoMinimoAnos);
        if (numeroMaximoGraus !== undefined) academia.configuracoes.faixas[faixaIndex].numeroMaximoGraus = parseInt(numeroMaximoGraus);
        if (graus && Array.isArray(graus)) {
            academia.configuracoes.faixas[faixaIndex].graus = graus.map(g => ({
                numero: parseInt(g.numero),
                tempoMinimoMeses: parseInt(g.tempoMinimoMeses)
            })).sort((a, b) => a.numero - b.numero);
        }

        // Reordenar
        academia.configuracoes.faixas.sort((a, b) => a.ordem - b.ordem);

        await academia.save();

        res.json({
            message: 'Faixa atualizada com sucesso',
            faixa: academia.configuracoes.faixas[faixaIndex]
        });
    } catch (err) {
        console.error('Erro ao atualizar faixa:', err);
        res.status(500).json({ message: 'Erro ao atualizar faixa', error: err.message });
    }
});

// Deletar uma faixa
router.delete('/configuracoes/faixas/:nome', async (req, res) => {
    try {
        const { nome } = req.params;

        const academia = await Academia.findOne();
        
        if (!academia || !academia.configuracoes?.faixas) {
            return res.status(404).json({ message: 'Academia não configurada' });
        }

        const faixaIndex = academia.configuracoes.faixas.findIndex(f => f.nome === nome);
        
        if (faixaIndex < 0) {
            return res.status(404).json({ message: 'Faixa não encontrada' });
        }

        academia.configuracoes.faixas.splice(faixaIndex, 1);
        await academia.save();

        res.json({
            message: 'Faixa deletada com sucesso'
        });
    } catch (err) {
        console.error('Erro ao deletar faixa:', err);
        res.status(500).json({ message: 'Erro ao deletar faixa', error: err.message });
    }
});

// Registrar graduação de um aluno
router.post('/alunos/:id/graduacao', async (req, res) => {
    try {
        const { faixa, grau, observacoes } = req.body;
        const alunoId = req.params.id;

        if (!faixa || grau === undefined) {
            return res.status(400).json({ message: 'Faixa e grau são obrigatórios' });
        }

        const aluno = await Aluno.findById(alunoId);
        if (!aluno) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }

        // Criar registro de graduação
        const graduacao = new Graduacao({
            alunoId: aluno._id,
            faixa,
            grau: parseInt(grau),
            data: new Date(),
            diasPresencaAteGraduacao: aluno.diasPresencaDesdeUltimaGraduacao,
            avaliadoPor: req.user.userId,
            observacoes: observacoes || ''
        });

        await graduacao.save();

        // Atualizar perfil do aluno
        aluno.faixaAtual = faixa;
        aluno.grauAtual = parseInt(grau);
        aluno.diasPresencaDesdeUltimaGraduacao = 0;
        aluno.ultimaGraduacao = {
            data: new Date(),
            faixa,
            grau: parseInt(grau)
        };

        // Buscar configurações da academia para definir próximos requisitos
        const academia = await Academia.findById(aluno.academiaId);
        if (academia?.configuracoes?.diasMinimosPorGrau) {
            const diasPorGrau = academia.configuracoes.diasMinimosPorGrau.get(faixa);
            aluno.diasNecessariosParaProximoGrau = diasPorGrau || 50;
        } else {
            aluno.diasNecessariosParaProximoGrau = 50;
        }

        await aluno.save();

        res.json({
            message: 'Graduação registrada com sucesso',
            graduacao: {
                id: graduacao._id,
                faixa: graduacao.faixa,
                grau: graduacao.grau,
                data: graduacao.data
            },
            aluno: {
                faixaAtual: aluno.faixaAtual,
                grauAtual: aluno.grauAtual,
                diasPresenca: aluno.diasPresencaDesdeUltimaGraduacao
            }
        });
    } catch (err) {
        console.error('Erro ao registrar graduação:', err);
        res.status(500).json({ message: 'Erro ao registrar graduação', error: err.message });
    }
});

module.exports = router;

