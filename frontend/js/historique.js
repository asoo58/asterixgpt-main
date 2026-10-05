//permet de charger l'historique grâce à l'api
function chargerHistorique() {
  const token = getToken();
  fetch('http://localhost:8080/api/guesses', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
  .then(res => res.json())
  .then(data => {
    afficherTableau(data);
  })
  .catch(err => {
    console.error('Erreur chargement historique:', err);
  });
}

//permet de supprimer tout l'historique grâce à l'api (admin uniquement)
function supprimerHistorique() {
  //demande confirmation avant suppression
  if (!confirm('Voulez-vous vraiment supprimer tout l\'historique ?')) return;

  const token = getToken();

  fetch('http://localhost:8080/api/guesses', {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      //vide le tableau après suppression
      document.getElementById('historique-tbody').innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 2rem;">
            Historique supprimé.
          </td>
        </tr>
      `;
    } else {
      alert('Erreur lors de la suppression.');
    }
  })
  .catch(err => {
    console.error('Erreur suppression:', err);
    alert('Erreur de connexion au serveur.');
  });
}

//affiche le bouton delete uniquement si l'utilisateur est admin
function afficherBoutonDelete() {
  if (estAdmin()) {
    const btnDelete = document.getElementById('btn-delete');
    if (btnDelete) btnDelete.style.display = 'inline-block';
  }
}

//permet de donnée les attribut gagné raté ou invalide du feedback
function formaterFeedback(win) {
  if (win === 1)  return 'GAGNÉ';
  if (win === -1) return 'RATÉ';
  if (win === 0)  return 'INVALIDE';
  return '–';
}

//permet d'avoir les dates de manière lisible
function formaterDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

//permet d'afficher les éléments de l'historique dans le tableau
function afficherTableau(guesses) {
  const tbody = document.getElementById('historique-tbody');
  tbody.innerHTML = '';

  //pour chaque éléments du tableau
  guesses.forEach(guess => {
    const tr = document.createElement('tr');
    //mise en forme du tableau
    tr.innerHTML = `
      <td>${guess.id}</td>
      <td><img src="http://localhost:8080/${guess.imagepath}" alt="image" style="width:60px; height:60px; object-fit:cover; border-radius:6px;"></td>
      <td>${guess.guess.toUpperCase()}</td>
      <td class="feedback-${guess.win === 1 ? 'gagne' : guess.win === -1 ? 'rate' : 'invalide'}">${formaterFeedback(guess.win)}</td>
      <td>${formaterDate(guess.date)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Charger automatiquement au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  if (verifierConnexion()) {
    chargerHistorique();
    //afficher le bouton delete si admin
    afficherBoutonDelete();
  } else {
    // Ouvrir la modale si non connecté
    if (!document.getElementById('overlay')) {
      chargerModal().then(() => {
        document.getElementById('overlay').classList.add('open');
      });
    } else {
      document.getElementById('overlay').classList.add('open');
    }
  }
});
