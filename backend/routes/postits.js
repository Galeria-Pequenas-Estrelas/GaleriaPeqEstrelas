const express = require('express');
const postitsController = require('../controllers/postitController');
const router = express.Router();

// Rota para obter post-its de uma sala específica
router.get('/', postitsController.getPostIts);

// Rota para criar um novo post-it
router.post('/', postitsController.createPostIt);

// Rota para deletar um post-it
router.delete('/:id', postitsController.deletePostIt);

// Rota para editar um post-it
router.put('/:id', postitsController.updatePostIt);

module.exports = router;
