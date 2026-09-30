/**
 * List page primary views: browse, attribution quiz, connect quiz.
 */

window.ListViewTabs = (function () {
  'use strict';

  var _view = 'browse';
  var _listeners = [];

  function notify() {
    _listeners.forEach(function (fn) {
      try { fn(_view); } catch (e) { console.error(e); }
    });
  }

  function setView(view) {
    if (_view === view) return;
    _view = view;
    applyDom();
    notify();
  }

  function getView() {
    return _view;
  }

  function onChange(fn) {
    _listeners.push(fn);
  }

  function applyDom() {
    var browseBtn = document.getElementById('list-view-browse');
    var quizBtn = document.getElementById('list-view-quiz');
    var connectBtn = document.getElementById('list-view-connect');
    var browsePanel = document.getElementById('list-browse-panel');
    var quizPanel = document.getElementById('list-quiz-panel');
    var connectPanel = document.getElementById('list-connect-panel');

    var isBrowse = _view === 'browse';
    var isQuiz = _view === 'quiz';
    var isConnect = _view === 'connect';

    document.body.classList.toggle('list-page--quiz', isQuiz);
    document.body.classList.toggle('list-page--connect', isConnect);

    if (browseBtn) {
      browseBtn.classList.toggle('active', isBrowse);
      browseBtn.setAttribute('aria-selected', isBrowse ? 'true' : 'false');
    }
    if (quizBtn) {
      quizBtn.classList.toggle('active', isQuiz);
      quizBtn.setAttribute('aria-selected', isQuiz ? 'true' : 'false');
    }
    if (connectBtn) {
      connectBtn.classList.toggle('active', isConnect);
      connectBtn.setAttribute('aria-selected', isConnect ? 'true' : 'false');
    }

    if (browsePanel) browsePanel.hidden = !isBrowse;
    if (quizPanel) quizPanel.hidden = !isQuiz;
    if (connectPanel) connectPanel.hidden = !isConnect;
  }

  function init() {
    var browseBtn = document.getElementById('list-view-browse');
    var quizBtn = document.getElementById('list-view-quiz');
    var connectBtn = document.getElementById('list-view-connect');

    if (browseBtn) {
      browseBtn.addEventListener('click', function () { setView('browse'); });
    }
    if (quizBtn) {
      quizBtn.addEventListener('click', function () { setView('quiz'); });
    }
    if (connectBtn) {
      connectBtn.addEventListener('click', function () { setView('connect'); });
    }

    applyDom();
  }

  return {
    init: init,
    setView: setView,
    getView: getView,
    onChange: onChange
  };
})();
