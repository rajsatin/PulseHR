import { supabase } from '../utils/supabase.js';

export default async function handler(req, res) {
  try {
    // Step 1: Get token and expiry from Supabase
    const { data, error } = await supabase
      .from('pulsehr_access_token')
      .select('access_token, expiry')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.error('❌ Failed to fetch access token from Supabase:', error);
      return res.status(500).json({
        error: 'Failed to fetch access token from Supabase',
        details: error
      });
    }

    const { access_token, expiry } = data;

    // Step 2: Check expiry
    const now = Date.now();
    if (now > Number(expiry)) {
      console.warn('⚠️ Access token expired:', { expiry, now });
      return res.status(401).json({ error: 'Access token expired, please refresh.' });
    }

    // Step 3: Call Beehive employee API
    const fromDate = encodeURIComponent('01-May-2025 10:00:00 AM');
    const url = `https://api.beehivehcm.com/api/employee/allnew?from=${fromDate}`;

    let empRes;
    try {
      empRes = await fetch(url, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (fetchError) {
      console.error('❌ Error while calling Beehive API:', fetchError);
      return res.status(502).json({
        error: 'Failed to reach Beehive API',
        details: fetchError.message || fetchError.toString()
      });
    }

    let dataRes;
    try {
      dataRes = await empRes.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse Beehive API response:', jsonError);
      return res.status(502).json({ error: 'Invalid response format from Beehive API' });
    }

    if (!empRes.ok) {
      console.warn('⚠️ Beehive API returned error:', {
        status: empRes.status,
        body: dataRes
      });
      return res.status(empRes.status).json({
        error: 'Beehive API returned an error',
        details: dataRes
      });
    }

    // Added for Prod Data - handling Pagination

    // ✅ Add pagination logic here
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '5');
    const offset = (page - 1) * limit;

    const paginatedData = dataRes.slice(offset, offset + limit);

    return res.status(200).json({
      page,
      limit,
      total: dataRes.length,
      hasMore: offset + limit < dataRes.length,
      data: paginatedData
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      details: err.message || err.toString()
    });
  }
}
