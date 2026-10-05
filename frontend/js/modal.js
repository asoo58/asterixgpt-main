//permet d'afficher le modal
function chargerModal() {
  //date.now() pour ne pas utiliser le cache
  return fetch('components/modal.html?v=' + Date.now())
    .then(res => res.text())
    .then(html => {
      document.body.insertAdjacentHTML('beforeend', html);
      attacherEvenements();
    });
}

//evenement lié au modal
function attacherEvenements() {
  const overlay = document.getElementById('overlay');

  //permet de fermer le modal
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') overlay.classList.remove('open');
  });

  //permet de submit les information
  document.getElementById('submit-btn').addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    const pwd = document.getElementById('password').value;

    //verifie si les champs sont remplie
    if (!email || !pwd) {
      afficherErreur('Veuillez remplir tous les champs.');
      return;
    }

    connecterUtilisateur(email, pwd);
  });
}

//permet de renvoyer vers la page avec urlCible
document.querySelectorAll('.open-modal').forEach(lien => {
  lien.addEventListener('click', e => {
    e.preventDefault();
    urlCible = lien.getAttribute('data-url');

    if (verifierConnexion()) {
      accederALaPage(urlCible);
    } else {
      if (!document.getElementById('overlay')) {
        chargerModal().then(() => {
          document.getElementById('overlay').classList.add('open');
        });
      } else {
        document.getElementById('overlay').classList.add('open');
      }
    }
  });
});