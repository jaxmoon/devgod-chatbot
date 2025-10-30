# Execution Plan
## 개발의신 챗봇 실행 계획서

**문서 버전:** 1.0
**작성일:** 2025-01-30
**프로젝트:** 개발의신 - Gemini API 기반 개발 Q&A 챗봇

---

## 1. 실행 프로세스 개요

### 1.1 전체 프로세스

```
┌─────────────────────────────────────────────────────────┐
│                   STAGE 0: 사양 검토                     │
│              Specification Review & Approval            │
│                    (1-2 days)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─ REQUIREMENTS.md 검토
                 ├─ TECHSPEC.md 검토
                 ├─ API_CONTRACT.yaml 검토
                 ├─ TEST_SPECIFICATIONS.md 검토
                 └─ Stakeholder 승인
                 │
┌────────────────▼────────────────────────────────────────┐
│                  STAGE 1: 개발 준비                      │
│              Development Setup & Planning               │
│                    (1 day)                              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─ AGENT_TASK_01_SETUP.md 실행
                 ├─ 환경 변수 설정
                 ├─ 테스트 프레임워크 설정
                 └─ CHECKPOINT 1 통과
                 │
┌────────────────▼────────────────────────────────────────┐
│                 STAGE 2: 핵심 기능 구현                  │
│              Core Implementation & Unit Tests           │
│                    (1 week)                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─ AGENT_TASK_03_API.md 실행 (API 통합)
                 ├─ AGENT_TASK_04_UI_COMPONENTS.md 실행 (UI 구현)
                 ├─ 단위 테스트 작성 및 실행
                 └─ CHECKPOINT 2 통과
                 │
┌────────────────▼────────────────────────────────────────┐
│               STAGE 3: 통합 및 최적화                     │
│          Integration, Storage & Optimization            │
│                    (3-4 days)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─ AGENT_TASK_06_STORAGE.md 실행
                 ├─ 통합 테스트 실행
                 ├─ 성능 최적화
                 └─ CHECKPOINT 3 통과
                 │
┌────────────────▼────────────────────────────────────────┐
│                STAGE 4: 테스트 및 검증                    │
│            E2E Testing & Quality Assurance              │
│                    (2-3 days)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─ E2E 테스트 실행
                 ├─ 성능 테스트 (Lighthouse)
                 ├─ 보안 테스트 (npm audit)
                 └─ CHECKPOINT 4 통과
                 │
┌────────────────▼────────────────────────────────────────┐
│               STAGE 5: 배포 및 모니터링                   │
│            Deployment & Post-Launch Monitoring          │
│                    (1-2 days)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├─ AGENT_TASK_10_OPTIMIZATION.md 실행
                 ├─ 프로덕션 배포
                 ├─ 모니터링 설정
                 └─ CHECKPOINT 5 통과
                 │
┌────────────────▼────────────────────────────────────────┐
│                    프로젝트 완료                         │
│                  Project Complete                       │
└─────────────────────────────────────────────────────────┘
```

### 1.2 타임라인

| 단계 | 기간 | 누적 일수 |
|-----|------|----------|
| STAGE 0: 사양 검토 | 1-2일 | 2일 |
| STAGE 1: 개발 준비 | 1일 | 3일 |
| STAGE 2: 핵심 기능 구현 | 7일 | 10일 |
| STAGE 3: 통합 및 최적화 | 3-4일 | 14일 |
| STAGE 4: 테스트 및 검증 | 2-3일 | 17일 |
| STAGE 5: 배포 및 모니터링 | 1-2일 | 19일 |
| **총 예상 기간** | **~3주** | **19일** |

---

## 2. STAGE 0: 사양 검토

### 2.1 목표
모든 사양 문서를 검토하고 이해관계자의 승인을 받습니다.

### 2.2 체크리스트

#### 문서 검토
- [ ] `REQUIREMENTS.md` 읽기 및 이해
  - [ ] 모든 기능 요구사항 (FR-001 ~ FR-007) 검토
  - [ ] 모든 비기능 요구사항 (NFR-001 ~ NFR-006) 검토
  - [ ] 제약사항 및 가정 이해

- [ ] `TECHSPEC.md` 읽기 및 이해
  - [ ] 시스템 아키텍처 다이어그램 분석
  - [ ] 데이터 모델 검토
  - [ ] API 사양 이해

