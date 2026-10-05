//récupère le token quand on clique sur le bouton
document.getElementById('btn-zip').addEventListener('click', () => {
  const token = getToken();
  //utilisation de l'api
  fetch('http://localhost:8080/api/guesses/images', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  .then(res => {
    if (!res.ok) throw new Error('Erreur téléchargement');
    return res.blob();
  })
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  })
  .catch(err => {
    console.error('Erreur ZIP:', err);
    alert('Impossible de télécharger le ZIP.');
  });
});