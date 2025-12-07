# 하루살이 MVP (HarusaliMVP)

'하루살이'는 무기력감을 느끼는 청소년을 위한 전시용 상위단계 MVP(Minimum Viable Product)입니다. 이 앱은 사용자와의 상호작용을 통해 작은 미션을 제안하고, AI 캐릭터와의 대화를 통해 정서적 지지를 제공하는 것을 목표로 합니다.

## 주요 기능

- **AI 캐릭터와 대화**: Google Gemini API를 기반으로 하는 AI 캐릭터 '하루'와 자유롭게 대화할 수 있습니다.
- **위치 기반 미션**: `react-native-maps`를 사용하여 현재 위치 주변의 가상 장소를 탐색하고, 장소에 맞는 미션을 제안받을 수 있습니다.
- **사진 인증 미션**: '방구석 미션'을 사진으로 인증하고, 완료한 기록을 앱 내에 저장할 수 있습니다.
- **상태 관리**: `Context API`를 통해 앱의 상태(며칠차, 대화 기록, 미션 기록 등)를 전역적으로 관리합니다.
- **로컬 저장소**: `AsyncStorage`를 사용하여 주요 데이터를 기기에 저장합니다.

## 셋업 및 설치

1.  프로젝트의 모든 종속성을 설치합니다.
    ```bash
    npm install
    ```

## API 키 설정

이 앱의 모든 기능을 사용하려면 Google Gemini와 Google Maps의 API 키 설정이 필요합니다.

### 1. Gemini API 키

AI 채팅 기능을 활성화하려면 Gemini API 키가 필요합니다.

1.  `src/api/` 폴더 아래에 `config.ts` 파일을 생성합니다.
2.  아래 내용을 파일에 추가하고, `'YOUR_GEMINI_API_KEY_HERE'` 부분을 자신의 API 키로 교체합니다.

    ```typescript
    // src/api/config.ts
    export const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
    ```

3.  `src/api/gemini.ts` 파일을 열어 다음 두 가지를 수정해야 합니다.
    -   파일 상단의 `const GEMINI_API_KEY = ...` 라인을 주석 처리하거나 삭제합니다.
    -   바로 아래 주석 처리된 `import { GEMINI_API_KEY } from './config';` 라인의 주석을 해제합니다.
    -   `getGeminiResponse` 함수 내부의 "MOCK RESPONSE" 섹션을 주석 처리하고, "REAL API CALL LOGIC" 섹션의 주석을 해제합니다.

### 2. Google Maps API 키 (Android)

Android에서 지도 기능을 사용하려면 Google Maps API 키가 필요합니다.

1.  Google Cloud Console에서 **Maps SDK for Android**를 활성화하고 API 키를 발급받습니다.
2.  프로젝트 루트의 `app.json` 파일을 엽니다.
3.  `android` 섹션 내에 다음과 같이 `config`를 추가하고, `YOUR_GOOGLE_MAPS_API_KEY` 부분을 자신의 API 키로 교체합니다.

    ```json
    {
      "expo": {
        // ... other expo settings
        "android": {
          "config": {
            "googleMaps": {
              "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
            }
          },
          "package": "com.yourcompany.harusalimvp" 
        }
      }
    }
    ```

## 앱 실행하기

1.  아래 명령어를 실행하여 Metro Bundler를 시작합니다.

    ```bash
    npx expo start
    ```

2.  터미널에 QR 코드가 나타나면, 스마트폰의 **Expo Go** 앱을 사용하여 QR 코드를 스캔합니다.
3.  앱이 기기에서 빌드되고 실행됩니다.

**참고**: Windows 환경의 PowerShell에서 `npx` 명령어 실행 시 권한 오류가 발생할 수 있습니다. 이 경우, 다음 명령어를 대신 사용해 보세요.
`Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npx expo start`
