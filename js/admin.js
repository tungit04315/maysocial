import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig),
  auth = getAuth(app),
  db = getFirestore(app);

/* ---------- Log lỗi ra Console (F12) để dễ sửa ---------- */
const logErr = (where, e) =>
  console.error(`[MâySocial Admin] ${where} →`, e?.code || "", e?.message || e, e);
window.addEventListener("error", (ev) => logErr("Lỗi JS", ev.error || ev.message));
window.addEventListener("unhandledrejection", (ev) => logErr("Promise bị từ chối", ev.reason));
const $ = (s) => document.querySelector(s);
const val = (id) => document.getElementById(id)?.value.trim() || "";
const chk = (id) => !!document.getElementById(id)?.checked;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const num = (n) => Number(n || 0).toLocaleString("vi-VN");
const vnd = (n) => num(n) + "đ";
const toMs = (t) => (t?.toDate ? t.toDate().getTime() : Number(t) || 0);
const fdt = (t) => {
  const ms = toMs(t);
  return ms
    ? new Date(ms).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
    : "–";
};
const sum = (a, f) => a.reduce((s, x) => s + (Number(f(x)) || 0), 0);

/* ---------- Icon ---------- */
const P = {
  dash: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  users: "M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0",
  box: "M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10",
  list: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 8h6M9 12h6M9 16h3",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2zM16 14h2",
  help: "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3zM17 19c0 1.5-2 2-5 2",
  gear: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
  plus: "M12 5v14M5 12h14",
  check: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6",
  bar: "M5 20V12M12 20V6M19 20V10",
};
const I = (n, s = 20) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${P[n]}"/></svg>`;

/* ---------- Hằng số ---------- */
const PF = {
  facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", google: "Google",
  instagram: "Instagram", telegram: "Telegram", twitter: "Twitter/X", threads: "Threads", shopee: "Shopee", other: "Khác",
};
const ST = {
  pending: ["Chờ xử lý", "wa"],
  processing: ["Đang xử lý", "pr"],
  completed: ["Hoàn tất", "ok"],
  canceled: ["Đã hủy (hoàn tiền)", "er"],
};
const TST = { pending: ["Chờ duyệt", "wa"], completed: ["Đã duyệt", "ok"], rejected: ["Từ chối", "er"] };
const KST = { open: ["Đang mở", "wa"], closed: ["Đã đóng", "ok"] };
const badge = (m, k) => {
  const x = m[k] || [k || "–", ""];
  return `<span class="st ${x[1]}">${x[0]}</span>`;
};
const LOGT = { admin_adjust: "Admin chỉnh", topup: "Nạp tiền", refund: "Hoàn tiền" };

/* ---------- State ---------- */
const S = {
  user: undefined, admin: null, users: [], services: [], orders: [], topups: [],
  tickets: [], logs: [], pay: null, q: "", f: "all", page: 1, cur: null, unsub: [],
};
const PS = 12;
const route = () => location.hash.replace(/^#\/?/, "").split("?")[0].split("/")[0] || "dashboard";
const defF = () => ({ topups: "pending", tickets: "open" })[route()] || "all";
S.f = defF();
const toast = (m, e) => {
  const t = $("#toast");
  t.innerHTML = `<div class="${e ? "err" : ""}">${esc(m)}</div>`;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (t.innerHTML = ""), 4200);
};
const modal = (h) => ($("#modal").innerHTML = h ? `<div class="ov"><div class="md">${h}</div></div>` : "");
const MSG = {
  "auth/invalid-credential": "Email hoặc mật khẩu không đúng",
  "auth/too-many-requests": "Thử quá nhiều lần, vui lòng đợi rồi thử lại",
  "permission-denied": "Bạn không có quyền thực hiện thao tác này",
};
const run = async (el, f) => {
  if (el?.disabled) return;
  if (el) el.disabled = true;
  try { await f(); }
  catch (e) { logErr("Thao tác thất bại", e); toast(MSG[e.code] || e.message || "Đã xảy ra lỗi", 1); }
  finally { if (el) el.disabled = false; }
};
const qerr = (e) => {
  logErr("Không tải được dữ liệu", e);
  toast(MSG[e.code] || "Không tải được dữ liệu: " + e.message, 1);
};

/* ---------- Dữ liệu ---------- */
const sub = (key, col, n, map) =>
  S.unsub.push(
    onSnapshot(
      n ? query(collection(db, col), orderBy("createdAt", "desc"), limit(n)) : collection(db, col),
      (s) => { S[key] = s.docs.map(map || ((d) => ({ id: d.id, ...d.data() }))); render(); },
      qerr,
    ),
  );
function start() {
  sub("users", "users", 0, (d) => ({ ...d.data(), uid: d.id }));
  sub("services", "services");
  sub("orders", "orders", 400);
  sub("topups", "topups", 300);
  sub("tickets", "tickets", 200);
  sub("logs", "balanceLogs", 200);
  S.unsub.push(onSnapshot(doc(db, "settings", "payment"), (d) => { S.pay = d.data() || {}; render(); }, qerr));
}
onAuthStateChanged(auth, async (u) => {
  S.unsub.forEach((f) => f());
  S.unsub = [];
  S.user = u;
  S.admin = null;
  S.started = false;
  if (!u) return render();
  console.info("[MâySocial Admin] Đăng nhập:", u.email, "UID =", u.uid);
  render();
  // Admin = UID nằm trong danh sách ở firestore.rules (hàm isAdmin). Thử đọc doc admin/ping:
  // được phép đọc => là admin; bị permission-denied => không phải admin.
  try {
    await getDoc(doc(db, "admin", "ping"));
    S.admin = true;
    S.started = true;
    start();
  } catch (e) {
    logErr("Kiểm tra quyền admin (UID chưa có trong firestore.rules?)", e);
    S.admin = false;
  }
  render();
});
window.addEventListener("hashchange", () => {
  S.q = ""; S.page = 1; S.cur = null;
  S.f = defF();
  modal("");
  render();
  scrollTo(0, 0);
});

/* ---------- Render ---------- */
function render() {
  if (S.user === undefined) return;
  const root = $("#app"),
    keep = [...root.querySelectorAll("input[id],textarea[id],select[id]")].map((e) => [e.id, e.value]),
    fid = document.activeElement?.id;
  root.innerHTML = !S.user ? loginView() : S.admin ? shell() : denied();
  keep.forEach(([i, v]) => {
    const e = document.getElementById(i);
    if (e && e.value !== v) e.value = v;
  });
  if (fid) document.getElementById(fid)?.focus();
}
const loginView = () =>
  `<div class="center"><div class="lgc"><b style="color:var(--pri)">Mây Social</b><h1>Đăng nhập quản trị</h1><p class="mut" style="margin:0 0 14px">Chỉ dành cho quản trị viên</p>
  <label class="l">Email</label><input id="l_email" type="email" autocomplete="username">
  <label class="l">Mật khẩu</label><input id="l_pw" type="password" autocomplete="current-password">
  <button class="btn" data-act="login">Đăng nhập</button></div></div>`;
const denied = () =>
  S.admin === null
    ? `<div class="center"><p class="mut">Đang kiểm tra quyền…</p></div>`
    : `<div class="center"><div class="lgc"><h1>Không có quyền truy cập</h1><p class="mut">Tài khoản <b>${esc(S.user.email)}</b> không phải quản trị viên. Hãy dán UID <b>${esc(S.user.uid)}</b> vào hàm <b>isAdmin()</b> trong <b>firestore.rules</b> rồi bấm Publish (Firebase Console &gt; Firestore &gt; Rules).</p>
  <button class="btn line" style="background:#fff;color:var(--ink);border:1px solid var(--bd)" data-act="logout">Đăng xuất</button><p style="margin-top:14px"><a href="index.html">← Về trang người dùng</a></p></div></div>`;

const who = (uid) => {
  const u = S.users.find((x) => x.uid === uid);
  return u ? esc(u.email || u.displayName || uid) : esc(String(uid || "").slice(0, 10));
};
const pending = () => S.topups.filter((t) => (t.status || "pending") === "pending").length;
const openTk = () => S.tickets.filter((t) => (t.status || "open") === "open").length;

