import type { PersonalityId, PersonalityType } from '../types';

export const PERSONALITIES: Record<PersonalityId, PersonalityType> = {
  entertainer: {
    id: 'entertainer',
    name: '社交的エンターテイナー型',
    tagline: '人と過ごす時間が、いちばんの贅沢。',
    emoji: '✨',
    heroGradient:
      'linear-gradient(135deg, #FF6B9D 0%, #FF9966 55%, #FFB454 100%)',
    accent: '#FF4D8D',
    description:
      'あなたのお金は「誰かと過ごす時間」へと流れています。外食や交際は単なる消費ではなく、関係性をつくる投資。賑わいの中でいちばん輝く、生まれながらのエンターテイナーです。',
    strengths: ['人脈をつくる天才', '場の空気を読むセンス', '人を笑顔にする才能'],
    blindspots: ['付き合いで支出が膨らみがち', '一人時間の確保を忘れがち'],
    signatureKinds: ['dining', 'social'],
  },
  strategist: {
    id: 'strategist',
    name: '堅実ストラテジスト型',
    tagline: '今日の一円は、未来の自分への贈り物。',
    emoji: '🧭',
    heroGradient: 'linear-gradient(135deg, #5B8DEF 0%, #4FC3A1 100%)',
    accent: '#3F73D6',
    description:
      'あなたのお金は「生活を整える」「未来の自分を育てる」方向に向かっています。流行に流されず、長い目線で資産を組み立てる地に足のついた戦略家。コツコツが、最終的にいちばん遠くへ行きます。',
    strengths: ['計画性', '継続する力', '自己研鑽の習慣'],
    blindspots: ['まじめすぎて疲れる時がある', 'たまには自分にご褒美を'],
    signatureKinds: ['daily', 'self_investment'],
  },
  creator: {
    id: 'creator',
    name: '情熱的クリエイター型',
    tagline: '好きを追いかける熱量は、誰にも止められない。',
    emoji: '🎨',
    heroGradient: 'linear-gradient(135deg, #A66BFF 0%, #FF6BC9 100%)',
    accent: '#8A4DFF',
    description:
      '趣味や没頭できる対象に、惜しみなくお金と時間を注ぐあなた。ひとつのテーマを深く掘り下げる集中力と、独自の世界観があなたの武器。誰かの真似ではない、あなただけの審美眼を持っています。',
    strengths: ['圧倒的な熱中力', '審美眼と独自性', '創造的なエネルギー'],
    blindspots: ['一点集中しすぎて生活がおろそかに', '推しと冷静さのバランスを'],
    signatureKinds: ['hobby', 'self_investment'],
  },
  romantic: {
    id: 'romantic',
    name: 'ロマンチック衝動型',
    tagline: '心が動いた瞬間に、迷わず行く。',
    emoji: '💫',
    heroGradient:
      'linear-gradient(135deg, #FF7676 0%, #FF4D8D 60%, #C44DFF 100%)',
    accent: '#FF4D6D',
    description:
      '計画よりも直感、理屈よりも気分。あなたは「いまの自分の心」を大切にする人。後から振り返ると、その衝動こそが人生を彩る色彩になっていることに気づくはず。',
    strengths: ['感受性の豊かさ', '行動の速さ', '人生を味わう才能'],
    blindspots: ['翌日に少し後悔しがち', '欲しい気持ちを一晩寝かせる癖を'],
    signatureKinds: ['impulse', 'hobby'],
  },
  sage: {
    id: 'sage',
    name: 'バランス賢者型',
    tagline: '極端に偏らない、それが私のリズム。',
    emoji: '🌿',
    heroGradient:
      'linear-gradient(135deg, #4FC3A1 0%, #5B8DEF 55%, #A66BFF 100%)',
    accent: '#3FA987',
    description:
      '外食も、勉強も、趣味も、必要なものも、まんべんなく。あなたは「偏らない美しさ」を理解している人。冷静な俯瞰の目で、自分を観察する穏やかな賢者です。',
    strengths: ['俯瞰的な視点', '感情に流されない判断', '人を安心させる安定感'],
    blindspots: ['ときには一つに振り切ってみても', '優等生疲れに注意'],
    signatureKinds: ['daily', 'self_investment', 'dining'],
  },
};
