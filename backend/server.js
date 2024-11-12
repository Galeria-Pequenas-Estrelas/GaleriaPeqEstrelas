const express = require('express');
const Database = require('better-sqlite3');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new Database('./database/database.db'); // Conexão com better-sqlite3
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Inicializa a tabela de Post-Its (criação única)
db.prepare(`
    CREATE TABLE IF NOT EXISTS postIts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        class TEXT,
        shift TEXT,
        content TEXT,
        color TEXT,
        room TEXT
    )
`).run();

// Endpoint para obter post-its de uma sala
app.get('/api/postIts', (req, res) => {
    const room = req.query.room || 'Sala1';
    try {
        const postIts = db.prepare(`SELECT * FROM postIts WHERE room = ?`).all(room);
        res.json(postIts);
    } catch (err) {
        console.error('Erro ao obter post-its:', err.message);
        res.status(500).json({ error: 'Erro ao obter post-its' });
    }
});

// Endpoint para adicionar um novo post-it
app.post('/api/postIts', (req, res) => {
    const { name, class: className, shift, content, color, room } = req.body;
    try {
        const info = db.prepare(`
            INSERT INTO postIts (name, class, shift, content, color, room) 
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, className, shift, content, color, room);
        
        res.status(201).json({ id: info.lastInsertRowid, name, class: className, shift, content, color, room });
    } catch (err) {
        console.error('Erro ao adicionar post-it:', err.message);
        res.status(500).json({ error: 'Erro ao adicionar post-it' });
    }
});

// Novo endpoint para editar um post-it existente
app.put('/api/postIts/:id', (req, res) => {
    const { id } = req.params;
    const { name, class: className, shift, content, color } = req.body;

    try {
        const result = db.prepare(`
            UPDATE postIts 
            SET name = ?, class = ?, shift = ?, content = ?, color = ? 
            WHERE id = ?
        `).run(name, className, shift, content, color, id);

        if (result.changes > 0) {
            res.status(200).json({ message: 'Post-It atualizado com sucesso!' });
        } else {
            res.status(404).json({ error: 'Post-It não encontrado' });
        }
    } catch (err) {
        console.error('Erro ao editar post-it:', err.message);
        res.status(500).json({ error: 'Erro ao editar post-it' });
    }
});

// Endpoint para deletar um post-it
app.delete('/api/postIts/:id', (req, res) => {
    const { id } = req.params;
    try {
        db.prepare(`DELETE FROM postIts WHERE id = ?`).run(id);
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar post-it:', err.message);
        res.status(500).json({ error: 'Erro ao deletar post-it' });
    }
});

// Endpoint para obter todas as salas
app.get('/api/rooms', (req, res) => {
    try {
        const rooms = db.prepare(`SELECT DISTINCT room FROM postIts`).all();
        res.json(rooms.map(row => row.room));
    } catch (err) {
        console.error('Erro ao obter salas:', err.message);
        res.status(500).send({ error: 'Erro ao obter salas' });
    }
});

// Endpoint para adicionar uma nova sala
app.post('/api/rooms', (req, res) => {
    const { room } = req.body;
    if (!room) {
        return res.status(400).json({ error: "O nome da sala não pode ser vazio." });
    }
    try {
        db.prepare(`INSERT INTO postIts (room) VALUES (?)`).run(room);
        res.status(201).json({ room });
    } catch (err) {
        console.error('Erro ao adicionar sala:', err.message);
        res.status(500).json({ error: 'Erro ao adicionar sala' });
    }
});

// Endpoint para deletar uma sala e todos os seus post-its
app.delete('/api/rooms/:room', (req, res) => {
    const { room } = req.params;
    try {
        db.prepare(`DELETE FROM postIts WHERE room = ?`).run(room);
        res.status(204).send();
    } catch (err) {
        console.error('Erro ao deletar sala:', err.message);
        res.status(500).json({ error: 'Erro ao deletar sala' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
