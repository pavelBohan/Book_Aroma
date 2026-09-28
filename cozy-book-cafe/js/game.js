/* ============================================================
   game.js — «Книжный аромат: История одного кафе»
   Упрощённый cozy-симулятор в духе Papa Louie:
   День = 3 фазы (Утро → День → Вечер), 5 глав.
   ============================================================ */

const SAVE_KEY = "book-aroma-save-v1";
const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html !== undefined) n.innerHTML = html; return n; };

/* ---------------- Состояние ---------------- */
function newGame() {
  return {
    day: 1,
    phase: "morning",            // morning | serving | evening
    beans: 40,                   // основная валюта «Зёрна»
    reviews: 0,                  // премиум-валюта «Рецензии»
    comfort: 25,                 // шкала уюта 0..100
    books: { dostoevsky: true, pushkin: true }, // стартовый набор на полках
    drinkUnlocks: {},            // id -> true
    owned: {},                   // предметы магазина
    merch: 0,                    //件 мерча (пассивный доход)
    bookOfDay: "dostoevsky",
    served: 0, perfectStreak: 0, byWho: {},
    achievements: {},
    log: [],
    // внутридневные данные
    prep: null,                  // результат утренней подготовки
    serving: null,               // прогресс обслуживания гостей
  };
}

let S = null;
let grindTimer = null;

/* ---------------- Сохранение ---------------- */
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch(e){} }
function load() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
}

/* ---------------- Хелперы ---------------- */
const findBook = id => BOOKS.find(b => b.id === id);
const findDrink = id => DRINKS.find(d => d.id === id);
const findDessert = id => DESSERTS.find(d => d.id === id);
const ownedDrinks = () => DRINKS.filter(d => !d.locked || S.drinkUnlocks[d.id]);
const shelfBooks = () => BOOKS.filter(b => S.books[b.id]);

function addLog(text, kind = "info") {
  S.log.unshift({ text, kind });
  S.log = S.log.slice(0, 30);
}

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!S.achievements[a.id] && a.check(S)) {
      S.achievements[a.id] = true;
      S.reviews += 1;
      addLog(`🏆 Достижение: «${a.name}» (+1 рецензия)`, "good");
      toast(`🏆 ${a.name}`);
    }
  }
}

function toast(msg) {
  const t = el("div", null, msg);
  t.style.cssText = `position:fixed;top:64px;left:50%;transform:translateX(-50%);
    background:#241610;color:#f3e6c8;border:2px solid #c9a227;border-radius:10px;
    padding:10px 22px;z-index:99;font-size:16px;box-shadow:0 8px 24px rgba(0,0,0,.6);
    font-family:Georgia,serif;transition:opacity .4s;`;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 450); }, 2200);
}

/* ---------------- HUD / сцена ---------------- */
function renderHUD() {
  $("#hud-day").textContent = `Глава ${S.day} из ${DAYS_TOTAL}`;
  $("#hud-beans").textContent = S.beans;
  $("#hud-reviews").textContent = S.reviews;
  $("#unity-fill").style.width = Math.max(0, Math.min(100, S.comfort)) + "%";
  const b = findBook(S.bookOfDay);
  $("#book-of-day").innerHTML = `📖 Книга дня:<br><b>${b.title}</b><br><i>${b.author}</i>`;
  // полки с книгами
  const shelf = $("#shelf-row"); shelf.innerHTML = "";
  shelfBooks().forEach(bk => { const m = el("div", "mini-book"); m.style.background = bk.color; shelf.appendChild(m); });
  // картины на стене = купленные портреты
  const art = $("#wall-art"); art.innerHTML = "";
  SHOP_ITEMS.filter(i => i.cat === "Картины" && S.owned[i.id]).forEach(() => art.appendChild(el("div", "portrait")));
  // реквизит за прилавком
  const counter = $("#counter-props"); counter.innerHTML = "";
  const props = [["lampcup","💡"],["gramophone","🎺"],["armchair","🛋️"],["shelf1","📚"],["blackboard","🧮"],["merch-mug","🥤"]];
  props.forEach(([id, ic]) => { if (S.owned[id]) counter.appendChild(el("span", "prop", ic)); });
  if (!counter.children.length) counter.appendChild(el("span", "prop", "☕"));
}

