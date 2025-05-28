export default async function handler(req, res) {
  try {
    // Step 1: Call Beehive OAuth to get access token
    const authRes = await fetch('https://beehive.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ // as the oauth body is needed in form-encoded data
        grant_type: 'password',
        username: process.env.BEEHIVE_USERNAME,
        password: process.env.BEEHIVE_PASSWORD
      })
    });

    const data = await authRes.json();

    if (!authRes.ok) {
      return res.status(500).json({
        error: 'Failed to generate access token from Beehive',
        details: data
      });
    }

    // Step 2: Save token + expiry to Edge Config via REST API - 
    // saving access token to edge config items
    const saveRes = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.EDGE_CONFIG_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'access_token',
              value: data.access_token
            },
            // {
            //   operation: 'upsert',
            //   key: 'token_expiry',
            //   value: Date.now() + 20 * 60 * 1000 // 20 min validity
            // }
          ]
        })
      }
    );

    const saveResult = await saveRes.json();

    if (!saveRes.ok) {
      return res.status(500).json({
        error: 'Failed to store token in Edge Config',
        details: saveResult
      });
    }

    return res.status(200).json({ success: true, tokenStored: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