function shell() {
  const r = route();
  const pages = { dashboard: pgDash, users: pgUsers, services: pgSvc, orders: pgOrd, topups: pgTop, tickets: pgTk, logs: pgLog, settings: pgSet };
  const p = (pages[r] || pgDash)();
  if (EXP[r] && !p.act) p.act = ddm(r);
  const cur = pages[r] ? r : "dashboard";
  const nav = [
    ["dashboard", "dash", "Tổng quan"], ["users", "users", "Người dùng"], ["services", "box", "Dịch vụ"],
    ["orders", "list", "Đơn hàng"], ["topups", "wallet", "Nạp tiền", pending()],
    ["tickets", "help", "Hỗ trợ", openTk()], ["logs", "clock", "Lịch sử số dư"], ["settings", "gear", "Cài đặt"],
  ];
  return `<div class="ad"><aside class="sd"><div class="br">Mây Social <em>ADMIN</em></div>
  <nav>${nav.map(([h, i, t, b]) => `<a href="#/${h}" class="${cur === h ? "on" : ""}">${I(i)}${t}${b ? `<i>${b}</i>` : ""}</a>`).join("")}</nav>
  <div class="ft"><span>${esc(S.user.email)}</span><a href="index.html">← Trang người dùng</a><button data-act="logout">Đăng xuất</button></div></aside>
  <main><div class="hd"><div><h1>${p.title}</h1><p>${p.sub || ""}</p></div><div>${p.act || ""}</div></div>${p.body}</main></div>`;
}

/* ---------- Helpers danh sách ---------- */
const chips = (opts) =>
  `<div class="chips">${opts.map(([k, t]) => `<button class="chip ${S.f === k ? "on" : ""}" data-act="f" data-v="${k}">${t}</button>`).join("")}</div>`;
const bar = (ph, ex = "") =>
  `<div class="bar"><div class="srch">${I("search")}<input id="q" data-in="q" placeholder="${ph}"></div>${ex}</div>`;
const tbl = (heads, rows) =>
  `<div class="tw"><table><thead><tr>${heads.map((h) => `<th class="${h[0] === ">" ? "r" : ""}">${h.replace(/^>/, "")}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
function paged(arr) {
  const n = Math.max(1, Math.ceil(arr.length / PS));
  if (S.page > n) S.page = n;
  const rows = arr.slice((S.page - 1) * PS, S.page * PS);
  const pager = arr.length > PS
    ? `<div class="pager"><span>${num(arr.length)} mục</span><div><button data-act="page" data-v="${S.page - 1}" ${S.page < 2 ? "disabled" : ""}>‹</button><b>${S.page}/${n}</b><button data-act="page" data-v="${S.page + 1}" ${S.page >= n ? "disabled" : ""}>›</button></div></div>`
    : "";
  return { rows, pager };
}
const empty = (m) => `<div class="empty">${m}</div>`;
const has = (q, s) => !q || String(s).toLowerCase().includes(q.toLowerCase());
const stat = (ic, c, l, v) => `<div class="card stt"><div class="ic ${c}">${I(ic, 24)}</div><div><small>${l}</small><b>${v}</b></div></div>`;

/* ---------- Tổng quan ---------- */
function pgDash() {
  const ok = S.orders.filter((o) => o.status !== "canceled");
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const days = [...Array(7)].map((_, i) => {
    const d = new Date(t0); d.setDate(d.getDate() - 6 + i);
    const v = sum(ok.filter((o) => { const m = toMs(o.createdAt); return m >= d.getTime() && m < d.getTime() + 864e5; }), (o) => o.total);
    return [d, v];
  });
  const mx = Math.max(...days.map((x) => x[1]), 1);
  const recent = S.orders.slice(0, 6);
  return {
    title: "Tổng quan",
    sub: "Số liệu hệ thống theo thời gian thực",
    body: `<div class="grid g4">
    ${stat("users", "", "Người dùng", num(S.users.length))}
    ${stat("wallet", "c", "Tổng số dư người dùng", vnd(sum(S.users, (u) => u.balance)))}
    ${stat("list", "g", "Tổng đơn (gần nhất)", num(S.orders.length))}
    ${stat("bar", "g", "Doanh thu (gần nhất)", vnd(sum(ok, (o) => o.total)))}
    ${stat("wallet", "y", "Nạp tiền chờ duyệt", `<a href="#/topups">${pending()}</a>`)}
    ${stat("help", "y", "Yêu cầu hỗ trợ đang mở", `<a href="#/tickets">${openTk()}</a>`)}
    ${stat("clock", "", "Đơn chưa hoàn tất", num(S.orders.filter((o) => o.status === "pending" || o.status === "processing").length))}
    ${stat("box", "", "Dịch vụ đang bật", `${S.services.filter((s) => s.active).length}/${S.services.length}`)}</div>
    <div class="grid g2" style="margin-top:18px">
    <div class="card"><h2>Doanh thu 7 ngày qua</h2><div class="bars">${days.map(([d, v]) => `<div title="${vnd(v)}"><span style="height:${Math.round((v / mx) * 140)}px"></span>${d.getDate()}/${d.getMonth() + 1}</div>`).join("")}</div></div>
    <div class="card"><h2>Đơn hàng mới nhất</h2>${recent.length ? tbl(["Mã", "Người dùng", ">Tổng", "Trạng thái"], recent.map((o) => `<tr><td>#${esc(o.code)}</td><td>${who(o.uid)}</td><td class="r">${vnd(o.total)}</td><td>${badge(ST, o.status)}</td></tr>`)) : empty("Chưa có đơn hàng")}</div></div>`,
  };
}

/* ---------- Người dùng ---------- */
function usersList() {
  const f = S.users.filter((u) =>
    (S.f === "all" || (S.f === "off" && u.disabled)) &&
    has(S.q, `${u.email} ${u.displayName} ${u.uid}`));
  if (!f.length) return empty("Không có người dùng phù hợp");
  const { rows, pager } = paged(f);
  return tbl(["Người dùng", ">Số dư", "Vai trò", "Trạng thái", "Ngày tạo", ""], rows.map((u) =>
    `<tr><td><b>${esc(u.displayName || "(chưa đặt tên)")}</b><span class="sub">${esc(u.email)}</span></td><td class="r">${vnd(u.balance)}</td>
    <td>Người dùng</td><td>${u.disabled ? '<span class="st er">Đã khóa</span>' : '<span class="st ok">Hoạt động</span>'}</td>
    <td>${fdt(u.createdAt)}</td><td><div class="acts"><button class="btn sm" data-act="user" data-v="${u.uid}">Quản lý</button></div></td></tr>`)) + pager;
}
function pgUsers() {
  return {
    title: "Người dùng", sub: "Quản lý tài khoản, số dư và quyền truy cập",
    body: bar("Tìm theo tên, email hoặc UID", chips([["all", "Tất cả"], ["off", "Đã khóa"]])) + `<div class="card" id="list">${usersList()}</div>`,
  };
}

/* ---------- Dịch vụ ---------- */
/* ---------- Đơn hàng ---------- */
function ordList() {
  const f = S.orders.filter((o) => (S.f === "all" || o.status === S.f) && has(S.q, `${o.code} ${o.serviceName} ${o.link} ${o.uid}`));
  if (!f.length) return empty("Không có đơn hàng phù hợp");
  const { rows, pager } = paged(f);
  return tbl(["Mã đơn", "Người dùng", "Dịch vụ", ">SL", ">Tổng", "Ngày tạo", "Trạng thái", ""], rows.map((o) =>
    `<tr><td>#${esc(o.code)}</td><td>${who(o.uid)}</td><td>${esc(o.serviceName)}</td><td class="r">${num(o.quantity)}</td><td class="r">${vnd(o.total)}</td>
    <td>${fdt(o.createdAt)}</td><td>${badge(ST, o.status)}</td><td><div class="acts"><button class="btn sm" data-act="ord" data-v="${o.id}">Xử lý</button></div></td></tr>`)) + pager;
}
function pgOrd() {
  return {
    title: "Đơn hàng", sub: "Theo dõi và cập nhật trạng thái đơn của người dùng",
    body: bar("Tìm theo mã đơn, dịch vụ, liên kết, UID", chips([["all", "Tất cả"], ["pending", "Chờ xử lý"], ["processing", "Đang xử lý"], ["completed", "Hoàn tất"], ["canceled", "Đã hủy"]])) + `<div class="card" id="list">${ordList()}</div>`,
  };
}