/* ---------------- Экраны ---------------- */
function show(screenId) {
  ["menu-screen", "game-screen", "end-screen"].forEach(id => $("#" + id).classList.add("hidden"));
  $("#" + screenId).classList.remove("hidden");
}

/* ---------------- ФАЗА 1: УТРО ---------------- */
function startMorning() {
  S.phase = "morning";
  S.prep = { drink: null, dessert: null, brew: null, temp: null, grindScore: null, book: S.bookOfDay };
  renderHUD();
  const p = $("#action-panel");
  p.innerHTML = `
    <h2>☀️ Утро: подготовка</h2>
    <p class="phase-title">Заварите кофе, испеките десерт и выберите книгу дня — она привлечёт «своих» гостей.</p>
    <div class="progress-line"><div class="pstep active">1. Утро</div><div class="pstep">2. День</div><div class="pstep">3. Вечер</div></div>

    <h3 style="margin:8px 0 6px">1) Помол зёрен (мини-игра)</h3>
    <p class="fineprint">Остановите бегунок в зелёной зоне — она задана выбранным напитком.</p>
    <div class="grind-track" id="grind-track">
      <div class="grind-zone" id="grind-zone"></div>
      <div class="grind-needle" id="grind-needle" style="left:0%"></div>
    </div>
    <button class="btn small" id="grind-btn" disabled>Сначала выберите напиток 👇</button>
    <span id="grind-result" style="margin-left:10px;font-style:italic"></span>

    <h3 style="margin:14px 0 6px">2) Напиток</h3>
    <div class="choice-grid" id="drink-grid"></div>

    <h3 style="margin:6px 0">Способ заваривания и температура</h3>
    <div class="choice-grid" id="brew-grid"></div>
    <div class="choice-grid" id="temp-grid"></div>

    <h3 style="margin:10px 0 6px">3) Выпечка</h3>
    <div class="choice-grid" id="dessert-grid"></div>

    <h3 style="margin:10px 0 6px">4) Книга дня (витрина)</h3>
    <div class="choice-grid" id="book-grid"></div>

    <button class="btn primary" id="open-btn" style="width:100%" disabled>Открыть кафе 🚪</button>
  `;

  buildChoiceGrid("#drink-grid", ownedDrinks().map(d => ({ data: d, html: `${d.icon} ${d.name}<span class="tags">${d.tags.join(", ")}</span>` })), (d) => {
    S.prep.drink = d.id; moveGrindZone(d.grind);
    const gb = $("#grind-btn"); if (gb && gb.disabled) { gb.disabled = false; gb.textContent = "Стоп! Смолоть"; }
    refreshOpenBtn();
  });
  buildChoiceGrid("#brew-grid", BREWS.map(b => ({ data: b, html: `⚗️ ${b}` })), (b) => { S.prep.brew = b; refreshOpenBtn(); });
  buildChoiceGrid("#temp-grid", TEMPS.map(t => ({ data: t.t, html: `🌡️ ${t.t}` })), (t) => { S.prep.temp = t; refreshOpenBtn(); });
  buildChoiceGrid("#dessert-grid", DESSERTS.map(d => ({ data: d.id, html: `${d.icon} ${d.name}<span class="tags">${d.tags.join(", ")}</span>` })), (id) => { S.prep.dessert = id; refreshOpenBtn(); });
  buildChoiceGrid("#book-grid", shelfBooks().map(b => ({ data: b.id, html: `<span style="color:${b.color}">▮</span> ${b.title}<span class="tags">${b.tags.join(", ")}</span>` })), (id) => { S.bookOfDay = id; S.prep.book = id; renderHUD(); refreshOpenBtn(); }, S.bookOfDay);

  startGrindMinigame();
  $("#open-btn").onclick = () => { finalizeMorning(); startServing(); };
}

function buildChoiceGrid(sel, items, onPick, preselect) {
  const grid = $(sel); grid.innerHTML = "";
  items.forEach(it => {
    const c = el("div", "choice", it.html);
    if (preselect !== undefined && it.data === preselect) c.classList.add("selected");
    c.onclick = () => { grid.querySelectorAll(".choice").forEach(x => x.classList.remove("selected")); c.classList.add("selected"); onPick(it.data); };
    grid.appendChild(c);
  });
}

