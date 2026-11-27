const STORAGE_KEY = 'pageturn_library';

export function getSavedBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setSavedBooks(books) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    dispatchBookshelfUpdate();
    return true;
  } catch {
    return false;
  }
}

export function isBookSaved(bookId) {
  if (!bookId) return false;
  const books = getSavedBooks();
  return books.some((b) => b.id === bookId);
}

export function getSavedBookById(bookId) {
  if (!bookId) return null;
  const books = getSavedBooks();
  return books.find((b) => b.id === bookId) || null;
}

export function saveBook(book, shelf = 'want') {
  if (!book || !book.id) return false;
  const books = getSavedBooks();
  const existingIndex = books.findIndex((b) => b.id === book.id);

  const entry = {
    ...book,
    shelf: shelf || 'want',
    savedAt: new Date().toISOString(),
    currentPage: book.currentPage || 0,
    totalPages: Number(book.totalPages) || Number(book.pages) || 250,
    notes: Array.isArray(book.notes) ? book.notes : [],
  };

  if (existingIndex >= 0) {
    books[existingIndex] = {
      ...books[existingIndex],
      ...entry,
      notes: books[existingIndex].notes || entry.notes,
    };
  } else {
    books.unshift(entry);
  }

  setSavedBooks(books);
  return true;
}

export function removeBook(bookId) {
  if (!bookId) return false;
  const books = getSavedBooks().filter((b) => b.id !== bookId);
  setSavedBooks(books);
  return true;
}

export function updateBookShelf(bookId, newShelf) {
  if (!bookId || !newShelf) return false;
  const books = getSavedBooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) return false;

  book.shelf = newShelf;
  book.updatedAt = new Date().toISOString();
  setSavedBooks(books);
  return true;
}

export function updateBookProgress(bookId, currentPage) {
  if (!bookId) return false;
  const books = getSavedBooks();
  const book = books.find((b) => b.id === bookId);
  if (!book) return false;

  const current = Math.max(0, Number.parseInt(currentPage, 10) || 0);
  book.currentPage = current;
  if (book.totalPages && current >= book.totalPages) {
    book.shelf = 'completed';
  } else if (current > 0 && book.shelf === 'want') {
    book.shelf = 'reading';
  }
  book.updatedAt = new Date().toISOString();
  setSavedBooks(books);
  return true;
}

export function getBookshelfCount() {
  return getSavedBooks().length;
}

export function getBookshelfStats() {
  const books = getSavedBooks();
  const total = books.length;
  const reading = books.filter((b) => b.shelf === 'reading').length;
  const completed = books.filter((b) => b.shelf === 'completed').length;
  const want = books.filter((b) => b.shelf === 'want').length;
  const totalPagesRead = books.reduce((sum, b) => sum + (Number(b.currentPage) || 0), 0);

  return { total, reading, completed, want, totalPagesRead };
}

function dispatchBookshelfUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pageturn:shelf-updated'));
    updateHeaderBadge();
  }
}

export function updateHeaderBadge() {
  if (typeof document === 'undefined') return;
  const badge = document.querySelector('#bookshelf-count-badge');
  if (!badge) return;

  const count = getBookshelfCount();
  badge.textContent = count;
  if (count > 0) {
    badge.classList.remove('hide');
  } else {
    badge.classList.add('hide');
  }
}
