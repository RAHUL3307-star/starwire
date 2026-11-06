// starwire catalog: loads data.json once, filters and renders on the client. State lives in the URL so views can be shared.
const $ = (s) => document.querySelector(s)
const PAGE = 60
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>'
const num = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])

const data = await fetch("data.json").then((r) => r.json())
const now = Date.parse(data.updated)
const repos = data.repos.map((r) => ({ ...r, hay: `${r.r} ${r.l} ${r.g ?? ""} ${r.t.join(" ")}`.toLowerCase(), age: (now - Date.parse(r.p)) / 864e5 }))

const params = new URLSearchParams(location.search)
const state = {
  f: params.get("f") ?? (params.has("multi") ? "multi" : ""), c: params.get("c") ?? "", q: params.get("q") ?? "",
  sort: params.get("sort") ?? "picked", lang: params.get("lang") ?? "", view: params.get("view") ?? "cards", shown: PAGE,
}
const isNew = (r) => (now - Date.parse(r.f)) / 864e5 <= 7
const VIEWS = [
  { f: "", label: "All repos", test: () => true },
  { f: "trending", label: "Trending", test: (r) => r.h > 0 },
  { f: "new", label: "New this week", test: isNew },
  { f: "multi", label: "Picked more than once", test: (r) => r.k > 1 },
]

// category sidebar with Lucide-style icons, like StarDash's collections list
const I = {
  "": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  "AI agents": '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8V4H8M9 13v2M15 13v2"/>',
  "Agent skills and MCP": '<path d="M19.4 13a2 2 0 1 0 0-3H18V7a1 1 0 0 0-1-1h-3V4.6a2 2 0 1 0-3 0V6H8a1 1 0 0 0-1 1v3h1.4a2 2 0 1 1 0 3H7v4a1 1 0 0 0 1 1h3v-1.4a2 2 0 1 1 3 0V18h3a1 1 0 0 0 1-1v-4z"/>',
  "LLM tooling and local models": '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8zM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>',
  "AI image, video and voice": '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 8l2.5-4.5h13L21 8M8.5 3.5 11 8M14 3.5 16.5 8"/>',
  "Developer tools": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.4-.4-2.4z"/>',
  "Web and frontend": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  "Apps for desktop and mobile": '<rect x="2" y="4" width="14" height="10" rx="1.5"/><path d="M6 18h6M9 14v4"/><rect x="17" y="9" width="5" height="11" rx="1"/>',
  "Self-hosted": '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  "Data and databases": '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  "DevOps and cloud": '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 12 3.5 3.5 0 0 0 6 19z"/>',
  "Security and privacy": '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/>',
  "Games and graphics": '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 11v4M5 13h4M15 12h.01M18 14h.01"/>',
  "Hardware and robotics": '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  "Learning and reference": '<path d="M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2zM22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z"/>',
  "Everyday utilities": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
}
I.trending = '<path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>'
I.new = '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8z"/><path d="M5 19h.01M19 5h.01"/>'
I.multi = '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'
const item = (attr, key, label, count) =>
  `<button type="button" class="cat" data-${attr}="${esc(key)}" aria-current="false"><svg viewBox="0 0 24 24" aria-hidden="true">${I[key] ?? I[""]}</svg><span>${esc(label)}</span><span class="n">${count.toLocaleString("en-US")}</span></button>`
$("#views").innerHTML = "<h2>Browse</h2>" + VIEWS.map((v) => item("f", v.f, v.label, repos.filter(v.test).length)).join("")
$("#cats").innerHTML = "<h2>Categories</h2>" + [...data.categories].sort((a, b) => b.count - a.count).map((c) => item("c", c.name, c.name, c.count)).join("")