/* Мини-игра помола: бегунок туда-сюда, ловим зону */
let grindPos = 0, grindDir = 1;
function startGrindMinigame() {
  stopGrind();
  grindPos = 0; grindDir = 1;
  grindTimer = setInterval(() => {
    grindPos += grindDir * 2.2;
    if (grindPos >= 97) grindDir = -1;
    if (grindPos <= 0) grindDir = 1;
    const n = $("#grind-needle"); if (n) n.style.left = grindPos + "%";
  }, 30);
  $("#grind-btn").onclick = () => {
    const zone = currentZone();
    const inZone = grindPos >= zone.from && grindPos <= zone.to;
    const center = (zone.from + zone.to) / 2;
    const dist = Math.abs(grindPos - center);
    let score = inZone ? Math.round(100 - (dist / ((zone.to - zone.from) / 2)) * 35) : 25;
    S.prep.grindScore = score;
    $("#grind-result").textContent = inZone
      ? `Идеальный помол! Качество: ${score}%`
      : `Помол так себе… Качество: ${score}%`;
    $("#grind-result").style.color = inZone ? "#3f5416" : "#9c3b2e";
    refreshOpenBtn();
  };
}
function currentZone() {
  const g = S.prep?.drink ? findDrink(S.prep.drink).grind : 0.5;
  const from = Math.max(0, Math.min(80, g * 100 - 12));
  return { from, to: from + 24 };
}
function moveGrindZone(g) {
  const z = currentZone();
  const zn = $("#grind-zone");
  if (zn) { zn.style.left = z.from + "%"; zn.style.width = (z.to - z.from) + "%"; }
}
function stopGrind() { if (grindTimer) { clearInterval(grindTimer); grindTimer = null; } }

function refreshOpenBtn() {
  const btn = $("#open-btn"); if (!btn) return;
  const ok = S.prep.drink && S.prep.dessert && S.prep.brew && S.prep.temp && S.prep.grindScore != null && S.prep.book;
  btn.disabled = !ok;
}

function finalizeMorning() {
  const tempMod = TEMPS.find(t => t.t === S.prep.temp).m;
  let quality = S.prep.grindScore + tempMod * 12;
  const brewMatch = S.prep.brew === findDrink(S.prep.drink).brew;
  if (brewMatch) quality += 10; else quality -= 8;
  quality = Math.max(5, Math.min(100, quality));
  S.prep.quality = quality;
  addLog(`Утро главы ${S.day}: помол ${quality}% ${brewMatch ? "(способ выбран верно)" : "(способ не подошёл)"}`, brewMatch ? "good" : "bad");
  save();
}

/* ---------------- ФАЗА 2: ДЕНЬ (обслуживание) ---------------- */
function pickGuestsForDay() {
  // книга дня приманивает «своих» гостей: те, чьи want-теги пересекаются с тегами книги
  const book = findBook(S.bookOfDay);
  const scored = CUSTOMERS.map(c => {
    const overlap = c.want.tags.filter(t => book.tags.includes(t)).length;
    return { c, w: overlap * 2 + Math.random() };
  }).sort((a, b) => b.w - a.w);
  const guests = [];
  for (const { c } of scored) {
    // спец-гость требует свою книгу на полке — иначе вежливо пропускаем
    if (c.unlockBook && !S.books[c.unlockBook]) continue;
    guests.push(c.id);
    if (guests.length >= CUSTOMERS_PER_DAY) break;
  }
  while (guests.length < CUSTOMERS_PER_DAY) guests.push(scored[guests.length % scored.length].c.id);
  return guests;
}

function startServing() {
  stopGrind();
  S.phase = "serving";
  S.serving = { queue: pickGuestsForDay(), index: 0 };
  renderHUD();
  nextGuest();
}

function showCustomerEmoji(cust) {
  const slot = $("#customer-slot");
  slot.classList.remove("gone");
  slot.textContent = cust.emoji;
}

