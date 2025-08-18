const express = require('express');
const verifyApiKey = require('./src/verifyKeys');
const db = require('./src/database');

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to the API Key Protected Service');
});

app.get('/verify-key', verifyApiKey, (req, res) => {
  res.status(200).json({
    data: 'This is protected data',
    client: req.client 
  });
});

app.post('/add-key', async (req, res) => {
  const { clientId, apiKey } = req.body;

  if (!clientId || !apiKey) {
    return res.status(400).json({ message: 'clientId and apiKey are required' });
  }

  await db.read();
  const clients = db.data.clients || [];
  const client = clients.find(c => c.id === clientId);

  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }

  const keyExists = client.apiKeys.some(k => k.key === apiKey);
  if (keyExists) {
    return res.status(409).json({ message: 'API key already exists for this client' });
  }

  client.apiKeys.push({
    key: apiKey,
    status: 'active',
    createdAt: new Date().toISOString()
  });

  await db.write();

  res.status(201).json({ message: 'API key added to client' });
});

app.get('/keys', async (req, res) => {
  await db.read();
  const clients = db.data.clients || [];

  const result = clients.map(client => ({
    clientId: client.id,
    name: client.name,
    email: client.email,
    apiKeys: client.apiKeys
  }));

  res.json({ clients: result });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
