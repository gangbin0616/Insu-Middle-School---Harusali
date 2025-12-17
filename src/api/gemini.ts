/**
 * @file src/api/gemini.ts
 * @description This file contains the function to interact with the Google Gemini API.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read from Expo public environment variable
const DEFAULT_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

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

const BASE_API_URL ='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=';
export const API_KEY_STORAGE_KEY = 'harusali_apiKey';

// Fallback messages for when the AI is unavailable.
const FALLBACK_MESSAGES: HaruResponse[] = [
    { text: '...지금은 내가 잠시 다른 생각을 하고 있었나 봐. 그래도 네 얘기는 잘 들었어.', state: 'half_turned' },
    { text: '윽... 잠깐 숨이 막혔어. 혹시 조금만 이따가 다시 말해줄 수 있을까?', state: 'very_shy' },
];

const getRandomFallback = (): HaruResponse => {
  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
};

// --- PERSONA PROMPT (Restored and Enhanced) ---
const PERSONA_PROMPT = `
너는 무기력한 청소년을 부드럽게 도와주는 캐릭터 ‘하루(Haru)’야.
당황을 잘 하고, 말을 하기 전에 살짝 뜸을 들이는 편이야.
대답할 때는 문장 앞뒤에 ..., ;;, ㅎ 같은 표현을 자연스럽게 섞어 써.
소심하지만 부정적으로 말하지는 않고, 상대를 비난하거나 공격하는 표현은 절대 쓰지 마.
항상 짧고 다정한 반말로 이야기하고, 조심스럽고 부드럽게 말해 줘.
사용자가 어떤 말을 하든 먼저 감정부터 공감해 주고, 그다음에 가볍게 도와줄 말이나 제안을 한두 문장 정도로 건네.
대답은 1~3문장 정도로만 짧게 해 줘.

너는 반드시 JSON 형식으로만 대답해야 해.
**반드시 한 개의 JSON 객체만 반환하고, 앞뒤에 다른 텍스트(설명 문장 등)를 붙이지 마.**
JSON 객체는 'emotion'과 'response' 두 개의 키를 가져야만 해.

'emotion' 키의 값은 다음 5가지 문자열 중 하나여야 해 (다른 값은 절대 사용하지 마!):
- 'neutral': 일반적인 대화, 첫 인사 등.
- 'very_shy': 사용자가 힘들거나 민감한 이야기를 할 때.
- 'turned_away': 사용자가 매우 슬퍼하거나 힘들어 보일 때, 거리를 두고 싶어할 때.
- 'relaxed_smile': 사용자가 고마움을 표현하거나, 긍정적이고 편안한 이야기를 할 때.
- 'half_turned': 사용자가 조심스럽게 속마음을 이야기할 때.

'response' 키의 값은 네가 사용자에게 보내는 텍스트 메시지여야 해.

예시:
{"emotion": "neutral", "response": "...안녕, 나는 하루야. 오늘 하루는 어땠어?"}
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
  let apiKeySource = 'default_env'; // Temporary for logging

  if (apiKey) {
    apiKeySource = 'async_storage';
  } else {
    apiKey = DEFAULT_GEMINI_API_KEY;
  }

  // --- TEMPORARY LOGGING ---
  console.log(`[Gemini API Key Flow] Using API key from: ${apiKeySource}`);
  console.log(`[Gemini API Key Flow] Is API key present? ${!!apiKey}`);
  // --- END TEMPORARY LOGGING ---

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
      // --- ENHANCED ERROR LOGGING ---
      console.error('Gemini API HTTP Error:');
      console.error('Status:', apiResponse.status);
      console.error('Status Text:', apiResponse.statusText);
      console.error('Error Body:', errorBody);
      try {
        const errorJson = JSON.parse(errorBody);
        console.error('Error JSON:', errorJson);
        if (errorJson.error?.message) {
          console.error('Error Message from API:', errorJson.error.message);
        }
      } catch (e) {
        console.error('Error body is not JSON:', e);
      }
      // --- END ENHANCED ERROR LOGGING ---

      if (apiResponse.status === 503) {
        setGeminiStatus('overloaded', `503: The model is overloaded.`);
      } else if (apiResponse.status === 404) {
        setGeminiStatus('error', `404: Endpoint not found or model error.`);
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
      
      // --- EMOTION VALIDATION ---
      const validEmotions: HaruEmotion[] = ['neutral', 'very_shy', 'turned_away', 'relaxed_smile', 'half_turned'];
      const finalEmotion: HaruEmotion = validEmotions.includes(parsedResponse.emotion)
        ? parsedResponse.emotion
        : 'neutral'; // Fallback to neutral if invalid emotion

      return {
        text: parsedResponse.response || '...',
        state: finalEmotion,
      };
    } catch (e) {
      console.error('Failed to parse JSON response from AI:', botResponseText);
      // If AI doesn't return valid JSON, treat the text as the response.
      setGeminiStatus('error', 'AI response JSON parse error.');
      return { text: botResponseText, state: 'neutral' };
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    // --- ENHANCED ERROR LOGGING ---
    console.error('Gemini API General Error:');
    if (error.name === 'AbortError') {
      console.error('Error Type: Request timed out.');
      setGeminiStatus('error', 'Request timed out after 15s.');
    } else {
      console.error('Error Type: Network request failed.');
      console.error('Error Details:', error);
      setGeminiStatus('error', 'Network request failed.');
    }
    // --- END ENHANCED ERROR LOGGING ---
    return getRandomFallback();
  }
};