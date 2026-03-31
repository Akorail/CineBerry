const firebaseConfig = {
    apiKey: "AIzaSyB3unK3pRold7z7a-qxbLDTDNvByykw1H4",
    authDomain: "cineberry.firebaseapp.com",
    projectId: "cineberry",
    storageBucket: "cineberry.firebasestorage.app",
    messagingSenderId: "62488214470",
    appId: "1:62488214470:web:9a689e1042b4cec8e890c7",
    databaseURL: "https://cineberry-default-rtdb.europe-west1.firebasedatabase.app/"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const API_KEY = '9fa60350cd740b9049ebef19f4e22487';
let maListe = [];
let filmActuelId = null;

// SYNCHRONISATION FIREBASE
database.ref('films').on('value', (snapshot) => {
    const data = snapshot.val();
    maListe = data ? Object.values(data) : [];
    afficherListe();
});

// RECHERCHE
async function rechercherEnDirect() {
    const query = document.getElementById('filmInput').value.trim();
    const dropdown = document.getElementById('searchResults');
    if (query.length < 2) { dropdown.style.display = 'none'; return; }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`);
        const data = await res.json();
        if (data.results) {
            dropdown.innerHTML = "";
            dropdown.style.display = 'block';
            data.results.slice(0, 8).forEach(film => {
                const item = document.createElement('div');
                item.className = "result-item";
                const img = film.poster_path ? `https://image.tmdb.org/t/p/w92${film.poster_path}` : 'https://via.placeholder.com/40x60';
                item.innerHTML = `<img src="${img}"><div><b>${film.title}</b><br><small>${film.release_date?.split('-')[0] || ''}</small></div>`;
                item.onclick = () => selectionnerFilm(film.id);
                dropdown.appendChild(item);
            });
        }
    } catch (e) { console.error(e); }
}

// AJOUT
async function selectionnerFilm(id) {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('filmInput').value = "";
    if (maListe.some(f => f.id === id)) return alert("Déjà dans le catalogue !");

    try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=fr-FR`);
        const m = await res.json();
        const nouveau = {
            id: m.id, titre: m.title, desc: m.overview, duree: m.runtime,
            note: m.vote_average.toFixed(1),
            poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
            banner: `https://image.tmdb.org/t/p/original${m.backdrop_path}`,
            videoUrl: ""
        };
        maListe.unshift(nouveau);
        sauvegarder();
    } catch (e) { console.error(e); }
}

// AFFICHAGE GRILLE
function afficherListe() {
    const grid = document.getElementById('catalogGrid');
    grid.innerHTML = "";
    maListe.forEach(m => {
        const card = document.createElement('div');
        card.className = "film-card";
        card.onclick = () => ouvrirModal(m.id);
        card.innerHTML = `<img src="${m.poster}">`;
        grid.appendChild(card);
    });
}

// MODALE ET LECTURE
function ouvrirModal(id) {
    const m = maListe.find(f => f.id === id);
    if (!m) return;
    filmActuelId = id;

    document.getElementById('modalBanner').style.backgroundImage = `url(${m.banner})`;
    document.getElementById('modalTitle').innerText = m.titre;
    document.getElementById('modalInfo').innerText = `${m.duree} min | ⭐ ${m.note}/10`;
    document.getElementById('modalDesc').innerText = m.desc || "Pas de synopsis.";

    const playSection = document.getElementById('playSection');
    const videoContainer = document.getElementById('videoContainer');
    videoContainer.style.display = "none";

    if (m.videoUrl) {
        playSection.innerHTML = `<button onclick="lancerVideo('${m.videoUrl}')" class="btn-random" style="background:#28a745; width:100%; font-size:1.2rem;">▶ LECTURE</button>`;
    } else {
        playSection.innerHTML = `<p style="color:#666; text-align:center;"><i>Aucune vidéo liée. Ajoutez un lien ci-dessous.</i></p>`;
    }

    document.getElementById('btnDelete').onclick = () => supprimerFilm(m.id);
    document.getElementById('movieModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function lancerVideo(url) {
    const container = document.getElementById('videoContainer');
    const player = document.getElementById('mainPlayer');
    player.src = url;
    container.style.display = "block";
    player.play();
}

function enregistrerLienVideo() {
    const url = document.getElementById('urlInput').value.trim();
    if (!url) return;
    const idx = maListe.findIndex(f => f.id === filmActuelId);
    if (idx !== -1) {
        maListe[idx].videoUrl = url;
        sauvegarder();
        alert("Lien enregistré !");
        ouvrirModal(filmActuelId);
        document.getElementById('urlInput').value = "";
    }
}

function fermerModal() {
    document.getElementById('movieModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('mainPlayer').pause();
}

function supprimerFilm(id) {
    if (confirm("Supprimer ce film ?")) {
        maListe = maListe.filter(f => f.id !== id);
        sauvegarder();
        fermerModal();
    }
}

function sauvegarder() { database.ref('films').set(maListe); }

function choisirFilmAleatoire() {
    if (maListe.length === 0) return;
    const f = maListe[Math.floor(Math.random() * maListe.length)];
    ouvrirModal(f.id);
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) document.getElementById('searchResults').style.display = 'none';
});