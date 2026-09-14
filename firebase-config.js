/* 旅食Navi — 共有データベース（Firebase Firestore）の設定
 *
 * apiKey などは公開して構わない値です（アクセス制御は Firestore のセキュリティルールで行います）。
 * 共有を止めたいときは window.FIREBASE_CONFIG = null; に戻すと「この端末だけ」モードになります。
 */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBBRF-h79ModrGcUkMWqj3q_jXhHGNegQI",
  authDomain: "tabishoku-navi.firebaseapp.com",
  projectId: "tabishoku-navi",
  storageBucket: "tabishoku-navi.firebasestorage.app",
  messagingSenderId: "250142222574",
  appId: "1:250142222574:web:1d006a731f52d5e95aabff"
};

/* 周辺の飲食店データ（ホットペッパーグルメ Web サービス）の API キー。
 * https://webservice.recruit.co.jp/register/ でメール登録すると無料で発行されます。
 * null のままだと周辺店は OpenStreetMap のデータだけになります（日本では登録が少なめ）。
 * このキーはページに埋め込まれるため公開されます。利用規約上それで問題ありません。 */
window.HOTPEPPER_KEY = "fa926e77c5ff30a7";

/* ホットペッパーの中継 Worker の URL（cloudflare-worker/worker.js を Cloudflare に置いたもの）。
 * ブラウザから webservice.recruit.co.jp を直接呼べないため、これが無いと周辺店は OpenStreetMap だけになります。
 * 例: window.HOTPEPPER_PROXY = "https://tabishoku-proxy.xxxx.workers.dev"; */
window.HOTPEPPER_PROXY = "https://boatrace-scrape-trigger.inotaka1979.workers.dev";

/* Yahoo! JAPAN ローカルサーチ API の Client ID（周辺の飲食店データ。ホットペッパー未掲載の店を補う）。
 * https://e.developer.yahoo.co.jp/register でアプリ登録（クライアントサイド）すると発行されます。
 * ブラウザから直接呼べるため中継は不要。null なら Yahoo! は使いません。 */
window.YAHOO_APPID = "dmVyPTIwMjUwNyZpZD1DcUxHZVROdkNCJmhhc2g9T1dZME1tVmhOV0ZtWldNNE5tWmtNdw-";
