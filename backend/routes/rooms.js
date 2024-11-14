const express = require('express');
const router = express.Router();
const roomsController = require('../controllers/roomsController');

// Obtém todas as salas
router.get('/', (req, res) => {
    res.json({
        rooms: ['Sala1', 'Sala2', 'Sala3']
    });
});

// Rota para excluir uma sala
router.delete('/:roomName', roomsController.deleteRoom);

module.exports = router;
