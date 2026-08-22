/**
 * Date normalization and timeline calculation utilities for AP Art History works.
 * Supports both browser (ES / window global) and Node.js (CommonJS).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.DateUtils = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Format a numerical year as a readable string (e.g., -4200 -> "4200 BCE", 1500 -> "1500 CE")
   */
  function formatYear(year) {
    if (year === null || year === undefined || isNaN(year)) return '';
    const num = Math.round(year);
    if (num < 0) {
      return Math.abs(num).toLocaleString('en-US') + ' BCE';
    } else if (num === 0) {
      return '1 BCE';
    } else {
      return num.toLocaleString('en-US') + ' CE';
    }
  }

  /**
   * Format a date range from numerical start/end
   */
  function formatRange(start, end) {
    if (start === null || start === undefined || end === null || end === undefined) return '';
    if (start === end) {
      return formatYear(start);
    }
    const startStr = formatYear(start);
    const endStr = formatYear(end);
    if (start < 0 && end < 0) {
      return Math.abs(start).toLocaleString('en-US') + '–' + Math.abs(end).toLocaleString('en-US') + ' BCE';
    }
    if (start > 0 && end > 0) {
      return start.toLocaleString('en-US') + '–' + end.toLocaleString('en-US') + ' CE';
    }
    return startStr + ' – ' + endStr;
  }

  /**
   * Parse an ordinal string or number (e.g. "15th" -> 15, "first" -> 1, "4th" -> 4)
   */
  function parseOrdinal(str) {
    if (!str) return null;
    const s = str.trim().toLowerCase();
    const match = s.match(/^(\d+)(st|nd|rd|th)?$/);
    if (match) return parseInt(match[1], 10);
    const words = {
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
      'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
      'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
      'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18,
      'nineteenth': 19, 'twentieth': 20, 'twenty-first': 21
    };
    return words[s] || null;
  }

  /**
   * Normalize century (e.g. 15 -> { start: 1401, end: 1500 }, -4 -> { start: -400, end: -301 })
   */
  function centuryToRange(centuryNum, isBce) {
    if (isBce) {
      const end = -(centuryNum - 1) * 100 - 1;
      const start = -centuryNum * 100;
      return { start, end };
    } else {
      const start = (centuryNum - 1) * 100 + 1;
      const end = centuryNum * 100;
      return { start, end };
    }
  }

  /**
   * Normalize millennium (e.g. 4 -> { start: -4000, end: -3001 } for BCE)
   */
  function millenniumToRange(millenniumNum, isBce) {
    if (isBce) {
      const end = -(millenniumNum - 1) * 1000 - 1;
      const start = -millenniumNum * 1000;
      return { start, end };
    } else {
      const start = (millenniumNum - 1) * 1000 + 1;
      const end = millenniumNum * 1000;
      return { start, end };
    }
  }

  /**
   * Main date normalization parser
   * Returns { dateStart, dateEnd, dateMidpoint, confidence }
   */
  function normalizeDateDisplay(dateDisplay) {
    if (!dateDisplay || typeof dateDisplay !== 'string') {
      return { dateStart: null, dateEnd: null, dateMidpoint: null, confidence: 'unknown' };
    }

    const clean = dateDisplay
      .replace(/\s+/g, ' ')
      .replace(/[–—]/g, '-')
      .replace(/\b(early|mid|late)-/gi, '$1 ')
      .replace(/\bca?\b\.?/gi, '')
      .replace(/\bcirca\b/gi, '')
      .replace(/\broughly\b/gi, '')
      .replace(/\bapprox(?:imate(?:ly)?)?\.?\b/gi, '')
      .trim();

    const isBce = /\bb\.?c\.?e\.?\b|\bb\.?c\.?\b/i.test(clean);
    const hasCe = /\bc\.?e\.?\b|\ba\.?d\.?\b/i.test(clean);

    // Check for millennium (e.g., "Fourth millennium bce", "4th millennium BCE")
    const milMatch = clean.match(/(early|mid|late|first half of the|second half of the)?\s*([a-zA-Z0-9-]+)\s+millennium\s*(b\.?c\.?e\.?|c\.?e\.?)?/i);
    if (milMatch) {
      const sub = milMatch[1] ? milMatch[1].toLowerCase() : '';
      const ordinal = parseOrdinal(milMatch[2]);
      if (ordinal) {
        const milIsBce = milMatch[3] ? /\bb\.?c\.?e\.?\b|\bb\.?c\.?\b/i.test(milMatch[3]) : isBce;
        const range = millenniumToRange(ordinal, milIsBce);
        let start = range.start;
        let end = range.end;
        if (sub.includes('early')) {
          if (milIsBce) { start = range.start; end = range.start + 333; }
          else { start = range.start; end = range.start + 333; }
        } else if (sub.includes('late')) {
          if (milIsBce) { start = range.end - 333; end = range.end; }
          else { start = range.end - 333; end = range.end; }
        }
        return {
          dateStart: Math.round(start),
          dateEnd: Math.round(end),
          dateMidpoint: Math.round((start + end) / 2),
          confidence: 'normalized'
        };
      }
    }

    // Check for century ranges (e.g., "12th-13th century", "6th to 5th century BCE")
    const centRangeMatch = clean.match(/([a-zA-Z0-9-]+)(?:\s*(?:-|to)\s*)([a-zA-Z0-9-]+)\s+century\s*(b\.?c\.?e\.?|c\.?e\.?)?/i);
    if (centRangeMatch) {
      const c1 = parseOrdinal(centRangeMatch[1]);
      const c2 = parseOrdinal(centRangeMatch[2]);
      const centIsBce = centRangeMatch[3] ? /\bb\.?c\.?e\.?\b|\bb\.?c\.?\b/i.test(centRangeMatch[3]) : isBce;
      if (c1 && c2) {
        const r1 = centuryToRange(c1, centIsBce);
        const r2 = centuryToRange(c2, centIsBce);
        const start = Math.min(r1.start, r2.start);
        const end = Math.max(r1.end, r2.end);
        return {
          dateStart: start,
          dateEnd: end,
          dateMidpoint: Math.round((start + end) / 2),
          confidence: 'normalized'
        };
      }
    }

    // Check for single century (e.g. "15th century", "early 19th century", "late 5th century bce")
    const centMatch = clean.match(/(early|mid|late|first half of the|second half of the)?\s*([a-zA-Z0-9-]+)\s+century\s*(b\.?c\.?e\.?|c\.?e\.?)?/i);
    if (centMatch) {
      const sub = centMatch[1] ? centMatch[1].toLowerCase() : '';
      const c = parseOrdinal(centMatch[2]);
      if (c) {
        const centIsBce = centMatch[3] ? /\bb\.?c\.?e\.?\b|\bb\.?c\.?\b/i.test(centMatch[3]) : isBce;
        const range = centuryToRange(c, centIsBce);
        let start = range.start;
        let end = range.end;
        if (sub.includes('early')) {
          if (centIsBce) { start = range.start; end = range.start + 30; }
          else { start = range.start; end = range.start + 30; }
        } else if (sub.includes('late')) {
          if (centIsBce) { start = range.end - 30; end = range.end; }
          else { start = range.end - 30; end = range.end; }
        } else if (sub.includes('mid')) {
          start = range.start + 35;
          end = range.end - 35;
        }
        return {
          dateStart: Math.round(start),
          dateEnd: Math.round(end),
          dateMidpoint: Math.round((start + end) / 2),
          confidence: 'normalized'
        };
      }
    }

    // Check for numerical ranges like "25,500-25,300 bce", "4200-3500 BCE", "1400-1450 CE", "500 BCE - 100 CE"
    const rangeMatch = clean.match(/([0-9,]+)\s*(?:b\.?c\.?e\.?|b\.?c\.?|c\.?e\.?)?\s*[-–to]+\s*([0-9,]+)\s*(b\.?c\.?e\.?|b\.?c\.?)?/i);
    if (rangeMatch) {
      const n1 = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
      const n2 = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
      const rightIsBce = rangeMatch[3] ? /\bb\.?c\.?e\.?\b|\bb\.?c\.?\b/i.test(rangeMatch[3]) : isBce;
      const leftPart = clean.split(/[-–]|(?:\bto\b)/)[0];
      const leftHasBce = /\bb\.?c\.?e\.?\b|\bb\.?c\.?\b/i.test(leftPart);

      let start, end;
      if (rightIsBce && (leftHasBce || isBce || !hasCe)) {
        // Both BCE (e.g. 4200-3500 bce -> -4200 to -3500)
        start = -Math.max(n1, n2);
        end = -Math.min(n1, n2);
      } else if (leftHasBce && !rightIsBce) {
        // Span from BCE to CE (e.g. 500 BCE - 100 CE)
        start = -n1;
        end = n2;
      } else {
        // Both CE (e.g. 1500-1550 CE)
        start = Math.min(n1, n2);
        end = Math.max(n1, n2);
      }
      return {
        dateStart: start,
        dateEnd: end,
        dateMidpoint: Math.round((start + end) / 2),
        confidence: 'normalized'
      };
    }

    // Check for single numerical year (e.g. "1000 bce", "1500", "c. 1964", "1980 CE")
    const singleMatch = clean.match(/([0-9,]+)\s*(b\.?c\.?e\.?|b\.?c\.?|c\.?e\.?)?/i);
    if (singleMatch) {
      const n = parseInt(singleMatch[1].replace(/,/g, ''), 10);
      const singleIsBce = singleMatch[2] ? /\bb\.?c\.?e\.?\b|\bb\.?c\.?\b/i.test(singleMatch[2]) : isBce;
      const year = singleIsBce ? -n : n;
      return {
        dateStart: year,
        dateEnd: year,
        dateMidpoint: year,
        confidence: 'normalized'
      };
    }

    return { dateStart: null, dateEnd: null, dateMidpoint: null, confidence: 'failed' };
  }

  /**
   * Overlap check: does artwork range overlap the selection range?
   * Per spec section 5: artwork spans [artStart, artEnd], selection is [selStart, selEnd]
   */
  function doesDateRangeOverlap(artStart, artEnd, selStart, selEnd) {
    if (artStart === null || artEnd === null || selStart === null || selEnd === null) return true;
    return artStart <= selEnd && artEnd >= selStart;
  }

  /**
   * Generate timeline ticks for a visible span [minYear, maxYear]
   * Dynamically adapts density based on scale
   */
  function calculateTimelineTicks(minYear, maxYear, targetTickCount) {
    targetTickCount = targetTickCount || 8;
    const span = Math.abs(maxYear - minYear);
    if (span <= 0) return [minYear];

    const majorAnchors = [
      -30000, -25000, -20000, -15000, -10000, -8000, -6000, -5000, -4000, -3000,
      -2500, -2000, -1500, -1000, -800, -600, -500, -400, -300, -200, -100,
      1, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400,
      1500, 1550, 1600, 1650, 1700, 1750, 1800, 1820, 1840, 1860, 1880, 1900, 1920,
      1940, 1960, 1980, 2000, 2020
    ];

    const inside = majorAnchors.filter(y => y >= minYear && y <= maxYear);
    if (inside.length <= targetTickCount + 2 && inside.length >= 3) {
      return inside;
    }

    const rawStep = span / targetTickCount;
    const niceSteps = [1, 2, 5, 10, 20, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
    let chosenStep = niceSteps[niceSteps.length - 1];
    for (let i = 0; i < niceSteps.length; i++) {
      if (niceSteps[i] >= rawStep) {
        chosenStep = niceSteps[i];
        break;
      }
    }

    const first = Math.ceil(minYear / chosenStep) * chosenStep;
    const ticks = [];
    for (let y = first; y <= maxYear; y += chosenStep) {
      ticks.push(y);
    }
    return ticks;
  }

  return {
    formatYear: formatYear,
    formatRange: formatRange,
    normalizeDateDisplay: normalizeDateDisplay,
    doesDateRangeOverlap: doesDateRangeOverlap,
    calculateTimelineTicks: calculateTimelineTicks
  };
}));
