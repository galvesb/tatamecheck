# TatameCheck - Backend Server

Backend Node.js com Express e MongoDB para o sistema TatameCheck.

## 🚀 Instalação

```bash
cd server
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto (mesmo nível do `server/`) com:

```env
MONGO_URI=mongodb://localhost:27017/tatamecheck
JWT_SECRET=your_secret_key_here_change_in_production
PORT=5000
```

## 🏃 Executar

```bash
npm start
# ou
npm run dev
```

O servidor estará disponível em `http://localhost:5000`

## 📋 Rotas da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/me` - Obter perfil do usuário atual (requer auth)

### Aluno
- `POST /api/aluno/checkin` - Fazer check-in por geolocalização (requer auth)
- `GET /api/aluno/presenca` - Obter histórico de presenças (requer auth)
- `GET /api/aluno/progresso` - Obter progresso atual (requer auth)
- `GET /api/aluno/graduacoes` - Obter histórico de graduações (requer auth)

## 📦 Modelos

### User
- `name`: String
- `email`: String (único)
- `password`: String (hash)
- `role`: Enum ['aluno', 'professor', 'admin']

### Aluno
- `userId`: ObjectId (ref: User)
- `faixaAtual`: Enum ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta']
- `grauAtual`: Number (0-4)
- `diasPresencaDesdeUltimaGraduacao`: Number
- `diasNecessariosParaProximoGrau`: Number
- `academiaId`: ObjectId (ref: Academia)

### Presenca
- `alunoId`: ObjectId (ref: Aluno)
- `data`: Date
- `localizacao`: { latitude, longitude, raioAcademia, dentroDoRaio }
- `validada`: Boolean

### Graduacao
- `alunoId`: ObjectId (ref: Aluno)
- `faixa`: String
- `grau`: Number
- `data`: Date
- `diasPresencaAteGraduacao`: Number
- `avaliadoPor`: ObjectId (ref: User)

### Academia
- `nome`: String
- `localizacao`: { latitude, longitude, raioMetros }
- `configuracoes`: { diasMinimosParaGraduacao, diasMinimosPorGrau }
- `administradorId`: ObjectId (ref: User)

