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

        // Validar coordenadas se fornecidas
        let dentroDoRaio = false;
        let distancia = null;
        let validada = false;

        if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
            // Calcular distância até a academia
            distancia = calcularDistancia(
                latitude,
                longitude,
                academia.localizacao.latitude,
                academia.localizacao.longitude
            );

            dentroDoRaio = distancia <= academia.localizacao.raioMetros;
            validada = dentroDoRaio;

            // Se estiver fora do raio, ainda permite check-in mas marca como não validado
            if (!dentroDoRaio) {
                // Ainda permite check-in, mas marca como não validado
                // O professor pode validar manualmente depois
            }
        } else {
            // Sem coordenadas válidas - permite check-in manual (não validado)
            // Útil quando o GPS não funciona ou o mapa falha
        }

        // Criar registro de presença
        const presenca = new Presenca({
            alunoId: aluno._id,
            data: new Date(),
            localizacao: latitude && longitude ? {
                latitude,
                longitude,
                raioAcademia: academia.localizacao.raioMetros,
                dentroDoRaio: dentroDoRaio,
                distancia: distancia ? Math.round(distancia) : null
            } : null,
            validada: validada
        });

        await presenca.save();

        // Atualizar contador de dias de presença do aluno
        aluno.diasPresencaDesdeUltimaGraduacao += 1;
        await aluno.save();

        let mensagem = 'Check-in realizado com sucesso!';
        if (!validada && latitude && longitude) {
            mensagem = `Check-in realizado, mas você está fora do raio permitido (${Math.round(distancia)}m). O professor pode validar manualmente.`;
        } else if (!validada && !latitude && !longitude) {
            mensagem = 'Check-in realizado sem validação de localização. O professor pode validar manualmente.';
        }

        res.json({
            message: mensagem,
            presenca: {
                id: presenca._id,
                data: presenca.data,
                distancia: distancia ? Math.round(distancia) : null,
                validada: validada
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
        // BASEADO EM DIAS DE PRESENÇA, não em tempo decorrido
        let tempoRestanteProximoGrau = null;
        let tempoRestanteProximaFaixa = null;
        let proximoGrau = null;
        let proximaFaixa = null;

        // Dias de presença desde a última graduação
        const diasPresenca = aluno.diasPresencaDesdeUltimaGraduacao || 0;

        if (academia?.configuracoes?.faixas && academia.configuracoes.faixas.length > 0) {
            // Encontrar configuração da faixa atual
            const faixaAtualConfig = academia.configuracoes.faixas.find(f => f.nome === aluno.faixaAtual);
            
            // Converter meses para dias (aproximação: 1 mês = 30 dias)
            const converterMesesParaDias = (meses) => meses * 30;

            if (faixaAtualConfig) {
                // Verificar qual é o último grau da faixa atual
                const ultimoGrauConfig = faixaAtualConfig.graus[faixaAtualConfig.graus.length - 1];
                const estaNoUltimoGrau = ultimoGrauConfig && aluno.grauAtual >= ultimoGrauConfig.numero;

                if (estaNoUltimoGrau) {
                    // Aluno está no último grau da faixa, precisa mudar de faixa
                    const faixaAtualIndex = academia.configuracoes.faixas.findIndex(f => f.nome === aluno.faixaAtual);
                    if (faixaAtualIndex >= 0 && faixaAtualIndex < academia.configuracoes.faixas.length - 1) {
                        proximaFaixa = academia.configuracoes.faixas[faixaAtualIndex + 1];
                        // Converter tempo mínimo da faixa para dias
                        const mesesNecessarios = (proximaFaixa.tempoMinimoAnos * 12) + proximaFaixa.tempoMinimoMeses;
                        const diasNecessarios = converterMesesParaDias(mesesNecessarios);
                        const diasFaltantes = Math.max(0, diasNecessarios - diasPresenca);
                        tempoRestanteProximaFaixa = {
                            dias: diasFaltantes,
                            diasNecessarios,
                            diasPresenca,
                            completo: diasPresenca >= diasNecessarios,
                            nomeFaixa: proximaFaixa.nome,
                            mesesNecessarios // Manter para referência
                        };
                    }
                } else {
                    // Verificar se há próximo grau na faixa atual
                    const proximoGrauNum = aluno.grauAtual + 1;
                    const grauConfig = faixaAtualConfig.graus.find(g => g.numero === proximoGrauNum);

                    if (grauConfig) {
                        // Há próximo grau na faixa atual
                        proximoGrau = `${proximoGrauNum}º Grau`;
                        // Converter meses necessários para dias
                        const diasNecessarios = converterMesesParaDias(grauConfig.tempoMinimoMeses);
                        const diasFaltantes = Math.max(0, diasNecessarios - diasPresenca);
                        tempoRestanteProximoGrau = {
                            dias: diasFaltantes,
                            diasNecessarios,
                            diasPresenca,
                            completo: diasPresenca >= diasNecessarios,
                            mesesNecessarios: grauConfig.tempoMinimoMeses // Manter para referência
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

