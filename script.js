const API_KEY = '9fa60350cd740b9049ebef19f4e22487';
let maListe = JSON.parse(localStorage.getItem('maListe')) || [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    afficherListe();
});

// RECHERCHE EN DIRECT (AUTO-COMPLÉTION)
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
                        <div class="year" style="font-size:0.8rem; color:#888;">${film.release_date ? film.release_date.split('-')[0] : ''}</div>
                    </div>
                `;

                item.onclick = () => selectionnerFilm(film.id);
                dropdown.appendChild(item);
            });
        }
    } catch (err) { console.error("Erreur recherche:", err); }
}

// SÉLECTIONNER ET AJOUTER AU CATALOGUE
async function selectionnerFilm(id) {
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('filmInput').value = "";

    // Anti-doublon
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
            videoUrl: "" // À remplir manuellement si besoin
        };

        maListe.unshift(nouveau); // Ajoute en premier
        sauvegarder();
        afficherListe();
    } catch (err) { console.error("Erreur détails:", err); }
}

// AFFICHAGE DE LA GRILLE
function afficherListe() {
    const grid = document.getElementById('catalogGrid');
    grid.innerHTML = "";

    maListe.forEach(m => {
        const card = document.createElement('div');
        card.className = "film-card";
        card.onclick = () => ouvrirModal(m.id);
        card.innerHTML = `<img src="${m.poster}" alt="${m.titre}">`;
        grid.appendChild(card);
    });
}

// GESTION MODALE
function ouvrirModal(id) {
    const m = maListe.find(f => f.id === id);
    if (!m) return;

    document.getElementById('modalBanner').style.backgroundImage = `url(${m.banner})`;
    document.getElementById('modalTitle').innerText = m.titre;
    document.getElementById('modalInfo').innerText = `${m.duree} min | ⭐ ${m.note}/10`;
    document.getElementById('modalDesc').innerText = m.desc || "Aucun synopsis disponible.";

    // Bouton supprimer
    document.getElementById('btnDelete').onclick = () => supprimerFilm(m.id);

    // Vidéo
    const vDiv = document.getElementById('videoPlayer');
    vDiv.innerHTML = m.videoUrl ? `<video width="100%" controls style="margin-top:20px; border-radius:8px;"><source src="${m.videoUrl}" type="video/mp4"></video>` : "";

    document.getElementById('movieModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Bloque scroll arrière-plan
}

function fermerModal() {
    document.getElementById('movieModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// SUPPRESSION
function supprimerFilm(id) {
    if (confirm("Supprimer ce film du catalogue ?")) {
        maListe = maListe.filter(f => f.id !== id);
        sauvegarder();
        afficherListe();
        fermerModal();
    }
}

function sauvegarder() {
    localStorage.setItem('maListe', JSON.stringify(maListe));
}

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.getElementById('searchResults').style.display = 'none';
    }
});