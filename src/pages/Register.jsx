import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('aluno');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await register(name, email, password, role);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <p className="auth-badge">TatameCheck</p>
                    <h1>Criar Conta</h1>
                    <p>Cadastre-se para começar a usar</p>
                </div>

                {error && <p className="auth-error">{error}</p>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <label>
                        <span>Nome Completo</span>
                        <input
                            type="text"
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        <span>E-mail</span>
                        <input
                            type="email"
                            placeholder="voce@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>
                    <label>
                        <span>Senha</span>
                        <input
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </label>
                    <label>
                        <span>Tipo de Conta</span>
                        <select
                            className="form-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="professor">Professor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </label>
                    <p style={{ 
                        fontSize: '0.85rem', 
                        color: 'rgba(226, 232, 240, 0.6)', 
                        marginTop: '-0.5rem',
                        marginBottom: '0.5rem'
                    }}>
                        Alunos devem ser cadastrados por professores ou administradores.
                    </p>
                    <button type="submit" className="btn primary auth-submit">
                        Criar Conta
                    </button>
                </form>

                <p className="auth-footer">
                    Já tem conta? <Link to="/login">Fazer login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

