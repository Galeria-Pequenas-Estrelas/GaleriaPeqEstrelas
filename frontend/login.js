// Configuração do Firebase (altere ai rodrigo)
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.getAuth(app);

// Função para exibir o modal de login/cadastro
function showLoginModal() {
    document.getElementById("loginModal").style.display = "block";
}

// Função para fechar o modal
function closeModal() {
    document.getElementById("loginModal").style.display = "none";
}

// Alternar entre login e cadastro
let isLogin = true;
function toggleForm() {
    isLogin = !isLogin;
    document.getElementById("modalTitle").innerText = isLogin ? "Login do Professor" : "Cadastro do Professor";
    document.getElementById("authButton").innerText = isLogin ? "Entrar" : "Cadastrar";
    document.getElementById("toggleForm").innerHTML = isLogin ? 
        'Novo por aqui? <a href="#">Cadastre-se</a>' : 
        'Já tem uma conta? <a href="#">Entrar</a>';
}

// Função de autenticação
document.getElementById("authForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (isLogin) {
        // Login
        firebase.auth().signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                alert("Login realizado com sucesso!");
                closeModal();
            })
            .catch((error) => {
                alert("Erro no login: " + error.message);
            });
    } else {
        // Cadastro
        firebase.auth().createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                alert("Cadastro realizado com sucesso!");
                toggleForm();
            })
            .catch((error) => {
                alert("Erro no cadastro: " + error.message);
            });
    }
});

// Função para redirecionar para a página de configurações
function goToSettings() {
    window.location.href = "configuracoes.html";
}
