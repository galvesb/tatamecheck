const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const Aluno = require('../models/Aluno');
const Presenca = require('../models/Presenca');
const Graduacao = require('../models/Graduacao');
const Academia = require('../models/Academia');
const User = require('../models/User');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Helper function para calcular distância entre duas coordenadas (Haversine)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em metros
}

// Check-in por geolocalização
router.post('/checkin', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.user.userId;

        // Validar coordenadas
        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Coordenadas de localização são obrigatórias' });
        }

        // Buscar aluno
        const aluno = await Aluno.findOne({ userId }).populate('academiaId');
        if (!aluno) {
            return res.status(404).json({ message: 'Perfil de aluno não encontrado' });
        }

        const academia = aluno.academiaId;
        if (!academia) {
            return res.status(404).json({ message: 'Academia não encontrada' });
        }

        // Verificar se já fez check-in hoje
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const checkinHoje = await Presenca.findOne({
            alunoId: aluno._id,
            data: { $gte: hoje, $lt: amanha }
        });

        if (checkinHoje) {
            return res.status(400).json({ message: 'Você já fez check-in hoje' });
        }

        // Calcular distância até a academia
        const distancia = calcularDistancia(
            latitude,
            longitude,
            academia.localizacao.latitude,
            academia.localizacao.longitude
        );

        const dentroDoRaio = distancia <= academia.localizacao.raioMetros;

        if (!dentroDoRaio) {
            return res.status(400).json({ 
                message: `Você está muito longe da academia. Distância: ${Math.round(distancia)}m. Raio permitido: ${academia.localizacao.raioMetros}m`,
                dentroDoRaio: false,
                distancia: Math.round(distancia)
            });
        }

        // Criar registro de presença
        const presenca = new Presenca({
            alunoId: aluno._id,
            data: new Date(),
            localizacao: {
                latitude,
                longitude,
                raioAcademia: academia.localizacao.raioMetros,
                dentroDoRaio: true
            },
            validada: true
        });

        await presenca.save();

        // Atualizar contador de dias de presença do aluno
        aluno.diasPresencaDesdeUltimaGraduacao += 1;
        await aluno.save();

        res.json({
            message: 'Check-in realizado com sucesso!',
            presenca: {
                id: presenca._id,
                data: presenca.data,
                distancia: Math.round(distancia)
            },
            progresso: {
                diasPresenca: aluno.diasPresencaDesdeUltimaGraduacao,
                diasNecessarios: aluno.diasNecessariosParaProximoGrau,
                diasRestantes: Math.max(0, aluno.diasNecessariosParaProximoGrau - aluno.diasPresencaDesdeUltimaGraduacao)
            }
        });
    } catch (err) {
        console.error('Check-in error:', err);
        res.status(500).json({ message: 'Erro ao realizar check-in', error: err.message });
    }
});

// Obter histórico de presenças
router.get('/presenca', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { inicio, fim } = req.query;

        const aluno = await Aluno.findOne({ userId });
        if (!aluno) {
            return res.status(404).json({ message: 'Perfil de aluno não encontrado' });
        }

        const query = { alunoId: aluno._id };
        
        // Filtro por período se fornecido
        if (inicio || fim) {
            query.data = {};
            if (inicio) query.data.$gte = new Date(inicio);
            if (fim) query.data.$lte = new Date(fim);
        }

        const presencas = await Presenca.find(query)
            .sort({ data: -1 })
            .limit(100);

        res.json({
            total: presencas.length,
            presencas: presencas.map(p => ({
                id: p._id,
                data: p.data,
                validada: p.validada,
                localizacao: p.localizacao
            }))
        });
    } catch (err) {
        console.error('Error fetching presencas:', err);
        res.status(500).json({ message: 'Erro ao buscar presenças', error: err.message });
    }
});

