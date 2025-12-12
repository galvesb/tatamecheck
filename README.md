# TatameCheck

Plataforma de Gestão focada na automatização da administração de Academias de Jiu-Jitsu.

## 🎯 Objetivo

O TatameCheck otimiza as três áreas mais críticas da operação diária:
- **Controle de frequência e graduação** via geolocalização
- **Gestão financeira** completa
- **Comunicação interna** da comunidade

## 🛠️ Tecnologias

### Frontend
- React 19.2.0
- React Router DOM 7.9.6
- Vite 7.2.4
- Axios 1.13.2

### Backend
- Node.js
- Express 5.1.0
- MongoDB (Mongoose 9.0.0)
- JWT para autenticação
- bcryptjs para hash de senhas

## 📦 Instalação

### Frontend
```bash
cd tatamecheck
npm install
```

**Nota:** O projeto usa **MapLibre GL JS** (gratuito e open source) para mapas interativos, que é compatível com React 19.

### Backend
```bash
cd tatamecheck/server
npm install
```

## ⚙️ Configuração

1. Crie um arquivo `.env` na raiz do projeto com:
```env
MONGO_URI=mongodb://localhost:27017/tatamecheck
JWT_SECRET=your_secret_key_here_change_in_production
PORT=5000
```

2. Certifique-se de que o MongoDB está rodando:
```bash
# Se usar MongoDB local
mongod
```

## 🚀 Executar

### Backend (Terminal 1)
```bash
cd tatamecheck/server
npm start
```
O servidor estará em `http://localhost:5000`

### Frontend (Terminal 2)
```bash
cd tatamecheck
npm run dev
```
O frontend estará em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
tatamecheck/
├── server/                    # Backend Node.js
│   ├── models/               # Modelos MongoDB
│   │   ├── User.js
│   │   ├── Aluno.js
│   │   ├── Presenca.js
│   │   ├── Graduacao.js
│   │   └── Academia.js
│   ├── routes/               # Rotas da API
│   │   ├── authRoutes.js
│   │   └── alunoRoutes.js
│   ├── middleware/           # Middlewares
│   │   └── authMiddleware.js
│   ├── index.js              # Servidor principal
│   └── package.json
├── src/                      # Frontend React
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── modules/
│   │   │   ├── PresencaPage.jsx
│   │   │   ├── FinanceiroPage.jsx
│   │   │   └── MidiaPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
└── .env                      # Variáveis de ambiente
```

## 🎨 Estilo

O projeto utiliza o mesmo estilo visual do Typing-Speed-Game-Main:
- Tema escuro (#030a12)
- Gradientes radiais
- Cards semi-transparentes
- Cores vibrantes (azul #1cb0f6, verde #58cc02)
- Design responsivo e moderno

## 🔐 Módulos

### 1. Presença e Progressão
- Check-in por geolocalização
- Cálculo automático de elegibilidade
- Painel do professor
- Histórico individual

### 2. Gestão Financeira
- Controle de receitas e despesas
- Lembretes de cobrança
- Relatórios e balanços

### 3. Mídia e Comunidade
- Feed de notícias
- Mural de avisos fixados
- Agenda de aulas e eventos
- Notificações estratégicas

## 👥 Perfis de Usuário

- **Aluno**: Check-in, histórico pessoal, visualização do feed
- **Professor**: Painel de alunos, gestão de presença, postagens
- **Admin**: Acesso completo a todos os módulos

