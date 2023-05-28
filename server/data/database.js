const express = require('express');
const app = express();
app.use(express.json());
const nfts = {
  "1": {
    "id": "1",
    "name": "Rainbow Cat #1/9999",
    "description": "This is a rare Rainbow Cat.",
    "price": 500,
    "exchange_rate": 21,
    "contract_address": "0x1234...",
    "type": "Rainbow Cat",
    "wallet_address": "0x5678...",
    "for_sale": true
  },
  "2": {
    "id": "2",
    "name": "Robot Dog #1/9999",
    "description": "This is a cute Robot Dog.",
    "price": 1000,
    "exchange_rate": 0,
    "contract_address": "0x4321...",
    "type": "Robot Dog",
    "wallet_address": "0x8765...",
    "for_sale": true
  }
};
app.get('/nfts', (req, res) => {
  res.json(nfts);
});
app.get('/nfts/:id', (req, res) => {
  const id = req.params.id;
  if (nfts[id]) {
    res.json(nfts[id]);
  } else {
    res.status(404).send('NFT not found');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
