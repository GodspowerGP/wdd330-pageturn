import { getAuthorBio } from './AuthorService.mjs';
import { getBooksBySubject, searchBooks } from './BookService.mjs';
import {
  isBookSaved,
  saveBook,
  updateHeaderBadge,
} from './StorageService.mjs';

const searchForm = document.getElementById('book-search-form');
const searchInput = document.getElementById('search-input');
const resultsGrid = document.getElementById('book-results-grid');
const resultsHeading = document.getElementById('results-heading');
const resultsCount = document.getElementById('results-count');
const genreChips = document.querySelectorAll('.genre-chip');
const modalOverlay = document.getElementById('author-modal');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close-btn');

let currentBooks = [];

export function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

function renderBookCards(books) {
  currentBooks = books;
  if (!resultsGrid) return;

  if (!books || books.length === 0) {
    resultsGrid.innerHTML = `
      <div class="state-message">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <p>No books found. Try a different title, author, or genre.</p>
      </div>`;
    if (resultsCount) resultsCount.textContent = '0 books';
    return;
  }

  if (resultsCount) resultsCount.textContent = `${books.length} books found`;

  resultsGrid.innerHTML = books
    .map((book) => {
      const saved = isBookSaved(book.id);
      const subjectTags = (book.subjects || [])
        .slice(0, 3)
        .map((s) => `<span class="subject-tag">${escapeHtml(s)}</span>`)
        .join('');

      return `
      <article class="book-card" data-id="${escapeHtml(book.id)}">
        <div class="book-cover-wrap">
          <img
            src="${escapeHtml(book.coverUrl)}"
            alt="${escapeHtml(book.title)} cover"
            class="book-cover-img"
            loading="lazy"
          />
        </div>
        <div class="book-info">
          <h4 class="book-title" title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h4>
          <p class="book-author">by ${escapeHtml(book.author)}</p>
          <div class="book-meta">
            <span class="meta-pill">${escapeHtml(book.year)}</span>
            <span>~${book.pages} pages</span>
          </div>
          <div class="book-subjects">
            ${subjectTags}
          </div>
          <div class="card-actions">
            <div class="shelf-select-row">
              <select class="shelf-dropdown" aria-label="Choose shelf for ${escapeHtml(book.title)}">
                <option value="want">Want to Read</option>
                <option value="reading">Currently Reading</option>
                <option value="completed">Completed</option>
              </select>
              <button type="button" class="btn-save-shelf" data-id="${escapeHtml(book.id)}">
                ${saved ? '✓ Saved' : '+ Add'}
              </button>
            </div>
            <button type="button" class="btn-view-author" data-author="${escapeHtml(book.primaryAuthor)}" data-title="${escapeHtml(book.title)}">
              Author Companion
            </button>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function handleSearch(query) {
  if (!query) return;

  resultsGrid.innerHTML = `
    <div class="state-message">
      <div class="spinner"></div>
      <p>Searching Open Library catalog for "${escapeHtml(query)}"...</p>
    </div>`;

  if (resultsHeading) resultsHeading.textContent = `Search results for "${query}"`;

  try {
    const books = await searchBooks(query, 24);
    renderBookCards(books);
  } catch (err) {
    resultsGrid.innerHTML = `
      <div class="state-message">
        <p>Could not connect to Open Library API. Please check your internet connection and try again.</p>
      </div>`;
    if (resultsCount) resultsCount.textContent = 'Error loading';
  }
}

async function loadCategory(genre) {
  genreChips.forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.genre === genre);
  });

  resultsGrid.innerHTML = `
    <div class="state-message">
      <div class="spinner"></div>
      <p>Loading ${genre === 'all' ? 'featured' : genre} books from Open Library...</p>
    </div>`;

  if (resultsHeading) {
    resultsHeading.textContent = genre === 'all' ? 'Featured Books' : `${capitalize(genre)} Books`;
  }

  try {
    const subject = genre === 'all' ? 'popular' : genre;
    const books = await getBooksBySubject(subject, 24);
    renderBookCards(books);
  } catch (err) {
    resultsGrid.innerHTML = `
      <div class="state-message">
        <p>Could not load books for this genre. Please try again shortly.</p>
      </div>`;
  }
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

async function showAuthorModal(authorName, bookTitle) {
  if (!modalOverlay || !modalContent) return;

  modalContent.innerHTML = `
    <div style="text-align:center; padding: 2rem 0;">
      <div class="spinner"></div>
      <p>Fetching author bio from Wikipedia API for <strong>${escapeHtml(authorName)}</strong>...</p>
    </div>`;
  modalOverlay.classList.remove('hide');

  const bio = await getAuthorBio(authorName);

  if (!bio) {
    modalContent.innerHTML = `
      <h3 style="font-size:1.3rem; margin-bottom:0.5rem; color:var(--primary);">${escapeHtml(authorName)}</h3>
      <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1rem;">Author of <em>${escapeHtml(bookTitle)}</em></p>
      <p>No detailed encyclopedic summary found on Wikipedia for this author name. You can still save this book to your bookshelf!</p>`;
    return;
  }

  modalContent.innerHTML = `
    <div class="modal-header">
      ${bio.photoUrl ? `<img src="${escapeHtml(bio.photoUrl)}" alt="${escapeHtml(bio.name)}" class="author-avatar" />` : ''}
      <div>
        <h3 id="modal-title" style="font-size:1.35rem; color:var(--primary); margin-bottom:0.25rem;">${escapeHtml(bio.name)}</h3>
        <p style="color:var(--primary-light); font-weight:600; font-size:0.85rem;">${escapeHtml(bio.description)}</p>
      </div>
    </div>
    <div class="modal-body">
      <p>${escapeHtml(bio.extract)}</p>
      ${bio.wikiUrl ? `<p><a href="${escapeHtml(bio.wikiUrl)}" target="_blank" rel="noopener noreferrer" class="wiki-link">Read full Wikipedia article</a></p>` : ''}
    </div>`;
}

// Event Listeners
function initListeners() {
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q) handleSearch(q);
    });
  }

  genreChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const genre = chip.dataset.genre;
      loadCategory(genre);
    });
  });

  if (resultsGrid) {
    resultsGrid.addEventListener('click', (e) => {
      const saveBtn = e.target.closest('.btn-save-shelf');
      if (saveBtn) {
        const bookId = saveBtn.dataset.id;
        const book = currentBooks.find((b) => b.id === bookId);
        if (book) {
          const row = saveBtn.closest('.shelf-select-row');
          const dropdown = row ? row.querySelector('.shelf-dropdown') : null;
          const shelf = dropdown ? dropdown.value : 'want';

          saveBook(book, shelf);
          saveBtn.textContent = '✓ Saved';
          showToast(`Saved "${book.title}" to "${shelf === 'reading' ? 'Currently Reading' : shelf === 'completed' ? 'Completed' : 'Want to Read'}"`);
        }
      }

      const authorBtn = e.target.closest('.btn-view-author');
      if (authorBtn) {
        const author = authorBtn.dataset.author;
        const title = authorBtn.dataset.title;
        showAuthorModal(author, title);
      }
    });
  }

  if (modalCloseBtn && modalOverlay) {
    modalCloseBtn.addEventListener('click', () => modalOverlay.classList.add('hide'));
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.add('hide');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modalOverlay.classList.contains('hide')) {
        modalOverlay.classList.add('hide');
      }
    });
  }
}

// Initial Boot
updateHeaderBadge();
initListeners();
loadCategory('all');
