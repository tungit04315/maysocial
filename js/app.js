import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig),
  auth = getAuth(app),
  db = getFirestore(app);

/* ---------- Log lỗi ra Console (F12) để dễ sửa ---------- */
const logErr = (where, e) =>
  console.error(`[MâySocial] ${where} →`, e?.code || "", e?.message || e, e);
window.addEventListener("error", (ev) =>
  logErr("Lỗi JS", ev.error || ev.message),
);
window.addEventListener("unhandledrejection", (ev) =>
  logErr("Promise bị từ chối", ev.reason),
);
const $ = (s) => document.querySelector(s);
const val = (id) => document.getElementById(id)?.value.trim() || "";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
      c
      ],
  );
const vnd = (n) => Number(n || 0).toLocaleString("vi-VN") + "đ";
const num = (n) => Number(n || 0).toLocaleString("vi-VN");
const fdate = (t) =>
  t?.toDate
    ? t.toDate().toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "";

const P = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  box: "M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10",
  list: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 8h6M9 12h6M9 16h3",
  wallet:
    "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2zM16 14h2",
  help: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3zM17 19c0 1.5-2 2-5 2",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  chev: "M6 9l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  bar: "M5 20V12M12 20V6M19 20V10",
  back: "M19 12H5M11 6l-6 6 6 6",
  bank: "M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18",
  card: "M3 6h18v12H3zM3 10h18",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  cart: "M3 4h3l2 12h10l2-8H7M10 20h.01M17 20h.01",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  check: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  heart:
    "M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z",
};
const I = (n, s = 22) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${P[n]}"/></svg>`;
const logo = () =>
  `<svg width="42" height="32" viewBox="0 0 42 32"><circle cx="11" cy="21" r="9" fill="#3b82f6"/><circle cx="25" cy="13" r="11" fill="#ff6f61"/><circle cx="32" cy="22" r="8" fill="#ff8a7a"/></svg>`;
// Logo nền tảng: chỉ là ký hiệu thay thế; thay bằng file logo chính thức trong assets/ khi có.
const PF = {
  facebook: ["Facebook", "#1877f2", "f"],
  tiktok: ["TikTok", "#000", "♪"],
  youtube: ["YouTube", "#e62117", "▶"],
  google: ["Google", "#4285f4", "G"],
};
const pfi = (k, s = 44) => {
  const p = PF[k] || ["", "#888", "?"];
  return `<span class="pf" style="width:${s}px;height:${s}px;background:${p[1]};font-size:${s * 0.48}px">${p[2]}</span>`;
};
const ST = {
  completed: ["Hoàn tất", "ok"],
  processing: ["Đang xử lý", "pr"],
  pending: ["Chờ xử lý", "wa"],
};
const HOST = {
  facebook: /(^|\.)(facebook\.com|fb\.com|fb\.watch)$/,
  tiktok: /(^|\.)tiktok\.com$/,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/,
  google: /./,
};
const okLink = (p, l) => {
  try {
    const u = new URL(l);
    return u.protocol === "https:" && (HOST[p] || /./).test(u.hostname);
  } catch {
    return false;
  }
};
const FAQ = [
  [
    "Làm thế nào để tạo đơn hàng?",
    "dich",
    "Vào mục Dịch vụ, chọn dịch vụ, dán liên kết, nhập số lượng rồi bấm Tiếp tục đặt đơn. Số dư phải đủ để thanh toán.",
  ],
  [
    "Khi nào đơn hàng được xử lý?",
    "don",
    "Đơn mới có trạng thái Chờ xử lý, sau đó chuyển sang Đang xử lý và Hoàn tất. Bạn theo dõi tại mục Đơn hàng.",
  ],
  [
    "Nạp tiền vào tài khoản bằng cách nào?",
    "nap",
    "Vào mục Nạp tiền, chọn số tiền và tạo lệnh nạp. Chuyển khoản đúng nội dung được cung cấp; số dư cập nhật sau khi giao dịch được xác nhận.",
  ],
  [
    "Tôi có thể theo dõi trạng thái đơn ở đâu?",
    "don",
    "Mục Đơn hàng hiển thị trạng thái từng đơn; bấm Chi tiết để xem thông tin đầy đủ.",
  ],
];
const CATS = [
  [
    "tk",
    "user",
    "Tài khoản",
    "Quản lý thông tin, bảo mật và các vấn đề liên quan tài khoản.",
  ],
  [
    "dich",
    "box",
    "Dịch vụ",
    "Tìm hiểu về dịch vụ, cách sử dụng và các vấn đề thường gặp.",
  ],
  [
    "don",
    "list",
    "Đơn hàng",
    "Theo dõi đơn hàng, trạng thái xử lý và các thắc mắc liên quan.",
  ],
  [
    "nap",
    "wallet",
    "Nạp tiền",
    "Hướng dẫn nạp tiền, phương thức thanh toán và xử lý sự cố.",
  ],
];

const S = {
  user: undefined,
  profile: null,
  services: [],
  orders: [],
  q: "",
  pf: "all",
  st: "all",
  page: 1,
  menu: false,
  tab: "login",
  metric: "qty",
  topup: { a: 500000 },
  cat: null,
  open: null,
  req: null,
  unsub: [],
};
let comp = 0;
document.addEventListener("compositionstart", () => (comp = 1));
document.addEventListener("compositionend", () => (comp = 0));
const route = () => location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
const toast = (m, e) => {
  const t = $("#toast");
  t.innerHTML = `<div class="${e ? "err" : ""}">${esc(m)}</div>`;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.innerHTML = ""), 4200);
};
const modal = (h) =>
($("#modal").innerHTML = h
  ? `<div class="ov"><div class="md">${h}</div></div>`
  : "");
