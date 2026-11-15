# Fonts of the generated Open Graph images

Used only by `lib/seo/og-image.tsx` (M3-07, DEC-021): `ImageResponse` (`next/og`) needs TTF, OTF or WOFF data, not the WOFF2 that `next/font` serves to browsers. The site itself loads Hanken Grotesk through `next/font/google`.

| File | Source (downloaded 2026-11-15) | SHA-256 |
|---|---|---|
| `HankenGrotesk-latin-700-normal.ttf` | https://cdn.jsdelivr.net/fontsource/fonts/hanken-grotesk@latest/latin-700-normal.ttf | `28c9db747470de646a4b6f0d41d9465783aee9761cfea03784ff351147303f3f` |
| `HankenGrotesk-latin-ext-700-normal.ttf` | https://cdn.jsdelivr.net/fontsource/fonts/hanken-grotesk@latest/latin-ext-700-normal.ttf | `0107ff8711f2285b3ea3cdcede26faaa851c157e2cca1bcfa9fb203ffe36f865` |
| `OFL.txt` | https://raw.githubusercontent.com/google/fonts/main/ofl/hankengrotesk/OFL.txt | `e02ccb89a86839b22feff7872ff5cc355cc0f58318d29eee20e2cf83a612f16d` |

License: SIL Open Font License 1.1 (`OFL.txt`), Copyright 2021 The Hanken Grotesk Project Authors. Replace both TTF files together and update this table.
