export default async function handler(req) {
  const url = new URL(req.url, 'https://qbo-legal-blue.vercel.app');
  const code = url.searchParams.get('code');
  const realmId = url.searchParams.get('realmId');

  if (!code) {
    return new Response(errorPage('Erro na autorizacao. Tente novamente.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  try {
    const CLIENT_ID = process.env.INTUIT_CLIENT_ID;
    const CLIENT_SECRET = process.env.INTUIT_CLIENT_SECRET;
    const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

    const tokenRes = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: 'https://qbo-legal-blue.vercel.app/api/callback',
      }),
    });

    const tokens = await tokenRes.json();

    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      return new Response(errorPage('Erro ao conectar. Tente novamente.'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    console.log('=== NEW CONNECTION ===');
    console.log('realmId:', realmId);
    console.log('accessToken:', tokens.access_token);
    console.log('refreshToken:', tokens.refresh_token);
    console.log('expires_in:', tokens.expires_in);
    console.log('=== END CONNECTION ===');

    return new Response(successPage(realmId), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Callback error:', err);
    return new Response(errorPage('Erro interno. Tente novamente.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function successPage(realmId) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conectado!</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #2CA01C 0%, #1a7a12 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .check {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: #2CA01C;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pop 0.4s ease;
    }
    @keyframes pop {
      0% { transform: scale(0); }
      70% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    .check svg { width: 40px; height: 40px; fill: white; }
    h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 12px; font-weight: 600; }
    p { color: #666; font-size: 15px; line-height: 1.6; }
    .id { margin-top: 20px; padding: 12px; background: #f0f9f0; border-radius: 8px; font-size: 13px; color: #2CA01C; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">
      <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    </div>
    <h1>Conectado com sucesso!</h1>
    <p>Seu QuickBooks foi conectado. Voce ja pode fechar esta pagina.</p>
    <div class="id">Empresa #${realmId}</div>
  </div>
</body>
</html>`;
}

function errorPage(message) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    h1 { font-size: 22px; color: #e74c3c; margin-bottom: 12px; }
    p { color: #666; font-size: 15px; }
    a { display: inline-block; margin-top: 24px; color: #0077C5; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Ops!</h1>
    <p>${message}</p>
    <a href="/">Tentar novamente</a>
  </div>
</body>
</html>`;
}

export const config = { runtime: 'edge' };
