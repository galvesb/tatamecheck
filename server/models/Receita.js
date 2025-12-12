const mongoose = require('mongoose');

const ReceitaSchema = new mongoose.Schema({
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
        enum: ['mensalidade', 'matricula', 'evento', 'produto', 'outros'],
        default: 'outros'
    },
    data: {
        type: Date,
        required: true,
        default: Date.now
    },
    dataRecebimento: {
        type: Date
    },
    recebido: {
        type: Boolean,
        default: false
    },
    alunoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno'
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
ReceitaSchema.index({ academiaId: 1, data: -1 });
ReceitaSchema.index({ academiaId: 1, categoria: 1 });
ReceitaSchema.index({ academiaId: 1, recebido: 1 });
ReceitaSchema.index({ alunoId: 1 });

module.exports = mongoose.model('Receita', ReceitaSchema);