const MSG = {
  "auth/invalid-credential": "Email hoặc mật khẩu không đúng",
  "auth/email-already-in-use": "Email đã được sử dụng",
  "auth/weak-password": "Mật khẩu tối thiểu 6 ký tự",
  "auth/invalid-email": "Email không hợp lệ",
  "auth/too-many-requests": "Thử quá nhiều lần, vui lòng đợi rồi thử lại",
  "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập",
  "permission-denied": "Bạn không có quyền thực hiện thao tác này",
  unavailable: "Mất kết nối, vui lòng thử lại",
};
const run = async (el, f) => {
  if (el?.disabled) return;
  if (el) el.disabled = true;
  try {
    await f();
  } catch (e) {
    logErr("Thao tác thất bại", e);
    toast(MSG[e.code] || e.message || "Đã xảy ra lỗi", 1);
  } finally {
    if (el) el.disabled = false;
  }
};
const qerr = (e) => {
  logErr("Không tải được dữ liệu", e);
  toast(MSG[e.code] || "Không tải được dữ liệu: " + e.message, 1);
};
const toMs = (t) => (t?.toDate ? t.toDate().getTime() : Date.now());
async function ensureProfile(u) {
  const ref = doc(db, "users", u.uid),
    s = await getDoc(ref);
  if (!s.exists())
    await setDoc(ref, {
      displayName: (u.displayName || S.regName || "").slice(0, 80),
      email: u.email || "",
      balance: 0,
      role: "user",
      disabled: false,
      createdAt: serverTimestamp(),
    });
  else if (!s.data().email && u.email) await updateDoc(ref, { email: u.email });
}

onAuthStateChanged(auth, async (u) => {
  S.unsub.forEach((f) => f());
  S.unsub = [];
  S.user = u;
  if (!u) {
    S.profile = null;
    S.services = [];
    S.orders = [];
    return render();
  }
  try {
    await ensureProfile(u);
  } catch (e) {
    qerr(e);
  }
  console.info("[MâySocial] Đã đăng nhập:", u.uid, u.email);
  S.unsub.push(
    onSnapshot(
      doc(db, "users", u.uid),
      (d) => {
        S.profile = d.data() || null;
        if (S.profile?.disabled === true) {
          toast("Tài khoản đã bị khóa", 1);
          signOut(auth);
          return;
        }
        render();
      },
      qerr,
    ),
  );
  S.unsub.push(
    onSnapshot(
      query(collection(db, "services"), where("active", "==", true)),
      (s) => {
        S.services = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        render();
      },
      qerr,
    ),
  );
  S.unsub.push(
    onSnapshot(
      // Chỉ lọc theo uid (không orderBy) => KHÔNG cần composite index; sắp xếp ở client
      query(collection(db, "orders"), where("uid", "==", u.uid)),
      (s) => {
        S.orders = s.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
        render();
      },
      qerr,
    ),
  );
});
window.addEventListener("hashchange", () => {
  S.q = "";
  S.page = 1;
  S.menu = false;
  S.cat = null;
  S.open = null;
  S.req = null;
  modal("");
  render();
  scrollTo(0, 0);
});

function render() {
  if (S.user === undefined || comp) return;
  const root = $("#app"),
    keep = [...root.querySelectorAll("input[id],textarea[id],select[id]")].map(
      (e) => [e.id, e.value, e.checked],
    );
  const a = document.activeElement,
    fid = a?.id,
    ss = a?.selectionStart;
  root.innerHTML = S.user ? main() : authView();
  keep.forEach(([i, v, c]) => {
    const e = document.getElementById(i);
    if (!e) return;
    if (e.type === "checkbox") e.checked = c;
    else if (e.value !== v) e.value = v;
  });
  if (fid) {
    const e = document.getElementById(fid);
    if (e) {
      e.focus();
      try {
        e.setSelectionRange(ss, ss);
      } catch { }
    }
  }
}

/* ---------- Auth (GIAO DIỆN MỚI) ---------- */
const AI = {
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0",
  mail: "M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zM3.3 6.6L12 13l8.7-6.4",
  lock: "M6 10.5h12a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.5a1 1 0 0 1 1-1zM8 10.5V7.5a4 4 0 0 1 8 0v3",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z",
  eyeoff:
    "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM4 4l16 16",
};
const aic = (n, s = 22) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${AI[n]}"/></svg>`;

const cloudLogo = () =>
  `<svg width="64" height="46" viewBox="0 0 64 46" aria-hidden="true"><defs>
  <linearGradient id="lgB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8cff"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
  <linearGradient id="lgC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a6b"/><stop offset="1" stop-color="#ff8f80"/></linearGradient></defs>
  <path d="M12 42a10 10 0 0 1-1.6-19.9A14 14 0 0 1 37 20.5 11 11 0 0 1 35 42z" fill="url(#lgB)"/>
  <path d="M30 42a10 10 0 0 1-.6-20A13 13 0 0 1 54 19a11 11 0 0 1-1.5 23z" fill="url(#lgC)" opacity=".96"/>
  <circle cx="36" cy="15" r="13" fill="#ff6f61" opacity=".95"/></svg>`;

