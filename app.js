// Configuración de Supabase con tus credenciales
const SUPABASE_URL = 'https://dghnnbprypzbmixxvjed.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VMLqpeNOHLHZ6k_3QKs6oQ_HHMv-7od';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Referencias al DOM
const authSection = document.getElementById('auth-section');
const adminSection = document.getElementById('admin-section');
const gamesSection = document.getElementById('games-section');
const userInfo = document.getElementById('user-info');
const userEmailSpan = document.getElementById('user-email');
const authMessage = document.getElementById('auth-message');
const gamesGrid = document.getElementById('games-grid');

// Reproductor
const playerModal = document.getElementById('player-modal');
const gameFrame = document.getElementById('game-frame');
const playingTitle = document.getElementById('playing-title');

// 1. Escuchar cambios en la sesión del usuario
supabaseClient.auth.onAuthStateChange((event, session) => {
  if (session) {
    iniciarInterfazUsuario(session.user);
  } else {
    mostrarPantallaLogin();
  }
});

// 2. Registro e Inicio de Sesión
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  authMessage.textContent = 'Iniciando sesión...';

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) authMessage.textContent = 'Error: ' + error.message;
});

document.getElementById('btn-signup').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  authMessage.textContent = 'Creando cuenta...';

  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    authMessage.textContent = 'Error: ' + error.message;
  } else {
    authMessage.textContent = '¡Cuenta creada! Revisa tu correo o inicia sesión si la confirmación está desactivada.';
  }
});

document.getElementById('btn-logout').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
});

// 3. Control de Vistas y Roles
function mostrarPantallaLogin() {
  authSection.classList.remove('hidden');
  adminSection.classList.add('hidden');
  gamesSection.classList.add('hidden');
  userInfo.classList.add('hidden');
  authMessage.textContent = '';
}

async function iniciarInterfazUsuario(user) {
  authSection.classList.add('hidden');
  gamesSection.classList.remove('hidden');
  userInfo.classList.remove('hidden');
  userEmailSpan.textContent = user.email;

  // Comprobar si el usuario es ADMIN en la tabla profiles
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile && profile.role === 'admin') {
    adminSection.classList.remove('hidden');
  } else {
    adminSection.classList.add('hidden');
  }

  cargarJuegos();
}

// 4. Cargar y Mostrar Juegos (Protegido por RLS)
async function cargarJuegos() {
  gamesGrid.innerHTML = '<p>Cargando catálogo...</p>';

  const { data: games, error } = await supabaseClient
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    gamesGrid.innerHTML = '<p>Error al cargar juegos.</p>';
    return;
  }

  gamesGrid.innerHTML = '';

  if (games.length === 0) {
    gamesGrid.innerHTML = '<p>Aún no hay juegos disponibles.</p>';
    return;
  }

  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <img src="${game.image_url}" alt="${game.title}">
      <p>${game.title}</p>
    `;
    card.addEventListener('click', () => abrirJuego(game.title, game.game_url));
    gamesGrid.appendChild(card);
  });
}

// 5. Añadir Juego (Solo Admins)
document.getElementById('add-game-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('game-title').value;
  const image_url = document.getElementById('game-image').value;
  const game_url = document.getElementById('game-url').value;

  const { error } = await supabaseClient
    .from('games')
    .insert([{ title, image_url, game_url }]);

  if (error) {
    alert('No tienes permisos o hubo un error: ' + error.message);
  } else {
    document.getElementById('add-game-form').reset();
    cargarJuegos();
  }
});

// 6. Reproductor sin descargas (Iframe)
function abrirJuego(title, url) {
  playingTitle.textContent = title;
  gameFrame.src = url;
  playerModal.classList.remove('hidden');
}

document.getElementById('btn-close-game').addEventListener('click', () => {
  playerModal.classList.add('hidden');
  gameFrame.src = ''; // Detiene el sonido/ejecución del juego al salir
});
