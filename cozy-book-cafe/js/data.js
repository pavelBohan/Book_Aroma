/* ============================================================
   data.js — все игровые данные «Книжного аромата»
   Теги системы «Ароматов»: Терпкий, Философский, Романтичный,
   Детективный, Бодрящий, Уютный, Мистический, Сладкий
   ============================================================ */

const TAGS = ["Терпкий","Философский","Романтичный","Детективный","Бодрящий","Уютный","Мистический","Сладкий"];

/* ---------- Книги (витрина дня + коллекция) ---------- */
const BOOKS = [
  { id:"dostoevsky", title:"Братья Карамазовы", author:"Ф. М. Достоевский", tags:["Философский","Терпкий"], hardcover:true,  color:"#4c5429", price:0,  genre:"Классика" },
  { id:"pushkin",    title:"Евгений Онегин",     author:"А. С. Пушкин",     tags:["Романтичный","Бодрящий"], hardcover:false, color:"#8a3b2e", price:0,  genre:"Поэзия" },
  { id:"christie",   title:"Убийство в «Восточном экспрессе»", author:"Агата Кристи", tags:["Детективный","Терпкий"], hardcover:true, color:"#2e4a62", price:60, genre:"Детектив", shop:true },
  { id:"bulgakov",   title:"Мастер и Маргарита", author:"М. А. Булгаков",   tags:["Мистический","Философский"], hardcover:true, color:"#1f1a2e", price:90, genre:"Классика", shop:true },
  { id:"bronte",     title:"Грозовой перевал",   author:"Э. Бронте",        tags:["Романтичный","Мистический"], hardcover:true, color:"#5a3a24", price:75, genre:"Классика", shop:true },
  { id:"kafka",      title:"Процесс",            author:"Ф. Кафка",         tags:["Философский","Мистический"], hardcover:false, color:"#3d3d3d", price:80, genre:"Модернизм", shop:true },
  { id:"tolkien",    title:"Хоббит",             author:"Дж. Р. Р. Толкин", tags:["Уютный","Бодрящий"], hardcover:true, color:"#4c6b2f", price:70, genre:"Фэнтези", shop:true },
  { id:"verne",      title:"20 000 лье под водой", author:"Ж. Верн",        tags:["Бодрящий","Детективный"], hardcover:false, color:"#255a66", price:55, genre:"Приключения", shop:true },
];

/* ---------- Напитки ---------- */
const DRINKS = [
  { id:"espresso",   name:"Эспрессо",        icon:"☕", tags:["Терпкий","Бодрящий"],           grind:0.15, brew:"Эспрессо-машина", price:0 },
  { id:"doubleesp",  name:"Двойной эспрессо",icon:"☕☕", tags:["Терпкий","Бодрящий","Философский"], grind:0.12, brew:"Эспрессо-машина", price:120, shop:true, locked:true },
  { id:"filter",     name:"Кофе-воронка",    icon:"🫖", tags:["Философский","Терпкий"],        grind:0.55, brew:"Воронка V60",     price:0 },
  { id:"french",     name:"Френч-пресс",     icon:"🍵", tags:["Уютный","Терпкий"],             grind:0.82, brew:"Френч-пресс",     price:0 },
  { id:"latte",      name:"Латте с корицей", icon:"🥛", tags:["Романтичный","Сладкий","Уютный"], grind:0.40, brew:"Воронка + молоко", price:0 },
  { id:"cocoa",      name:"Горячее какао",   icon:"🍫", tags:["Уютный","Сладкий","Романтичный"], grind:0.30, brew:"Какао-френч",    price:0 },
];

/* ---------- Десерты ---------- */
const DESSERTS = [
  { id:"cupcake-vanilla", name:"Капкейк с ванилью",  icon:"🧁", tags:["Сладкий","Уютный"] },
  { id:"cupcake-blueberry", name:"Капкейк с черникой", icon:"🫐", tags:["Сладкий","Мистический","Терпкий"] },
  { id:"croissant", name:"Круассан",                icon:"🥐", tags:["Уютный","Бодрящий"] },
  { id:"pie", name:"Вишнёвый пирог",                 icon:"🥧", tags:["Романтичный","Сладкий"] },
  { id:"pretzel", name:"Крендель с солью",           icon:"🥨", tags:["Терпкий","Философский"] },
];

