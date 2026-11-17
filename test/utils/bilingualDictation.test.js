const test = require("node:test");
const assert = require("node:assert/strict");

let bilingual;
let languageSupport;
let onboardingLanguages;

test.before(async () => {
  const path = require("node:path");
  const { pathToFileURL } = require("node:url");
  const root = process.env.OPENWHISPR_TEST_SOURCE || path.resolve(__dirname, "../..");
  const load = (file) => import(pathToFileURL(path.join(root, file)));
  bilingual = await load("src/utils/bilingualDictation.js");
  languageSupport = await load("src/utils/languageSupport.ts");
  onboardingLanguages = await load("src/components/onboarding/languageOptions.ts");
});

test("nl-en is transcribed as Dutch and every other code passes through", () => {
  assert.equal(bilingual.toSttLanguage("nl-en"), "nl");
  assert.equal(bilingual.toSttLanguage("NL-EN"), "nl");
  for (const code of ["nl", "en", "auto", "zh-CN", undefined, null]) {
    assert.equal(bilingual.toSttLanguage(code), code);
  }
  assert.equal(languageSupport.getBaseLanguageCode("nl-en"), "nl");
});

test("the bilingual bias opens the Whisper prompt only for nl-en", () => {
  const bias = bilingual.getBilingualPromptBias("nl-en");
  assert.ok(bias);
  assert.equal(bilingual.withBilingualPromptBias("Kubernetes, Jeroen", "nl-en"), `${bias} Kubernetes, Jeroen`);
  assert.equal(bilingual.withBilingualPromptBias("", "nl-en"), bias);
  assert.equal(bilingual.withBilingualPromptBias(null, "nl-en"), bias);
  assert.equal(bilingual.withBilingualPromptBias("Kubernetes", "nl"), "Kubernetes");
  assert.equal(bilingual.withBilingualPromptBias("", "en"), null);
  assert.equal(bilingual.getBilingualPromptBias("nl"), null);
});

test("cleanup is told to keep each word in the language it was spoken", () => {
  const instruction = languageSupport.getLanguageInstruction("nl-en");
  assert.match(instruction, /Dutch/);
  assert.match(instruction, /English/);
  assert.match(instruction, /translate/i);
});

test("nl-en is offered for dictation but not during onboarding", () => {
  assert.ok(languageSupport.getLanguageInstruction("nl-en"));
  for (const query of ["", "dutch", "nl"]) {
    const codes = onboardingLanguages.getOnboardingLanguageOptions(query, []).map((l) => l.code);
    assert.ok(!codes.includes("nl-en"), `query "${query}"`);
  }
  assert.ok(onboardingLanguages.getOnboardingLanguageOptions("dutch", []).some((l) => l.code === "nl"));
});