function nextGuest() {
  const sv = S.serving;
  if (sv.index >= sv.queue.length) { endServing(); return; }
  const cust = CUSTOMERS.find(c => c.id === sv.queue[sv.index]);
  showCustomerEmoji(cust);
  const p = $("#action-panel");
  const q = S.prep.quality;
  p.innerHTML = `
    <h2>🌤️ День: гости (${sv.index + 1}/${sv.queue.length})</h2>
    <div class="progress-line"><div class="pstep done">1. Утро</div><div class="pstep active">2. День</div><div class="pstep">3. Вечер</div></div>
    <div class="dialogue-box"><span class="who">${cust.emoji} ${cust.name}</span>«${cust.line}»</div>
    <p class="fineprint">Ваша чаша сегодня: ${findDrink(S.prep.drink).icon} ${findDrink(S.prep.drink).name}, качество заваривания ${q}%. Соберите поднос: напиток + десерт + книга.</p>

    <h3 style="margin:8px 0 6px">Напиток</h3>
    <div class="choice-grid" id="s-drink"></div>
    <h3 style="margin:6px 0">Десерт</h3>
    <div class="choice-grid" id="s-dessert"></div>
    <h3 style="margin:6px 0">Книга с полки</h3>
    <div class="choice-grid" id="s-book"></div>

    <div class="dialogue-box hidden" id="verdict"></div>
    <button class="btn primary" id="serve-btn" style="width:100%" disabled>Подать гостю 🍽️</button>
    <button class="btn small" id="atmos-btn" style="width:100%;margin-top:8px">🕯️ Создать атмосферу (−5 зёрен, уют +4)</button>
  `;

  const sel = { drink: null, dessert: null, book: null };
  const bind = (gridSel, items, key) => {
    const grid = $(gridSel); grid.innerHTML = "";
    items.forEach(it => {
      const c = el("div", "choice", it.html);
      c.onclick = () => { grid.querySelectorAll(".choice").forEach(x => x.classList.remove("selected")); c.classList.add("selected"); sel[key] = it.data; updateServeBtn(); };
      grid.appendChild(c);
    });
  };
  bind("#s-drink", ownedDrinks().map(d => ({ data: d.id, html: `${d.icon} ${d.name}<span class="tags">${d.tags.join(", ")}</span>` })), "drink");
  bind("#s-dessert", DESSERTS.map(d => ({ data: d.id, html: `${d.icon} ${d.name}<span class="tags">${d.tags.join(", ")}</span>` })), "dessert");
  bind("#s-book", shelfBooks().map(b => ({ data: b.id, html: `<span style="color:${b.color}">▮</span> ${b.title}<span class="tags">${b.tags.join(", ")}${b.hardcover ? ", тв. обложка" : ""}</span>` })), "book");

  function updateServeBtn() { $("#serve-btn").disabled = !(sel.drink && sel.dessert && sel.book); }

  $("#atmos-btn").onclick = () => {
    if (S.beans < 5) { toast("Не хватает зёрен!"); return; }
    S.beans -= 5; S.comfort = Math.min(100, S.comfort + 4);
    addLog("Вы приглушили лампы и включили граммофон. Стало уютнее.", "info");
    renderHUD(); save();
  };

  $("#serve-btn").onclick = () => serveTray(cust, sel);
}

function tagSetOf(order) {
  const set = new Set();
  [...findDrink(order.drink).tags, ...findDessert(order.dessert).tags, ...findBook(order.book).tags].forEach(t => set.add(t));
  return set;
}