/* ---------- Nạp tiền ---------- */
function topList() {
  const f = S.topups.filter((t) => (S.f === "all" || (t.status || "pending") === S.f) && has(S.q, `${t.code} ${t.uid}`));
  if (!f.length) return empty("Không có lệnh nạp phù hợp");
  const { rows, pager } = paged(f);
  return tbl(["Mã / nội dung CK", "Người dùng", ">Số tiền", "Ngày tạo", "Trạng thái", ""], rows.map((t) => {
    const p = (t.status || "pending") === "pending";
    return `<tr><td><b>${esc(t.code)}</b></td><td>${who(t.uid)}</td><td class="r">${vnd(t.amount)}</td><td>${fdt(t.createdAt)}</td><td>${badge(TST, t.status || "pending")}</td>
    <td><div class="acts">${p ? `<button class="btn sm ok" data-act="topok" data-v="${t.id}">Duyệt</button><button class="btn sm er" data-act="toprej" data-v="${t.id}">Từ chối</button>` : ""}</div></td></tr>`;
  })) + pager;
}
function pgTop() {
  return {
    title: "Nạp tiền", sub: "Đối chiếu sao kê ngân hàng với mã nội dung chuyển khoản rồi duyệt để cộng số dư",
    body: bar("Tìm theo mã nạp hoặc UID", chips([["pending", "Chờ duyệt"], ["completed", "Đã duyệt"], ["rejected", "Từ chối"], ["all", "Tất cả"]])) + `<div class="card" id="list">${topList()}</div>`,
  };
}

/* ---------- Hỗ trợ ---------- */
function tkList() {
  const f = S.tickets.filter((t) => (S.f === "all" || (t.status || "open") === S.f) && has(S.q, `${t.subject} ${t.message} ${t.uid}`));
  if (!f.length) return empty("Không có yêu cầu hỗ trợ");
  const { rows, pager } = paged(f);
  return tbl(["Tiêu đề", "Người dùng", "Ngày gửi", "Trạng thái", ""], rows.map((t) =>
    `<tr><td><b>${esc(t.subject)}</b><span class="sub">${esc(String(t.message || "").slice(0, 80))}</span></td><td>${who(t.uid)}</td><td>${fdt(t.createdAt)}</td><td>${badge(KST, t.status || "open")}</td>
    <td><div class="acts"><button class="btn sm" data-act="tk" data-v="${t.id}">Xem</button></div></td></tr>`)) + pager;
}
function pgTk() {
  return {
    title: "Hỗ trợ", sub: "Yêu cầu hỗ trợ do người dùng gửi",
    body: bar("Tìm yêu cầu", chips([["open", "Đang mở"], ["closed", "Đã đóng"], ["all", "Tất cả"]])) + `<div class="card" id="list">${tkList()}</div>`,
  };
}

/* ---------- Lịch sử số dư ---------- */
function logList() {
  const f = S.logs.filter((l) => has(S.q, `${l.uid} ${l.note} ${l.type}`));
  if (!f.length) return empty("Chưa có biến động số dư nào do admin thực hiện");
  const { rows, pager } = paged(f);
  return tbl(["Thời gian", "Người dùng", "Loại", ">Biến động", ">Số dư sau", "Ghi chú", "Thực hiện"], rows.map((l) =>
    `<tr><td>${fdt(l.createdAt)}</td><td>${who(l.uid)}</td><td>${LOGT[l.type] || esc(l.type)}</td><td class="r ${l.amount >= 0 ? "plus" : "minus"}">${l.amount >= 0 ? "+" : ""}${vnd(l.amount)}</td><td class="r">${vnd(l.balanceAfter)}</td><td>${esc(l.note || "")}</td><td>${who(l.by)}</td></tr>`)) + pager;
}
const pgLog = () => ({
  title: "Lịch sử số dư", sub: "Nhật ký mọi lần admin cộng/trừ, duyệt nạp, hoàn tiền",
  body: bar("Tìm theo UID hoặc ghi chú") + `<div class="card" id="list">${logList()}</div>`,
});

/* ---------- Cài đặt ---------- */
function pgSet() {
  const p = S.pay || {};
  return {
    title: "Cài đặt", sub: "Thông tin tài khoản ngân hàng nhận tiền (hiển thị cho người dùng khi nạp tiền)",
    body: `<div class="card fm"><h2>Tài khoản nhận tiền</h2>
    <label class="l">Ngân hàng</label><input id="s_bank" value="${esc(p.bankName)}" placeholder="VD: Vietcombank">
    <label class="l">Số tài khoản</label><input id="s_no" value="${esc(p.accountNo)}">
    <label class="l">Chủ tài khoản</label><input id="s_name" value="${esc(p.accountName)}">
    <button class="btn" style="margin-top:20px" data-act="savepay">Lưu cài đặt</button></div>`,
  };
}

/* ---------- Actions ---------- */
const reopen = () => { if (S.cur) A.user(null, S.cur); };
const patchU = (uid, o) => {
  const u = S.users.find((x) => x.uid === uid);
  if (!u) return;
  Object.assign(u, o);
};
const logRef = () => doc(collection(db, "balanceLogs"));
const resolveTopup = (id, action) =>
  runTransaction(db, async (t) => {
    const tr = doc(db, "topups", id), ts = await t.get(tr);
    if (!ts.exists()) throw new Error("Không tìm thấy lệnh nạp");
    const tp = ts.data();
    if ((tp.status || "pending") !== "pending") throw new Error("Lệnh nạp đã được xử lý trước đó");
    const meta = { resolvedBy: S.user.uid, resolvedAt: serverTimestamp() };
    if (action === "reject") return t.update(tr, { status: "rejected", ...meta });
    const amt = Number(tp.amount);
    if (!Number.isInteger(amt) || amt <= 0) throw new Error("Số tiền nạp không hợp lệ");
    const ur = doc(db, "users", tp.uid), us = await t.get(ur);
    if (!us.exists()) throw new Error("Người dùng không tồn tại");
    const nb = (Number(us.data().balance) || 0) + amt;
    t.update(ur, { balance: nb });
    t.update(tr, { status: "completed", ...meta });
    t.set(logRef(), { uid: tp.uid, type: "topup", amount: amt, balanceAfter: nb, note: "Nạp " + (tp.code || id), by: S.user.uid, ref: id, createdAt: serverTimestamp() });
  });
