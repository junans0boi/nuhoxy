# Nuhoxy 배포 가이드

M1 Mac을 운영 서버로 사용하며, Caddy가 도메인 프록시를 담당한다.

## 포트
- `3013` — nuhoxy Next.js 서버
- `3012` — ai-company-chat (참고용)

## 도메인
- `nuhoxy.kro.kr`
- `너혹시.kro.kr` (punycode: `xn--ok0b94fmjf42c.kro.kr`)

---

## 최초 배포

```bash
cd /Users/junzzang/BACKUP/workspace
git clone https://github.com/junans0boi/nuhoxy.git
cd nuhoxy

# .env.local 생성 (비밀값 — 절대 커밋하지 않음)
# Notion token, DB IDs, 카카오 키, GA4 ID 입력
cp .env.local.example .env.local   # 또는 직접 생성
vim .env.local

npm ci
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

## Caddy 설정 적용 (OCI 서버에서)

OCI는 Caddy reverse proxy만 담당한다. 앱은 M1(Tailscale: 100.68.188.49)에서 실행된다.

```bash
# OCI SSH 접속 후
sudo cp /path/to/nuhoxy.kro.kr.caddy /etc/caddy/sites/
# Caddyfile에 import 라인이 없으면 추가:
# import /etc/caddy/sites/*.caddy
sudo systemctl reload caddy
```

> `reverse_proxy 100.68.188.49:3013` — M1 Tailscale 주소:nuhoxy 포트

## 업데이트 배포

```bash
cd /Users/junzzang/BACKUP/workspace/nuhoxy
git pull --ff-only origin main
npm ci
npm run build
pm2 restart nuhoxy
```

---

## 환경변수 목록 (.env.local — 미커밋)

```env
# Notion CMS
NOTION_TOKEN=
NOTION_TESTS_DB_ID=
NOTION_QUESTIONS_DB_ID=
NOTION_RESULTS_DB_ID=

# 카카오 공유
NEXT_PUBLIC_KAKAO_JS_KEY=

# Analytics
NEXT_PUBLIC_GA_ID=
```