function serveTray(cust, order) {
  const tags = tagSetOf(order);
  const matched = cust.want.tags.filter(t => tags.has(t)).length;
  const hardOk = !cust.want.hardcover || findBook(order.book).hardcover;
  const q = S.prep.quality;

  let verdict, kind, pay = 0, perfect = false;
  if (matched === cust.want.tags.length && hardOk && q >= 70) {
    perfect = true;
    pay = cust.payBase + cust.tipPerfect + Math.round(q / 10);
    verdict = `${cust.emoji}: «Это именно то, о чём я мечтал(а)!» Гость оставил щедрые чаевые: +${pay} зёрен.`;
    kind = "good";
    S.comfort = Math.min(100, S.comfort + 3);
    S.perfectStreak++;
  } else if (matched >= 1 && hardOk) {
    pay = cust.payBase - 5 + Math.round(q / 15);
    verdict = `${cust.emoji}: «Неплохо… но не совсем то настроение.» Оплата: +${pay} зёрен.`;
    kind = "info";
    S.perfectStreak = 0;
  } else {
    pay = Math.max(4, Math.round(cust.payBase / 3));
    verdict = hardOk ? `${cust.emoji}: «Вы вообще слушали мой заказ?» Гость недоволен. Едва +${pay} зёрен.`
                     : `${cust.emoji}: «Я же просил(а) книгу в ТВЁРДОЙ обложке!» Мягкая книжица разочаровала. +${pay} зёрен.`;
    kind = "bad";
    S.perfectStreak = 0;
    S.comfort = Math.max(0, S.comfort - 3);
  }

  S.beans += pay; S.served++;
  S.byWho[cust.id] = (S.byWho[cust.id] || 0) + 1;
  if (perfect && cust.gift === "bulgakov-portrait" && !S.books.bulgakov) {
    S.books.bulgakov = true;
    verdict += " 🎁 В благодарность писатель подарил кафе редкий том «Мастер и Маргарита»!";
  }
  if (cust.unlockBook && perfect && !S.books[cust.unlockBook]) {
    S.books[cust.unlockBook] = true;
    verdict += ` 📚 Гость посоветовал книгу — она появилась на полке!`;
  }
  if (perfect) S.reviews += 1;

  addLog(verdict, kind);
  checkAchievements(); renderHUD(); save();

  const v = $("#verdict"); v.classList.remove("hidden"); v.innerHTML = verdict;
  $("#serve-btn").disabled = true;
  $("#atmos-btn").disabled = true;
  const nb = el("button", "btn small", "Следующий гость ➡️");
  nb.style.width = "100%"; nb.style.marginTop = "8px";
  nb.onclick = () => {
    $("#customer-slot").classList.add("gone");
    S.serving.index++;
    setTimeout(nextGuest, 350);
  };
  $("#action-panel").appendChild(nb);
}

function endServing() {
  $("#customer-slot").classList.add("gone");
  const passive = S.merch * 1; // зёрна/день за мерч
  if (passive > 0) { S.beans += passive; addLog(`Мерч принёс пассивный доход: +${passive} зёрен.`, "good"); }
  // уют слегка остывает к вечеру
  S.comfort = Math.max(0, S.comfort - 2);
  checkAchievements(); save();
  startEvening();
}

/* ---------------- ФАЗА 3: ВЕЧЕР ---------------- */
function startEvening() {
  S.phase = "evening";
  renderHUD();
  const p = $("#action-panel");
  p.innerHTML = `
    <h2>🌙 Вечер: развитие</h2>
    <div class="progress-line"><div class="pstep done">1. Утро</div><div class="pstep done">2. День</div><div class="pstep active">3. Вечер</div></div>
    <p class="phase-title">Закупите интерьер и книги, запустите мерч, проведите ивент — и открывайте новую главу.</p>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button class="btn" id="shop-btn">🛒 Магазин</button>
      <button class="btn" id="events-btn">🎭 Ивенты</button>
      <button class="btn" id="ach-btn">🏆 Достижения</button>
    </div>
    <h3 style="margin:8px 0 6px">Журнал кафе</h3>
    <div class="log" id="log-box"></div>
    <button class="btn primary" id="next-day-btn" style="width:100%;margin-top:14px">
      ${S.day >= DAYS_TOTAL ? "Финальная глава завершена 🏁" : "Спать и начать Главу " + (S.day + 1) + " 😴"}
    </button>
  `;
  renderLog();
  $("#shop-btn").onclick = openShop;
  $("#events-btn").onclick = openEvents;
  $("#ach-btn").onclick = openAchievements;
  $("#next-day-btn").onclick = () => {
    if (S.day >= DAYS_TOTAL) return finishGame();
    S.day++; save(); startMorning();
  };
}

function renderLog() {
  const box = $("#log-box"); if (!box) return;
  box.innerHTML = "";
  S.log.forEach(l => box.appendChild(el("p", l.kind, l.text)));
}

