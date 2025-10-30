# Chatbot Project Agent Swarm Executor

챗봇 프로젝트의 `docs/tasks/AGENT_TASK_*.md` 파일들을 Phase별로 효율적으로 실행합니다.

## 📋 실행 지시사항

사용자가 `/chatbot-swarm [phase]`를 실행하면, 다음 단계를 따라주세요:

### 1. Phase 파악
- **인자 없음 또는 `all`**: 모든 Phase를 순차적으로 실행
- **`phase1` ~ `phase6`**: 해당 Phase만 실행

### 2. 해당 Phase의 테스크 파일 읽기

먼저 Read tool을 사용하여 해당 Phase의 모든 AGENT_TASK 파일을 읽어주세요:

**Phase 1: Foundation (순차)**
- `docs/tasks/AGENT_TASK_01_SETUP.md`

**Phase 2: Core Foundation (병렬 가능)**
- `docs/tasks/AGENT_TASK_02_TYPES.md`
- `docs/tasks/AGENT_TASK_03_API.md`

**Phase 3: UI & Storage (병렬 가능)**
- `docs/tasks/AGENT_TASK_04_UI_COMPONENTS.md`
- `docs/tasks/AGENT_TASK_06_STORAGE.md`

**Phase 4: Integration (순차)**
- `docs/tasks/AGENT_TASK_05_CONTAINER.md`
- `docs/tasks/AGENT_TASK_07_ERROR.md`

**Phase 5: Testing (병렬 가능)**
- `docs/tasks/AGENT_TASK_08_UNIT_TESTS.md`
- `docs/tasks/AGENT_TASK_09_E2E_TESTS.md`

**Phase 6: Optimization (순차)**
- `docs/tasks/AGENT_TASK_10_OPTIMIZATION.md`

### 3. Task Tool을 사용하여 Agent 실행

읽은 파일 내용을 바탕으로 적절한 subagent_type과 함께 Task tool을 호출하세요.

#### 병렬 실행 Phase (2, 3, 5)

**IMPORTANT**: 단일 메시지에서 여러 Task tool을 동시에 호출하여 병렬 실행하세요!

**Phase 2 예시:**
```
병렬로 실행:
- Task 1: subagent_type="fullstack-developer"로 AGENT_TASK_02_TYPES.md 내용 실행
- Task 2: subagent_type="backend-developer"로 AGENT_TASK_03_API.md 내용 실행
```

**Phase 3 예시:**
```
병렬로 실행:
- Task 1: subagent_type="frontend-developer"로 AGENT_TASK_04_UI_COMPONENTS.md 내용 실행
- Task 2: subagent_type="fullstack-developer"로 AGENT_TASK_06_STORAGE.md 내용 실행
```

**Phase 5 예시:**
```
병렬로 실행:
- Task 1: subagent_type="test-engineer"로 AGENT_TASK_08_UNIT_TESTS.md 내용 실행
- Task 2: subagent_type="test-engineer"로 AGENT_TASK_09_E2E_TESTS.md 내용 실행
```

#### 순차 실행 Phase (1, 4, 6)

각 테스크를 순서대로 실행하고, 완료 후 다음 테스크를 진행하세요.

### 4. Agent에게 전달할 프롬프트 구조 (Codex 위임 명시)

각 Agent에게 **Codex 실행을 명시적으로 지시**하세요:

```
다음 테스크를 Codex exec를 사용하여 자동 실행해주세요.

IMPORTANT: 이 작업은 복잡하므로 Codex에 위임하여 실행합니다.

==========================================
실행 단계
==========================================

1. 사전 준비
-------------------------------------------
cd /Users/kyungwonmoon/Documents/GitHub/lecture/chatbot

# 현재 상태 백업
git status
git diff > /tmp/before-changes.diff


2. 테스크 파일 생성
-------------------------------------------
cat > /tmp/agent-task-[번호].md << 'EOF'
[여기에 AGENT_TASK_XX_*.md 파일의 전체 내용 포함]
EOF


3. Codex 실행 (macOS 호환)
-------------------------------------------
# Phase별 권장 타임아웃:
# - 간단 (AGENT_01, 02): 1800초 (30분)
# - 중간 (AGENT_03, 06, 07, 10): 3600초 (60분)
# - 복잡 (AGENT_04, 05, 08, 09): 7200초 (120분)

CODEX_EXEC_TIMEOUT=[타임아웃초] codex exec --full-auto \
  --cwd /Users/kyungwonmoon/Documents/GitHub/lecture/chatbot \
  < /tmp/agent-task-[번호].md


4. 실행 후 검증 (필수)
-------------------------------------------
# 변경사항 확인
git status
git diff

# 코드 품질 검증
npm run lint

# 타입 체크
npx tsc --noEmit

# 테스트 실행
npm test

# 빌드 확인
npm run build


5. 문제 발생 시 롤백
-------------------------------------------
# 전체 롤백 (주의!)
git checkout -- .

# 특정 파일만 롤백
git checkout -- src/problem-file.ts


==========================================
실행 요구사항
==========================================

1. 모든 섹션을 순서대로 따라 구현
2. 검증 단계의 모든 체크리스트 완료
3. 실행 가능한 코드 작성
4. 테스트 통과 확인
5. 최종 결과 요약 보고

주의사항:
- 반드시 프로젝트 루트에서 실행 (/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot)
- macOS 환경: timeout 명령어 사용 불가, CODEX_EXEC_TIMEOUT만 사용
- TypeScript strict mode 준수
- 에러 핸들링 구현
- 코드 품질 및 가독성 확보
```

