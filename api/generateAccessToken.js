export default async function handler(req, res) {
  try {
    console.log("🔐 Step 1: Calling Beehive OAuth...");

    const response = await fetch('https://beehive.com/oauth/token', {
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
    console.log("✅ Step 2: Beehive responded with:", data);

    if (!response.ok) {
      console.error("❌ Beehive token request failed");
      return res.status(500).json({
        error: 'Token fetch failed',
        details: data
      });
    }

    console.log("📝 Step 3: Saving to Edge Config...");

    const edgeSaveRes = await fetch(`https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          { operation: 'upsert', key: 'access_token', value: data.access_token },
        //   { operation: 'upsert', key: 'token_expiry', value: Date.now() + 20 * 60 * 1000 }
        ]
      })
    });

    const edgeResult = await edgeSaveRes.json();
    console.log("✅ Step 4: Edge Config save result:", edgeResult);

    if (!edgeSaveRes.ok) {
      return res.status(500).json({
        error: 'Failed to store token in Edge Config',
        details: edgeResult
      });
    }

    return res.status(200).json({ success: true, tokenStored: true });
  } catch (err) {
    console.error("🔥 Unhandled error:", err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
