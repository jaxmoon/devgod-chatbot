# Agent Task Overview
## 멀티 에이전트 작업 분할 가이드

**문서 버전:** 1.0
**작성일:** 2025-01-30
**목적:** 각 에이전트가 독립적으로 작업할 수 있도록 충분한 컨텍스트 제공

---

## 1. 프로젝트 컨텍스트

### 1.1 프로젝트 정보
- **이름:** 개발의신 챗봇
- **기술 스택:** Next.js 14, TypeScript, Tailwind CSS, Gemini API
- **목표:** 소프트웨어 개발 Q&A를 위한 KakaoTalk 스타일 AI 챗봇

### 1.2 핵심 아키텍처
```
사용자 브라우저 (React)
    ↓ HTTPS
Vercel (Next.js)
    ├─ /api/chat (SSE Streaming)
    └─ Static Assets
        ↓
    Gemini API (Google)
```

### 1.3 디렉토리 구조
```
chatbot/
├── docs/
│   ├── REQUIREMENTS.md          # FR/NFR 요구사항
│   ├── TECHSPEC.md              # 기술 사양
│   ├── API_CONTRACT.yaml        # API 명세
│   ├── TEST_SPECIFICATIONS.md   # 테스트 명세
│   ├── ERROR_RECOVERY.md        # 에러 처리
│   ├── EXECUTION_PLAN.md        # 전체 실행 계획
│   └── tasks/                   # 에이전트별 작업 (이 디렉토리)
├── app/                        # Next.js App Router
│   ├── api/chat/               # Gemini API 엔드포인트
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── chat/                   # 채팅 UI 컴포넌트
│   └── ui/                     # 공용 UI 컴포넌트
├── lib/                        # 비즈니스 로직
│   ├── gemini.ts               # Gemini 클라이언트
│   ├── storage.ts              # localStorage 관리
│   └── utils.ts
├── hooks/                      # React Hooks
├── types/                      # TypeScript 타입
├── mocks/                      # 테스트용 핸들러
├── tests/                      # 테스트 코드
└── package.json
```

---

## 2. 작업 분할 전략

### 2.1 에이전트별 작업 분류

| Agent ID | 작업 영역 | 주요 파일 | 예상 소요 |
|---------|----------|----------|----------|
| **AGENT_01** | 프로젝트 초기 설정 | package.json, configs | 0.5일 |
| **AGENT_02** | 타입 정의 및 유틸리티 | types/, lib/utils.ts | 0.5일 |
| **AGENT_03** | Gemini API 통합 | lib/gemini.ts, api/chat/ | 1일 |
| **AGENT_04** | 기본 UI 컴포넌트 | ChatHeader, ChatMessage, ChatInput | 1.5일 |
| **AGENT_05** | 메인 컨테이너 로직 | ChatContainer, 스트리밍 | 1일 |
| **AGENT_06** | Storage 및 Hook | lib/storage.ts, hooks/useChat.ts | 1일 |
| **AGENT_07** | 에러 처리 및 복구 | ErrorBoundary, 에러 핸들링 | 1일 |
| **AGENT_08** | 테스트 작성 (Unit) | __tests__/ 단위 테스트 | 1.5일 |
| **AGENT_09** | 테스트 작성 (E2E) | e2e/ Playwright 테스트 | 1일 |
| **AGENT_10** | 성능 최적화 | 번들 최적화, 메모이제이션 | 0.5일 |

### 2.2 의존성 그래프

```
AGENT_01 (Setup)
    ↓
AGENT_02 (Types) ──────┐
    ↓                  ↓
AGENT_03 (API) ────→ AGENT_05 (Container)
    ↓                  ↑
AGENT_04 (UI) ─────────┘
    ↓
AGENT_06 (Storage) ────→ AGENT_05
    ↓
AGENT_07 (Error Handling)
    ↓
AGENT_08 (Unit Tests)
AGENT_09 (E2E Tests)
    ↓
AGENT_10 (Optimization)
```

### 2.3 병렬 작업 가능 구간

