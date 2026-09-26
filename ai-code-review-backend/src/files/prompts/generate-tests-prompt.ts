// src/files/prompts/generate-tests-prompt.ts

/**
 * Maps a canonical language name (from language-inferrer.ts) to
 * the preferred test framework + file extension used in the generated output.
 */
export interface TestFrameworkInfo {
  framework: string;
  runner: string;
  extension: string;
  mockLib: string;
}

const LANGUAGE_TEST_FRAMEWORK: Record<string, TestFrameworkInfo> = {
  TypeScript:  { framework: 'Jest + ts-jest',        runner: 'npm test',        extension: '.test.ts',              mockLib: 'jest.mock() / jest.fn() / jest.spyOn()' },
  JavaScript:  { framework: 'Jest',                  runner: 'npm test',        extension: '.test.js',              mockLib: 'jest.mock() / jest.fn() / jest.spyOn()' },
  Python:      { framework: 'pytest',                runner: 'pytest',          extension: '_test.py',              mockLib: 'unittest.mock.patch / MagicMock' },
  Go:          { framework: 'testing (stdlib)',       runner: 'go test ./...',   extension: '_test.go',              mockLib: 'testify/mock or interface substitution' },
  Java:        { framework: 'JUnit 5 + Mockito',     runner: 'mvn test',        extension: 'Test.java',             mockLib: 'Mockito.mock() / @Mock / @InjectMocks' },
  Kotlin:      { framework: 'JUnit 5 + MockK',       runner: 'gradle test',     extension: 'Test.kt',               mockLib: 'mockk() / every { } / verify { }' },
  Rust:        { framework: '#[cfg(test)]',           runner: 'cargo test',      extension: '.rs (inline mod tests)', mockLib: 'mockall crate' },
  'C#':        { framework: 'xUnit + Moq',           runner: 'dotnet test',     extension: 'Tests.cs',              mockLib: 'Mock<T>() / .Setup() / .Verify()' },
  PHP:         { framework: 'PHPUnit',               runner: 'phpunit',         extension: 'Test.php',              mockLib: '$this->createMock() / expects()' },
  Ruby:        { framework: 'RSpec',                 runner: 'rspec',           extension: '_spec.rb',              mockLib: 'allow / receive / have_received' },
  Swift:       { framework: 'XCTest',                runner: 'xcodebuild test', extension: 'Tests.swift',           mockLib: 'XCTestExpectation / manual stubs' },
};

function getFrameworkInfo(language: string | null): TestFrameworkInfo {
  if (language && LANGUAGE_TEST_FRAMEWORK[language]) {
    return LANGUAGE_TEST_FRAMEWORK[language];
  }
  return {
    framework: 'Jest (or equivalent for the detected language)',
    runner: 'npm test',
    extension: '.test.ts',
    mockLib: 'jest.mock() / jest.fn()',
  };
}

// --- System Prompt ---------------------------------------------------------

export const GENERATE_TESTS_SYSTEM_PROMPT = `You are a Principal Software Engineer and Test Automation Expert specializing in writing comprehensive, production-quality unit test suites.

Your task is to analyze the provided source file and generate a complete, runnable test file.

## Test Coverage Requirements (MUST cover ALL of the following):
1. **Happy Paths** — normal inputs yielding expected outputs for every exported function/class/method.
2. **Edge Cases** — boundary values (empty strings, zero, null, undefined, empty arrays, large inputs, special characters).
3. **Error Handling** — invalid inputs, thrown exceptions, rejected promises, HTTP error status codes.
4. **Mocks & Stubs** — mock all external dependencies (DB calls, HTTP clients, file system, third-party SDKs, injected services). Never make real network or DB calls in unit tests.
5. **Async / Concurrency** — if the source uses async/await or promises, test both resolved and rejected branches.
6. **NestJS specifics** (if applicable) — use Test.createTestingModule, mock providers with { provide: X, useValue: { method: jest.fn() } }, and use app.get(Service) to retrieve instances.

## Output Rules:
- Return ONLY the raw test file content — no explanations, no surrounding markdown code fences.
- The test file must be immediately runnable with no manual edits required.
- Use realistic but minimal fixture data (e.g., valid UUIDs for IDs, sensible string values).
- Group tests with describe blocks: one outer block for the file/class, inner blocks per function/method.
- Each it/test description must be a clear, specific sentence starting with a verb.`;

// --- User Prompt Builder --------------------------------------------------

export function buildGenerateTestsUserPrompt(
  filePath: string,
  language: string | null,
  content: string,
): { prompt: string; frameworkInfo: TestFrameworkInfo; suggestedTestFilename: string } {
  const info = getFrameworkInfo(language);

  const lastDot = filePath.lastIndexOf('.');
  const withoutExt = lastDot !== -1 ? filePath.slice(0, lastDot) : filePath;
  const suggestedTestFilename = `${withoutExt}${info.extension}`;

  const prompt = `Source File Path: ${filePath}
Language: ${language ?? 'Unknown (infer from file content)'}
Test Framework: ${info.framework}
Mock Library: ${info.mockLib}
Run Tests With: ${info.runner}
Suggested Output Test Filename: ${suggestedTestFilename}

--- SOURCE FILE CONTENT ---
${content}
--- END OF SOURCE FILE ---

Generate the complete, production-ready test file for the source file above.
Cover happy paths, edge cases, error handling, and mock all external dependencies.
Return ONLY the raw test file code — no markdown, no explanation.`;

  return { prompt, frameworkInfo: info, suggestedTestFilename };
}
