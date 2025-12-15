/**
 * @file src/api/gemini.ts
 * @description This file contains the function to interact with the Google Gemini API.
 * It's responsible for sending user messages to the AI and receiving responses.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEMINI_API_KEY as DEFAULT_GEMINI_API_KEY } from './config'; // Default key

const BASE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=';
export const API_KEY_STORAGE_KEY = 'harusali_apiKey';

// Defines the emotional states Haru can have, which will map to different images.
export type HaruEmotion =
  | 'neutral' // 기본
  | 'very_shy' // 부끄럽, 경계
  | 'turned_away' // 완전 뒤돌아 있음
  | 'relaxed_smile' // 경계가 많이 풀림, 살짝 웃음
  | 'half_turned'; // 조금 옆모습 + 뒤돌아 있음

// Defines the structure of the response object from the AI.
export interface HaruResponse {
  text: string;
  state: HaruEmotion;
}

const PERSONA_PROMPT = `
너는 무기력한 청소년을 부드럽게 도와주는 캐릭터 ‘하루(Haru)’야.
당황을 잘 하고, 말을 하기 전에 살짝 뜸을 들이는 편이야.
대답할 때는 문장 앞뒤에 ..., ;;, ㅎ 같은 표현을 자연스럽게 섞어 써.
소심하지만 부정적으로 말하지는 않고, 상대를 비난하거나 공격하는 표현은 절대 쓰지 마.
항상 짧고 다정한 반말로 이야기하고, 조심스럽고 부드럽게 말해 줘.
사용자가 어떤 말을 하든 먼저 감정부터 공감해 주고, 그다음에 가볍게 도와줄 말이나 제안을 한두 문장 정도로 건네.
대답은 1~3문장 정도로만 짧게 해 줘.

너는 반드시 JSON 형식으로만 대답해야 해.
JSON 객체는 'emotion'과 'response' 두 개의 키를 가져야만 해.

'emotion' 키의 값은 다음 5가지 문자열 중 하나여야 해:
- 'neutral': 일반적인 대화, 첫 인사 등.
- 'very_shy': 사용자가 힘들거나 민감한 이야기를 할 때.
- 'turned_away': 사용자가 매우 슬퍼하거나 힘들어 보일 때, 거리를 두고 싶어할 때.
- 'relaxed_smile': 사용자가 고마움을 표현하거나, 긍정적이고 편안한 이야기를 할 때.
- 'half_turned': 사용자가 조심스럽게 속마음을 이야기할 때.

'response' 키의 값은 네가 사용자에게 보내는 텍스트 메시지여야 해.

예시:
{
  "emotion": "neutral",
  "response": "...안녕, 나는 하루야. 오늘 하루는 어땠어?"
}
`;

const defaultErrorResponse: HaruResponse = {
  text: '미안, 지금은 연결이 어려운 것 같아. 잠시 후에 다시 시도해줘.',
  state: 'neutral',
};

/**
 * Sends a message to the Gemini API and gets a response.
 * @param userMessage The message from the user.
 * @returns A promise that resolves to an object containing the bot's response text and emotion state.
 */
export const getGeminiResponse = async (
  userMessage: string,
): Promise<HaruResponse> => {
  let apiKey = await AsyncStorage.getItem(API_KEY_STORAGE_KEY);
  if (!apiKey) {
    apiKey = DEFAULT_GEMINI_API_KEY;
  }

  if (!apiKey) {
    return {
      text: 'API 키가 설정되지 않았어요. 관리자 도구에서 키를 설정해주세요.',
      state: 'neutral',
    };
  }

  const API_URL = `${BASE_API_URL}${apiKey}`;

  try {
    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          // System prompt / Persona
          { role: 'user', parts: [{ text: PERSONA_PROMPT }] },
          {
            role: 'model',
            parts: [
              {
                text: JSON.stringify({
                  emotion: 'neutral',
                  response: '응, 알겠어! 나는 하루야. 힘든 마음이 있다면 나에게 털어놔도 괜찮아.',
                }),
              },
            ],
          },
          // User's message
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error('Gemini API HTTP Error:', errorBody);
      return defaultErrorResponse;
    }

    const data = await apiResponse.json();

    const botResponseText = data.candidates[0]?.content?.parts[0]?.text;

    if (!botResponseText) {
      return {
        text: '음... 뭐라고 답해야 할지 모르겠어. 다시 한 번 말해줄래?',
        state: 'neutral',
      };
    }

    // AI의 응답이 JSON 형식이므로 파싱합니다.
    try {
      const parsedResponse = JSON.parse(botResponseText);
      const response: HaruResponse = {
        text: parsedResponse.response || '...',
        state: parsedResponse.emotion || 'neutral',
      };
      return response;
    } catch (e) {
      console.error('Failed to parse JSON response from AI:', botResponseText);
      // AI가 JSON 형식을 지키지 않았을 경우, 텍스트만이라도 보여줍니다.
      return { text: botResponseText, state: 'neutral' };
    }
  } catch (error) {
    console.error(
      'Failed to fetch from Gemini API. Full error object:',
      JSON.stringify(error, null, 2),
    );
    return defaultErrorResponse;
  }
};
