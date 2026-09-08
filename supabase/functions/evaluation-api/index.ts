const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json'
};

const encoder = new TextEncoder();

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return atob(padded);
}

async function signToken(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function createTeacherToken(username: string, secret: string) {
  const payload = base64UrlEncode(JSON.stringify({
    username,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000
  }));
  return `${payload}.${await signToken(payload, secret)}`;
}

async function isValidTeacherToken(request: Request, secret: string) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSignature = await signToken(payload, secret);
  if (signature.length !== expectedSignature.length) return false;
  const signatureBytes = encoder.encode(signature);
  const expectedBytes = encoder.encode(expectedSignature);
  let difference = 0;
  for (let index = 0; index < signatureBytes.length; index++) difference |= signatureBytes[index] ^ expectedBytes[index];
  if (difference !== 0) return false;

  try {
    const tokenData = JSON.parse(base64UrlDecode(payload));
    return tokenData.expiresAt > Date.now() && Boolean(tokenData.username);
  } catch {
    return false;
  }
}

async function supabaseRequest(path: string, options: RequestInit = {}) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('DB_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase environment belum dikonfigurasi.');

  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method tidak diizinkan.' }, 405);

  try {
    const body = await request.json();
    const action = body.action;
    const edgeAuthSecret = Deno.env.get('EDGE_AUTH_SECRET');
    if (!edgeAuthSecret) return jsonResponse({ error: 'EDGE_AUTH_SECRET belum dikonfigurasi.' }, 500);

    if (action === 'login') {
      const username = String(body.username || '').trim();
      const passwordHash = String(body.passwordHash || '');
      const response = await supabaseRequest(`teacher_accounts?select=username&username=eq.${encodeURIComponent(username)}&password_hash=eq.${encodeURIComponent(passwordHash)}&limit=1`);
      if (!response.ok || (await response.json()).length !== 1) return jsonResponse({ error: 'Username atau password salah.' }, 401);
      return jsonResponse({ token: await createTeacherToken(username, edgeAuthSecret) });
    }

    if (action === 'submit') {
      const name = String(body.name || '').trim();
      const studentClass = String(body.studentClass || '');
      const score = Number(body.score);
      if (!name || name.length > 120 || !['7A', '7B', '7C', '7D', '7E', '7F'].includes(studentClass) || !Number.isInteger(score) || score < 0 || score > 100) {
        return jsonResponse({ error: 'Data evaluasi tidak valid.' }, 400);
      }
      const response = await supabaseRequest('evaluation_results', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ name, student_class: studentClass, score, completed_at: new Date().toISOString() })
      });
      if (!response.ok) return jsonResponse({ error: 'Nilai gagal disimpan.' }, 502);
      return jsonResponse({ saved: true });
    }

    if (!(await isValidTeacherToken(request, edgeAuthSecret))) return jsonResponse({ error: 'Akses guru diperlukan.' }, 401);

    if (action === 'list') {
      const response = await supabaseRequest('evaluation_results?select=id,name,student_class,score,completed_at&order=completed_at.desc');
      if (!response.ok) return jsonResponse({ error: 'Rekap gagal dimuat.' }, 502);
      return jsonResponse(await response.json());
    }

    if (action === 'delete') {
      const response = await supabaseRequest('evaluation_results?id=not.is.null', { method: 'DELETE' });
      if (!response.ok) return jsonResponse({ error: 'Rekap gagal dihapus.' }, 502);
      return jsonResponse({ deleted: true });
    }

    return jsonResponse({ error: 'Operasi tidak dikenal.' }, 400);
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: 'Terjadi kesalahan pada server.' }, 500);
  }
});
