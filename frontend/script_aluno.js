let editingPostIt = null;
let selectedColor = 'yellow';
let currentRoom = 'Sala1';

document.addEventListener('DOMContentLoaded', async () => {
    await loadRooms();
    await loadPostIts();
});

// Função para carregar as salas com melhorias
async function loadRooms() {
    const roomSelect = document.getElementById('roomSelect');
    roomSelect.innerHTML = '';

    try {
        const response = await fetch('http://localhost:3001/api/rooms');
        
        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            console.error('Erro ao carregar salas:', response.statusText);
            return;
        }

        const data = await response.json();
        const rooms = data.rooms;

        if (!Array.isArray(rooms)) {
            console.error('Formato inesperado da resposta para salas:', rooms);
            return;
        }

        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = room;
            roomSelect.appendChild(option);
        });

        currentRoom = localStorage.getItem('currentRoom') || rooms[0] || 'Sala1';
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
        postItContainer.innerHTML = '';

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

// Função para salvar ou atualizar um Post-It (somente edição)
async function savePostIt() {
    const name = document.getElementById('nameInput').value;
    const className = document.getElementById('classInput').value;
    const shift = document.getElementById('shiftInput').value;
    const content = document.getElementById('textContent').value;

    const postItData = {
        name,
        class: className,
        shift,
        content,
        color: selectedColor,
        room: currentRoom,
    };

    try {
        if (editingPostIt) {
            // Caso de edição
            const postId = editingPostIt.dataset.id;

            const response = await fetch(`http://localhost:3001/api/postIts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postItData),
            });

            if (response.ok) {
                const updatedPostIt = await response.json();

                // Atualiza apenas se os dados necessários estiverem presentes
                if (updatedPostIt.id && updatedPostIt.content && updatedPostIt.name) {
                    editingPostIt.dataset.name = name;
                    editingPostIt.dataset.class = className;
                    editingPostIt.dataset.shift = shift;
                    editingPostIt.dataset.content = content;
                    editingPostIt.style.backgroundColor = selectedColor;
                    editingPostIt.querySelector('p').textContent = content;
                } else {
                    console.error('Resposta incompleta ao editar Post-It:', updatedPostIt);
                }
            } else {
                console.error('Erro ao editar Post-It:', await response.text());
            }
        } else {
            // Caso de criação de um novo Post-It
            const response = await fetch('http://localhost:3001/api/postIts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postItData),
            });

            if (response.ok) {
                const newPostIt = await response.json();

                // Verifica os dados retornados antes de criar o Post-It
                if (newPostIt.id && newPostIt.content && newPostIt.name) {
                    const postItContainer = document.getElementById('postItContainer');
                    const newPostItElement = createPostItElement(newPostIt.id, newPostIt);
                    postItContainer.appendChild(newPostItElement);
                } else {
                    console.error('Resposta incompleta ao criar Post-It:', newPostIt);
                }
            } else {
                console.error('Erro ao criar Post-It:', await response.text());
            }
        }
    } catch (error) {
        console.error('Erro no savePostIt:', error);
    }

    closeEditModal();
}




// Função para criar o elemento Post-It
function createPostItElement(id, data) {
    const postIt = document.createElement('div');
    postIt.className = 'post-it';
    postIt.dataset.id = id;
    postIt.dataset.name = data.name;
    postIt.dataset.class = data.class;
    postIt.dataset.shift = data.shift;
    postIt.dataset.content = data.content;
    postIt.style.backgroundColor = data.color;

    postIt.innerHTML = `
        <p>${data.content}</p>
        <div class="student-name">${data.name}</div>
    `;
    postIt.onclick = () => openEditModal(postIt);
    return postIt;
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

// Função para trocar a sala atual
function changeRoom() {
    currentRoom = document.getElementById('roomSelect').value;
    localStorage.setItem('currentRoom', currentRoom);
    loadPostIts();
}
