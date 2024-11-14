const db = require('../models/db');

// Função para obter os post-its de uma sala específica
exports.getPostIts = (req, res) => {
    const room = req.query.room || 'Sala1'; // Recebe o nome da sala via query string
    db.query('SELECT * FROM postIts WHERE room = ?', [room], (err, results) => {
        if (err) {
            console.error('Erro ao obter post-its:', err.message);
            return res.status(500).json({ error: 'Erro ao obter post-its' });
        }
        res.json(results);
    });
};

// Função para criar um novo post-it
exports.createPostIt = (req, res) => {
    const { name, class: className, shift, content, color, room } = req.body;

    if (!name || !className || !shift || !content || !color || !room) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    const query = 'INSERT INTO postIts (name, class, shift, content, color, room) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [name, className, shift, content, color, room], (err, result) => {
        if (err) {
            console.error('Erro ao adicionar post-it:', err.message);
            return res.status(500).json({ error: 'Erro ao adicionar post-it' });
        }
        res.status(201).json({ id: result.insertId });
    });
};

// Função para deletar um post-it
exports.deletePostIt = (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM postIts WHERE id = ?', [id], (err) => {
        if (err) {
            console.error('Erro ao deletar post-it:', err.message);
            return res.status(500).json({ error: 'Erro ao deletar post-it' });
        }
        res.status(204).send();
    });
};

// Função para editar um post-it
exports.updatePostIt = (req, res) => {
    const { id } = req.params;
    const { name, class: className, shift, content, color, room } = req.body;

    if (!name || !className || !shift || !content || !color || !room) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    const query = `UPDATE postIts SET name = ?, class = ?, shift = ?, content = ?, color = ?, room = ? WHERE id = ?`;
    db.query(query, [name, className, shift, content, color, room, id], (err, result) => {
        if (err) {
            console.error('Erro ao editar post-it:', err.message);
            return res.status(500).json({ error: 'Erro ao editar post-it' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post-it não encontrado' });
        }

        res.status(200).json({ message: 'Post-it atualizado com sucesso' });
    });
};
