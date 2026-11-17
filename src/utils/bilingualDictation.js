// Dutch + English code-switching dictation ("nl-en").
//
// Speech recognition runs as Dutch (the matrix language): auto-detection on
// short clips drifts to neighbours such as Afrikaans or German. A mixed example
// sentence in the Whisper prompt biases the decoder toward keeping English
// words as spoken, and the dictation cleanup model then fixes misheard words
// from context (see the registry entry's instruction).

export const BILINGUAL_NL_EN = "nl-en";

// A Dutch sentence with English words in it, as this speaker talks. Kept short:
// it shares the Whisper decoder's prompt window with the custom dictionary.
const NL_EN_PROMPT_BIAS =
  "Hallo, ik heb de meeting verplaatst naar morgen, want de deadline is nog niet final.";

/**
 * @param {string | null | undefined} language
 * @returns {boolean}
 */
export function isBilingualNlEn(language) {
  return typeof language === "string" && language.toLowerCase() === BILINGUAL_NL_EN;
}

/**
 * The language code sent to a speech-to-text engine: the bilingual mode is
 * transcribed as Dutch; every other code passes through.
 *
 * @param {string | null | undefined} language
 * @returns {string | null | undefined}
 */
export function toSttLanguage(language) {
  return isBilingualNlEn(language) ? "nl" : language;
}

/**
 * @param {string | null | undefined} language
 * @returns {string | null}
 */
export function getBilingualPromptBias(language) {
  return isBilingualNlEn(language) ? NL_EN_PROMPT_BIAS : null;
}

/**
 * Put the bilingual bias in front of an existing Whisper prompt. The bias
 * opens the prompt so the user's own dictionary words stay at its end, where
 * a Whisper decoder reads them.
 *
 * @param {string | null | undefined} prompt
 * @param {string | null | undefined} language
 * @returns {string | null}
 */
export function withBilingualPromptBias(prompt, language) {
  const bias = getBilingualPromptBias(language);
  const rest = typeof prompt === "string" ? prompt.trim() : "";
  if (bias && rest) return `${bias} ${rest}`;
  if (bias) return bias;
  return rest || null;
}