const googleG = () =>
  `<svg width="24" height="24" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;

const authArt = () => {
  const tile = (x, y, r, inner) =>
    `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-70" y="-70" width="140" height="140" rx="30" fill="#fff" filter="url(#lgSh)"/>${inner}</g>`;
  return `<svg class="lg-art" viewBox="0 0 920 620" aria-hidden="true">
  <defs>
    <filter id="lgSh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#5b4fe0" flood-opacity=".14"/></filter>
    <linearGradient id="lgIg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".65" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient>
    <linearGradient id="lgBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a99cf5"/><stop offset="1" stop-color="#c9c1fa"/></linearGradient>
  </defs>
  <g fill="none" stroke="#b9b3ec" stroke-width="2" stroke-dasharray="7 9" stroke-linecap="round" opacity=".9">
    <path d="M170 235C150 320 195 345 255 345"/>
    <path d="M400 150C470 70 640 90 700 190"/>
    <path d="M700 320C790 380 790 440 700 480"/>
    <path d="M150 485C210 570 330 585 420 530"/>
  </g>
  <g transform="translate(455 330) rotate(8)">
    <rect x="-200" y="-135" width="400" height="270" rx="30" fill="#fff" filter="url(#lgSh)"/>
    <circle cx="-160" cy="-98" r="7" fill="#ff6f61"/><circle cx="-134" cy="-98" r="7" fill="#e8d27a"/><circle cx="-108" cy="-98" r="7" fill="#9aa0c8"/>
    <rect x="-165" y="-62" width="330" height="170" rx="20" fill="#f4f2ff"/>
    <rect x="-140" y="-38" width="120" height="14" rx="7" fill="#c9c3f6"/>
    <rect x="-140" y="-10" width="82" height="14" rx="7" fill="#d9d4f9"/>
    <rect x="-140" y="18" width="58" height="14" rx="7" fill="#d9d4f9"/>
    <rect x="-20" y="62" width="26" height="30" rx="7" fill="url(#lgBar)" opacity=".8"/>
    <rect x="18" y="42" width="26" height="50" rx="7" fill="url(#lgBar)" opacity=".85"/>
    <rect x="56" y="14" width="26" height="78" rx="7" fill="url(#lgBar)" opacity=".92"/>
    <rect x="94" y="-24" width="26" height="116" rx="7" fill="url(#lgBar)"/>
  </g>
  ${tile(165, 125, -8, `<circle r="38" fill="#1877f2"/><text x="0" y="22" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="64" fill="#fff">f</text>`)}
  ${tile(582, 85, 8, `<g transform="translate(-30 -30) scale(2.5)"><path transform="translate(-.5 .5)" fill="#25f4ee" d="M12.5.02c1.3-.02 2.6-.01 3.9-.02.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8v4c-1.4 0-2.9-.3-4.2-1-.6-.3-1.1-.6-1.6-.9v8.8c-.1 1.4-.5 2.8-1.4 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.6-5.700v-1.500c.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.2-1.700v4.400c-1-.3-2.2-.2-3 .4-.6.4-1.1 1-1.4 1.8-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.400V.02z"/><path transform="translate(.5 -.5)" fill="#fe2c55" d="M12.5.02c1.3-.02 2.6-.01 3.9-.02.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8v4c-1.4 0-2.9-.3-4.2-1-.6-.3-1.1-.6-1.6-.9v8.8c-.1 1.4-.5 2.8-1.4 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.6-5.700v-1.500c.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.2-1.700v4.400c-1-.3-2.2-.2-3 .4-.6.4-1.1 1-1.4 1.8-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.400V.02z"/><path fill="#000" d="M12.5.02c1.3-.02 2.6-.01 3.9-.02.1 1.5.6 3.1 1.8 4.2 1.1 1.1 2.7 1.6 4.2 1.8v4c-1.4 0-2.9-.3-4.2-1-.6-.3-1.1-.6-1.6-.9v8.8c-.1 1.4-.5 2.8-1.4 3.9-1.3 1.9-3.6 3.2-5.9 3.2-1.4.1-2.9-.3-4.1-1-2-1.2-3.4-3.4-3.6-5.700v-1.500c.2-1.9 1.1-3.7 2.6-5 1.7-1.4 4-2.1 6.2-1.700v4.400c-1-.3-2.2-.2-3 .4-.6.4-1.1 1-1.4 1.8-.2.5-.1 1.1-.1 1.6.2 1.6 1.8 3 3.5 2.9 1.1 0 2.2-.7 2.8-1.6.2-.3.4-.7.4-1.1.1-1.8.1-3.6.1-5.400V.02z"/></g>`)}
  ${tile(833, 248, 8, `<rect x="-36" y="-36" width="72" height="72" rx="20" fill="url(#lgIg)"/><rect x="-21" y="-21" width="42" height="42" rx="12" fill="none" stroke="#fff" stroke-width="4.5"/><circle r="10" fill="none" stroke="#fff" stroke-width="4.5"/><circle cx="14" cy="-14" r="3" fill="#fff"/>`)}
  ${tile(85, 380, 10, `<rect x="-38" y="-27" width="76" height="54" rx="16" fill="#ff0000"/><path d="M-9 -15L17 0L-9 15z" fill="#fff"/>`)}
  ${tile(685, 545, -8, `<g transform="translate(-30 -30) scale(2.5)"><path fill="#000" d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zM17.61 20.64h2.04L6.49 3.24H4.3z"/></g>`)}
  <path transform="translate(308 62) scale(2.7)" fill="#ff7a7a" d="M12 21s-8.5-5.3-8.5-11.6A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 8.5 2.8C20.5 15.7 12 21 12 21z"/>
  <path transform="translate(748 372) scale(2.5) rotate(-6 12 12)" fill="#5b8def" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.3l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
