export default async function handler(req, res) {
    try {
        console.log("🔐 Requesting token from Beehive");
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
            return res.status(500).json({
                error: 'Beehive token fetch failed',
                details: data
            });
        }

        console.log("✅ Saving token to Edge Config");

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
                        }
                    ]
                })
            }
        );

        const result = await saveRes.json();

        if (!saveRes.ok) {
            return res.status(500).json({
                error: 'Failed to store token in Edge Config',
                details: result
            });
        }

        return res.status(200).json({
            success: true,
            tokenStored: true
        });
    } catch (err) {
        console.error("🔥 Error:", err);
        return res.status(500).json({
            error: 'Internal Server Error',
            details: err.message
        });
    }
}