const A = {
  login: (el) => run(el, async () => {
    const e = val("l_email"), p = $("#l_pw").value;
    if (!e || !p) return toast("Nhập email và mật khẩu", 1);
    await signInWithEmailAndPassword(auth, e, p);
  }),
  logout: () => signOut(auth),
  closem: () => modal(""),
  f: (_, v) => { S.f = v; S.page = 1; render(); },
  page: (_, v) => { S.page = Number(v); render(); },

  /* --- Người dùng --- */
  user: (_, uid) => {
    const u = S.users.find((x) => x.uid === uid);
    if (!u) return;
    S.cur = uid;
    const oc = S.orders.filter((o) => o.uid === uid).length;
    modal(`<h2>Quản lý tài khoản</h2><p class="mut" style="margin:0 0 8px;word-break:break-all">${esc(u.email)}<br>UID: ${esc(u.uid)}</p>
    <div class="kv"><span>Số dư hiện tại</span><b>${vnd(u.balance)}</b></div>
    <div class="kv"><span>Số đơn (trong 400 đơn gần nhất)</span><b>${oc}</b></div>
    <h3>Tên hiển thị</h3><div class="row2"><input id="u_name" value="${esc(u.displayName)}"><button class="btn sm" style="flex:none;width:90px" data-act="saveName">Lưu</button></div>
    <h3>Cộng / trừ tiền thủ công</h3><input id="u_amt" inputmode="numeric" placeholder="Số tiền (VNĐ)"><input id="u_note" placeholder="Ghi chú (VD: nạp tiền mặt, hoàn tiền…)" style="margin-top:8px">
    <div class="row2"><button class="btn ok" data-act="adj" data-v="1">+ Cộng tiền</button><button class="btn er" data-act="adj" data-v="-1">− Trừ tiền</button></div>
    <h3>Trạng thái tài khoản</h3><div class="row2"><button class="btn line" data-act="lock">${u.disabled ? "Mở khóa tài khoản" : "Khóa tài khoản"}</button></div>
    <button class="btn line" style="margin-top:18px" data-act="closem">Đóng</button>`);
  },
  saveName: (el) => run(el, async () => {
    const n = val("u_name");
    if (n.length > 80) return toast("Tên quá dài (tối đa 80 ký tự)", 1);
    await updateDoc(doc(db, "users", S.cur), { displayName: n });
    patchU(S.cur, { displayName: n }); toast("Đã lưu tên"); reopen();
  }),
  adj: (el, v) => run(el, async () => {
    const a = Number(val("u_amt").replace(/\D/g, ""));
    if (!a || a > 1e9) return toast("Nhập số tiền hợp lệ", 1);
    const sg = Number(v), uid = S.cur, note = val("u_note").slice(0, 200);
    if (!confirm(`${sg > 0 ? "Cộng" : "Trừ"} ${vnd(a)} ${sg > 0 ? "vào" : "khỏi"} tài khoản này?`)) return;
    const ref = doc(db, "users", uid);
    const nb = await runTransaction(db, async (t) => {
      const s = await t.get(ref);
      if (!s.exists()) throw new Error("Người dùng chưa có hồ sơ");
      const nb = (Number(s.data().balance) || 0) + sg * a;
      if (nb < 0) throw new Error("Số dư không thể âm");
      t.update(ref, { balance: nb });
      t.set(logRef(), { uid, type: "admin_adjust", amount: sg * a, balanceAfter: nb, note, by: S.user.uid, createdAt: serverTimestamp() });
      return nb;
    });
    patchU(uid, { balance: nb }); toast("Số dư mới: " + vnd(nb)); reopen();
  }),
  lock: (el) => run(el, async () => {
    const u = S.users.find((x) => x.uid === S.cur);
    if (u.uid === S.user.uid) return toast("Không thể tự khóa chính mình", 1);
    if (!confirm(u.disabled ? "Mở khóa tài khoản này?" : "Khóa tài khoản này? Người dùng sẽ bị chặn thao tác và tự đăng xuất.")) return;
    await updateDoc(doc(db, "users", u.uid), { disabled: !u.disabled });
    patchU(u.uid, { disabled: !u.disabled }); toast("Đã cập nhật trạng thái"); reopen();
  }),

  /* --- Dịch vụ --- */
  svc: (_, id) => {
    const s = id ? S.services.find((x) => x.id === id) : { platform: "facebook", active: true, min: 100, max: 10000, pricePer1000: 0 };
    if (!s) return;
    S.cur = id || null;
    modal(`<h2>${id ? "Sửa dịch vụ" : "Thêm dịch vụ"}</h2>
    <label class="l">Nền tảng</label><select id="f_pf">${Object.entries(PF).map(([k, t]) => `<option value="${k}" ${s.platform === k ? "selected" : ""}>${t}</option>`).join("")}</select>
    <label class="l">Tên dịch vụ</label><input id="f_name" value="${esc(s.name)}" maxlength="100">
    <label class="l">Mô tả ngắn</label><input id="f_desc" value="${esc(s.desc)}" maxlength="300">
    <label class="l">Giá cho mỗi 1.000 (VNĐ)</label><input id="f_price" inputmode="numeric" value="${s.pricePer1000 || ""}">
    <div class="cols2"><div><label class="l">Số lượng tối thiểu</label><input id="f_min" inputmode="numeric" value="${s.min || ""}"></div><div><label class="l">Số lượng tối đa</label><input id="f_max" inputmode="numeric" value="${s.max || ""}"></div></div>
    <label class="l">Điểm nổi bật (mỗi dòng: Tiêu đề | Mô tả)</label><textarea id="f_feat">${esc((s.features || []).map((f) => `${f.t} | ${f.d || ""}`).join("\n"))}</textarea>
    <label class="l">Lưu ý trước khi đặt (mỗi dòng một ý)</label><textarea id="f_notes">${esc((s.notes || []).join("\n"))}</textarea>
    <label class="ck"><input type="checkbox" id="f_active" ${s.active ? "checked" : ""}>Đang bán (hiển thị cho người dùng)</label>
    <label class="ck"><input type="checkbox" id="f_pop" ${s.popular ? "checked" : ""}>Đánh dấu “Phổ biến”</label>
    <div class="row2" style="margin-top:22px"><button class="btn line" data-act="closem">Hủy</button><button class="btn" data-act="savesvc">Lưu dịch vụ</button></div>`);
  },
  savesvc: (el) => run(el, async () => {
    const n = (id) => Number(val(id).replace(/\D/g, "")) || 0;
    const features = val("f_feat").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 10).map((l) => {
      const [t, ...d] = l.split("|"); return { t: t.trim().slice(0, 120), d: d.join("|").trim().slice(0, 300) };
    }).filter((f) => f.t);
    const notes = val("f_notes").split("\n").map((l) => l.trim().slice(0, 300)).filter(Boolean).slice(0, 10);
    const d = { platform: val("f_pf"), name: val("f_name"), desc: val("f_desc"), pricePer1000: n("f_price"), min: n("f_min"), max: n("f_max"), active: chk("f_active"), popular: chk("f_pop"), features, notes, updatedAt: serverTimestamp() };
    if (!PF[d.platform]) return toast("Nền tảng không hợp lệ", 1);
    if (d.name.length < 2 || d.name.length > 100) return toast("Tên dịch vụ 2–100 ký tự", 1);
    if (d.desc.length > 300) return toast("Mô tả tối đa 300 ký tự", 1);
    if (d.pricePer1000 <= 0) return toast("Giá phải lớn hơn 0", 1);
    if (d.min < 1 || d.max < d.min) return toast("Số lượng tối thiểu/tối đa không hợp lệ", 1);
    if (S.cur) await updateDoc(doc(db, "services", S.cur), d);
    else await addDoc(collection(db, "services"), { ...d, createdAt: serverTimestamp() });
    modal(""); toast("Đã lưu dịch vụ");
  }),
  tgsvc: (el, id) => run(el, async () => {
    const s = S.services.find((x) => x.id === id);
    await updateDoc(doc(db, "services", id), { active: !s.active, updatedAt: serverTimestamp() });
    toast(s.active ? "Đã ẩn dịch vụ" : "Đã bật dịch vụ");
  }),
  delsvc: (el, id) => run(el, async () => {
    const s = S.services.find((x) => x.id === id);
    if (!confirm(`Xóa vĩnh viễn dịch vụ “${s.name}”?\nĐơn cũ vẫn giữ nguyên. Nếu chỉ muốn ngừng bán, hãy dùng nút Ẩn.`)) return;
    await deleteDoc(doc(db, "services", id));
    toast("Đã xóa dịch vụ");
  }),

  /* --- Đơn hàng --- */
  ord: (_, id) => {
    const o = S.orders.find((x) => x.id === id);
    if (!o) return;
    S.cur = id;
    const done = o.status === "canceled";
    modal(`<h2>Đơn #${esc(o.code)}</h2>
    ${[["Người dùng", who(o.uid)], ["Dịch vụ", esc(o.serviceName)], ["Nền tảng", PF[o.platform] || ""], ["Liên kết", `<a href="${esc(o.link)}" target="_blank" rel="noopener noreferrer">${esc(o.link)}</a>`], ["Số lượng", num(o.quantity)], ["Tổng tiền", vnd(o.total)], ["Ngày tạo", fdt(o.createdAt)], ["Trạng thái", badge(ST, o.status)]].map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join("")}
    ${done ? `<div class="note">Đơn đã hủy và hoàn tiền, không thể thay đổi.</div>` : `<label class="l">Cập nhật trạng thái</label><select id="o_st"><option value="pending">Chờ xử lý</option><option value="processing">Đang xử lý</option><option value="completed">Hoàn tất</option><option value="canceled">Hủy đơn &amp; hoàn tiền cho người dùng</option></select>`}
    <div class="row2" style="margin-top:20px"><button class="btn line" data-act="closem">Đóng</button>${done ? "" : `<button class="btn" data-act="saveord">Cập nhật</button>`}</div>`);
    if (!done) $("#o_st").value = o.status || "pending";
  },
  saveord: (el) => run(el, async () => {
    const st = val("o_st"), id = S.cur;
    if (!ST[st]) return toast("Trạng thái không hợp lệ", 1);
    if (st === "canceled" && !confirm("Hủy đơn và hoàn tiền cho người dùng? Không thể hoàn tác.")) return;
    const oref = doc(db, "orders", id);
    await runTransaction(db, async (t) => {
      const os = await t.get(oref);
      if (!os.exists()) throw new Error("Không tìm thấy đơn hàng");
      const o = os.data();
      if (o.status === "canceled") throw new Error("Đơn đã hủy, không thể thay đổi");
      const meta = { updatedAt: serverTimestamp(), updatedBy: S.user.uid };
      if (st !== "canceled") return t.update(oref, { status: st, ...meta });
      const uref = doc(db, "users", o.uid), us = await t.get(uref), amt = Number(o.total) || 0;
      let refunded = false;
      if (us.exists() && amt > 0) {
        const nb = (Number(us.data().balance) || 0) + amt;
        t.update(uref, { balance: nb });
        t.set(logRef(), { uid: o.uid, type: "refund", amount: amt, balanceAfter: nb, note: "Hoàn tiền đơn " + o.code, by: S.user.uid, ref: id, createdAt: serverTimestamp() });
        refunded = true;
      }
      t.update(oref, { status: "canceled", refunded, ...meta });
    });
    modal(""); toast("Đã cập nhật đơn hàng");
  }),

  /* --- Nạp tiền --- */
  topok: (el, id) => run(el, async () => {
    const t = S.topups.find((x) => x.id === id);
    if (!confirm(`Xác nhận đã nhận ${vnd(t.amount)} (nội dung ${t.code}) và cộng vào số dư người dùng?`)) return;
    await resolveTopup(id, "approve");
    toast("Đã duyệt và cộng tiền");
  }),
  toprej: (el, id) => run(el, async () => {
    if (!confirm("Từ chối lệnh nạp này?")) return;
    await resolveTopup(id, "reject");
    toast("Đã từ chối lệnh nạp");
  }),

  /* --- Hỗ trợ --- */
  tk: (_, id) => {
    const t = S.tickets.find((x) => x.id === id);
    if (!t) return;
    S.cur = id;
    modal(`<h2>${esc(t.subject)}</h2><p class="mut" style="margin:0 0 8px">${who(t.uid)} · ${fdt(t.createdAt)} · ${badge(KST, t.status || "open")}</p>
    <div class="note" style="white-space:pre-wrap;background:#f6f5fb;color:var(--ink)">${esc(t.message)}</div>
    <label class="l">Phản hồi của admin</label><textarea id="k_reply" maxlength="2000">${esc(t.reply || "")}</textarea>
    <div class="row2" style="margin-top:18px"><button class="btn line" data-act="closem">Đóng</button><button class="btn line" data-act="reply" data-v="open">Lưu (giữ mở)</button><button class="btn" data-act="reply" data-v="closed">Lưu &amp; đóng</button></div>`);
  },
  reply: (el, st) => run(el, async () => {
    await updateDoc(doc(db, "tickets", S.cur), {
      reply: val("k_reply").slice(0, 2000),
      status: st === "closed" ? "closed" : "open",
      repliedBy: S.user.uid,
      repliedAt: serverTimestamp(),
    });
    modal(""); toast("Đã cập nhật yêu cầu hỗ trợ");
  }),

  /* --- Cài đặt --- */
  savepay: (el) => run(el, async () => {
    const d = { bankName: val("s_bank").slice(0, 100), accountNo: val("s_no").slice(0, 40), accountName: val("s_name").slice(0, 100) };
    if (!d.bankName || !d.accountNo || !d.accountName) return toast("Vui lòng nhập đủ 3 trường", 1);
    await setDoc(doc(db, "settings", "payment"), d);
    toast("Đã lưu cài đặt");
  }),
};

