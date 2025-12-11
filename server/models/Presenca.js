const mongoose = require('mongoose');

const PresencaSchema = new mongoose.Schema({
    alunoId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Aluno', 
        required: true 
    },
    data: { 
        type: Date, 
        required: true,
        default: Date.now
    },
    localizacao: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        raioAcademia: { type: Number }, // Raio em metros
        dentroDoRaio: { type: Boolean, required: true }
    },
    validada: { 
        type: Boolean, 
        default: false 
    },
    validadaPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    observacoes: { type: String }
}, {
    timestamps: true
});

// Índice para buscar presenças por aluno e data
PresencaSchema.index({ alunoId: 1, data: -1 });

module.exports = mongoose.model('Presenca', PresencaSchema);

