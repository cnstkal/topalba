// 엔딩 정의. 총 4개. 구체적인 내용은 추후 결정 예정이므로 placeholder 상태입니다.
// condition(state) 은 첫 번째로 true 를 반환하는 엔딩이 선택됩니다.
// 조건을 확장하려면 state.flags / state.score 를 자유롭게 조합하세요.

export const ENDINGS = [
  { id: 'ending_1', title: '엔딩 1', description: '(내용 추후 작성)', condition: (s) => s.flags.final === 'A' },
  { id: 'ending_2', title: '엔딩 2', description: '(내용 추후 작성)', condition: (s) => s.flags.final === 'B' },
  { id: 'ending_3', title: '엔딩 3', description: '(내용 추후 작성)', condition: (s) => s.flags.final === 'C' },
  { id: 'ending_4', title: '엔딩 4', description: '(내용 추후 작성)', condition: () => true }, // 기본값
]

export function judgeEnding(state) {
  return (ENDINGS.find((e) => e.condition(state)) || ENDINGS[ENDINGS.length - 1]).id
}