document.addEventListener("click", (e) => {
  if (e.target.classList?.contains("ov")) return modal("");
  const el = e.target.closest("[data-act]");
  if (el) A[el.dataset.act]?.(el, el.dataset.v);
});
document.addEventListener("input", (e) => {
  if (e.target.dataset?.in !== "q") return;
  S.q = e.target.value; S.page = 1;
  const l = $("#list");
  if (!l) return;
  const r = route();
  l.innerHTML = ({ users: usersList, services: svcList, orders: ordList, topups: topList, tickets: tkList, logs: logList }[r] || (() => ""))();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "l_pw") A.login($(".lgc .btn"));
});

/* =====================================================================
   NHẬP / XUẤT / SỬA – XÓA HÀNG LOẠT
   >>> DÁN TOÀN BỘ ĐOẠN NÀY VÀO CUỐI FILE js/admin.js <<<
   ===================================================================== */
Object.assign(P, {
  down: "M12 4v11M7 11l5 5 5-5M5 20h14",
  up: "M12 16V5M7 9l5-5 5 5M5 20h14",
});
S.sel = new Set(); // id dịch vụ đang được tick chọn
S.imp = null; // dữ liệu nhập đang xem trước

/* ---------- Tiện ích file ---------- */
// Chuẩn hóa tên cột: bỏ dấu, bỏ ký tự lạ, viết thường ("Giá / 1.000" → "gia1000")
const nk = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]/g, "");
const stamp = () => new Date().toISOString().slice(0, 10);
const dl = (name, blob) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
// Chống CSV injection: ô chữ bắt đầu bằng = + - @ sẽ được thêm dấu ' phía trước
const csvCell = (v) => {
  let s = v == null ? "" : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
// BOM + "sep=," để Excel (kể cả bản tiếng Việt dùng dấu ;) mở đúng cột và đúng tiếng Việt
const toCSV = (head, rows) => "\uFEFFsep=,\r\n" + [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
// Thư viện Excel chỉ tải khi cần dùng (SheetJS)
let _xl;
const xlsx = () =>
(_xl ||= import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs").catch(() => {
  _xl = null;
  throw new Error("Không tải được thư viện Excel (kiểm tra mạng) – hãy dùng CSV hoặc JSON");
}));
async function saveTable(fmt, name, head, rows) {
  const file = `${name}-${stamp()}`;
  if (fmt === "xlsx") {
    const X = await xlsx(), wb = X.utils.book_new();
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([head, ...rows]), "Data");
    X.writeFile(wb, file + ".xlsx");
  } else if (fmt === "json") {
    const data = rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
    dl(file + ".json", new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  } else dl(file + ".csv", new Blob([toCSV(head, rows)], { type: "text/csv;charset=utf-8" }));
}
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const m = text.match(/^sep=(.)\r?\n/i);
  if (m) text = text.slice(m[0].length);
  const first = text.split(/\r?\n/, 1)[0];
  const d = m ? m[1] : [",", ";", "\t"].map((c) => [c, first.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === d) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ""));
}

