const GUESSES_URL = 'http://localhost:8080/api/guesses';

function formaterDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

function afficherMessageErreur(message) {
  const feedback = document.getElementById('stat-feedback');
  if (feedback) {
    feedback.textContent = message;
  }
}

function construireBarreJour(stat) {
  const total = Math.max(stat.total, 1);
  const successPct = ((stat.gagnes / total) * 100).toFixed(2);
  const failPct = ((stat.rates / total) * 100).toFixed(2);
  const pendingPct = ((stat.pending / total) * 100).toFixed(2);

  return `
    <div class="prediction-item">
      <div class="day-label">${stat.label}</div>
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-success" style="width: ${successPct}%"></div>
          <div class="progress-fail" style="width: ${failPct}%"></div>
          <div class="progress-pending" style="width: ${pendingPct}%"></div>
        </div>
      </div>
      <div class="prediction-count">${stat.total} prédiction${stat.total > 1 ? 's' : ''}</div>
    </div>
  `;
}

function formaterAvis(rate) {
  if (rate >= 85) return 'EXCELLENT !';
  if (rate >= 70) return 'TRÈS BIEN';
  if (rate >= 50) return 'C\'EST MOYEN';
  return 'BESOIN D\'AMÉLIORATION';
}

function afficherStatistiques(guesses) {
  const total = guesses.length;
  const gagnes = guesses.filter(g => Number(g.win) === 1).length;
  const rates = guesses.filter(g => Number(g.win) === -1).length;
  const totalAvecFeedback = gagnes + rates;
  const successRate = totalAvecFeedback > 0 ? Math.round((gagnes / totalAvecFeedback) * 100) : 0;

  const statGagnes = document.getElementById('stat-gagnes');
  const statRates = document.getElementById('stat-rates');
  const statTotal = document.getElementById('stat-total');
  const statPercentage = document.getElementById('stat-percentage');
  const statFeedback = document.getElementById('stat-feedback');
  const predictionDays = document.getElementById('prediction-days');

  if (statGagnes) statGagnes.textContent = gagnes;
  if (statRates) statRates.textContent = rates;
  if (statTotal) statTotal.textContent = total;
  if (statPercentage) statPercentage.textContent = `${successRate}%`;
  if (statFeedback) statFeedback.textContent = formaterAvis(successRate);

  if (!predictionDays) return;

  const dailyMap = {};
  guesses.forEach(guess => {
    const date = new Date(guess.date);
    if (Number.isNaN(date.getTime())) return;

    const key = date.toISOString().slice(0, 10);
    if (!dailyMap[key]) {
      dailyMap[key] = {
        dateKey: key,
        label: formaterDate(guess.date),
        gagnes: 0,
        rates: 0,
        pending: 0,
        total: 0
      };
    }

    dailyMap[key].total += 1;
    const win = Number(guess.win);
    if (win === 1) dailyMap[key].gagnes += 1;
    else if (win === -1) dailyMap[key].rates += 1;
    else dailyMap[key].pending += 1;
  });

  const dailyStats = Object.values(dailyMap).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  if (dailyStats.length === 0) {
    predictionDays.innerHTML = '<div class="prediction-item"><div class="day-label">Aucune statistique disponible</div></div>';
    return;
  }

  predictionDays.innerHTML = dailyStats.map(construireBarreJour).join('');
}

function chargerStatistiques() {
  const token = getToken();
  if (!token) {
    urlCible = 'statistique.html';
    afficherMessageErreur('Veuillez vous connecter pour voir les statistiques.');
    if (!document.getElementById('overlay')) {
      chargerModal().then(() => document.getElementById('overlay').classList.add('open'));
    } else {
      document.getElementById('overlay').classList.add('open');
    }
    return;
  }

  fetch(GUESSES_URL, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Erreur API ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error('Réponse invalides stats:', data);
        afficherMessageErreur('Impossible de charger les statistiques.');
        return;
      }
      afficherStatistiques(data);
    })
    .catch(err => {
      console.error('Erreur chargement statistiques:', err);
      afficherMessageErreur('Erreur lors du chargement des statistiques.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  if (verifierConnexion()) {
    chargerStatistiques();
  } else {
    chargerStatistiques();
  }
});
