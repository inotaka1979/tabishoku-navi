# 旅食Navi — 出張・旅先で外さない店探し

行った人の「証明つき採点」だけで飲食店を選ぶ、スマホ向けの単一 HTML アプリです。
サーバー不要で動き、共有データベースをつなぐと採点・店情報・縮小写真を全員で共有できます。

- 公開ページ: https://inotaka1979.github.io/tabishoku-navi/
- ファイル構成
  - `index.html` — アプリ本体（HTML / CSS / JS を 1 ファイルに内包）
  - `firebase-config.js` — 共有データベースの設定（未設定なら端末内モード）
  - `firestore.rules` — Firestore に貼るセキュリティルール
  - `.github/workflows/pages.yml` — main へ push すると GitHub Pages に自動配信

## 仕組みの要点

| 機能 | 内容 |
|---|---|
| 採点 | 5 カテゴリ 19 項目を 5 段階で採点。利用シーン（一人出張 / 接待 / 家族 / デート）で重みが変わる |
| 証明 | レシート写真つき、または行った日のうちの記録だけを点数に算入。記憶で書いた採点は情報としてのみ載る |
| 足切り | 店員の態度・トイレ・清潔感のどれかが 2 以下なら総合点の上限 3.5 |
| 店の点 | 件数が少ないうちは全体平均に寄せたベイズ平均。点線のスタンプは 1 人だけの採点 |
| 写真 | 元サイズは端末の IndexedDB にだけ保存。共有には長辺 480px の縮小版を 3 枚まで |
| 共有 | claude.ai 上ではアーティファクトの共有 DB、通常のホスティングでは Firebase Firestore |

## 公開手順（GitHub Pages）

1. リポジトリの **Settings → Pages** を開き、Source が **GitHub Actions** になっていることを確認します
   （初回の workflow 実行が自動で有効化を試みます。失敗している場合はここで選び直して再実行してください）。
2. `main` に push すると `.github/workflows/pages.yml` が配信します。数十秒で上記 URL に反映されます。

この状態では **端末内モード** で動きます（採点は各自のスマホにだけ保存）。

## 共有を有効にする（Firebase Firestore）

無料枠（Spark プラン）で十分動きます。所要 10 分ほどです。

1. https://console.firebase.google.com/ で **プロジェクトを追加**（名前は任意、Google アナリティクスは不要）。
2. 左メニュー **構築 → Firestore Database → データベースを作成**。
   ロケーションは `asia-northeast1`（東京）、モードは **本番環境モード** を選びます。
3. Firestore の **ルール** タブに、このリポジトリの `firestore.rules` の内容を貼り付けて **公開**。
4. 左メニュー **構築 → Authentication → 始める → ログイン方法** で **匿名** を有効にします
   （アプリは匿名ログインで書き込みます。ユーザー登録は不要です）。
5. 歯車 **プロジェクトの設定 → マイアプリ → ウェブアプリを追加**（`</>` アイコン）。
   ニックネームは任意、Hosting は不要。表示される `firebaseConfig = { ... }` をコピーします。
6. `firebase-config.js` の `window.FIREBASE_CONFIG = null;` を、コピーした値に置き換えて commit / push します。
7. **Authentication → 設定 → 承認済みドメイン** に `inotaka1979.github.io` を追加します。

ページを開き直して「自分」タブの上部が **共有につながっています（Firebase）** になれば完了です。

`apiKey` などは公開前提の値です。書き込みの制限は `firestore.rules` が担います。

## ローカルで試す

```bash
python3 -m http.server 8000
# http://localhost:8000/ を開く
```

`file://` で直接開いても動きますが、位置情報などブラウザ機能の一部は http(s) 経由でのみ使えます。

## データの保存場所

| 種類 | 保存先 |
|---|---|
| 採点・店情報・採点者名・縮小写真 | 共有 DB（未設定時は端末の localStorage） |
| 写真の元サイズ | 端末の IndexedDB（他の人には見えません） |
| 下書き・行きたいリスト・表示名 | 端末の localStorage |