/* ---------- Cấu trúc cột dịch vụ ---------- */
const SVC_HEAD = ["ID", "Nền tảng", "Tên dịch vụ", "Mô tả", "Giá / 1.000", "Min", "Max", "Đang bán", "Phổ biến", "Điểm nổi bật", "Lưu ý", "Xóa"];
const svcRow = (s) => [
  s.id, s.platform, s.name, s.desc || "", Number(s.pricePer1000) || 0, Number(s.min) || 0, Number(s.max) || 0,
  s.active ? "Có" : "Không", s.popular ? "Có" : "Không",
  (s.features || []).map((f) => `${f.t} | ${f.d || ""}`).join("\n"), (s.notes || []).join("\n"), "",
];
const SVC_TPL = [
  ["", "facebook", "Tăng like bài viết Facebook", "Like từ tài khoản thật, bảo hành 7 ngày", 25000, 100, 10000, "Có", "Có",
    "Lên nhanh | Bắt đầu trong 5–30 phút\nBảo hành | 7 ngày", "Không hỗ trợ trang riêng tư\nKhông đặt 2 đơn cùng liên kết", ""],
  ["", "tiktok", "Tăng follow TikTok", "Follow ổn định, ít rớt", 60000, 100, 5000, "Có", "Không", "", "Để tài khoản ở chế độ công khai", ""],
];
// Từ khóa cho ô Có/Không (đã chuẩn hóa bằng nk)
const TRUE_V = ["1", "true", "yes", "y", "x", "co", "bat", "on", "dangban", "hienthi", "ban"];
const FALSE_V = ["0", "false", "no", "n", "khong", "tat", "off", "an", "taman", "dangan"];
// Tên cột chấp nhận (tiếng Việt / tiếng Anh, không phân biệt hoa-thường, dấu)
const COLS = {
  id: ["id", "ma"],
  platform: ["platform", "nentang"],
  name: ["name", "ten", "tendichvu"],
  desc: ["desc", "description", "mota"],
  pricePer1000: ["priceper1000", "price", "gia", "gia1000", "giamoi1000"],
  min: ["min", "toithieu", "soluongtoithieu"],
  max: ["max", "toida", "soluongtoida"],
  active: ["active", "dangban", "trangthai", "hienthi"],
  popular: ["popular", "phobien"],
  features: ["features", "diemnoibat"],
  notes: ["notes", "luuy"],
  delete: ["delete", "xoa"],
};
const ALIAS = Object.fromEntries(Object.entries(COLS).flatMap(([f, a]) => a.map((x) => [x, f])));
const FIELDS = ["platform", "name", "desc", "pricePer1000", "min", "max", "active", "popular", "features", "notes"];
const mapKeys = (o) => {
  const r = {};
  for (const [k, x] of Object.entries(o || {})) {
    const f = ALIAS[nk(k)];
    if (f) r[f] = typeof x === "string" ? x.replace(/^'(?=[=+\-@])/, "") : x;
  }
  return r;
};
const toBool = (v) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const k = nk(v);
  return TRUE_V.includes(k) ? true : FALSE_V.includes(k) ? false : undefined;
};
const toNum = (v) => {
  if (typeof v === "number") return Math.round(v);
  const s = String(v).replace(/\D/g, "");
  return s === "" ? NaN : Number(s);
};
const parseFeat = (v) =>
  (Array.isArray(v) ? v : String(v).split(/\r?\n|\s*\|\|\s*/))
    .map((x) => {
      if (x && typeof x === "object") return { t: String(x.t ?? ""), d: String(x.d ?? "") };
      const [t, ...d] = String(x).split("|");
      return { t, d: d.join("|") };
    })
    .map((f) => ({ t: f.t.trim().slice(0, 120), d: f.d.trim().slice(0, 300) }))
    .filter((f) => f.t)
    .slice(0, 10);
const parseNotes = (v) =>
  (Array.isArray(v) ? v : String(v).split(/\r?\n|\s*\|\|\s*/)).map((x) => String(x).trim().slice(0, 300)).filter(Boolean).slice(0, 10);

/* ---------- Ghi hàng loạt (tối đa 400 thao tác / batch) ---------- */
async function commitOps(ops) {
  for (let i = 0; i < ops.length; i += 400) {
    const b = writeBatch(db);
    ops.slice(i, i + 400).forEach((o) => {
      const r = doc(db, "services", o.id);
      if (o.t === "del") b.delete(r);
      else if (o.t === "add") b.set(r, o.d);
      else b.update(r, o.d);
    });
    await b.commit();
  }
}

/* ---------- Lập kế hoạch nhập: kiểm tra từng dòng, chưa ghi gì ---------- */
function planImport(recs, rep) {
  const byId = new Map(S.services.map((s) => [s.id, s]));
  const byKey = new Map(S.services.map((s) => [`${s.platform}|${String(s.name).trim().toLowerCase()}`, s]));
  const seen = new Set(), hit = new Set(), ops = [], prev = [], errs = [];
  const P_ = { add: 0, upd: 0, del: 0, same: 0 };
  recs.forEach(({ line, v: raw }) => {
    const bad = (m) => errs.push(`Dòng ${line}: ${m}`);
    const got = (k) => raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== "";
    const id = got("id") ? String(raw.id).trim() : "";
    if (id && !/^[A-Za-z0-9_-]{1,100}$/.test(id)) return bad("ID không hợp lệ");
    let pf;
    if (got("platform")) {
      pf = Object.keys(PF).find((k) => k === nk(raw.platform) || nk(PF[k]) === nk(raw.platform));
      if (!pf) return bad(`nền tảng “${raw.platform}” không hợp lệ (dùng: ${Object.keys(PF).join(", ")})`);
    }
    const nm = got("name") ? String(raw.name).trim() : "";
    // Khớp dịch vụ cũ: theo ID, nếu không có ID thì theo Nền tảng + Tên
    const ex = id ? byId.get(id) : pf && nm ? byKey.get(`${pf}|${nm.toLowerCase()}`) : undefined;
    if (ex) hit.add(ex.id);
    if (got("delete") && toBool(raw.delete) === true) {
      if (!ex) return bad("không tìm thấy dịch vụ để xóa (cần ID, hoặc Nền tảng + Tên)");
      if (seen.has(ex.id)) return bad("trùng với dòng khác trong tệp");
      seen.add(ex.id);
      ops.push({ t: "del", id: ex.id }); P_.del++; prev.push(["del", ex.name, ex.platform, ex.pricePer1000]);
      return;
    }
    const base = ex
      ? { platform: ex.platform, name: ex.name, desc: ex.desc || "", pricePer1000: Number(ex.pricePer1000) || 0, min: Number(ex.min) || 0, max: Number(ex.max) || 0, active: !!ex.active, popular: !!ex.popular, features: ex.features || [], notes: ex.notes || [] }
      : { platform: pf, name: nm, desc: "", pricePer1000: 0, min: 100, max: 10000, active: true, popular: false, features: [], notes: [] };
    const d = { ...base };
    if (pf) d.platform = pf;
    if (nm) d.name = nm;
    if (got("desc")) d.desc = String(raw.desc).trim();
    for (const k of ["pricePer1000", "min", "max"])
      if (got(k)) { d[k] = toNum(raw[k]); if (!Number.isFinite(d[k])) return bad(`cột “${k}” không phải số`); }
    for (const k of ["active", "popular"])
      if (got(k)) { const b = toBool(raw[k]); if (b === undefined) return bad(`giá trị “${raw[k]}” không hợp lệ (dùng Có / Không)`); d[k] = b; }
    if (got("features")) d.features = parseFeat(raw.features);
    if (got("notes")) d.notes = parseNotes(raw.notes);
    // Cùng luật kiểm tra như form “Thêm / Sửa dịch vụ”
    if (!PF[d.platform]) return bad("thiếu nền tảng");
    if (d.name.length < 2 || d.name.length > 100) return bad("tên dịch vụ phải 2–100 ký tự");
    if (d.desc.length > 300) return bad("mô tả tối đa 300 ký tự");
    if (d.pricePer1000 <= 0) return bad("giá phải lớn hơn 0");
    if (d.min < 1 || d.max < d.min) return bad("số lượng min/max không hợp lệ");
    const key = ex ? ex.id : id || `${d.platform}|${d.name.toLowerCase()}`;
    if (seen.has(key)) return bad("trùng với dòng khác trong tệp");
    seen.add(key);
    if (ex) {
      if (FIELDS.every((k) => JSON.stringify(d[k]) === JSON.stringify(base[k]))) { P_.same++; return; }
      ops.push({ t: "upd", id: ex.id, d: { ...d, updatedAt: serverTimestamp() } });
      P_.upd++; prev.push(["upd", d.name, d.platform, d.pricePer1000]);
    } else {
      ops.push({ t: "add", id: id || doc(collection(db, "services")).id, d: { ...d, createdAt: serverTimestamp(), updatedAt: serverTimestamp() } });
      P_.add++; prev.push(["add", d.name, d.platform, d.pricePer1000]);
    }
  });
  // Chế độ đồng bộ: xóa dịch vụ hiện có nhưng không xuất hiện trong tệp
  if (rep)
    S.services.filter((s) => !hit.has(s.id)).forEach((s) => {
      ops.push({ t: "del", id: s.id }); P_.del++; prev.push(["del", s.name, s.platform, s.pricePer1000]);
    });
  return { ops, errs, prevAll: prev, prev: prev.slice(0, 10), ...P_ };
}

/* ---------- Danh sách dịch vụ (có tick chọn) — THAY cho svcList/pgSvc cũ ---------- */
const svcFiltered = () =>
  S.services
    .filter((s) => (S.f === "all" || s.platform === S.f || (S.f === "off" && !s.active)) && has(S.q, `${s.name} ${PF[s.platform] || ""}`))
    .sort((a, b) => String(a.platform).localeCompare(b.platform) || String(a.name).localeCompare(b.name));
