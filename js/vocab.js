/**
 * Vocabulary page: glossary list, unit filter, search, quiz.
 */

(function () {
  'use strict';

  let _allTerms = [];
  let _filteredTerms = [];
  let _selectedUnit = 'all';
  let _activeView = 'glossary';
  let _quizScore = { correct: 0, total: 0 };
  let _quizAnswered = false;

  document.addEventListener('DOMContentLoaded', async function () {
    const listEl = document.getElementById('vocab-list');
    if (!listEl) return;

    try {
      await window.DataLoader.loadVocabulary();
      _allTerms = window.DataLoader.getVocabulary().slice().sort(function (a, b) {
        return a.term.localeCompare(b.term, undefined, { sensitivity: 'base' });
      });

      setupViewTabs();
      setupUnitTabs();
      setupSearch();
      setupQuizNext();
      applyFilters();
      handleHashScroll();

      window.addEventListener('hashchange', handleHashScroll);
    } catch (err) {
      console.error('Vocabulary page error:', err);
      listEl.innerHTML = '<div class="list-error"><h2>Failed to load vocabulary</h2><p>' + escapeHtml(err.message) + '</p></div>';
    }
  });

  function setupViewTabs() {
    const glossaryBtn = document.getElementById('vocab-view-glossary');
    const quizBtn = document.getElementById('vocab-view-quiz');
    const glossaryPanel = document.getElementById('vocab-glossary-panel');
    const quizPanel = document.getElementById('vocab-quiz-panel');

    if (glossaryBtn) {
      glossaryBtn.addEventListener('click', function () {
        _activeView = 'glossary';
        glossaryBtn.classList.add('active');
        glossaryBtn.setAttribute('aria-selected', 'true');
        if (quizBtn) {
          quizBtn.classList.remove('active');
          quizBtn.setAttribute('aria-selected', 'false');
        }
        if (glossaryPanel) glossaryPanel.hidden = false;
        if (quizPanel) quizPanel.hidden = true;
      });
    }

    if (quizBtn) {
      quizBtn.addEventListener('click', function () {
        _activeView = 'quiz';
        quizBtn.classList.add('active');
        quizBtn.setAttribute('aria-selected', 'true');
        if (glossaryBtn) {
          glossaryBtn.classList.remove('active');
          glossaryBtn.setAttribute('aria-selected', 'false');
        }
        if (glossaryPanel) glossaryPanel.hidden = true;
        if (quizPanel) quizPanel.hidden = false;
        startQuizQuestion();
      });
    }
  }

  function setupUnitTabs() {
    const nav = document.getElementById('vocab-unit-nav');
    if (!nav) return;

    nav.addEventListener('click', function (e) {
      const btn = e.target.closest('.unit-tab');
      if (!btn) return;
      _selectedUnit = btn.getAttribute('data-unit') || 'all';
      nav.querySelectorAll('.unit-tab').forEach(function (b) {
        b.classList.toggle('active', b === btn);
      });
      applyFilters();
      if (_activeView === 'quiz') startQuizQuestion();
    });
  }

  function setupSearch() {
    const input = document.getElementById('vocab-search-input');
    const clearBtn = document.getElementById('vocab-search-clear');
    if (!input) return;

    input.addEventListener('input', function () {
      if (clearBtn) clearBtn.classList.toggle('active', input.value.length > 0);
      applyFilters();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        input.value = '';
        clearBtn.classList.remove('active');
        applyFilters();
        input.focus();
      });
    }
  }

  function getQuizPool() {
    if (_selectedUnit === 'all') return _allTerms;
    return window.DataLoader.filterVocabularyByUnit(_selectedUnit);
  }

  function applyFilters() {
    const query = (document.getElementById('vocab-search-input') || {}).value || '';
    const q = query.trim().toLowerCase();

    if (_selectedUnit === 'all') {
      _filteredTerms = _allTerms.slice();
    } else {
      _filteredTerms = window.DataLoader.filterVocabularyByUnit(_selectedUnit);
      _filteredTerms.sort(function (a, b) {
        return a.term.localeCompare(b.term, undefined, { sensitivity: 'base' });
      });
    }

    if (q) {
      _filteredTerms = _filteredTerms.filter(function (e) {
        return e.term.toLowerCase().indexOf(q) !== -1 ||
               e.definition.toLowerCase().indexOf(q) !== -1;
      });
    }

    renderGlossary();
    updateCount();
  }

  function updateCount() {
    const el = document.getElementById('vocab-count');
    if (el) {
      el.textContent = 'Showing ' + _filteredTerms.length + ' of ' + _allTerms.length + ' terms';
    }
  }

  function renderGlossary() {
    const listEl = document.getElementById('vocab-list');
    if (!listEl) return;

    if (_filteredTerms.length === 0) {
      listEl.innerHTML = '<div class="loading-note">No matching terms found.</div>';
      return;
    }

    listEl.innerHTML = '';
    _filteredTerms.forEach(function (entry) {
      const article = document.createElement('article');
      article.className = 'vocab-entry';
      article.id = 'vocab-' + entry.id;
      article.setAttribute('tabindex', '-1');

      const h2 = document.createElement('h2');
      h2.className = 'vocab-entry-term';
      h2.textContent = entry.term;
      article.appendChild(h2);

      if (entry.units && entry.units.length > 0) {
        const units = document.createElement('div');
        units.className = 'vocab-entry-units';
        units.textContent = 'Units: ' + entry.units.join(', ');
        article.appendChild(units);
      }

      const def = document.createElement('div');
      def.className = 'vocab-entry-definition';
      def.textContent = entry.definition;
      article.appendChild(def);

      if (entry.artworks && entry.artworks.length > 0) {
        const refs = document.createElement('div');
        refs.className = 'vocab-entry-references';

        const label = document.createElement('span');
        label.className = 'vocab-entry-references-label';
        label.textContent = 'References: ';
        refs.appendChild(label);

        entry.artworks.forEach(function (artworkId, idx) {
          if (idx > 0) {
            refs.appendChild(document.createTextNode(', '));
          }
          const paddedId = String(artworkId).padStart(3, '0');
          const link = document.createElement('a');
          link.href = '../list/' + paddedId + '/';
          link.textContent = paddedId;
          refs.appendChild(link);
        });

        article.appendChild(refs);
      }

      listEl.appendChild(article);
    });
  }

  function handleHashScroll() {
    const hash = window.location.hash;
    if (!hash || hash.indexOf('#vocab-') !== 0) return;

    const glossaryBtn = document.getElementById('vocab-view-glossary');
    if (glossaryBtn) glossaryBtn.click();

    const el = document.querySelector(hash);
    if (!el) return;

    requestAnimationFrame(function () {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('vocab-entry--highlight');
      setTimeout(function () {
        el.classList.remove('vocab-entry--highlight');
      }, 2000);
    });
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function startQuizQuestion() {
    _quizAnswered = false;
    const pool = getQuizPool();
    const promptEl = document.getElementById('vocab-quiz-prompt');
    const optionsEl = document.getElementById('vocab-quiz-options');
    const feedbackEl = document.getElementById('vocab-quiz-feedback');
    const nextBtn = document.getElementById('vocab-quiz-next');
    const scoreEl = document.getElementById('vocab-quiz-score');

    if (!promptEl || !optionsEl) return;

    if (pool.length < 4) {
      promptEl.textContent = 'Need at least 4 terms in this unit to quiz. Try "All" or tag more terms with units.';
      optionsEl.innerHTML = '';
      if (feedbackEl) feedbackEl.textContent = '';
      if (nextBtn) nextBtn.hidden = true;
      return;
    }

    const correct = pool[Math.floor(Math.random() * pool.length)];
    const distractors = shuffle(pool.filter(function (e) { return e.id !== correct.id; }))
      .slice(0, 3);
    const choices = shuffle([correct].concat(distractors));
    const labels = ['A', 'B', 'C', 'D'];

    promptEl.innerHTML = 'What is the definition of <strong>' + escapeHtml(correct.term) + '</strong>?';
    optionsEl.innerHTML = '';

    choices.forEach(function (choice, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'vocab-quiz-option';
      btn.setAttribute('data-correct', choice.id === correct.id ? 'true' : 'false');
      btn.setAttribute('data-id', choice.id);
      btn.innerHTML = '<span class="vocab-quiz-label">' + labels[idx] + '</span> ' + escapeHtml(choice.definition);
      btn.addEventListener('click', function () {
        if (_quizAnswered) return;
        _quizAnswered = true;
        _quizScore.total += 1;
        const isCorrect = choice.id === correct.id;
        if (isCorrect) _quizScore.correct += 1;

        optionsEl.querySelectorAll('.vocab-quiz-option').forEach(function (opt) {
          opt.disabled = true;
          if (opt.getAttribute('data-id') === correct.id) {
            opt.classList.add('vocab-quiz-option--correct');
          } else if (opt === btn && !isCorrect) {
            opt.classList.add('vocab-quiz-option--wrong');
          }
        });

        if (feedbackEl) {
          feedbackEl.textContent = isCorrect ? 'Correct!' : 'Incorrect. The right answer is highlighted.';
        }
        if (scoreEl) {
          scoreEl.textContent = 'Score: ' + _quizScore.correct + ' / ' + _quizScore.total;
        }
        if (nextBtn) nextBtn.hidden = false;
      });
      optionsEl.appendChild(btn);
    });

    if (feedbackEl) feedbackEl.textContent = '';
    if (nextBtn) nextBtn.hidden = true;
    if (scoreEl && _quizScore.total === 0) {
      scoreEl.textContent = 'Score: 0 / 0';
    }
  }

  function setupQuizNext() {
    const nextBtn = document.getElementById('vocab-quiz-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', startQuizQuestion);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
