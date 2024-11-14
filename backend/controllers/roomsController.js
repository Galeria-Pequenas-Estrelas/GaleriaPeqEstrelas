const db = require('../models/db');

// Função para excluir uma sala
exports.deleteRoom = (req, res) => {
    const roomName = req.params.roomName; // Recebe o nome da sala a ser excluída

    // Primeiro, verificamos se a sala existe
    db.query('SELECT * FROM rooms WHERE name = ?', [roomName], (err, results) => {
        if (err) {
            console.error('Erro ao buscar sala:', err.message);
            return res.status(500).json({ error: 'Erro ao buscar sala' });
        }

        // Se não houver resultado, a sala não existe
        if (results.length === 0) {
            return res.status(404).json({ error: 'Sala não encontrada' });
        }

        // Se a sala existir, tentamos excluí-la
        const query = 'DELETE FROM rooms WHERE name = ?';

        db.query(query, [roomName], (err, result) => {
            if (err) {
                console.error('Erro ao excluir sala:', err.message);
                return res.status(500).json({ error: 'Erro ao excluir sala' });
            }

            // Se a sala foi excluída com sucesso, retornamos uma mensagem
            res.status(200).json({ message: 'Sala excluída com sucesso' });
        });
    });
};

// Função para obter todas as salas
exports.getRooms = (req, res) => {
    // Consultando todas as salas no banco de dados
    db.query('SELECT * FROM rooms', (err, results) => {
        if (err) {
            console.error('Erro ao obter salas:', err.message);
            return res.status(500).json({ error: 'Erro ao obter salas' });
        }

        // Retorna todas as salas encontradas
        res.status(200).json({ rooms: results });
    });
};

// Função para criar uma nova sala
exports.createRoom = (req, res) => {
    const { roomName } = req.body;

    // Validações de dados
    if (!roomName) {
        return res.status(400).json({ error: 'O nome da sala é obrigatório' });
    }

    // Inserindo a sala no banco de dados
    db.query('INSERT INTO rooms (name) VALUES (?)', [roomName], (err, result) => {
        if (err) {
            console.error('Erro ao criar sala:', err.message);
            return res.status(500).json({ error: 'Erro ao criar sala' });
        }

        // Retorna o id da sala criada
        res.status(201).json({ id: result.insertId, name: roomName });
    });
};
