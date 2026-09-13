/* 旅食Navi — 共有データベース（Firebase Firestore）の設定
 *
 * ここが null のままだと「この端末だけ」モードで動きます。
 * 共有を有効にするには README.md の手順で Firebase プロジェクトを作り、
 * 「プロジェクトの設定 → マイアプリ → SDK の設定と構成」に出る firebaseConfig を
 * そのまま下に貼り付けてください。
 *
 * apiKey などは公開して構わない値です（アクセス制御は Firestore のセキュリティルールで行います）。
 */
window.FIREBASE_CONFIG = null;

/* 例：
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "tabishoku-navi.firebaseapp.com",
  projectId: "tabishoku-navi",
  storageBucket: "tabishoku-navi.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef0123456789"
};
*/
