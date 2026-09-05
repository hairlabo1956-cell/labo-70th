# LABO 70th ANNIVERSARY ｜ 実装者向けメモ

美容室LABO（栃木県矢板市）70周年感謝祭 特設サイト。仕様書 v2（2026-09-04）と `LABO70周年_全体プロトタイプ.html`（v5）を本番構成へ移植したもの。
発注者向けの操作手順は **`編集マニュアル.md`** にある。このファイルは実装・保守する人向け。

## ファイル構成

```
/
├── index.html          … サイト本体。本文テキストはすべてこの中（✏️／⚠️ のHTMLコメント付き）
├── style.css           … プロトタイプのCSSをそのまま移植＋本番用の追加（後述）
├── script.js           … 演出のみ。テキストは持たない
├── favicon.svg / favicon.png / apple-touch-icon.png … 暫定ファビコン（オレンジ地に「70」）。ロゴ支給後に差し替え
├── README.md           … このファイル
├── 編集マニュアル.md     … 発注者向け（必須成果物）
├── images/
│   ├── ogp.jpg             … 1200×630（PCヒーローを1200×630で撮ったもの）
│   ├── hero.jpg            … ヒーロー写真（ビラの写真部分を切り出し、モノクロ化。623×882）
│   ├── history-01.jpg      … 1956（創業当時）440×622
│   ├── history-03.jpg      … 旧店舗 880×786（支給PNG 1536×2048 を上部1372pxで切り出し→横880pxに縮小）
│   ├── history-04.jpg      … 1970s 440×624
│   ├── history-05.jpg      … 1980s 440×698
│   ├── history-07.jpg      … 2000s 440×271
│   └── （history-02 / 06 / 08 / 09 と staff-01〜05 は未支給。枠は PHOTO WANTED のまま）
├── .claude/launch.json … ローカル確認用（`npx http-server -p 8137`）。公開には不要
└── _old-20260901/      … 旧版（2026-09-01 に作った #edit 方式のサイト）。公開には不要。不要なら削除してよい
```

- ビルド工程なし。GitHub 上で直接編集し、Cloudflare Pages が自動で再公開する前提。
- 外部読み込みは Google Fonts と Lenis（jsDelivr CDN、`lenis@1.3.26` に固定）だけ。Lenis が読めなくても通常スクロールで全機能が動く。

## プロトタイプからの変更点（意図的なもの）

プロトタイプのCSS・JS・数値はそのまま流用している。変えたのは「本番運用に必要なこと」と「実測で見つかった不具合」だけ。

### 仕様書で求められている本番化

