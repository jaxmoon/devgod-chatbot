# Agent Task 01: Project Setup
## 프로젝트 초기 설정

**Agent ID:** AGENT_01
**소요 시간:** 0.5일
**의존성:** 없음 (첫 번째 작업)
**다음 Agent:** AGENT_02, AGENT_03 (병렬 가능)

---

## 1. Context

### 1.1 작업 목표
Next.js 14 프로젝트를 생성하고 개발 환경을 구축합니다.

### 1.2 관련 요구사항
- NFR-006: 유지보수성 (TypeScript strict mode, ESLint)
- NFR-004: 호환성 (Node.js 20+)

### 1.3 현재 상태
- 빈 프로젝트 디렉토리: `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot`

---

## 2. Prerequisites

### 2.1 시스템 요구사항
- Node.js >= 20.0.0
- npm >= 9.0.0
- Git

### 2.2 확인 명령
```bash
node --version  # v20.x.x 이상
npm --version   # 9.x.x 이상
git --version   # 2.x.x 이상
```

---

## 3. Input

### 3.1 환경 정보
- 작업 디렉토리: `/Users/kyungwonmoon/Documents/GitHub/lecture/chatbot`
- Git 저장소: 초기화 필요
- 환경 변수: GEMINI_API_KEY (나중에 설정)

### 3.2 기술 스택 결정
- Framework: Next.js 14
- Language: TypeScript
- Styling: Tailwind CSS
- Package Manager: npm

---

## 4. Task Details

### 4.1 Step 1: Next.js 프로젝트 생성

```bash
cd /Users/kyungwonmoon/Documents/GitHub/lecture/chatbot

# Next.js 프로젝트 생성 (현재 디렉토리에)
npx create-next-app@latest . --typescript --tailwind --app --no-src

# 프롬프트 응답:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src/ directory: No
# - App Router: Yes
# - Customize import alias: No
```

**생성되는 파일:**
- `package.json`
- `tsconfig.json`
- `next.config.mjs` (또는 `.js`)
- `tailwind.config.ts`
- `postcss.config.mjs`
- `.eslintrc.json`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `public/` 디렉토리
- `.gitignore`

---

### 4.2 Step 2: 추가 패키지 설치

```bash
# Gemini API SDK + UI Icons
npm install @google/generative-ai lucide-react

# 개발 의존성
npm install -D @types/node

# 테스트 프레임워크 (나중에 사용)
npm install -D jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom \
  @playwright/test msw

# React Markdown (코드 하이라이팅)
npm install react-markdown react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

**package.json 주요 의존성:**
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "lucide-react": "^0.315.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-syntax-highlighter": "^15.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "msw": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

### 4.3 Step 3: 디렉토리 구조 생성

```bash
# 프로젝트 루트에서 실행
mkdir -p app/api/chat
mkdir -p components/chat/__tests__
mkdir -p components/ui
mkdir -p lib
mkdir -p hooks
mkdir -p types
mkdir -p mocks
mkdir -p docs/tasks/handoffs
mkdir -p scripts
mkdir -p docker
mkdir -p e2e
mkdir -p tests
```

**최종 디렉토리 구조:**
```
chatbot/
├── app/
│   ├── api/
│   │   └── chat/          # Gemini API route
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── chat/              # ChatContainer, ChatMessage, etc.
│   └── ui/                # 공용 UI 컴포넌트
├── lib/                   # 비즈니스 로직 (gemini.ts, storage.ts)
├── hooks/                 # React hooks (useChat.ts)
├── types/                 # TypeScript 타입 정의
├── docs/
│   └── tasks/
│       ├── handoffs/      # 에이전트 간 전달 문서
│       └── AGENT_TASK_*.md
├── mocks/                 # 테스트용 핸들러
├── scripts/               # 유틸리티 스크립트
├── docker/                # Docker 설정
├── e2e/                   # Playwright E2E 테스트
├── tests/                 # 테스트 코드
├── public/                # 정적 파일
└── package.json
```

---

### 4.4 Step 4: TypeScript 설정 최적화

**`tsconfig.json` 수정:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,                    // strict mode 활성화
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]                   // import alias: @/
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

---

### 4.5 Step 5: Tailwind CSS 설정

**`tailwind.config.ts` 수정:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kakao: {
          yellow: '#FAE100',
          yellowDark: '#F5DC00',
          blue: '#ABC1D1',
          blueLight: '#B2C7DA',
        },
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-kr)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

---

### 4.6 Step 6: Next.js 설정

**`next.config.mjs` 생성/수정:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone output for Docker
  output: 'standalone',

  // 압축 활성화
  compress: true,

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  },
};

export default nextConfig;
```

