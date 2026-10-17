🌐 [English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt_BR.md) | 한국어

# 🎮 Mona Mayhem

**VS Code 및 GitHub Copilot CLI 워크숍** — GitHub 기여도 배틀 아레나 만들기

두 사용자의 GitHub 기여 그래프를 비교하는 레트로 아케이드 스타일 웹사이트를 Astro로 만드는 워크숍 템플릿입니다. 이 저장소는 **시작점**이며, GitHub Copilot을 사용해 단계별로 앱을 완성합니다.

![Mona Mayhem 스크린샷](https://github.com/user-attachments/assets/5eca79e2-cb9f-4e93-aa0d-23666ebde3b7)
*워크숍을 마치면 만들 수 있는 결과물*

## 📚 워크숍

워크숍은 두 가지 트랙을 제공합니다. 선호하는 작업 방식에 맞는 트랙을 선택하십시오.

- **VS Code 트랙** — 편집기 안에서 채팅(Chat), 계획 모드(Plan Mode), 에이전트 모드(Agent Mode), 백그라운드 에이전트(Background agents), 편집기 내 검토 흐름을 실습합니다.
- **CLI 트랙** — 터미널에서 `copilot`, `@file` 컨텍스트, `/plan`, 자율 편집, `/fleet`, `/delegate`, `/review`를 실습합니다.

| 파트 | 제목 | Copilot 중점 기능 |
|------|-------|------------------|
| [00](workshop/ko/00-overview.md) | 개요 | 트랙 선택 및 학습 목표 |
| [01](workshop/ko/01-setup.md) | 설정 및 컨텍스트 엔지니어링(Context Engineering) | 지침, 권한, 환경 설정 |
| [02](workshop/ko/02-plan-and-scaffold.md) | 계획 및 스캐폴딩(Scaffolding) | API 및 페이지 아키텍처 계획 |
| [03](workshop/ko/03-agent-mode.md) | 게임 구현 | 에이전트 기반 구현(Agentic implementation) 및 반복 개선 |
| [04](workshop/ko/04-design-vibes.md) | 디자인 우선 테마 구성 | 시각 디자인 계획 및 구현 |
| [05](workshop/ko/05-polish.md) | 다듬기 및 병렬 작업 | 병렬 처리, 검토, 품질 개선 |
| [06](workshop/ko/06-bonus.md) | 보너스 및 확장 기능 | 자유 과제 및 추가 실험 |

## 🚀 빠른 시작

1. 먼저 다음 방법 중 하나로 저장소를 만듭니다.
   - **Use this template**을 클릭해 새 저장소를 만들거나
   - 이 저장소를 포크합니다.
2. 원하는 워크숍 트랙을 선택합니다.
   - **VS Code:** 저장소를 복제하고 VS Code에서 엽니다.
   - **GitHub Copilot CLI:** 저장소를 로컬에 복제하고 `copilot`을 설치한 다음 터미널에서 작업합니다.
3. [워크숍 안내](workshop/ko/00-overview.md)를 따라 진행합니다.

## 사전 준비

### 공통

- GitHub Copilot(Pro, Business 또는 Enterprise)
- Git
- Node.js

### VS Code 트랙

- VS Code v1.107+
- GitHub Copilot 확장에 로그인

### CLI 트랙

- GitHub Copilot CLI(`copilot`)
- `npm install -g @github/copilot`으로 CLI를 설치하려면 Node.js 22+
- 또는 Homebrew나 WinGet 등 원하는 패키지 관리자로 설치

## 기술 스택

- **프레임워크:** [Astro](https://astro.build/) v6
- **런타임:** [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/) 어댑터를 사용하는 Node.js
- **글꼴:** Press Start 2P(레트로 게임 글꼴)
- **API:** GitHub 기여 그래프 API

## 플레이어 검색 및 외관

두 플레이어 입력란 모두 두 글자를 입력하면 GitHub 사용자 이름을 최대 다섯 개까지 제안합니다.
위/아래 화살표 키와 Enter를 사용하거나 제안 항목을 클릭하십시오. 검색은 디바운스(debounce)되며
최근 결과는 1분간 캐시됩니다. GitHub 검색을 사용할 수 없거나 요청 한도에 도달해도
전체 사용자 이름을 직접 입력하면 정상적으로 동작합니다.

**설정(Settings)**에서 Blue, Red, Purple, Green, Amber, Graphite 중 하나를 선택하거나
사용자 지정 색상을 고를 수 있습니다. 선택한 팔레트는 전체 인터페이스와 시작 애니메이션에 적용되며,
가독성을 위해 밝기가 조정됩니다. 환경설정은 이 브라우저에 저장되며,
**Restore blue theme**를 선택하면 소리 및 시작 설정은 그대로 두고 색상만 초기화합니다.

## 배포 참고 사항

### GitHub Pages

`.github/workflows/deploy.yml`의 워크플로는 `main`에 푸시할 때마다, 또는 수동으로 실행할 때
Astro 애플리케이션을 테스트, 빌드, 배포합니다. 저장소의 **Settings > Pages**에서
빌드 소스로 **GitHub Actions**를 선택하십시오. 이 저장소에서 예상되는 URL은
<https://takax170.github.io/my-mona-mayhem/>입니다.

`npm run build:pages`는 `dist/`에 정적 파일을 생성합니다. 이 구성은 `GITHUB_REPOSITORY`
(기본값: `Takax170/my-mona-mayhem`)를 사용해 Pages 도메인과 저장소 기본 경로(base path)를 설정합니다.
이전 배포와 달리 `docs/`의 독립형 워크숍 사이트가 아니라 앱을 게시합니다.

Pages는 API 라우트를 실행할 수 없습니다. 이 빌드에서만 브라우저가 GitHub의 공개 CORS 지원을 이용해
`https://github.com/{username}.contribs`를 직접 호출합니다. 사용자 이름 및 페이로드 검증, 타임아웃,
오류 처리, 메모리 내 캐시는 서버 서비스와 동일한 것을 재사용합니다. 토큰이나 서드파티 프록시는
필요하지 않으며, GitHub의 가용성과 CORS 지원이 필요합니다. 사용자 이름 제안 기능도 Pages에서는
토큰 없이 `https://api.github.com/search/users`를 직접 호출합니다.

### Node 호스팅

`npm run dev`, `npm run build`, `npm run preview`는 Node 서버 구성과 동일 출처(same-origin)
`/api/contributions/:username` 및 `/api/users/:query` 프록시를 그대로 유지합니다.
빌드한 후 Node 호스트에서 `node dist/server/entry.mjs`를 실행합니다.

## 라이선스

MIT