const refreshList = () => { const l = $("#list"); if (l) l.innerHTML = svcList(); };
function svcList() {
  const f = svcFiltered();
  const selN = S.services.filter((s) => S.sel.has(s.id)).length;
  const bulk = selN
    ? `<div class="bulk"><b>Đã chọn ${selN}</b>
    <button class="btn sm line" data-act="bk" data-v="on">Bật bán</button>
    <button class="btn sm line" data-act="bk" data-v="off">Tạm ẩn</button>
    <button class="btn sm line" data-act="bk" data-v="price">Chỉnh giá %</button>
    <button class="btn sm line" data-act="exp" data-v="svcsel:csv">Xuất CSV</button>
    <button class="btn sm er" data-act="bk" data-v="del">Xóa đã chọn</button><span class="sp"></span>
    <button class="btn sm line" data-act="selclr">Bỏ chọn</button></div>`
    : "";
  if (!f.length) return bulk + empty(S.services.length ? "Không có dịch vụ phù hợp" : "Chưa có dịch vụ nào. Bấm “Thêm dịch vụ” hoặc “Nhập dữ liệu” để bắt đầu.");
  const { rows, pager } = paged(f);
  const all = f.every((s) => S.sel.has(s.id));
  return bulk + tbl([`<input type="checkbox" class="ckc" data-act="selall" ${all ? "checked" : ""} title="Chọn tất cả ${f.length} dịch vụ đang hiển thị">`, "Dịch vụ", "Nền tảng", ">Giá / 1.000", ">Min – Max", "Trạng thái", ""], rows.map((s) =>
    `<tr><td><input type="checkbox" class="ckc" data-act="sel" data-v="${s.id}" ${S.sel.has(s.id) ? "checked" : ""}></td>
    <td><b>${esc(s.name)}</b>${s.popular ? ' <span class="st pr">Phổ biến</span>' : ""}<span class="sub">${esc(s.desc)}</span></td><td>${PF[s.platform] || esc(s.platform)}</td>
    <td class="r">${vnd(s.pricePer1000)}</td><td class="r">${num(s.min)} – ${num(s.max)}</td><td>${s.active ? '<span class="st ok">Đang bán</span>' : '<span class="st">Tạm ẩn</span>'}</td>
    <td><div class="acts"><button class="btn sm line" data-act="tgsvc" data-v="${s.id}">${s.active ? "Ẩn" : "Bật"}</button><button class="btn sm" data-act="svc" data-v="${s.id}">Sửa</button><button class="btn sm er" data-act="delsvc" data-v="${s.id}">Xóa</button></div></td></tr>`)) + pager;
}

/* ---------- Menu Xuất + dữ liệu xuất của các trang khác ---------- */
const em = (uid) => S.users.find((x) => x.uid === uid)?.email || "";
const EXP = {
  services: ["dich-vu"],
  users: ["nguoi-dung", () => S.users, [["UID", (u) => u.uid], ["Email", (u) => u.email || ""], ["Tên hiển thị", (u) => u.displayName || ""], ["Số dư", (u) => Number(u.balance) || 0], ["Trạng thái", (u) => (u.disabled ? "Đã khóa" : "Hoạt động")], ["Ngày tạo", (u) => fdt(u.createdAt)]]],
  orders: ["don-hang", () => S.orders, [["Mã đơn", (o) => o.code], ["UID", (o) => o.uid], ["Email", (o) => em(o.uid)], ["Dịch vụ", (o) => o.serviceName || ""], ["Nền tảng", (o) => PF[o.platform] || o.platform || ""], ["Liên kết", (o) => o.link || ""], ["Số lượng", (o) => Number(o.quantity) || 0], ["Tổng tiền", (o) => Number(o.total) || 0], ["Trạng thái", (o) => ST[o.status]?.[0] || o.status || ""], ["Ngày tạo", (o) => fdt(o.createdAt)]]],
  topups: ["nap-tien", () => S.topups, [["Mã nạp", (t) => t.code], ["UID", (t) => t.uid], ["Email", (t) => em(t.uid)], ["Số tiền", (t) => Number(t.amount) || 0], ["Trạng thái", (t) => TST[t.status || "pending"]?.[0] || ""], ["Ngày tạo", (t) => fdt(t.createdAt)]]],
  tickets: ["ho-tro", () => S.tickets, [["Tiêu đề", (t) => t.subject || ""], ["UID", (t) => t.uid], ["Email", (t) => em(t.uid)], ["Nội dung", (t) => t.message || ""], ["Phản hồi", (t) => t.reply || ""], ["Trạng thái", (t) => KST[t.status || "open"]?.[0] || ""], ["Ngày gửi", (t) => fdt(t.createdAt)]]],
  logs: ["lich-su-so-du", () => S.logs, [["Thời gian", (l) => fdt(l.createdAt)], ["UID", (l) => l.uid], ["Email", (l) => em(l.uid)], ["Loại", (l) => LOGT[l.type] || l.type || ""], ["Biến động", (l) => Number(l.amount) || 0], ["Số dư sau", (l) => Number(l.balanceAfter) || 0], ["Ghi chú", (l) => l.note || ""], ["Thực hiện", (l) => em(l.by) || l.by || ""]]],
};
const ddm = (r) => {
  const items = r === "services"
    ? [["Tất cả dịch vụ · CSV", "svc:csv"], ["Tất cả dịch vụ · Excel (.xlsx)", "svc:xlsx"], ["Tất cả dịch vụ · JSON", "svc:json"], ["Đang lọc / tìm · CSV", "svcview:csv"], ["Đang lọc / tìm · Excel (.xlsx)", "svcview:xlsx"]]
    : [["Xuất CSV", `${r}:csv`], ["Xuất Excel (.xlsx)", `${r}:xlsx`], ["Xuất JSON", `${r}:json`]];
  return `<details class="dd"><summary class="btn line">${I("down")} Xuất dữ liệu</summary><div class="ddm">${items.map(([t, v]) => `<button data-act="exp" data-v="${v}">${t}</button>`).join("")}</div></details>`;
};
function pgSvc() {
  return {
    title: "Dịch vụ", sub: "Thêm, chỉnh giá, bật/tắt dịch vụ hiển thị cho người dùng",
    act: `<div class="tools">${ddm("services")}<button class="btn line" data-act="imp">${I("up")} Nhập dữ liệu</button><button class="btn" data-act="svc" data-v="">${I("plus")} Thêm dịch vụ</button></div>`,
    body: bar("Tìm dịch vụ", chips([["all", "Tất cả"], ...Object.entries(PF), ["off", "Đang ẩn"]])) + `<div class="card" id="list">${svcList()}</div>`,
  };
}

