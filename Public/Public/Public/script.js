const tariffs = { van: 2.08, berline: 1.80, eco: 1.56 };
const minimums = { van: 60, berline: 50, eco: 40 };
const tva = 0.10;
const waitingFee = 1;

function calculer() {
  const distance = parseFloat(document.getElementById('distance').value || 0);
  const waiting = parseFloat(document.getElementById('waiting').value || 0);
  const type = document.getElementById('vehicule').value;

  let prix_ht = distance * tariffs[type] + waiting * waitingFee;
  if (prix_ht < minimums[type]) prix_ht = minimums[type];

  const prix_ttc = prix_ht * (1 + tva);
  document.getElementById('prix').innerText = "Prix estimé TTC : " + prix_ttc.toFixed(2) + " €";
  return Math.round(prix_ttc * 100);
}

async function payer() {
  const amount = calculer();
  if (!amount || amount <= 0) {
    alert("Veuillez saisir une distance/attente valide.");
    return;
  }
  try {
    const res = await fetch('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    const data = await res.json();
    if (data.url) {
      window.location = data.url;
    } else {
      alert("Erreur paiement : " + (data.error || ''));
    }
  } catch (e) {
    alert("Erreur réseau");
  }
}