const langs = Object.entries(repos.reduce((a, r) => (r.g && (a[r.g] = (a[r.g] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1])
$("#lang").innerHTML += langs.map(([l, n]) => `<option value="${esc(l)}">${esc(l)} (${n})</option>`).join("")

const fresh = (d) => (d < 30 ? ["var(--green)", d < 1 ? "updated today" : `updated ${Math.round(d)}d ago`] : d < 365 ? ["var(--amber)", `updated ${Math.round(d / 30)}mo ago`] : ["var(--muted)", `quiet ${Math.round(d / 365)}y`])

function card(r) {
  const [owner, name] = r.r.split("/")
  const [fc, ft] = fresh(r.age)
    return `<a class="repo" href="https://github.com/${esc(r.r)}" target="_blank" rel="noopener">
  <div class="head"><img src="https://github.com/${esc(owner)}.png?size=56" alt="" loading="lazy" width="28" height="28"><div class="name"><strong>${esc(name)}</strong><span>${esc(owner)}</span></div></div>
  <p class="line">${esc(r.l)}</p>
  ${r.t.length ? `<div class="topics">${r.t.slice(0, 3).map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
  <div class="meta"><span class="stars">${STAR}${num(r.s)}</span>${r.g ? `<span class="dot" style="--c:${esc(r.gc ?? "")}">${esc(r.g)}</span>` : ""}${r.h > 0 ? `<span class="rise">+${num(r.w)} a week</span>` : ""}<span class="fresh" style="--f:${fc}">${ft}</span>${r.k > 1 ? `<span class="pill picked">picked ${r.k}×</span>` : ""}${isNew(r) ? '<span class="pill new">new</span>' : ""}</div>
</a>`
}

const promo = `<a class="promo" href="https://github.com/boffti/stardash" target="_blank" rel="noopener">
  <div><small>From the maker of starwire</small><strong>Keep the ones you star organized</strong><p>StarDash sorts your GitHub stars into collections, tags them with AI and tells you when tools you use ship breaking changes. Free, open source and self-hosted.</p></div>
  <span>Try StarDash for free</span>
</a>`

const sorters = {
  trending: (a, b) => b.h - a.h,
  picked: (a, b) => b.k - a.k || b.s - a.s,
  stars: (a, b) => b.s - a.s,
  new: (a, b) => b.f.localeCompare(a.f) || b.s - a.s,
  active: (a, b) => a.age - b.age,
}

// StarDash card: a random row (4th to 8th) and a random column, picked once per visit so it stays put while filtering
const PROMO_ROW = 3 + Math.floor(Math.random() * 5), PROMO_COL = Math.random()

function render() {
  const words = state.q.toLowerCase().split(/\s+/).filter(Boolean)
  const view = VIEWS.find((v) => v.f === state.f) ?? VIEWS[0]
  const list = repos
    .filter((r) => view.test(r) && (!state.c || r.c === state.c) && (!state.lang || r.g === state.lang) && words.every((w) => r.hay.includes(w)))
    .sort(sorters[state.sort] ?? sorters.picked)
  const page = list.slice(0, state.shown).map(card)
  const el = $("#results")
  el.className = state.view === "list" ? "list" : "cards"
  const cols = getComputedStyle(el).gridTemplateColumns.split(" ").length
  const spot = PROMO_ROW * cols + Math.floor(PROMO_COL * cols)
  if (state.view === "cards" && page.length > spot && !state.q) page.splice(spot, 0, promo)
  el.innerHTML = page.length ? page.join("") : `<div class="empty">No repos match that yet. Try fewer words or another category.<br><button type="button" id="reset">Clear filters</button></div>`
  $("#title").textContent = state.c || view.label
  const parts = [`${list.length.toLocaleString("en-US")} ${list.length === 1 ? "repo" : "repos"}`]
  if (state.c && state.f) parts.push(view.label.toLowerCase())
  if (state.lang) parts.push(`in ${state.lang}`)
  if (!state.c && !state.f && !state.lang && !state.q) parts.push(`updated ${new Date(now).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`)
  $("#sub").textContent = parts.join(", ")
  $("#more").hidden = list.length <= state.shown
  $("#more").textContent = `Show more (${(list.length - state.shown).toLocaleString("en-US")} left)`
  document.querySelectorAll("[data-f]").forEach((n) => n.setAttribute("aria-current", String(!state.c && n.dataset.f === state.f)))
  document.querySelectorAll("[data-c]").forEach((n) => n.setAttribute("aria-current", String(n.dataset.c === state.c)))
  document.querySelectorAll(".view button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === state.view)))
  $("#reset")?.addEventListener("click", () => set({ f: "", c: "", q: "", lang: "" }, true))
  const p = new URLSearchParams()
  for (const k of ["f", "c", "q", "lang"]) if (state[k]) p.set(k, state[k])
  if (state.sort !== "picked") p.set("sort", state.sort)
  if (state.view !== "cards") p.set("view", state.view)
  history.replaceState(null, "", `${location.pathname}${p.size ? `?${p}` : ""}`)
}

function set(patch, syncInputs) {
  Object.assign(state, patch, "shown" in patch ? {} : { shown: PAGE })
  if (syncInputs) { $("#q").value = state.q; $("#lang").value = state.lang; $("#sort").value = state.sort }
  render()
}

const closeMenu = () => $("#app").classList.remove("open")
$("#q").value = state.q
$("#sort").value = state.sort
$("#lang").value = state.lang
let t
$("#q").addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(() => set({ q: e.target.value.trim() }), 120) })
$("#sort").addEventListener("change", (e) => set({ sort: e.target.value }))
$("#lang").addEventListener("change", (e) => set({ lang: e.target.value }))
$("#sidebar").addEventListener("click", (e) => {
  const n = e.target.closest(".cat")
  if (!n) return
  // views and categories are one choice: picking either clears the other, and clicking the selected category again goes back to all repos
  const f = "f" in n.dataset ? n.dataset.f : ""
  const sort = f === "trending" ? "trending" : state.sort === "trending" ? "picked" : state.sort
  set("f" in n.dataset ? { f, c: "", sort } : { c: n.dataset.c === state.c ? "" : n.dataset.c, f: "", sort }, true)
  scrollTo({ top: 0 })
  closeMenu()
})
$("#menu").addEventListener("click", () => $("#app").classList.add("open"))
$("#scrim").addEventListener("click", closeMenu)
document.querySelector(".view").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set({ view: b.dataset.view, shown: state.shown }) })
$("#more").addEventListener("click", () => set({ shown: state.shown + PAGE }))
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu()
  if (e.key === "/" && document.activeElement !== $("#q")) { e.preventDefault(); $("#q").focus() }
})
$("#theme").addEventListener("click", () => {
  const dark = getComputedStyle(document.documentElement).colorScheme.includes("dark")
  document.documentElement.dataset.theme = dark ? "light" : "dark"
  try { localStorage.setItem("starwire-theme", document.documentElement.dataset.theme) } catch {}
})
render()
