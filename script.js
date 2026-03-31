const API_KEY = '9fa60350cd740b9049ebef19f4e22487';
let maListe = JSON.parse(localStorage.getItem('maListe')) || [];

// 1. Initialisation
document.addEventListener('DOMContentLoaded', () => {
    afficherListe();

    // Ecouter la touche "Entrée" pour la recherche
    document.getElementById('filmInput').addEventListener('keypress', (e) => {
        if (e.key === 'Entrée') ajouterFilm();
    });
});

// 2. Ajouter un film avec ANTI-DOUBLON
async function ajouterFilm() {
    const input = document.getElementById('filmInput');
    const query = input.value.trim();
    if (!query) return;

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const filmFound = data.results[0];

            // VERIFICATION DOUBLON
            const existeDeja = maListe.some(f => f.id === filmFound.id);
            if (existeDeja) {
                alert("Ce film est déjà dans votre catalogue !");
                input.value = "";
                return;
            }

            // Récupérer détails complets (Durée)
            const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${filmFound.id}?api_key=${API_KEY}&language=fr-FR`);
            const movie = await detailRes.json();

            const nouveau = {
                id: movie.id,
                titre: movie.title,
                desc: movie.overview,
                duree: movie.runtime,
                note: movie.vote_average.toFixed(1),
                // Qualité W500 pour les affiches, Original pour les bannières
                poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                banner: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
                estVu: false,
                videoUrl: ""
            };

            maListe.unshift(nouveau); // Ajouter au début du catalogue
            sauvegarder();
            afficherListe();
            input.value = "";
        }
    } catch (err) { console.error(err); }
}

// 3. Affichage du catalogue
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

// 4. Modal de détails
function ouvrirModal(id) {
    const m = maListe.find(f => f.id === id);
    if (!m) return;

    document.getElementById('modalBanner').style.backgroundImage = `url(${m.banner})`;
    document.getElementById('modalTitle').innerText = m.titre;
    document.getElementById('modalInfo').innerText = `${m.duree} min | ⭐ ${m.note}/10`;
    document.getElementById('modalDesc').innerText = m.desc || "Pas de description.";

    // Lecteur vidéo (si URL présente)
    const vContainer = document.getElementById('videoPlayer');
    if (m.videoUrl) {
        vContainer.innerHTML = `<video width="100%" controls class="mt-3 rounded"><source src="${m.videoUrl}" type="video/mp4"></video>`;
    } else {
        vContainer.innerHTML = `<p class="text-muted mt-3 italic">Lier un fichier MP4 dans le code pour lire.</p>`;
    }
    const btnDelete = document.getElementById('btnDelete');
    btnDelete.onclick = () => supprimerFilm(m.id);

    document.getElementById('movieModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

// NOUVELLE FONCTION de suppression
function supprimerFilm(id) {
    // On demande confirmation pour éviter les erreurs
    if (confirm("Voulez-vous vraiment retirer ce film du catalogue ?")) {
        // On filtre la liste pour garder tous les films SAUF celui qui a cet ID
        maListe = maListe.filter(f => f.id !== id);

        sauvegarder();      // On enregistre la nouvelle liste
        afficherListe();    // On rafraîchit la grille
        fermerModal();      // On ferme la fenêtre
    }

}

function fermerModal() {
    document.getElementById('movieModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
    document.getElementById('videoPlayer').innerHTML = "";
}

function sauvegarder() {
    localStorage.setItem('maListe', JSON.stringify(maListe));
}