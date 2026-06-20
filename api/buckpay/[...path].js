export default async function handler(req, res) {
  const path = req.url.replace(/^\/api\/buckpay/, '')
  const url  = `https://api.realtechdev.com.br/v1${path}`

  const headers = {
    'Authorization': `Bearer ${process.env.VITE_BUCKPAY_TOKEN}`,
    'User-Agent':    process.env.VITE_BUCKPAY_USER_AGENT,
    'Content-Type':  'application/json',
  }

  const upstream = await fetch(url, {
    method:  req.method,
    headers,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  })

  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
