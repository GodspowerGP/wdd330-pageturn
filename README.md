# 📖 PageTurn — Reading Tracker & Author Companion

**Course:** WDD 330 – Web Frontend Development II  
**Author:** Ulonna Godspower  
**Live Site:** [https://godspowergp.github.io/wdd330-pageturn/](https://godspowergp.github.io/wdd330-pageturn/)  
**Trello Board:** [https://trello.com/b/mKDOf24W](https://trello.com/b/mKDOf24W)

---

## 📌 Project Overview
**PageTurn** is a clean, distraction-free reading tracker and author companion web application built with vanilla JavaScript, contemporary CSS, and live external REST APIs.

### 🌟 Key Features (Week 05 Deliverables):
1. **Open Library REST API Integration:** Dynamic search across millions of books by title, author, or keyword (`BookService.mjs`).
2. **Subject & Genre Quick Filters:** Quick category browsing (Fiction, Fantasy, Mystery, Science, History, Biography).
3. **Responsive Book Card Grid:** Displays cover art, title, author, publish year badge, estimated page count, and genre tags.
4. **Author Companion Modal (Wikipedia REST API):** Instant encyclopedic author summaries and portrait photos right on page without context switching.
5. **Client-Side Bookshelf Persistence (`StorageService.mjs`):** Persistent personal library in `localStorage` categorized by *Want to Read*, *Currently Reading*, and *Completed*.
6. **Live Reading Progress Bar:** Interactive page counter with percentage completion and animated visual progress bar.
7. **Reading Stats Dashboard:** Live overview of total books saved, currently active titles, completed books, and total pages logged.
8. **Toast Notifications & Accessible Badges:** Instant visual feedback and dynamic navigation badge counters.

---

## 🛠️ Technology Stack
* **HTML5:** Semantic, accessible markup meeting WCAG AA standards.
* **CSS3:** Custom responsive layout using Flexbox, CSS Grid, CSS custom properties (variables), and subtle transform animations.
* **JavaScript (ES6+):** Pure vanilla JavaScript with ES Modules (`.mjs`), `async/await`, Fetch API, and `localStorage`.
* **Bundler & Tooling:** Vite, ESLint, Node.js Test Runner (`node:test`).
* **Continuous Deployment:** Automated GitHub Pages deployment via GitHub Actions.

---

## 🚀 Getting Started Locally

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run automated unit tests
npm test

# Check code style with ESLint
npm run lint

# Build for production
npm run build
```