---

### 4.7 Step 7: 환경 변수 설정

**`.env.example` 생성:**
```env
# Gemini API Key (필수)
GEMINI_API_KEY=your_gemini_api_key_here

# Node Environment
NODE_ENV=development

# Next.js Telemetry
NEXT_TELEMETRY_DISABLED=1
```

**`.env.local` 생성:**
```bash
cp .env.example .env.local

# 실제 API 키로 교체 (나중에 설정)
# GEMINI_API_KEY는 AGENT_03에서 테스트 시 필요
```

**`.gitignore` 확인/추가:**
```
# Next.js
/.next/
/out/

# Production
/build

# Environment
.env*.local

# Vercel
.vercel

# Testing
/coverage
/playwright-report
/test-results

# IDE
.vscode
.idea
```

---

### 4.8 Step 8: 테스트 설정 파일 생성

**`jest.config.js` 생성:**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

**`jest.setup.js` 생성:**
```javascript
import '@testing-library/jest-dom'
```

**`playwright.config.ts` 생성:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### 4.9 Step 9: package.json 스크립트 추가

**`package.json`의 `scripts` 섹션 수정:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

### 4.10 Step 10: Git 초기화

```bash
# Git 저장소 초기화 (아직 안 했다면)
git init

# 초기 커밋
git add .
git commit -m "chore: initial project setup with Next.js 14

- Setup Next.js 14 with TypeScript and Tailwind CSS
- Install Gemini API SDK and testing frameworks
- Configure ESLint, Jest, and Playwright
- Create project directory structure
"
```

---

## 5. Output

### 5.1 생성된 파일 목록

**설정 파일:**
- `package.json` (의존성, 스크립트)
- `tsconfig.json` (TypeScript 설정)
- `next.config.mjs` (Next.js 설정)
- `tailwind.config.ts` (Tailwind 설정)
- `jest.config.js` (Jest 설정)
- `jest.setup.js` (Jest setup)
- `playwright.config.ts` (Playwright 설정)
- `.env.example` (환경 변수 템플릿)
- `.env.local` (로컬 환경 변수)
- `.gitignore` (Git ignore 규칙)

**디렉토리:**
- `app/`, `app/api/chat/`
- `components/chat/`, `components/ui/`
- `lib/`, `hooks/`, `types/`
- `docs/tasks/handoffs/`
- `scripts/`, `docker/`, `e2e/`

### 5.2 수정된 파일
- 없음 (신규 프로젝트)

---

## 6. Verification

### 6.1 자동 검증

```bash
# 1. 패키지 설치 확인
npm list --depth=0

# 예상 출력: next, react, @google/generative-ai 등

# 2. 빌드 테스트
npm run build

# 예상 출력: ✓ Compiled successfully

# 3. Lint 확인
npm run lint

# 예상 출력: ✓ No ESLint warnings or errors

# 4. TypeScript 타입 체크
npx tsc --noEmit

# 예상 출력: No errors

# 5. 개발 서버 시작
npm run dev

# 예상 출력: - ready started server on 0.0.0.0:3000
```

### 6.2 수동 검증 체크리스트

