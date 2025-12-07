export interface Report {
  title: string;
  description: string;
}

export const REPORT_TEXTS: { [key: string]: Report } = {
  quiet_room: {
    title: '조용히 방에서 숨을 고르는 타입',
    description: '당신은 혼자만의 공간에서 에너지를 충전하는군요.',
  },
  light_action: {
    title: '작게라도 몸을 움직이며 버티는 타입',
    description: '작은 성취감을 느끼며 앞으로 나아가는 힘을 얻는군요.',
  },
  outside_dream: {
    title: '언제든 밖으로 나갈 준비 중인 타입',
    description: '마음 속에는 바깥 세상을 향한 작은 씨앗을 품고 있군요.',
  },
  default: {
    title: '아직 당신을 알아가는 중',
    description: '하루와 함께 당신의 새로운 모습을 발견해봐요.',
  },
};