- [ ] `API_CONTRACT.yaml` 검토
  - [ ] OpenAPI 스펙 검증
  - [ ] 요청/응답 스키마 확인
  - [ ] 에러 응답 카탈로그 검토

- [ ] `TEST_SPECIFICATIONS.md` 검토
  - [ ] 테스트 커버리지 목표 확인
  - [ ] 단위/통합/E2E 테스트 계획 이해

- [ ] `ERROR_RECOVERY.md` 검토
  - [ ] 모든 에러 시나리오 이해
  - [ ] 복구 전략 확인

#### 질문 및 명확화
- [ ] 모호한 요구사항 리스트 작성
- [ ] 기술적 질문 정리
- [ ] 이해관계자와 미팅 일정 잡기

#### 승인
- [ ] Tech Lead 리뷰
- [ ] Product Owner 승인
- [ ] 모든 팀원이 사양 이해 확인

### 2.3 산출물
- ✅ 검토 완료된 사양 문서 세트
- ✅ Q&A 문서 (질문과 답변)
- ✅ 승인 기록 (이메일 또는 문서)

### 2.4 예상 소요 시간
**1-2 days**

---

## 3. STAGE 1: 개발 준비

### 3.1 목표
개발 환경을 구축하고 모든 도구를 설정합니다.

### 3.2 실행 작업

#### 3.2.1 환경 설정 (AGENT_TASK_01_SETUP.md 실행)

```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest . --typescript --tailwind --app --no-src

# 2. 추가 패키지 설치
npm install @google/generative-ai lucide-react
npm install -D @types/node

# 3. 디렉토리 구조 생성
mkdir -p app/api/chat
mkdir -p components/{chat,ui}
mkdir -p lib hooks types mocks
mkdir -p docs/tasks/handoffs scripts docker e2e tests

# 4. 환경 변수 설정
cat <<'EOF' > .env.example
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF
cp .env.example .env.local
# .env.local의 GEMINI_API_KEY를 실키로 교체
```

#### 3.2.2 테스트 프레임워크 설정

```bash
# Jest + React Testing Library
npm install -D jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom

# Playwright (E2E)
npm install -D @playwright/test
npx playwright install

# MSW (API Mocking)
npm install -D msw

  # Create test config files
```

**파일 생성:**
- `jest.config.js`
- `jest.setup.js`
- `playwright.config.ts`
- `mocks/handlers.ts`
- `mocks/server.ts`

#### 3.2.3 Git 설정

```bash
git init
git add .
git commit -m "Initial project setup"

# Create .gitignore
cat > .gitignore << EOF
node_modules
.next
.env.local
*.log
.vercel
coverage
playwright-report
EOF
```

### 3.3 Checkpoint 1: 개발 준비 완료