</svg>`;
};

const authBg = () =>
  `<svg class="lg-bg" viewBox="0 0 2560 1440" preserveAspectRatio="xMinYMax slice" aria-hidden="true"><defs>
  <radialGradient id="lgCl" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#e4defb"/><stop offset="1" stop-color="#f3f0fe"/></radialGradient></defs>
  <g fill="url(#lgCl)" opacity=".85">
    <circle cx="1170" cy="860" r="215"/><circle cx="1040" cy="940" r="170"/>
    <circle cx="130" cy="1070" r="200"/><circle cx="330" cy="1130" r="130"/>
    <circle cx="520" cy="1290" r="190"/><circle cx="820" cy="1290" r="170"/>
    <circle cx="1060" cy="1370" r="210"/><circle cx="240" cy="1380" r="190"/>
  </g></svg>`;

const field = (id, ic, ph, type = "text", eye = 0) =>
  `<div class="lg-input"><span class="lg-ic">${aic(ic, 22)}</span><input id="${id}" type="${type}" placeholder="${ph}" autocomplete="off">${eye ? `<button type="button" class="lg-eye" data-act="eye" data-v="${id}" aria-label="Hiện/ẩn mật khẩu">${aic("eye", 22)}</button>` : ""}</div>`;

function authView() {
  const l = S.tab === "login";
  return `<div class="lg">${authBg()}
  <section class="lg-left">
    <div class="lg-brand">${cloudLogo()}<span>Mây Social</span></div>
    <h1>${l ? "Chào mừng bạn<br>đến với <b>Mây Social</b>" : "Bắt đầu hành trình<br>cùng <b>Mây Social</b>"}</h1>
    <p class="lg-sub">${l ? "Quản lý dịch vụ marketing mạng xã hội<br>trong một không gian." : "Tạo tài khoản để quản lý dịch vụ marketing<br>mạng xã hội trong một không gian."}</p>
    ${authArt()}
    <div class="lg-tag"><i></i>Kết nối thương hiệu<br>với những người quan tâm thật sự</div>
  </section>
  <section class="lg-card">
    <div class="lg-tabs"><button data-act="tab" data-v="login" class="${l ? "on" : ""}">Đăng nhập</button><button data-act="tab" data-v="register" class="${l ? "" : "on"}">Đăng ký</button></div>
    <h2>${l ? "Đăng nhập" : "Tạo tài khoản"}</h2>
    <p class="lg-card-sub">${l ? "Tiếp tục với tài khoản của bạn" : "Đăng ký để bắt đầu sử dụng Mây Social"}</p>
    ${l ? "" : `<label class="lg-lbl">Họ và tên</label>${field("a_name", "user", "Nhập họ và tên")}`}
    <label class="lg-lbl">Email</label>${field("a_email", "mail", "ten@email.com", "email")}
    <label class="lg-lbl">Mật khẩu</label>${field("a_pw", "lock", l ? "Nhập mật khẩu" : "Tạo mật khẩu", "password", 1)}
    ${l ? "" : `<label class="lg-lbl">Xác nhận mật khẩu</label>${field("a_pw2", "lock", "Nhập lại mật khẩu", "password", 1)}`}
    ${l
      ? `<div class="lg-opts"><label class="lg-chk"><input type="checkbox" id="a_rem" checked>Ghi nhớ đăng nhập</label><a href="#" class="lg-forgot" data-act="forgot">Quên mật khẩu?</a></div>`
      : `<div class="lg-opts"><label class="lg-chk"><input type="checkbox" id="a_agree" checked>Tôi đồng ý với <a href="#" data-act="noop">Điều khoản sử dụng</a> và <a href="#" data-act="noop">Chính sách bảo mật</a></label></div>`
    }
    <button class="lg-btn" data-act="${l ? "login" : "register"}">${l ? "Đăng nhập" : "Tạo tài khoản"}</button>
    <div class="lg-or"><span>hoặc</span></div>
    <button class="lg-btn lg-google" data-act="google">${googleG()}${l ? "Tiếp tục với Google" : "Đăng ký với Google"}</button>
    <p class="lg-sw">${l ? "Chưa có tài khoản?" : "Đã có tài khoản?"} <a data-act="tab" data-v="${l ? "register" : "login"}">${l ? "Đăng ký" : "Đăng nhập"}</a></p>
  </section></div>`;
}

const doLogin = (el) =>
  run(el, async () => {
    const e = val("a_email"),
      p = $("#a_pw").value;
    if (!e || !p) return toast("Vui lòng nhập email và mật khẩu", 1);
    await setPersistence(
      auth,
      $("#a_rem").checked ? browserLocalPersistence : browserSessionPersistence,
    );
    await signInWithEmailAndPassword(auth, e, p);
  });
const doRegister = (el) =>
  run(el, async () => {
    const n = val("a_name"),
      e = val("a_email"),
      p = $("#a_pw").value,
      p2 = $("#a_pw2").value;
    if (n.length < 2) return toast("Vui lòng nhập họ và tên", 1);
    if (!/^\S+@\S+\.\S+$/.test(e)) return toast("Email không hợp lệ", 1);
    if (p.length < 6) return toast("Mật khẩu tối thiểu 6 ký tự", 1);
    if (p !== p2) return toast("Mật khẩu xác nhận không khớp", 1);
    if (!$("#a_agree").checked)
      return toast("Bạn cần đồng ý với Điều khoản và Chính sách bảo mật", 1);
    S.regName = n.slice(0, 80); // ensureProfile (onAuthStateChanged) ghi tên này vào Firestore
    const c = await createUserWithEmailAndPassword(auth, e, p);
    await updateProfile(c.user, { displayName: n });
  });

/* ---------- Shell ---------- */
function main() {
  const [r, id] = route(),
    pages = {
      "": dash,
      dashboard: dash,
      services: svcs,
      service: () => svcPage(id),
      orders: ords,
      topup: topup,
      support: supp,
    },
    p = (pages[r] || dash)();
  const cur = r === "service" ? "services" : r || "dashboard";
  const items = [
    ["dashboard", "home", "Tổng quan"],
    ["services", "box", "Dịch vụ"],
    ["orders", "list", "Đơn hàng"],
    ["topup", "wallet", "Nạp tiền"],
    ["support", "help", "Hỗ trợ"],
  ];
  const name =
    S.user.displayName || S.profile?.displayName || S.user.email || "";
  const busy = S.orders.some((o) => o.status !== "completed");
  return `<div class="layout"><aside class="side"><div class="brand">${logo()}Mây Social</div><nav class="nav">${items.map(([h, i, t]) => `<a href="#/${h}" class="${cur === h ? "on" : ""}">${I(i)}${t}</a>`).join("")}</nav><div class="tag">Kết nối thương hiệu<br>với những người<br>quan tâm thật sự</div></aside>
  <main><header class="top"><div>${p.pre || ""}${p.head}</div><div class="right"><div class="who"><a class="bell" href="#/orders" aria-label="Đơn hàng đang xử lý">${I("bell", 26)}${busy ? "<i></i>" : ""}</a><button class="me" data-act="menu"><span class="av">${esc((name.trim()[0] || "?").toUpperCase())}</span>${I("chev", 18)}</button>${S.menu ? `<div class="menu"><p>${esc(S.user.email || name)}</p><button data-act="logout">Đăng xuất</button></div>` : ""}</div>${p.act || ""}</div></header>${p.body}</main></div>`;
}
const ph = (t, s) => `<h1 class="pt">${t}</h1><p class="sub">${s}</p>`;
const stat = (ic, c, l, v) =>
  `<div class="card stat"><div class="tile ${c}">${I(ic, 28)}</div><div><small>${l}</small><b>${v}</b></div></div>`;
const empty = (m) => `<div class="empty">${esc(m)}</div>`;

/* ---------- Dashboard ---------- */
function chart() {
  const D = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 6 + i);
    return d;
  });
  const vals = D.map((d) =>
    S.orders
      .filter((o) => {
        const t = o.createdAt?.toDate?.();
        return t && t >= d && t < new Date(d.getTime() + 864e5);
      })
      .reduce(
        (a, o) => a + (S.metric === "count" ? 1 : Number(o.quantity) || 0),
        0,
      ),
  );
  const mx = Math.max(...vals, 1),
    X = (i) => 60 + i * (720 / 6),
    Y = (v) => 230 - (v / mx) * 200,
    pts = vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  const lb = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return `<svg viewBox="0 0 820 280" width="100%" role="img" aria-label="Biểu đồ 7 ngày qua">${[0, 1, 2, 3].map((k) => `<line x1="50" x2="790" y1="${30 + k * 66.7}" y2="${30 + k * 66.7}" stroke="#eeedf6"/><text x="40" y="${34 + k * 66.7}" text-anchor="end" font-size="13" fill="#7b7a9a">${num(Math.round((mx * (3 - k)) / 3))}</text>`).join("")}
  <polygon points="${X(0)},230 ${pts} ${X(6)},230" fill="#e9e6fb" opacity=".7"/><polyline points="${pts}" fill="none" stroke="#7a6cf0" stroke-width="3" stroke-linejoin="round"/>
  ${vals.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="5" fill="#8b7cf6"/><text x="${X(i)}" y="262" text-anchor="middle" font-size="13" fill="#7b7a9a">${lb[D[i].getDay()]}</text>`).join("")}</svg>`;
}
function dash() {
  const h = new Date().getHours(),
    g =
      h < 11 ? "Chào buổi sáng" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối",
    nm = (S.user.displayName || S.profile?.displayName || "bạn")
      .trim()
      .split(/\s+/)
      .pop();
  const pop = S.services
    .filter((s) => s.popular)
    .concat(S.services)
    .filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i)
    .slice(0, 4);
  return {
    head: ph(`${g}, ${esc(nm)}`, "Quản lý chiến dịch của bạn thật nhẹ nhàng"),
    body: `
  <div class="grid g4">${stat("bar", "", "Đơn đang chạy", String(S.orders.filter((o) => o.status !== "completed").length).padStart(2, "0"))}${stat("list", "c", "Tổng số đơn", num(S.orders.length))}${stat("check", "g", "Đơn hoàn tất", num(S.orders.filter((o) => o.status === "completed").length))}${stat("wallet", "c", "Số dư", vnd(S.profile?.balance))}</div>
  <div class="grid g21" style="margin:22px 0"><div class="card"><div class="row"><h2>Hiệu quả 7 ngày qua</h2><div class="input" style="height:44px;box-shadow:none"><select id="metric" data-in="metric"><option value="qty" ${S.metric === "qty" ? "selected" : ""}>Số lượng đặt</option><option value="count" ${S.metric === "count" ? "selected" : ""}>Số đơn</option></select></div></div>${chart()}</div>
  <div class="card"><h2>Nền tảng</h2><div class="plist">${Object.keys(PF)
        .map(
          (k) =>
            `<button class="pfb" data-act="pf" data-v="${k}">${pfi(k)}${PF[k][0]}<span class="sp">${I("arrow", 18)}</span></button>`,
        )
        .join("")}</div></div></div>
  <div class="row"><h2>Dịch vụ phổ biến</h2><a href="#/services">Xem tất cả ${I("arrow", 18)}</a></div>
  <div class="grid g4">${pop.length ? pop.map((s) => `<a class="card stat" href="#/service/${s.id}">${pfi(s.platform, 52)}<div><b style="font-size:17px">${esc(s.name)}</b><small>${esc(s.desc)}</small></div></a>`).join("") : `<div class="card empty" style="grid-column:1/-1">Chưa có dịch vụ nào</div>`}</div>`,
  };
}