function modal(title, bodyNodes, onClose) {
  const back = el("div", "modal-backdrop");
  const m = el("div", "modal");
  m.appendChild(el("h2", null, title));
  bodyNodes.forEach(n => m.appendChild(n));
  const row = el("div", "close-row");
  const close = el("button", "btn small", "Закрыть ✖");
  close.onclick = () => { back.remove(); if (onClose) onClose(); };
  row.appendChild(close); m.appendChild(row);
  back.appendChild(m); document.body.appendChild(back);
  return back;
}

function shopRow(item) {
  const ownedFlag = !!S.owned[item.id];
  const row = el("div", "shop-item");
  row.appendChild(el("div", null, `<div class="name">${item.icon} ${item.name}</div><div class="desc">${item.desc}</div>`));
  const btn = el("button", "btn small", ownedFlag ? "✓ Куплено" : `${item.cost} 🫘`);
  btn.disabled = ownedFlag || S.beans < item.cost;
  btn.onclick = () => {
    if (S.beans < item.cost) return;
    S.beans -= item.cost; S.owned[item.id] = true;
    if (item.comfort) S.comfort = Math.min(100, S.comfort + item.comfort);
    if (item.passive) { S.merch += item.passive; }
    if (item.bookId) S.books[item.bookId] = true;
    if (item.drinkId) S.drinkUnlocks[item.drinkId] = true;
    addLog(`Куплено: ${item.name}. ${item.passive ? "Мерч даёт +" + item.passive + " зёрен/день." : ""}`, "good");
    checkAchievements(); renderHUD(); save();
    btn.textContent = "✓ Куплено"; btn.disabled = true;
  };
  row.appendChild(btn);
  return row;
}

function openShop() {
  const cats = ["Интерьер", "Картины", "Мерч", "Книги", "Меню"];
  const nodes = [];
  cats.forEach(cat => {
    nodes.push(el("h3", null, cat));
    SHOP_ITEMS.filter(i => i.cat === cat).forEach(i => nodes.push(shopRow(i)));
  });
  modal("Лавка мастеров 🛒", nodes, renderHUD);
}

function openEvents() {
  const nodes = [];
  EVENTS.forEach(ev => {
    let ok = true, why = "";
    if (ev.needBook && S.bookOfDay !== ev.needBook) { ok = false; why = "нужна книга дня: " + findBook(ev.needBook).title; }
    const row = el("div", "shop-item");
    row.appendChild(el("div", null, `<div class="name">${ev.icon} ${ev.name}</div><div class="desc">${ev.desc}${why ? " ⚠ " + why : ""}</div>`));
    const gainTxt = `+${ev.gain.beans} 🫘 +${ev.gain.comfort} ☘`;
    const btn = el("button", "btn small", `${ev.cost} 🫘 → ${gainTxt}`);
    btn.disabled = !ok || S.beans < ev.cost;
    btn.onclick = () => {
      S.beans -= ev.cost;
      let bonus = ev.gain.beans;
      if (ev.id === "book-club") bonus += Object.keys(S.books).length * 3;
      S.beans += bonus;
      S.comfort = Math.min(100, S.comfort + ev.gain.comfort);
      S.reviews += 1;
      addLog(`Ивент «${ev.name}» прошёл блестяще! Сбор: +${bonus} зёрен, +1 рецензия.`, "good");
      checkAchievements(); renderHUD(); save();
      btn.disabled = true; btn.textContent = "Проведён ✓";
    };
    row.appendChild(btn); nodes.push(row);
  });
  modal("Афиша вечеров 🎭", nodes, renderHUD);
}

function openAchievements() {
  const nodes = [];
  ACHIEVEMENTS.forEach(a => {
    const got = !!S.achievements[a.id];
    const row = el("div", "shop-item");
    row.appendChild(el("div", null, `<div class="name">${got ? "🏆" : "🔒"} ${a.name}</div><div class="desc">${a.desc}</div>`));
    row.appendChild(el("div", null, got ? "<b>получено</b>" : "не получено"));
    nodes.push(row);
  });
  nodes.push(el("p", "fineprint", `Всего рецензий: ${S.reviews}. Обслужено гостей: ${S.served}.`));
  modal("Книга достижений 🏆", nodes);
}

