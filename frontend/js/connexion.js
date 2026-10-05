const API_URL = 'http://localhost:8080';
//url lié au bouton cliqué grâce à data-url
let urlCible = null;

//permet de voir si un token est stocké dans localstorage
function verifierConnexion() {
  return localStorage.getItem('token') !== null;
}

//permet de sauvegarder le token dans localstorage
function sauvegarderToken(token) {
  localStorage.setItem('token', token);
}

//permet de récuperer le token
function getToken() {
  return localStorage.getItem('token');
}

//permet de savoir si l'utilisateur est admin
function estAdmin() {
  return localStorage.getItem('admin') === '1';
}

//permet d'acceder à la page cible
function accederALaPage(url) {
  window.location.href = url;
}

//permet d'afficher les erreurs de l'api
function afficherErreur(message) {
  let erreurEl = document.getElementById('erreur-modal');
  if (!erreurEl) {
    erreurEl = document.createElement('p');
    erreurEl.id = 'erreur-modal';
    erreurEl.style.color = 'red';
    erreurEl.style.padding = '0 1.5rem';
    erreurEl.style.margin = '0';
    erreurEl.style.fontSize = '13px';
    document.getElementById('submit-btn').before(erreurEl);
  }
  erreurEl.textContent = message;
}

//connecte l'utilisateur grâce à l'api
function connecterUtilisateur(email, password) {
  fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: email,
      password: password
    })
  })
  //réponse de l'api
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      //récupération du token
      sauvegarderToken(data.token);
      //sauvegarde du statut admin dans localstorage
      localStorage.setItem('admin', data.admin ? '1' : '0');
      //ferme le modal
      document.getElementById('overlay').classList.remove('open');
      //accède à la page
      accederALaPage(urlCible);
    } else {
      afficherErreur('Identifiants incorrects.');
    }
  })
  .catch(err => {
    afficherErreur('Erreur de connexion au serveur.');
    console.error(err);
  });
}