- [ ] http://localhost:3000 접속 시 Next.js 기본 페이지 표시
- [ ] 페이지에 "Get started by editing app/page.tsx" 텍스트 보임
- [ ] 브라우저 콘솔에 에러 없음
- [ ] Hot reload 작동 (app/page.tsx 수정 시 자동 반영)

### 6.3 디렉토리 구조 확인

```bash
tree -L 2 -I 'node_modules|.next'
```

**예상 출력:**
```
.
├── app
│   ├── api
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components
│   ├── chat
│   └── ui
├── docs
│   └── tasks
├── e2e
├── hooks
├── lib
├── package.json
├── playwright.config.ts
├── public
├── scripts
├── tailwind.config.ts
├── tsconfig.json
└── types
```

---

## 7. Handoff

### 7.1 다음 에이전트
- **AGENT_02** (Types & Utils) - 병렬 가능
- **AGENT_03** (API Integration) - 병렬 가능

### 7.2 전달 사항

**완료된 작업:**
- ✅ Next.js 14 프로젝트 생성
- ✅ TypeScript strict mode 활성화
- ✅ Tailwind CSS 설정 (KakaoTalk 색상 포함)
- ✅ 테스트 프레임워크 설치 (Jest, Playwright)
- ✅ 디렉토리 구조 생성
- ✅ ESLint, Git 설정 완료

**AGENT_02를 위한 정보:**
- TypeScript 경로 alias: `@/*`
- 타입 정의 디렉토리: `types/`
- 유틸리티 디렉토리: `lib/`

**AGENT_03을 위한 정보:**
- Gemini API 패키지 설치됨: `@google/generative-ai`
- API Route 디렉토리: `app/api/chat/`
- 환경 변수 파일: `.env.local` (GEMINI_API_KEY 설정 필요)

**알려진 이슈:**
- 없음

**주의 사항:**
- `.env.local`에 실제 GEMINI_API_KEY를 설정해야 AGENT_03이 API 테스트 가능
- 아직 기능 코드는 없음 (기본 Next.js 페이지만 존재)

---

### 7.3 Handoff 문서 작성

**`docs/tasks/handoffs/AGENT_01_HANDOFF.md` 생성:**

```markdown
# Agent 01 Handoff

## Completed Tasks
- [x] Next.js 14 프로젝트 생성
- [x] TypeScript 및 Tailwind CSS 설정
- [x] 필수 패키지 설치
- [x] 디렉토리 구조 생성
- [x] 테스트 프레임워크 설정
- [x] Git 초기화

## Created Files
- package.json, tsconfig.json, next.config.mjs
- tailwind.config.ts, jest.config.js, playwright.config.ts
- .env.example, .env.local, .gitignore
- 디렉토리: app/, components/, lib/, hooks/, types/, docs/tasks/

## Environment Setup
- Node.js: 20.x
- Next.js: 14.1.0
- TypeScript: 5.3.0
- Gemini API SDK: 0.21.0

## Known Issues
- None

## Next Agent Notes
**For AGENT_02 (Types):**
- Use `@/*` import alias
- Place type definitions in `types/` directory

**For AGENT_03 (API):**
- Set GEMINI_API_KEY in .env.local before testing
- API route location: app/api/chat/route.ts
- Gemini SDK already installed

## Verification Passed
- ✅ npm run build
- ✅ npm run lint
- ✅ Dev server runs on localhost:3000
```

---

## 8. Troubleshooting

### 문제 1: npm install 실패
**증상:** 패키지 설치 중 에러
**해결:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 문제 2: TypeScript 에러
**증상:** "Cannot find module" 에러
**해결:**
```bash
# TypeScript 서버 재시작 (VSCode)
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### 문제 3: 빌드 실패
**증상:** npm run build 에러
**해결:**
```bash
rm -rf .next
npm run build
```

---

**Agent 01 작업 완료 ✅**

다음: `AGENT_TASK_02_TYPES.md` 또는 `AGENT_TASK_03_API.md` (병렬 가능)
