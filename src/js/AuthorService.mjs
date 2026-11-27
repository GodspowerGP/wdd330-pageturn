const WIKIPEDIA_REST_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

export async function getAuthorBio(authorName) {
  if (!authorName) return null;

  // Clean author name: remove trailing punctuation and dates
  const cleaned = authorName
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/,.*$/, '')
    .trim();

  if (!cleaned) return null;

  const url = `${WIKIPEDIA_REST_URL}/${encodeURIComponent(cleaned.replace(/\s+/g, '_'))}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.type === 'disambiguation') {
      return null;
    }

    return {
      name: data.title || cleaned,
      description: data.description || 'Author',
      extract: data.extract || 'No biographical overview available.',
      photoUrl: data.thumbnail?.source || null,
      wikiUrl: data.content_urls?.desktop?.page || null,
    };
  } catch (error) {
    console.warn(`Could not load Wikipedia bio for ${cleaned}:`, error);
    return null;
  }
}
