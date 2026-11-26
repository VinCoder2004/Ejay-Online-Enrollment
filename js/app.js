import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.querySelector("#app");
const SEAL = "assets/seal.jpeg",
  TERM = "1st Semester, AY 2026-2027";

const campuses = [
  ["Talisay Campus", "Talisay City, Negros Occidental"],
  ["Alijis Campus", "Alijis, Bacolod City"],
  ["Fortune Towne Campus", "Fortune Towne, Bacolod City"],
  ["Binalbagan Campus", "Binalbagan, Negros Occidental"],
];
const programs = [
  ["BS Information Technology", "College of Computer Studies"],
  ["BS Information Systems", "College of Computer Studies"],
  ["BS Computer Engineering", "College of Engineering"],
  [
    "BS Business Administration",
    "College of Business Management & Accountancy",
  ],
  ["BS Psychology", "College of Arts & Sciences"],
  ["Bachelor of Secondary Education", "College of Education"],
];
const subjects = [
  ["GE001", "Understanding the Self", 3],
  ["GE002", "Readings in Philippine History", 3],
  ["GE003", "Mathematics in the Modern World", 3],
  ["BSIT101", "Introduction to Computing", 3],
  ["BSIT102", "Computer Programming 1", 3],
  ["PE001", "Physical Education 1", 2],
  ["NSTP101", "National Service Training Program 1", 3],
];
const fees = [
  ["Tuition Fee", 4800],
  ["Miscellaneous Fees", 2150],
  ["Laboratory Fee", 1200],
];
const total = fees.reduce((s, f) => s + f[1], 0);
const STEPS = [
  "Campus",
  "Program",
  "Info",
  "OSA",
  "Clinic",
  "Registrar",
  "Scholarship",
  "Cashier",
  "Summary",
];
const SCREENS = [
  "campus",
  "program",
  "info",
  "osa",
  "clinic",
  "registrar",
  "scholarship",
  "cashier",
  "summary",
];
const REQ = {
  osa: ["Good Moral Certificate", "2x2 Student Photo", "Birth Certificate"],
  clinic: ["Medical Certificate", "Health Declaration Form"],
};

const st = {
  screen: "boot",
  user: null,
  profile: null,
  enr: null,
  docs: [],
  anon: false,
};

const I = {
  back: "m15 18-6-6 6-6",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  check: "m5 12 4 4L19 6",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h6",
  up: "M12 16V4m0 0-4 4m4-4 4 4M4 20h16",
};
const ic = (k) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${I[k]}"/></svg>`;
const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const peso = (n) =>
  "PHP " + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
const $ = (s) => document.querySelector(s);

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 3200);
}
function busy(btn, on, label) {
  if (!btn) return;
  btn.disabled = on;
  if (label) btn.textContent = on ? "Please wait..." : label;
}

