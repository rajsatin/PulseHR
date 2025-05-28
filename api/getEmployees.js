import { get } from '@vercel/edge-config';

export default async function handler(req, res) {
  const token = await get('access_token');

 const fromDate = encodeURIComponent('05-May-2025 10:00:00 AM');
  const url = `https://api.beehivehcm.com/api/employee/allnew?from=${fromDate}`;

  const empRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await empRes.json();
  res.status(empRes.status).json(data);
}
