import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.querySelector("#app");
const $ = (s) => document.querySelector(s);
const SEAL = "assets/seal.jpeg";
// Source: CHMSU "1st Semester AY 2026-2027 Enrollment Schedule for Undergraduate Programs"
const TERM = "1st Semester, AY 2026-2027",
  FEE = "PHP 125.00";

const OTHER =
  "your campus enrollment area (check your campus announcements for the venue)";
const CAMPUSES = [
  {
    name: "Talisay (Main) Campus",
    short: "Talisay",
    place: "Talisay City",
    period: "July 6 - August 7, 2026",
    venue: "the One-Stop-Shop, Function Hall, 3rd Floor, ETG Building",
    programs: [
      ["BS Information Systems", "College of Computer Studies"],
      [
        "BS Hospitality Management",
        "College of Business Management and Accountancy",
      ],
      ["BS Entrepreneurship", ""],
      ["Bachelor of Elementary Education", "College of Education"],
      ["Bachelor of Early Childhood Education", "College of Education"],
      ["BA English Language", "College of Arts and Sciences"],
      ["BA Social Science", "College of Arts and Sciences"],
      ["Bachelor of Public Administration", "College of Arts and Sciences"],
      ["BS Applied Mathematics", "College of Arts and Sciences"],
      ["BS Psychology", "College of Arts and Sciences"],
      ["BS Civil Engineering", "College of Engineering"],
    ],
  },
  {
    name: "Alijis Campus",
    short: "Alijis",
    place: "Bacolod City",
    period: "July 6 - 23, 2026",
    venue: OTHER,
    programs: [
      ["BS Information Systems", "College of Computer Studies"],
      ["BS Information Technology", "College of Computer Studies"],
      ["BS Computer Engineering", "College of Engineering"],
      ["BS Electronics Engineering", "College of Engineering"],
      [
        "Bachelor of Technical Vocational Teacher Education",
        "College of Education",
      ],
      ["BS Industrial Technology", "College of Industrial Technology"],
    ],
  },
  {
    name: "Binalbagan Campus",
    short: "Binalbagan",
    place: "Binalbagan, Negros Occidental",
    period: "July 6 - August 7, 2026",
    venue: OTHER,
    programs: [
      ["BS Information Technology", "College of Computer Studies"],
      ["Bachelor of Elementary Education", "College of Education"],
      [
        "BS Business Administration, Financial Management",
        "College of Business Management and Accountancy",
      ],
    ],
  },
  {
    name: "Fortune Towne Campus",
    short: "Fortune Towne",
    place: "Bacolod City",
    period: "July 6 - August 7, 2026",
    venue: OTHER,
    programs: [
      ["BS Information Systems", "College of Computer Studies"],
      [
        "BS Business Administration, Financial Management",
        "College of Business Management and Accountancy",
      ],
    ],
  },
];
const cp = () => {
  const x = (st.enr?.campus || st.profile?.campus || "").toLowerCase();
  return CAMPUSES.find((c) => x.includes(c.short.toLowerCase())) || CAMPUSES[0];
};
const FLOW = {
  new: ["campus", "type", "info", "reg", "gui", "med", "review"],
  continuing: ["reg", "med", "review"],
};
const LABEL = {
  campus: "Campus",
  type: "Admission",
  info: "Info",
  reg: "Registrar",
  gui: "Guidance",
  med: "Medical",
  review: "Review",
};
const TYPES = {
  freshman: "Incoming First-Year",
  transferee: "Transferee",
  continuing: "Continuing Student",
};
const OFFICE = {
  reg: "Registrar's Office",
  gui: "Guidance Services",
  med: "Medical Services",
};

const st = {
  screen: "boot",
  user: null,
  profile: null,
  enr: null,
  docs: [],
  anon: false,
  pending: "",
};
const flow = () => (st.enr?.type === "continuing" ? FLOW.continuing : FLOW.new);
const groups = () => flow().filter((k) => OFFICE[k]);
const has = (k) => st.docs.some((d) => d.kind === k);