/* ---------- Màn hình nhập: chọn tệp → xem trước → áp dụng ---------- */
function showImport() {
  const { recs, rep, file } = S.imp, pl = planImport(recs, rep);
  S.imp.plan = pl;
  const blocked = rep && pl.errs.length > 0;
  const tag = { add: ["Thêm mới", "ok"], upd: ["Cập nhật", "pr"], del: ["Xóa", "er"] };
  modal(`<div class="imp"><h2>Xem trước khi nhập</h2><p class="mut" style="margin:0">${esc(file)} · ${num(recs.length)} dòng</p>
  <div class="kpis"><span class="st ok">Thêm mới: ${pl.add}</span><span class="st pr">Cập nhật: ${pl.upd}</span><span class="st wa">Xóa: ${pl.del}</span><span class="st">Không đổi: ${pl.same}</span><span class="st er">Lỗi: ${pl.errs.length}</span></div>
  ${pl.errs.length ? `<div class="note bad"><b>${pl.errs.length} dòng lỗi${blocked ? " — hãy sửa tệp rồi nhập lại" : " (sẽ được bỏ qua)"}:</b><br>${pl.errs.slice(0, 12).map(esc).join("<br>")}${pl.errs.length > 12 ? `<br>… và ${pl.errs.length - 12} lỗi khác` : ""}</div>` : ""}
  ${pl.prev.length ? tbl(["Thao tác", "Dịch vụ", "Nền tảng", ">Giá / 1.000"], pl.prev.map(([t, n, p, v]) => `<tr><td><span class="st ${tag[t][1]}">${tag[t][0]}</span></td><td>${esc(n)}</td><td>${PF[p] || esc(p)}</td><td class="r">${vnd(v)}</td></tr>`)) + (pl.ops.length > pl.prev.length ? `<p class="mut" style="margin:8px 0 0">… và ${pl.ops.length - pl.prev.length} thao tác khác</p>` : "") : empty("Không có thay đổi nào để áp dụng")}
  <label class="ck"><input type="checkbox" data-act="imprep" ${rep ? "checked" : ""}>Đồng bộ hoàn toàn: xóa mọi dịch vụ hiện có mà không có trong tệp</label>
  <div class="row2" style="margin-top:20px"><button class="btn line" data-act="imp">Chọn tệp khác</button><button class="btn" data-act="impgo" ${pl.ops.length && !blocked ? "" : "disabled"}>Áp dụng ${pl.ops.length} thay đổi</button></div>
  <button class="btn line" style="margin-top:10px" data-act="closem">Hủy</button></div>`);
}
async function readImport(f) {
  if (f.size > 5e6) throw new Error("Tệp quá lớn (tối đa 5MB)");
  const ext = f.name.split(".").pop().toLowerCase();
  let objs;
  if (ext === "json") {
    let j = JSON.parse(await f.text());
    if (!Array.isArray(j)) j = j?.services || j?.data;
    if (!Array.isArray(j)) throw new Error("JSON phải là một mảng các dịch vụ");
    objs = j;
  } else if (ext === "xlsx" || ext === "xls") {
    const X = await xlsx(), wb = X.read(await f.arrayBuffer());
    objs = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "", raw: true });
  } else {
    const rows = parseCSV(await f.text()), head = rows.shift() || [];
    objs = rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
  }
  if (objs.length > 2000) toast("Chỉ đọc 2.000 dòng đầu tiên của tệp");
  const recs = objs.slice(0, 2000).map((o, i) => ({ line: i + 2, v: mapKeys(o) })).filter((r) => Object.keys(r.v).length);
  if (!recs.length) throw new Error("Không nhận diện được cột nào. Hãy dùng tệp mẫu hoặc tệp xuất ra từ hệ thống.");
  S.imp = { file: f.name, recs, rep: false };
  showImport();
}

/* ---------- Actions mới (gộp vào A) ---------- */
Object.assign(A, {
  // Tick chọn
  sel: (el, id) => { el.checked ? S.sel.add(id) : S.sel.delete(id); refreshList(); },
  selall: (el) => { svcFiltered().forEach((s) => (el.checked ? S.sel.add(s.id) : S.sel.delete(s.id))); refreshList(); },
  selclr: () => { S.sel.clear(); refreshList(); },

  // Sửa / xóa hàng loạt các dịch vụ đã chọn
  bk: (el, v) => run(el, async () => {
    const L = S.services.filter((s) => S.sel.has(s.id));
    if (!L.length) return;
    if (v === "del") {
      if (!confirm(`Xóa vĩnh viễn ${L.length} dịch vụ đã chọn?\nĐơn cũ vẫn giữ nguyên. Không thể hoàn tác.`)) return;
      await commitOps(L.map((s) => ({ t: "del", id: s.id })));
      S.sel.clear();
      toast(`Đã xóa ${L.length} dịch vụ`);
    } else if (v === "on" || v === "off") {
      await commitOps(L.map((s) => ({ t: "upd", id: s.id, d: { active: v === "on", updatedAt: serverTimestamp() } })));
      toast(`${v === "on" ? "Đã bật bán" : "Đã tạm ẩn"} ${L.length} dịch vụ`);
    } else if (v === "price") {
      const raw = prompt(`Điều chỉnh giá cho ${L.length} dịch vụ đã chọn theo %.\nVí dụ: 10 = tăng 10%, -5 = giảm 5%`);
      if (raw === null) return;
      const pct = Number(raw.replace(",", ".").replace(/[^\d.+-]/g, ""));
      if (!Number.isFinite(pct) || pct === 0 || pct <= -100 || pct > 1000) return toast("Phần trăm không hợp lệ", 1);
      await commitOps(L.map((s) => ({ t: "upd", id: s.id, d: { pricePer1000: Math.max(1, Math.round((Number(s.pricePer1000) || 0) * (1 + pct / 100))), updatedAt: serverTimestamp() } })));
      toast(`Đã chỉnh giá ${pct > 0 ? "+" : ""}${pct}% cho ${L.length} dịch vụ`);
    }
    refreshList();
  }),

  // Xuất dữ liệu: v = "<phạm vi>:<định dạng>"
  exp: (el, v) => run(el, async () => {
    el.closest("details")?.removeAttribute("open");
    const [k, fmt] = v.split(":");
    let name, head, rows;
    if (k === "tpl") { name = "mau-nhap-dich-vu"; head = SVC_HEAD; rows = SVC_TPL; }
    else if (k.startsWith("svc")) {
      const list = k === "svcsel" ? S.services.filter((s) => S.sel.has(s.id)) : k === "svcview" ? svcFiltered() : S.services;
      if (!list.length) return toast("Không có dữ liệu để xuất", 1);
      name = EXP.services[0]; head = SVC_HEAD; rows = list.map(svcRow);
    } else {
      const e = EXP[k], list = e?.[1]();
      if (!list?.length) return toast("Không có dữ liệu để xuất", 1);
      name = e[0]; head = e[2].map((c) => c[0]); rows = list.map((x) => e[2].map((c) => c[1](x)));
    }
    await saveTable(fmt, name, head, rows);
    toast(k === "tpl" ? "Đã tải tệp mẫu" : `Đã xuất ${rows.length} dòng`);
  }),

  // Nhập dữ liệu
  imp: () => {
    S.imp = null;
    modal(`<div class="imp"><h2>Nhập dịch vụ hàng loạt</h2>
    <p class="mut" style="margin:0 0 4px">Hỗ trợ <b>CSV, Excel (.xlsx), JSON</b>. Bạn sẽ được xem trước trước khi ghi vào hệ thống.</p>
    <div class="note"><b>Quy tắc:</b><br>• Dòng có <b>ID</b> trùng dịch vụ cũ → cập nhật; ID mới → thêm mới.<br>• Không có ID → khớp theo <b>Nền tảng + Tên dịch vụ</b> (khớp thì sửa, chưa có thì thêm mới).<br>• Ô để trống khi sửa = giữ nguyên giá trị cũ.<br>• Cột <b>Xóa</b> ghi <b>x</b> (hoặc Có) → xóa dịch vụ đó.<br>• Nền tảng: ${Object.keys(PF).join(" / ")}. Đang bán, Phổ biến: Có / Không.</div>
    <label class="l">Chọn tệp</label><input type="file" id="imp_file" accept=".csv,.json,.xlsx,.xls,.txt">
    <div class="row2" style="margin-top:12px"><button class="btn line" data-act="exp" data-v="tpl:xlsx">Tải mẫu Excel</button><button class="btn line" data-act="exp" data-v="tpl:csv">Tải mẫu CSV</button></div>
    <button class="btn line" style="margin-top:16px" data-act="closem">Đóng</button></div>`);
  },
  imprep: (el) => { if (!S.imp) return; S.imp.rep = el.checked; showImport(); },
  impgo: (el) => run(el, async () => {
    const pl = S.imp?.plan;
    if (!pl?.ops.length) return;
    if (!confirm(`Áp dụng ${pl.ops.length} thay đổi (thêm ${pl.add}, cập nhật ${pl.upd}, xóa ${pl.del})?${pl.del ? "\nDịch vụ bị xóa không thể khôi phục." : ""}`)) return;
    await commitOps(pl.ops);
    S.imp = null; S.sel.clear(); modal("");
    toast(`Đã nhập xong: +${pl.add} mới · ${pl.upd} cập nhật · ${pl.del} xóa`);
  }),
});

document.addEventListener("change", (e) => {
  if (e.target.id !== "imp_file") return;
  const f = e.target.files?.[0];
  if (f) run(null, () => readImport(f));
});
// Đổi trang thì bỏ chọn / bỏ dữ liệu nhập đang dở
window.addEventListener("hashchange", () => {
  S.sel.clear(); S.imp = null;
  if (route() === "services") refreshList();
});
