import http from 'http';

async function post(path, body) {
  const res = await fetch(`http://localhost:4000${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch(e) { return text; }
}

async function get(path, token) {
  const res = await fetch(`http://localhost:4000${path}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch(e) { return text; }
}

(async () => {
  try {
    console.log('Attempting login...');
    const login = await post('/api/login', { email: 'admin@example.com', senha: 'senhaSegura' });
    console.log('Login result:', login);
    if (login && login.token) {
      console.log('Fetching /api/rdos with token...');
      const rdos = await get('/api/rdos', login.token);
      console.log('RDOs:', rdos);
    } else {
      console.error('No token in login result');
      process.exit(1);
    }
  } catch (err) {
    console.error('Error during auth test:', err);
    process.exit(1);
  }
})();