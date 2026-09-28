/* Автотест полного игрового цикла через jsdom */
const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = fs.readFileSync(__dirname + "/index.html", "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable", url: "http://localhost:8642/" });
const { window } = dom;
window.addEventListener("error", e => { console.error("PAGE ERROR:", e.message); process.exitCode = 1; });

setTimeout(async () => {
  try {
    const w = window, d = w.document;
    const assert = (cond, msg) => { if (!cond) { console.error("FAIL:", msg); process.exit(1); } console.log("ok -", msg); };

    assert(!d.getElementById("menu-screen").classList.contains("hidden"), "главное меню показано");
    d.getElementById("new-game-btn").click();
    assert(!d.getElementById("game-screen").classList.contains("hidden"), "игровой экран открыт");
    assert(d.querySelector("#action-panel h2").textContent.includes("Утро"), "фаза Утро активна");

    // выбор напитка -> зона помола
    d.querySelectorAll("#drink-grid .choice")[0].click(); // эспрессо
    // мини-игра: остановить бегунок в зоне напрямую
    w.eval("clearInterval(grindTimer); grindPos = currentZone().from + 12; document.getElementById('grind-btn').click();");
    d.querySelectorAll("#brew-grid .choice")[1].click(); // Эспрессо-машина (совпадает)
    d.querySelectorAll("#temp-grid .choice")[1].click(); // 92-96
    d.querySelectorAll("#dessert-grid .choice")[1].click(); // черничный капкейк
    d.querySelectorAll("#book-grid .choice")[0].click(); // книга дня
    assert(!d.getElementById("open-btn").disabled, "все утренние шаги сделаны — можно открывать кафе");
    d.getElementById("open-btn").click();

    assert(d.querySelector("#action-panel h2").textContent.includes("День"), "фаза День: гости");
    const q = w.eval("S.prep.quality"); assert(q >= 70, "качество заваривания >= 70 (" + q + ")");

    // обслуживаем всех гостей идеально: подбираем tray по тегам гостя
    for (let i = 0; i < 3; i++) {
      const custId = w.eval(`S.serving.queue[${i}]`);
      w.eval(`
        (function(){
          const cust = CUSTOMERS.find(c=>c.id==='${custId}');
          let best=null,bestScore=-1;
          for (const dr of ownedDrinks()) for (const ds of DESSERTS) for (const bk of shelfBooks()) {
            if (cust.want.hardcover && !bk.hardcover) continue;
            const tags=new Set([...dr.tags,...ds.tags,...bk.tags]);
            const sc=cust.want.tags.filter(t=>tags.has(t)).length;
            if (sc>bestScore){bestScore=sc;best={dr,ds,bk};}
          }
          window.__pick=best;
        })();
      `);
      // кликами выбираем поднос
      const pickClick = (gridSel, nameIncludes) => {
        const c = [...d.querySelectorAll(gridSel + " .choice")].find(x => x.textContent.includes(nameIncludes));
        c.click();
      };
      const drinkName = w.eval("window.__pick.dr.name"), dessertName = w.eval("window.__pick.ds.name"), bookTitle = w.eval("window.__pick.bk.title");
      pickClick("#s-drink", drinkName.slice(0, 6)); pickClick("#s-dessert", dessertName.slice(0, 6)); pickClick("#s-book", bookTitle.slice(0, 8));
      assert(!d.getElementById("serve-btn").disabled, `гость ${i+1}: поднос собран (${drinkName} + ${dessertName} + ${bookTitle})`);
      d.getElementById("serve-btn").click();
      const verdict = d.getElementById("verdict").textContent;
      console.log(`   вердикт: ${verdict.slice(0, 90)}…`);
      const nextBtn = [...d.querySelectorAll("#action-panel button")].find(b => b.textContent.includes("Следующий гость"));
      assert(nextBtn, `гость ${i+1}: вердикт выдан и есть кнопка «следующий гость»`);
      nextBtn.click();
      // setTimeout 350ms внутри игры — ждём синхронно через цикл событий
    }

    // дождаться перехода в вечер (таймауты jsdom реальны)
    {
      try {
        await sleepMs(900);
        assert(d.querySelector("#action-panel h2").textContent.includes("Вечер"), "фаза Вечер наступила");
        const beans = w.eval("S.beans"); assert(beans > 40, "заработаны зёрна: " + beans);
        // магазин: купить стеллаж
        d.getElementById("shop-btn").click();
        const buyBtn = [...d.querySelectorAll(".modal .shop-item button")].find(b => b.textContent.includes("50"));
        buyBtn.click();
        assert(w.eval("S.owned.shelf1") === true, "куплен дубовый стеллаж, уют вырос");
        d.querySelector(".modal .close-row button").click();
        // прогоняем оставшиеся главы быстро через async-проход
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const clickIn = (sel, idxOrTxt) => {
          const nodes = [...d.querySelectorAll(sel + " .choice")];
          const c = typeof idxOrTxt === "number" ? nodes[idxOrTxt] : nodes.find(x => x.textContent.includes(idxOrTxt));
          if (!c) throw new Error("нет элемента " + sel + " / " + idxOrTxt);
          c.click();
        };
        const serveCurrentGuest = () => {
          const g = w.eval("S.serving.index");
          const cid = w.eval(`S.serving.queue[${g}]`);
          w.eval(`
            (function(){
              const cust=CUSTOMERS.find(c=>c.id==='${cid}');
              let best=null,bs=-1;
              for(const dr of ownedDrinks())for(const ds of DESSERTS)for(const bk of shelfBooks()){
                if(cust.want.hardcover&&!bk.hardcover)continue;
                const t=new Set([...dr.tags,...ds.tags,...bk.tags]);
                const sc=cust.want.tags.filter(x=>t.has(x)).length;
                if(sc>bs){bs=sc;best={dr,ds,bk};}
              }
              window.__pick=best;
            })();
          `);
          clickIn("#s-drink", w.eval("__pick.dr.name").slice(0,6));
          clickIn("#s-dessert", w.eval("__pick.ds.name").slice(0,6));
          clickIn("#s-book", w.eval("__pick.bk.title").slice(0,8));
          d.getElementById("serve-btn").click();
          [...d.querySelectorAll("#action-panel button")].find(b => b.textContent.includes("Следующий гость")).click();
        };
        const doMorning = (drinkIdx) => {
          clickIn("#drink-grid", drinkIdx);
          w.eval("clearInterval(grindTimer); grindPos = currentZone().from + 12; document.getElementById('grind-btn').click();");
          clickIn("#brew-grid", 0); clickIn("#temp-grid", 1); clickIn("#dessert-grid", 0);
          d.getElementById("open-btn").click();
        };
        for (let day = 2; day <= 5; day++) {
          d.getElementById("next-day-btn").click();   // утро главы N
          await sleep(30);
          doMorning(2);                                // кофе-воронка
          await sleep(30);
          assert(d.querySelector("#action-panel h2").textContent.includes("День"), "глава " + day + ": фаза День");
          for (let g = 0; g < 3; g++) { serveCurrentGuest(); await sleep(420); }
          assert(d.querySelector("#action-panel h2").textContent.includes("Вечер"), "глава " + day + ": фаза Вечер");
        }
        // финал после вечерней панели 5-й главы
        d.getElementById("next-day-btn").click();
        await sleep(60);
        assert(!d.getElementById("end-screen").classList.contains("hidden"), "показан финальный экран");
        assert(d.getElementById("end-card").textContent.includes("Обслужено гостей"), "итоговая статистика есть");
        console.log("достижений получено:", w.eval("Object.keys(S.achievements).length"));
        console.log("\n=== ALL TESTS PASSED ===");
        process.exit(0);
      } catch (e) { console.error("INNER TEST ERROR:", e); process.exit(1); }
    }
  } catch (e) { console.error("TEST ERROR:", e); process.exit(1); }
}, 1200);

const sleepMs = ms => new Promise(r => setTimeout(r, ms));
