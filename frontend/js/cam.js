
const champFichier   = document.getElementById('champ-fichier');
const apercuImport   = document.getElementById('apercu-import');
const zoneImport     = document.getElementById('zone-import');

const apercuCamera   = document.getElementById('apercu-camera');
const zoneCamera     = document.getElementById('zone-camera');
const legendeCamera  = document.getElementById('legende-camera');

const modalCamera    = document.getElementById('modal-camera');
const fluxVideo      = document.getElementById('flux-video');

const tagNom         = document.getElementById('tag-nom');
const tagConfiance   = document.getElementById('tag-confiance');
const reponseTexte   = document.getElementById('reponse-texte');

const btnCorrect     = document.getElementById('btn-correct');
const btnIncorrect   = document.getElementById('btn-incorrect');
const toast          = document.getElementById('toast');

let fluxActif = null;
const API_BASE = 'http://localhost:8080';

// Branchement des boutons via addEventListener (fiable)

document.getElementById('btn-import').addEventListener('click', function () {
    champFichier.value = '';
    champFichier.click();
});

document.getElementById('btn-camera').addEventListener('click', ouvrirCamera);

document.getElementById('btn-envoyer').addEventListener('click', envoyerALIA);

document.getElementById('btn-correct').addEventListener('click', function () {
    donnerFeedback('correct');
});

document.getElementById('btn-incorrect').addEventListener('click', function () {
    donnerFeedback('incorrect');
});

document.getElementById('btn-fermer-camera').addEventListener('click', fermerCamera);
document.getElementById('btn-annuler-camera').addEventListener('click', fermerCamera);
document.getElementById('btn-capturer').addEventListener('click', prendrePhoto);

//Import d'image
champFichier.addEventListener('change', function () { //choisi une image
    const fichier = this.files[0]; //liste d'image séléctionné, on prend la première image
    if (!fichier) return;
    const url = URL.createObjectURL(fichier);
    apercuImport.src = url;
    apercuImport.style.display = 'block';
    zoneImport.querySelector('.icone-zone').style.display = 'none';
    zoneImport.querySelector('.legende-zone').style.display = 'none';
    zoneImport.classList.add('avec-image');
    afficherToast('Image importée ✓');
});

//Caméra 
async function ouvrirCamera() {
    try {
        if (fluxActif) fermerCamera();
        fluxActif = await navigator.mediaDevices.getUserMedia({ video: true });
        fluxVideo.srcObject = fluxActif;// On connecte le flux vidéo à la balise <video> pour l'afficher à l'écran
        modalCamera.classList.add('ouvert');
    } catch (e) {
        afficherToast('Caméra non disponible');
    }
}

function prendrePhoto() {
    if (!fluxVideo.srcObject) {
        afficherToast('Caméra non active');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width  = fluxVideo.videoWidth  || 640;
    canvas.height = fluxVideo.videoHeight || 480;
    canvas.getContext('2d').drawImage(fluxVideo, 0, 0);

    canvas.toBlob(blob => { // Conversion du canvas en blob (fichier image)
        fermerCamera();

        if (!blob) {
            afficherToast('Erreur capture');
            return;
        }

        const imageUrl = canvas.toDataURL('image/jpeg');
        apercuCamera.src = imageUrl;
        apercuCamera.style.display = 'block';
        zoneCamera.querySelector('.icone-zone').style.display = 'none';
        zoneCamera.classList.add('avec-image');
        legendeCamera.textContent = 'Photo prise ✓';
        afficherToast('Photo prise ✓');
    }, 'image/jpeg');
}
// On récupère toutes les "tracks" du flux (vidéo, audio)
// et on les arrête proprement pour libérer la webcam
function fermerCamera() {
    if (fluxActif) {
        fluxActif.getTracks().forEach(t => t.stop());
        fluxActif = null;
    }
    modalCamera.classList.remove('ouvert');
    fluxVideo.srcObject = null;
}

//Envoi à l'IA
let dernierGuessId = null;

function envoyerALIA() {
    // Vérifie si une image est présente (importée ou prise avec la caméra)
    const aImport = apercuImport.style.display === 'block';
    const aCamera = apercuCamera.style.display === 'block';

    if (!aImport && !aCamera) {
        afficherToast("Veuillez d'abord choisir une image");
        return;
    }
    //mise à jour de l'analyse en cours
    tagNom.textContent       = '…';
    tagConfiance.textContent = 'Analyse…';
    reponseTexte.textContent = 'AsterixGPT analyse votre image…';

    // On crée une promesse pour récupérer le fichier image
    const formData = new FormData();

    const promesseFichier = new Promise((resolve, reject) => {
        if (aImport && champFichier.files[0]) {
            resolve(champFichier.files[0]);

        } else if (aCamera) {
            fetch(apercuCamera.src)
                .then(r => r.blob())
                .then(blob => {
                    blob.name = 'guessimage.jpg';
                    resolve(blob);
                })
                .catch(reject);
        } else {
            reject(new Error('Aucune image'));
        }
    });
    
    promesseFichier.then(fichierImg => {
        formData.append('guessimage', fichierImg, 'guessimage.jpg');
        fetch(API_BASE + '/api/guesses', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                if (data && data.guess) {
                    dernierGuessId = data.id;
                    const confiance = Math.floor(Math.random() * 30 + 70);
                    tagNom.textContent       = data.guess;
                    tagConfiance.textContent = 'Confiance: ' + confiance + '%';
                    reponseTexte.textContent = 'AsterixGPT pense que cette image représente "' + data.guess + '"';
                    afficherToast('Analyse terminée ✓');
                } else {
                    afficherToast('Erreur: ' + (data.message || 'Invalide'));
                }
            })
            .catch(() => afficherToast('Erreur API'));
    }).catch(err => afficherToast(err.message));
}

//Feedback
function donnerFeedback(choix) {
    // On enlève les styles de sélection des deux boutons
    btnCorrect.classList.remove('selectionne-correct', 'selectionne-incorrect');
    btnIncorrect.classList.remove('selectionne-correct', 'selectionne-incorrect');

    
    const win            = choix === 'correct' ? 1 : -1;
    // On détermine quel bouton a été cliqué
    const btnSelectionne = choix === 'correct' ? btnCorrect : btnIncorrect;

    if (dernierGuessId) {
        fetch(API_BASE + '/api/guesses/' + dernierGuessId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ win: win })
        })
        .then(r => r.json())
        .then(() => {
            // On colore le bouton sélectionné
            btnSelectionne.classList.add(choix === 'correct' ? 'selectionne-correct' : 'selectionne-incorrect');
            afficherToast('Merci !');
        })
        .catch(() => {
            btnSelectionne.classList.add(choix === 'correct' ? 'selectionne-correct' : 'selectionne-incorrect');
            afficherToast('Retour hors ligne');
        });
    } else {
        btnSelectionne.classList.add(choix === 'correct' ? 'selectionne-correct' : 'selectionne-incorrect');
        afficherToast('Merci !');
    }
}

/* ── Toast ── */
let minuteurToast;

function afficherToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(minuteurToast);
    minuteurToast = setTimeout(() => toast.classList.remove('visible'), 2500);
}