## Phase별 실행 전략

| Phase | 실행 방식 | 타임아웃 | 이유 |
|-------|----------|----------|------|
| 1 | **Codex 위임** | 1800초 (30분) | 설정 작업이지만 자동화 가능 |
| 2 | **Codex 위임** (병렬) | 3600초 (60분) | 복잡한 타입 + API 구현 |
| 3 | **Codex 위임** (병렬) | 7200초 (120분) | 다중 UI 컴포넌트 생성 |
| 4 | **Codex 위임** (순차) | 7200초 (120분) | 통합 작업, 복잡도 높음 |
| 5 | **Codex 위임** (병렬) | 7200초 (120분) | 대량 테스트 코드 생성 |
| 6 | **Codex 위임** | 3600초 (60분) | 최적화 및 번들링 |

### 실행 전략 가이드

**Codex 위임 권장 사유:**
- 복잡한 다중 파일 생성 작업
- 일관된 코드 스타일 적용 필요
- 대량의 보일러플레이트 코드 생성
- 시간 소요가 큰 작업 (30분 이상)

**직접 실행 권장 사유:**
- 단일 파일 간단한 수정
- 빠른 설정 변경 (< 5분)
- 수동 검토가 중요한 작업

## Phase별 Agent 매핑 (최적화)

| Phase | Agent | Task 파일 | Subagent Type | 선택 이유 | Fallback | Codex 타임아웃 |
|-------|-------|----------|---------------|-----------|----------|---------------|
| 1 | AGENT_01 | AGENT_TASK_01_SETUP.md | **devops-engineer** | 프로젝트 인프라 구축 전문 | fullstack-developer | 1800초 |
| 2 | AGENT_02 | AGENT_TASK_02_TYPES.md | **backend-developer** | 타입 시스템 설계 전문 | fullstack-developer | 3600초 |
| 2 | AGENT_03 | AGENT_TASK_03_API.md | **api-architect** | API 설계 및 통합 전문 | backend-developer | 3600초 |
| 3 | AGENT_04 | AGENT_TASK_04_UI_COMPONENTS.md | **ui-ux-specialist** | UI 디자인 구현 전문 | frontend-developer | 7200초 |
| 3 | AGENT_06 | AGENT_TASK_06_STORAGE.md | **fullstack-developer** | 스토리지+Hook 통합 | frontend-developer | 7200초 |
| 4 | AGENT_05 | AGENT_TASK_05_CONTAINER.md | **frontend-developer** | React 상태 관리 전문 | fullstack-developer | 7200초 |
| 4 | AGENT_07 | AGENT_TASK_07_ERROR.md | **security-expert** | 에러 핸들링+보안 전문 | fullstack-developer | 7200초 |
| 5 | AGENT_08 | AGENT_TASK_08_UNIT_TESTS.md | **test-engineer** | 단위 테스트 작성 전문 | general-purpose | 7200초 |
| 5 | AGENT_09 | AGENT_TASK_09_E2E_TESTS.md | **full-stack-orchestration:test-automator** | E2E 자동화 테스트 전문 | test-engineer | 7200초 |
| 6 | AGENT_10 | AGENT_TASK_10_OPTIMIZATION.md | **performance-engineer** | 성능 최적화 전문 | fullstack-developer | 3600초 |

## 실행 순서 및 의존성

