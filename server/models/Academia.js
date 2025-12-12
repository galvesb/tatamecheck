const mongoose = require('mongoose');

// Schema para configuração de grau
const GrauSchema = new mongoose.Schema({
    numero: { 
        type: Number, 
        required: true,
        min: 1,
        max: 10
    },
    tempoMinimoMeses: { 
        type: Number, 
        required: true,
        min: 1
    }
}, { _id: false });

// Schema para configuração de faixa
const FaixaSchema = new mongoose.Schema({
    nome: { 
        type: String, 
        required: true,
        trim: true
    },
    ordem: {
        type: Number,
        required: true
    },
    tempoMinimoMeses: { 
        type: Number, 
        required: true,
        min: 0  // Permite 0 se tiver anos
    },
    tempoMinimoAnos: {
        type: Number,
        default: 0,
        min: 0
    },
    graus: [GrauSchema],
    numeroMaximoGraus: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    }
}, { _id: false });

const AcademiaSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    endereco: { type: String },
    localizacao: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        raioMetros: { type: Number, default: 100 }
    },
    configuracoes: {
        faixas: [FaixaSchema],
        // Mantém compatibilidade com sistema antigo
        diasMinimosParaGraduacao: { 
            type: Number, 
            default: 50 
        },
        diasMinimosPorGrau: {
            type: Map,
            of: Number,
            default: new Map()
        }
    },
    administradorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Academia', AcademiaSchema);

