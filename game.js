/* ---------- refs ---------- */
const sceneA = document.getElementById('sceneA');
const sceneB = document.getElementById('sceneB');
const dimmer = document.getElementById('scene-dimmer');

const character = document.getElementById('character');

const intro = document.getElementById('intro');
const capsule = document.getElementById('ui-capsule');
const dialogue = document.getElementById('dialogue');
const choices = document.getElementById('choices');
const manager = document.getElementById('manager');
const badgeManager = document.getElementById('badge-manager');
// Intern (стажёр)
const intern = document.getElementById('intern');
const badgeIntern = document.getElementById('badge-intern');
const badge = document.getElementById('badge');
// Developer (разработчик)
const dev = document.getElementById('dev');
const badgeDev = document.getElementById('badge-dev');

/* ---------- состояние (скрытые очки) ---------- */
const state = {
  // Соц-ориентация
  extroversion: 0,
  introversion: 0,
  // Поведенческие маркеры
  awareness: 0,
  toxicity: 0,
  // Эмоциональный профиль
  empathy: 0,
  indifference: 0,
  // Рабочий стиль
  perfectionism: 0,
  pragmatism: 0,
};
function addPoint(trait) {
  if (trait in state) state[trait]++;
  // console.debug('state', state);
}

/* ---------- изображения: выбор лучшего формата (WebP с откатом на PNG) ---------- */
const __srcCache = new Map(); // cache png->resolvedSrc (webp|png)

function resolveImageSrc(srcPng) {
  // Fast path from cache
  if (__srcCache.has(srcPng)) return Promise.resolve(__srcCache.get(srcPng));
  // only replace .png -> .webp when applicable
  const webpSrc = srcPng.endsWith('.png') ? srcPng.replace(/\.png$/i, '.webp') : null;
  // Try WebP first (if applicable), then fallback to original
  return new Promise((resolve) => {
    if (!webpSrc) {
      __srcCache.set(srcPng, srcPng);
      return resolve(srcPng);
    }
    const probe = new Image();
    probe.onload = () => { __srcCache.set(srcPng, webpSrc); resolve(webpSrc); };
    probe.onerror = () => { __srcCache.set(srcPng, srcPng); resolve(srcPng); };
    probe.src = webpSrc;
  });
}

/* ---------- фон: медленный кроссфейд + затемнение только фона ---------- */
let activeScene = sceneA, backScene = sceneB;

function changeScene(src) {
  dimmer.classList.add('is-on'); // затемняем фон
  resolveImageSrc(src).then((bestSrc) => {
    const img = new Image();
    img.src = bestSrc;
    const done = () => apply(bestSrc);
    img.decode ? img.decode().then(done) : (img.onload = done);
  });

  function apply(best) {
    backScene.src = best;
    requestAnimationFrame(() => {
      activeScene.classList.remove('is-active');
      backScene.classList.add('is-active');

      // снимаем затемнение чуть позже, чтобы кроссфейд завершился
      setTimeout(() => dimmer.classList.remove('is-on'), 2500);
      const t = activeScene;
      activeScene = backScene;
      backScene = t;
    });
  }
}

/* ---------- персонаж: без анимации (мгновенная замена), но без мигания ---------- */
let __characterLoadId = 0; // counter to cancel stale loads
function setCharacter(src) {
  const loadId = ++__characterLoadId;
  resolveImageSrc(src).then((best) => {
    if (loadId !== __characterLoadId) return; // stale request, ignore
    if (character.src && character.src.endsWith(best)) return;
    const img = new Image();
    img.src = best;
    const apply = () => { 
      if (loadId === __characterLoadId) character.src = best; 
    };
    img.decode ? img.decode().then(apply) : (img.onload = apply);
  });
}

function showCharacter() {
  character.style.display = 'block';
  badge.style.display = 'inline-flex';
  requestAnimationFrame(() => {
    character.classList.add('visible');
  });
}

function hideCharacter() {
  character.classList.remove('visible');
  badge.style.display = 'none';
  setTimeout(() => {
    character.style.display = 'none';
  }, 800);
}

/* ---------- менеджер: справа ---------- */
let __managerLoadId = 0;
function setManager(src) {
  const loadId = ++__managerLoadId;
  resolveImageSrc(src).then((best) => {
    if (loadId !== __managerLoadId) return;
    if (manager.src && manager.src.endsWith(best)) return;
    const img = new Image();
    img.src = best;
    const apply = () => { 
      if (loadId === __managerLoadId) manager.src = best; 
    };
    img.decode ? img.decode().then(apply) : (img.onload = apply);
  });
}

function showManager() {
  manager.style.display = 'block';
  badgeManager.classList.add('visible');
  requestAnimationFrame(() => {
    manager.classList.add('visible');
  });
}

function hideManager() {
  manager.classList.remove('visible');
  badgeManager.classList.remove('visible');
  setTimeout(() => {
    manager.style.display = 'none';
  }, 800);
}

/* ===== Сцена 5: Вечер и питч менеджера ===== */
function startScene5() {
  // Переход из сцены 4, фон оставляем как есть сначала
  // Отслеживание прохождения сцены 5
  if (typeof gtag !== 'undefined') {
    gtag('event', 'scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_5',
      'scene_number': 5
    });
  }
  hideDev && hideDev();
  hideManager && hideManager();
  hideCapsule();
  hideCharacter();
  showIntroScreen('Оставляешь чат, допиваешь остывший кофе и снова втыкаешь в ноут', scene5Intro2);
}

function scene5Intro2() {
  showIntroScreen('Что-то исправляешь, что-то комментируешь, кто-то что-то пишет', scene5Evening);
}

function scene5Evening() {
  // Смена фона в офис — вечер
  changeScene('assets/background-office.png');
  hideCapsule();
  hideCharacter();
  // Сразу показываем следующий интро-текст на этом же тапе
  intro.style.display = 'block';
  showIntro('Вечер. Голова тяжёлая. Ты просто сидишь, глядя в экран, где медленно крутится прелоадер');
  onNextClick(scene5Reflect1);
}

// (scene4Transition moved to the Scene 4 section below)

function scene4ReviewGirlAgree() {
  hideDev();
  showCharacter();
  setCharacter('assets/girl-default.png');
  setDialogue('Окей, погнали на дизайн-ревью');
  hideChoicesKeepSlot();
  onNextClick(scene4ReviewGirlFeel);
}

function scene4ReviewGirlFeel() {
  setCharacter('assets/girl-default.png');
  setDialogue('Всегда интересно, что получилось, но и немного страшно...');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene4ReviewIntro1);
}

function scene4ReviewIntro1() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Открываешь стенд');
  onNextClick(scene4ReviewIntro2);
}

function scene4ReviewIntro2() {
  showIntro('Первый экран грузится медленно, но появляется');
  onNextClick(scene4ReviewStart);
}

