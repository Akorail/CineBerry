// --- CONFIGURATION FIREBASE ---
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

// --- SYNCHRONISATION AVEC FIREBASE ---
database.ref('films').on('value', (snapshot) => {
    const data = snapshot.val();
    maListe = data ? Object.values(data) : [];
    afficherListe();
});

// --- GESTION DES ANIMATIONS (Classes 'show') ---
function toggleElement(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) {
        el.style.display = 'block';
        setTimeout(() => el.classList.add('show'), 10);
    } else {
        el.classList.remove('show');
        setTimeout(() => el.style.display = 'none', 400);
    }
}

// --- RECHERCHE ET AJOUT ---
async function rechercherEnDirect() {
    const query = document.getElementById('filmInput').value.trim();
    const dropdown = document.getElementById('searchResults');
    if (query.length < 2) { dropdown.style.display = 'none'; return; }

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`);
        const data = await res.json();
        dropdown.innerHTML = "";
        dropdown.style.display = 'block';

        data.results.slice(0, 8).forEach(m => {
            if (m.media_type === 'person') return; // On ignore les fiches acteurs
            const item = document.createElement('div');
            item.className = "result-item";
            const titre = m.title || m.name;
            const img = m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : 'https://via.placeholder.com/40x60';
            item.innerHTML = `<img src="${img}"><div><b>${titre}</b></div>`;
            item.onclick = () => selectionnerFilm(m.id, m.media_type);
            dropdown.appendChild(item);
        });
    } catch (e) { console.error("Erreur recherche:", e); }
}

async function selectionnerFilm(id, type) {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('filmInput').value = "";
    if (maListe.some(f => f.id === id)) return;

    try {
        const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&language=fr-FR`);
        const m = await res.json();
        const nouveau = {
            id: m.id,
            titre: m.title || m.name,
            desc: m.overview,
            note: m.vote_average ? m.vote_average.toFixed(1) : "N/A",
            poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
            banner: `https://image.tmdb.org/t/p/original${m.backdrop_path}`,
            videoUrl: "" 
        };
        maListe.unshift(nouveau);
        database.ref('films').set(maListe);
    } catch (e) { console.error("Erreur ajout:", e); }
}

// --- AFFICHAGE DU CATALOGUE ---
function afficherListe() {
    const grid = document.getElementById('catalogGrid');
    grid.innerHTML = "";
    maListe.forEach(m => {
        const card = document.createElement('div');
        card.className = "film-card";
        card.innerHTML = `<img src="${m.poster}" onclick="ouvrirModal(${m.id})">`;
        grid.appendChild(card);
    });
}

// --- MODALE DÉTAILS ---
function ouvrirModal(id) {
    const m = maListe.find(f => f.id === id);
    if (!m) return;
    filmActuelId = id;

    document.getElementById('modalPoster').src = m.poster;
    document.getElementById('modalTitle').innerText = m.titre;
    document.getElementById('modalMeta').innerText = `Note: ⭐ ${m.note}/10`;
    document.getElementById('modalDesc').innerText = m.desc || "Aucun synopsis disponible.";
    
    const playSection = document.getElementById('playSection');
    if (m.videoUrl && m.videoUrl !== "") {
        playSection.innerHTML = `<button onclick="lancerVideoFullscreen('${m.videoUrl}')" class="btn-play-thin">Visionner</button>`;
        document.getElementById('adminPanel').style.display = "none";
    } else {
        playSection.innerHTML = `<p style="color:#444; font-style:italic; font-weight:300;">Vidéo non liée.</p>`;
        document.getElementById('adminPanel').style.display = "flex";
    }

    document.getElementById('btnDelete').onclick = () => supprimerFilm(m.id);
    
    toggleElement('modalOverlay', true);
    toggleElement('movieModal', true);
    document.body.style.overflow = 'hidden';
}

function fermerModal() {
    toggleElement('modalOverlay', false);
    toggleElement('movieModal', false);
    document.body.style.overflow = 'auto';
}

// --- LECTURE VIDÉO (OVERLAY PLEIN ÉCRAN) ---
function lancerVideoFullscreen(url) {
    const videoFullscreen = document.getElementById('videoFullscreen');
    const container = document.getElementById('videoContainer');
    
    // Nettoyage et transformation du lien Drive pour Iframe
    let driveId = "";
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    if (match) {
        driveId = match[1];
    } else {
        // Si c'est déjà un lien direct type uc?id=
        const urlParams = new URLSearchParams(url.split('?')[1]);
        driveId = urlParams.get('id');
    }

    if (!driveId) {
        alert("Erreur de lien Drive.");
        return;
    }

    const embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;

    container.innerHTML = `<iframe src="${embedUrl}" allow="autoplay" allowfullscreen></iframe>`;
    
    toggleElement('videoFullscreen', true);
    fermerModal(); // On ferme la modale d'info pour l'immersion
}

function fermerVideo() {
    const container = document.getElementById('videoContainer');
    container.innerHTML = ""; // Coupe le flux
    toggleElement('videoFullscreen', false);
}

// --- ADMINISTRATION DES LIENS ---
function enregistrerLienAutomatique() {
    const rawUrl = document.getElementById('urlInput').value.trim();
    if (!rawUrl) return;

    // Extraction de l'ID pour stockage propre
    const match = rawUrl.match(/\/d\/(.+?)\//) || rawUrl.match(/id=(.+?)(&|$)/);
    const driveId = match ? match[1] : null;

    if (!driveId) {
        alert("Lien Google Drive non reconnu.");
        return;
    }

    const finalUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
    
    const idx = maListe.findIndex(f => f.id === filmActuelId);
    if (idx !== -1) {
        maListe[idx].videoUrl = finalUrl;
        database.ref('films').set(maListe);
        document.getElementById('urlInput').value = "";
        ouvrirModal(filmActuelId); // Refresh bouton
    }
}

// --- ACTIONS DIVERSES ---
function supprimerFilm(id) {
    if (confirm("Retirer ce titre de votre vidéothèque ?")) {
        maListe = maListe.filter(f => f.id !== id);
        database.ref('films').set(maListe);
        fermerModal();
    }
}

function choisirFilmAleatoire() {
    if (maListe.length === 0) return;
    const f = maListe[Math.floor(Math.random() * maListe.length)];
    ouvrirModal(f.id);
}

// Fermer les résultats de recherche si on clique ailleurs
window.onclick = function(event) {
    if (!event.target.matches('.search-bar')) {
        document.getElementById('searchResults').style.display = 'none';
    }
}