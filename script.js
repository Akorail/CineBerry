const API_KEY = '9fa60350cd740b9049ebef19f4e22487';
let maListe = JSON.parse(localStorage.getItem('maListe')) || [];

// --- NAVIGATION ---
function changerOnglet(nom) {
    // Masquer toutes les sections
    document.querySelectorAll('.onglet-content').forEach(sec => sec.style.display = 'none');
    // Enlever la classe active des liens
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    // Afficher la section demandée
    document.getElementById('page-' + nom).style.display = 'block';
    document.getElementById('btn-' + nom).classList.add('active');

    // Cacher la barre de recherche si on est sur la roulette
    document.getElementById('zone-recherche').style.display = (nom === 'aleatoire') ? 'none' : 'flex';

    afficherListe();
}

// --- LOGIQUE API & AJOUT ---
async function ajouterFilm() {
    const input = document.getElementById('filmInput');
    const titre = input.value;
    if (!titre) return;

    try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(titre)}&language=fr-FR`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const basicInfo = data.results[0];

            // On cherche les détails pour avoir la durée exacte (runtime)
            const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${basicInfo.id}?api_key=${API_KEY}&language=fr-FR`);
            const movie = await detailRes.json();

            const nouveauMedia = {
                id: movie.id,
                titre: movie.title,
                desc: movie.overview,
                duree: movie.runtime,
                note: movie.vote_average.toFixed(1),
                image: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                banner: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
                estVu: false,
                videoUrl: "" // Chemin vers ton .mp4 (ex: "films/nom.mp4")
            };

            maListe.push(nouveauMedia);
            sauvegarder();
            afficherListe();
            input.value = "";
        } else {
            alert("Film introuvable !");
        }
    } catch (err) {
        console.error("Erreur API:", err);
    }
}

// --- AFFICHAGE ---
function afficherListe() {
    const gridAVoir = document.getElementById('liste-a-voir');
    const gridVu = document.getElementById('liste-deja-vu');

    gridAVoir.innerHTML = "";
    gridVu.innerHTML = "";

    maListe.forEach(m => {
        const card = document.createElement('div');
        card.className = "film-card";
        card.onclick = () => ouvrirInfos(m.id);
        card.innerHTML = `<img src="${m.image}" alt="${m.titre}">`;

        if (m.estVu) gridVu.appendChild(card);
        else gridAVoir.appendChild(card);
    });
}

// --- MODAL ET DÉTAILS ---
function ouvrirInfos(id) {
    const m = maListe.find(f => f.id === id);
    if (!m) return;

    document.getElementById('modalTitre').innerText = m.titre;
    document.getElementById('modalDesc').innerText = m.desc || "Aucune description disponible.";
    document.getElementById('modalDuree').innerText = `${m.duree} min`;
    document.getElementById('modalNote').innerText = `⭐ ${m.note}/10`;
    document.getElementById('modalImage').style.backgroundImage = `url(${m.banner})`;

    // Gestion du bouton de statut (Vu/À voir)
    const btnAction = document.getElementById('btnActionStatut');
    btnAction.innerText = m.estVu ? "Remettre à voir" : "Marquer comme terminé";
    btnAction.onclick = () => { toggleVu(m.id); fermerModal(); };

    // Gestion Vidéo MP4
    const videoDiv = document.getElementById('videoContainer');
    if (m.videoUrl) {
        videoDiv.innerHTML = `
            <h6 class="text-white mb-2">Lecteur Vidéo :</h6>
            <video width="100%" controls class="rounded border border-secondary">
                <source src="${m.videoUrl}" type="video/mp4">
                Votre navigateur ne supporte pas la lecture de vidéos.
            </video>`;
    } else {
        videoDiv.innerHTML = `<div class="alert alert-dark small">🎥 Aucun fichier MP4 lié.</div>`;
    }

    document.getElementById('overlay').style.display = 'block';
    document.getElementById('modalFilm').style.display = 'block';
}

function fermerModal() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('modalFilm').style.display = 'none';
    document.getElementById('videoContainer').innerHTML = ""; // Coupe le son de la vidéo
}

// --- ACTIONS ---
function toggleVu(id) {
    const idx = maListe.findIndex(m => m.id === id);
    maListe[idx].estVu = !maListe[idx].estVu;
    sauvegarder();
    afficherListe();
}

function choisirAleatoire() {
    const aVoir = maListe.filter(m => !m.estVu);
    const resDiv = document.getElementById('resultat-aleatoire');

    if (aVoir.length === 0) {
        resDiv.innerHTML = "<p>Aucun film disponible dans votre liste 'À voir'.</p>";
        return;
    }

    const hasard = aVoir[Math.floor(Math.random() * aVoir.length)];
    resDiv.innerHTML = `
        <div class="film-card mx-auto" style="width: 200px;" onclick="ouvrirInfos(${hasard.id})">
            <img src="${hasard.image}">
            <h5 class="mt-2 text-white">${hasard.titre}</h5>
        </div>
    `;
}

function sauvegarder() {
    localStorage.setItem('maListe', JSON.stringify(maListe));
}

// Lancement initial
afficherListe();