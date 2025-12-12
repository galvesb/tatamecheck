const mongoose = require('mongoose');

const DespesaSchema = new mongoose.Schema({
    academiaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Academia',
        required: true
    },
    descricao: {
        type: String,
        required: true,
        trim: true
    },
    valor: {
        type: Number,
        required: true,
        min: 0
    },
    categoria: {
        type: String,
        required: true,
        enum: ['fixa', 'pessoal', 'material', 'manutencao', 'marketing', 'outros'],
        default: 'outros'
    },
    data: {
        type: Date,
        required: true,
        default: Date.now
    },
    dataVencimento: {
        type: Date
    },
    pago: {
        type: Boolean,
        default: false
    },
    dataPagamento: {
        type: Date
    },
    recorrente: {
        type: Boolean,
        default: false
    },
    frequenciaRecorrencia: {
        type: String,
        enum: ['mensal', 'trimestral', 'semestral', 'anual'],
        default: 'mensal'
    },
    proximaOcorrencia: {
        type: Date
    },
    observacoes: {
        type: String,
        trim: true
    },
    criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Índices para melhor performance nas consultas
DespesaSchema.index({ academiaId: 1, data: -1 });
DespesaSchema.index({ academiaId: 1, categoria: 1 });
DespesaSchema.index({ academiaId: 1, pago: 1 });

module.exports = mongoose.model('Despesa', DespesaSchema);