/* ---------------- Финал ---------------- */
function finishGame() {
  stopGrind();
  save();
  const stars = S.reviews >= 8 ? "★★★★★" : S.reviews >= 6 ? "★★★★" : S.reviews >= 4 ? "★★★" : S.reviews >= 2 ? "★★" : "★";
  const achCount = Object.keys(S.achievements).length;
  $("#end-card").innerHTML = `
    <svg viewBox="0 0 100 100" width="110" style="margin:0 auto 8px;display:block">
      <path d="M30 55 h40 v14 a20 20 0 0 1 -40 0 z" fill="#6b4226" stroke="#c9a227" stroke-width="2"/>
      <path d="M70 57 h8 a6 6 0 0 1 0 12 h-6" fill="none" stroke="#c9a227" stroke-width="2.5"/>
      <path d="M40 48 q4 -8 0 -14 M50 48 q4 -10 0 -16 M60 48 q4 -8 0 -14" fill="none" stroke="#ecdcb9" stroke-width="2" opacity=".85"/>
      <path d="M42 30 l8 -5 8 5 -8 5 z" fill="#c9a227"/>
    </svg>
    <h1>Занавес 📖</h1>
    <p class="subtitle">«Книжный аромат» закрылся на ночь в пятый раз… или навсегда?</p>
    <p style="font-size:22px;color:#c9a227;margin:10px 0">${stars}</p>
    <p class="desc">
      Обслужено гостей: <b>${S.served}</b><br>
      Зёрен в кассе: <b>${S.beans}</b> · Рецензий: <b>${S.reviews}</b><br>
      Уют: <b>${Math.round(S.comfort)}%</b> · Книг на полках: <b>${Object.keys(S.books).length}</b><br>
      Достижений: <b>${achCount}/${ACHIEVEMENTS.length}</b>
    </p>
    <p class="desc"><i>${S.reviews >= 6 ? "Город говорит, что это лучшее место для чтения между глотками кофе." : "Кофе варите отлично — а за уютом и книгами ещё придут гости."}</i></p>
    <button class="btn primary" id="restart-btn">Начать новую историю ✨</button>
    <button class="btn" id="to-menu-btn">В главное меню</button>
  `;
  show("end-screen");
  $("#restart-btn").onclick = () => { S = newGame(); save(); startMorning(); show("game-screen"); };
  $("#to-menu-btn").onclick = () => { bootMenu(); };
}

/* ---------------- Меню ---------------- */
function bootMenu() {
  show("menu-screen");
  const hasSave = !!load();
  $("#continue-btn").style.display = hasSave ? "block" : "none";
  $("#new-game-btn").onclick = () => { S = newGame(); save(); startMorning(); show("game-screen"); };
  $("#continue-btn").onclick = () => {
    S = load() || newGame();
    resumePhase();
    show("game-screen");
  };
  $("#howto-btn").onclick = () => modal("Как играть 📜", [
    el("p", null, "<b>Утро.</b> Выберите напиток — он задаст зелёную зону помола. Остановите бегунок в ней, затем задайте способ заваривания (совпадение с рекомендованным даёт бонус), температуру, испеките десерт и поставьте на витрину книгу."),
    el("p", null, "<b>День.</b> Гости описывают настроение словами («горькое, но с надеждой»). Собирайте поднос: напиток + десерт + книга. Теги всех трёх предметов складываются в «Аромат». Совпали все теги + верная обложка + качество ≥70% — идеальный заказ, чаевые и рецензия."),
    el("p", null, "<b>Вечер.</b> Тратьте зёрна на стеллажи, лампы-чашки, портреты классиков, книги и мерч (пассивный доход). Проводите ивенты — они дают уют и рецензии."),
    el("p", null, "Книга дня привлекает «своих» гостей: поэзия манит поэтов, детектив — инспекторов. Пять глав — одна история."),
  ]);
}

function resumePhase() {
  renderHUD();
  if (!S.phase || S.phase === "morning") return startMorning();
  if (S.phase === "serving") { if (!S.prep) return startMorning(); return startServing(); }
  return startEvening();
}

/* ---------------- Запуск ---------------- */
window.addEventListener("DOMContentLoaded", () => { bootMenu(); });
