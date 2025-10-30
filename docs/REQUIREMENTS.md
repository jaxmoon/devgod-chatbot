# Requirements Specification
## 개발의신 챗봇 요구사항 명세서

**문서 버전:** 1.0
**작성일:** 2025-01-30
**프로젝트:** 개발의신 - Gemini API 기반 개발 Q&A 챗봇

---

## 1. 프로젝트 개요

### 1.1 목적
소프트웨어 개발자를 위한 AI 기반 Q&A 챗봇을 구축하여 프로그래밍 관련 질문에 즉각적이고 정확한 답변을 제공한다.

### 1.2 범위
- Google Gemini API를 활용한 대화형 인터페이스
- KakaoTalk 스타일의 친숙한 UI/UX
- 브라우저 localStorage 기반 대화 히스토리 관리
- 실시간 스트리밍 응답

### 1.3 대상 사용자
- 소프트웨어 개발자 (주니어~시니어)
- 프로그래밍 학습자
- 기술 블로그 작성자

---

## 2. 기능 요구사항 (Functional Requirements)

### FR-001: 메시지 전송
**우선순위:** Critical
**설명:** 사용자는 텍스트 메시지를 입력하고 전송할 수 있어야 한다.

**상세 요구사항:**
- FR-001-1: 사용자는 1~4000자의 텍스트를 입력할 수 있다
- FR-001-2: Enter 키로 메시지를 전송할 수 있다
- FR-001-3: Shift+Enter로 줄바꿈을 입력할 수 있다
- FR-001-4: 빈 메시지는 전송되지 않는다
- FR-001-5: 전송 중에는 입력창이 비활성화된다

**검증 방법:**
- 수동 테스트: 다양한 길이의 메시지 전송
- E2E 테스트: `e2e/message-sending.spec.ts`

**추적:**
- 구현: `components/chat/ChatInput.tsx`
- 테스트: `TEST_SPECIFICATIONS.md` TC-001

---

### FR-002: AI 응답 수신
**우선순위:** Critical
**설명:** 사용자는 Gemini API로부터 실시간 스트리밍 응답을 받아야 한다.

**상세 요구사항:**
- FR-002-1: 응답은 실시간으로 스트리밍되어야 한다
- FR-002-2: 첫 응답 청크는 2초 이내에 도착해야 한다
- FR-002-3: 스트리밍 중 타이핑 인디케이터가 표시되어야 한다
- FR-002-4: 응답 완료 시 타이핑 인디케이터가 사라져야 한다
- FR-002-5: 응답은 30초 내에 완료되어야 한다

**검증 방법:**
- 성능 테스트: 응답 시간 측정
- E2E 테스트: 스트리밍 플로우 검증

**추적:**
- 구현: `app/api/chat/route.ts`, `components/chat/ChatContainer.tsx`
- 테스트: `TEST_SPECIFICATIONS.md` TC-002

---

### FR-003: 대화 히스토리 표시
**우선순위:** High
**설명:** 사용자와 봇의 이전 대화 내역이 화면에 표시되어야 한다.

