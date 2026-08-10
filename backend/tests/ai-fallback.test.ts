import assert from 'assert';
import { AiService } from '../src/services/ai/ai.service';
import { isRetryableProviderError } from '../src/services/ai/ai-provider.interface';
import {
  AIProvider,
  AIProviderMessage,
  AIProviderResult,
} from '../src/services/ai/ai-provider.interface';
import { AppError } from '../src/errors/app-error';

const MESSAGES: AIProviderMessage[] = [
  { role: 'system', content: 'system' },
  { role: 'user', content: 'question' },
];

class FakeProvider implements AIProvider {
  public calls = 0;
  public readonly receivedMessages: AIProviderMessage[][] = [];

  public constructor(
    public readonly name: 'groq' | 'gemini' | 'openrouter',
    private readonly behavior: 'success' | 'retryable' | 'fatal' | 'unconfigured',
    private readonly status: number = 503
  ) {}

  public isConfigured(): boolean {
    return this.behavior !== 'unconfigured';
  }

  public async generateAnswer(
    messages: AIProviderMessage[]
  ): Promise<AIProviderResult> {
    this.calls += 1;
    this.receivedMessages.push(messages);
    if (this.behavior === 'fatal') {
      throw new AppError('config problem', this.status);
    }
    if (this.behavior === 'retryable') {
      throw new AppError('quota', this.status);
    }
    return { text: `answer from ${this.name}`, provider: this.name };
  }
}

function makeService(fakes: FakeProvider[]): AiService {
  return new AiService(fakes);
}

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

let g: FakeProvider, m: FakeProvider, o: FakeProvider;

(async (): Promise<void> => {
// TEST 1: Groq succeeds -> Gemini and OpenRouter must NOT be called.
g = new FakeProvider('groq', 'success');
m = new FakeProvider('gemini', 'success');
o = new FakeProvider('openrouter', 'success');
await run('T1 Groq succeeds (Gemini/OpenRouter not called)', async () => {
  const result = await makeService([g, m, o]).generateAnswer(MESSAGES);
  assert.strictEqual(result.provider, 'groq');
  assert.strictEqual(result.text, 'answer from groq');
  assert.strictEqual(g.calls, 1);
  assert.strictEqual(m.calls, 0);
  assert.strictEqual(o.calls, 0);
});

// TEST 2: Groq 429 -> Gemini called and succeeds, OpenRouter NOT called.
g = new FakeProvider('groq', 'retryable', 429);
m = new FakeProvider('gemini', 'success');
o = new FakeProvider('openrouter', 'success');
await run('T2 Groq 429 -> Gemini answers, OpenRouter not called', async () => {
  const result = await makeService([g, m, o]).generateAnswer(MESSAGES);
  assert.strictEqual(result.provider, 'gemini');
  assert.strictEqual(g.calls, 1);
  assert.strictEqual(m.calls, 1);
  assert.strictEqual(o.calls, 0);
});

// TEST 3: Groq timeout -> Gemini attempted.
g = new FakeProvider('groq', 'retryable', 504);
m = new FakeProvider('gemini', 'success');
o = new FakeProvider('openrouter', 'success');
await run('T3 Groq timeout -> Gemini attempted', async () => {
  const result = await makeService([g, m, o]).generateAnswer(MESSAGES);
  assert.strictEqual(result.provider, 'gemini');
  assert.strictEqual(m.calls, 1);
});

// TEST 4: Groq fails, Gemini 429 -> OpenRouter attempted and answers.
g = new FakeProvider('groq', 'retryable', 429);
m = new FakeProvider('gemini', 'retryable', 429);
o = new FakeProvider('openrouter', 'success');
await run('T4 Groq + Gemini 429 -> OpenRouter answers', async () => {
  const result = await makeService([g, m, o]).generateAnswer(MESSAGES);
  assert.strictEqual(result.provider, 'openrouter');
  assert.strictEqual(g.calls, 1);
  assert.strictEqual(m.calls, 1);
  assert.strictEqual(o.calls, 1);
});

// TEST 5: All retryable-provider behaviour -> chain exhausts; success via OpenRouter.
g = new FakeProvider('groq', 'retryable', 503);
m = new FakeProvider('gemini', 'retryable', 503);
o = new FakeProvider('openrouter', 'success');
await run('T5 Groq + Gemini unavailable -> OpenRouter succeeds', async () => {
  const result = await makeService([g, m, o]).generateAnswer(MESSAGES);
  assert.strictEqual(result.provider, 'openrouter');
  assert.strictEqual(result.text, 'answer from openrouter');
});

// TEST 6: all three fail -> clean 503 AI_SERVICES_UNAVAILABLE, no raw provider text.
g = new FakeProvider('groq', 'retryable', 429);
m = new FakeProvider('gemini', 'retryable', 429);
o = new FakeProvider('openrouter', 'retryable', 429);
await run('T6 all three fail -> 503 AI_SERVICES_UNAVAILABLE clean error', async () => {
  let caught: unknown;
  try {
    await makeService([g, m, o]).generateAnswer(MESSAGES);
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof AppError);
  assert.strictEqual(caught.statusCode, 503);
  assert.strictEqual((caught.data as { code: string }).code, 'AI_SERVICES_UNAVAILABLE');
  assert.strictEqual(caught.message, 'AI services are temporarily unavailable. Please try again shortly.');
});

// TEST 7: our own error (400/401) must NOT trigger fallback.
g = new FakeProvider('groq', 'fatal', 400);
m = new FakeProvider('gemini', 'success');
o = new FakeProvider('openrouter', 'success');
await run('T7 non-retryable error surfaces immediately, no fallback', async () => {
  let caught: unknown;
  try {
    await makeService([g, m, o]).generateAnswer(MESSAGES);
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof AppError);
  assert.strictEqual(caught.statusCode, 400);
  assert.strictEqual(m.calls, 0);
  assert.strictEqual(o.calls, 0);
});

// TEST 8: unconfigured providers are skipped without being called.
g = new FakeProvider('groq', 'unconfigured');
m = new FakeProvider('gemini', 'success');
o = new FakeProvider('openrouter', 'unconfigured');
await run('T8 unconfigured provider skipped', async () => {
  const result = await makeService([g, m, o]).generateAnswer(MESSAGES);
  assert.strictEqual(result.provider, 'gemini');
  assert.strictEqual(g.calls, 0);
  assert.strictEqual(o.calls, 0);
});

// TEST 9: every provider receives the SAME grounded prompt (RAG integrity).
g = new FakeProvider('groq', 'retryable', 429);
m = new FakeProvider('gemini', 'retryable', 429);
o = new FakeProvider('openrouter', 'success');
await run('T9 identical grounded prompt reaches all providers', async () => {
  await makeService([g, m, o]).generateAnswer(MESSAGES);
  assert.deepStrictEqual(g.receivedMessages[0], MESSAGES);
  assert.deepStrictEqual(m.receivedMessages[0], MESSAGES);
  assert.deepStrictEqual(o.receivedMessages[0], MESSAGES);
});

// Classifier sanity: retryable statuses vs application errors.
await run('classifier: 429/503/504 retryable, 400/401 not', () => {
  assert.ok(isRetryableProviderError(new AppError('x', 429)));
  assert.ok(isRetryableProviderError(new AppError('x', 503)));
  assert.ok(isRetryableProviderError(new AppError('x', 504)));
  assert.ok(!isRetryableProviderError(new AppError('x', 400)));
  assert.ok(!isRetryableProviderError(new AppError('x', 401)));
  assert.ok(!isRetryableProviderError(new Error('plain')));
});
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});