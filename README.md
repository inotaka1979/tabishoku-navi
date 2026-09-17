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
| 地図 | Leaflet + OpenStreetMap で現在地と登録店を表示。周辺の未登録飲食店は OpenStreetMap（Overpass API）から取得。各ピンから Google マップの経路案内へ |

## 公開手順（GitHub Pages）

1. リポジトリの **Settings → Pages** を開き、Source を **GitHub Actions** にします
   （初回の有効化は手動で行う必要があります。有効化前に workflow が動くと
   「Resource not accessible by integration」で失敗するので、有効化してから push し直してください）。
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

## 地図の使い方

1. 「探す」画面の並び順チップの列にある **地図** をタップすると地図が開きます。
2. **現在地** を押すと位置情報の許可を求められ、現在地に地図が寄ります（青い丸が現在地）。
3. **周辺の飲食店を表示** を押すと、半径 700m の飲食店（OpenStreetMap 登録分）がオレンジ（ホットペッパー）と黄色（OpenStreetMap）の点で出ます。
   点をタップすると「採点する」「Google マップ」「経路」が選べます。
4. 登録済みの店は点数つきの青いピン、行きたいリストの店は赤枠つきで表示されます。
   ピンをタップすると「店ページ」と「経路」（Google マップの徒歩ルート）が開きます。

地図データは OpenStreetMap（© OpenStreetMap contributors）です。

### 周辺の飲食店を増やす（ホットペッパーグルメ Web サービス、無料）

OpenStreetMap の飲食店データは日本では登録が少ないため、リクルートの
ホットペッパーグルメ Web サービスを併用できます。全国の飲食店の店名・位置・ジャンル・予算・
営業時間・店舗ページが取れます。クレジットカード不要、メール登録のみです。

1. https://webservice.recruit.co.jp/register/ でメールアドレスを登録
2. 届いたメールの **API キー**（英数字 16 桁）をコピー
3. `firebase-config.js` の `window.HOTPEPPER_KEY = null;` を `window.HOTPEPPER_KEY = "コピーしたキー";` に変えて push

4. ブラウザから直接 API を呼べない（CORS 非対応）ため、中継用の Cloudflare Worker が必要です。
   現在は boatrace-ai リポジトリの Worker `boatrace-scrape-trigger` の `/hotpepper` ルートを
   相乗りで使っています（`window.HOTPEPPER_PROXY` に設定済み）。
   独立した Worker を立てる場合は次の手順です。
   - https://dash.cloudflare.com/ → **Workers & Pages** → **Create** → **Start with Hello World!**
   - 名前を `tabishoku-proxy` にして **Deploy**
   - **Edit code** を開き、`cloudflare-worker/worker.js` の中身を全部貼り付けて **Deploy**
   - 表示される URL（`https://tabishoku-proxy.xxxx.workers.dev`）を `firebase-config.js` の
     `window.HOTPEPPER_PROXY` に設定して push
   - Worker は同じ位置の結果を 10 分キャッシュし、`inotaka1979.github.io` からの呼び出しだけ許可します

以後、地図の「周辺の飲食店を表示」でホットペッパーの店がオレンジの点で加わり、
タップすると写真・ジャンル・予算・営業時間と「ホットペッパー」リンクが出ます。
利用規約により、周辺店を表示した画面には「Powered by ホットペッパーグルメ Webサービス」の
クレジットが自動で付きます。1 日あたりのアクセス上限（3,000 回目安）があるため、
取得結果は端末内で位置ごとにキャッシュしています。

### Yahoo! JAPAN ローカルサーチも併用する（無料）

ホットペッパー未掲載の個人店を補うため、Yahoo! JAPAN のローカルサーチ API も併用できます。
1. https://e.developer.yahoo.co.jp/register でアプリを登録（種類「クライアントサイド」、サイト URL は公開ページの URL）
2. 発行された **Client ID** を `firebase-config.js` の `window.YAHOO_APPID` に設定して push
3. ブラウザから直接呼べる（JSONP）ため中継サーバーは不要。地図では赤い点、一覧では「Yahoo! JAPAN 登録店」と表示

利用規約により「Web Services by Yahoo! JAPAN」のクレジットを自動表示します。

### キーワードで提供元に問い合わせる

検索欄に語を入れて **Enter か「検索」** を押すと、ホットペッパー（`keyword`）と Yahoo!（`query`）に
現在地または地図の中心から最大 3km の範囲でキーワード付きの問い合わせを行います。提供元側が店名だけでなく
メニュー・紹介文・ジャンルも対象に検索するため、「牛タン」「個室」「深夜」「日本酒」のような探し方ができます。
入力中は手元の店の絞り込みだけを行い、検索語を消すと通常の周辺一覧に戻ります。

### 周辺の未評価店を一覧で見る

位置情報を許可すると、「探す」画面の採点済み一覧の下に **周辺の店（未評価）** が近い順に並びます
（現在地から 1km、ホットペッパー掲載店と OpenStreetMap 登録店）。検索語やジャンルの絞り込みも効きます。
タップすると写真・営業時間・定休日・予算・席数などの情報と「この店を採点する」「ホットペッパーで見る」
「Googleマップ」「経路」が出ます。採点して保存すると、その店が登録されて点数がつきます。

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