/* ---------- Посетители ----------
   request.tags — что гость хочет в паре «напиток+десерт+книга»
   request.hardcover — нужна ли книга в твёрдой обложке
   request.line — реплика при входе
*/
const CUSTOMERS = [
  {
    id:"writer", emoji:"🕵️", name:"Загадочный писатель в шляпе",
    line:"Мне нужно что-то, что поможет мне закончить роман. Что-то горькое, но с надеждой. И обязательно книга в твёрдой обложке.",
    want:{ tags:["Терпкий","Мистический"], hardcover:true },
    payBase:40, tipPerfect:35, gift:"bulgakov-portrait",
  },
  {
    id:"artist", emoji:"🎨", name:"Художник Тео",
    line:"Пишу серию картин о дождливых вечерах. Дайте мне чего-нибудь романтичного и очень уютного!",
    want:{ tags:["Романтичный","Уютный"], hardcover:false },
    payBase:28, tipPerfect:20,
  },
  {
    id:"girl-cat", emoji:"🐈", name:"Загадочная девушка с кошкой",
    line:"Мой кот любит греться у лампы… принесли бы вы что-то мистическое, и чтобы было сладко.",
    want:{ tags:["Мистический","Сладкий"], hardcover:false },
    payBase:30, tipPerfect:22,
  },
  {
    id:"professor", emoji:"🎓", name:"Профессор философии",
    line:"Что-то согревающее, как романы Достоевского. Я пишу лекцию о свободе воли — не спешите.",
    want:{ tags:["Философский","Терпкий"], hardcover:false },
    payBase:32, tipPerfect:24,
  },
  {
    id:"detective", emoji:"🔍", name:"Инспектор Громов",
    line:"Ночь напролёт читал дело. Мне бодрящее и детективное. И книгу соответствующую, раз уж вы книжное кафе.",
    want:{ tags:["Детективный","Бодрящий"], hardcover:false },
    payBase:34, tipPerfect:26, unlockBook:"christie",
  },
  {
    id:"poet", emoji:"✒️", name:"Поэт-богемщик",
    line:"«Бодрящее, как стихи Пушкина!» — вот что мне нужно. И что-нибудь про любовь, конечно.",
    want:{ tags:["Бодрящий","Романтичный"], hardcover:false },
    payBase:26, tipPerfect:18,
  },
  {
    id:"grandma", emoji:"🧶", name:"Бабушка Агафья",
    line:"Внучка сказала, тут вкусно и мягко светят лампы. Мне бы самого уютного и сладкого, дитятко.",
    want:{ tags:["Уютный","Сладкий"], hardcover:false },
    payBase:22, tipPerfect:15,
  },
  {
    id:"traveler", emoji:"🧭", name:"Путешественница Ада",
    line:"Вчера была на глубине двух лье! Нужен кофе, от которого открываются новые миры — бодрящий и терпкий.",
    want:{ tags:["Бодрящий","Терпкий"], hardcover:false },
    payBase:30, tipPerfect:20, unlockBook:"verne",
  },
];