/* ---------- Services ---------- */
function svcList() {
  const q = S.q.toLowerCase(),
    f = S.services.filter(
      (s) =>
        (S.pf === "all" || s.platform === S.pf) &&
        (!q ||
          (s.name + " " + (PF[s.platform]?.[0] || ""))
            .toLowerCase()
            .includes(q)),
    );
  if (!f.length)
    return empty(
      S.services.length
        ? "Không tìm thấy dịch vụ phù hợp"
        : "Chưa có dịch vụ nào",
    );
  return `<div class="grid g3">${f.map((s) => `<a class="card svc" href="#/service/${s.id}">${s.popular ? '<span class="badge">Phổ biến</span>' : ""}<div class="hd"><div class="tile">${pfi(s.platform, 46)}</div><div><small>${PF[s.platform]?.[0] || ""}</small><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p></div></div><span class="more">Xem chi tiết ${I("arrow", 18)}</span></a>`).join("")}</div>`;
}
const chipsRow = (cur, act, all) =>
  `<div class="chips">${all.map(([k, t, pf]) => `<button class="chip ${cur === k ? "on" : ""}" data-act="${act}" data-v="${k}">${pf ? pfi(k, 28) : ""}${t}</button>`).join("")}</div>`;
function svcs() {
  return {
    head: ph("Khám phá dịch vụ", "Chọn nền tảng và mục tiêu phù hợp"),
    body: `<div class="input">${I("search", 26)}<input id="q" data-in="q" placeholder="Tìm dịch vụ hoặc nền tảng"></div>${chipsRow(S.pf, "pf", [["all", "Tất cả"], ...Object.keys(PF).map((k) => [k, PF[k][0], 1])])}<div id="list">${svcList()}</div>`,
  };
}
function svcPage(id) {
  const s = S.services.find((x) => x.id === id);
  if (!s)
    return {
      head: ph("Dịch vụ", "Không tìm thấy dịch vụ"),
      body: `<a class="back" href="#/services">${I("back", 18)}Trở về dịch vụ</a>`,
    };
  const pn = PF[s.platform]?.[0] || "",
    ok = Number(s.pricePer1000) > 0,
    feats = s.features?.length ? s.features : [{ t: s.desc, d: "" }];
  return {
    pre: `<p class="crumb">Dịch vụ / ${pn} / <b>${esc(s.name)}</b></p><a class="back" href="#/services">${I("back", 18)}Trở về dịch vụ</a>`,
    head: `<div class="stat"><div class="tile" style="width:84px;height:84px">${pfi(s.platform, 60)}</div><div><h1 class="pt">${esc(s.name)}</h1><small class="mut">${pn}</small><p class="sub" style="font-size:16px">${esc(s.desc)}</p></div></div>`,
    body: `<div class="grid g2"><div><div class="card"><h2>Thông tin dịch vụ</h2>${feats.map((f) => `<div class="irow"><div class="tile c">${I("heart", 26)}</div><div><b>${esc(f.t)}</b><p>${esc(f.d)}</p></div></div>`).join("")}<div class="irow"><div class="tile">${I("bar", 26)}</div><div><b>Theo dõi tiến độ trong mục Đơn hàng</b><p>Dễ dàng kiểm tra trạng thái và tiến độ xử lý.</p></div></div></div>
  <div class="card" style="margin-top:22px"><h2>Lưu ý trước khi đặt</h2><div class="note">${I("info", 22)}Vui lòng kiểm tra liên kết và số lượng trước khi gửi yêu cầu.</div><ul class="nt">${(s.notes || []).map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div></div>
  <div class="card"><h2>Tạo đơn hàng</h2><label class="lbl">Liên kết</label><div class="input">${I("link", 20)}<input id="o_link" data-in="calc" placeholder="Dán liên kết ${pn}" inputmode="url"></div>
  <label class="lbl">Số lượng (${num(s.min)} – ${num(s.max)})</label><div class="input">${I("bar", 20)}<input id="o_qty" data-in="calc" inputmode="numeric" placeholder="Nhập số lượng"></div>
  <label class="lbl">Tốc độ xử lý</label><div class="input">${I("clock", 20)}<select id="o_speed"><option>Tiêu chuẩn</option></select></div>
  <div class="tot"><div class="tile">${I("wallet", 24)}</div><div><b style="font-size:16px;margin:0">Tổng tiền</b><small>${ok ? "Tự động tính sau khi nhập số lượng" : "Dịch vụ chưa được cấu hình giá"}</small></div><b id="o_total">–</b></div>
  <button class="btn" data-act="order" ${ok ? "" : "disabled"}>Tiếp tục đặt đơn ${I("arrow", 20)}</button>
  <p class="mut" style="margin-top:14px;display:flex;gap:8px">${I("info", 18)}Bạn có thể theo dõi đơn trong mục Đơn hàng</p></div></div>`,
  };
}