// Obter progresso do aluno
router.get('/progresso', async (req, res) => {
    try {
        const userId = req.user.userId;

        const aluno = await Aluno.findOne({ userId }).populate('academiaId');
        if (!aluno) {
            return res.status(404).json({ message: 'Perfil de aluno não encontrado' });
        }

        const academia = aluno.academiaId;
        const diasRestantes = Math.max(0, aluno.diasNecessariosParaProximoGrau - aluno.diasPresencaDesdeUltimaGraduacao);
        const percentualProgresso = aluno.diasNecessariosParaProximoGrau > 0
            ? Math.min(100, Math.round((aluno.diasPresencaDesdeUltimaGraduacao / aluno.diasNecessariosParaProximoGrau) * 100))
            : 0;
        const elegivel = aluno.diasPresencaDesdeUltimaGraduacao >= aluno.diasNecessariosParaProximoGrau;

        // Buscar última graduação
        const ultimaGraduacao = await Graduacao.findOne({ alunoId: aluno._id })
            .sort({ data: -1 })
            .populate('avaliadoPor', 'name');

        // Calcular tempo restante para próximo grau e próxima faixa
        let tempoRestanteProximoGrau = null;
        let tempoRestanteProximaFaixa = null;
        let proximoGrau = null;
        let proximaFaixa = null;

        if (academia?.configuracoes?.faixas && academia.configuracoes.faixas.length > 0) {
            // Encontrar configuração da faixa atual
            const faixaAtualConfig = academia.configuracoes.faixas.find(f => f.nome === aluno.faixaAtual);
            
            // Calcular meses decorridos desde a última graduação
            const dataUltimaGraduacao = aluno.ultimaGraduacao?.data || aluno.createdAt;
            const agora = new Date();
            const dataInicio = new Date(dataUltimaGraduacao);
            
            // Calcular diferença em meses de forma mais precisa
            const anosDiff = agora.getFullYear() - dataInicio.getFullYear();
            const mesesDiff = agora.getMonth() - dataInicio.getMonth();
            const diasDiff = agora.getDate() - dataInicio.getDate();
            let mesesDecorridos = anosDiff * 12 + mesesDiff;
            
            // Se os dias indicam que ainda não completou o mês atual, reduzir 1
            if (diasDiff < 0) {
                mesesDecorridos -= 1;
            }
            mesesDecorridos = Math.max(0, mesesDecorridos);

            if (faixaAtualConfig) {
                // Verificar se há próximo grau na faixa atual
                const proximoGrauNum = aluno.grauAtual + 1;
                const grauConfig = faixaAtualConfig.graus.find(g => g.numero === proximoGrauNum);

                if (grauConfig) {
                    // Há próximo grau na faixa atual
                    proximoGrau = `${proximoGrauNum}º Grau`;
                    const mesesNecessarios = grauConfig.tempoMinimoMeses;
                    const mesesFaltantes = Math.max(0, mesesNecessarios - mesesDecorridos);
                    tempoRestanteProximoGrau = {
                        meses: mesesFaltantes,
                        mesesNecessarios,
                        mesesDecorridos,
                        completo: mesesDecorridos >= mesesNecessarios
                    };
                }
                
                // Verificar se está no último grau da faixa para mostrar próxima faixa
                const ultimoGrauConfig = faixaAtualConfig.graus[faixaAtualConfig.graus.length - 1];
                if (ultimoGrauConfig && aluno.grauAtual >= ultimoGrauConfig.numero) {
                    // Aluno está no último grau ou além, precisa mudar de faixa
                    const faixaAtualIndex = academia.configuracoes.faixas.findIndex(f => f.nome === aluno.faixaAtual);
                    if (faixaAtualIndex >= 0 && faixaAtualIndex < academia.configuracoes.faixas.length - 1) {
                        proximaFaixa = academia.configuracoes.faixas[faixaAtualIndex + 1];
                        const mesesNecessarios = (proximaFaixa.tempoMinimoAnos * 12) + proximaFaixa.tempoMinimoMeses;
                        const mesesFaltantes = Math.max(0, mesesNecessarios - mesesDecorridos);
                        tempoRestanteProximaFaixa = {
                            meses: mesesFaltantes,
                            mesesNecessarios,
                            mesesDecorridos,
                            completo: mesesDecorridos >= mesesNecessarios,
                            nomeFaixa: proximaFaixa.nome
                        };
                        // Limpar próximo grau se já está no último
                        tempoRestanteProximoGrau = null;
                        proximoGrau = null;
                    }
                } else if (!grauConfig) {
                    // Não há próximo grau configurado, mostrar próxima faixa
                    const faixaAtualIndex = academia.configuracoes.faixas.findIndex(f => f.nome === aluno.faixaAtual);
                    if (faixaAtualIndex >= 0 && faixaAtualIndex < academia.configuracoes.faixas.length - 1) {
                        proximaFaixa = academia.configuracoes.faixas[faixaAtualIndex + 1];
                        const mesesNecessarios = (proximaFaixa.tempoMinimoAnos * 12) + proximaFaixa.tempoMinimoMeses;
                        const mesesFaltantes = Math.max(0, mesesNecessarios - mesesDecorridos);
                        tempoRestanteProximaFaixa = {
                            meses: mesesFaltantes,
                            mesesNecessarios,
                            mesesDecorridos,
                            completo: mesesDecorridos >= mesesNecessarios,
                            nomeFaixa: proximaFaixa.nome
                        };
                    }
                }
            }
        }

        res.json({
            faixaAtual: aluno.faixaAtual,
            grauAtual: aluno.grauAtual,
            diasPresenca: aluno.diasPresencaDesdeUltimaGraduacao,
            diasNecessarios: aluno.diasNecessariosParaProximoGrau,
            diasRestantes,
            percentualProgresso,
            elegivel,
            ultimaGraduacao: ultimaGraduacao ? {
                faixa: ultimaGraduacao.faixa,
                grau: ultimaGraduacao.grau,
                data: ultimaGraduacao.data,
                avaliadoPor: ultimaGraduacao.avaliadoPor?.name
            } : null,
            tempoRestanteProximoGrau,
            tempoRestanteProximaFaixa,
            proximoGrau,
            proximaFaixa: proximaFaixa?.nome || null
        });
    } catch (err) {
        console.error('Error fetching progresso:', err);
        res.status(500).json({ message: 'Erro ao buscar progresso', error: err.message });
    }
});

