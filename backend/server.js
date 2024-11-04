const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./database.db');
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Criação da tabela de Post-Its
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS postIts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        class TEXT,
        shift TEXT,
        content TEXT,
        color TEXT,
        room TEXT
    )`, (err) => {
        if (err) {
            console.error('Erro ao criar tabela:', err.message);
        } else {
            console.log('Tabela de Post-Its criada ou já existe.');
        }
    });
});

// Endpoint para obter post-its de uma sala
app.get('/api/postIts', (req, res) => {
    const room = req.query.room || 'Sala1';
    db.all(`SELECT * FROM postIts WHERE room = ?`, [room], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Endpoint para adicionar um novo post-it
app.post('/api/postIts', (req, res) => {
    const { name, class: className, shift, content, color, room } = req.body;
    db.run(`INSERT INTO postIts (name, class, shift, content, color, room) VALUES (?, ?, ?, ?, ?, ?)`, 
        [name, className, shift, content, color, room], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            console.log('Post-It inserido:', { id: this.lastID, name, class: className, shift, content, color, room });
            res.status(201).json({ id: this.lastID, name, class: className, shift, content, color, room });
        }
    );
});

// Endpoint para deletar um post-it
app.delete('/api/postIts/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM postIts WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log(`Post-It com ID ${id} deletado.`);
        res.status(204).send();
    });
});

// Endpoint para obter todas as salas
app.get('/api/rooms', (req, res) => {
    const query = 'SELECT DISTINCT room FROM postIts';
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        res.json(rows.map(row => row.room));
    });
});

// Endpoint para adicionar uma nova sala (caso queira adicionar salas explicitamente)
app.post('/api/rooms', (req, res) => {
    const { room } = req.body;
    if (!room) {
        return res.status(400).json({ error: "O nome da sala não pode ser vazio." });
    }
    db.run(`INSERT INTO postIts (room) VALUES (?)`, [room], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ room });
    });
});

// Endpoint para deletar uma sala e todos os seus post-its
app.delete('/api/rooms/:room', (req, res) => {
    const room = req.params.room;
    db.run(`DELETE FROM postIts WHERE room = ?`, [room], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log(`Sala '${room}' e seus post-its foram deletados.`);
        res.status(204).send();
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
