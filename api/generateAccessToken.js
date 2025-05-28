import { supabase } from '../utils/supabase.js';

export default async function handler(req, res) {
  try {
    // Step 1: Request new access token from Beehive
    const tokenRes = await fetch('https://api.beehivehcm.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        username: process.env.BEEHIVE_USERNAME,
        password: process.env.BEEHIVE_PASSWORD
      })
    });

    let data;
    try {
      data = await tokenRes.json();
    } catch (jsonError) {
      console.error('⚠️ Failed to parse Beehive response JSON:', jsonError);
      return res.status(502).json({ error: 'Invalid JSON response from Beehive' });
    }

    if (!tokenRes.ok || !data.access_token) {
      console.error('❌ Beehive API responded with error:', {
        status: tokenRes.status,
        response: data
      });
      return res.status(tokenRes.status || 500).json({
        error: 'Beehive token request failed',
        details: data
      });
    }

    // Step 2: Save token to Supabase
    const accessToken = data.access_token;
    const expiry = Date.now() + 19 * 60 * 1000;

    const { error: supabaseError } = await supabase
      .from('pulsehr_access_token')
      .upsert([{ id: 1, access_token: accessToken, expiry }], { onConflict: 'id' });

    if (supabaseError) {
      console.error('❌ Supabase upsert failed:', supabaseError);
      return res.status(500).json({
        error: 'Failed to store access token in Supabase',
        details: supabaseError
      });
    }

    // ✅ Success
    console.log('✅ Access token successfully updated in Supabase');
    return res.status(200).json({
      success: true,
      access_token: accessToken
    });

  } catch (err) {
    // General catch-all error
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message || err.toString()
    });
  }
}