// Obter localização da academia
router.get('/academia', async (req, res) => {
    try {
        const userId = req.user.userId;

        const aluno = await Aluno.findOne({ userId }).populate('academiaId');
        if (!aluno) {
            return res.status(404).json({ message: 'Perfil de aluno não encontrado' });
        }

        const academia = aluno.academiaId;
        if (!academia) {
            return res.status(404).json({ message: 'Academia não encontrada' });
        }

        res.json({
            id: academia._id,
            nome: academia.nome,
            localizacao: {
                latitude: academia.localizacao.latitude,
                longitude: academia.localizacao.longitude,
                raioMetros: academia.localizacao.raioMetros
            }
        });
    } catch (err) {
        console.error('Erro ao buscar academia:', err);
        res.status(500).json({ message: 'Erro ao buscar localização da academia', error: err.message });
    }
});

// Obter histórico de graduações
router.get('/graduacoes', async (req, res) => {
    try {
        const userId = req.user.userId;

        const aluno = await Aluno.findOne({ userId });
        if (!aluno) {
            return res.status(404).json({ message: 'Perfil de aluno não encontrado' });
        }

        const graduacoes = await Graduacao.find({ alunoId: aluno._id })
            .sort({ data: -1 })
            .populate('avaliadoPor', 'name');

        res.json({
            total: graduacoes.length,
            graduacoes: graduacoes.map(g => ({
                id: g._id,
                faixa: g.faixa,
                grau: g.grau,
                data: g.data,
                diasPresencaAteGraduacao: g.diasPresencaAteGraduacao,
                avaliadoPor: g.avaliadoPor?.name,
                observacoes: g.observacoes
            }))
        });
    } catch (err) {
        console.error('Error fetching graduacoes:', err);
        res.status(500).json({ message: 'Erro ao buscar graduações', error: err.message });
    }
});

module.exports = router;

