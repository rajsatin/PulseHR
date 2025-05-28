import { set } from '@vercel/edge-config';

export const config = {
  runtime: 'edge', // Enables Edge Runtime
};

export default async function handler(req) {
  try {
    console.log("🔐 Step 1: Requesting Beehive token");

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
      return new Response(JSON.stringify({
        error: 'Beehive token fetch failed',
        details: data
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log("✅ Step 2: Saving token using Edge Config SDK");
    await set('access_token', data.access_token);

    return new Response(JSON.stringify({
      success: true,
      tokenStored: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("🔥 Unhandled error:", err);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
