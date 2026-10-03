# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

블록핏 (BlockFit): an unofficial, Korean-language web tool that checks Roblox classic 2D clothing files (shirt, pants, t-shirt) before upload and previews them on a 3D block avatar. Many users are elementary-school kids. Next.js 16 App Router, React 19, TypeScript strict, three.js. README.md (Korean) is the detailed design log. Read the relevant section before changing a feature.

## Commands

```bash
npm run dev         # local dev server
npm run build       # production build; run before pushing
npm run typecheck   # tsc --noEmit
```

There is no test suite and no linter configured. Verify changes with `typecheck` and `build`, then check behavior in a browser. Most logic runs client-side (canvas, WebGL, file APIs), so a successful build alone does not prove it works.

## Branches

- `main`: production. Vercel deploys from it. Never commit to it directly; merge `dev` in only when the user asks to deploy.
- `dev`: all work happens here.
- `backup/before-redesign`: snapshot from before the 2026-10 redesign. Leave it untouched.

## Non-negotiable principles

These are product decisions (see README "원칙"). Do not trade them away for features:

- **No login, no accounts.** Roblox scam sites steal accounts through logins, so having none is the site's trust signal.
- **User images never leave the device.** Checks, auto-fix, the 3D preview, template generation and the share card all run in the browser. The only server code is `src/app/api/count/route.ts`. It increments a counter in Upstash Redis and stores only an IP hash for 1 hour.
- **Don't be stricter than Roblox's official rules.** Use "fail" only for things that are definitely wrong (e.g. wrong size, non-PNG/JPG). Use "warn" for things that might be intentional. JPG is allowed, so it is only a warn.
- **No Roblox branding or copyrighted art.**
  - The avatar has no face. The head is a rounded cylinder; the body is boxes.
  - The Korean template and the sample outfit are drawn at runtime from panel coordinates, never copied from official images.
  - Always keep the "unofficial tool" notice. Avoid "roblox" in domains and names.
- **Kid-readable Korean copy.** Use plain words like "옷 본" (template), "칸" (panel) and "비어 있는 곳" (transparency) instead of jargon. Fix instructions are step-by-step lists.
- **Keep the privacy policy in sync.** If a feature changes what data is handled (analytics, ads, etc.), update `src/app/privacy/page.tsx` and `PRIVACY_EFFECTIVE_DATE`.

## Architecture

**Single source of truth for Roblox specs: `src/config/clothing.ts`.**
- Contents: template size (585×559), t-shirt sizes, fees (`UPLOAD_INFO`: upload 80 R$, publish 10 R$, `checkedAt`), and the 18 `PANELS` (group × face → x, y, w, h).
- The panel coordinates were verified pixel-exact against the official template PNGs in 2026-10.
- Everything that maps image regions to body parts reads `PANELS`: checks, the overlay, the 3D/2D previews, the Korean template and the sample outfit. If Roblox changes rules or templates, this is the only file to edit. Follow README "좌표 검증" to re-verify.

**Site settings live in `src/config/site.ts`.** Operator contact, counter display threshold, size limits, and `SITE_DESCRIPTION`.

**Upload pipeline (`src/app/page.tsx` → `loadIntoSlot`).**
1. Real format is read from magic bytes (`lib/fileSignature.ts`), never from the extension.
2. Dimensions are read from the file header first, and oversized files are never decoded, so old phones don't freeze.
3. The file is decoded to an `ImageBitmap` plus `ImageData`.
4. `runChecks` (`lib/imageChecks.ts`) runs. These checks are pure functions with no UI dependency.

User uploads, auto-fixed files (`lib/autoFix.ts`) and the sample outfit (`lib/sampleOutfit.ts`) all go through this same path, so they are re-checked identically.

**Multiple garments at once.**
- Page state is `slots: Record<"shirt" | "pants" | "tshirt", Loaded | null>`. Each slot is checked independently.
- A shirt or pants is "wearable" only if it is exactly template size.
- Layering rules live only in `lib/outfit.ts`. On the torso, pants go under the shirt, which goes under the t-shirt. Arms take the shirt only, legs the pants only, and the t-shirt covers the torso front only. Both previews share these rules.

**Previews.**
- `components/AvatarPreview.tsx` is three.js. It is loaded with `next/dynamic` and `ssr: false` because it is heavy.
  - The faces of each box map 1:1 to template panels with no flipping. This relies on three.js BoxGeometry UV orientation; the reasoning is in the file header.
  - The avatar's right side is −x.
  - There is no lighting. `FACE_SHADE` sets a fixed brightness per face so clothing colors stay accurate.
- `FrontBackPreview.tsx` is the 2D canvas fallback when WebGL fails.

**Counter ("꾸민 인원").**
- It counts once per device, when the avatar first wears the user's own clothing. Samples don't count.
- `lib/counter.ts` keeps a localStorage flag. The API route rate-limits per IP hash.
- If Redis env vars (`KV_REST_API_*` or `UPSTASH_REDIS_REST_*`) are missing, the API returns `null` and the UI just hides the number.

**Site URL comes from `lib/siteUrl.ts` (server only).**
- It uses `NEXT_PUBLIC_SITE_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, then localhost.
- Metadata, `robots.ts` and `sitemap.ts` all use it.
- Don't use it in client components: it reads server-only env vars, which causes a hydration mismatch. For the same reason `StructuredData.tsx` omits URLs.
- Client code that needs the host (share card, template footer) uses `window.location`.

**Link cards.** `src/app/opengraph-image.png` and `twitter-image.png` are static pre-rendered images, used so Korean fonts never break. Don't replace them with runtime-generated images. The privacy page overrides only `canonical`, because overriding `openGraph` would drop the inherited image.

**Styling.** One global stylesheet, `src/app/globals.css`, with design tokens on `:root`.
- The visual identity is a green cutting mat (`--mat`) with chalk-yellow (`--chalk`) measurement lines. Emphasis goes on the mat; the rest of the page stays quiet and paper-like.
- `word-break: keep-all` keeps Korean from breaking mid-word.
- Fonts: Google Fonts Black Han Sans (display) and IBM Plex Sans KR (body). Canvas drawing must `await ensureFonts(...)` (`lib/download.ts`) before rendering Korean text.