**Phase 1 (Setup):**
- AGENT_01 (단독)

**Phase 2 (Foundation):**
- AGENT_02, AGENT_03 (병렬 가능)

**Phase 3 (Implementation):**
- AGENT_04, AGENT_06 (병렬 가능)
- AGENT_03 완료 후 → AGENT_05

**Phase 4 (Integration):**
- AGENT_05 완료 후 → AGENT_07

**Phase 5 (Testing):**
- AGENT_08, AGENT_09 (병렬 가능)

**Phase 6 (Polish):**
- AGENT_10 (단독)

---

## 3. 각 에이전트 작업 파일

각 에이전트는 다음 파일을 참조합니다:

1. **AGENT_TASK_01_SETUP.md** - 프로젝트 초기 설정
2. **AGENT_TASK_02_TYPES.md** - 타입 정의 및 유틸리티
3. **AGENT_TASK_03_API.md** - Gemini API 통합
4. **AGENT_TASK_04_UI_COMPONENTS.md** - 기본 UI 컴포넌트
5. **AGENT_TASK_05_CONTAINER.md** - 메인 컨테이너 로직
6. **AGENT_TASK_06_STORAGE.md** - Storage 및 Hook
7. **AGENT_TASK_07_ERROR.md** - 에러 처리
8. **AGENT_TASK_08_UNIT_TESTS.md** - 단위 테스트
9. **AGENT_TASK_09_E2E_TESTS.md** - E2E 테스트
10. **AGENT_TASK_10_OPTIMIZATION.md** - 성능 최적화

---

## 4. 에이전트 작업 프로토콜

### 4.1 작업 시작 전 체크리스트

각 에이전트는 작업 시작 전 다음을 확인:

- [ ] 의존 에이전트 작업 완료 여부 확인
- [ ] 필요한 파일이 존재하는지 확인
- [ ] 환경 변수 설정 확인 (GEMINI_API_KEY 등)
- [ ] 이전 에이전트가 남긴 TODO 주석 확인

### 4.2 작업 완료 후 체크리스트

- [ ] 모든 파일 생성/수정 완료
- [ ] ESLint 에러 없음 (`npm run lint`)
- [ ] 빌드 성공 (`npm run build`)
- [ ] 해당 작업의 테스트 통과 (있는 경우)
- [ ] 다음 에이전트를 위한 TODO 주석 추가 (필요 시)
- [ ] HANDOFF 문서 작성

### 4.3 Handoff 문서 형식

각 에이전트는 작업 완료 후 `docs/tasks/handoffs/AGENT_0X_HANDOFF.md` 생성:

```markdown
# Agent 0X Handoff

## Completed
- [x] 파일 A 생성
- [x] 파일 B 수정
- [x] 테스트 통과

## Created Files
- components/chat/ChatHeader.tsx
- lib/gemini.ts

## Modified Files
- package.json (added dependencies)

## Known Issues
- None / 또는 이슈 설명

## Next Agent Notes
- Agent 0Y should check [specific item]
- Environment variable X needs to be set
```

---

## 5. 공통 참조 문서

모든 에이전트는 다음 문서를 참조할 수 있습니다:

### 5.1 필수 참조
- `REQUIREMENTS.md` - 요구사항 확인
- `TECHSPEC.md` - 기술 구현 세부사항
- `API_CONTRACT.yaml` - API 스펙 (AGENT_03, 05)

### 5.2 선택 참조
- `TEST_SPECIFICATIONS.md` - 테스트 작성 시
- `ERROR_RECOVERY.md` - 에러 처리 구현 시
- `EXECUTION_PLAN.md` - 전체 흐름 파악

---

## 6. 컨텍스트 최적화 가이드

### 6.1 각 에이전트 작업 파일 구조

