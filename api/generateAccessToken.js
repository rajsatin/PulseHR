import { supabase } from '../utils/supabase';

export default async function handler(req, res) {
    const tokenRes = await fetch('https://api.beehive.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'password',
            username: process.env.BEEHIVE_USERNAME,
            password: process.env.BEEHIVE_PASSWORD
        })
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
        return res.status(500).json({ error: 'Failed to fetch token', details: data });
    }

    const accessToken = data.access_token;
    const expiry = Date.now() + 19 * 60 * 1000;

    const { error } = await supabase
        .from('tokens')
        .upsert([{ id: 1, access_token: accessToken, expiry }], { onConflict: 'id' });

    if (error) {
        return res.status(500).json({ error: 'Failed to save token in Supabase', details: error });
    }

    res.status(200).json({ success: true, access_token: accessToken });
}
