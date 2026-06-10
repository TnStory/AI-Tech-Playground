# CLAUDE.md — AI-Tech-Playground

> **프로젝트**: AI-Tech-Playground — WikiDocs 책 『AI 기초 체력: IT 기술 사전』의 **인터랙티브 예제 모음(Playground)**
> **저장소**: https://github.com/TnStory/AI-Tech-Playground (공개)
> **라이브**: https://tnstory.github.io/AI-Tech-Playground/ (GitHub Pages)
> **짝 저장소(책)**: https://github.com/TnStory/AI-Tech-Playbook

이 파일은 Claude Code가 이 저장소에서 작업할 때 **항상 먼저 읽는** 운영 규칙이다.

---

## 1. 프로젝트 개요

책(Playbook)이 "**읽고 이해하는 곳**"이라면, 여기(Playground)는 "**직접 만져보는 곳**"이다.

- 책의 개념(예: GeoHash, bounding box)을 **브라우저에서 바로 조작**해 보는 인터랙티브 데모 모음.
- 예제는 **하위 폴더별 독립 정적 페이지**. 첫 예제 = `geohash-explorer/`.
- 모두 **빌드·서버·API 키 불필요한 정적 페이지** → GitHub Pages로 그대로 동작.

---

## 2. 브랜치 / 작업 워크플로우 (필수 준수)

| 브랜치 | 역할 |
|---|---|
| `main` | **공개·배포본**(GitHub Pages 소스). **깨끗한 히스토리**만 유지. |
| `dev` | **작업 브랜치.** 모든 개발·반복 수정은 여기서 한다. |

### 핵심 원칙
- **`main`에 직접 커밋·푸시하지 않는다.** 반복 수정(`fix ... fix ... 다시 fix`) 커밋이 공개 히스토리를 어지럽힌다.
- 모든 작업은 **`dev`**(또는 `dev`에서 딴 `feature/*` 브랜치)에서 한다. 여기서는 커밋이 많아도 된다.
- 완성되면 **squash 머지로 `main`에 의미 단위 1~N 커밋**만 반영한다.

### dev → main 반영 (squash)
```bash
# dev에서 충분히 다듬은 뒤
git checkout main
git merge --squash dev
git commit -m "feat(<예제>): <한 줄 요지>"   # 의미 단위 메시지
git push origin main
# dev를 main에 맞춰 이어가기
git checkout dev
git reset --hard main
git push --force-with-lease origin dev
```

### 규칙
- `main`은 GitHub Pages 소스이므로 **항상 동작하는 상태**만 올린다(머지 전 로컬에서 동작 확인).
- 히스토리를 이미 어지럽혔다면, fork/star가 없을 때 한해 squash 후 `--force` 가능(되돌릴 수 있게 로컬 백업 브랜치를 먼저 만든다).

---

## 3. 기술 스택 / 컨벤션

- **Vanilla JS(ESM), 빌드 없음.** 의존성은 CDN으로 로드(예: Leaflet). 번들러·프레임워크 도입하지 않는다.
- **지도**: Leaflet + **CARTO Positron** 타일(API 키 불필요, 밝은 회색 베이스맵).
- **순수 로직은 의존성 0 모듈 + Node 내장 test runner로 TDD.** 예: `geohash-explorer/js/geohash.js`(브라우저 API 미사용) ↔ `test/geohash.test.js`(`node --test`). 렌더/UI는 코드 + 수동/Playwright 검증.
- **외부 스크립트는 SRI(`integrity`) 유지** — 보안.
- **도표·색·톤은 책과 일관**되게(예: 경도=파랑, 위도=주황, OK=초록, 오류=빨강). 책 repo의 `rules/DIAGRAM_STYLE_GUIDE.md`를 참조.

---

## 4. 저장소 구조

