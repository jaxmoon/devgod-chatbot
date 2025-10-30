# 개발의신 (DevGod) 🤖

KakaoTalk 스타일의 AI 소프트웨어 개발 Q&A 챗봇

Google Gemini API와 Next.js 14로 구축된 실시간 스트리밍 채팅 애플리케이션입니다.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## ✨ 주요 기능

- 🎨 **KakaoTalk 스타일 UI** - 친숙한 메신저 디자인
- ⚡ **실시간 스트리밍** - Gemini API를 활용한 실시간 응답
- 💾 **로컬 저장소** - localStorage 기반 채팅 히스토리 관리
- 🔄 **다중 세션 지원** - 여러 대화 세션 관리
- 📱 **반응형 디자인** - 모바일/데스크톱 최적화
- 🧪 **완전한 테스트 커버리지** - Jest + Playwright E2E 테스트

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18.17 이상
- npm 또는 yarn
- Google Gemini API 키 ([발급받기](https://makersuite.google.com/app/apikey))

### 설치 및 실행

1. **레포지토리 클론**
```bash
git clone https://github.com/jaxmoon/devgod-chatbot.git
cd devgod-chatbot
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
cp .env.example .env.local
# .env.local 파일을 열어 GEMINI_API_KEY를 입력하세요
```

또는 setup 스크립트 사용:
```bash
./scripts/setup.sh
```

4. **개발 서버 실행**
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어보세요!

## 📁 프로젝트 구조

```
chatbot/
├── src/
│   ├── app/
│   │   ├── api/chat/          # Gemini 스트리밍 API 라우트
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 메인 페이지
│   │   └── globals.css         # 전역 스타일
│   ├── components/
│   │   └── chat/               # 채팅 UI 컴포넌트
│   │       ├── ChatContainer.tsx
│   │       ├── ChatHeader.tsx
│   │       ├── ChatInput.tsx
│   │       └── ChatMessage.tsx
│   ├── lib/
│   │   ├── gemini.ts           # Gemini API 클라이언트
│   │   ├── storage.ts          # localStorage 관리
│   │   ├── utils.ts            # 유틸리티 함수
│   │   └── systemPrompt.txt    # AI 시스템 프롬프트
│   ├── hooks/
│   │   └── useChat.ts          # 채팅 상태 관리 훅
│   └── types/
│       ├── chat.ts             # 채팅 타입 정의
│       └── api.ts              # API 타입 정의
├── __tests__/                  # Jest 단위 테스트
├── e2e/                        # Playwright E2E 테스트
├── docs/                       # 작업 문서
└── scripts/                    # 배포 스크립트
```

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 기반 스타일링
- **React Hooks** - 상태 관리

### Backend
- **Next.js API Routes** - 서버리스 API
- **Google Gemini API** - AI 언어 모델
- **Server-Sent Events (SSE)** - 실시간 스트리밍

### Testing
- **Jest** - 단위 테스트
- **React Testing Library** - 컴포넌트 테스트
- **Playwright** - E2E 테스트

### DevOps
- **Vercel** - 배포 플랫폼
- **Docker** - 컨테이너화
- **GitHub Actions** - CI/CD (예정)

## 🧪 테스트

### 단위 테스트 실행
```bash
npm test                 # Jest 테스트 실행
npm run test:watch       # Watch 모드
npm run test:coverage    # 커버리지 리포트
```

### E2E 테스트 실행
```bash
npm run test:e2e         # Playwright 테스트
npm run test:e2e:ui      # UI 모드
```

## 📦 배포

### Vercel (권장)

1. **Vercel CLI 설치**
```bash
npm i -g vercel
```

2. **배포**
```bash
vercel --prod
```

또는 스크립트 사용:
```bash
./scripts/deploy-vercel.sh
```

3. **환경 변수 설정**
Vercel 대시보드에서 `GEMINI_API_KEY` 환경 변수를 추가하세요.

### Docker

```bash
# 이미지 빌드
docker build -t devgod-chatbot -f docker/Dockerfile .

# 컨테이너 실행
docker run -p 3000:3000 -e GEMINI_API_KEY=your_key devgod-chatbot
```

또는 Docker Compose 사용:
```bash
./scripts/deploy-docker.sh
```

## 🎨 UI 커스터마이징

### 시스템 프롬프트 수정
AI의 성격과 응답 스타일을 변경하려면 `src/lib/systemPrompt.txt`를 수정하세요:

```txt
당신은 "개발의신"이라는 이름의 AI 어시스턴트입니다.
소프트웨어 개발에 관한 모든 질문에 친절하고 전문적으로 답변합니다.
```

### 테마 색상 변경
`src/app/globals.css`와 `tailwind.config.ts`에서 색상을 수정하세요:

```css
/* KakaoTalk 노란색 */
.message-user {
  background-color: #FAE100;
}

/* 배경색 */
.chat-background {
  background-color: #B2C7DA;
}
```

## 🔧 개발 가이드

### API 엔드포인트 테스트

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "TypeScript의 장점은?",
    "history": []
  }'
```

### 브라우저 콘솔 테스트

```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'React의 장점은?',
    history: []
  })
}).then(async response => {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    console.log(decoder.decode(value));
  }
});
```

## 📝 주요 구현 세부사항

### 스트리밍 아키텍처

**서버 사이드 (API Route)**
```typescript
// SSE 형식으로 스트림 생성
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.stream) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
      );
    }
    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
  }
});
```

**클라이언트 사이드**
```typescript
// SSE 스트림 읽기 및 실시간 업데이트
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  // 메시지 내용 실시간 업데이트
  updateMessage(messageId, { content: fullContent });
}
```

### 저장소 관리

- **최대 저장 용량**: 5MB
- **최대 세션 수**: 20개
- **세션당 최대 메시지**: 100개
- **자동 정리**: 한도 초과 시 가장 오래된 데이터 삭제

### 컨텍스트 윈도우 최적화

- Gemini API에는 최근 10개 메시지만 전송 (토큰 절약)
- localStorage에는 전체 히스토리 저장 (최대 100개)

## 🐛 문제 해결

### 스트리밍이 작동하지 않을 때
```bash
# 환경 변수 확인
cat .env.local

# 개발 서버 재시작
npm run dev
```

### localStorage 문제
```javascript
// 브라우저 콘솔에서 저장소 확인
localStorage.getItem('devgod_chat_storage')

// 저장소 초기화
localStorage.removeItem('devgod_chat_storage')
```

### 빌드 실패
```bash
# 캐시 및 node_modules 삭제 후 재설치
rm -rf .next node_modules
npm install
npm run build
```

## 📚 문서

- [TASK_01_SETUP.md](docs/TASK_01_SETUP.md) - 프로젝트 초기 설정
- [TASK_02_API.md](docs/TASK_02_API.md) - Gemini API 통합
- [TASK_03_UI.md](docs/TASK_03_UI.md) - UI 컴포넌트 구현
- [TASK_04_SUMMARY.md](TASK_04_SUMMARY.md) - 테스팅 시스템 구현
- [CLAUDE.md](CLAUDE.md) - Claude Code 가이드

## 🤝 기여

이슈와 풀 리퀘스트를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👤 작성자

**Jaxmoon**
- GitHub: [@jaxmoon](https://github.com/jaxmoon)
- Email: jax@primer.kr

## 🙏 감사의 말

- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI 언어 모델
- [Next.js](https://nextjs.org/) - React 프레임워크
- [Vercel](https://vercel.com/) - 배포 플랫폼
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크

---

⭐ 이 프로젝트가 유용하다면 Star를 눌러주세요!