| # | 変更 | 理由 |
|---|---|---|
| 1 | 画像を Base64 埋め込み → `images/` の外部ファイルに分離 | 仕様 §3。発注者が同名ファイルの上書きで差し替えられるように |
| 2 | 写真のデュオトーンを**CSSで適用**（`background:#212E7D` の枠の上に `filter:grayscale(1)` + `mix-blend-mode:screen` の画像）。プロトタイプの「tone用の加工済み画像」は使わない | 仕様 §7。どんな写真を入れても自動で同じ色調になる。黒→紺 #212E7D、白→白 という写像はプロトタイプの加工済み画像と同じ |
| 3 | HISTORY の写真枠（`.shot`）は HTML 上では `<img>` 1枚だけ。「紺の層／元写真の層／手鏡の縁」は `script.js` が組み立てる | 発注者が触るのを `<img>` 1行にするため。鏡のロジック自体はプロトタイプのまま |
| 4 | `.shot img` / `.sp img` を `position:absolute; object-fit:cover` にし、枠の `aspect-ratio` で切り抜く | 縦横比の違う写真を入れても枠が崩れない |
| 5 | Lenis（慣性スクロール、lerp 0.09）を追加し、`lenis.on('scroll')` で HISTORY／カウンター／進行バーを同期。動きを減らす設定では起動しない | 仕様 §6-2 ⑤ |
| 6 | `prefers-reduced-motion` で提灯・紙吹雪・マーキー・バッジ・のぼり・トンボ・ハイライト・各 transition も停止。カウントアップは最終値を即表示 | 仕様 §6-6 |
| 7 | 三角旗ガーランドの CSS/JS を削除 | 仕様 §6-3「復活させないこと」 |
| 8 | SEO / OGP / JSON-LD（schema.org Event）/ favicon / `<main>` ランドマーク / `loading="lazy"` / `width` `height` / `fetchpriority` を追加 | 仕様 §8 |
| 9 | `a:focus-visible` のフォーカスリング（オレンジ、オレンジ地では黒）。補助テキストのグレーを `#8a8a8a` → `#767676`、EVENT のラベルを黒70%、PHOTO WANTED の点滅の最小濃度を .45 → .7 | 仕様 §8 コントラスト比 4.5:1（`#8a8a8a` は 3.45:1、点滅の谷は 4.0:1 だった） |
| 10 | 駐車場の見出しを `h4` → `h3` | 見出し階層（h2 の直下に h4 があった） |
| 11 | 地図・Instagram・LINE のリンクは支給URLを設定済み（2026-09-05） | Google マップ `maps.app.goo.gl/4xg6GBuGM25kUTJm9` ／ Instagram `@labo.1956` ／ LINE `lin.ee/qLPLJ4Aw` |
| 12 | MESSAGE 本文の末尾に Instagram 原稿の最終行「皆さまとお会いできることを、心より楽しみにしております。」を追加 | 仕様 §5 S3「原稿をそのまま使用」。プロトタイプでは抜けていた。不要なら1行消すだけ |
| 13 | カウントダウンが 0 になったら数字を隠し「終了しました」の一文（`.cddone`、index.html 内で編集可）を表示 | 感謝祭後に「あと0日」が残らないように。文言は仮 |

### 実測で見つかった不具合の修正

| # | 変更 | 理由 |
|---|---|---|
| 14 | **見出し（.h2）のせり上がりが Chrome で一度も発火しない**のを修正。`clip-path` で隠した .h2 自身ではなく、直前のラベル（.sub）を IntersectionObserver で監視する | Chrome（148で確認）は clip-path で消えた要素の交差矩形を 0 とみなし `isIntersecting` が false のまま。プロトタイプでは全セクションの見出しが表示されなかった |
| 15 | 年表パネル幅を `style="width:min(28vw,360px)"` → `style="--w:28"`（CSS側で同じ式に展開）。スマホ（820px以下）では同じ比率のまま 2.3 倍 | プロトタイプのままだとスマホで枠が約105pxになり判読できなかった。PCの幅はプロトタイプと同一 |
| 16 | JS 有効時は開幕アニメーション開始まで見出し文字と版を隠す（`html.js .hero:not(.play)`）。開幕はページ全体のフォントではなく**ヒーローで使う書体だけ**を待つ（上限1.2秒） | 代替フォントで一瞬タイトルが出てから消える現象と、日本語フォント全部を待つ遅延の回避 |
| 17 | HISTORY のヒント文をPC／スマホで切り替え（スマホ：「横にスワイプ ／ 写真をなぞる」） | タッチ端末で「カーソル」と出ていた |

### パフォーマンス（Lighthouse モバイル 75 以上・LCP 2.5秒以内 のため）

