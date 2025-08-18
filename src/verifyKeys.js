const db = require('./database');

async function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']?.trim();

  if (!apiKey) {
    return res.status(401).json({ message: 'API key is missing' });
  }

  await db.read();
  const clients = db.data.clients || [];

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(); // 18 hours later

  const client = clients.find(c =>
    c.apiKeys.some(k => k.key === apiKey && k.status === 'active')
  );

  if (!client) {
    return res.status(403).json({ message: 'Invalid or inactive API key' });
  }

  if (!client.loginInfo) {
    client.loginInfo = {};
  }
  client.loginInfo.lastLogin = now.toISOString();

  const keyToUpdate = client.apiKeys.find(k => k.key === apiKey);
  if (keyToUpdate) {
    keyToUpdate.expiresAt = expiresAt;
  }

  await db.write();

  req.client = {
    id: client.id,
    name: client.name,
    email: client.email,
    selectedService: client.selectedService,
    expiresAt: expiresAt,
    loginAt: now
  };

  next();
}

module.exports = verifyApiKey;
