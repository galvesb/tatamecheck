const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env')
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const alunoRoutes = require('./routes/alunoRoutes');
const professorRoutes = require('./routes/professorRoutes');
const financeiroRoutes = require('./routes/financeiroRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tatamecheck';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('⚠️  Warning: Server will start but database operations may fail.');
        console.error('⚠️  Make sure MongoDB is running on localhost:27017');
    });

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/aluno', alunoRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/financeiro', financeiroRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'TatameCheck Server is running', 
        routes: [
            '/api/auth/register',
            '/api/auth/login',
            '/api/auth/me',
            '/api/aluno/checkin',
            '/api/aluno/presenca',
            '/api/aluno/progresso',
            '/api/aluno/graduacoes',
            '/api/aluno/academia'
        ] 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('📋 Available routes:');
    console.log('  - POST /api/auth/register (professor/admin only)');
    console.log('  - POST /api/auth/login');
    console.log('  - GET  /api/auth/me (requires auth)');
    console.log('  - POST /api/aluno/checkin (requires auth - aluno)');
    console.log('  - GET  /api/aluno/presenca (requires auth - aluno)');
    console.log('  - GET  /api/aluno/progresso (requires auth - aluno)');
    console.log('  - GET  /api/aluno/graduacoes (requires auth - aluno)');
    console.log('  - GET  /api/aluno/academia (requires auth - aluno)');
    console.log('  - POST /api/professor/alunos (requires auth - professor/admin)');
    console.log('  - GET  /api/professor/alunos (requires auth - professor/admin)');
    console.log('  - GET  /api/professor/alunos/:id (requires auth - professor/admin)');
    console.log('  - POST /api/professor/alunos/:id/graduacao (requires auth - professor/admin)');
    console.log('  - GET  /api/professor/academia (requires auth - professor/admin)');
    console.log('  - PUT  /api/professor/academia (requires auth - professor/admin)');
});

