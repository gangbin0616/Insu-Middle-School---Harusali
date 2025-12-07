export const EMOTIONS = [
  { id: 'lethargic', text: '아무것도 하기 싫어' },
  { id: 'anxious', text: '불안해' },
  { id: 'zoned_out', text: '그냥 멍해' },
  { id: 'stifled', text: '속이 꽉 막힌 느낌' },
];

export const EMOTION_RESPONSES: { [key: string]: string } = {
  lethargic: '그냥 아무것도 하기 싫을 때도 있어. 그럴 땐, 아주 작은 것부터 같이 해볼까?',
  anxious: '마음이 복잡하고 불안하구나. 괜찮아, 잠시 숨을 고르는 시간을 가져보자.',
  zoned_out: '멍한 기분이 드는구나. 생각의 스위치를 잠시 꺼두는 것도 좋은 방법이야.',
  stifled: '답답한 느낌이 드는구나. 잠시 멈춰서 마음의 창문을 열어 환기시켜 보는 건 어때?',
  default: '네 마음을 더 들여다보고 싶어. 같이 이야기 해볼까?',
};
