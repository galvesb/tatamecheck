/**
 * Script para configurar a localização da academia
 * Execute com: node server/scripts/setupAcademia.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../..', '.env') });
const mongoose = require('mongoose');
const Academia = require('../models/Academia');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tatamecheck';

async function setupAcademia() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado ao MongoDB');

        // Buscar um usuário admin ou professor para ser o administrador
        const admin = await User.findOne({ role: { $in: ['admin', 'professor'] } });
        
        if (!admin) {
            console.error('❌ Erro: Nenhum usuário admin ou professor encontrado.');
            console.log('💡 Crie primeiro um usuário admin ou professor antes de executar este script.');
            process.exit(1);
        }

        // Localização da academia
        const academiaData = {
            nome: 'TatameCheck Academia',
            endereco: 'R. Victor Augusto Mesquita - Massaguaçu, Caraguatatuba - SP, 11677-390',
            localizacao: {
                latitude: -23.6183,  // Aproximado - ajuste se necessário
                longitude: -45.4211, // Aproximado - ajuste se necessário
                raioMetros: 100      // Raio de 100 metros para check-in
            },
            administradorId: admin._id
        };

        // Verificar se já existe uma academia
        let academia = await Academia.findOne();
        
        if (academia) {
            // Atualizar academia existente
            academia.nome = academiaData.nome;
            academia.endereco = academiaData.endereco;
            academia.localizacao = academiaData.localizacao;
            academia.administradorId = academiaData.administradorId;
            await academia.save();
            console.log('✅ Academia atualizada com sucesso!');
        } else {
            // Criar nova academia
            academia = new Academia(academiaData);
            await academia.save();
            console.log('✅ Academia criada com sucesso!');
        }

        console.log('\n📍 Informações da Academia:');
        console.log(`   Nome: ${academia.nome}`);
        console.log(`   Endereço: ${academia.endereco}`);
        console.log(`   Latitude: ${academia.localizacao.latitude}`);
        console.log(`   Longitude: ${academia.localizacao.longitude}`);
        console.log(`   Raio de check-in: ${academia.localizacao.raioMetros} metros`);
        console.log(`   Administrador: ${admin.name} (${admin.email})`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao configurar academia:', error);
        process.exit(1);
    }
}

setupAcademia();

