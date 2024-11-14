let editingPostIt = null;
let selectedColor = 'yellow';
let currentRoom = 'Sala1';
const postIts = {};

// Função para verificar a autenticação do usuário
function checkUserAuthentication() {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = '../index.html';
    }
}

// Função para realizar o logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = '../index.html';
}

// Carrega a página ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
    checkUserAuthentication();  // Verifica se o usuário está autenticado

    // Adiciona o evento de logout ao botão
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    // Carrega as salas e os post-its
    await loadRooms();
    await loadPostIts();
});

// Função para carregar as salas
async function loadRooms() {
    const roomSelect = document.getElementById('roomSelect');
    roomSelect.innerHTML = '';  // Limpa as opções atuais

    try {
        const response = await fetch('http://localhost:3001/api/rooms');
        
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            console.error('Erro ao carregar salas:', response.statusText);
            return;
        }

        // Obtém o JSON da resposta e acessa o array dentro da propriedade 'rooms'
        const data = await response.json();
        const rooms = data.rooms;

        // Verifica se 'rooms' é um array
        if (!Array.isArray(rooms)) {
            console.error('Formato inesperado da resposta para salas:', rooms);
            return;
        }

        // Verifica se há salas disponíveis
        if (rooms.length === 0) {
            console.warn('Nenhuma sala disponível.');
            return;
        }

        // Adiciona as opções de sala ao select
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = room;
            roomSelect.appendChild(option);
        });

        // Define a sala atual e salva no localStorage
        currentRoom = localStorage.getItem('currentRoom') || rooms[0];
        roomSelect.value = currentRoom;
        localStorage.setItem('currentRoom', currentRoom);
    } catch (error) {
        console.error('Erro ao carregar salas:', error);
    }
}


// Função para carregar os Post-Its da sala atual
async function loadPostIts() {
    try {
        const response = await fetch(`http://localhost:3001/api/postIts?room=${currentRoom}`);
        const postItsData = await response.json();

        const postItContainer = document.getElementById('postItContainer');
        postItContainer.innerHTML = '';  // Limpa o contêiner de Post-Its

        postItsData.forEach(data => {
            const postItElement = createPostItElement(data.id, data);
            postItContainer.appendChild(postItElement);
        });
    } catch (error) {
        console.error('Erro ao carregar Post-Its:', error);
    }
}

// Função para abrir o modal de edição
function openEditModal(postIt = null) {
    editingPostIt = postIt;

    if (postIt) {
        document.getElementById('nameInput').value = postIt.dataset.name;
        document.getElementById('classInput').value = postIt.dataset.class;
        document.getElementById('shiftInput').value = postIt.dataset.shift;
        document.getElementById('textContent').value = postIt.dataset.content;
        selectedColor = postIt.style.backgroundColor;
    } else {
        document.getElementById('nameInput').value = '';
        document.getElementById('classInput').value = '';
        document.getElementById('shiftInput').value = '';
        document.getElementById('textContent').value = '';
        selectedColor = 'yellow';
    }

    document.getElementById('editModal').style.display = 'block';
    updateColorSelection();
}

// Função para fechar o modal de edição
function closeEditModal() {
    editingPostIt = null;
    document.getElementById('editModal').style.display = 'none';
}

// Função para salvar ou atualizar um Post-It
async function savePostIt() {
    const name = document.getElementById('nameInput').value;
    const className = document.getElementById('classInput').value;
    const shift = document.getElementById('shiftInput').value;
    const content = document.getElementById('textContent').value;

    const postItData = {
        name, class: className, shift, content, color: selectedColor, room: currentRoom
    };

    try {
        if (editingPostIt) {
            editingPostIt.dataset.name = name;
            editingPostIt.dataset.class = className;
            editingPostIt.dataset.shift = shift;
            editingPostIt.dataset.content = content;
            editingPostIt.style.backgroundColor = selectedColor;
            editingPostIt.querySelector('p').textContent = content;
        } else {
            const response = await fetch('http://localhost:3001/api/postIts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postItData),
            });

            if (response.ok) {
                const newPostIt = await response.json();
                const postItElement = createPostItElement(newPostIt.id, postItData);
                document.getElementById('postItContainer').appendChild(postItElement);
            } else {
                console.error('Erro ao salvar Post-It:', response.statusText);
            }
        }
    } catch (error) {
        console.error('Erro:', error);
    }

    closeEditModal();
}