/* what each office asks for (CHMSU AY 2026-2027 requirements) */
function items(g) {
  const i = st.enr.info || {},
    c = st.enr.type === "continuing",
    t = st.enr.type === "transferee";
  const ls = i.irregular
    ? [["ls", "Loading Slip", "From your Program Chair (irregular students)"]]
    : [];
  return {
    reg: c
      ? [
          [
            "clr",
            "Accomplished Clearance Form",
            "Clearance form is issued at the Registrar's Office",
          ],
          ["sid", "Student ID or last term's Enrollment Form", "Photo or scan"],
          ...ls,
        ]
      : [
          [
            "rc",
            t
              ? "Transfer Credential and Transcript of Records"
              : "Report Card (SHS) or Certificate of Rating (ALS)",
            t ? "Photocopy of TOR" : "Original to be submitted",
          ],
          [
            "gm",
            "Certificate of Good Moral Character",
            "Original to be submitted",
          ],
          ["bc", "PSA/NSO Birth Certificate", "Two photocopies required"],
          ...(i.married
            ? [
                [
                  "mc",
                  "PSA/NSO Marriage Certificate",
                  "Two photocopies, married female applicants",
                ],
              ]
            : []),
          ["p2", "2x2 ID Picture", "Name written at the back"],
          ...ls,
        ],
    gui: [
      ["g2", "2x2 ID Picture", "One copy for Guidance"],
      ["sii", "Student Individual Inventory (SII)", "Filled-out form"],
    ],
    med: [
      ["xr", "Chest X-Ray Result", "Taken within the last 6 months"],
      ["mcert", "Medical Certificate", "Signed by a licensed physician"],
      ...(c ? [] : [["p1", "1x1 ID Picture", "Recent photo"]]),
    ],
  }[g];
}
const missing = () =>
  groups().flatMap((g) =>
    items(g)
      .filter((x) => !has(x[0]))
      .map((x) => x[1]),
  );
const bring = () =>
  st.enr.type === "continuing"
    ? [`${FEE} insurance fee`, "Original documents listed above"]
    : [
        "One long brown envelope",
        "One long cream/white folder",
        ...(cp().short === "Binalbagan"
          ? ["One long plastic folder (Binalbagan Campus only)"]
          : []),
        `${FEE} insurance fee`,
        "Medical Health Form (issued at the Medical Clinic)",
        "Your own photocopies of the first three Registrar documents",
      ];

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
  const { data, error } = await sb
    .from("enrollments")
    .insert({
      reference,
      term: TERM,
      campus: st.anon ? null : cp().name,
      type: st.anon ? "freshman" : "continuing",
      program: st.anon ? null : st.profile?.program,
    })
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
const saveInfo = (p) => save({ info: { ...(st.enr.info || {}), ...p } });
async function advance(to) {
  await save({ step: Math.max(st.enr.step, flow().indexOf(to)) });
  go(to);
}

/* ---------- ui helpers ---------- */
const I = {
  back: "m15 18-6-6 6-6",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  check: "m5 12 4 4L19 6",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M8 13h8M8 17h6",
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
function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 3500);
}
function busy(b, on, label) {
  if (!b) return;
  b.disabled = on;
  if (label) b.textContent = on ? "Please wait..." : label;
}
const top = (t, back) =>
  `<header class="top">${back ? `<button class="back" data-go="${back}" aria-label="Go back">${ic("back")}</button>` : ""}<h1>${t}</h1></header>`;
const stepper = (n) =>
  `<nav class="steps" aria-label="Progress">${flow()
    .map(
      (k, i) =>
        `<div class="step ${i < n ? "done" : i === n ? "on" : ""}"><i>${i < n ? ic("check") : i + 1}</i>${LABEL[k]}</div>`,
    )
    .join("")}</nav>`;
const field = (id, label, type = "text", ph = "", val = "") =>
  `<label class="field" id="f-${id}"><span>${label}</span><input id="${id}" type="${type}" placeholder="${ph}" value="${esc(val)}" /></label>`;
const chk = (id, label, on, act = "") =>
  `<label class="chk"><input type="checkbox" id="${id}" ${act ? `data-act="${act}"` : ""} ${on ? "checked" : ""} />${label}</label>`;
function flag(id, msg) {
  const f = $("#f-" + id);
  if (!f) return;
  f.classList.add("bad");
  f.querySelector("small")?.remove();
  f.insertAdjacentHTML("beforeend", `<small>${msg}</small>`);
}
const clear = () =>
  document.querySelectorAll(".field.bad").forEach((f) => {
    f.classList.remove("bad");
    f.querySelector("small")?.remove();
  });