```
AI-Tech-Playground/
├── index.html            # 랜딩(예제 목록 카드)
├── README.md             # 저장소 요약 + 예제 표
├── geohash-explorer/     # 예제 1
│   ├── index.html
│   ├── styles.css
│   └── js/{geohash,levels,mapLayers,ui,app}.js
├── test/                 # node --test 대상(순수함수 단위 테스트)
├── .nojekyll             # GitHub Pages의 Jekyll 처리 비활성
├── .gitignore
└── CLAUDE.md             # 이 파일
```

- **새 예제 추가**: `{영문-slug}/` 폴더로 만들고, 루트 `index.html` 카드와 `README.md` 예제 표에 등록한다. slug는 책의 장·절과 대응시킨다(예: `geohash-explorer` ↔ 03-5).

---

## 5. WikiDocs / 책 연동 (중요)

이 Playground는 WikiDocs 책 『AI 기초 체력: IT 기술 사전』의 **짝**이다. 책은 **별도 repo([AI-Tech-Playbook](https://github.com/TnStory/AI-Tech-Playbook))** 에서 작성되어 **GitHub → WikiDocs 웹훅으로 자동 동기화**된다. (책 repo의 작업 규칙·마크다운 규칙은 그 repo의 `CLAUDE.md`와 `rules/`를 따른다.)

### 연동 방식 (크로스링크)
- **책 → 데모**: 해당 장/절 본문에 **라이브 데모 링크(콜아웃)** 를 단다.
  예) 책 03-5 GeoHash 페이지 → `https://tnstory.github.io/AI-Tech-Playground/geohash-explorer/`
- **데모 → 책**: 랜딩/데모에서 책(또는 해당 장)으로 **역링크**한다.
- **이름 대응**: 예제 폴더명을 책의 장·절에 대응시켜 찾기 쉽게 한다(`geohash-explorer` ↔ 03-5).

### 경계 (혼동 금지)
- **WikiDocs 마크다운 규칙**(셀 파이프 `&#124;` 이스케이프, H2부터 시작, `TOC.md` 구조, 각주 회피 등)은 **책 repo에만** 적용된다. **이 repo는 일반 정적 웹(HTML/CSS/JS)** 이라 WikiDocs 규칙과 무관하다.
- 책 쪽에 데모 링크를 추가/수정할 때는 **책 repo의 브랜치 규칙(`3_review` → PR → `main`)** 을 따른다. 이 repo의 `dev → main` 흐름과 혼동하지 않는다.

---

## 6. 내부/작업용 파일 (공개 금지)

에이전트 작업 산출물·툴링 메타는 **공개 repo에 커밋하지 않는다**(로컬엔 보존 가능). `.gitignore`로 제외한다.

- `.serena/`, `.superpowers/` — 에이전트 툴링
- `docs/` — 구현 플랜·설계 스펙 등 작업 문서
- `geohash-explorer/spec_prompt.md` 등 예제별 구현 프롬프트

> 새 예제를 만들 때 생기는 플랜/프롬프트류는 위 규칙에 맞춰 `.gitignore`에 추가한다.

---

## 7. 언어 / 톤

- **한국어 + 영어 기술 용어 혼용**(책과 동일). 기술 용어는 원어 유지(deployment, embedding, branch 등 억지 번역 금지).
- 커밋 메시지는 **한국어**, 변경 요지를 명확하게.

---

## 8. 절대 규칙 (DO NOT)

- `main`에 **직접 커밋/푸시 금지** — `dev`에서 작업 후 **squash 머지**로만 반영.
- 내부 작업 문서(`.serena/`, `docs/`, `spec_prompt.md` 등) **커밋 금지**.
- **라이브 데모가 깨진 상태로 `main` 반영 금지** — 머지 전 동작 확인.
- 외부 스크립트 **SRI(`integrity`) 제거 금지**.
- 책(WikiDocs) 연동 링크 수정은 **책 repo의 PR 흐름**으로 — 이 repo에서 책 파일을 건드리지 않는다.
