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
const PF = { facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", google: "Google" };
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
function svcList() {
  const f = S.services
    .filter((s) => (S.f === "all" || s.platform === S.f || (S.f === "off" && !s.active)) && has(S.q, `${s.name} ${PF[s.platform] || ""}`))
    .sort((a, b) => String(a.platform).localeCompare(b.platform) || String(a.name).localeCompare(b.name));
  if (!f.length) return empty(S.services.length ? "Không có dịch vụ phù hợp" : "Chưa có dịch vụ nào. Bấm “Thêm dịch vụ” để bắt đầu.");
  const { rows, pager } = paged(f);
  return tbl(["Dịch vụ", "Nền tảng", ">Giá / 1.000", ">Min – Max", "Trạng thái", ""], rows.map((s) =>
    `<tr><td><b>${esc(s.name)}</b>${s.popular ? ' <span class="st pr">Phổ biến</span>' : ""}<span class="sub">${esc(s.desc)}</span></td><td>${PF[s.platform] || esc(s.platform)}</td>
    <td class="r">${vnd(s.pricePer1000)}</td><td class="r">${num(s.min)} – ${num(s.max)}</td><td>${s.active ? '<span class="st ok">Đang bán</span>' : '<span class="st">Tạm ẩn</span>'}</td>
    <td><div class="acts"><button class="btn sm line" data-act="tgsvc" data-v="${s.id}">${s.active ? "Ẩn" : "Bật"}</button><button class="btn sm" data-act="svc" data-v="${s.id}">Sửa</button><button class="btn sm er" data-act="delsvc" data-v="${s.id}">Xóa</button></div></td></tr>`)) + pager;
}
function pgSvc() {
  return {
    title: "Dịch vụ", sub: "Thêm, chỉnh giá, bật/tắt dịch vụ hiển thị cho người dùng",
    act: `<button class="btn" data-act="svc" data-v="">${I("plus")} Thêm dịch vụ</button>`,
    body: bar("Tìm dịch vụ", chips([["all", "Tất cả"], ...Object.entries(PF), ["off", "Đang ẩn"]])) + `<div class="card" id="list">${svcList()}</div>`,
  };
}

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