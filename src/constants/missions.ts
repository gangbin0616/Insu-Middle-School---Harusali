export interface Mission {
  id: string;
  text: string;
  relatedEmotion: string;
}

export const MISSIONS: Mission[] = [
  { id: 'm01', text: '책상을 정리해보자! 하루와 같이 정리하며 친해지자.', relatedEmotion: 'lethargic' },
  { id: 'm02', text: '좋아하는 음악 한 곡을 끝까지 들어보자.', relatedEmotion: 'anxious' },
  { id: 'm03', text: '창밖을 1분 동안 아무 생각 없이 바라보자.', relatedEmotion: 'zoned_out' },
  { id: 'm04', text: '차가운 물 한 잔을 천천히 마셔보자.', relatedEmotion: 'stifled' },
  { id: 'm05', text: '스트레칭으로 굳은 몸을 풀어주자.', relatedEmotion: 'lethargic' },
  { id: 'm06', text: '가장 편한 옷으로 갈아입기.', relatedEmotion: 'anxious' },
];