/* ---------- data layer ---------- */
async function loadEnrollment() {
  const { data } = await sb
    .from("enrollments")
    .select("*")
    .eq("term", TERM)
    .order("created_at", { ascending: false })
    .limit(1);
  st.enr = data?.[0] || null;
  st.docs = [];
  if (st.enr) {
    const r = await sb
      .from("documents")
      .select("*")
      .eq("enrollment_id", st.enr.id);
    st.docs = r.data || [];
  }
}
async function createEnrollment() {
  const reference = `CHMSU-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
  const base = {
    reference,
    term: TERM,
    campus: st.profile?.campus || null,
    program: st.profile?.program || null,
  };
  const { data, error } = await sb
    .from("enrollments")
    .insert(base)
    .select()
    .single();
  if (error) throw error;
  st.enr = data;
  st.docs = [];
}
async function save(patch) {
  const { data, error } = await sb
    .from("enrollments")
    .update(patch)
    .eq("id", st.enr.id)
    .select()
    .single();
  if (error) {
    toast("Could not save. Check your connection.");
    throw error;
  }
  st.enr = data;
}
async function advance(to) {
  const step = Math.max(st.enr.step, SCREENS.indexOf(to));
  await save({ step });
  go(to);
}

/* ---------- ui pieces ---------- */
function top(title, back) {
  return `<header class="top">${back ? `<button class="back" data-go="${back}" aria-label="Go back">${ic("back")}</button>` : ""}<h1>${title}</h1></header>`;
}
function stepper(n) {
  return `<nav class="steps" aria-label="Progress">${STEPS.map((l, i) => `<div class="step ${i < n ? "done" : i === n ? "on" : ""}"><i>${i < n ? ic("check") : i + 1}</i>${l}</div>`).join("")}</nav>`;
}
function field(id, label, type = "text", ph = "", val = "") {
  return `<label class="field" id="f-${id}"><span>${label}</span><input id="${id}" type="${type}" placeholder="${ph}" value="${esc(val)}" /></label>`;
}
function flag(id, msg) {
  const f = $("#f-" + id);
  if (!f) return;
  f.classList.add("bad");
  f.querySelector("small")?.remove();
  f.insertAdjacentHTML("beforeend", `<small>${msg}</small>`);
}
function clear() {
  document.querySelectorAll(".field.bad").forEach((f) => {
    f.classList.remove("bad");
    f.querySelector("small")?.remove();
  });
}
const who = () =>
  st.enr?.info?.first
    ? `${st.enr.info.first} ${st.enr.info.last}`
    : st.profile?.full_name || "Student";

/* ---------- screens ---------- */
const S = {
  boot: () => `<div class="load">Loading...</div>`,

  login:
    () => `<main class="auth"><section class="brand"><img class="seal" src="${SEAL}" alt="CHMSU seal" /><h1>CARLOS HILADO MEMORIAL<br>STATE UNIVERSITY</h1><p>Student Information System</p><p>Online Enrollment</p></section>
    <section class="auth-body"><form class="card" id="login" novalidate><h2>Welcome back</h2><p class="muted">Log in with your Student ID or email.</p>
      ${field("who", "Student ID or Email", "text", "e.g. 2023-0045-TLS")}
      <label class="field"><span>Password</span><span class="pw"><input id="pw" type="password" placeholder="Enter your password" autocomplete="current-password" /><button type="button" data-act="eye" aria-label="Show password">${ic("eye")}</button></span></label>
      <p class="err" id="err" role="alert"></p>
      <button class="btn" type="submit">LOG IN</button><p class="center" style="margin-top:14px"><button type="button" class="link" data-go="forgot">Forgot password?</button></p></form>
      <div class="divider"><span>or</span></div>
      <div class="promo"><h3>New to CHMSU?</h3><p>Start your freshman enrollment. No student account is required.</p><button class="btn orange" data-act="freshman">ENROLL AS FRESHMAN</button></div>
      <p class="muted center" style="margin-top:22px;font-size:11px">&copy; 2026 CHMSU Student Information System</p></section></main>`,

  forgot: () =>
    `${top("Forgot Password", "login")}<main class="wrap"><form class="card" id="forgot" novalidate><h2>Reset password</h2><p class="muted lead">Enter your registered email and we will send a reset link.</p>${field("mail", "Email Address", "email", "yourname@chmsu.edu.ph")}<p class="err" id="err"></p><button class="btn" type="submit">SEND RESET LINK</button></form></main>`,

  dashboard: () => {
    const p = st.profile || {},
      e = st.enr;
    const label = !e
      ? "START ENROLLMENT"
      : e.status === "draft"
        ? "CONTINUE ENROLLMENT"
        : "VIEW ENROLLMENT";
    return `<section class="hero"><div class="hero-in"><div class="bar"><div><img src="${SEAL}" alt="" />CHMSU SIS</div><button data-act="logout">Log out</button></div><p>Good day,</p><h1>${esc(p.full_name)}</h1><p>${esc(p.student_no || "")} ${p.program ? "&middot; " + esc(p.program) : ""}</p></div></section>
    <main class="wrap wide" style="margin-top:-20px"><div class="card term"><div><span>CURRENT TERM</span><strong>${TERM}</strong></div><span class="tag ok">Open</span></div>
      <h2 class="sec">Enrollment</h2><div class="card"><h3>Online Enrollment</h3><p class="muted" style="margin:4px 0 14px">${e ? `Reference ${esc(e.reference)} &middot; Status: <b>${esc(e.status)}</b>` : "Complete your requirements and register for the coming term."}</p><button class="btn sm" data-act="resume">${label}</button></div>
      <h2 class="sec">Student record</h2><div class="grid">${[
        ["Year Level", p.year_level || "-"],
        ["Campus", (p.campus || "-").replace(" Campus", "")],
        ["Standing", p.standing || "-"],
        ["Balance", peso(p.balance || 0)],
      ]
        .map(
          ([a, b]) =>
            `<div class="card"><span>${a}</span><strong>${esc(b)}</strong></div>`,
        )
        .join("")}</div></main>`;
  },

  welcome:
    () => `${top("Freshman Enrollment", "login")}<main class="wrap center"><img class="seal" style="box-shadow:0 0 0 3px var(--line)" src="${SEAL}" alt="" /><p class="eyebrow">WELCOME TO CHMSU</p><h2>Begin your college journey</h2><p class="muted lead">Complete the guided process. Your progress is saved automatically.</p>
    <div class="card kv" style="text-align:left;margin-bottom:20px">${["Choose your campus", "Select a degree program", "Submit student information", "Complete clearances"].map((t, i) => `<div><span class="num o" style="color:#fff">${i + 1}</span><strong style="flex:1;text-align:left;margin-left:12px">${t}</strong></div>`).join("")}</div><button class="btn" data-act="resume">${st.enr ? "CONTINUE ENROLLMENT" : "GET STARTED"}</button></main>`,

  campus: () =>
    `${top("Select Campus", st.anon ? "welcome" : "dashboard")}${stepper(0)}<main class="wrap"><p class="eyebrow">STEP 1 OF 9</p><h2>Where would you like to study?</h2><p class="muted">Choose your preferred CHMSU campus.</p><div class="list">${campuses.map(([n, l], i) => `<button class="pick ${st.enr.campus === n ? "sel" : ""}" data-act="campus" data-i="${i}"><span class="num">${String(i + 1).padStart(2, "0")}</span><span><strong>${n}</strong><small>${l}</small></span>${ic("check")}</button>`).join("")}</div><button class="btn" data-act="next" data-to="program" ${st.enr.campus ? "" : "disabled"}>CONTINUE</button></main>`,

  program: () =>
    `${top("Select Program", "campus")}${stepper(1)}<main class="wrap"><p class="eyebrow">STEP 2 OF 9</p><h2>Choose your degree program</h2><p class="muted">Programs available at ${esc(st.enr.campus)}.</p><input class="search" placeholder="Search programs" aria-label="Search programs" /><div class="list">${programs.map(([n, c], i) => `<button class="pick ${st.enr.program === n ? "sel" : ""}" data-act="program" data-i="${i}"><span><strong>${n}</strong><small>${c}</small></span>${ic("check")}</button>`).join("")}</div><button class="btn" data-act="next" data-to="info" ${st.enr.program ? "" : "disabled"}>CONTINUE</button></main>`,

  info: () => {
    const v = st.enr.info || {};
    return `${top("Student Information", "program")}${stepper(2)}<main class="wrap"><p class="eyebrow">STEP 3 OF 9</p><h2>Tell us about yourself</h2><p class="muted lead">Use your legal name exactly as it appears on your records.</p><form class="card" id="info" novalidate>
    <div class="row">${field("first", "First Name", "text", "", v.first)}${field("middle", "Middle Name", "text", "", v.middle)}</div>${field("last", "Last Name", "text", "", v.last)}
    <div class="row">${field("dob", "Date of Birth", "date", "", v.dob)}${field("mobile", "Mobile Number", "tel", "09XX XXX XXXX", v.mobile)}</div>${field("email", "Email Address", "email", "name@email.com", v.email)}${field("address", "Home Address", "text", "Complete address", v.address)}
    <button class="btn" type="submit" style="margin-top:8px">SAVE &amp; CONTINUE</button></form></main>`;
  },

  osa: () => docScreen("osa"),
  clinic: () => docScreen("clinic"),

  registrar: () =>
    `${top("Registrar Review", "clinic")}${stepper(5)}<main class="wrap"><p class="eyebrow">STEP 6 OF 9</p><h2>Review your application</h2><p class="muted lead">Check that your details are correct before they go to the registrar.</p>${summaryCard()}<div class="notice"><strong>Subject tagging</strong>Your subjects are assigned by the registrar after your documents are verified.</div><button class="btn" data-act="next" data-to="scholarship">CONFIRM &amp; CONTINUE</button></main>`,

  scholarship: () =>
    `${top("Scholarship", "registrar")}${stepper(6)}<main class="wrap"><p class="eyebrow">STEP 7 OF 9</p><h2>Scholarship assessment</h2><p class="muted">You may submit scholarship documents to the scholarship office later.</p><div class="list">${[
      [
        false,
        "No scholarship application",
        "Continue as a regular paying student",
      ],
      [
        true,
        "Apply for a scholarship",
        "The scholarship office will contact you",
      ],
    ]
      .map(
        ([v, a, b]) =>
          `<button class="pick ${!!st.enr.scholarship === v ? "sel" : ""}" data-act="schol" data-v="${v}"><span><strong>${a}</strong><small>${b}</small></span>${ic("check")}</button>`,
      )
      .join(
        "",
      )}</div><button class="btn" data-act="next" data-to="cashier">CONTINUE TO ASSESSMENT</button></main>`,

  cashier: () =>
    `${top("Cashier Assessment", "scholarship")}${stepper(7)}<main class="wrap"><p class="eyebrow">STEP 8 OF 9</p><h2>Enrollment assessment</h2><div class="bill">${fees.map(([a, b]) => `<div><span>${a}</span><strong>${peso(b)}</strong></div>`).join("")}<div class="tot"><span>Total Assessment</span><strong>${peso(total)}</strong></div></div><div class="notice"><strong>Payment is made at the cashier</strong>Submitting does not charge you. Present your reference number at the cashier to settle your fees.</div>${st.anon ? `<form class="card" id="acct" novalidate><h3>Save your enrollment</h3><p class="muted">Create your account so you can log in later and check your status. We will email you a link to confirm your address.</p>${field("aemail", "Email Address", "email", "name@email.com", st.enr.info?.email || "")}${field("apw", "Password (8+ characters)", "password")}${field("apw2", "Confirm Password", "password")}<p class="err" id="err" role="alert"></p><button class="btn" type="submit">CREATE ACCOUNT &amp; SUBMIT</button></form>` : `<button class="btn" data-act="submit">SUBMIT ENROLLMENT</button>`}</main>`,

  summary: () =>
    `${top("Enrollment Submitted")}${stepper(9)}<main class="wrap"><div class="ok-mark">${ic("check")}</div><p class="eyebrow center">SUBMITTED FOR VERIFICATION</p><h2 class="center">Your enrollment is in</h2><p class="muted center">The registrar will validate your records. Keep your reference number.</p>${st.pendingEmail ? `<div class="notice" style="margin-bottom:0"><strong>Confirm your email</strong>We sent a link to ${esc(st.pendingEmail)}. Open it to activate your account, then log in with that email and your password.</div>` : ""}<div class="ref"><span>ENROLLMENT REFERENCE</span><strong>${esc(st.enr.reference)}</strong></div>${summaryCard()}<button class="btn" data-go="com">VIEW CERTIFICATE OF MATRICULATION</button><button class="btn ghost" data-go="${st.anon ? "login" : "dashboard"}" ${st.anon ? 'data-act="logout"' : ""}>${st.anon ? "FINISH" : "GO TO DASHBOARD"}</button></main>`,

  com: () => `${top("Certificate of Matriculation", "summary")}<main class="wrap wide"><article class="com"><div class="com-h"><img class="seal" src="${SEAL}" alt="" /><div><span>REPUBLIC OF THE PHILIPPINES</span><h2>CARLOS HILADO MEMORIAL STATE UNIVERSITY</h2><span>${esc(st.enr.campus || "")}</span></div></div>
    <div class="com-t"><strong>CERTIFICATE OF MATRICULATION</strong><span class="muted">${TERM}</span></div>
    <div class="meta"><div><span>Student</span><strong>${esc(who())}</strong></div><div><span>Program</span><strong>${esc(st.enr.program)}</strong></div><div><span>Campus</span><strong>${esc(st.enr.campus)}</strong></div><div><span>Reference</span><strong>${esc(st.enr.reference)}</strong></div></div>
    <table><thead><tr><th>Code</th><th>Course Title</th><th>Units</th></tr></thead><tbody>${subjects.map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join("")}</tbody><tfoot><tr><td colspan="2">TOTAL UNITS</td><td>${subjects.reduce((s, x) => s + x[2], 0)}</td></tr></tfoot></table>
    <div class="sign"><span>${st.enr.status === "approved" ? "Validated by" : "Pending validation by"}</span><strong>Office of the University Registrar</strong>${st.enr.status === "approved" ? "" : '<br><span class="stamp">NOT YET VALIDATED</span>'}</div></article>
    <div class="no-print" style="margin-top:16px"><button class="btn" onclick="print()">PRINT CERTIFICATE</button></div></main>`,
};

function summaryCard() {
  const e = st.enr;
  return `<div class="card kv"><div><span>Applicant</span><strong>${esc(who())}</strong></div><div><span>Type</span><strong>${st.anon ? "Incoming Freshman" : "Continuing Student"}</strong></div><div><span>Campus</span><strong>${esc(e.campus || "-")}</strong></div><div><span>Program</span><strong>${esc(e.program || "-")}</strong></div><div><span>Term</span><strong>${TERM}</strong></div></div>`;
}

function docScreen(kind) {
  const osa = kind === "osa",
    n = osa ? 3 : 4;
  return `${top(osa ? "OSA Verification" : "Clinic Verification", osa ? "info" : "osa")}${stepper(n)}<main class="wrap"><p class="eyebrow">STEP ${n + 1} OF 9</p><h2>${osa ? "Student affairs requirements" : "Health clearance"}</h2><p class="muted">Upload clear copies. PDF, JPG or PNG, up to 5 MB each.</p>
  <div class="list">${REQ[kind]
    .map((label, i) => {
      const k = `${kind}-${i}`,
        d = st.docs.find((x) => x.kind === k);
      return `<div class="doc"><span class="ic">${ic("file")}</span><div><strong>${label}</strong><small>${d ? "Uploaded, awaiting verification" : "Not yet uploaded"}</small></div>
    ${d ? `<span class="tag ${d.status === "verified" ? "ok" : ""}">${ic("check")}${d.status === "verified" ? "Verified" : "Uploaded"}</span>` : ""}
    <label class="up tag" style="${d ? "background:none;border:1px solid var(--line);color:var(--muted)" : ""}">${d ? "Replace" : "Upload"}<input type="file" accept=".pdf,.jpg,.jpeg,.png" data-act="file" data-kind="${k}" data-label="${label}" /></label></div>`;
    })
    .join("")}</div>
  <button class="btn" data-act="next" data-to="${osa ? "clinic" : "registrar"}" ${REQ[kind].every((_, i) => st.docs.some((x) => x.kind === `${kind}-${i}`)) ? "" : "disabled"}>CONTINUE</button></main>`;
}

/* ---------- navigation / render ---------- */
function go(screen) {
  st.screen = screen;
  app.innerHTML = (S[screen] || S.login)();
  scrollTo(0, 0);
}
async function enter() {
  const {
    data: { session },
  } = await sb.auth.getSession();
  st.user = session?.user || null;
  st.anon = !!st.user?.is_anonymous;
  if (!st.user) return go("login");
  if (st.anon) {
    await loadEnrollment();
    return go("login");
  }
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("id", st.user.id)
    .maybeSingle();
  await loadEnrollment();
  const i = st.enr?.info || {};
  st.profile = data || {
    full_name: i.first ? `${i.first} ${i.last}` : st.user.email,
    student_no: "",
    campus: st.enr?.campus,
    program: st.enr?.program,
    year_level: "1st Year",
    standing: "New",
  };
  go("dashboard");
}
async function resume() {
  try {
    if (!st.enr) await createEnrollment();
  } catch {
    return toast("Could not start enrollment. Try again.");
  }
  go(st.enr.status !== "draft" ? "summary" : SCREENS[Math.min(st.enr.step, 7)]);
}

/* ---------- events ---------- */
app.addEventListener("click", async (ev) => {
  const t = ev.target.closest("[data-act],[data-go]");
  if (!t || t.disabled) return;
  const a = t.dataset.act;
  if (t.dataset.go && a !== "logout") return go(t.dataset.go);
  if (a === "eye") {
    const p = $("#pw");
    p.type = p.type === "password" ? "text" : "password";
  }
  if (a === "logout") {
    await sb.auth.signOut();
    st.user = st.profile = st.enr = null;
    st.anon = false;
    st.docs = [];
    go("login");
  }
  if (a === "freshman") {
    busy(t, true);
    if (!st.user) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error || !data?.user) {
        busy(t, false);
        return toast("Freshman enrollment is unavailable right now.");
      }
      st.user = data.user;
    }
    st.anon = true;
    await loadEnrollment();
    busy(t, false);
    go("welcome");
  }
  if (a === "resume") await resume();
  if (a === "campus") {
    const [n] = campuses[+t.dataset.i];
    await save({ campus: n });
    go("campus");
  }
  if (a === "program") {
    const [n, c] = programs[+t.dataset.i];
    await save({ program: n, college: c });
    go("program");
  }
  if (a === "schol") {
    await save({ scholarship: t.dataset.v === "true" });
    go("scholarship");
  }
  if (a === "next") {
    t.disabled = true;
    await advance(t.dataset.to);
  }
  if (a === "submit") {
    busy(t, true, "SUBMIT ENROLLMENT");
    try {
      await save({ status: "submitted", step: 8, total });
      go("summary");
    } catch {
      busy(t, false, "SUBMIT ENROLLMENT");
    }
  }
});

app.addEventListener("change", async (ev) => {
  const t = ev.target;
  if (!t.matches('[data-act="file"]')) return;
  const f = t.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) return toast("File is larger than 5 MB.");
  if (!/\.(pdf|jpe?g|png)$/i.test(f.name))
    return toast("Use a PDF, JPG or PNG file.");
  if (!st.user || !st.enr) {
    t.value = "";
    return toast("Session expired. Please refresh the page.");
  }
  toast("Uploading, please wait...");
  try {
    const path = `${st.user.id}/${st.enr.id}/${t.dataset.kind}-${Date.now()}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const up = await sb.storage
      .from("requirements")
      .upload(path, f, { contentType: f.type || undefined });
    if (up.error) throw up.error;
    const { error } = await sb
      .from("documents")
      .upsert(
        {
          enrollment_id: st.enr.id,
          kind: t.dataset.kind,
          label: t.dataset.label,
          file_path: path,
          status: "pending",
        },
        { onConflict: "enrollment_id,kind" },
      );
    if (error) throw error;
    const r = await sb
      .from("documents")
      .select("*")
      .eq("enrollment_id", st.enr.id);
    st.docs = r.data || [];
  } catch (e) {
    t.value = "";
    return toast("Upload failed: " + (e.message || "try again"));
  }
  toast("Uploaded");
  go(st.screen);
});

