let selectedRoom = '';
let postIts = [];
let rooms = [];
let editingPostItId = null; // Para armazenar o ID do post-it que está sendo editado

document.addEventListener('DOMContentLoaded', () => {
    loadRooms();
});

// Carrega todas as salas do banco de dados
function loadRooms() {
    fetch('http://localhost:3001/api/rooms')
        .then(response => response.json())
        .then(data => {
            rooms = data;
            document.getElementById('totalRooms').innerText = rooms.length;
            updateRoomList();
            if (rooms.length > 0) {
                selectedRoom = rooms[0]; // Seleciona a primeira sala por padrão
                loadPostIts(selectedRoom);
            }
        })
        .catch(error => console.error('Erro ao carregar salas:', error));
}

// Atualiza a lista de salas na interface
function updateRoomList() {
    const roomList = document.getElementById('roomList');
    roomList.innerHTML = ''; // Limpa a lista existente
    rooms.forEach(room => {
        const li = document.createElement('li');
        li.textContent = room;
        li.onclick = () => {
            selectedRoom = room; // Atualiza a sala selecionada
            loadPostIts(selectedRoom);
        };
        roomList.appendChild(li);
    });
}

// Carrega os post-its da sala selecionada
function loadPostIts(room) {
    fetch(`http://localhost:3001/api/postIts?room=${room}`)
        .then(response => response.json())
        .then(data => {
            postIts = data;
            document.getElementById('totalPostIts').innerText = postIts.length;
            displayPostIts();
        })
        .catch(error => console.error('Erro ao carregar post-its:', error));
}

// Exibe os post-its filtrados pela sala selecionada
function displayPostIts() {
    const postItContainer = document.getElementById('postItContainer');
    postItContainer.innerHTML = ''; // Limpa o contêiner

    const roomPostIts = postIts.filter(postIt => postIt.room === selectedRoom);
    
    if (roomPostIts.length === 0) {
        postItContainer.innerHTML = `<p>Nenhum post-it encontrado para a sala "${selectedRoom}".</p>`;
        return;
    }

    roomPostIts.forEach(postIt => {
        const postItDiv = document.createElement('div');
        postItDiv.className = 'post-it';
        postItDiv.style.backgroundColor = postIt.color || 'yellow'; // Define uma cor padrão
        postItDiv.innerHTML = `
            <h3>${postIt.name}</h3>
            <p><strong>Turma:</strong> ${postIt.class}</p>
            <p><strong>Turno:</strong> ${postIt.shift}</p>
            <p>${postIt.content}</p>
            <button onclick="editPostIt(${postIt.id})">Editar</button>
            <button onclick="deletePostIt(${postIt.id})">Excluir</button>
        `;
        postItContainer.appendChild(postItDiv);
    });
}

// Abre o modal de edição
function openEditModal() {
    document.getElementById('editModal').style.display = 'block';
    document.getElementById('nameInput').value = '';
    document.getElementById('classInput').value = '';
    document.getElementById('shiftInput').value = '';
    document.getElementById('textContent').value = '';
    document.querySelectorAll('.color-option').forEach(option => option.classList.remove('selected'));
    editingPostItId = null; // Reseta a edição
}

// Função para salvar um novo post-it ou atualizar um existente
function savePostIt() {
    const name = document.getElementById('nameInput').value;
    const className = document.getElementById('classInput').value;
    const shift = document.getElementById('shiftInput').value;
    const content = document.getElementById('textContent').value;
    const color = document.querySelector('.color-option.selected')?.style.backgroundColor || 'yellow';

    const postItData = {
        name,
        class: className,
        shift,
        content,
        color,
        room: selectedRoom
    };

    if (editingPostItId) {
        // Atualiza post-it existente
        fetch(`http://localhost:3001/api/postIts/${editingPostItId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postItData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Post-It atualizado:', data);
            loadPostIts(selectedRoom); // Recarrega os post-its
            confirmCloseModal(); // Fecha o modal
        })
        .catch(error => console.error('Erro ao atualizar post-it:', error));
    } else {
        // Cria novo post-it
        fetch('http://localhost:3001/api/postIts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postItData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Post-It criado:', data);
            loadPostIts(selectedRoom); // Recarrega os post-its
            confirmCloseModal(); // Fecha o modal
        })
        .catch(error => console.error('Erro ao criar post-it:', error));
    }
}

// Abre o modal para edição de um post-it
function editPostIt(id) {
    const postIt = postIts.find(p => p.id === id);
    if (postIt) {
        editingPostItId = postIt.id; // Armazena o ID do post-it sendo editado
        document.getElementById('nameInput').value = postIt.name;
        document.getElementById('classInput').value = postIt.class;
        document.getElementById('shiftInput').value = postIt.shift;
        document.getElementById('textContent').value = postIt.content;
        selectColor(postIt.color); // Seleciona a cor do post-it
        openEditModal();
    }
}

// Deleta um post-it
function deletePostIt(id) {
    if (confirm('Você tem certeza que deseja excluir este post-it?')) {
        fetch(`http://localhost:3001/api/postIts/${id}`, {
            method: 'DELETE'
        })
        .then(() => {
            console.log(`Post-It com ID ${id} deletado.`);
            loadPostIts(selectedRoom); // Recarrega os post-its
        })
        .catch(error => console.error('Erro ao deletar post-it:', error));
    }
}

// Seleciona a cor do post-it
function selectColor(color) {
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
        if (option.style.backgroundColor === color) {
            option.classList.add('selected');
        }
    });
}

// Fecha o modal de edição
function confirmCloseModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Adiciona uma nova sala
function addRoom() {
    const roomName = prompt('Digite o nome da nova sala:');
    if (roomName) {
        fetch('http://localhost:3001/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ room: roomName })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Sala adicionada:', data);
            loadRooms(); // Recarrega as salas
        })
        .catch(error => console.error('Erro ao adicionar sala:', error));
    }
}

// Edita uma sala (atualmente não implementado, mas aqui para referência)
function editRoom() {
    const newRoomName = prompt('Digite o novo nome da sala:', selectedRoom);
    if (newRoomName) {
        // Aqui você pode implementar a lógica para editar o nome da sala
        console.log('Sala editada:', newRoomName);
        // Você precisaria atualizar a sala no banco de dados
    }
}

// Deleta uma sala
function deleteRoom() {
    if (confirm(`Você tem certeza que deseja excluir a sala "${selectedRoom}" e todos os seus post-its?`)) {
        fetch(`http://localhost:3001/api/rooms/${selectedRoom}`, {
            method: 'DELETE'
        })
        .then(() => {
            console.log(`Sala "${selectedRoom}" e seus post-its deletados.`);
            loadRooms(); // Recarrega as salas
            selectedRoom = ''; // Reseta a sala selecionada
            loadPostIts(selectedRoom); // Limpa os post-its
        })
        .catch(error => console.error('Erro ao deletar sala:', error));
    }
}
