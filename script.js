// CONFIGURATION FIREBASE
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

// SYNCHRONISATION CLOUD
database.ref('films').on('value', (snapshot) => {
    const data = snapshot.val();
    maListe = data ? Object.values(data) : [];
    afficherListe();
    console.log("Cloud synchronisé ☁️");
});

// RECHERCHE AUTO-COMPLÉTION
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
                item.innerHTML = `<img src="${img}"><div class="info"><b>${film.title}</b><br><small>${film.release_date ? film.release_date.split('-')[0] : ''}</small></div>`;
                item.onclick = () => selectionnerFilm(film.id);
                dropdown.appendChild(item);
            });
        }
    } catch (e) { console.error(e); }
}

// AJOUT AU CATALOGUE
async function selectionnerFilm(id) {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('filmInput').value = "";

    if (maListe.some(f => f.id === id)) { alert("Déjà présent !"); return; }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=fr-FR`);
        const m = await res.json();

        const nouveau = {
            id: m.id,
            titre: m.title,
            desc: m.overview,
            duree: m.runtime,
            note: m.vote_average.toFixed(1),
            poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
            banner: `https://image.tmdb.org/t/p/original${m.backdrop_path}`,
            videoUrl: "",
            links: { netflix: "", disney: "", amazon: "" }
        };

        maListe.unshift(nouveau);
        sauvegarder();
    } catch (e) { console.error(e); }
}

// AFFICHAGE
function afficherListe() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;
    grid.innerHTML = "";
    maListe.forEach(m => {
        const card = document.createElement('div');
        card.className = "film-card";
        card.onclick = () => ouvrirModal(m.id);
        card.innerHTML = `<img src="${m.poster}" alt="${m.titre}">`;
        grid.appendChild(card);
    });
}

// MODALE ET STREAMING
function ouvrirModal(id) {
    const m = maListe.find(f => f.id === id);
    if (!m) return;

    document.getElementById('modalBanner').style.backgroundImage = `url(${m.banner})`;
    document.getElementById('modalTitle').innerText = m.titre;
    document.getElementById('modalInfo').innerText = `${m.duree} min | ⭐ ${m.note}/10`;
    document.getElementById('modalDesc').innerText = m.desc || "Pas de synopsis.";

    const streamDiv = document.getElementById('streamingLinks');
    streamDiv.innerHTML = "";
    if (m.links) {
        if (m.links.netflix) streamDiv.innerHTML += `<a href="${m.links.netflix}" target="_blank" class="stream-link link-netflix">Netflix</a>`;
        if (m.links.disney) streamDiv.innerHTML += `<a href="${m.links.disney}" target="_blank" class="stream-link link-disney">Disney+</a>`;
        if (m.links.amazon) streamDiv.innerHTML += `<a href="${m.links.amazon}" target="_blank" class="stream-link link-prime">Prime</a>`;
    }

    const vDiv = document.getElementById('videoPlayer');
    vDiv.innerHTML = m.videoUrl ? `<video width="100%" controls style="margin-top:20px; border-radius:8px;"><source src="${m.videoUrl}" type="video/mp4"></video>` : "";

    document.getElementById('btnDelete').onclick = () => supprimerFilm(m.id);
    document.getElementById('movieModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function fermerModal() {
    document.getElementById('movieModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('videoPlayer').innerHTML = "";
}

function supprimerFilm(id) {
    if (confirm("Supprimer ?")) {
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