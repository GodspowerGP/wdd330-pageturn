const OPEN_LIBRARY_SEARCH_URL = 'https://openlibrary.org/search.json';
const OPEN_LIBRARY_SUBJECT_URL = 'https://openlibrary.org/subjects';

export function getBookCoverUrl(coverId, size = 'M') {
  if (coverId && Number(coverId) > 0) {
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
  }
  // Clean fallback SVG data URI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="260" viewBox="0 0 180 260" fill="none">
    <rect width="180" height="260" rx="6" fill="#2d6a4f"/>
    <path d="M40 70h100v120H40z" fill="#1b4332" opacity="0.4"/>
    <path d="M50 90h80M50 110h80M50 130h60M50 150h50" stroke="#d8f3dc" stroke-width="3" stroke-linecap="round"/>
    <text x="90" y="210" text-anchor="middle" fill="#d8f3dc" font-family="sans-serif" font-size="12" font-weight="600">PageTurn</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function normalizeBookData(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const id = raw.key ? raw.key.replace('/works/', '') : String(raw.cover_i || Math.random());
  const title = raw.title || 'Untitled Book';
  const authors = Array.isArray(raw.author_name)
    ? raw.author_name
    : Array.isArray(raw.authors)
      ? raw.authors.map((a) => (typeof a === 'string' ? a : a.name))
      : raw.author
        ? [raw.author]
        : ['Unknown Author'];
  const author = authors.join(', ');
  const primaryAuthor = authors[0] || 'Unknown Author';
  const year = raw.first_publish_year || raw.publish_year?.[0] || 'Unknown';
  const pages = Number(raw.number_of_pages_median) || Number(raw.number_of_pages) || 250;
  const coverId = raw.cover_i || raw.cover_id || null;
  const coverUrl = getBookCoverUrl(coverId);
  const subjects = Array.isArray(raw.subject)
    ? raw.subject.slice(0, 4)
    : Array.isArray(raw.subjects)
      ? raw.subjects.slice(0, 4).map((s) => (typeof s === 'string' ? s : s.name))
      : [];
  const isbn = Array.isArray(raw.isbn) ? raw.isbn[0] : null;

  return {
    id,
    title,
    author,
    primaryAuthor,
    year,
    pages,
    coverId,
    coverUrl,
    subjects,
    isbn,
  };
}

export async function searchBooks(query, limit = 20) {
  const trimmed = String(query || '').trim();
  if (!trimmed) return [];

  const url = `${OPEN_LIBRARY_SEARCH_URL}?q=${encodeURIComponent(trimmed)}&limit=${limit}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Open Library API responded with status ${response.status}`);
    }

    const data = await response.json();
    const docs = Array.isArray(data.docs) ? data.docs : [];
    return docs.map(normalizeBookData).filter(Boolean);
  } catch (error) {
    console.error('Error fetching books from Open Library:', error);
    throw error;
  }
}

export async function getBooksBySubject(subject, limit = 20) {
  const cleanSubject = String(subject || 'fiction').trim().toLowerCase().replace(/\s+/g, '_');
  const url = `${OPEN_LIBRARY_SUBJECT_URL}/${encodeURIComponent(cleanSubject)}.json?limit=${limit}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Open Library Subjects API error: ${response.status}`);
    }

    const data = await response.json();
    const works = Array.isArray(data.works) ? data.works : [];
    return works.map(normalizeBookData).filter(Boolean);
  } catch (error) {
    console.error('Error fetching books by subject:', error);
    throw error;
  }
}