#### 검증 항목
- [ ] `npm run dev` 성공 (http://localhost:3000 접속 가능)
- [ ] `npm run build` 성공 (에러 없이 빌드 완료)
- [ ] `npm test` 실행 가능 (아직 테스트 없어도 OK)
- [ ] `npx playwright test` 실행 가능
- [ ] `.env.local`에 GEMINI_API_KEY 설정됨
- [ ] Git 저장소 초기화 완료

#### 통과 기준
**모든 항목이 ✅인 경우 STAGE 2로 진행**

#### 예상 소요 시간
**1 day**

---

## 4. STAGE 2: 핵심 기능 구현

### 4.1 목표
API 통합과 UI 구현을 완료하고 단위 테스트를 작성합니다.

### 4.2 Day 1-2: API 통합 (AGENT_TASK_03_API.md)

#### 4.2.1 구현 작업
```bash
# 파일 생성 순서:
# 1. lib/systemPrompt.txt
# 2. types/api.ts
# 3. lib/gemini.ts
# 4. app/api/chat/route.ts
# 5. lib/errors.ts
```

#### 4.2.2 단위 테스트 작성
```bash
# 테스트 파일:
# - lib/__tests__/gemini.test.ts
# - app/api/chat/__tests__/route.test.ts
```

#### 4.2.3 검증
```bash
# 1. 단위 테스트 실행
npm test

# 2. API 수동 테스트
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "history": []}'

# 3. 브라우저 콘솔 테스트
# (AGENT_TASK_03_API.md의 테스트 코드 실행)
```

#### 4.2.4 완료 기준
- [ ] `loadSystemPrompt()` 함수 작동
- [ ] `convertHistoryToGeminiFormat()` 테스트 통과
- [ ] POST /api/chat 200 응답 (SSE 스트림)
- [ ] 에러 핸들링 (400, 500) 동작
- [ ] 단위 테스트 커버리지 >= 80%

---

### 4.3 Day 3-5: UI 구현 (AGENT_TASK_04_UI_COMPONENTS.md)

#### 4.3.1 구현 순서
```bash
# Day 3: 기본 컴포넌트
# 1. lib/utils.ts (formatTime)
# 2. components/chat/ChatHeader.tsx
# 3. components/chat/ChatMessage.tsx
# 4. components/chat/ChatInput.tsx

# Day 4: 메인 로직
# 5. components/chat/ChatContainer.tsx
# 6. app/page.tsx (ChatContainer 렌더링)
# 7. app/layout.tsx (폰트, 메타데이터)
# 8. app/globals.css (KakaoTalk 스타일)

# Day 5: 스타일 완성 및 테스트
# 9. Tailwind 색상 조정
# 10. 애니메이션 추가
# 11. 반응형 디자인
```

#### 4.3.2 단위 테스트 작성
```bash
# 테스트 파일:
# - components/chat/__tests__/ChatHeader.test.tsx
# - components/chat/__tests__/ChatMessage.test.tsx
# - components/chat/__tests__/ChatInput.test.tsx
# - lib/__tests__/utils.test.ts
```

#### 4.3.3 시각적 검증
- [ ] 사용자 메시지: 노란색 배경, 우측 정렬
- [ ] 봇 메시지: 흰색 배경, 좌측 정렬, 아바타
- [ ] 시간 형식: "오후 8:08"
- [ ] 스트리밍 중 타이핑 인디케이터 표시
- [ ] 자동 스크롤 작동
- [ ] 모바일 화면에서 레이아웃 정상

#### 4.3.4 완료 기준
- [ ] 모든 컴포넌트 렌더링 테스트 통과
- [ ] Enter로 메시지 전송 작동
- [ ] Shift+Enter로 줄바꿈 작동
- [ ] 빈 메시지 전송 방지
- [ ] 단위 테스트 커버리지 >= 75%

---

### 4.4 Day 6-7: 통합 테스트 및 버그 수정

#### 4.4.1 통합 테스트 작성
```typescript
// components/chat/__tests__/ChatContainer.integration.test.tsx
// - 메시지 전송 → 스트리밍 응답 플로우
// - API 에러 처리
// - 네트워크 실패 처리
```

#### 4.4.2 버그 수정 및 리팩토링
- [ ] 발견된 버그 수정
- [ ] 코드 리뷰 피드백 반영
- [ ] ESLint 경고 제거
- [ ] 불필요한 코드 제거

#### 4.4.3 완료 기준
- [ ] `npm run lint` 0 errors/warnings
- [ ] `npm run build` 성공
- [ ] `npm test` 모든 테스트 통과
- [ ] 통합 테스트 커버리지 >= 70%

### 4.5 Checkpoint 2: 핵심 기능 완료

#### 검증 항목
- [ ] API 스트리밍 정상 작동
- [ ] UI 컴포넌트 모두 렌더링
- [ ] 메시지 전송/수신 플로우 완전 작동
- [ ] 단위 + 통합 테스트 >= 75% 커버리지
- [ ] Lighthouse Performance >= 80 (임시 목표)

#### 통과 기준
**모든 항목이 ✅인 경우 STAGE 3으로 진행**

#### 예상 소요 시간
**7 days**

---

## 5. STAGE 3: 통합 및 최적화

### 5.1 목표
localStorage 통합, 성능 최적화, 에러 처리 강화

### 5.2 Day 1-2: Storage 통합 (AGENT_TASK_06_STORAGE.md)

#### 5.2.1 구현 작업
```bash
# 파일 생성:
# 1. lib/storage.ts (ChatStorage class)
# 2. hooks/useChat.ts
# 3. components/chat/ChatContainer.tsx 업데이트 (useChat 사용)
```

#### 5.2.2 기능 구현
- [ ] ChatStorage.createSession()
- [ ] ChatStorage.addMessage()
- [ ] ChatStorage.updateMessage()
- [ ] ChatStorage.enforceStorageLimit()
- [ ] ChatStorage.cleanup()
- [ ] useChat hook with localStorage 동기화

#### 5.2.3 단위 테스트
```bash
# lib/__tests__/storage.test.ts
# - Session CRUD 테스트
# - Storage limit 테스트
# - QuotaExceededError 처리 테스트
```

#### 5.2.4 검증
- [ ] 메시지 전송 후 localStorage에 저장됨
- [ ] 페이지 새로고침 후 메시지 유지
- [ ] 20개 세션 제한 작동
- [ ] 세션당 100개 메시지 제한 작동
- [ ] 5MB 초과 시 자동 정리

---

### 5.3 Day 3: 에러 처리 강화 (ERROR_RECOVERY.md)

#### 5.3.1 구현 작업
```bash
# 파일 생성/수정:
# 1. hooks/useNetworkStatus.ts
# 2. components/ui/OfflineBanner.tsx
# 3. components/ErrorBoundary.tsx
# 4. lib/fetchWithTimeout.ts
# 5. app/api/chat/route.ts (에러 처리 강화)
```

#### 5.3.2 에러 시나리오 구현
- [ ] 네트워크 오프라인 감지 및 배너
- [ ] API 타임아웃 (30초)
- [ ] Gemini API 401 (인증 실패)
- [ ] Gemini API 429 (Rate limit)
- [ ] Gemini API 500 (서비스 에러)
- [ ] localStorage QuotaExceededError
- [ ] Component crash (Error Boundary)

#### 5.3.3 검증
```bash
# 수동 테스트:
# 1. 네트워크 끄기 → 배너 표시
# 2. API 키 잘못 설정 → 401 에러 메시지
# 3. localStorage 가득 채우기 → 자동 정리
# 4. 컴포넌트에서 throw Error → Error Boundary
```

---

### 5.4 Day 4: 성능 최적화

#### 5.4.1 최적화 작업
```bash
# 1. 컴포넌트 메모이제이션
# - ChatMessage를 React.memo()로 감싸기
# - useCallback으로 함수 메모이제이션

# 2. 스트리밍 최적화
# - updateMessage debouncing (100ms)
# - 배치 렌더링

# 3. 번들 크기 최적화
# - dynamic import 적용 (필요 시)
# - next/image 사용
```

#### 5.4.2 성능 측정
```bash
# Lighthouse 실행
npm run build
npm start
npx lighthouse http://localhost:3000 --view

# Bundle 분석
ANALYZE=true npm run build
```

#### 5.4.3 목표
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] JS Bundle < 200KB (gzipped)

