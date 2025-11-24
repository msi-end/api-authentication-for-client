const db = require('./database'); // nedb-promises instance

async function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']?.trim();

  if (!apiKey) {
    return res.status(401).json({ message: 'API key is missing' });
  }

  // Find client with matching active key
  const client = await db.findOne({
    apiKeys: {
      $elemMatch: { key: apiKey, status: 'active' }
    }
  });

  if (!client) {
    return res.status(403).json({ message: 'Invalid or inactive API key' });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString(); // +18 hours

  // Update loginInfo and expiresAt
  const updatedApiKeys = client.apiKeys.map(k =>
    k.key === apiKey ? { ...k, expiresAt } : k
  );

  const loginInfo = {
    ...client.loginInfo,
    lastLogin: now.toISOString()
  };

  // Update record inside NeDB
  await db.update(
    { _id: client._id },
    {
      $set: {
        apiKeys: updatedApiKeys,
        loginInfo: loginInfo
      }
    }
  );

  // Attach client info to request for next middleware
  req.client = {
    id: client.id,
    name: client.name,
    email: client.email,
    selectedService: client.selectedService,
    expiresAt,
    loginAt: now
  };

  next();
}

module.exports = verifyApiKey;