const who = () =>
  st.enr?.info?.first
    ? `${st.enr.info.first} ${st.enr.info.last}`
    : st.profile?.full_name || "Student";
const head = (g) => {
  const n = flow().indexOf(g);
  return `${top(LABEL[g] === "Admission" ? "Admission Details" : LABEL[g], n ? flow()[n - 1] : st.anon ? "welcome" : "dashboard")}${stepper(n)}`;
};
const summaryCard = () =>
  `<div class="card kv"><div><span>Applicant</span><strong>${esc(who())}</strong></div><div><span>Type</span><strong>${TYPES[st.enr.type]}</strong></div><div><span>Program</span><strong>${esc(st.enr.program || "-")}</strong></div><div><span>Campus</span><strong>${esc(cp().name)}</strong></div><div><span>Term</span><strong>${TERM}</strong></div></div>`;
const bullets = (a) =>
  `<ul style="margin:8px 0 0;padding-left:18px">${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
const officeStatus = (g) =>
  items(g).every(
    (x) => st.docs.find((d) => d.kind === x[0])?.status === "verified",
  )
    ? ["ok", "Verified"]
    : ["", "For verification"];

function docRow(k, label, hint) {
  const d = st.docs.find((x) => x.kind === k);
  return `<div class="doc"><span class="ic">${ic("file")}</span><div><strong>${label}</strong><small>${d ? "Uploaded, awaiting verification" : hint}</small></div>${d ? `<span class="tag ${d.status === "verified" ? "ok" : ""}">${ic("check")}${d.status === "verified" ? "Verified" : "Uploaded"}</span>` : ""}<label class="up tag" style="${d ? "background:none;border:1px solid var(--line);color:var(--muted)" : ""}">${d ? "Replace" : "Upload"}<input type="file" accept=".pdf,.jpg,.jpeg,.png" data-act="file" data-kind="${k}" data-label="${esc(label)}" /></label></div>`;
}
function docScreen(g) {
  const fl = flow(),
    n = fl.indexOf(g),
    list = items(g),
    c = st.enr.type === "continuing";
  const extra =
    g === "reg"
      ? [`${FEE} insurance fee is paid on your enrollment day`]
      : g === "med"
        ? [
            c ? "" : "Get the Medical Health Form at the Medical Clinic",
            "Diagnosed with PTB? Present a certificate of treatment completion (TB-DOTS or your pulmonologist)",
          ].filter(Boolean)
        : [];
  return `${head(g)}<main class="wrap"><h2>${OFFICE[g]}</h2><p class="muted">Upload a clear photo or scan (PDF, JPG or PNG, up to 5 MB). This pre-checks your documents. You still bring the originals on your schedule.</p>
  ${c && g === "reg" ? chk("irr", "I am an irregular student", st.enr.info?.irregular, "irr") : ""}<div class="list">${list.map((x) => docRow(...x)).join("")}</div>
  ${extra.length ? `<div class="notice"><strong>Good to know</strong>${bullets(extra)}</div>` : ""}<button class="btn" data-act="next" data-to="${fl[n + 1]}" ${list.every((x) => has(x[0])) ? "" : "disabled"}>CONTINUE</button></main>`;
}

/* ---------- screens ---------- */
const S = {
  boot: () => `<div class="load">Loading...</div>`,
  login:
    () => `<main class="auth"><section class="brand"><img class="seal" src="${SEAL}" alt="CHMSU seal" /><h1>CARLOS HILADO MEMORIAL<br>STATE UNIVERSITY</h1><p>Talisay &middot; Alijis &middot; Binalbagan &middot; Fortune Towne</p><p>Online Enrollment</p></section>
    <section class="auth-body"><form class="card" id="login" novalidate><h2>Welcome back</h2><p class="muted">Continuing students: log in with your Student ID or email.</p>
      ${field("who", "Student ID or Email", "text", "e.g. 2023-0045")}
      <label class="field"><span>Password</span><span class="pw"><input id="pw" type="password" placeholder="Enter your password" autocomplete="current-password" /><button type="button" data-act="eye" aria-label="Show password">${ic("eye")}</button></span></label>
      <p class="err" id="err" role="alert"></p><button class="btn" type="submit">LOG IN</button><p class="center" style="margin-top:14px"><button type="button" class="link" data-go="forgot">Forgot password?</button></p></form>
      <div class="divider"><span>or</span></div>
      <div class="promo"><h3>Qualified for admission?</h3><p>Incoming first-year students and transferees can start their enrollment here. No student account is needed yet.</p><button class="btn orange" data-act="freshman">ENROLL AS FIRST-YEAR / TRANSFEREE</button></div>
      <p class="muted center" style="margin-top:22px;font-size:11px">&copy; 2026 CHMSU Student Information System</p></section></main>`,
  forgot: () =>
    `${top("Forgot Password", "login")}<main class="wrap"><form class="card" id="forgot" novalidate><h2>Reset password</h2><p class="muted lead">Enter your registered email and we will send a reset link.</p>${field("mail", "Email Address", "email", "yourname@email.com")}<p class="err" id="err"></p><button class="btn" type="submit">SEND RESET LINK</button></form></main>`,

  dashboard: () => {
    const p = st.profile || {},
      e = st.enr;
    const label = !e
      ? "START ENROLLMENT"
      : e.status === "draft"
        ? "CONTINUE ENROLLMENT"
        : "VIEW ENROLLMENT";
    return `<section class="hero"><div class="hero-in"><div class="bar"><div><img src="${SEAL}" alt="" />CHMSU SIS</div><button data-act="logout">Log out</button></div><p>Good day,</p><h1>${esc(p.full_name)}</h1><p>${esc(p.student_no || "")} ${p.program ? "&middot; " + esc(p.program) : ""}</p></div></section>
    <main class="wrap wide" style="margin-top:-20px"><div class="card term"><div><span>CURRENT TERM</span><strong>${TERM}</strong></div><span class="tag ok">${cp().short}</span></div>
      <h2 class="sec">Enrollment</h2><div class="card"><h3>Continuing student enrollment</h3><p class="muted" style="margin:4px 0 14px">${e ? `Reference ${esc(e.reference)} &middot; Status: <b>${esc(e.status)}</b>` : "Upload your clearance and medical requirements, then visit the One-Stop-Shop on your assigned schedule."}</p><button class="btn sm" data-act="resume">${label}</button></div>
      <div class="notice" style="margin-top:14px"><strong>Enrollment period: ${cp().period}</strong>Visit only on your assigned schedule at ${cp().venue}.</div>
      <h2 class="sec">Student record</h2><div class="grid">${[
        ["Year Level", p.year_level || "-"],
        ["Campus", cp().short],
        ["Standing", p.standing || "-"],
        ["Program", p.program || "-"],
      ]
        .map(
          ([a, b]) =>
            `<div class="card"><span>${a}</span><strong>${esc(b)}</strong></div>`,
        )
        .join("")}</div></main>`;
  },

  welcome:
    () => `${top("First-Year & Transferee", "login")}<main class="wrap center"><img class="seal" style="box-shadow:0 0 0 3px var(--line)" src="${SEAL}" alt="" /><p class="eyebrow">WELCOME TO CHMSU</p><h2>Enrollment for qualified applicants</h2><p class="muted lead">Your progress saves automatically, so you can leave and come back.</p>
    <div class="card kv" style="text-align:left;margin-bottom:20px">${["Choose your campus, applicant type and program", "Fill out your Student Information Sheet", "Upload Registrar, Guidance and Medical requirements", "Visit the One-Stop-Shop on your assigned schedule"].map((t, i) => `<div><span class="num o">${i + 1}</span><strong style="flex:1;text-align:left;margin-left:12px">${t}</strong></div>`).join("")}</div>
    <div class="notice" style="text-align:left"><strong>Not admitted yet?</strong>Enrollment follows CHMSU admission (portal registration, test, screening and interview). This system does not replace it.</div><button class="btn" data-act="resume">${st.enr ? "CONTINUE ENROLLMENT" : "GET STARTED"}</button></main>`,

  campus: () =>
    `${head("campus")}<main class="wrap"><h2>Choose your campus</h2><p class="muted">Pick the campus where you qualified for admission.</p><div class="list">${CAMPUSES.map((c, i) => `<button class="pick ${st.enr.campus === c.name ? "sel" : ""}" data-act="campus" data-i="${i}"><span class="num">${String(i + 1).padStart(2, "0")}</span><span><strong>${c.name}</strong><small>${c.place} &middot; Enrollment ${c.period}</small></span>${ic("check")}</button>`).join("")}</div><button class="btn" data-act="next" data-to="type" ${st.enr.campus ? "" : "disabled"}>CONTINUE</button></main>`,

  type: () => {
    const e = st.enr;
    return `${head("type")}<main class="wrap"><h2>Admission details</h2><p class="muted">Enrollment is open only to applicants who qualified through CHMSU admission screening.</p>
    <h3 style="margin-top:20px">I am an</h3><div class="list" style="margin:10px 0">${[
      [
        "freshman",
        "Incoming First-Year",
        "Senior High School graduate or ALS completer",
      ],
      ["transferee", "Transferee", "Coming from another school"],
    ]
      .map(
        ([v, a, b]) =>
          `<button class="pick ${e.type === v ? "sel" : ""}" data-act="ptype" data-v="${v}"><span><strong>${a}</strong><small>${b}</small></span>${ic("check")}</button>`,
      )
      .join("")}</div>
    <h3 style="margin-top:20px">Program you qualified for at ${esc(cp().short)}</h3><input class="search" placeholder="Search programs" aria-label="Search programs" /><div class="list" style="margin:10px 0">${cp()
      .programs.map(
        ([n, c], i) =>
          `<button class="pick ${e.program === n ? "sel" : ""}" data-act="program" data-i="${i}"><span><strong>${n}</strong>${c ? `<small>${c}</small>` : ""}</span>${ic("check")}</button>`,
      )
      .join("")}</div>
    ${chk("qual", "I am on the official list of qualified applicants for this program", e.info?.qualified, "qual")}<button class="btn" data-act="next" data-to="info" ${e.program && e.info?.qualified ? "" : "disabled"}>CONTINUE</button></main>`;
  },

  info: () => {
    const v = st.enr.info || {},
      fr = st.enr.type === "freshman";
    return `${head("info")}<main class="wrap"><h2>Student Information Sheet</h2><p class="muted lead">Use your legal name exactly as it appears on your records.</p><form class="card" id="info" novalidate>
    <div class="row">${field("first", "First Name", "text", "", v.first)}${field("middle", "Middle Name", "text", "", v.middle)}</div>${field("last", "Last Name", "text", "", v.last)}
    ${field("lrn", "Learner's Reference Number (LRN)", "text", fr ? "12 digits" : "12 digits, or N/A", v.lrn)}
    <div class="row">${field("dob", "Date of Birth", "date", "", v.dob)}${field("mobile", "Mobile Number", "tel", "09XX XXX XXXX", v.mobile)}</div>${field("email", "Email Address", "email", "name@email.com", v.email)}${field("address", "Home Address", "text", "Complete address", v.address)}
    ${chk("married", "I am a married female applicant", v.married)}${chk("irregular", "I am an irregular student (I need a loading slip)", v.irregular)}
    <button class="btn" type="submit" style="margin-top:8px">SAVE &amp; CONTINUE</button></form></main>`;
  },

  reg: () => docScreen("reg"),
  gui: () => docScreen("gui"),
  med: () => docScreen("med"),

  review: () => {
    const miss = missing(),
      n = flow().indexOf("review");
    return `${head("review")}<main class="wrap"><h2>Review and submit</h2><p class="muted lead">Check your details. Submitting sends your pre-enrollment to the offices for verification.</p>${summaryCard()}
    ${miss.length ? `<div class="notice"><strong>Still needed</strong>${bullets(miss)}</div>` : `<div class="notice" style="border-color:var(--green);background:var(--green-light);color:var(--green-dark)"><strong>All requirements uploaded</strong>You are ready to submit.</div>`}
    <div class="card" style="margin-bottom:16px"><h3>Bring on your enrollment day</h3>${bullets(bring())}</div>
    ${
      st.anon
        ? `<form class="card" id="acct" novalidate><h3>Save your enrollment</h3><p class="muted">Create your account so you can log in later and track your status. We will email you a link to confirm your address.</p>${field("aemail", "Email Address", "email", "name@email.com", st.enr.info?.email || "")}${field("apw", "Password (8+ characters)", "password")}${field("apw2", "Confirm Password", "password")}<p class="err" id="err" role="alert"></p><button class="btn" type="submit" ${miss.length ? "disabled" : ""}>CREATE ACCOUNT &amp; SUBMIT</button></form>`
        : `<button class="btn" data-act="submit" ${miss.length ? "disabled" : ""}>SUBMIT ENROLLMENT</button>`
    }</main>`;
  },

  summary:
    () => `${top("Pre-Enrollment Submitted")}<main class="wrap"><div class="ok-mark">${ic("check")}</div><p class="eyebrow center">SUBMITTED FOR VERIFICATION</p><h2 class="center">Your pre-enrollment is in</h2><p class="muted center">You are not enrolled yet. Complete the in-person steps below.</p>
    ${st.pending ? `<div class="notice"><strong>Confirm your email</strong>We sent a link to ${esc(st.pending)}. Open it to activate your account, then log in with that email and your password.</div>` : ""}
    <div class="ref"><span>ENROLLMENT REFERENCE</span><strong>${esc(st.enr.reference)}</strong></div>${summaryCard()}
    <h2 class="sec">Office verification</h2><div class="card kv">${groups()
      .map((g) => {
        const [c, t] = officeStatus(g);
        return `<div><span>${OFFICE[g]}</span><span class="tag ${c}">${t}</span></div>`;
      })
      .join("")}</div>
    <h2 class="sec">Next: visit the university</h2><div class="card"><p><strong>${cp().venue}</strong></p><p class="muted" style="margin:4px 0 10px">Enrollment period: ${cp().period}. Come only on your assigned schedule. The Registrar releases your Enrollment Form there.</p>${bullets(bring())}</div>
    <button class="btn" style="margin-top:18px" data-go="slip">VIEW PRE-ENROLLMENT SLIP</button><button class="btn ghost" ${st.anon ? 'data-act="logout"' : 'data-go="dashboard"'}>${st.anon ? "FINISH" : "GO TO DASHBOARD"}</button></main>`,

  slip: () => `${top("Pre-Enrollment Slip", "summary")}<main class="wrap wide"><article class="com"><div class="com-h"><img class="seal" src="${SEAL}" alt="" /><div><span>REPUBLIC OF THE PHILIPPINES</span><h2>CARLOS HILADO MEMORIAL STATE UNIVERSITY</h2><span>${esc(cp().name)}</span></div></div>
    <div class="com-t"><strong>PRE-ENROLLMENT SLIP</strong><span class="muted">${TERM}</span></div>
    <div class="meta"><div><span>Applicant</span><strong>${esc(who())}</strong></div><div><span>Type</span><strong>${TYPES[st.enr.type]}</strong></div><div><span>Program</span><strong>${esc(st.enr.program || "-")}</strong></div><div><span>Reference</span><strong>${esc(st.enr.reference)}</strong></div></div>
    <table><thead><tr><th>Office</th><th>Status</th></tr></thead><tbody>${groups()
      .map(
        (g) => `<tr><td>${OFFICE[g]}</td><td>${officeStatus(g)[1]}</td></tr>`,
      )
      .join("")}</tbody></table>
    <p style="margin-top:16px"><strong>Bring:</strong></p>${bullets(bring())}<p class="muted" style="margin-top:14px">Present this slip at ${cp().venue} on your assigned schedule.</p>
    <div class="sign"><span>This is not an Enrollment Form. The Enrollment Form is released by</span><strong>Office of the University Registrar</strong><br><span class="stamp">${st.enr.status === "approved" ? "VERIFIED" : "FOR VERIFICATION"}</span></div></article>
    <div class="no-print" style="margin-top:16px"><button class="btn" onclick="print()">PRINT SLIP</button></div></main>`,
};

/* ---------- navigation ---------- */
function go(screen) {
  st.screen = screen;
  app.innerHTML = (S[screen] || S.login)();
  scrollTo(0, 0);
  const n = st.enr ? flow().indexOf(screen) : -1,
    m = app.querySelector("main.wrap");
  if (n >= 0 && m)
    m.insertAdjacentHTML(
      "afterbegin",
      `<p class="eyebrow">STEP ${n + 1} OF ${flow().length}</p>`,
    );
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
  go(
    st.enr.status !== "draft"
      ? "summary"
      : flow()[Math.min(st.enr.step, flow().length - 1)],
  );
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
    st.pending = "";
    go("login");
  }
  if (a === "freshman") {
    busy(t, true);
    if (!st.user) {
      const { data, error } = await sb.auth.signInAnonymously();
      if (error || !data?.user) {
        busy(t, false);
        return toast("Enrollment is unavailable right now.");
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
    const c = CAMPUSES[+t.dataset.i];
    if (c.name !== st.enr.campus)
      await save({ campus: c.name, program: null, college: null });
    go("campus");
  }
  if (a === "ptype") {
    await save({ type: t.dataset.v });
    go("type");
  }
  if (a === "program") {
    const [n, c] = cp().programs[+t.dataset.i];
    await save({ program: n, college: c });
    go("type");
  }
  if (a === "next") {
    t.disabled = true;
    await advance(t.dataset.to);
  }
  if (a === "submit") {
    busy(t, true, "SUBMIT ENROLLMENT");
    try {
      await save({ status: "submitted", step: flow().length });
      go("summary");
    } catch {
      busy(t, false, "SUBMIT ENROLLMENT");
    }
  }
});

app.addEventListener("change", async (ev) => {
  const t = ev.target,
    a = t.dataset?.act;
  if (a === "irr") {
    await saveInfo({ irregular: t.checked });
    return go(st.screen);
  }
  if (a === "qual") {
    await saveInfo({ qualified: t.checked });
    return go("type");
  }
  if (a !== "file") return;
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
    .querySelectorAll('.pick[data-act="program"]')
    .forEach((p) => (p.hidden = !p.textContent.toLowerCase().includes(q)));
});

app.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const id = ev.target.id,
    btn = ev.target.querySelector("[type=submit]");
  clear();
  if (id === "login") {
    let w = $("#who").value.trim();
    const pw = $("#pw").value,
      err = $("#err");
    err.textContent = "";
    if (!w || !pw)
      return (err.textContent = "Enter your Student ID or email and password.");
    busy(btn, true, "LOG IN");
    if (!w.includes("@")) {
      const r = await sb.rpc("email_for_student_id", { sid: w });
      w = r.data || "";
    }
    const { error } = w
      ? await sb.auth.signInWithPassword({ email: w, password: pw })
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
      await save({ status: "submitted", step: flow().length });
      st.pending = em;
      go("summary");
    } catch {
      busy(btn, false, "CREATE ACCOUNT & SUBMIT");
    }
  }
  if (id === "info") {
    const v = Object.fromEntries(
      [
        "first",
        "middle",
        "last",
        "lrn",
        "dob",
        "mobile",
        "email",
        "address",
      ].map((k) => [k, $("#" + k).value.trim()]),
    );
    let ok = true;
    ["first", "last", "dob", "address"].forEach((k) => {
      if (!v[k]) {
        flag(k, "Required");
        ok = false;
      }
    });
    const lrnOk =
      st.enr.type === "freshman"
        ? /^\d{12}$/.test(v.lrn)
        : /^(\d{12}|n\/?a)$/i.test(v.lrn);
    if (!lrnOk) {
      flag(
        "lrn",
        st.enr.type === "freshman" ? "LRN is 12 digits" : "12 digits, or N/A",
      );
      ok = false;
    }
    if (!/^(09|\+639)\d{9}$/.test(v.mobile.replace(/\s/g, ""))) {
      flag("mobile", "Use a PH number, e.g. 09171234567");
      ok = false;
    }
    if (!/^\S+@\S+\.\S+$/.test(v.email)) {
      flag("email", "Enter a valid email");
      ok = false;
    }
    if (!ok) return;
    v.married = $("#married").checked;
    v.irregular = $("#irregular").checked;
    busy(btn, true, "SAVE & CONTINUE");
    await saveInfo(v);
    await advance("reg");
  }
});

enter().catch(() => {
  go("login");
  toast("Cannot reach Supabase. Check js/config.js.");
});
