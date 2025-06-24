import { supabase } from '../utils/supabase.js';

export default async function handler(req, res) {
  try {
    const { employeeCode } = req.query;

    if (!employeeCode) {
      return res.status(400).json({ error: 'Missing required query param: employeeCode' });
    }

    // Step 1: Get token from Supabase
    const { data, error } = await supabase
      .from('pulsehr_access_token')
      .select('access_token, expiry')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.error('❌ Failed to fetch access token from Supabase:', error);
      return res.status(500).json({ error: 'Failed to fetch access token from Supabase' });
    }

    const { access_token, expiry } = data;

    // Step 2: Check token expiry
    const now = Date.now();
    if (now > Number(expiry)) {
      console.warn('⚠️ Access token expired:', { expiry, now });
      return res.status(401).json({ error: 'Access token expired, please refresh.' });
    }

    // Step 3: Call Beehive Get Employee By Code API
    const url = `https://api.beehivehcm.com/api/employee/getemployeebycode?employeecode=${encodeURIComponent(employeeCode)}`;

    let empRes;
    try {
      empRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (fetchError) {
      console.error('❌ Error calling Beehive API:', fetchError);
      return res.status(502).json({ error: 'Failed to reach Beehive API', details: fetchError.message });
    }

    let dataRes;
    try {
      dataRes = await empRes.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse Beehive API response:', jsonError);
      return res.status(502).json({ error: 'Invalid response format from Beehive API' });
    }

    if (!empRes.ok) {
      console.warn('⚠️ Beehive API returned error:', { status: empRes.status, body: dataRes });
      return res.status(empRes.status).json({ error: 'Beehive API returned an error', details: dataRes });
    }

    // Step 4: Return Employee Data
    return res.status(200).json({ data: dataRes });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