### 5.5 Checkpoint 3: 통합 완료

#### 검증 항목
- [ ] localStorage 통합 완료
- [ ] 모든 에러 시나리오 처리
- [ ] Lighthouse Performance >= 85
- [ ] 테스트 커버리지 >= 80%

#### 통과 기준
**모든 항목이 ✅인 경우 STAGE 4로 진행**

#### 예상 소요 시간
**3-4 days**

---

## 6. STAGE 4: 테스트 및 검증

### 6.1 목표
E2E 테스트 작성, 보안 검증, 최종 QA

### 6.2 Day 1: E2E 테스트 (TEST_SPECIFICATIONS.md)

#### 6.2.1 Playwright 테스트 작성
```bash
# e2e/chat-flow.spec.ts
# - 메시지 전송 및 수신 플로우
# - 메시지 persistent 테스트
# - 키보드 네비게이션 테스트

# e2e/accessibility.spec.ts
# - ARIA labels 확인
# - 키보드 전용 네비게이션

# e2e/security.spec.ts
# - API 키 노출 검증
```

#### 6.2.2 E2E 테스트 실행
```bash
# Headless 모드
npx playwright test

# UI 모드 (디버깅)
npx playwright test --ui

# 특정 브라우저만
npx playwright test --project=chromium
```

#### 6.2.3 완료 기준
- [ ] 모든 E2E 테스트 통과
- [ ] Chromium, Firefox, WebKit 모두 통과

---

### 6.3 Day 2: 보안 및 성능 테스트

#### 6.3.1 보안 테스트
```bash
# 1. Dependency 취약점 스캔
npm audit --audit-level=high

# 2. API 키 노출 검증
# - 브라우저 DevTools에서 확인
# - Network 탭에서 요청 확인
# - localStorage/sessionStorage 확인

# 3. CSP 검증
# - next.config.js 헤더 확인
# - 브라우저 Console에서 CSP 위반 확인
```