// Função para criar o elemento Post-It
function createPostItElement(id, data) {
    const postItElement = document.createElement('div');
    postItElement.className = 'post-it';
    postItElement.dataset.id = id;
    postItElement.dataset.name = data.name;
    postItElement.dataset.content = data.content;
    postItElement.style.backgroundColor = data.color;

    const contentElement = document.createElement('p');
    contentElement.textContent = data.content;

    const nameElement = document.createElement('span');
    nameElement.className = 'post-it-name';
    nameElement.textContent = data.name;

    postItElement.appendChild(contentElement);
    postItElement.appendChild(nameElement);

    postItElement.addEventListener('click', function () {
        openEditModal(postItElement);
    });

    return postItElement;
}

// Funções para selecionar e atualizar a cor
function selectColor(color) {
    selectedColor = color;
    updateColorSelection();
}

function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.style.backgroundColor === selectedColor);
    });
}

// Função para deletar um Post-It
async function deletePostIt() {
    if (!editingPostIt) return;

    const postId = editingPostIt.dataset.id;
    try {
        const response = await fetch(`http://localhost:3001/api/postIts/${postId}`, { method: 'DELETE' });
        if (response.ok) {
            editingPostIt.remove();
        } else {
            console.error('Erro ao deletar o Post-It:', response.statusText);
        }
    } catch (error) {
        console.error('Erro ao deletar o Post-It:', error);
    }

    closeEditModal();
}

// Função para adicionar uma nova sala
async function addRoom(room = null) {
    const newRoom = room || prompt('Digite o nome da nova sala:');
    if (!newRoom) return;

    try {
        await fetch('http://localhost:3001/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: newRoom }),
        });
        await loadRooms();
        changeRoom(newRoom);
    } catch (error) {
        console.error('Erro ao adicionar sala:', error);
    }
}

// Função para trocar a sala atual
function changeRoom(roomName) {
    currentRoom = roomName || document.getElementById('roomSelect').value;
    localStorage.setItem('currentRoom', currentRoom);
    loadPostIts();
}

// Função para excluir uma sala
async function deleteRoom() {
    if (confirm(`Deseja realmente excluir a sala ${currentRoom}?`)) {
        try {
            const response = await fetch(`http://localhost:3001/api/rooms/${currentRoom}`, {
                method: 'DELETE',
            });

            // Log da resposta para ver o que está sendo retornado
            const text = await response.text(); // Obter como texto para ver o HTML retornado
            console.log('Resposta do servidor:', text);

            if (!response.ok) {
                console.error(`Erro ao excluir sala: ${text}`);
                alert(`Não foi possível excluir a sala: ${currentRoom}. Verifique se ela existe.`);
                return;
            }

            // Recarrega as salas e atualiza a sala atual
            await loadRooms();
            const roomSelect = document.getElementById('roomSelect');
            currentRoom = roomSelect.options[0] ? roomSelect.options[0].value : 'Sala1';
            roomSelect.value = currentRoom;
            localStorage.setItem('currentRoom', currentRoom);
            loadPostIts(); // Recarrega os Post-Its para a sala atual
        } catch (error) {
            console.error('Erro ao excluir sala:', error);
            alert('Ocorreu um erro ao tentar excluir a sala.');
        }
    }
}


function confirmCloseModal() {
    if (confirm("Deseja salvar as alterações antes de sair?")) {
        savePostIt();
    } else {
        closeEditModal();
    }
}
