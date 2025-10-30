# Chatbot-Swarm Agent 실행 가이드

챗봇 프로젝트의 AGENT_TASK들을 효율적으로 실행하기 위한 개선된 워크플로우입니다.

## 📋 주요 개선 사항

### 1. **Codex 위임 명시적 지시**
- Agent가 스스로 판단하지 않고, 호출자가 Codex 사용을 명시적으로 지시
- 명확한 실행 전략과 예측 가능한 동작

### 2. **macOS 호환성 개선**
- `timeout` 명령어 제거 (macOS 기본 미지원)
- `CODEX_EXEC_TIMEOUT` 환경변수만 사용

### 3. **작업 디렉터리 명시**
- `--cwd` 옵션으로 프로젝트 루트 고정
- 파일 위치 혼동 방지

### 4. **실행 후 검증 프로세스**
- git diff 확인
- lint, test, build 필수 실행
- 문제 발생 시 롤백 방법 제공

## 🚀 사용 방법

### 기본 실행

```bash
# Phase 2 실행 예시
/chatbot-swarm phase2
```

Claude Code가 자동으로:
1. `docs/tasks/AGENT_TASK_02_TYPES.md` 읽기
2. `docs/tasks/AGENT_TASK_03_API.md` 읽기
3. 두 Agent를 병렬로 Codex에 위임하여 실행

### 수동 스크립트 실행

```bash
# 실행 계획 확인
./scripts/execute-agents.sh --plan

# 특정 Phase만 실행
./scripts/execute-agents.sh --phase 2

# 전체 Phase 실행
./scripts/execute-agents.sh
```

## 📊 Phase별 실행 전략

| Phase | 실행 방식 | 타임아웃 | 예상 시간 |
|-------|----------|----------|----------|
| 1 | Codex 위임 | 1800초 | 30분 |
| 2 | Codex 위임 (병렬) | 3600초 | 60분 |
| 3 | Codex 위임 (병렬) | 7200초 | 120분 |
| 4 | Codex 위임 (순차) | 7200초 | 120분 |
| 5 | Codex 위임 (병렬) | 7200초 | 120분 |
| 6 | Codex 위임 | 3600초 | 60분 |

**총 예상 시간**: 7일 (순차 9.5일 대비 26% 단축)

## ✅ 실행 후 검증

### 필수 검증 항목

```bash
# 1. 변경사항 확인
git status
git diff

# 2. 코드 품질
npm run lint

# 3. 타입 체크
npx tsc --noEmit

# 4. 테스트
npm test

# 5. 빌드
npm run build
```

### Phase별 추가 검증

**Phase 2 (API)**:
```bash
# API 엔드포인트 테스트
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "테스트", "history": []}'
```

**Phase 3 (UI)**:
```bash
# 개발 서버 실행 후 브라우저 확인
npm run dev
```

## 🔧 문제 해결

### macOS timeout 에러

```bash
# ❌ 에러 발생
timeout 3600 codex exec --full-auto < task.md

# ✅ 올바른 방법
CODEX_EXEC_TIMEOUT=3600 codex exec --full-auto \
  --cwd /Users/kyungwonmoon/Documents/GitHub/lecture/chatbot \
  < task.md
```

### 작업 디렉터리 문제

```bash
# 항상 프로젝트 루트에서 실행
cd /Users/kyungwonmoon/Documents/GitHub/lecture/chatbot

# 또는 --cwd 옵션 사용
codex exec --full-auto --cwd $(pwd) < task.md
```

### 실행 중 에러 발생

```bash
# 1. 즉시 중단 (Ctrl+C)

# 2. 변경사항 확인
git status
git diff

# 3. 필요시 롤백
git checkout -- src/problem-file.ts

# 4. 타임아웃 증가 후 재시도
CODEX_EXEC_TIMEOUT=7200 codex exec --full-auto < task.md
```

## 📁 생성된 파일들

### 설정 파일
- `/.claude/commands/chatbot-swarm.md` - 메인 워크플로우 명령어
- `/.claude/agents/*.md` - 개선된 Agent 프롬프트

### 실행 스크립트
- `/scripts/execute-agents.sh` - Agent 실행 자동화 스크립트
- `/scripts/lib/logger.sh` - 로깅 유틸리티
- `/scripts/lib/task-parser.sh` - 테스크 파서

### 로그 파일 (실행 후 생성)
- `/docs/tasks/execution.log` - 실행 로그
- `/docs/tasks/execution-report.json` - 실행 결과 리포트

## 🎯 Agent 매핑

| Phase | Agent | Subagent Type | Codex 타임아웃 |
|-------|-------|---------------|---------------|
| 1 | AGENT_01 | devops-engineer | 1800초 |
| 2 | AGENT_02 | backend-developer | 3600초 |
| 2 | AGENT_03 | api-architect | 3600초 |
| 3 | AGENT_04 | ui-ux-specialist | 7200초 |
| 3 | AGENT_06 | fullstack-developer | 7200초 |
| 4 | AGENT_05 | frontend-developer | 7200초 |
| 4 | AGENT_07 | security-expert | 7200초 |
| 5 | AGENT_08 | test-engineer | 7200초 |
| 5 | AGENT_09 | full-stack-orchestration:test-automator | 7200초 |
| 6 | AGENT_10 | performance-engineer | 3600초 |

## 💡 베스트 프랙티스

1. **항상 프로젝트 루트에서 실행**
   ```bash
   cd /Users/kyungwonmoon/Documents/GitHub/lecture/chatbot
   ```

2. **Codex 실행 전 백업**
   ```bash
   git status
   git diff > /tmp/before-changes.diff
   ```

3. **병렬 실행 시 단일 메시지 사용**
   - Phase 2, 3, 5는 한 번에 여러 Task tool 호출

4. **실행 후 반드시 검증**
   - 자동화된 실행이지만 결과 확인 필수

5. **문제 발생 시 빠른 롤백**
   - git을 활용한 즉각적인 복구

## 📚 참고 문서

- **메인 워크플로우**: `/.claude/commands/chatbot-swarm.md`
- **테스크 문서**: `/docs/tasks/AGENT_TASK_*.md`
- **프로젝트 가이드**: `/CLAUDE.md`

## 🔄 업데이트 이력

### 2025-10-30
- Codex 위임 명시적 지시 구조로 개선
- macOS 호환성 문제 해결 (timeout 명령어 제거)
- 작업 디렉터리 명시 (--cwd 옵션)
- 실행 후 검증 프로세스 추가
- Phase별 실행 전략 및 타임아웃 최적화
- Agent 프롬프트 개선 (3개 파일)

---

**문의 및 피드백**: GitHub Issues 또는 프로젝트 담당자에게 연락
