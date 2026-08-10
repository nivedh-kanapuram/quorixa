import assert from 'assert';
import {
  tokenizeText,
  rankChunksLocally,
  buildChunkFilter,
  shouldFallbackToLocalRetrieval,
} from '../src/services/local-retrieval.service';

const CHUNKS = [
  {
    documentId: 'doc-a',
    chunkIndex: 0,
    text: 'Probability is the chance of an event happening. Favorable outcomes divided by total outcomes.',
  },
  {
    documentId: 'doc-a',
    chunkIndex: 1,
    text: 'A deck of cards has 52 cards with 26 red and 26 black cards.',
  },
  {
    documentId: 'doc-b',
    chunkIndex: 0,
    text: 'The capital of Japan is Tokyo and Mount Fuji is a famous volcano.',
  },
];

async function run(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (error) {
    console.error(`FAIL  ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

(async (): Promise<void> => {
  // B. Gemini 429 (RESOURCE_EXHAUSTED) -> local retrieval fallback must trigger.
  await run('B: 429 RESOURCE_EXHAUSTED triggers local fallback', () => {
    const error = new Error(
      '{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'
    );
    error.name = 'ApiError';
    (error as { status?: number }).status = 429;
    assert.ok(shouldFallbackToLocalRetrieval(error));
  });

  // C. Timeout / network failure -> local retrieval fallback must trigger.
  await run('C: timeout/network errors trigger local fallback', () => {
    assert.ok(shouldFallbackToLocalRetrieval(new Error('fetch failed')));
    assert.ok(shouldFallbackToLocalRetrieval(new Error('socket hang up')));
    assert.ok(
      shouldFallbackToLocalRetrieval(new Error('request timed out'))
    );
  });

  // A. Non-provider (our own) errors must NOT trigger fallback.
  await run('A: application errors do not trigger local fallback', () => {
    assert.ok(!shouldFallbackToLocalRetrieval(new TypeError('bad arg')));
    assert.ok(!shouldFallbackToLocalRetrieval(new Error('document not found')));
    assert.ok(!shouldFallbackToLocalRetrieval('not an error'));
  });

  // D. Local ranking retrieves the relevant chunk first, keeps metadata shape.
  await run('D: local ranking finds the relevant chunk (score shape preserved)', () => {
    const ranked = rankChunksLocally(
      'What is probability and favorable outcomes?',
      CHUNKS
    );
    assert.ok(ranked.length >= 1);
    assert.strictEqual(ranked[0].chunkIndex, 0);
    assert.strictEqual(ranked[0].documentId, 'doc-a');
    assert.ok(ranked[0].score > 0);
    for (const chunk of ranked) {
      assert.strictEqual(typeof chunk.documentId, 'string');
      assert.strictEqual(typeof chunk.chunkIndex, 'number');
      assert.strictEqual(typeof chunk.text, 'string');
      assert.strictEqual(typeof chunk.score, 'number');
    }
  });

  // D3. Multi-topic query ranks the best-matching chunk first.
  await run('D3: ranking orders chunks by keyword overlap', () => {
    const ranked = rankChunksLocally('cards red black deck', CHUNKS);
    assert.ok(ranked.length > 0);
    assert.strictEqual(ranked[0].chunkIndex, 1);
    assert.strictEqual(ranked[0].documentId, 'doc-a');
    assert.ok(ranked[0].score > 0);
  });

  // E. Ranked chunks preserve the retrieved set; filter excludes others.
  await run('E: chunk filter respects selected document isolation', () => {
    const filter = buildChunkFilter(['doc-a']);
    assert.deepStrictEqual(filter, { documentId: { $in: ['doc-a'] } });
    assert.deepStrictEqual(
      buildChunkFilter(['doc-a', 'doc-b']),
      { documentId: { $in: ['doc-a', 'doc-b'] } }
    );
    assert.deepStrictEqual(buildChunkFilter(undefined), {});
    assert.deepStrictEqual(buildChunkFilter([]), {});
  });

  // D2. No overlap -> no chunks (honest fallback to existing no-context path).
  await run('D2: zero-overlap query returns empty result', () => {
    assert.deepStrictEqual(
      rankChunksLocally('zzzzz qqqqq wwwww', CHUNKS),
      []
    );
    assert.deepStrictEqual(rankChunksLocally('', CHUNKS), []);
  });

  // F. Telugu query/text tokenizes without crashing.
  await run('F: Telugu text tokenization is safe', () => {
    const tokens = tokenizeText(
      'ఆంధ్రప్రదేశ్ రాజభాషా తెలుగు మరియు హిందీ ప్రాంతీయ భాష అని అంటారు'
    );
    assert.ok(tokens.length > 0);
    assert.ok(tokens.every((token) => token.length > 0));
  });

  // G. Hindi query/text tokenizes without crashing.
  await run('G: Hindi text tokenization is safe', () => {
    const tokens = tokenizeText(
      'हिंदी भारत की राष्ट्रीय भाषा नहीं है लेकिन राजभाषा जरूर है'
    );
    assert.ok(tokens.length > 0);
    assert.ok(tokens.every((token) => token.length > 0));
  });

  // F2/G2. Telugu + Hindi lexical ranking works end-to-end (no crash, sane result).
  await run('F2/G2: Telugu and Hindi ranking returns ranked chunks', () => {
    const teChunks = [
      { documentId: 'd1', chunkIndex: 0, text: 'తెలుగు భాష ఆంధ్రప్రదేశ్ రాజభాషా.' },
      { documentId: 'd1', chunkIndex: 1, text: 'భారతదేశం రాజధాని న్యూఢిల్లీ.' },
    ];
    const hiChunks = [
      { documentId: 'd2', chunkIndex: 0, text: 'हिंदी भारत की राजभाषा है।' },
      { documentId: 'd2', chunkIndex: 1, text: 'ताजमहल आगरा में स्थित है।' },
    ];
    const teRanked = rankChunksLocally('ఆంధ్రప్రదేశ్ తెలుగు రాజభాషా', teChunks);
    const hiRanked = rankChunksLocally('भारत की राजभाषा', hiChunks);
    assert.ok(teRanked.length > 0);
    assert.strictEqual(teRanked[0].chunkIndex, 0);
    assert.ok(hiRanked.length > 0);
    assert.strictEqual(hiRanked[0].chunkIndex, 0);
  });

  // H. Fallback chunks carry the exact RetrievedChunk fields used by the prompt.
  await run('H: fallback chunk shape matches vector-path chunk shape', () => {
    const ranked = rankChunksLocally('cards deck red black', CHUNKS.slice(0, 2));
    assert.ok(ranked.length > 0);
    const expectedKeys = ['documentId', 'chunkIndex', 'text', 'score'];
    const keys = Object.keys(ranked[0]).sort();
    assert.deepStrictEqual(keys, expectedKeys.sort());
  });

  // J. Fallback never surfaces provider error text in its result.
  await run('J: local fallback output contains no provider/error text', () => {
    const ranked = rankChunksLocally('probability event outcomes', CHUNKS);
    assert.ok(ranked.every((chunk) => !/RESOURCE_EXHAUSTED|quota|ApiError/i.test(chunk.text)));
  });
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});