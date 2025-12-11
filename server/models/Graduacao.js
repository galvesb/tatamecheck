const mongoose = require('mongoose');

const GraduacaoSchema = new mongoose.Schema({
    alunoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Aluno', 
        required: true 
    },
    faixa: { 
        type: String, 
        enum: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
        required: true
    },
    grau: { 
        type: Number, 
        min: 0, 
        max: 4, 
        required: true 
    },
    data: { 
        type: Date, 
        required: true,
        default: Date.now
    },
    diasPresencaAteGraduacao: { 
        type: Number, 
        required: true 
    },
    avaliadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    observacoes: { type: String }
}, {
    timestamps: true
});

// Índice para buscar graduações por aluno
GraduacaoSchema.index({ alunoId: 1, data: -1 });

module.exports = mongoose.model('Graduacao', GraduacaoSchema);

