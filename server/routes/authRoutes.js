const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

// Register (apenas para professor e admin)
router.post('/register', async (req, res) => {
    const { name, email, password, role = 'professor' } = req.body;

    try {
        // Validate required fields
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        // Não permitir cadastro de alunos pela rota pública
        if (role === 'aluno') {
            return res.status(403).json({ 
                message: 'Alunos devem ser cadastrados por professores ou administradores' 
            });
        }

        // Validar role permitida
        if (!['professor', 'admin'].includes(role)) {
            return res.status(400).json({ 
                message: 'Tipo de conta inválido. Apenas professor ou administrador podem se cadastrar.' 
            });
        }

        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role
        });

        await user.save();

        // Create token
        const payload = {
            userId: user.id,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }

        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        res.status(500).json({ 
            message: 'Erro no servidor',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas' });
        }

        const payload = {
            userId: user.id,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Current user profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error fetching current user:', err);
        res.status(500).json({ message: 'Erro ao buscar usuário', error: err.message });
    }
});

module.exports = router;