| # | 変更 | 理由 |
|---|---|---|
| 18 | **日本語2書体（Shippori Mincho / Noto Sans JP）は `script.js` がページ内の文字だけを含む形で要求**（Google Fonts の `text=` 指定。文字集合は `document.body.textContent` から実行時に作る）。`<noscript>` に通常のリンクを残す | 通常のリンクだと unicode-range の分割ファイルが約60個・1MB超になり、届くたびにページ全体が組み直されてカクつく。`text=` なら1書体1ファイル（約75KB×2）。**文字を書き足しても自動で拾われる**ので発注者の作業は変わらない |
| 19 | 上記2書体の weight 500 を読まない（400 に自動フォールバック。使用箇所は のぼり・ドリンク券・カウントダウンの単位のみ） | ファイル数削減。見た目の差はほぼない |
| 21 | **デュオトーンの filter と mix-blend-mode を別要素に分離**（img に `filter:grayscale(1)`、その親 `.tone` / `.layer.base` に `mix-blend-mode:screen`）。ヒーローは HTML に `.tone` を置き、STAFF の写真は script.js が包む | iOS 26 Safari に「同じ画像に filter と mix-blend-mode を掛けるとフィルタだけ効いて合成されない」既知の不具合（Safari 26.0 で修正とされたが iOS 26.3 でも再現報告あり）。別要素に分ければ該当しない |
| 22 | 帯（マーキー）とバッジの区切り記号を「✳」(U+2733) → 「✱」(U+2731 HEAVY ASTERISK) に置き換え。帯は script.js が ✳ を自動で ✱ に直す | U+2733 は絵文字にもなる文字で、WebKit（Playwright の Windows 版）では U+FE0E を付けても緑の絵文字で描かれた。U+2731 は絵文字の性質を持たないので、どの端末でも文字として描かれる。見た目はほぼ同じ |
| 20 | `measure()`（HISTORYの高さ計算）を150msにまとめる。`update()` は「読んでから書く」順に固定。ヒーロー画像の `<link rel=preload>` を外す（img 自体が body 先頭にあり `fetchpriority=high` で同等） | フォント到着ごとの強制レイアウト連発（TBT）と、Lighthouse の FCP 依存グラフの肥大を避ける |

## 画像処理の記録

| 出力 | 元素材 | 処理 |
|---|---|---|
| `images/hero.jpg` 623×882 | `01_配布ビラ.png`（1414×2000） | 写真部分 x413-1036 / y513-1395 を切り出し → グレースケール化・レベル正規化 → JPEG q88。ビラ自体が紺のデュオトーン印刷なので、元の白黒写真が入手できたらそれに差し替えるのが望ましい |
| `images/history-03.jpg` 880×786 | `02_旧店舗の写真.png`（1536×2048、3.3MB） | 上部 1536×1372 を切り出し（プロトタイプの枠と同じ構図）→ 横880pxに縮小 → JPEG q84（77KB） |
| `images/history-01/04/05/07.jpg` | HISTORY プロトタイプに埋め込まれていた無加工版 | 再圧縮のみ（440px幅。より大きい原本があれば差し替え推奨） |
| `images/ogp.jpg` 1200×630 | 本サイトのヒーロー | 1200×630 のウィンドウで開幕演出後に撮影 → JPEG q86 |
| favicon 3種 | なし（暫定） | SVG（オレンジ地・黒「70」）を 64px / 180px にラスタライズ |

発注者がスマホ写真をそのまま入れた場合：表示はされるが1枚2〜5MBになる。差し替え依頼が来たら横1200〜1600px・JPEG q80〜85 に縮小して入れ直す（sharp などで可。WebP化はしない）。

## 動作確認（2026-09-05、ローカル http-server・Chrome 148 headless）

- 320 / 375 / 390 / 768 / 1024 / 1440 / 2560 px で撮影し、横はみ出しなし。ヒーロー・年表・EVENT・CONTENTS はプロトタイプと一致。
- ピン留め HISTORY：縦スクロール50%でレールが -1067px 移動、カウンター 1991、進行バー 50%。
- 鏡：パネル幅 284px で半径 59.6px（= 幅の21%）、`clip-path: circle()` と縁が追従。
- 写真の追加フロー：`.sp` / `.shot.empty` に `<img>` を1行足すだけで紺のデュオトーン枠になることを確認。
- `prefers-reduced-motion: reduce`：Lenis 未起動、版・文字・フッター即表示、マーキー停止、紙吹雪 0 個。
- Lighthouse（モバイル）：下表。**simulate は Google Fonts を FCP の前提に含めるため悲観的**。observed が実測に近い。ローカルは gzip なし・Cloudflare Pages では圧縮されるので、公開後に再計測すること。

