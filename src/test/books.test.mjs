import test from 'node:test';
import assert from 'node:assert/strict';
import { getBookCoverUrl, normalizeBookData } from '../js/BookService.mjs';

test('getBookCoverUrl returns standard Open Library URL when ID exists', () => {
  const url = getBookCoverUrl(8235114, 'M');
  assert.equal(url, 'https://covers.openlibrary.org/b/id/8235114-M.jpg');
});

test('getBookCoverUrl returns SVG fallback URI when ID is missing or 0', () => {
  const url = getBookCoverUrl(null);
  assert.ok(url.startsWith('data:image/svg+xml'));
});

test('normalizeBookData handles search.json doc objects correctly', () => {
  const sampleDoc = {
    key: '/works/OL45883W',
    title: 'Fantastic Mr. Fox',
    author_name: ['Roald Dahl'],
    first_publish_year: 1970,
    number_of_pages_median: 96,
    cover_i: 8235114,
    subject: ['Children', 'Foxes', 'Humorous stories'],
    isbn: ['9780141301068'],
  };

  const normalized = normalizeBookData(sampleDoc);
  assert.equal(normalized.id, 'OL45883W');
  assert.equal(normalized.title, 'Fantastic Mr. Fox');
  assert.equal(normalized.author, 'Roald Dahl');
  assert.equal(normalized.primaryAuthor, 'Roald Dahl');
  assert.equal(normalized.year, 1970);
  assert.equal(normalized.pages, 96);
  assert.equal(normalized.coverUrl, 'https://covers.openlibrary.org/b/id/8235114-M.jpg');
  assert.equal(normalized.subjects.length, 3);
});

test('normalizeBookData falls back gracefully when fields are absent', () => {
  const empty = normalizeBookData({});
  assert.equal(empty.title, 'Untitled Book');
  assert.equal(empty.author, 'Unknown Author');
  assert.equal(empty.year, 'Unknown');
  assert.equal(empty.pages, 250);
  assert.ok(empty.coverUrl.startsWith('data:image/svg+xml'));
});