```markdown
# Agent Task 0X: [작업명]

## 1. Context (이 에이전트만의 컨텍스트)
- 이전 에이전트 완료 사항
- 현재 작업의 목표
- 관련 요구사항 (FR-XXX)

## 2. Prerequisites (선행 조건)
- 필요한 파일/패키지
- 의존 에이전트 작업

## 3. Input (입력 정보)
- 이전 에이전트로부터 받은 파일
- 설정 값
- 환경 변수

## 4. Task Details (상세 작업)
- Step-by-step 구현 가이드
- 완전한 코드 예제
- 설정 파일

## 5. Output (산출물)
- 생성할 파일 목록
- 수정할 파일 목록

## 6. Verification (검증)
- 자동 검증 (lint, build, test)
- 수동 검증 체크리스트

## 7. Handoff (다음 에이전트)
- 다음 에이전트 ID
- 전달 사항
```

### 6.2 컨텍스트 크기 제한

- **각 작업 파일:** < 2000 라인
- **코드 예제:** 완전하고 실행 가능
- **외부 참조:** 최소화 (핵심 정보만 인라인)

---

## 7. 실행 순서

### 7.1 Sequential Execution (순차 실행)

```bash
# Phase 1: Setup
Agent 01 실행 → 완료 → Handoff

# Phase 2: Foundation (병렬 가능)
Agent 02 실행 ┐
Agent 03 실행 ┴→ 완료 → Handoff

# Phase 3: UI & Storage (병렬 가능)
Agent 04 실행 ┐
Agent 06 실행 ┴→ 완료 → Handoff

# Phase 4: Integration
Agent 05 실행 → 완료 → Handoff

# Phase 5: Error Handling
Agent 07 실행 → 완료 → Handoff

# Phase 6: Testing (병렬 가능)
Agent 08 실행 ┐
Agent 09 실행 ┴→ 완료 → Handoff

# Phase 7: Optimization
Agent 10 실행 → 완료 → 프로젝트 완료
```

### 7.2 Parallel Execution (병렬 실행)

병렬 실행 가능한 에이전트 조합:
- **Phase 2:** Agent 02 + Agent 03
- **Phase 3:** Agent 04 + Agent 06
- **Phase 6:** Agent 08 + Agent 09

---

## 8. 트러블슈팅

### 8.1 에이전트 간 충돌

**문제:** 두 에이전트가 같은 파일을 수정
**해결:**
1. 의존성 그래프 확인
2. 먼저 완료된 에이전트 결과 우선
3. Git diff로 충돌 확인 후 수동 병합

### 8.2 의존성 미충족

**문제:** 필요한 파일이 없음
**해결:**
1. Handoff 문서에서 선행 에이전트 확인
2. 해당 에이전트 재실행 또는 파일 수동 생성
3. Prerequisites 체크리스트 재확인

### 8.3 테스트 실패

**문제:** 에이전트 작업 후 테스트 실패
**해결:**
1. 해당 에이전트 작업 파일의 Verification 섹션 확인
2. 테스트 로그 분석
3. 필요 시 이전 에이전트 결과물 확인

---

## 9. 성공 기준

### 9.1 각 에이전트 성공 조건

- ✅ 모든 파일 생성/수정 완료
- ✅ `npm run lint` 통과
- ✅ `npm run build` 통과
- ✅ 해당 작업의 단위 테스트 통과 (있는 경우)
- ✅ Handoff 문서 작성

### 9.2 전체 프로젝트 성공 조건

- ✅ 모든 10개 에이전트 작업 완료
- ✅ 전체 테스트 suite 통과 (커버리지 >= 80%)
- ✅ E2E 테스트 통과
- ✅ Lighthouse Performance >= 90
- ✅ 프로덕션 배포 성공

---

## 10. 다음 단계

1. **각 에이전트 작업 파일 읽기:** `AGENT_TASK_01_SETUP.md`부터 시작
2. **의존성 확인:** 선행 에이전트 작업 완료 여부
3. **작업 실행:** Step-by-step 가이드 따라하기
4. **검증:** Verification 섹션 체크
5. **Handoff:** 다음 에이전트에게 작업 전달

---

**에이전트 작업 시작 준비 완료 ✅**

다음 파일: `AGENT_TASK_01_SETUP.md`