/* ---------- Магазин: интерьер, книги, мерч ---------- */
const SHOP_ITEMS = [
  // Интерьер (растёт Уют)
  { id:"shelf1",   cat:"Интерьер", name:"Дубовый стеллаж",           icon:"📚", cost:50,  comfort:8,  desc:"Тёплое дерево и запах старых корешков." },
  { id:"armchair", cat:"Интерьер", name:"Мягкое кресло-ушастик",     icon:"🛋️", cost:80,  comfort:12, desc:"В нём читают до закрытия." },
  { id:"lampcup",  cat:"Интерьер", name:"Лампа в форме чашки",       icon:"💡", cost:60,  comfort:10, desc:"Фирменный свет «Книжного аромата»." },
  { id:"gramophone",cat:"Интерьер",name:"Грамофон с пластинками",    icon:"🎺", cost:100, comfort:14, desc:"Шопен на весь зал. Уюта +." },
  { id:"portrait-pushkin", cat:"Картины", name:"Портрет Пушкина",   icon:"🖼️", cost:70,  comfort:9,  desc:"«Бодрящее, как стихи…» — теперь буквально." },
  { id:"portrait-dostoevsky", cat:"Картины", name:"Портрет Достоевского", icon:"🖼️", cost:70, comfort:9, desc:"Смотрит так, что платишь чаевые сам." },
  { id:"blackboard", cat:"Интерьер", name:"Меловая стена",           icon:"🧮", cost:45,  comfort:6,  desc:"Можно рисовать мелом меню и котиков." },
  // Мерч (пассивный доход в зернах/день)
  { id:"merch-mug",    cat:"Мерч", name:"Термокружка «Аромат»",      icon:"🥤", cost:60,  passive:6,  desc:"Пассивный доход: 6 зёрен/день." },
  { id:"merch-apron",  cat:"Мерч", name:"Фартук в клетку",           icon:"🧵", cost:50,  passive:5,  desc:"Пассивный доход: 5 зёрен/день." },
  { id:"merch-beans",  cat:"Мерч", name:"Зёрна в брендированной пачке", icon:"🫘", cost:85, passive:9, desc:"Пассивный доход: 9 зёрен/день." },
  // Книги для полок
  { id:"book-christie", cat:"Книги", name:"Книга: Агата Кристи",  icon:"📖", cost:60, bookId:"christie", desc:"Открывает ветку детективных диалогов." },
  { id:"book-bulgakov", cat:"Книги", name:"Книга: Мастер и Маргарита", icon:"📖", cost:90, bookId:"bulgakov", desc:"Мистическая полка. Любима писателями." },
  { id:"book-bronte",   cat:"Книги", name:"Книга: Грозовой перевал", icon:"📖", cost:75, bookId:"bronte", desc:"Для романтичных натур и грозовых вечеров." },
  { id:"book-kafka",    cat:"Книги", name:"Книга: Процесс",          icon:"📖", cost:80, bookId:"kafka", desc:"Философы начинают здороваться первыми." },
  { id:"book-tolkien",  cat:"Книги", name:"Книга: Хоббит",           icon:"📖", cost:70, bookId:"tolkien", desc:"Уют возрастает, как второй завтрак." },
  { id:"book-verne",    cat:"Книги", name:"Книга: 20 000 лье под водой", icon:"📖", cost:55, bookId:"verne", desc:"Путешественники слышат зов моря." },
  // Напитки
  { id:"drink-doubleesp", cat:"Меню", name:"Рецепт: Двойной эспрессо", icon:"☕", cost:120, drinkId:"doubleesp", desc:"Элитный сорт. Писатели теряют голову." },
];

/* ---------- Ивенты (проводятся вечером за зёрна) ---------- */
const EVENTS = [
  { id:"poetry-night", name:"Поэтический вечер", icon:"🌙", cost:40, gain:{ comfort:10, beans:35 }, needBook:"pushkin",
    desc:"Читаем Пушкина при свечах. Требует: книга дня — поэзия." },
  { id:"book-club", name:"Книжный клуб", icon:"📕", cost:30, gain:{ comfort:8, beans:30 }, needGenre:null,
    desc:"Обсуждение книги дня. Чем больше книг на полках — тем выше сбор." },
  { id:"espresso-tasting", name:"Дегустация эспрессо", icon:"☕", cost:50, gain:{ comfort:6, beans:50 }, needDrink:"espresso",
    desc:"Гости пробуют наш лучший эспрессо. Нужен рецепт эспрессо (есть всегда)." },
];

/* ---------- Достижения ---------- */
const ACHIEVEMENTS = [
  { id:"first-serve", name:"Первая глава", desc:"Обслужить первого гостя.", check:s=>s.served>=1 },
  { id:"perfect3", name:"Идеальная пара", desc:"3 раза подряд угодить гостю полностью.", check:s=>s.perfectStreak>=3 },
  { id:"collect5", name:"Библиотекарь", desc:"Собрать 5 разных книг на полках.", check:s=>Object.keys(s.books).length>=5 },
  { id:"russia", name:"Русская классика", desc:"Купить Достоевского, Пушкина и Булгакова на витрину.", check:s=>["dostoevsky","pushkin","bulgakov"].every(id=>s.books[id]) },
  { id:"merch", name:"Бренд на зёрнах", desc:"Открыть производство мерча.", check:s=>s.merch>=1 },
  { id:"comfort80", name:"Хранитель уюта", desc:"Довести шкалу Уюта до 80%.", check:s=>s.comfort>=80 },
  { id:"philosophers", name:"Философский камешек", desc:"Обслужить профессора дважды.", check:s=>(s.byWho.professor||0)>=2 },
  { id:"rich", name:"Кофейное состояние", desc:"Накопить 300 зёрен.", check:s=>s.beans>=300 },
];

/* ---------- Настройки дня ---------- */
const DAYS_TOTAL = 5;               // 5 глав — короткая история
const CUSTOMERS_PER_DAY = 3;        // упрощённо: 3 гостя в день
const BREWS = ["Воронка V60","Эспрессо-машина","Френч-пресс"];
const TEMPS = [{t:"Кипяток",m:-1},{t:"92–96 °C",m:1},{t:"80 °C",m:0}]; // m: модификатор качества помола
