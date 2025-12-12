const mongoose = require('mongoose');

const AlunoSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        unique: true 
    },
    faixaAtual: { 
        type: String, 
        required: true
        // Removido enum para permitir faixas configuradas dinamicamente pelo administrador
    },
    grauAtual: { 
        type: Number, 
        min: 0, 
        max: 4, 
        default: 0 
    },
    diasPresencaDesdeUltimaGraduacao: { 
        type: Number, 
        default: 0 
    },
    diasPresencaDesdeUltimaTrocaFaixa: {
        type: Number,
        default: 0
    },
    diasNecessariosParaProximoGrau: { 
        type: Number, 
        default: 50 
    },
    // Campos para sistema baseado em meses
    mesesDesdeUltimaGraduacao: {
        type: Number,
        default: 0
    },
    mesesNecessariosParaProximoGrau: {
        type: Number,
        default: 0
    },
    dataUltimaGraduacao: {
        type: Date
    },
    ultimaGraduacao: {
        data: { type: Date },
        faixa: { type: String },
        grau: { type: Number }
    },
    academiaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Academia',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Aluno', AlunoSchema);

