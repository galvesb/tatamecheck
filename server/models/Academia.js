const mongoose = require('mongoose');

const AcademiaSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    endereco: { type: String },
    localizacao: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        raioMetros: { type: Number, default: 100 } // Raio padrão de 100 metros
    },
    configuracoes: {
        diasMinimosParaGraduacao: { 
            type: Number, 
            default: 50 
        },
        diasMinimosPorGrau: {
            type: Map,
            of: Number,
            default: new Map([
                ['Branca', 50],
                ['Azul', 60],
                ['Roxa', 70],
                ['Marrom', 80],
                ['Preta', 90]
            ])
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

