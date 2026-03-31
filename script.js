// 1. Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB3unK3pRold7z7a-qxbLDTDNvByykw1H4",
    authDomain: "cineberry.firebaseapp.com",
    projectId: "cineberry",
    storageBucket: "cineberry.firebasestorage.app",
    messagingSenderId: "62488214470",
    appId: "1:62488214470:web:9a689e1042b4cec8e890c7",
    databaseURL: "https://cineberry-default-rtdb.europe-west1.firebasedatabase.app/"
};

// 2. Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// 3. Variables Globales
const API_KEY = '9fa60350cd740b9049ebef19f4e22487';
let maListe = [];

// 4. SYNCHRONISATION TEMPS RÉEL
// Cette fonction écoute Firebase. Si tu ajoutes un film sur PC, il apparaît sur Tel instantanément.
database.ref('films').on('value', (snapshot) => {
    const data = snapshot.val();
    // Firebase stocke parfois les tableaux comme des objets, on assure la conversion
    maListe = data ? Object.values(data) : [];
    afficherListe();
    console.log("Catalogue mis à jour depuis le Cloud ☁️");
});

// 5. RECHERCHE EN DIRECT (AUTO-COMPLÉTION)
async function rechercherEnDirect() {
    const query = document.getElementById('filmInput').value.trim();
    const dropdown = document.getElementById('searchResults');

    if (query.length < 2) {
        dropdown.style.display = 'none';
        return;
    }

    try {
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            dropdown.innerHTML = "";
            dropdown.style.display = 'block';

            data.results.slice(0, 8).forEach(film => {
                const item = document.createElement('div');
                item.className = "result-item";
                const poster = film.poster_path ? `https://image.tmdb.org/t/p/w92${film.poster_path}` : 'https://via.placeholder.com/40x60?text=No+Img';

                item.innerHTML = `
                    <img src="${poster}">
                    <div class="info">
                        <div class="title" style="font-weight:bold; font-size:0.9rem;">${film.title}</div>
                        <div class="year" style="font-size:0.8rem; color:#888;">${film.release_date ? film.release_date.split('-')[0] : 'Année inconnue'}</div>
                    </div>
                `;

                item.onclick = () => selectionnerFilm(film.id);
                dropdown.appendChild(item);
            });
        }
    } catch (err) {
        console.error("Erreur recherche TMDB:", err);
    }
}

// 6. SÉLECTION ET AJOUT AU CLOUD
async function selectionnerFilm(id) {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('filmInput').value = "";

    // Vérification anti-doublon
    if (maListe.some(f => f.id === id)) {
        alert("Ce film est déjà dans ton catalogue !");
        return;
    }

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
            videoUrl: "" // À remplir manuellement pour tes fichiers MP4
        };

        // On ajoute au début du tableau local
        maListe.unshift(nouveau);

        // On envoie la mise à jour à Firebase
        sauvegarder();
    } catch (err) {
        console.error("Erreur récupération détails:", err);
    }
}

// 7. AFFICHAGE DE LA GRILLE
function afficherListe() {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    grid.innerHTML = "";

    maListe.forEach(m => {
        const card = document.createElement('div');
        card.className = "film-card";
        card.onclick = () => ouvrirModal(m.id);
        card.innerHTML = `<img src="${m.poster}" alt="${m.titre}" loading="lazy">`;
        grid.appendChild(card);
    });
}

// 8. GESTION DE LA MODALE
function ouvrirModal(id) {
    const m = maListe.find(f => f.id === id);
    if (!m) return;

    document.getElementById('modalBanner').style.backgroundImage = `url(${m.banner})`;
    document.getElementById('modalTitle').innerText = m.titre;
    document.getElementById('modalInfo').innerText = `${m.duree} min | ⭐ ${m.note}/10`;
    document.getElementById('modalDesc').innerText = m.desc || "Aucun synopsis disponible.";

    // Configuration du bouton supprimer
    document.getElementById('btnDelete').onclick = () => supprimerFilm(m.id);

    // Lecteur Vidéo MP4
    const vDiv = document.getElementById('videoPlayer');
    vDiv.innerHTML = m.videoUrl ?
        `<video width="100%" controls style="margin-top:20px; border-radius:8px;">
            <source src="${m.videoUrl}" type="video/mp4">
         </video>` :
        `<p style="color:#666; font-style:italic; margin-top:20px;">Aucun fichier MP4 lié.</p>`;

    document.getElementById('movieModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function fermerModal() {
    document.getElementById('movieModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('videoPlayer').innerHTML = ""; // Stop la vidéo
    document.body.style.overflow = 'auto';
}

// 9. SUPPRESSION ET SAUVEGARDE
function supprimerFilm(id) {
    if (confirm("Supprimer ce film de ton catalogue Cloud ?")) {
        maListe = maListe.filter(f => f.id !== id);
        sauvegarder();
        fermerModal();
    }
}

function sauvegarder() {
    // Écrase la version sur Firebase avec la nouvelle liste
    database.ref('films').set(maListe);
}

// 10. FONCTION BONUS : FILM ALÉATOIRE
// Tu peux appeler cette fonction via un bouton ou la console pour choisir un film au hasard
function choisirFilmAleatoire() {
    if (maListe.length === 0) {
        alert("Ton catalogue est vide !");
        return;
    }
    const indexHasard = Math.floor(Math.random() * maListe.length);
    const filmChoisi = maListe[indexHasard];
    ouvrirModal(filmChoisi.id);
}

// 11. GESTION DES CLICS EXTÉRIEURS
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('searchResults');
    // Ferme la recherche si on clique ailleurs
    if (!e.target.closest('.search-container')) {
        dropdown.style.display = 'none';
    }
});