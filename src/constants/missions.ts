export interface Mission {
  id: string;
  text: string;
  relatedEmotion?: string;
  description: string;
}

export const MISSIONS: Mission[] = [
  { id: '1', text: '화분에 물 주고 사진 찍기', description: '집에 있는 화분에 물을 주고 사진을 찍어 인증해 보세요.' },
  { id: '2', text: '분리수거하고 사진 찍기', description: '오늘 하루 모은 재활용품을 분리수거해 보세요.' },
  { id: '3', text: '책장에 책 꽂고 사진 찍기', description: '책상이나 책장에 책을 정리해서 꽂아 보세요.' },
];