**상세 요구사항:**
- FR-003-1: 사용자 메시지는 우측 정렬, 노란색(#FAE100) 배경
- FR-003-2: 봇 메시지는 좌측 정렬, 흰색(#FFFFFF) 배경
- FR-003-3: 각 메시지는 전송 시간을 "오후 8:08" 형식으로 표시
- FR-003-4: 봇 메시지에는 프로필 아이콘과 "개발의신" 이름 표시
- FR-003-5: 새 메시지 추가 시 자동으로 최하단으로 스크롤

**검증 방법:**
- Visual regression test
- E2E 테스트: 메시지 정렬 및 스타일 검증

**추적:**
- 구현: `components/chat/ChatMessage.tsx`
- 테스트: `TEST_SPECIFICATIONS.md` TC-003

---

### FR-004: 대화 히스토리 저장
**우선순위:** High
**설명:** 대화 내역은 브라우저 localStorage에 자동 저장되어야 한다.

**상세 요구사항:**
- FR-004-1: 모든 메시지는 localStorage에 실시간 저장
- FR-004-2: 페이지 새로고침 후에도 대화 내역 유지
- FR-004-3: 최대 20개 세션, 세션당 100개 메시지 저장
- FR-004-4: 저장 용량 5MB 초과 시 가장 오래된 세션부터 자동 삭제
- FR-004-5: 브라우저 시크릿 모드에서도 세션 동안 대화 유지

**검증 방법:**
- 단위 테스트: `lib/storage.test.ts`
- E2E 테스트: 페이지 새로고침 후 데이터 확인

**추적:**
- 구현: `lib/storage.ts`, `hooks/useChat.ts`
- 테스트: `TEST_SPECIFICATIONS.md` TC-004

---

### FR-005: 세션 관리
**우선순위:** Medium
**설명:** 사용자는 여러 대화 세션을 생성하고 관리할 수 있어야 한다.

**상세 요구사항:**
- FR-005-1: 새 세션을 생성할 수 있다
- FR-005-2: 세션 간 전환이 가능하다
- FR-005-3: 세션 제목은 첫 메시지 내용(30자)으로 자동 설정
- FR-005-4: 세션을 삭제할 수 있다
- FR-005-5: 활성 세션이 표시되어야 한다

**검증 방법:**
- 수동 테스트: 세션 생성/전환/삭제
- E2E 테스트: 세션 관리 플로우

**추적:**
- 구현: `lib/storage.ts` (createSession, switchSession, deleteSession)
- 테스트: `TEST_SPECIFICATIONS.md` TC-005

---

### FR-006: 마크다운 렌더링
**우선순위:** Medium
**설명:** 봇의 응답은 마크다운 형식으로 렌더링되어야 한다.

**상세 요구사항:**
- FR-006-1: 코드 블록은 구문 강조되어야 한다
- FR-006-2: 인라인 코드는 회색 배경으로 표시
- FR-006-3: 링크는 클릭 가능하며 새 탭에서 열린다
- FR-006-4: 제목(#, ##, ###)은 적절한 크기로 표시
- FR-006-5: 순서/비순서 목록 지원

**검증 방법:**
- Visual test: 다양한 마크다운 요소 렌더링 확인
- 단위 테스트: 마크다운 파서 테스트

**추적:**
- 구현: `components/chat/ChatMessage.tsx` (react-markdown)
- 테스트: `TEST_SPECIFICATIONS.md` TC-006

---

### FR-007: 컨텍스트 유지
**우선순위:** High
**설명:** Gemini API 호출 시 최근 대화 히스토리를 컨텍스트로 전달해야 한다.

**상세 요구사항:**
- FR-007-1: 최근 10개 메시지를 컨텍스트로 전달
- FR-007-2: 사용자/봇 역할을 Gemini 형식으로 변환 (user/model)
- FR-007-3: 컨텍스트가 너무 길면 자동으로 요약 또는 제한
- FR-007-4: 시스템 프롬프트는 모든 요청에 포함

**검증 방법:**
- 통합 테스트: API 요청 페이로드 검증
- E2E 테스트: 연속 대화에서 컨텍스트 유지 확인

**추적:**
- 구현: `lib/gemini.ts` (convertHistoryToGeminiFormat)
- 테스트: `TEST_SPECIFICATIONS.md` TC-007

---

## 3. 비기능 요구사항 (Non-Functional Requirements)

### NFR-001: 성능
**카테고리:** Performance
**우선순위:** High

**요구사항:**
- NFR-001-1: **LCP (Largest Contentful Paint)** < 2.5초
- NFR-001-2: **FID (First Input Delay)** < 100ms
- NFR-001-3: **CLS (Cumulative Layout Shift)** < 0.1
- NFR-001-4: 첫 응답 청크 도착 < 2초
- NFR-001-5: 초기 페이지 로드 < 1초
- NFR-001-6: JavaScript 번들 크기 < 200KB (gzipped)

**측정 방법:**
- Lighthouse 성능 점수 >= 90
- Vercel Analytics Core Web Vitals
- Custom performance monitoring

**추적:**
- 구현: `next.config.js` (최적화 설정)
- 테스트: `TEST_SPECIFICATIONS.md` TC-PERF-001

---

### NFR-002: 보안
**카테고리:** Security
**우선순위:** Critical

**요구사항:**
- NFR-002-1: GEMINI_API_KEY는 절대 클라이언트에 노출되지 않음
- NFR-002-2: API Rate Limiting: 60 req/min per IP
- NFR-002-3: HTTPS 강제 (프로덕션)
- NFR-002-4: Content Security Policy (CSP) 적용
- NFR-002-5: XSS 방지: 모든 사용자 입력 sanitize
- NFR-002-6: CORS: Same-origin only

**검증 방법:**
- 보안 스캔: `npm audit`
- 침투 테스트: API 키 노출 시도
- CSP 위반 모니터링

**추적:**
- 구현: `app/api/chat/route.ts`, `next.config.js`
- 테스트: `TEST_SPECIFICATIONS.md` TC-SEC-001

---

### NFR-003: 접근성
**카테고리:** Accessibility
**우선순위:** Medium

**요구사항:**
- NFR-003-1: WCAG 2.1 Level AA 준수
- NFR-003-2: 키보드 네비게이션 완전 지원
  - Tab: 다음 요소 포커스
  - Shift+Tab: 이전 요소 포커스
  - Enter: 메시지 전송 (입력창 포커스 시)
  - Escape: 입력 취소
- NFR-003-3: 스크린 리더 호환
- NFR-003-4: 색상 대비비 >= 4.5:1
- NFR-003-5: 텍스트 크기 200%까지 레이아웃 유지

**검증 방법:**
- Lighthouse Accessibility 점수 >= 95
- axe DevTools: 0 violations
- 수동 키보드 네비게이션 테스트
- NVDA/JAWS 스크린 리더 테스트

**추적:**
- 구현: `components/chat/*` (ARIA 속성)
- 테스트: `TEST_SPECIFICATIONS.md` TC-A11Y-001

---

### NFR-004: 호환성
**카테고리:** Compatibility
**우선순위:** Medium

**요구사항:**
- NFR-004-1: **브라우저 지원:**
  - Chrome >= 90
  - Firefox >= 88
  - Safari >= 14
  - Edge >= 90
- NFR-004-2: **모바일 브라우저:**
  - iOS Safari >= 14
  - Chrome Android >= 90
- NFR-004-3: **화면 크기:**
  - 최소: 320px (iPhone SE)
  - 최대: 2560px (QHD 모니터)
- NFR-004-4: localStorage 미지원 브라우저에서 경고 표시

**검증 방법:**
- BrowserStack 크로스 브라우저 테스트
- 반응형 디자인 테스트 (Chrome DevTools)

**추적:**
- 구현: `app/layout.tsx`, `tailwind.config.ts`
- 테스트: `TEST_SPECIFICATIONS.md` TC-COMPAT-001

---

### NFR-005: 확장성
**카테고리:** Scalability
**우선순위:** Low

**요구사항:**
- NFR-005-1: 동시 사용자 1000명 지원 (Vercel Serverless)
- NFR-005-2: API 응답 시간 P95 < 5초
- NFR-005-3: 세션당 메시지 수 제한 없음 (단, localStorage 5MB 내)
- NFR-005-4: Vercel Edge Network로 글로벌 배포

**검증 방법:**
- Load testing: Artillery or k6
- Vercel Analytics 모니터링

**추적:**
- 구현: Vercel 배포 설정
- 테스트: `TEST_SPECIFICATIONS.md` TC-SCALE-001

---

### NFR-006: 유지보수성
**카테고리:** Maintainability
**우선순위:** Medium

**요구사항:**
- NFR-006-1: TypeScript strict mode 활성화
- NFR-006-2: ESLint 규칙 0 warning/error
- NFR-006-3: 코드 커버리지 >= 80%
- NFR-006-4: 모든 함수/컴포넌트에 JSDoc 주석
- NFR-006-5: README.md 업데이트 유지

**검증 방법:**
- `npm run lint` 통과
- Jest coverage report
- SonarQube 분석 (선택)

**추적:**
- 구현: `tsconfig.json`, `.eslintrc.json`
- 테스트: CI/CD 파이프라인

---

## 4. 제약사항 (Constraints)

### C-001: 기술 제약
- Next.js 14 이상 필수 (App Router)
- Node.js 20 이상
- Gemini API 1.5-pro 모델

### C-002: 리소스 제약
- localStorage 최대 5MB
- Gemini API Free Tier: 60 req/min

### C-003: 규정 제약
- 개인정보 수집 없음 (GDPR/CCPA 준수)
- 대화 내역은 사용자 브라우저에만 저장

---

## 5. 가정 (Assumptions)

### A-001: 사용자 환경
- 사용자는 모던 웹 브라우저를 사용한다
- 사용자는 안정적인 인터넷 연결을 보유한다
- 사용자는 JavaScript를 활성화한 상태이다

### A-002: API 가용성
- Gemini API는 99% 가용성을 유지한다
- API 응답 시간은 대부분 5초 이내이다

### A-003: 배포 환경
- Vercel 플랫폼에 배포한다
- HTTPS가 자동으로 제공된다

---

## 6. 요구사항 추적 매트릭스 (Traceability Matrix)

| Requirement ID | Description | Priority | Implementation | Test Case | Status |
|---------------|-------------|----------|----------------|-----------|--------|
| FR-001 | 메시지 전송 | Critical | ChatInput.tsx | TC-001 | ✅ Specified |
| FR-002 | AI 응답 수신 | Critical | api/chat/route.ts | TC-002 | ✅ Specified |
| FR-003 | 대화 히스토리 표시 | High | ChatMessage.tsx | TC-003 | ✅ Specified |
| FR-004 | 대화 히스토리 저장 | High | storage.ts | TC-004 | ✅ Specified |
| FR-005 | 세션 관리 | Medium | storage.ts | TC-005 | ✅ Specified |
| FR-006 | 마크다운 렌더링 | Medium | ChatMessage.tsx | TC-006 | ✅ Specified |
| FR-007 | 컨텍스트 유지 | High | gemini.ts | TC-007 | ✅ Specified |
| NFR-001 | 성능 | High | next.config.js | TC-PERF-001 | ✅ Specified |
| NFR-002 | 보안 | Critical | api/chat/route.ts | TC-SEC-001 | ✅ Specified |
| NFR-003 | 접근성 | Medium | All components | TC-A11Y-001 | ✅ Specified |
| NFR-004 | 호환성 | Medium | layout.tsx | TC-COMPAT-001 | ✅ Specified |
| NFR-005 | 확장성 | Low | Vercel config | TC-SCALE-001 | ✅ Specified |
| NFR-006 | 유지보수성 | Medium | tsconfig.json | CI/CD | ✅ Specified |

---

## 7. 승인 및 변경 이력

### 승인
- **작성자:** Development Team
- **검토자:** Tech Lead
- **승인자:** Product Owner
- **승인일:** 2025-01-30

### 변경 이력

| 버전 | 날짜 | 변경 사항 | 작성자 |
|-----|------|----------|--------|
| 1.0 | 2025-01-30 | 초기 요구사항 명세 작성 | Dev Team |

---

## 8. 참고 문서

- `TECHSPEC.md` - 기술 사양서
- `TEST_SPECIFICATIONS.md` - 테스트 명세서
- `API_CONTRACT.yaml` - API 계약서
- `ERROR_RECOVERY.md` - 에러 복구 전략
- `EXECUTION_PLAN.md` - 실행 계획서