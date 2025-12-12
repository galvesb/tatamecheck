const mongoose = require('mongoose');

const PagamentoReceberSchema = new mongoose.Schema({
    academiaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Academia',
        required: true
    },
    alunoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aluno',
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
    dataVencimento: {
        type: Date,
        required: true
    },
    dataRecebimento: {
        type: Date
    },
    recebido: {
        type: Boolean,
        default: false
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
    lembretesEnviados: [{
        data: Date,
        tipo: String
    }],
    criadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Índices para melhor performance nas consultas
PagamentoReceberSchema.index({ academiaId: 1, dataVencimento: 1 });
PagamentoReceberSchema.index({ academiaId: 1, recebido: 1 });
PagamentoReceberSchema.index({ alunoId: 1 });
PagamentoReceberSchema.index({ dataVencimento: 1, recebido: 1 });

module.exports = mongoose.model('PagamentoReceber', PagamentoReceberSchema);

