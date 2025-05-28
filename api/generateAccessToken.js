import { set } from '@vercel/edge-config';

export default async function handler(req, res) {
  try {
    console.log("🔐 Requesting Beehive token...");

    const response = await fetch('https://api.beehivehcm.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'password',
        username: process.env.BEEHIVE_USERNAME,
        password: process.env.BEEHIVE_PASSWORD
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to fetch token", data);
      return res.status(500).json({
        error: 'Beehive token fetch failed',
        details: data
      });
    }

    console.log("✅ Saving token using Edge Config SDK...");
    await set('access_token', data.access_token);

    return res.status(200).json({
      success: true,
      tokenStored: true
    });
  } catch (err) {
    console.error("🔥 Unhandled error:", err);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err.message
    });
  }
}
