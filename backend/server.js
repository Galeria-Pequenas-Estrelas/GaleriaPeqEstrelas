require('dotenv').config();  // Carrega as variáveis de ambiente do .env

const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const postItsRoutes = require('./routes/postits');
const roomsRoutes = require('./routes/rooms');

// Inicializando o servidor Express
const app = express();
const PORT = process.env.PORT || 3001;  // Usar a porta do ambiente ou 3001 como padrão

// Configuração do banco de dados
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Middleware
app.use(cors());
app.use(bodyParser.json());  // Permite o envio de dados no formato JSON

// Teste de Conexão com o MySQL
async function testConnection() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Conexão com o MySQL bem-sucedida!');
        await connection.end();
    } catch (err) {
        console.error('Erro ao conectar ao MySQL:', err.message);
    }
}

// Inicializa a tabela de Post-Its no banco de dados, caso não existam
async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS postIts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                class VARCHAR(255),
                shift VARCHAR(50),
                content TEXT,
                color VARCHAR(20),
                room VARCHAR(255)
            );
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                name VARCHAR(255) PRIMARY KEY
            );
        `);
        console.log('Tabelas criadas ou já existentes no banco de dados.');
        await connection.end();
    } catch (err) {
        console.error('Erro ao inicializar o banco de dados:', err.message);
    }
}

// Rota para Post-Its e Salas
app.use('/api/postits', postItsRoutes);
app.use('/api/rooms', roomsRoutes);

// Conectar ao banco de dados e iniciar o servidor
async function startServer() {
    await testConnection();  // Testa a conexão com o banco de dados
    await initializeDatabase();  // Inicializa o banco de dados

    // Inicia o servidor
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

startServer();  // Chama a função que inicia tudo
