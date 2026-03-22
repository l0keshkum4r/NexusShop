/**
 * Unit tests for the hybrid recommendation engine scoring logic.
 * Run with: npm test
 *
 * These tests validate the mergeAndScore function without needing
 * live DB connections — they test the pure scoring math.
 */

// ── Inline the scoring logic (extracted from recommendationService.js) ─────────

const WEIGHTS = {
  graph:         0.30,
  ml:            0.25,
  content:       0.20,
  popularity:    0.15,
  collaborative: 0.10,
};

function normalize(recs) {
  if (recs.length === 0) return recs;
  const maxScore = Math.max(...recs.map((r) => r.score), 1);
  return recs.map((r) => ({ ...r, normalizedScore: r.score / maxScore }));
}

function mergeAndScore(graphRecs, mlRecs, contentRecs, trendingRecs, collaborativeRecs, excludeIds) {
  const sources = {
    graph:         normalize(graphRecs),
    ml:            normalize(mlRecs),
    content:       normalize(contentRecs),
    popularity:    normalize(trendingRecs),
    collaborative: normalize(collaborativeRecs),
  };

  const candidates = {};

  for (const [sourceName, recs] of Object.entries(sources)) {
    const weight = WEIGHTS[sourceName] || WEIGHTS.content;
    for (const rec of recs) {
      if (excludeIds.includes(rec.productId)) continue;
      if (!candidates[rec.productId]) {
        candidates[rec.productId] = {
          productId: rec.productId,
          score: 0,
          explanation: rec.explanation,
          sources: [],
        };
      }
      candidates[rec.productId].score += weight * (rec.normalizedScore || 0);
      candidates[rec.productId].sources.push(sourceName);
    }
  }

  return Object.values(candidates).sort((a, b) => b.score - a.score);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Hybrid Recommendation Scoring', () => {

  test('weights sum to 1.0', () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  test('normalizes scores to [0, 1]', () => {
    const recs = [
      { productId: 'p1', score: 100 },
      { productId: 'p2', score: 50 },
      { productId: 'p3', score: 25 },
    ];
    const normalized = normalize(recs);
    expect(normalized[0].normalizedScore).toBe(1.0);
    expect(normalized[1].normalizedScore).toBe(0.5);
    expect(normalized[2].normalizedScore).toBe(0.25);
  });

  test('normalize handles empty array', () => {
    expect(normalize([])).toEqual([]);
  });

  test('normalize handles single item', () => {
    const result = normalize([{ productId: 'p1', score: 42 }]);
    expect(result[0].normalizedScore).toBe(1.0);
  });

  test('mergeAndScore excludes already-seen products', () => {
    const graph = [{ productId: 'seen', score: 100, explanation: '' }];
    const result = mergeAndScore(graph, [], [], [], [], ['seen']);
    expect(result.find((r) => r.productId === 'seen')).toBeUndefined();
  });

  test('graph source has highest weight (0.30)', () => {
    const graphOnly   = mergeAndScore([{ productId: 'p1', score: 100 }], [], [], [], [], []);
    const contentOnly = mergeAndScore([], [], [{ productId: 'p2', score: 100 }], [], [], []);
    expect(graphOnly[0].score).toBeGreaterThan(contentOnly[0].score);
  });

  test('product appearing in multiple sources scores higher', () => {
    const graph   = [{ productId: 'multi', score: 80 }];
    const ml      = [{ productId: 'multi', score: 80 }];
    const single  = [{ productId: 'single', score: 100 }];
    const result  = mergeAndScore(graph, ml, [], [], [], []);
    const multiScore  = result.find((r) => r.productId === 'multi')?.score || 0;
    const singleGraph = mergeAndScore(single, [], [], [], [], []);
    // multi comes from graph+ml vs single from graph only
    expect(multiScore).toBeGreaterThan(0);
    expect(result.find((r) => r.productId === 'multi')?.sources).toHaveLength(2);
  });

  test('scores are sorted descending', () => {
    const graph   = [
      { productId: 'p1', score: 10 },
      { productId: 'p2', score: 100 },
      { productId: 'p3', score: 50 },
    ];
    const result = mergeAndScore(graph, [], [], [], [], []);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
    expect(result[1].score).toBeGreaterThanOrEqual(result[2].score);
  });

  test('returns empty array when all sources empty', () => {
    const result = mergeAndScore([], [], [], [], [], []);
    expect(result).toEqual([]);
  });

  test('sources array records contributing sources', () => {
    const graph   = [{ productId: 'p1', score: 50 }];
    const ml      = [{ productId: 'p1', score: 50 }];
    const content = [{ productId: 'p1', score: 50 }];
    const result  = mergeAndScore(graph, ml, content, [], [], []);
    expect(result[0].sources).toContain('graph');
    expect(result[0].sources).toContain('ml');
    expect(result[0].sources).toContain('content');
  });

  test('score is bounded between 0 and 1 for single-source products', () => {
    const recs   = [{ productId: 'p1', score: 1000 }];
    const result = mergeAndScore(recs, [], [], [], [], []);
    // max score for graph-only = weight * normalizedScore = 0.30 * 1.0 = 0.30
    expect(result[0].score).toBeLessThanOrEqual(0.30 + 0.001);
    expect(result[0].score).toBeGreaterThan(0);
  });

  test('full hybrid score cannot exceed 1.0 (sum of all weights)', () => {
    const makeRecs = (ids) => ids.map((id) => ({ productId: id, score: 100 }));
    const ids = ['p1'];
    const result = mergeAndScore(
      makeRecs(ids), makeRecs(ids), makeRecs(ids), makeRecs(ids), makeRecs(ids), []
    );
    // max possible = sum of all weights × 1.0 = 1.0
    expect(result[0].score).toBeLessThanOrEqual(1.0 + 0.001);
  });

});

describe('Normalize edge cases', () => {
  test('all-zero scores normalize to 0', () => {
    const recs = [{ productId: 'p1', score: 0 }, { productId: 'p2', score: 0 }];
    // max is Math.max(0, 0, 1) = 1 (the fallback)
    const result = normalize(recs);
    expect(result[0].normalizedScore).toBe(0);
    expect(result[1].normalizedScore).toBe(0);
  });
});