#### 6.3.2 성능 테스트
```bash
# 1. Lighthouse CI
npx lighthouse-ci autorun

# 2. Bundle 크기 확인
npm run build
ls -lh .next/static/**/*.js

# 3. Load testing (Optional)
# - Artillery or k6로 부하 테스트
```

#### 6.3.3 완료 기준
- [ ] npm audit: 0 high/critical vulnerabilities
- [ ] API 키 노출 없음
- [ ] Lighthouse Performance >= 90
- [ ] Lighthouse Accessibility >= 95

---

### 6.4 Day 3: QA 및 버그 수정

#### 6.4.1 QA 체크리스트

**기능 테스트:**
- [ ] 메시지 전송/수신 정상
- [ ] 스트리밍 응답 정상
- [ ] 대화 히스토리 저장/로드
- [ ] 세션 생성/삭제
- [ ] 에러 처리 (모든 시나리오)

**UI/UX 테스트:**
- [ ] KakaoTalk 스타일 일치
- [ ] 모바일 반응형 정상
- [ ] 다크모드 (미구현 시 Skip)
- [ ] 접근성 (키보드, 스크린 리더)

**브라우저 호환성:**
- [ ] Chrome >= 90
- [ ] Firefox >= 88
- [ ] Safari >= 14
- [ ] Edge >= 90

#### 6.4.2 버그 수정
- [ ] 발견된 모든 버그 수정
- [ ] 회귀 테스트 실행
- [ ] 최종 코드 리뷰

### 6.5 Checkpoint 4: 테스트 완료

#### 검증 항목
- [ ] 모든 E2E 테스트 통과
- [ ] 보안 검증 완료
- [ ] 성능 목표 달성
- [ ] QA 체크리스트 100% 완료
- [ ] 테스트 커버리지 >= 80%

#### 통과 기준
**모든 항목이 ✅인 경우 STAGE 5로 진행**

#### 예상 소요 시간
**2-3 days**

---

## 7. STAGE 5: 배포 및 모니터링

### 7.1 목표
프로덕션 배포 및 모니터링 설정

### 7.2 Day 1: 최종 폴리싱 (AGENT_TASK_10_OPTIMIZATION.md)

#### 7.2.1 Vercel 배포
```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 링크
vercel link

# 4. 환경 변수 설정
vercel env add GEMINI_API_KEY

# 5. 프로덕션 배포
vercel --prod
```

#### 7.2.2 배포 후 검증
```bash
# 1. 배포된 URL 접속
# https://your-app.vercel.app

# 2. Smoke test
# - 메시지 전송 테스트
# - 스트리밍 응답 확인
# - 새로고침 후 데이터 유지 확인

# 3. Lighthouse 프로덕션 테스트
npx lighthouse https://your-app.vercel.app --view
```

#### 7.2.3 완료 기준
- [ ] Vercel 배포 성공
- [ ] HTTPS 접속 가능
- [ ] 모든 기능 정상 작동
- [ ] Lighthouse 점수 목표 달성

---

### 7.3 Day 2: 모니터링 및 최종 검증

#### 7.3.1 모니터링 설정
```bash
# 1. Vercel Analytics 활성화
# Vercel Dashboard → Analytics 탭

# 2. Error tracking (Optional)
# - Sentry 설정
# - 에러 알림 설정

# 3. Uptime monitoring (Optional)
# - UptimeRobot or Pingdom
```

#### 7.3.2 최종 검증
- [ ] 프로덕션 환경에서 모든 기능 테스트
- [ ] 모니터링 대시보드 확인
- [ ] 에러 추적 동작 확인
- [ ] 사용자 문서 작성 (README.md)

#### 7.3.3 릴리스 노트 작성
```markdown
# v1.0.0 Release Notes

## Features
- Gemini API 기반 AI 챗봇
- KakaoTalk 스타일 UI
- 실시간 스트리밍 응답
- localStorage 기반 대화 히스토리

## Tech Stack
- Next.js 14, TypeScript, Tailwind CSS
- Google Gemini API

## Known Issues
- (있다면 기재)

## Future Roadmap
- 다국어 지원
- 음성 입력
- 코드 실행 환경
```

### 7.4 Checkpoint 5: 배포 완료