```
Phase 1: AGENT_01 (독립 실행)
    ↓
Phase 2: AGENT_02, AGENT_03 (병렬 실행)
    ↓
Phase 3: AGENT_04, AGENT_06 (병렬 실행)
    ↓
Phase 4: AGENT_05 → AGENT_07 (순차 실행)
    ↓
Phase 5: AGENT_08, AGENT_09 (병렬 실행)
    ↓
Phase 6: AGENT_10 (독립 실행)
```

## Phase별 검증 포인트

각 Phase 완료 후 다음 항목들을 확인하세요:

### Phase 1 완료 체크리스트
- [ ] Next.js 프로젝트 생성됨
- [ ] TypeScript 설정 완료
- [ ] ESLint 설정 완료
- [ ] `npm run build` 성공
- [ ] 디렉토리 구조 생성됨

### Phase 2 완료 체크리스트
- [ ] 모든 Type 정의 파일 작성됨
- [ ] Utils 함수 구현됨
- [ ] Gemini API 클라이언트 구현됨
- [ ] API Route 생성 및 SSE 동작 확인
- [ ] curl 테스트 성공

### Phase 3 완료 체크리스트
- [ ] UI 컴포넌트 모두 생성됨
- [ ] KakaoTalk 스타일 적용됨
- [ ] Storage 클래스 구현됨
- [ ] useChat Hook 구현됨
- [ ] localStorage 동작 확인

### Phase 4 완료 체크리스트
- [ ] ChatContainer 통합 완료
- [ ] 실시간 스트리밍 동작
- [ ] Error Boundary 구현됨
- [ ] 네트워크 에러 핸들링 동작
- [ ] 오프라인 모드 구현됨

### Phase 5 완료 체크리스트
- [ ] Unit 테스트 작성됨
- [ ] E2E 테스트 작성됨
- [ ] 테스트 커버리지 80% 이상
- [ ] 모든 테스트 통과
- [ ] CI/CD 파이프라인 설정됨

### Phase 6 완료 체크리스트
- [ ] Bundle 크기 최적화됨
- [ ] Lighthouse 점수 90점 이상
- [ ] 성능 최적화 완료
- [ ] 프로덕션 빌드 성공
- [ ] 배포 준비 완료

## 예상 소요 시간

- **순차 실행**: 9.5일
- **병렬 최적화 실행**: 7일
- **시간 절감**: 약 26%

## 실행 로그

모든 실행 결과는 다음 위치에 기록됩니다:
- **실행 로그**: `docs/tasks/execution.log`
- **결과 리포트**: `docs/tasks/execution-report.json`

## 사용 가능한 Subagent 목록

Claude Code에서 현재 사용 가능한 subagent types:

### 개발 전문 Agent
- `frontend-developer` - React, TypeScript, UI 구현
- `backend-developer` - API, 비즈니스 로직, 데이터베이스
- `fullstack-developer` - 전체 스택 통합 작업
- `api-architect` - API 설계 및 아키텍처
- `ui-ux-specialist` - UI/UX 디자인 구현
- `devops-engineer` - CI/CD, 배포, 인프라

### 전문가 Agent
- `security-expert` - 보안 취약점, 인증, 에러 핸들링
- `performance-engineer` - 성능 최적화, 번들 크기 감소
- `test-engineer` - 단위 테스트, 통합 테스트 작성
- `database-architect` - 데이터베이스 설계 및 최적화

### 오케스트레이션 Agent (고급)
- `full-stack-orchestration:deployment-engineer` - 배포 자동화
- `full-stack-orchestration:performance-engineer` - 전체 스택 성능
- `full-stack-orchestration:security-auditor` - 보안 감사
- `full-stack-orchestration:test-automator` - E2E 테스트 자동화

### 리뷰 Agent
- `frontend-reviewer` - 프론트엔드 코드 리뷰
- `backend-reviewer` - 백엔드 코드 리뷰
- `code-review-expert` - 종합 코드 리뷰

### 범용 Agent
- `general-purpose` - 범용 작업
- `Explore` - 코드베이스 탐색
- `Plan` - 작업 계획 수립

## Subagent Fallback 전략

Primary subagent가 실패하거나 사용 불가능할 경우 다음 순서로 fallback:

### Phase 1-4 (구현 단계)
```
1차: 특화 Agent (api-architect, ui-ux-specialist 등)
2차: fullstack-developer (범용 개발)
3차: general-purpose (기본 범용)
```

### Phase 5 (테스팅)
```
1차: test-engineer 또는 test-automator
2차: general-purpose
```

### Phase 6 (최적화)
```
1차: performance-engineer
2차: fullstack-developer
3차: general-purpose
```

## Codex 실행 후 검증 체크리스트

### 모든 Phase 공통 검증

