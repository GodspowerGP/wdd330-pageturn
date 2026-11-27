import { getAuthorBio } from './AuthorService.mjs';
import {
  getBookshelfStats,
  getSavedBooks,
  removeBook,
  updateBookProgress,
  updateBookShelf,
  updateHeaderBadge,
} from './StorageService.mjs';

const bookshelfGrid = document.getElementById('bookshelf-grid');
const shelfTabs = document.querySelectorAll('.shelf-tab');
const statTotal = document.getElementById('stat-total');
const statReading = document.getElementById('stat-reading');
const statCompleted = document.getElementById('stat-completed');
const statPages = document.getElementById('stat-pages');

const modalOverlay = document.getElementById('author-modal');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close-btn');

let activeShelfFilter = 'all';

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

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateStats() {
  const stats = getBookshelfStats();
  if (statTotal) statTotal.textContent = stats.total;
  if (statReading) statReading.textContent = stats.reading;
  if (statCompleted) statCompleted.textContent = stats.completed;
  if (statPages) statPages.textContent = stats.totalPagesRead;
  updateHeaderBadge();
}

function renderBookshelf() {
  updateStats();
  const allBooks = getSavedBooks();

  const filtered =
    activeShelfFilter === 'all'
      ? allBooks
      : allBooks.filter((b) => b.shelf === activeShelfFilter);

  if (!bookshelfGrid) return;

  if (filtered.length === 0) {
    const message =
      activeShelfFilter === 'all'
        ? 'Your bookshelf is empty! Explore the <a href="./index.html" style="color:var(--primary-light); font-weight:600;">Search & Discover</a> page to add books.'
        : `No books currently in "${capitalize(activeShelfFilter)}".`;

    bookshelfGrid.innerHTML = `
      <div class="state-message">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p>${message}</p>
      </div>`;
    return;
  }

  bookshelfGrid.innerHTML = filtered
    .map((book) => {
      const currentPage = Number(book.currentPage) || 0;
      const totalPages = Number(book.totalPages) || 250;
      const percent = Math.min(100, Math.round((currentPage / totalPages) * 100));

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

          <!-- Reading Progress Tracker -->
          <div class="progress-group">
            <div class="progress-labels">
              <span>Progress: ${percent}%</span>
              <span>${currentPage} / ${totalPages} pages</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="page-input-row">
              <label for="page-input-${escapeHtml(book.id)}" style="font-size:0.75rem; color:var(--text-muted);">Current Page:</label>
              <input
                type="number"
                id="page-input-${escapeHtml(book.id)}"
                class="page-input"
                min="0"
                max="${totalPages}"
                value="${currentPage}"
                data-id="${escapeHtml(book.id)}"
                aria-label="Update current page for ${escapeHtml(book.title)}"
              />
              <button type="button" class="btn-secondary btn-update-progress" data-id="${escapeHtml(book.id)}">Update</button>
            </div>
          </div>

          <div class="card-actions">
            <div class="shelf-select-row">
              <select class="shelf-dropdown shelf-changer" data-id="${escapeHtml(book.id)}" aria-label="Change shelf">
                <option value="want" ${book.shelf === 'want' ? 'selected' : ''}>Want to Read</option>
                <option value="reading" ${book.shelf === 'reading' ? 'selected' : ''}>Currently Reading</option>
                <option value="completed" ${book.shelf === 'completed' ? 'selected' : ''}>Completed</option>
              </select>
              <button type="button" class="btn-secondary btn-remove-book" data-id="${escapeHtml(book.id)}" style="color:var(--danger);" title="Remove from shelf">
                ✕ Remove
              </button>
            </div>
            <button type="button" class="btn-view-author" data-author="${escapeHtml(book.primaryAuthor || book.author)}" data-title="${escapeHtml(book.title)}">
              Author Companion
            </button>
          </div>
        </div>
      </article>`;
    })
    .join('');
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
      <p>No detailed encyclopedic summary found on Wikipedia for this author name.</p>`;
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
      ${bio.wikiUrl ? `<p><a href="${escapeHtml(bio.wikiUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent); font-weight:600;">Read full Wikipedia article &rarr;</a></p>` : ''}
    </div>`;
}

// Event Listeners
function initTrackerListeners() {
  shelfTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      shelfTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeShelfFilter = tab.dataset.shelf;
      renderBookshelf();
    });
  });

  if (bookshelfGrid) {
    bookshelfGrid.addEventListener('click', (e) => {
      // Progress update button
      const progressBtn = e.target.closest('.btn-update-progress');
      if (progressBtn) {
        const bookId = progressBtn.dataset.id;
        const input = document.getElementById(`page-input-${bookId}`);
        if (input) {
          const val = input.value;
          updateBookProgress(bookId, val);
          renderBookshelf();
          showToast('Updated reading progress!');
        }
      }

      // Remove book button
      const removeBtn = e.target.closest('.btn-remove-book');
      if (removeBtn) {
        const bookId = removeBtn.dataset.id;
        removeBook(bookId);
        renderBookshelf();
        showToast('Removed book from your bookshelf.');
      }

      // Author modal trigger
      const authorBtn = e.target.closest('.btn-view-author');
      if (authorBtn) {
        const author = authorBtn.dataset.author;
        const title = authorBtn.dataset.title;
        showAuthorModal(author, title);
      }
    });

    bookshelfGrid.addEventListener('change', (e) => {
      // Shelf changer dropdown
      const changer = e.target.closest('.shelf-changer');
      if (changer) {
        const bookId = changer.dataset.id;
        const newShelf = changer.value;
        updateBookShelf(bookId, newShelf);
        renderBookshelf();
        showToast(`Moved book to "${newShelf === 'reading' ? 'Currently Reading' : newShelf === 'completed' ? 'Completed' : 'Want to Read'}"`);
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

  window.addEventListener('pageturn:shelf-updated', () => {
    updateStats();
  });
}

// Initial Boot
updateStats();
initTrackerListeners();
renderBookshelf();
