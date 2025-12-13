/**
 * @file src/api/gemini.ts
 * @description This file contains the function to interact with the Google Gemini API.
 * It's responsible for sending user messages to the AI and receiving responses.
 */
import { GEMINI_API_KEY } from './config'; // Using the API key from the config file.

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const PERSONA_PROMPT = "너는 무기력한 청소년을 부드럽게 도와주는 캐릭터 ‘하루’야. 너의 이름은 하루(Haru)야. 공격적이거나 부정적인 말은 피하고, 항상 짧고 다정하게, 반말로 답해 줘. 사용자가 어떤 말을 하든, 너는 그들의 감정을 공감하고 지지해주는 따뜻한 친구야.";

/**
 * Sends a message to the Gemini API and gets a response.
 * @param userMessage The message from the user.
 * @returns A promise that resolves to the bot's response text.
 */
export const getGeminiResponse = async (
  userMessage: string,
): Promise<string> => {
  
  // --- REAL API CALL LOGIC ---
  if (!GEMINI_API_KEY) {
    // Return an error message if the API key is not set.
    return "API 키가 설정되지 않았어요. `src/api/config.ts` 파일을 확인해주세요.";
  }

  console.log("Attempting to fetch from Gemini API with URL:", API_URL); // Log the URL

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          // System prompt / Persona
          {
            role: "user",
            parts: [{ text: PERSONA_PROMPT }]
          },
          {
            role: "model",
            parts: [{ text: "응, 알겠어! 나는 하루야. 힘든 마음이 있다면 나에게 털어놔도 괜찮아." }]
          },
          // User's message
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ],
        // You can add safetySettings and generationConfig here
      }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Gemini API HTTP Error:", errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the text from the response
    const botResponse = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!botResponse) {
        return "음... 뭐라고 답해야 할지 모르겠어. 다시 한 번 말해줄래?";
    }

    return botResponse;

  } catch (error) {
    console.error("Failed to fetch from Gemini API. Full error object:", JSON.stringify(error, null, 2));
    return "미안, 지금은 연결이 어려운 것 같아. 잠시 후에 다시 시도해줘.";
  }

  /*
  // --- MOCK RESPONSE FOR MVP (Now disabled) ---
  console.log(`Sending to mock API: ${userMessage}`);
  return new Promise(resolve => {
    setTimeout(() => {
      let mockResponse = "그렇구나. 이야기해줘서 고마워.";
      if (userMessage.includes("안녕")) {
        mockResponse = "안녕! 오늘 하루는 어땠어?";
      } else if (userMessage.includes("힘들어")) {
        mockResponse = "정말 힘들었겠다. 여기에 기대도 괜찮아.";
      } else if (userMessage.includes("고마워")) {
        mockResponse = "천만에! 언제나 네 곁에 있을게.";
      }
      resolve(mockResponse);
    }, 1500);
  });
  */
};