/* ---------- Orders ---------- */
const filt = () =>
  S.orders.filter(
    (o) =>
      (S.st === "all" || o.status === S.st) &&
      (!S.q ||
        (o.code + " " + o.serviceName)
          .toLowerCase()
          .includes(S.q.toLowerCase())),
  );
function ordList() {
  const f = filt(),
    pages = Math.max(1, Math.ceil(f.length / 5));
  if (S.page > pages) S.page = pages;
  if (!S.orders.length)
    return empty("Bạn chưa có đơn hàng nào. Hãy chọn một dịch vụ để bắt đầu.");
  if (!f.length) return empty("Không tìm thấy đơn phù hợp");
  const rows = f.slice((S.page - 1) * 5, S.page * 5),
    a = (S.page - 1) * 5,
    s0 = Math.max(1, Math.min(S.page - 2, pages - 4));
  const nums = [];
  for (let i = s0; i <= Math.min(pages, s0 + 4); i++) nums.push(i);
  return `<div class="tbl"><table><thead><tr><th>Mã đơn</th><th>Dịch vụ</th><th>Nền tảng</th><th>Ngày tạo</th><th>Số lượng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>${rows
    .map((o) => {
      const st = ST[o.status] || [o.status, "wa"];
      return `<tr><td>#${esc(o.code)}</td><td>${esc(o.serviceName)}</td><td><span class="stat" style="gap:10px">${pfi(o.platform, 38)}<span class="mut">${PF[o.platform]?.[0] || ""}</span></span></td><td>${fdate(o.createdAt)}</td><td>${num(o.quantity)}</td><td><span class="st ${st[1]}">${st[0]}</span></td><td><a href="#" data-act="detail" data-v="${o.id}">Chi tiết ${I("arrow", 16)}</a></td></tr>`;
    })
    .join("")}</tbody></table></div>
  <div class="pager"><span>Hiển thị ${a + 1}–${a + rows.length} trong ${f.length} đơn</span><div><button class="pg" data-act="page" data-v="${S.page - 1}" ${S.page < 2 ? "disabled" : ""}>‹</button>${nums.map((n) => `<button class="pg ${n === S.page ? "on" : ""}" data-act="page" data-v="${n}">${n}</button>`).join("")}<button class="pg" data-act="page" data-v="${S.page + 1}" ${S.page >= pages ? "disabled" : ""}>›</button></div></div>`;
}
function ords() {
  const c = (k) => S.orders.filter((o) => o.status === k).length;
  return {
    head: ph("Đơn hàng", "Theo dõi tiến độ và quản lý các đơn dịch vụ của bạn"),
    act: `<a class="btn sm" href="#/services">${I("plus", 20)}Tạo đơn hàng</a>`,
    body: `<div class="grid g3">${stat("list", "", "Tổng đơn", num(S.orders.length))}${stat("clock", "c", "Đang xử lý", String(c("processing")).padStart(2, "0"))}${stat("check", "g", "Hoàn tất", num(c("completed")))}</div>
  <div class="grid" style="grid-template-columns:1fr auto;margin:22px 0;align-items:center"><div class="input">${I("search", 24)}<input id="q" data-in="q" placeholder="Tìm theo mã đơn hoặc dịch vụ"></div>${chipsRow(
      S.st,
      "st",
      [
        ["all", "Tất cả"],
        ["processing", "Đang xử lý"],
        ["completed", "Hoàn tất"],
        ["pending", "Chờ xử lý"],
      ],
    ).replace('class="chips"', 'class="chips" style="margin:0"')}</div>
  <div class="card" id="list">${ordList()}</div>`,
  };
}

/* ---------- Top up ---------- */
function topup() {
  const a = S.topup.a;
  return {
    head: ph("Nạp tiền", "Chọn phương thức phù hợp để bổ sung số dư"),
    body: `<div class="card stat" style="margin-bottom:22px"><div class="tile">${I("wallet", 28)}</div><div><small>Số dư hiện tại</small><b>${vnd(S.profile?.balance)}</b></div></div>
  <div class="grid g21"><div><div class="card"><h2>Chọn phương thức nạp</h2><div class="opt"><button class="pm on">${I("bank", 34)}<span>Chuyển khoản ngân hàng</span></button><button class="pm" disabled data-act="soon">${I("wallet", 34)}<span>Ví điện tử</span><em>Chưa tích hợp</em></button><button class="pm" disabled data-act="soon">${I("card", 34)}<span>Thẻ ngân hàng</span><em>Chưa tích hợp</em></button></div>
  <h2 style="margin-top:28px">Số tiền nạp</h2><div class="amts">${[1e5, 2e5, 5e5, 1e6].map((v) => `<button class="${a === v ? "on" : ""}" data-act="amt" data-v="${v}">${vnd(v)}</button>`).join("")}</div>
  <div class="input">${I("wallet", 22)}<input id="t_other" data-in="other" inputmode="numeric" placeholder="Nhập số tiền khác"></div><div class="note">${I("shield", 22)}Số dư sẽ được cập nhật sau khi thanh toán thành công</div></div></div>
  <div><div class="card"><h2>Thông tin nạp tiền</h2><div class="kv"><span>Phương thức</span><b>Chuyển khoản ngân hàng</b></div><div class="kv"><span>Số tiền</span><b>${a ? vnd(a) : "–"}</b></div><div class="kv" style="border:0"><span>Phí giao dịch</span><b class="free">Miễn phí</b></div><button class="btn" data-act="topup" ${a > 0 ? "" : "disabled"}>Tiếp tục ${I("arrow", 20)}</button></div>
  <a class="card stat" href="#/support" style="margin-top:22px;color:var(--ink)"><div class="tile">${I("help", 28)}</div><div><b style="font-size:18px">Cần hỗ trợ?</b><small>Liên hệ bộ phận hỗ trợ</small></div></a></div></div>`,
  };
}

/* ---------- Support ---------- */
function faqList() {
  const q = S.q.toLowerCase(),
    f = FAQ.filter(
      ([t, c, a]) =>
        (!S.cat || c === S.cat || (S.cat === "tk" && 0)) &&
        (!q || (t + a).toLowerCase().includes(q)),
    );
  return f.length
    ? f
      .map(([t, c, a], i) => {
        const o = S.open === t;
        return `<div class="faq"><button data-act="faq" data-v="${i}"><span>${t}</span><span>${o ? "–" : "+"}</span></button>${o ? `<p>${a}</p>` : ""}</div>`;
      })
      .join("")
    : empty("Chưa có câu hỏi phù hợp. Hãy gửi yêu cầu hỗ trợ cho chúng tôi.");
}
function supp() {
  return {
    head: ph("Trung tâm hỗ trợ", "Chúng tôi luôn sẵn sàng đồng hành"),
    body: `<div class="input">${I("search", 26)}<input id="q" data-in="q" placeholder="Tìm câu trả lời hoặc chủ đề hỗ trợ"></div>
  <div class="grid g4" style="margin:22px 0">${CATS.map(([k, i, t, d]) => `<button class="card cat ${S.cat === k ? "on" : ""}" data-act="cat" data-v="${k}"><div class="tile">${I(i, 28)}</div><b style="font-size:18px">${t}</b><p>${d}</p></button>`).join("")}</div>
  <div class="grid g21"><div class="card"><h2>Câu hỏi thường gặp</h2><div id="list">${faqList()}</div></div>
  <div class="card" style="text-align:center"><div class="tile" style="margin:0 auto 14px;border-radius:50%">${I("help", 28)}</div><h2>Bạn cần hỗ trợ thêm?</h2><p class="mut" style="margin-bottom:22px">Gửi yêu cầu để đội ngũ hỗ trợ giúp bạn</p><button class="btn" data-act="ticket">Tạo yêu cầu hỗ trợ ${I("arrow", 20)}</button><p class="mut" style="margin-top:20px;text-align:left;display:flex;gap:8px">${I("info", 18)}Chúng tôi sẽ phản hồi sớm nhất có thể</p></div></div>`,
  };
}

/* ---------- Actions ---------- */
const rid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 24);
const calcTotal = () => {
  const s = S.services.find((x) => x.id === route()[1]),
    q = Number(val("o_qty")),
    t = $("#o_total");
  if (!s || !t) return;
  t.textContent =
    Number.isInteger(q) && q > 0 && s.pricePer1000 > 0
      ? vnd(Math.ceil((q * s.pricePer1000) / 1000))
      : "–";
};
const A = {
  tab: (_, v) => {
    S.tab = v;
    render();
  },
  eye: (_, v) => {
    const i = document.getElementById(v);
    i.type = i.type === "password" ? "text" : "password";
  },
  login: doLogin,
  register: doRegister,
  google: (el) =>
    run(el, () => signInWithPopup(auth, new GoogleAuthProvider())),
  forgot: (el) =>
    run(el, async () => {
      const e = val("a_email");
      if (!e) return toast("Nhập email để nhận liên kết đặt lại mật khẩu", 1);
      await sendPasswordResetEmail(auth, e);
      toast("Đã gửi email đặt lại mật khẩu (nếu tài khoản tồn tại)");
    }),
  menu: () => {
    S.menu = !S.menu;
    render();
  },
  logout: () => signOut(auth),
  pf: (_, v) => {
    S.pf = v;
    if (route()[0] !== "services") location.hash = "#/services";
    else render();
  },
  st: (_, v) => {
    S.st = v;
    S.page = 1;
    render();
  },
  page: (_, v) => {
    S.page = Number(v);
    render();
  },
  detail: (_, v) => {
    const o = S.orders.find((x) => x.id === v);
    if (!o) return;
    const st = ST[o.status] || [o.status, "wa"];
    modal(
      `<h2>Đơn #${esc(o.code)}</h2>${[
        ["Dịch vụ", esc(o.serviceName)],
        ["Nền tảng", PF[o.platform]?.[0] || ""],
        ["Liên kết", esc(o.link)],
        ["Số lượng", num(o.quantity)],
        ["Tổng tiền", vnd(o.total)],
        ["Ngày tạo", fdate(o.createdAt)],
        ["Trạng thái", `<span class="st ${st[1]}">${st[0]}</span>`],
      ]
        .map(([k, x]) => `<div class="kv"><span>${k}</span><b>${x}</b></div>`)
        .join(
          "",
        )}<button class="btn line" data-act="closem" style="margin-top:18px">Đóng</button>`,
    );
  },
  closem: () => modal(""),
  soon: () => toast("Phương thức này chưa được tích hợp"),
  amt: (_, v) => {
    S.topup.a = Number(v);
    const o = $("#t_other");
    if (o) o.value = "";
    render();
  },
  order: async (el) => {
    const s = S.services.find((x) => x.id === route()[1]);
    if (!s) return;
    const link = val("o_link"),
      q = Number(val("o_qty"));
    if (!okLink(s.platform, link))
      return toast(
        `Liên kết không hợp lệ cho ${PF[s.platform]?.[0]}. Dùng liên kết https công khai.`,
        1,
      );
    if (!Number.isInteger(q) || q < s.min || q > s.max)
      return toast(`Số lượng phải từ ${num(s.min)} đến ${num(s.max)}`, 1);
    if (Math.ceil((q * s.pricePer1000) / 1000) > (S.profile?.balance || 0))
      return toast("Số dư không đủ. Vui lòng nạp thêm tiền.", 1);
    await run(el, async () => {
      // Tạo đơn + trừ tiền trong CÙNG 1 batch (atomic). Firestore Rules kiểm tra giá/số dư.
      const total = Math.ceil((q * s.pricePer1000) / 1000),
        code = "MS" + rid().slice(0, 8).toUpperCase(),
        oref = doc(collection(db, "orders")),
        b = writeBatch(db);
      b.set(oref, {
        uid: S.user.uid,
        code,
        serviceId: s.id,
        serviceName: s.name,
        platform: s.platform,
        link,
        quantity: q,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      b.update(doc(db, "users", S.user.uid), {
        balance: (S.profile?.balance || 0) - total,
        lastOrder: oref.id,
      });
      await b.commit();
      toast("Đã tạo đơn #" + code);
      location.hash = "#/orders";
    });
  },
  topup: (el) =>
    run(el, async () => {
      const a = S.topup.a;
      if (!Number.isInteger(a) || a <= 0)
        return toast("Số tiền không hợp lệ", 1);
      if (a < 10000) return toast("Số tiền nạp tối thiểu 10.000đ", 1);
      const r = {
        uid: S.user.uid,
        method: "bank",
        amount: a,
        code: "NAP" + rid().slice(0, 7).toUpperCase(),
        status: "pending",
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "topups"), r);
      let pay = null;
      try {
        pay = (await getDoc(doc(db, "settings", "payment"))).data();
      } catch (e) {
        logErr("Đọc settings/payment", e);
      }
      modal(
        `<h2>Lệnh nạp tiền đã được tạo</h2><div class="kv"><span>Số tiền</span><b>${vnd(a)}</b></div><div class="kv"><span>Nội dung chuyển khoản</span><b>${esc(r.code)}</b></div>${pay ? `<div class="kv"><span>Ngân hàng</span><b>${esc(pay.bankName)}</b></div><div class="kv"><span>Số tài khoản</span><b>${esc(pay.accountNo)}</b></div><div class="kv"><span>Chủ tài khoản</span><b>${esc(pay.accountName)}</b></div>` : `<div class="note">Thông tin tài khoản nhận tiền chưa được cấu hình. Vui lòng liên hệ hỗ trợ.</div>`}<p class="mut" style="margin:14px 0">Số dư được cộng sau khi giao dịch được xác nhận.</p><button class="btn line" data-act="closem">Đóng</button>`,
      );
    }),
  cat: (_, v) => {
    S.cat = S.cat === v ? null : v;
    render();
  },
  faq: (_, v) => {
    const t = FAQ[Number(v)][0];
    S.open = S.open === t ? null : t;
    $("#list").innerHTML = faqList();
  },
  ticket: () =>
    modal(
      `<h2>Tạo yêu cầu hỗ trợ</h2><label class="lbl">Tiêu đề</label><div class="input"><input id="k_sub" maxlength="120" placeholder="Bạn cần hỗ trợ về vấn đề gì?"></div><label class="lbl">Nội dung</label><textarea id="k_msg" maxlength="2000" placeholder="Mô tả chi tiết (kèm mã đơn nếu có)"></textarea><div class="row" style="margin-top:18px"><button class="btn line" data-act="closem">Hủy</button><button class="btn" data-act="sendticket">Gửi yêu cầu</button></div>`,
    ),
  sendticket: (el) =>
    run(el, async () => {
      const s = val("k_sub"),
        m = val("k_msg");
      if (s.length < 3 || m.length < 5)
        return toast("Vui lòng nhập đầy đủ tiêu đề và nội dung", 1);
      await addDoc(collection(db, "tickets"), {
        uid: S.user.uid,
        subject: s,
        message: m,
        status: "open",
        createdAt: serverTimestamp(),
      });
      modal("");
      toast("Đã gửi yêu cầu hỗ trợ");
    }),
};
document.addEventListener("click", (e) => {
  if (e.target.classList?.contains("ov")) {
    modal("");
    return;
  }
  const el = e.target.closest("[data-act]");
  if (!el) {
    if (S.menu && !e.target.closest(".who")) {
      S.menu = false;
      render();
    }
    return;
  }
  if (el.tagName === "A" && el.getAttribute("href") === "#") e.preventDefault();
  A[el.dataset.act]?.(el, el.dataset.v);
});
document.addEventListener("input", (e) => {
  const k = e.target.dataset?.in;
  if (!k) return;
  if (k === "q") {
    S.q = e.target.value;
    S.page = 1;
    const l = $("#list"),
      r = route()[0];
    if (l)
      l.innerHTML =
        r === "orders" ? ordList() : r === "support" ? faqList() : svcList();
  } else if (k === "calc") calcTotal();
  else if (k === "metric") {
    S.metric = e.target.value;
    render();
  } else if (k === "other") {
    S.topup.a = Number(e.target.value.replace(/\D/g, "")) || 0;
    render();
  }
});