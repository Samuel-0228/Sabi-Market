export async function fetchWithRetries(input: RequestInfo, init?: RequestInit) {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timeout = init?.signal ? undefined : 15000; // 15s default
    const id = timeout ? setTimeout(() => controller.abort(), timeout) : undefined;

    try {
      const res = await fetch(input, { ...init, signal: controller.signal });
      if (id) clearTimeout(id);
      if ([502, 503, 504].includes(res.status) && attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 200 * attempt));
        continue;
      }
      return res;
    } catch (err: any) {
      if (id) clearTimeout(id);
      if (err?.name === 'AbortError') throw err;
      if (attempt >= maxAttempts) throw err;
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }

  throw new Error('Failed to fetch after retries');
}

export async function postJson(url: string, body: any) {
  const res = await fetchWithRetries(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed ${res.status} ${text}`);
  }

  return res.json();
}
