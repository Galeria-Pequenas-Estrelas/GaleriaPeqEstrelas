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
        return result.rows;
    } catch (err) {
        console.error('Erro ao executar a consulta:', err.message);
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
    try {
        const postIts = await queryDB('SELECT * FROM postIts WHERE room = $1', [room]);
        res.json(postIts);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao obter post-its' });
    }
});

// Endpoint para adicionar um novo post-it
app.post('/api/postIts', async (req, res) => {
    const { name, class: className, shift, content, color, room } = req.body;
    try {
        const result = await queryDB(
            `INSERT INTO postIts (name, class, shift, content, color, room) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, className, shift, content, color, room]
        );
        res.status(201).json(result[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao adicionar post-it' });
    }
});

// Endpoint para editar um post-it
app.put('/api/postIts/:id', async (req, res) => {
    const { id } = req.params;
    const { name, class: className, shift, content, color } = req.body;
    try {
        const result = await queryDB(
            `UPDATE postIts SET name = $1, class = $2, shift = $3, content = $4, color = $5 WHERE id = $6`,
            [name, className, shift, content, color, id]
        );
        res.json({ message: 'Post-It atualizado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao editar post-it' });
    }
});

// Endpoint para deletar um post-it
app.delete('/api/postIts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await queryDB('DELETE FROM postIts WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Erro ao deletar post-it' });
    }
});

// Endpoint para obter todas as salas
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await queryDB('SELECT DISTINCT room FROM postIts');
        res.json(rooms.map(row => row.room));
    } catch (err) {
        res.status(500).send({ error: 'Erro ao obter salas' });
    }
});

// Endpoint para adicionar uma nova sala
app.post('/api/rooms', async (req, res) => {
    const { room } = req.body;
    if (!room) return res.status(400).json({ error: 'O nome da sala não pode ser vazio.' });
    try {
        await queryDB('INSERT INTO postIts (room) VALUES ($1)', [room]);
        res.status(201).json({ room });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao adicionar sala' });
    }
});

// Endpoint para deletar uma sala e todos os seus post-its
app.delete('/api/rooms/:room', async (req, res) => {
    const { room } = req.params;
    try {
        await queryDB('DELETE FROM postIts WHERE room = $1', [room]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: 'Erro ao deletar sala' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