| 方式 | Performance | Accessibility | SEO | Best Practices | FCP | LCP | TBT | CLS | observed FCP / LCP |
|---|---|---|---|---|---|---|---|---|---|
| simulate（既定） | 67 | 100 | 100 | 100 | 4.7 s | 5.2 s | 0 ms | 0 | 1.5 s / 2.9 s |
| devtools（実スロットリング：CPU 4x・低速4G） | 66 | 100 | 100 | 100 | 3.2 s | 3.2 s | 580 ms | 0 | 3.2 s / 3.2 s |

参考：移植直後（フォント通常読み込み・見出し未修正）は simulate 55 / devtools 40、TBT 1,980 ms、フォント 75 ファイル 1.1MB だった。現在はフォント 3 ファイル、転送合計 488KB。
**Performance 75 には未達。** 残りの主因は (a) 開幕演出でヒーロー下の情報が約3.4秒かけて現れること（Speed Index に効く。仕様で承認済みの演出）、(b) ローカルは無圧縮（公開後は Cloudflare が gzip/brotli 化）、(c) Lighthouse のモバイル想定（DPR 1.75）では写真が「大きすぎ」と判定されること（実機の高解像度画面向けにあえて大きめ）。公開URLで再計測し、必要なら hero.jpg を 480px 幅に落とす。

- **モバイルエンジン検証（2026-09-05、Playwright）**：WebKit（iPhone 14 エミュレーション）と Chromium（Pixel 7 エミュレーション）で、MESSAGE 本文の計算済みフォントが Shippori Mincho、ヒーロー写真と年表写真の画素が紺（平均 R114 G121 B170、紺判定 80〜91%、グレー 1〜5%）、帯2本が −2.4°／+1.8° で25px重なって交差、横スワイプの年表・タップの鏡・カウントダウンが動作、JS エラーなし。
- **未実施：iPhone / Android の実機**。エンジン検証は実機の代替にはならないため、公開後に必ず実機で確認する（仕様 §6-5）。特に iOS 26 Safari でヒーロー写真が紺になっているか。

ローカルで見るには、このフォルダで `npx http-server -p 8137` を実行して `http://localhost:8137/` を開く。

## 公開手順（Phase 4：発注者のアカウントで行う）

1. GitHub にサインアップ → 「New repository」→ 名前 `labo-70th`、Public、README なしで作成。
2. リポジトリ画面「uploading an existing file」から、このフォルダの中身をドラッグ＆ドロップ（`_old-20260901/` と `.claude/` は不要）。「Commit changes」。
3. Cloudflare にサインアップ → Workers & Pages → Create → Pages → Connect to Git → 上のリポジトリを選択。
   - Project name：`labo-70th`（取れれば公開URLは `https://labo-70th.pages.dev/`）
   - Framework preset：None ／ Build command：空 ／ Build output directory：`/`
4. 公開URLが確定したら `index.html` 内の `https://labo-70th.pages.dev/` を検索して置換（canonical / og:url / og:image / twitter:image / JSON-LD の url・image）。
5. LINE の「Keep メモ」などに URL を貼ってサムネイルが出ることを確認。出ない場合は `https://poker.line.naver.jp/` でキャッシュを更新するか、URL 末尾に `?v=2` を付けて再共有。
6. 将来 `70th.labo1956.com` を使う場合は Pages の Custom domains から追加（無料）。

## 未確定・差し替え待ち（仕様 §11）

1. 年表の年号・出来事（`仮` タグ付きの枠）
2. 古写真：history-02 / 06 / 08（PHOTO WANTED 3枠）
3. スタッフ5名の名前・写真・自由文（`staff-01〜05.jpg`）
4. Food & Drink の追加出店者（`.shop` 行をコピーで追加）
5. 70周年ロゴ（ファビコン差し替え）
6. 感謝祭終了後：`history-09.jpg` を入れて最後の枠を写真に（編集マニュアル 7章）
