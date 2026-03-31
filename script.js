const API_KEY = '9fa60350cd740b9049ebef19f4e22487'; // <-- Colle ta clé TMDB ici
let maListe = JSON.parse(localStorage.getItem('maListe')) || [];

async function ajouterFilm() {
    const input = document.getElementById('filmInput');
    const titreRecherche = input.value;
    if (!titreRecherche) return;

    try {
        // 1. On cherche le film sur TMDB
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(titreRecherche)}&language=fr-FR`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const premierResultat = data.results[0];

            // 2. On récupère les détails (car la recherche de base ne donne pas la durée !)
            const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${premierResultat.id}?api_key=${API_KEY}&language=fr-FR`);
            const movie = await detailRes.json();

            // 3. On crée l'objet avec les vraies infos
            const nouveauMedia = {
                id: movie.id,
                titre: movie.title,
                duree: movie.runtime || 0, // En minutes
                image: `https://image.tmdb.org/t/p/w92${movie.poster_path}`,
                estVu: false
            };

            maListe.push(nouveauMedia);
            sauvegarder();
            afficherListe();
            input.value = "";
        } else {
            alert("Film non trouvé !");
        }
    } catch (error) {
        console.error("Erreur API:", error);
    }
}

function afficherListe() {
    const conteneur = document.getElementById('listeMedias');
    conteneur.innerHTML = "";

    maListe.forEach(media => {
        const div = document.createElement('div');
        div.className = `card p-2 d-flex flex-row align-items-center mb-2 ${media.estVu ? 'vu' : ''}`;
        div.innerHTML = `
            <img src="${media.image}" class="rounded me-3" style="width: 50px;">
            <div class="flex-grow-1">
                <h6 class="mb-0">${media.titre}</h6>
                <small class="text-muted">${media.duree} min</small>
            </div>
            <div>
                <button class="btn btn-sm ${media.estVu ? 'btn-success' : 'btn-outline-success'}" onclick="toggleVu(${media.id})">✅</button>
                <button class="btn btn-sm btn-outline-danger" onclick="supprimer(${media.id})">🗑️</button>
            </div>
        `;
        conteneur.append(div);
    });
}

// Les fonctions sauvegarder, toggleVu et supprimer restent les mêmes
function sauvegarder() { localStorage.setItem('maListe', JSON.stringify(maListe)); }
function toggleVu(id) {
    const media = maListe.find(m => m.id === id);
    media.estVu = !media.estVu;
    sauvegarder();
    afficherListe();
}
function supprimer(id) {
    maListe = maListe.filter(m => m.id !== id);
    sauvegarder();
    afficherListe();
}

afficherListe();