app.addEventListener("input", (ev) => {
  if (!ev.target.matches(".search")) return;
  const q = ev.target.value.toLowerCase();
  document
    .querySelectorAll(".pick")
    .forEach((p) => (p.hidden = !p.textContent.toLowerCase().includes(q)));
});

app.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const id = ev.target.id,
    btn = ev.target.querySelector("[type=submit]");
  clear();
  if (id === "login") {
    let who_ = $("#who").value.trim(),
      pw = $("#pw").value,
      err = $("#err");
    err.textContent = "";
    if (!who_ || !pw)
      return (err.textContent = "Enter your Student ID or email and password.");
    busy(btn, true, "LOG IN");
    if (!who_.includes("@")) {
      const r = await sb.rpc("email_for_student_id", { sid: who_ });
      who_ = r.data || "";
    }
    const { error } = who_
      ? await sb.auth.signInWithPassword({ email: who_, password: pw })
      : { error: true };
    busy(btn, false, "LOG IN");
    if (error)
      return (err.textContent = "Incorrect Student ID, email or password.");
    await enter();
  }
  if (id === "forgot") {
    const m = $("#mail").value.trim();
    if (!/^\S+@\S+\.\S+$/.test(m))
      return flag("mail", "Enter a valid email address.");
    busy(btn, true, "SEND RESET LINK");
    await sb.auth.resetPasswordForEmail(m, {
      redirectTo: location.origin + location.pathname,
    });
    ev.target.innerHTML = `<div class="ok-mark" style="margin-left:0">${ic("check")}</div><h2>Check your email</h2><p class="muted lead">If that address is registered, a reset link is on its way.</p><button type="button" class="btn" data-go="login">BACK TO LOG IN</button>`;
  }
  if (id === "acct") {
    const em = $("#aemail").value.trim(),
      pw = $("#apw").value,
      pw2 = $("#apw2").value,
      err = $("#err");
    err.textContent = "";
    let ok = true;
    if (!/^\S+@\S+\.\S+$/.test(em)) {
      flag("aemail", "Enter a valid email");
      ok = false;
    }
    if (pw.length < 8) {
      flag("apw", "At least 8 characters");
      ok = false;
    }
    if (pw !== pw2) {
      flag("apw2", "Passwords do not match");
      ok = false;
    }
    if (!ok) return;
    busy(btn, true, "CREATE ACCOUNT & SUBMIT");
    const { error } = await sb.auth.updateUser(
      { email: em, password: pw },
      { emailRedirectTo: location.origin + location.pathname },
    );
    if (error) {
      busy(btn, false, "CREATE ACCOUNT & SUBMIT");
      return (err.textContent = error.message);
    }
    try {
      await save({ status: "submitted", step: 8, total });
      st.pendingEmail = em;
      go("summary");
    } catch {
      busy(btn, false, "CREATE ACCOUNT & SUBMIT");
    }
  }
  if (id === "info") {
    const v = Object.fromEntries(
      ["first", "middle", "last", "dob", "mobile", "email", "address"].map(
        (k) => [k, $("#" + k).value.trim()],
      ),
    );
    let ok = true;
    const need = (k, m = "Required") => {
      if (!v[k]) {
        flag(k, m);
        ok = false;
      }
    };
    ["first", "last", "dob", "address"].forEach((k) => need(k));
    if (!/^(09|\+639)\d{9}$/.test(v.mobile.replace(/\s/g, ""))) {
      flag("mobile", "Use a PH number, e.g. 09171234567");
      ok = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(v.email)) {
      flag("email", "Enter a valid email");
      ok = false;
    }
    if (!ok) return;
    busy(btn, true, "SAVE & CONTINUE");
    await save({ info: v });
    await advance("osa");
  }
});

enter().catch(() => {
  go("login");
  toast("Cannot reach Supabase. Check js/config.js.");
});
