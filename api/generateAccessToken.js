import { set } from '@vercel/edge-config';

export default async function handler(req, res) {
  const authRes = await fetch('https://api.beehivehcm.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ // as request body for oauth is needed in form encoded
      grant_type: 'password',
      username: process.env.BEEHIVE_USERNAME,
      password: process.env.BEEHIVE_PASSWORD
    })
  });

  const data = await authRes.json();

  if (authRes.ok) {
    await set('access_token', data.access_token);
    //await set('token_expiry', Date.now() + 3600 * 1000);
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ error: 'Token fetch failed', details: data });
  }
}
