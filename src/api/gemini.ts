/**
 * @file src/api/gemini.ts
 * @description This file contains the function to interact with the Google Gemini API.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEMINI_API_KEY as DEFAULT_GEMINI_API_KEY } from './config';

// Re-declaring types here to avoid circular dependencies with context
export type HaruEmotion =
  | 'neutral'
  | 'very_shy'
  | 'turned_away'
  | 'relaxed_smile'
  | 'half_turned';

export type GeminiStatus = 'idle' | 'ok' | 'error' | 'overloaded';

export interface HaruResponse {
  text: string;
  state: HaruEmotion;
}

const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=';
export const API_KEY_STORAGE_KEY = 'harusali_apiKey';

// Fallback messages for when the AI is unavailable.
const FALLBACK_MESSAGES: HaruResponse[] = [
    { text: '...지금은 내가 잠시 다른 생각을 하고 있었나 봐. 그래도 네 얘기는 잘 들었어.', state: 'half_turned' },
    { text: '윽... 잠깐 숨이 막혔어. 혹시 조금만 이따가 다시 말해줄 수 있을까?', state: 'very_shy' },
];

const getRandomFallback = (): HaruResponse => {
  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
};

const PERSONA_PROMPT = `
너는 무기력한 청소년을 부드럽게 도와주는 캐릭터 ‘하루(Haru)’야.
항상 짧고 다정한 반말로 이야기하고, 조심스럽고 부드럽게 말해 줘.
사용자가 어떤 말을 하든 먼저 감정부터 공감해 주고, 그다음에 가볍게 도와줄 말이나 제안을 한두 문장 정도로 건네.
대답은 1~3문장 정도로만 짧게 해 줘.
너는 반드시 JSON 형식으로만 대답해야 해.
'emotion'과 'response' 두 개의 키를 가져야만 해.
'emotion' 키의 값은 다음 5가지 중 하나여야 해: 'neutral', 'very_shy', 'turned_away', 'relaxed_smile', 'half_turned'.
`;

/**
 * Sends a message to the Gemini API and gets a response.
 * Updates the global Gemini status via the provided callback.
 * @param userMessage The message from the user.
 * @param setGeminiStatus Callback to update the global API status.
 * @returns A promise that resolves to a HaruResponse object.
 */
export const getGeminiResponse = async (
  userMessage: string,
  setGeminiStatus: (status: GeminiStatus, error?: string) => void,
): Promise<HaruResponse> => {
  let apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
  if (!apiKey) {
    apiKey = DEFAULT_GEMINI_API_KEY;
  }

  if (!apiKey) {
    setGeminiStatus('error', 'API key is not set.');
    return {
      text: 'API 키가 설정되지 않았어요. 관리자 도구에서 키를 설정해주세요.',
      state: 'neutral',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  const API_URL = `${BASE_API_URL}${apiKey}`;

  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: PERSONA_PROMPT }] },
          { role: 'model', parts: [{ text: JSON.stringify({ emotion: 'neutral', response: '응, 알겠어!'}) }] },
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    clearTimeout(timeoutId);

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      const errorMessage = `HTTP ${apiResponse.status}: ${errorBody}`;
      console.error('Gemini API HTTP Error:', errorMessage);

      if (apiResponse.status === 503) {
        setGeminiStatus('overloaded', `503: The model is overloaded.`);
      } else {
        setGeminiStatus('error', `HTTP ${apiResponse.status}`);
      }
      return getRandomFallback();
    }

    const data = await apiResponse.json();
    const botResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!botResponseText) {
      console.error('Gemini API Error: Response text is missing.', data);
      setGeminiStatus('error', 'Response text is missing.');
      return getRandomFallback();
    }

    // Success case
    setGeminiStatus('ok');
    try {
      const parsedResponse = JSON.parse(botResponseText);
      return {
        text: parsedResponse.response || '...',
        state: parsedResponse.emotion || 'neutral',
      };
    } catch (e) {
      console.error('Failed to parse JSON response from AI:', botResponseText);
      // If AI doesn't return valid JSON, treat the text as the response.
      return { text: botResponseText, state: 'neutral' };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Gemini API Error: Request timed out.');
      setGeminiStatus('error', 'Request timed out after 15s.');
    } else {
      console.error('Gemini API Error: Failed to fetch.', error);
      setGeminiStatus('error', 'Network request failed.');
    }
    return getRandomFallback();
  }
};