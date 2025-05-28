import { supabase } from '../utils/supabase';

export default async function handler(req, res) {
  // Step 1: Get token and expiry from Supabase
  const { data, error } = await supabase
    .from('tokens')
    .select('access_token, expiry')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to fetch access token from Supabase', details: error });
  }

  const { access_token, expiry } = data;

  // Step 2: Check expiry
  const now = Date.now();
  if (now > Number(expiry)) {
    return res.status(401).json({ error: 'Access token expired, please refresh.' });
  }

  // Step 3: Make API call to Beehive
  const fromDate = encodeURIComponent('05-May-2025 10:00:00 AM');
  const url = `https://api.beehivehcm.com/api/employee/allnew?from=${fromDate}`;

  const empRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });

  const dataRes = await empRes.json();
  return res.status(empRes.status).json(dataRes);
}
