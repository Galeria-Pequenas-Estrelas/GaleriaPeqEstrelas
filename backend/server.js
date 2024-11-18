require('dotenv').config(); // Carregar variáveis do .env
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do pool de conexão com PostgreSQL
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

app.use(cors());
app.use(bodyParser.json());

// Serve arquivos estáticos da pasta raiz, onde o index.html está
app.use(express.static(path.join(__dirname, '../')));

// Função auxiliar para consulta ao banco de dados
const queryDB = async (query, params = []) => {
    try {
        const result = await pool.query(query, params);
        console.log('Consulta executada com sucesso:', query); // Log da consulta
        console.log('Resultado da consulta:', result.rows);  // Log do resultado da consulta
        return result.rows;
    } catch (err) {
        console.error('Erro ao executar a consulta:', err.message);  // Log do erro
        throw err;
    }
};

// Inicializa a tabela de Post-Its (executar apenas uma vez)
(async () => {
    try {
        await queryDB(`
            CREATE TABLE IF NOT EXISTS postIts (
                id SERIAL PRIMARY KEY,
                name TEXT,
                class TEXT,
                shift TEXT,
                content TEXT,
                color TEXT,
                room TEXT
            );
        `);
        console.log('Tabela "postIts" criada ou já existente.');
    } catch (err) {
        console.error('Erro ao inicializar a tabela:', err.message);
    }
})();

// Rota para servir o arquivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html')); // Caminho do index.html na raiz do projeto
});

// Endpoint para obter post-its de uma sala
app.get('/api/postIts', async (req, res) => {
    const room = req.query.room || 'Sala1';
    console.log('Consultando post-its para a sala:', room);  // Log do valor de 'room'
    try {
        const postIts = await queryDB('SELECT * FROM postIts WHERE room = $1', [room]);
        console.log('Post-Its retornados:', postIts);  // Log dos post-its retornados
        res.json(postIts);
    } catch (err) {
        console.error('Erro ao obter post-its:', err.message);  // Log do erro
        res.status(500).json({ error: 'Erro ao obter post-its' });
    }
});

// Endpoint para adicionar um novo post-it
app.post('/api/postIts', async (req, res) => {
    const { name, class: className, shift, content, color, room } = req.body;
    console.log('Dados recebidos para novo post-it:', req.body); // Log dos dados recebidos
    try {
        const result = await queryDB(
            `INSERT INTO postIts (name, class, shift, content, color, room) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, className, shift, content, color, room]
        );
        console.log('Post-It inserido:', result[0]); // Log do post-it inserido
        res.status(201).json(result[0]);
    } catch (err) {
        console.error('Erro ao adicionar post-it:', err.message);  // Log do erro
        res.status(500).json({ error: 'Erro ao adicionar post-it' });
    }
});

// Endpoint para editar um post-it
app.put('/api/postIts/:id', async (req, res) => {
    const { id } = req.params;
    const { name, class: className, shift, content, color } = req.body;
    console.log(`Atualizando post-it com ID ${id}:`, req.body);  // Log dos dados recebidos
    try {
        const result = await queryDB(
            `UPDATE postIts SET name = $1, class = $2, shift = $3, content = $4, color = $5 WHERE id = $6`,
            [name, className, shift, content, color, id]
        );
        console.log('Post-It atualizado:', result);  // Log da resposta da atualização
        res.json({ message: 'Post-It atualizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao editar post-it:', err.message);  // Log do erro
        res.status(500).json({ error: 'Erro ao editar post-it' });
    }
});

// Endpoint para deletar um post-it
app.delete('/api/postIts/:id', async (req, res) => {
    const { id } = req.params;
    console.log('Deletando post-it com ID:', id);  // Log do ID do post-it a ser deletado
    try {
        await queryDB('DELETE FROM postIts WHERE id = $1', [id]);
        console.log('Post-It deletado com sucesso');  // Log após a exclusão
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar post-it:', err.message);  // Log do erro
        res.status(500).json({ error: 'Erro ao deletar post-it' });
    }
});

// Endpoint para obter todas as salas
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await queryDB('SELECT DISTINCT room FROM postIts');
        console.log('Salas disponíveis:', rooms);  // Log das salas retornadas
        res.json(rooms.map(row => row.room));
    } catch (err) {
        console.error('Erro ao obter salas:', err.message);  // Log do erro
        res.status(500).send({ error: 'Erro ao obter salas' });
    }
});

// Endpoint para adicionar uma nova sala
app.post('/api/rooms', async (req, res) => {
    const { room } = req.body;
    console.log('Recebendo dados para adicionar sala:', room);  // Log do nome da sala recebida
    if (!room) return res.status(400).json({ error: 'O nome da sala não pode ser vazio.' });
    try {
        await queryDB('INSERT INTO postIts (room) VALUES ($1)', [room]);
        console.log('Sala adicionada:', room);  // Log da sala adicionada
        res.status(201).json({ room });
    } catch (err) {
        console.error('Erro ao adicionar sala:', err.message);  // Log do erro
        res.status(500).json({ error: 'Erro ao adicionar sala' });
    }
});

// Endpoint para deletar uma sala e todos os seus post-its
app.delete('/api/rooms/:room', async (req, res) => {
    const { room } = req.params;
    console.log('Deletando sala:', room);  // Log do nome da sala a ser deletada
    try {
        await queryDB('DELETE FROM postIts WHERE room = $1', [room]);
        console.log('Sala deletada com sucesso');  // Log após a exclusão
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar sala:', err.message);  // Log do erro
        res.status(500).json({ error: 'Erro ao deletar sala' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