function scene4ReviewStart() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Погнали...');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  showChoicesHTML(`
    <button class="choice" onclick="scene4ReviewEmpathy()">Пройдусь по всему</button>
    <button class="choice" onclick="scene4ReviewIndifference()">И так сойдёт</button>
  `);
}

function scene4ReviewEmpathy() {
  addPoint('empathy');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('В целом всё ок, есть пара мелких моментов. Соберу пару скринов, оформлю док');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(() => {
    setDialogue('Здесь ок, но шрифт съехал. Тут иконка фоткой. Переход дёргается. Мелочь, но видно');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    onNextClick(() => {
      setDialogue('Лучше сказать сейчас, чем потом искать виноватых');
      dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
      hideChoicesKeepSlot();
      onNextClick(scene4Finale);
    });
  });
}

// (deprecated duplicate of scene4Transition removed)

function scene4ReviewIndifference() {
  addPoint('indifference');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Выглядит норм, работает, не разваливается, а это уже победа');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(() => {
    setDialogue('Не всегда нужно влезать. Иногда можно просто пройти мимо');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(scene4Finale);
  });
}

function scene5Reflect1() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Кажется, это был норм день. Или нет?..');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5Approach);
}

function scene5Approach() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты уже почти закрываешь ноут, как вдруг к тебе подходит коллега с горящими глазами');
  onNextClick(scene5Pitch1);
}

function scene5Pitch1() {
  intro.style.display = 'none';
  showManager();
  setManager('assets/manager-surprise.png');
  showCapsule();
  setDialogue('Слушай, а давай уволимся и запилим свой стартап?');
  hideChoicesKeepSlot();
  onNextClick(scene5Pitch2);
}

function scene5Pitch2() {
  setManager('assets/manager-default.png');
  setDialogue('У меня есть идея, ты охренеешь');
  hideChoicesKeepSlot();
  onNextClick(scene5GirlReact);
}

function scene5GirlReact() {
  hideManager();
  showCharacter();
  setCharacter('assets/girl-surprise.png');
  setDialogue('Ого. Это бред… или прорыв?..');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5ChoiceStart);
}

function scene5ChoiceStart() {
  setCharacter('assets/girl-default.png');
  setDialogue('Что ответить?');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  showChoicesHTML(`
    <button class="choice" onclick="scene5ChoiceYes()">Ну давай, расскажи</button>
    <button class="choice" onclick="scene5ChoiceNo()">Чувак, я так устала…</button>
  `);
}

function scene5ChoiceYes() {
  addPoint('extroversion');
  hideChoicesKeepSlot();
  hideCharacter();
  showManager();
  setManager('assets/manager-surprise.png');
  setDialogue('Я знал, что тебе зайдёт!');
  onNextClick(scene5PlanIntro1);
}

function scene5ChoiceNo() {
  addPoint('introversion');
  hideChoicesKeepSlot();
  hideCharacter();
  showManager();
  setManager('assets/manager-surprise.png');
  setDialogue('Нет! Ты должна это услышать');
  onNextClick(scene5PlanIntro1);
}

function scene5PlanIntro1() {
  hideCapsule();
  hideManager();
  intro.style.display = 'block';
  showIntro('Он достаёт айпад, делает пару свайпов, включает тёмный экран с белым шрифтом:');
  onNextClick(scene5PlanIntro2);
}

function scene5PlanIntro2() {
  showIntro('Бизнес-план:');
  onNextClick(scene5PlanList1);
}

function scene5PlanList1() {
  showIntro('Платформа для ревью кофеен на основе нейросети');
  onNextClick(scene5PlanList2);
}

function scene5PlanList2() {
  showIntro('С фильтром "не обсирай, если бариста милый"');
  onNextClick(scene5PlanList3);
}

function scene5PlanList3() {
  showIntro('Подписка, NFT-карточки, пинты кофе за рефералы');
  onNextClick(scene5GirlReacts2);
}

function scene5GirlReacts2() {
  intro.style.display = 'none';
  showCharacter();
  showCapsule();
  setCharacter('assets/girl-surprise.png');
  setDialogue('Господи… Ну и дичь');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5GirlReacts3);
}

function scene5GirlReacts3() {
  setCharacter('assets/girl-smile.png');
  setDialogue('Но подано уверенно');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5GirlAdvice1);
}

function scene5GirlAdvice1() {
  dialogue.innerHTML = '';
  setCharacter('assets/girl-smile.png');
  setDialogue('Слушай, ты кравчик');
  hideChoicesKeepSlot();
  onNextClick(scene5GirlAdviceMain1);
}

function scene5GirlAdviceMain1() {
  setCharacter('assets/girl-default.png');
  setDialogue('Главное — никогда не сдавайся, иди к своей цели');
  hideChoicesKeepSlot();
  onNextClick(scene5ManagerOut1);
}

function scene5GirlAdviceMain2() {
  hideManager();
  showCharacter();
  setCharacter('assets/girl-default.png');
  setDialogue('Но если будет слишком сложно — пофиг, сдавайся');
  hideChoicesKeepSlot();
  onNextClick(scene5ManagerOut2);
}

function scene5ManagerOut1() {
  hideCharacter();
  showManager();
  setManager('assets/manager-surprise.png');
  setDialogue('…');
  onNextClick(scene5GirlAdviceMain2);
}

function scene5ManagerOut2() {
  hideCharacter();
  showManager();
  setManager('assets/manager-surprise.png');
  setDialogue('Я ниче не понял, но спасибо!');
  hideChoicesKeepSlot();
  onNextClick(() => {
    setDialogue('Всё, пошёл делать!');
    hideChoicesKeepSlot();
    onNextClick(scene5Reflect3);
  });
}

function scene5Reflect3() {
  hideManager();
  showCharacter();
  setCharacter('assets/girl-default.png');
  setDialogue('Да, ну и денёк...');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5Reflect4);
}

function scene5Reflect4() {
  setCharacter('assets/girl-default.png');
  setDialogue('На самом деле хорошо, что у людей есть мечты');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5Reflect5);
}

function scene5Reflect5() {
  setCharacter('assets/girl-default.png');
  setDialogue('А вдруг в этом что-то есть?');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  showChoicesHTML(`
    <button class="choice" onclick="scene5Awareness()">Чёрт, а ведь может есть</button>
    <button class="choice" onclick="scene5Toxic()">Бред сумасшедшего</button>
  `);
}

function scene5Awareness() {
  addPoint('awareness');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Идея безумная, но в ней что-то цепляет');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(() => {
    setDialogue('Запишу на всякий случай');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    onNextClick(scene5WrapUp);
  });
}

function scene5Toxic() {
  addPoint('toxicity');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Идея из вселенной, где люди платят криптой за капучино');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(() => {
    setDialogue('Хотя, кажется, люди и правда платят криптой за кофе…');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    onNextClick(scene5WrapUp);
  });
}

function scene5WrapUp() {
  setCharacter('assets/girl-default.png');
  setDialogue('А теперь, кажется, пора закрывать ноут');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(() => {
    setDialogue('Хватит подвигов на сегодня');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(startFinaleSequence);
  });
}

/* ===== Финальная последовательность перед архетипами ===== */
function startFinaleSequence() {
  hideCapsule();
  hideCharacter();
  changeScene('assets/background-homenight.png');
  intro.style.display = 'block';
  showIntro('Ты возвращаешься домой. За окном уже темно, город тихий');
  onNextClick(finaleIntro2);
}

function finaleIntro2() {
  showIntro('Внутри — тишина и странное спокойствие');
  onNextClick(finaleIntro3);
}

function finaleIntro3() {
  showIntro('В голове всплывают фрагменты дня — выборы, слова, лица');
  onNextClick(finaleReflect1);
}

function finaleReflect1() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Вот и все');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(finaleReflect2);
}

function finaleReflect2() {
  setDialogue('Спасибо, что был мной весь день. И респект, что дошёл до конца');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(finaleReflect3);
}

function finaleReflect3() {
  setCharacter('assets/girl-smile.png');
  setDialogue('А теперь давай узнаем, какой ты дизайнер');
  dialogue.innerHTML = dialogue.textContent;
  hideChoicesKeepSlot();
  onNextClick(finaleProcessing1);
}

function finaleProcessing1() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  intro.classList.add('centered-text'); // Центрируем текст для loading экранов
  showIntro('Обработка данных…');
  onNextClick(finaleProcessing2);
}

function finaleProcessing2() {
  showIntro('Анализ поведения…');
  onNextClick(finaleProcessing3);
}

function finaleProcessing3() {
  showIntro('Подбор архетипа…');
  onNextClick(() => {
    intro.classList.remove('centered-text'); // Убираем центрирование после loading экранов
    showArchetype();
  });
}

/* ===== Данные финальных экранов ===== */
const endings = [
  {
    id: 'aesthete',
    icon: 'assets/aesthete.png',
    title: 'Эстет-террорист',
    subtitle: '«Я не токсик, просто вижу уродство»',
    blocks: [
      'Можешь уничтожить концепт одной фразой. Делаешь божественно, но все страдают',
      'Пиксели — идеальны.\nКоллеги — в терапии',
      'Ты как ревью с огнемётом. Иконка Figma трясётся при входе',
    ]
  },
  {
    id: 'ninja',
    icon: 'assets/ninja.png',
    title: 'Корпоративный ниндзя',
    subtitle: '«Я чиню мир, пока вы созваниваетесь»',
    blocks: [
      'Ты не кричишь, не споришь, не давишь, но именно ты спасаешь проект, когда всё разваливается',
      'Знаешь все паттерны, но никому их не навязываешь',
      'Тебя не видно. Но если уйдёшь, все это почувствуют',
    ]
  },
  {
    id: 'punk',
    icon: 'assets/punk.png',
    title: 'Product-панк',
    subtitle: '«Я не срываю процесс. Я выражаюсь»',
    blocks: [
      'Ты называешь хаос «гибкостью». Врываешь дизайн-систему ради экспрессии',
      'Бесишь всех, но двигаешь продукт',
      'Ты не согласен с ТЗ, но согласен с собой. Этого достаточно',
    ]
  },
  {
    id: 'skull',
    icon: 'assets/skull.png',
    title: 'Фигма-гуру на грани',
    subtitle: '«Я все сделал и сейчас исчезну»',
    blocks: [
      'Если ты не выгорел в этом спринте — значит, не твой проект',
      'Ты оформляешь за троих, думаешь за пятерых, умираешь в одиночку',
      'Ты сделал красиво. Как всегда. Потому что не умеешь иначе',
    ]
  },
  {
    id: 'lips',
    icon: 'assets/lips.png',
    title: 'Старший Интроверт по макетам',
    subtitle: '«Я молчу, потому что уже сделал»',
    blocks: [
      'Ты не участвуешь в обсуждениях, ты их предотвращаешь',
      'Все уже работает, но никто ещё не понял, что это благодаря тебе',
      'Ты не интроверт. Ты просто уже видел, чем всё это заканчивается',
    ]
  },
  {
    id: 'bird',
    icon: 'assets/bird.png',
    title: 'Душнила с добрым сердцем',
    subtitle: '«Я объясню тебе, почему ты не прав»',
    blocks: [
      'Ты хочешь, чтобы всё было понятно. Даже если придётся всё объяснить трижды',
      'Ты не придираешься. Ты восстанавливаешь справедливость',
      'Всё просто, если сначала прочитать, а потом говорить',
    ]
  },
  {
    id: 'battery',
    icon: 'assets/battery.png',
    title: 'Креативный выгоревший',
    subtitle: '«Я всё ещё горю. Наверное...»',
    blocks: [
      'Идеи есть всегда. Просто теперь они лежат и не двигаются',
      'В команде тебя любят, но боятся однажды потерять',
      'Бро, помоги себе, пожалуйста. Ты всё ещё сияешь, просто через боль',
    ]
  },
  {
    id: 'ice',
    icon: 'assets/ice.png',
    title: 'Методичный циник',
    subtitle: '«Я всё учёл, даже бессмысленность»',
    blocks: [
      'Любая задача — это просто баг, который можно задокументировать',
      'Комменты пишешь заранее, потому что угадываешь чужие ошибки',
      'Ты не против эмоций. Просто в регламенте их не было',
    ]
  }
];

function renderEnding(data) {
  const c = document.getElementById('ending');
  if (!c) return;
  c.innerHTML = '';

  // Верхняя карточка с иконкой/тайтлом
  const head = document.createElement('div');
  head.className = 'ending-card ending-header hidden';

  const img = document.createElement('img');
  img.className = 'ending-icon';
  img.width = 100; img.height = 100;
  img.alt = data.title || '';
  img.src = data.icon || 'assets/aesthete.png';

  const h = document.createElement('h3');
  h.className = 'ending-title';
  h.textContent = data.title || '';

  const s = document.createElement('p');
  s.className = 'ending-subtitle';
  s.textContent = data.subtitle || '';

  head.appendChild(img);
  head.appendChild(h);
  head.appendChild(s);
  c.appendChild(head);

  // Остальные блоки
  (data.blocks || []).forEach(text => {
    const card = document.createElement('div');
    card.className = 'ending-card hidden';
    card.textContent = text;
    c.appendChild(card);
  });
}

// Показать кнопку по клику/табу
function revealButton() {
  const actionsBtn = document.querySelector('.ending-actions');
  if (actionsBtn) {
    actionsBtn.classList.remove('hidden');
    document.body.removeEventListener('click', revealButton);
    document.body.removeEventListener('keydown', revealButtonKey);
  }
}

function revealButtonKey(e) {
  if (e.code === 'Space' || e.code === 'Tab' || e.key === ' ' || e.key === 'Tab') {
    e.preventDefault();
    revealButton();
  }
}

function showArchetype() {
  // Матрица архетипов: [E, I, Emp, Ind, Tox, Awa, Perf, Prag]
  const archetypes = [
    { id: 0, name: 'aesthete', traits: [1, 2, 0, 2, 3, 1, 3, 0] },      // Эстет-террорист
    { id: 1, name: 'ninja', traits: [1, 3, 3, 0, 0, 3, 2, 1] },         // Корпоративный ниндзя
    { id: 2, name: 'punk', traits: [3, 0, 1, 2, 2, 0, 0, 3] },          // Product-панк
    { id: 3, name: 'skull', traits: [2, 1, 3, 0, 1, 2, 2, 1] },         // Фигма-гуру на грани
    { id: 4, name: 'lips', traits: [0, 3, 1, 2, 0, 3, 3, 0] },          // Старший интроверт
    { id: 5, name: 'bird', traits: [1, 2, 3, 0, 0, 3, 2, 0] },          // Душнила с добрым сердцем
    { id: 6, name: 'battery', traits: [1, 2, 2, 1, 1, 1, 3, 0] },       // Креативный выгоревший
    { id: 7, name: 'ice', traits: [0, 3, 0, 2, 2, 3, 3, 0] }            // Методичный циник
  ];
  
  // Вектор пользователя: [E, I, Emp, Ind, Tox, Awa, Perf, Prag]
  const userVector = [
    state.extroversion,
    state.introversion,
    state.empathy,
    state.indifference,
    state.toxicity,
    state.awareness,
    state.perfectionism,
    state.pragmatism
  ];
  
  // Вычисление манхэттенского расстояния для каждого архетипа
  let minDistance = Infinity;
  let selectedArchetype = 0;
  
  archetypes.forEach((archetype) => {
    let distance = 0;
    for (let i = 0; i < 8; i++) {
      distance += Math.abs(userVector[i] - archetype.traits[i]);
    }
    
    if (distance < minDistance) {
      minDistance = distance;
      selectedArchetype = archetype.id;
    }
  });
  
  console.log('Final state:', state);
  console.log('User vector:', userVector);
  console.log('Selected archetype:', selectedArchetype, 'with distance:', minDistance);
  
  // Отслеживание завершения игры с результатом архетипа
  if (typeof gtag !== 'undefined') {
    gtag('event', 'game_complete', {
      'event_category': 'game',
      'event_label': 'finished',
      'archetype': archetypes[selectedArchetype].name,
      'archetype_id': selectedArchetype,
      'extroversion': state.extroversion,
      'introversion': state.introversion,
      'empathy': state.empathy,
      'indifference': state.indifference,
      'toxicity': state.toxicity,
      'awareness': state.awareness,
      'perfectionism': state.perfectionism,
      'pragmatism': state.pragmatism
    });
  }
  
  // Скрываем игровой интерфейс
  intro.style.display = 'none';
  hideCapsule();
  hideCharacter();
  
  // Показываем секцию концовок
  const endingSection = document.getElementById('ending-section');
  if (endingSection) {
    endingSection.style.display = 'block';
  }
  
  // Рендерим выбранную концовку
  renderEnding(endings[selectedArchetype]);
  
  // Показываем все карточки сразу
  const cards = document.querySelectorAll('.ending-card');
  cards.forEach(card => card.classList.remove('hidden'));
  
  // Прячем кнопку действий и ждем клика чтобы показать
  const actionsBtn = document.querySelector('.ending-actions');
  if (actionsBtn) actionsBtn.classList.add('hidden');
  
  // Подключаем обработчики для показа кнопки
  document.body.addEventListener('click', revealButton);
  document.body.addEventListener('keydown', revealButtonKey);
}

function replayGame() {
  // Перезагрузка страницы для нового прохождения
  window.location.reload();
}

// helper to show intro text with one-liner
function showIntroScreen(text, nextFn) {
  intro.style.display = 'block';
  showIntro(text);
  onNextClick(nextFn);
}


/* ---------- стажёр: справа (как менеджер) ---------- */
let __internLoadId = 0;
function setIntern(src) {
  // Выровнять позицию: для intern-default добавляем небольшой сдвиг вправо,
  // для других спрайтов (например, intern-sad) — убираем, чтобы сохранить референсную позицию «Ага, поняла»
  if (src && src.includes('intern-default')) {
    intern.classList.add('intern-offset');
  } else {
    intern.classList.remove('intern-offset');
  }

  const loadId = ++__internLoadId;
  resolveImageSrc(src).then((best) => {
    if (loadId !== __internLoadId) return;
    if (intern.src && intern.src.endsWith(best)) return;
    const img = new Image();
    img.src = best;
    const apply = () => { 
      if (loadId === __internLoadId) intern.src = best; 
    };
    img.decode ? img.decode().then(apply) : (img.onload = apply);
  });
}

function showIntern() {
  if (!intern) return;
  intern.style.display = 'block';
  if (badgeIntern) badgeIntern.classList.add('visible');
  requestAnimationFrame(() => {
    intern.classList.add('visible');
  });
}

function hideIntern() {
  if (!intern) return;
  intern.classList.remove('visible');
  if (badgeIntern) badgeIntern.classList.remove('visible');
  setTimeout(() => {
    intern.style.display = 'none';
  }, 800);
}

/* ---------- разработчик: справа ---------- */
let __devLoadId = 0;
function setDev(src) {
  const loadId = ++__devLoadId;
  resolveImageSrc(src).then((best) => {
    if (loadId !== __devLoadId) return;
    if (dev.src && dev.src.endsWith(best)) return;
    const img = new Image();
    img.src = best;
    const apply = () => { 
      if (loadId === __devLoadId) dev.src = best; 
    };
    img.decode ? img.decode().then(apply) : (img.onload = apply);
  });
}

function showDev() {
  dev.style.display = 'block';
  badgeDev.classList.add('visible');
  requestAnimationFrame(() => {
    dev.classList.add('visible');
  });
}

function hideDev() {
  dev.classList.remove('visible');
  badgeDev.classList.remove('visible');
  setTimeout(() => {
    dev.style.display = 'none';
  }, 800);
}

/* ---------- UI helpers ---------- */
function setDialogue(text) {
  dialogue.textContent = text;
}

function showCapsule() {
  capsule.style.display = 'flex';
}

function hideCapsule() {
  capsule.style.display = 'none';
}

function showChoicesHTML(html) {
  choices.innerHTML = html;
  choices.classList.remove('hidden');
  capsule.classList.remove('no-choices');
  // убедимся, что кнопки активны и в таб-очереди
  choices.querySelectorAll('button').forEach(btn => {
    btn.disabled = false;
    btn.tabIndex = 0;
    if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
  });
}

function hideChoicesKeepSlot() {
  // Спрятать блок выбора, но сохранить капсулу диалога и слот под кнопки
  choices.classList.add('hidden');
  capsule.classList.add('no-choices');
  // Деактивируем кнопки выбора, убираем из таб-очереди
  choices.querySelectorAll('button').forEach(btn => {
    btn.disabled = true;
    btn.tabIndex = -1;
  });
}

// Единый обработчик «следующий экран»: клик по экрану или Space/Enter (одиночное срабатывание)
function onNextClick(cb) {
  const handleClick = () => fire();
  const handleKey = (e) => {
    // поддержка Space/Enter, подавляем скролл и повторы
    if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter') {
      if (e.repeat) return;
      e.preventDefault();
      fire();
    }
  };
  let fired = false;
  function fire() {
    if (fired) return;
    fired = true;
    document.body.removeEventListener('click', handleClick, { passive: true });
    document.body.removeEventListener('keydown', handleKey);
    if (typeof cb === 'function') cb();
  }
  setTimeout(() => {
    document.body.addEventListener('click', handleClick, { passive: true });
    document.body.addEventListener('keydown', handleKey);
  }, 80);
}

/* ---------- сценарий ---------- */
const introDialogues = [
  'Привет, ты попал в\u00A0симулятор продуктового дизайнера',
  'Проживи этот день с\u00A0кайфом, \nно помни, что все твои действия влияют на\u00A0ход игры'
];
let i = 0;

function showIntro(text) {
  intro.textContent = text;
}

function hideIntro() {
  intro.style.display = 'none';
}

// старт — интро
showIntro(introDialogues[0]);

const spaceHandler = (e) => {
  if (e.code === 'Space') nextIntro();
};

document.body.addEventListener('click', nextIntro);
document.body.addEventListener('keydown', spaceHandler);

function nextIntro() {
  if (i < introDialogues.length - 1) {
    i++;
    showIntro(introDialogues[i]);
  } else {
    startGameplay();
  }
}

function startGameplay() {
  // Отслеживание начала игры
  if (typeof gtag !== 'undefined') {
    gtag('event', 'game_start', {
      'event_category': 'game',
      'event_label': 'gameplay_started'
    });
  }

  hideIntro();

  showCharacter();
  setCharacter('assets/girl-default.png');

  showCapsule();
  setDialogue('Я\u00A0Вика, сегодня ты\u00A0— это я');
  hideChoicesKeepSlot();

  document.body.removeEventListener('click', nextIntro);
  document.body.removeEventListener('keydown', spaceHandler);

  onNextClick(() => {
    setDialogue('Мы\u00A0проведем этот день вместе, а\u00A0в\u00A0конце узнаем к\u00A0какому типу дизайнера ты\u00A0относишься');
    hideChoicesKeepSlot();
    onNextClick(() => {
      setDialogue('Погнали!');
      hideChoicesKeepSlot();
      onNextClick(showWorkChoice);
    });
  });
}

function showWorkChoice() {
  setDialogue('Ну\u00A0что, пора на\u00A0работу, пойти\u00A0ли в\u00A0офис сегодня?');
  showChoicesHTML(`
    <button class="choice" onclick="workFromHome()">Работать удаленно</button>
    <button class="choice" onclick="goToOffice()">Пойти в\u00A0офис</button>
  `);
}

function showOfficeResponse() {
  setCharacter('assets/girl-smile.png'); // мгновенная замена, без fade
  setDialogue('О, ты\u00A0решил пойти в\u00A0офис, как неожиданно и\u00A0приятно, уверена, что коллеги соскучились по\u00A0тебе');
  hideChoicesKeepSlot();
}

function workFromHome() {
  showOfficeResponse();
  onNextClick(startScene1);
}

function goToOffice() {
  showOfficeResponse();
  onNextClick(startScene1);
}

function startScene1() {
  // Отслеживание прохождения сцены 1
  if (typeof gtag !== 'undefined') {
    gtag('event', 'scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_1',
      'scene_number': 1
    });
  }

  changeScene('assets/background-office.png'); // мягко + медленно
  hideCapsule();
  hideCharacter();

  // Сразу показываем текст вместе с фоном
  intro.style.display = 'block';
  showIntro('Вот ты\u00A0и\u00A0оказался в\u00A0любимом офисе');
  onNextClick(showScene1Part2);
}

function showScene1Part2() {
  intro.style.display = 'none';

  showCharacter();
  setCharacter('assets/girl-default.png');

  showCapsule();
  setDialogue('С\u00A0чего начнёшь свой день?');
  showChoicesHTML(`
    <button class="choice" onclick="chatWithColleagues()">Поболтаю с\u00A0коллегами на\u00A0кухне</button>
    <button class="choice" onclick="checkEmail()">Проверю почту</button>
  `);
}

/* ===== Кухня (ветка: Поболтаю с коллегами) ===== */
function startCoffeeScene() {
  changeScene('assets/background-coffeepoint.png');
  hideCapsule();
  hideCharacter();
  
  // Сразу показываем текст
  intro.style.display = 'block';
  showIntro('Ты\u00A0заходишь на\u00A0кухню. Пахнет тостами, кто-то спорит у\u00A0кофемашины');
  onNextClick(coffeeIntro2);
}

function coffeeIntro2() {
  showIntro('И\u00A0вдруг ты\u00A0слышишь знакомую фразу');
  onNextClick(coffeeIntro3);
}

function coffeeIntro3() {
  showIntro('«А\u00A0у\u00A0нас премии вообще ещё бывают или это миф?»');
  onNextClick(coffeeChoice1);
}

function coffeeChoice1() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-smile.png');
  showCapsule();
  setDialogue('Ты\u00A0невольно усмехаешься\u00A0— кажется, утро начинается как обычно');
  showChoicesHTML(`
    <button class="choice" onclick="coffeeSupportJoke()">Поддержать шутку</button>
    <button class="choice" onclick="coffeeBeToxic()">Бывают. Только не\u00A0у\u00A0нас</button>
  `);
}

function coffeeSupportJoke() {
  addPoint('awareness');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Конечно бывают. Просто их\u00A0выдают в\u00A0виде морального удовлетворения');
  onNextClick(coffeeSupportAfter);
}

function coffeeSupportAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Коллеги смеются, кто-то хлопает тебя по\u00A0плечу');
  onNextClick(coffeeSupportAfter2);
}

function coffeeSupportAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ладно, хватит философии, кофе выпит\u00A0— теперь можно и\u00A0мир спасать');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(endOfCoffeeScene);
}

function coffeeBeToxic() {
  addPoint('toxicity');
  setCharacter('assets/girl-toxic.png');
  hideChoicesKeepSlot();
  setDialogue('Я\u00A0вот жду уже третий год\u00A0— думаю, может, это квест такой?');
  onNextClick(coffeeToxicAfter1);
}

function coffeeToxicAfter1() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Кто-то усмехается, кто-то кивает с\u00A0сочувствием');
  onNextClick(coffeeToxicAfter2);
}

function coffeeToxicAfter2() {
  showIntro('Ты\u00A0чувствуешь лёгкое облегчение\u00A0— будто сказал вслух то, о\u00A0чём все думают');
  onNextClick(coffeeToxicAfter3);
}

function coffeeToxicAfter3() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ну\u00A0что\u00A0ж… хотя\u00A0бы поржали. Пойду посмотрю, какие ужасы прилетели');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(endOfCoffeeScene);
}

function endOfCoffeeScene() {
  changeScene('assets/background-desktop.png');
  hideCapsule();
  hideCharacter();
  
  // Сразу показываем текст
  intro.style.display = 'block';
  showIntro('После короткой разминки утро набирает обороты. На\u00A0экране уже мигают задачи\u00A0— день начинается по-настоящему');
  onNextClick(scene1Done);
}

function scene1Done() {
  // Сцена 1 завершена, переход к сцене 2
  intro.style.display = 'none';
  startScene2();
}

function scene1Done() {
  // Сцена 1 завершена, переход к сцене 2
  intro.style.display = 'none';
  startScene2();
}

/* ===== Сцена 2: Встреча ===== */
function startScene2() {
  // Отслеживание прохождения сцены 2
  if (typeof gtag !== 'undefined') {
    gtag('event', 'scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_2',
      'scene_number': 2
    });
  }

  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Так, что у нас тут…');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene2Intro2);
}

function scene2Intro2() {
  setDialogue('Горящие дедлайны, фигма в 10 вкладках и трекер, в котором порядок только снится');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene2Choice);
}

function scene2Choice() {
  setDialogue('С\u00A0чего начать?');
  dialogue.innerHTML = dialogue.textContent;
  showChoicesHTML(`
    <button class="choice" onclick="scene2Choice1()">Планирую приоритеты в\u00A0трекере</button>
    <button class="choice" onclick="scene2Choice2()">Открываю Figma и\u00A0в\u00A0бой</button>
  `);
}

function scene2Choice1() {
  addPoint('perfectionism');
  hideChoicesKeepSlot();
  setDialogue('Так, дедлайны\u00A0— на\u00A0место, карточки\u00A0— по\u00A0цветам');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(() => {
    setDialogue('Если хаос снаружи, пусть хотя\u00A0бы внутри будет порядок');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    onNextClick(scene2AfterChoice);
  });
}

function scene2Choice2() {
  addPoint('pragmatism');
  hideChoicesKeepSlot();
  setDialogue('Не\u00A0тормозим. Новый фрейм, половина элементов уже откуда-то утащена\u00A0— идеально');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene2AfterChoice);
}

function scene2AfterChoice() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты\u00A0отхлёбываешь кофе, ловишь фокус\u00A0— и\u00A0видишь в\u00A0календаре мигающее приглашение:');
  onNextClick(() => {
    showIntro('«Дизайн-синк 11:00\u00A0— обсуждаем новую фичу»');
    onNextClick(scene2BeforeMeeting);
  });
}

function scene2BeforeMeeting() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Всё, пора в\u00A0переговорку. Мысленно надеваю броню');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(() => {
    changeScene('assets/background-meeting.png');
    hideCapsule();
    hideCharacter();
    
    // Сразу показываем первый текст встречи
    showManager();
    setManager('assets/manager-default.png');
    showCapsule();
    setDialogue('Коллеги, время поджимает. Нужно быстро пройтись по\u00A0вариантам и\u00A0выбрать рабочий');
    hideChoicesKeepSlot();
    onNextClick(meetingIntro2);
  });
}

function meetingIntro2() {
  hideCapsule();
  hideManager();
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ну\u00A0конечно, "быстро определимся", а\u00A0потом ещё месяц будем чинить баги');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(meetingIntro3);
}

function meetingIntro2() {
  hideCapsule();
  hideManager();
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ну\u00A0конечно, "быстро определимся", а\u00A0потом ещё месяц будем чинить баги');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingIntro3);
}

function meetingIntro3() {
  hideCharacter();
  hideCapsule();
  showManager();
  setManager('assets/manager-default.png');
  showCapsule();
  setDialogue('Сами понимаете, срок на\u00A0носу. Бизнес уже ждёт апдейт');
  onNextClick(meetingIntro4);
}

function meetingIntro4() {
  hideManager();
  hideCapsule();
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Смотрю на\u00A0аналитика\u00A0— он\u00A0делает вид, что изучает таблицу');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingIntro5);
}

function meetingIntro5() {
  setCharacter('assets/girl-sad.png');
  setDialogue('Понятно. Похоже, придётся решать самой');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingChoice1);
}

function meetingChoice1() {
  setCharacter('assets/girl-default.png');
  setDialogue('Как поступить?');
  dialogue.innerHTML = dialogue.textContent;
  showChoicesHTML(`
    <button class="choice" onclick="meetingEmpathy()">Давайте хотя\u00A0бы проверим гипотезу</button>
    <button class="choice" onclick="meetingIndifference()">Лучше просто досидеть</button>
  `);
}

function meetingEmpathy() {
  addPoint('empathy');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Я\u00A0понимаю, что времени мало, но\u00A0если не протестим гипотезу на пользователях, снова будем переделывать');
  onNextClick(meetingEmpathyDebate1);
}

function meetingEmpathyDebate1() {
  hideCharacter();
  showManager();
  setManager('assets/manager-default.png');
  setDialogue('А если это вообще не взлетит? Мы потратим время, которого нет');
  hideChoicesKeepSlot();
  onNextClick(meetingEmpathyDebate2);
}

function meetingEmpathyDebate2() {
  hideManager();
  showCharacter();
  setCharacter('assets/girl-default.png');
  setDialogue('Лучше потратить пару дней сейчас, чем кучу денег после релиза, когда начнут приходить скрины в стиле "вы серьёзно?"');
  hideChoicesKeepSlot();
  onNextClick(meetingEmpathyAfter);
}

function meetingEmpathyAfter() {
  hideCapsule();
  hideCharacter();
  hideManager();
  intro.style.display = 'block';
  showIntro('Никто не\u00A0перебивает. Менеджер кивает, аналитик записывает: «Проверить на\u00A0пилоте»');
  onNextClick(meetingEmpathyAfter2);
}

function meetingEmpathyAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Вот и\u00A0всё. Иногда, чтобы тебя услышали, надо просто не\u00A0промолчать');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(meetingFinale);
}

function meetingIndifference() {
  addPoint('indifference');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Мир подождёт. Сегодня я\u00A0просто не\u00A0в\u00A0ресурсе спасать проект');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingIndifferenceAfter);
}

function meetingIndifferenceAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты\u00A0решаешь не\u00A0тратить энергию. Слушаешь, как спорят менеджер и\u00A0аналитик, открываешь ноутбук, делаешь вид, что ищешь файл');
  onNextClick(meetingIndifferenceAfter2);
}

function meetingIndifferenceAfter2() {
  showIntro('На\u00A0самом деле просто считаешь минуты до\u00A0конца встречи');
  onNextClick(meetingFinale);
}

function meetingFinale() {
  intro.style.display = 'none';
  hideCharacter();
  showManager();
  setManager('assets/manager-default.png');
  showCapsule();
  setDialogue('Хорошо, кажется, на\u00A0сегодня всё ясно. Давайте просто возьмём этот вариант и\u00A0закроем задачу');
  hideChoicesKeepSlot();
  onNextClick(meetingFinale2);
}

function meetingFinale2() {
  hideCapsule();
  hideManager();
  intro.style.display = 'block';
  showIntro('Все переглядываются, но\u00A0никто не\u00A0берёт на\u00A0себя финальное слово');
  onNextClick(meetingFinale3);
}

function meetingFinale3() {
  showIntro('Менеджер смотрит в\u00A0экран, разработчик уже закрыл ноут, аналитик делает вид, что пишет');
  onNextClick(meetingFinale4);
}

function meetingFinale4() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Окей, мы\u00A0будто всё решили… но\u00A0не\u00A0совсем. Или просто все устали?');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingFinalChoice);
}

function meetingFinalChoice() {
  setDialogue('Как закончить встречу?');
  dialogue.innerHTML = dialogue.textContent;
  showChoicesHTML(`
    <button class="choice" onclick="meetingPerfectionism()">Подведу итоги</button>
    <button class="choice" onclick="meetingPragmatism()">Ладно, всем спасибо, я\u00A0пошла!</button>
  `);
}

function meetingPerfectionism() {
  addPoint('perfectionism');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Я\u00A0всё зафиксирую и\u00A0скину мемо встречи');
  onNextClick(meetingPerfectionismAfter);
}

function meetingPerfectionismAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Менеджер благодарно кивает. Остальные тут\u00A0же поднимаются. Внутри\u00A0— ощущение, что ты\u00A0закрыла гештальт');
  onNextClick(meetingPerfectionismAfter2);
}

function meetingPerfectionismAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ну\u00A0хоть будет что переслать тем, кто "не\u00A0смог подключиться"');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene2Done);
}

function meetingPragmatism() {
  addPoint('pragmatism');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Была рада всех видеть, буду ждать мемо, всем спасибо!');
  onNextClick(meetingPragmatismAfter);
}

function meetingPragmatismAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты\u00A0быстро встаёшь, и\u00A0остальные сразу следом. Облегчение ощущается физически\u00A0— встреча окончена');
  onNextClick(meetingPragmatismAfter2);
}

function meetingPragmatismAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Никакого "потом обсудим". Просто конец');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene2Done);
}

function scene2Done() {
  // Сцена 2 завершена
  hideCapsule();
  hideCharacter();
  hideManager();
  intro.style.display = 'none';
  // Переход к сцене 3
  startScene3();
}

/* ===== Сцена 3: Обед и стажёр ===== */
function startScene3() {
  // Отслеживание прохождения сцены 3
  if (typeof gtag !== 'undefined') {
    gtag('event', 'scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_3',
      'scene_number': 3
    });
  }

  changeScene('assets/background-office.png');
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты выходишь из переговорки и\u00A0чувствуешь шум офиса\u00A0— клавиатуры, звонки, шаги');
  onNextClick(scene3Intro2);
}

function scene3Intro2() {
  showIntro('Мир снова движется, а\u00A0внутри тебя\u00A0— тишина и\u00A0лёгкое напряжение');
  onNextClick(scene3Intro3);
}

function scene3Intro3() {
  showIntro('Часы показывают почти час дня. Голова гудит от встреч. Календарь намекает на паузу');
  onNextClick(scene3LunchQuestion);
}

function scene3LunchQuestion() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Как провести этот священный час?');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  showChoicesHTML(`
    <button class="choice" onclick="scene3StayWork()">Остаться и\u00A0доделать макет</button>
    <button class="choice" onclick="scene3GoEat()">Если не\u00A0поем\u00A0— помру</button>
  `);
}

function scene3StayWork() {
  addPoint('perfectionism');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Планировала поесть\u00A0— но взгляд зацепился за неровную сетку');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3StayWork2);
}

function scene3StayWork2() {
  setDialogue('Всего одна правка. Ну, или шесть. Но потом точно пойду');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3StayWork3);
}

function scene3StayWork3() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Коллеги зовут в столовку\u00A0— ты киваешь, не\u00A0отрываясь от макета, но всё-таки идёшь');
  onNextClick(scene3GoCafeteria);
}

function scene3GoEat() {
  addPoint('pragmatism');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Пусть пиксели подождут. Я тоже продукт');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3GoEat2);
}

function scene3GoEat2() {
  setDialogue('А то без еды я не\u00A0дизайнер, а\u00A0угроза экосистеме');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3GoEat3);
}

function scene3GoEat3() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Закрываешь ноут, идёшь в столовку');
  onNextClick(scene3GoCafeteria);
}

function scene3GoCafeteria() {
  changeScene('assets/background-coffeepoint.png');
  intro.style.display = 'block';
  showIntro('Кто-то рассказывает, как ездил в\u00A0Сочи, кто-то спорит про сериал');
  onNextClick(scene3Cafeteria2);
}

function scene3Cafeteria2() {
  showIntro('Ты киваешь, ешь, ловишь паузы между шумом');
  onNextClick(() => {
    showIntro('Почти расслабилась\u00A0— и тут появляется коллега');
    onNextClick(scene3InternAsk);
  });
}

function scene3InternAsk() {
  intro.style.display = 'none';
  hideCharacter();
  showIntern();
  setIntern('assets/intern-default.png');
  showCapsule();
  setDialogue('Слушай, у меня дедлайн горит, я не\u00A0справляюсь. Можешь глянуть?');
  onNextClick(scene3AfterInternAsk);
}

function scene3AfterInternAsk() {
  hideIntern();
  showCharacter();
  setCharacter('assets/girl-surprise.png');
  setDialogue('Как отреагировать?');
  showChoicesHTML(`
    <button class="choice" onclick="scene3HelpIntern()">Конечно, помогу</button>
    <button class="choice" onclick="scene3LaterIntern()">Я сейчас занята, потом</button>
  `);
}

function scene3HelpIntern() {
  addPoint('empathy');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Да, конечно. Покажи, что не получается?');
  onNextClick(scene3HelpIntern2);
}

function scene3HelpIntern2() {
  hideCharacter();
  showIntern();
  setIntern('assets/intern-default.png');
  setDialogue('Тут не понимаю, как адаптировать под мобилу. Всё съезжает, уже голова кипит');
  onNextClick(scene3HelpIntern3);
}

function scene3HelpIntern3() {
  hideIntern();
  showCharacter();
  setDialogue('Окей, давай подумаем вместе. Сетка у тебя нестабильна из-за контейнера\u00A0— его бы зафиксировать, а\u00A0дальше всё сложится');
  onNextClick(scene3HelpIntern4);
}

function scene3HelpIntern4() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Пятнадцать минут объяснений, пара советов — и Стажёр уже улыбается');
  onNextClick(() => {
    showIntro('Обед сгорает, но почему-то не жалко');
    onNextClick(scene3InternThanks);
  });
}

function scene3InternThanks() {
  intro.style.display = 'none';
  hideCharacter();
  showIntern();
  setIntern('assets/intern-default.png');
  showCapsule();
  setDialogue('Спасибо, ты лучшая!');
  hideChoicesKeepSlot();
  onNextClick(scene3HelpIntern5);
}

function scene3HelpIntern5() {
  hideIntern();
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Иногда одна встреча важнее трёх кнопок. И одной котлеты');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene3Reflect);
}

function scene3LaterIntern() {
  addPoint('indifference');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Сорри, я как раз в потоке. Может чуть позже?');
  onNextClick(scene3LaterIntern2);
}

function scene3LaterIntern2() {
  hideCharacter();
  showIntern();
  setIntern('assets/intern-sad.png');
  setDialogue('Ага, поняла. Не буду мешать…');
  onNextClick(scene3LaterIntern3);
}

function scene3LaterIntern3() {
  hideCapsule();
  hideCharacter();
  hideIntern();
  intro.style.display = 'block';
  showIntro('Стажёрик молча уходит. Ты ещё пару секунд смотришь в тарелку\u00A0— но всё уже не так важно');
  onNextClick(scene3Reflect);
}

function scene3Reflect() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-sad.png');
  showCapsule();
  setDialogue('А ведь когда-то и\u00A0я\u00A0сидела так же\u00A0— с кривой сеткой, в\u00A0панике и\u00A0с сгорающим дедлайном');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3Reflect2);
}

function scene3Reflect2() {
  setCharacter('assets/girl-sad.png');
  setDialogue('Тоже боялась спросить, тоже надеялась, что кто-то подскажет');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3Reflect2b);
}

function scene3Reflect2b() {
  setCharacter('assets/girl-sad.png');
  setDialogue('О как');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3Reflect3);
}

function scene3Reflect3() {
    setCharacter('assets/girl-default.png');
  setDialogue('Так, ладно, обед закончился, пора и честь знать');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3WrapUpIntro);
}

function scene3WrapUpIntro() {
  hideCapsule();
  hideCharacter();
  // смена локации на рабочий стол
  changeScene('assets/background-desktop.png');
  intro.style.display = 'block';
  // Экран 1
  showIntro('Возвращаясь на рабочее место, ты чувствуешь себя чуть легче\u00A0— будто внутри стало больше воздуха');
  // Сразу переходим к сцене 4 (Slack)
  onNextClick(startScene4);
}

function scene3WrapUpIntro2() {
  // Экран 2
  showIntro('На экране уже мигает уведомление:\n«Встреча по задачам на вторую половину дня»');
  onNextClick(scene3Done);
}

function scene3Done() {
  // Сцена 3 завершена, готово к сцене 4
  hideCapsule();
  hideCharacter();
  hideIntern && hideIntern();
  hideManager();
  intro.style.display = 'none';
  // TODO: переход к сцене 4
}

function scene3Outro() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Похоже, обед закончился. Вперёд, в следующие приключения');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  // TODO: переход к сцене 4
}

/* ===== Рабочий стол (ветка: Проверю почту) ===== */
function startDesktopScene() {
  changeScene('assets/background-desktop.png');
  hideCapsule();
  hideCharacter();
  
  // Сразу показываем текст
  intro.style.display = 'block';
  showIntro('Ты\u00A0открываешь почту\u00A0— двадцать непрочитанных, три "важных", и\u00A0одно письмо с\u00A0пометкой «Срочно». Открываешь');
  onNextClick(desktopIntro2);
}

function desktopIntro2() {
  showIntro('«Всё супер, только можешь сделать кнопки побольше и\u00A0убрать лишние отступы? Хочется, чтобы "дышало", но не слишком»');
  onNextClick(desktopIntro3);
}

function desktopIntro2() {
  showIntro('«Всё супер, только можешь сделать кнопки побольше и\u00A0убрать лишние отступы? Хочется, чтобы "дышало", но не слишком»');
  onNextClick(desktopIntro3);
}

function desktopIntro3() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Кнопки побольше, отступы поменьше, чтоб "дышало", но не сильно…');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(desktopChoice1);
}

function desktopChoice1() {
  setDialogue('Ты\u00A0некоторое время просто смотришь на\u00A0экран');
  showChoicesHTML(`
    <button class="choice" onclick="emailAnswer()">Ответить с\u00A0аргументами</button>
    <button class="choice" onclick="emailDelete()">Удалить письмо</button>
  `);
}

function emailAnswer() {
  addPoint('awareness');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
    setDialogue('«Спасибо! Только если увеличить кнопки, придётся передвинуть пол-интерфейса, а\u00A0отступы как раз и\u00A0дают дыхание. Иначе задохнёмся»');
  onNextClick(emailAnswerAfter);
}

function emailAnswerAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
    showIntro('Через пару минут приходит короткое: «Ок, доверимся вкусу дизайнера»');
  onNextClick(emailAnswerAfter2);
}

function emailAnswerAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
    setDialogue('Окей, иногда люди реально готовы услышать аргументы. Уже неплохо. Живём');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(endOfDesktopScene);
}

function emailDelete() {
  addPoint('toxicity');
  setCharacter('assets/girl-toxic.png');
  hideChoicesKeepSlot();
    setDialogue('Тишина\u00A0— лучший способ сохранить ментальное здоровье');
  onNextClick(emailDeleteAfter);
}

function emailDeleteAfter() {
  setCharacter('assets/girl-toxic.png');
    setDialogue('Если промолчать\u00A0— никто не\u00A0расстроится. А\u00A0я\u00A0сэкономлю себе минимально один нейрон');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(endOfDesktopScene);
}

function endOfDesktopScene() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('После короткой разминки утро набирает обороты. На\u00A0экране уже мигают задачи\u00A0— день начинается по-настоящему');
  onNextClick(scene1Done);
}

function chatWithColleagues() {
  addPoint('extroversion');
  hideChoicesKeepSlot();
  setDialogue('Отличное начало дня! Новости и\u00A0сплетни помогают быть в\u00A0курсе того, что происходит в\u00A0компании');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(startCoffeeScene);
}

function checkEmail() {
  addPoint('introversion');
  hideChoicesKeepSlot();
  setDialogue('Так, никакой болтовни, только я и эти 1829110 писем');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(startDesktopScene);
}

/* ---------- Сцена 4: разработчик и чат ---------- */
function startScene4() {
  // Отслеживание прохождения сцены 4
  if (typeof gtag !== 'undefined') {
    gtag('event', 'scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_4',
      'scene_number': 4
    });
  }

  // Фон уже на десктопе из предыдущей сцены — без затемнения и смены сцены
  hideCapsule();
  hideCharacter();
  hideIntern && hideIntern();
  hideManager && hideManager();
  hideDev && hideDev();
  intro.style.display = 'block';
  showIntro('Открываешь Slack. В чате уже кипит жизнь');
  onNextClick(scene4Dev1);
}

function scene4Dev1() {
  intro.style.display = 'none';
  showDev();
  setDev('assets/dev-default.png');
  showCapsule();
  setDialogue('А у нас такого компонента нет');
  hideChoicesKeepSlot();
  onNextClick(scene4Girl1);
}
function scene4Girl1() {
  hideDev();
  showCharacter();
  setCharacter('assets/girl-smile.png');
  showCapsule();
  setDialogue('Ага, поехали…');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene4Dev2);
}
function scene4Dev2() {
  hideCharacter();
  showDev();
  setDev('assets/dev-smile.png');
  showCapsule();
  setDialogue('А зачем вообще это делать? Оно же работает как есть');
  hideChoicesKeepSlot();
  onNextClick(scene4Intro2);
}
function scene4Intro2() {
  hideDev();
  hideCapsule();
  intro.style.display = 'block';
  showIntro('Подключается ещё кто-то:');
  onNextClick(scene4Intro3);
}
function scene4Intro3() {
  showIntro('«Дизайнеры опять наворотили, а нам теперь переделывать»');
  onNextClick(scene4Girl2);
}
function scene4Girl2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-smile.png');
  showCapsule();
  setDialogue('А может, просто кинуть стикер с обезьяной и выйти из чата?');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene4Girl3);
}
function scene4Girl3() {
  showCharacter();
  setCharacter('assets/girl-toxic.png');
  showCapsule();
  setDialogue('Как отреагировать?');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  showChoicesHTML(`
    <button class="choice" onclick="scene4Choice1()">Отвечу по фактам, без наезда</button>
    <button class="choice" onclick="scene4Choice2()">Сделать больно, но весело</button>
  `);
}
function scene4Choice1() {
  addPoint('awareness');
  showCharacter();
  setCharacter('assets/girl-default.png');
  setDialogue('Если бы у нас был компонент, не пришлось бы придумывать');
  hideChoicesKeepSlot();
  onNextClick(() => {
    setDialogue('Это не просто хотелка, мы решаем конкретную проблему');
    onNextClick(() => {
      setDialogue('Мне бы тоже хотелось "не трогать, если работает", но оно не работает');
      onNextClick(() => {
        hideCapsule();
        hideCharacter();
        intro.style.display = 'block';
        showIntro('В чате становится тише');
        onNextClick(() => {
          showIntro('Через пару минут разработчик скидывает скрин и пишет:');
          onNextClick(() => {
            intro.style.display = 'none';
            showDev();
            setDev('assets/dev-default.png');
            showCapsule();
            setDialogue('Окей, вот так пойдёт?');
            hideChoicesKeepSlot();
            onNextClick(() => {
              hideDev();
              showCharacter();
              setCharacter('assets/girl-smile.png');
              setDialogue('Рабочая сессия без драмы — уже успех');
              dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
              hideChoicesKeepSlot();
              onNextClick(scene4Transition);
            });
          });
        });
      });
    });
  });
}
function scene4Choice2() {
  addPoint('toxicity');
  showCharacter();
  setCharacter('assets/girl-toxic.png');
  setDialogue('Ну да, конечно. Всё, что сложнее двух дивов — это уже “наворотили”');
  hideChoicesKeepSlot();
  onNextClick(() => {
    hideCharacter();
    showDev();
    setDev('assets/dev-surprise.png');
    showCapsule();
    setDialogue('Ну ты тоже не кипятись, просто уточняем…');
    hideChoicesKeepSlot();
    onNextClick(() => {
      hideDev();
      showCharacter();
      setCharacter('assets/girl-toxic.png');
      setDialogue('Уточняем, ага. Сначала хейт, потом "не кипятись". Классика');
      dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
      hideChoicesKeepSlot();
      onNextClick(() => {
        hideCapsule();
        hideCharacter();
        intro.style.display = 'block';
        showIntro('В чате наступает неловкая пауза...');
        onNextClick(() => {
          showIntro('Кто-то кидает стикер с собакой в огне...');
          onNextClick(() => {
            intro.style.display = 'none';
            showDev();
            setDev('assets/dev-default.png');
            showCapsule();
            setDialogue('Ладно-ладно, понял. Сделаем, как надо — только без войны, окей?');
            hideChoicesKeepSlot();
            onNextClick(() => {
              hideDev();
              showCharacter();
              setCharacter('assets/girl-toxic.png');
              setDialogue('Кажется, я снова выиграла пассивно-агрессивный чемпионат офиса');
              dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
              hideChoicesKeepSlot();
              onNextClick(scene4Transition);
            });
          });
        });
      });
    });
  });
}
function scene4Transition() {
  // Переход к дизайн‑ревью (новый флоу)
  hideCharacter();
  showDev();
  setDev('assets/dev-default.png');
  showCapsule();
  setDialogue('Пока мы дописываем, можешь глянуть новый раздел, только выкатили');
  hideChoicesKeepSlot();
  onNextClick(scene4ReviewGirlAgree);
}
function scene4Research() {
  addPoint('empathy');
  setCharacter('assets/girl-smile.png');
  setDialogue('Соберу гипотезы и закину коллегам. Надо понять, насколько решение реально закрыло боли');
  hideChoicesKeepSlot();
  onNextClick(() => {
    setCharacter('assets/girl-default.png');
    setDialogue('Люблю, когда можно проверить по факту, а не по ощущениям');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(scene4Finale);
  });
}
function scene4ShipIt() {
  addPoint('indifference');
  setCharacter('assets/girl-default.png');
  setDialogue('Ну, багов нет — уже неплохо');
  hideChoicesKeepSlot();
  onNextClick(() => {
    setCharacter('assets/girl-default.png');
    setDialogue('Если оно живёт — может, не трогать судьбу?');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(scene4Finale);
  });
}
function scene4Finale() {
  setCharacter('assets/girl-default.png');
  setDialogue('Как ни крути, а момент, когда фича уходит в прод — всегда немного магический');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(() => {
    setCharacter('assets/girl-smile.png');
    setDialogue('Никогда не знаешь, будет ли тихо… или бахнет');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(() => {
        setCharacter('assets/girl-default.png');
        setDialogue('Написать ребятам, что молодцы?');
      dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
      showChoicesHTML(`
        <button class="choice" onclick="scene4Praise()">Напишу, пусть знают</button>
        <button class="choice" onclick="scene4Silent()">Промолчу</button>
      `);
    });
  });
}
function scene4Praise() {
  addPoint('extroversion');
  setCharacter('assets/girl-smile.png');
  setDialogue('Вы красавцы. И правда всё работает гладко, спасибо!');
  hideChoicesKeepSlot();
  onNextClick(() => {
    setCharacter('assets/girl-default.png');
    setDialogue('Иногда одно тёплое сообщение спасает целую неделю');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(startScene5);
  });
}
function scene4Silent() {
  addPoint('introversion');
  setCharacter('assets/girl-default.png');
  setDialogue('Да ну, подумают, что подлизываюсь… Лучше тихо порадуюсь');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(() => {
    setCharacter('assets/girl-default.png');
    setDialogue('Кажется, сегодня я интроверт на максималках');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(startScene5);
  });
}

// Вызов startScene4() — после завершения scene3Done()
// Например, в scene3Done добавить: startScene4();

/* ---------- Preload первого фона для быстрого старта ---------- */
window.addEventListener('load', () => {
  // Убираем loading screen после загрузки критичных ресурсов
  const sceneA = document.getElementById('sceneA');
  const character = document.getElementById('character');
  
  Promise.all([
    sceneA.decode ? sceneA.decode() : Promise.resolve(),
    character.decode ? character.decode() : Promise.resolve()
  ]).then(() => {
    document.body.classList.add('loaded');
  }).catch(() => {
    // Fallback: убираем loading даже если decode не поддерживается
    document.body.classList.add('loaded');
  });
});