#### 검증 항목
- [ ] 프로덕션 배포 완료
- [ ] 모니터링 설정 완료
- [ ] 사용자 문서 작성 완료
- [ ] 릴리스 노트 작성 완료
- [ ] 모든 이해관계자에게 공지

#### 통과 기준
**모든 항목이 ✅인 경우 프로젝트 완료**

#### 예상 소요 시간
**1-2 days**

---

## 8. 리스크 관리

### 8.1 주요 리스크

| 리스크 | 확률 | 영향 | 대응 전략 |
|-------|------|------|----------|
| Gemini API 할당량 초과 | Medium | High | Rate limiting 구현, 백업 API 키 |
| localStorage 브라우저 호환성 | Low | Medium | 폴백 메커니즘 (in-memory) |
| 성능 목표 미달성 | Medium | High | 조기 최적화, 번들 크기 모니터링 |
| 테스트 커버리지 부족 | Medium | Medium | 매일 커버리지 확인, 우선순위 조정 |
| 일정 지연 | High | High | Buffer 추가 (20%), 범위 조정 |

### 8.2 대응 계획

#### Gemini API 할당량 초과
- **예방:** 클라이언트 사이드 throttling (60 req/min)
- **감지:** 429 응답 모니터링
- **복구:** 백업 API 키 자동 전환 (환경 변수)

#### 성능 목표 미달성
- **예방:** 매일 Lighthouse 실행
- **조기 경보:** Performance < 80 시 알림
- **조치:** 번들 분석, dynamic import, 이미지 최적화

#### 일정 지연
- **예방:** 매일 진척도 체크
- **완화:** 필수 기능 우선 (MoSCoW 우선순위)
- **조정:** 범위 축소 또는 일정 연장 협의

---

## 9. 성공 기준

### 9.1 Technical Success Criteria

- [x] 모든 기능 요구사항 (FR-001 ~ FR-007) 구현 완료
- [x] 모든 비기능 요구사항 (NFR-001 ~ NFR-006) 달성
- [x] 테스트 커버리지 >= 80%
- [x] Lighthouse Performance >= 90
- [x] Lighthouse Accessibility >= 95
- [x] 0 high/critical security vulnerabilities
- [x] 프로덕션 배포 완료

### 9.2 Business Success Criteria

- [x] 사용자가 메시지를 보내고 응답을 받을 수 있음
- [x] 응답 시간 < 2초 (첫 청크)
- [x] 대화 히스토리 유지
- [x] 모바일 접근 가능
- [x] 사용자 문서 제공

---

## 10. Post-Launch 계획

### 10.1 Week 1: 모니터링 집중
- [ ] 에러율 모니터링 (목표: < 1%)
- [ ] 응답 시간 모니터링 (P95 < 5s)
- [ ] 사용자 피드백 수집
- [ ] 핫픽스 준비 (24시간 대응)

### 10.2 Week 2-4: 안정화
- [ ] 버그 수정
- [ ] 성능 튜닝
- [ ] 사용자 요청 기능 검토
- [ ] 문서 업데이트

### 10.3 Future Enhancements
- [ ] 다국어 지원 (i18n)
- [ ] 음성 입력
- [ ] 코드 실행 환경
- [ ] 대화 공유 기능
- [ ] 다크 모드

---

## 11. 연락처 및 에스컬레이션

### 11.1 팀 역할

| 역할 | 담당자 | 연락처 |
|-----|-------|-------|
| Tech Lead | TBD | - |
| Frontend Dev | TBD | - |
| Backend Dev | TBD | - |
| QA Engineer | TBD | - |
| Product Owner | TBD | - |

### 11.2 에스컬레이션 경로
1. **Level 1:** 팀 내 해결 (개발자 간)
2. **Level 2:** Tech Lead 에스컬레이션
3. **Level 3:** Product Owner + Management

---

## 12. 참고 문서

- `REQUIREMENTS.md` - 요구사항 명세
- `TECHSPEC.md` - 기술 사양
- `API_CONTRACT.yaml` - API 계약
- `TEST_SPECIFICATIONS.md` - 테스트 명세
- `ERROR_RECOVERY.md` - 에러 복구 전략
- `AGENT_TASK_01_SETUP.md` ~ `AGENT_TASK_10_OPTIMIZATION.md` - 구현 가이드
- `CLAUDE.md` - 프로젝트 컨텍스트

---

**문서 종료**

**프로젝트 시작 준비 완료 ✅**