```bash
# 1. 변경사항 확인
git status
git diff

# 2. 코드 품질 검증
npm run lint

# 3. 타입 체크
npx tsc --noEmit

# 4. 테스트 실행
npm test

# 5. 빌드 확인
npm run build
```

### Phase별 추가 검증 항목

**Phase 1: Setup**
- [ ] package.json 생성됨
- [ ] tsconfig.json 생성됨
- [ ] next.config.js 생성됨
- [ ] `npm run build` 성공

**Phase 2: Types & API**
- [ ] src/types/*.ts 파일 생성
- [ ] src/lib/gemini.ts 생성
- [ ] app/api/chat/route.ts 생성
- [ ] API 테스트: `curl -X POST http://localhost:3000/api/chat`

**Phase 3: UI & Storage**
- [ ] src/components/chat/*.tsx 생성
- [ ] src/lib/storage.ts 생성
- [ ] src/hooks/useChat.ts 생성
- [ ] `npm run dev` 후 브라우저 확인

**Phase 4: Integration**
- [ ] ChatContainer 통합 완료
- [ ] SSE 스트리밍 동작 확인
- [ ] ErrorBoundary 테스트

**Phase 5: Testing**
- [ ] `npm test` 모든 테스트 통과
- [ ] `npm run test:coverage` 커버리지 80% 이상
- [ ] Playwright 설정 확인

**Phase 6: Optimization**
- [ ] Lighthouse 점수 >= 90
- [ ] Bundle 크기 < 500KB
- [ ] Core Web Vitals 달성

## 에러 핸들링 가이드

### macOS timeout 명령어 문제

```bash
# ❌ 에러 발생
timeout 3600 codex exec --full-auto < task.md
# bash: timeout: command not found

# ✅ 올바른 방법
CODEX_EXEC_TIMEOUT=3600 codex exec --full-auto < task.md
```

### 작업 디렉터리 문제

```bash
# ❌ 파일이 잘못된 위치에 생성됨
codex exec --full-auto < task.md

# ✅ 프로젝트 루트 명시
codex exec --full-auto \
  --cwd /Users/kyungwonmoon/Documents/GitHub/lecture/chatbot \
  < task.md
```

### Codex 실행 중 에러 발생 시

```bash
# 1. 실행 중단 (Ctrl+C)

# 2. 변경사항 확인
git status
git diff

# 3. 부분 롤백 (특정 파일만)
git checkout -- src/problem-file.ts

# 4. 전체 롤백 (주의!)
git checkout -- .
git clean -fd  # untracked files 삭제

# 5. 재시도 (타임아웃 증가)
CODEX_EXEC_TIMEOUT=7200 codex exec --full-auto < task.md
```

### Codex 실행 후 린트/테스트 실패 시

```bash
# 1. 자동 수정 시도
npm run lint --fix

# 2. 개별 파일 확인
npm run lint -- src/specific-file.ts

# 3. 테스트 실패 원인 파악
npm test -- --verbose

# 4. 수동 수정 후 재검증
vim src/file-to-fix.ts
npm test
```

## 중요 사항

1. **의존성 확인**: 각 Phase 시작 전 이전 Phase의 완료 여부를 반드시 확인
2. **병렬 실행**: Phase 2, 3, 5는 반드시 단일 메시지에서 여러 Task tool을 동시 호출
3. **Codex 위임 명시**: 프롬프트에 "Codex exec를 사용하여" 명시적으로 지시
4. **macOS 호환**: timeout 명령어 사용 금지, CODEX_EXEC_TIMEOUT만 사용
5. **작업 디렉터리**: 반드시 --cwd 옵션으로 프로젝트 루트 지정
6. **실행 후 검증**: git diff, lint, test, build 필수 확인
7. **Subagent 선택**: 위의 매핑 테이블을 참고하여 가장 적합한 subagent 사용
8. **Fallback 사용**: Primary subagent 실패 시 Fallback 컬럼의 subagent로 재시도
9. **에러 처리**: 실패한 Agent가 있을 경우, 의존성이 있는 후속 Agent 실행 중단

## 사용 예시

```
사용자: /chatbot-swarm phase2
Claude: Phase 2를 실행하겠습니다.

[docs/tasks/AGENT_TASK_02_TYPES.md와 AGENT_TASK_03_API.md 파일 읽기]

두 개의 테스크를 병렬로 실행하겠습니다:
- AGENT_02: Type 정의 및 유틸리티 구현
- AGENT_03: Gemini API 통합

[Task tool을 사용하여 두 agent를 동시에 실행]
```