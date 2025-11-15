const express = require('express');
const path = require('path');
const app = express();

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
let stripe = null;
if (stripeSecret) {
  stripe = require('stripe')(stripeSecret);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe n'est pas encore configuré." });
    }
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Montant invalide' });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'Course FRANTZDY VTC PRESTIGE' },
          unit_amount: amount
        },
        quantity: 1
      }],
      success_url: req.protocol + '://' + req.get('host') + '/success.html',
      cancel_url: req.protocol + '://' + req.get('host') + '/cancel.html'
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
