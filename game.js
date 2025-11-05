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

/* ---------- hardening: prevent image saving/drag ---------- */
(function protectAssets(){
  try {
    const scopeSel = '#sceneA, #sceneB, #character, #manager, #intern, #dev, .ending-card img';
    const imgs = document.querySelectorAll(scopeSel + ', img');
    imgs.forEach(img => {
      img.setAttribute('draggable', 'false');
      img.addEventListener('dragstart', (e) => e.preventDefault());
    });
    // Block context menu on images
    document.addEventListener('contextmenu', (e) => {
      const el = e.target;
      if (el && (el.tagName === 'IMG' || el.closest('#scene-stack, #character, #manager, #intern, #dev'))) {
        e.preventDefault();
      }
    });
  } catch (e) { /* no-op */ }
})();

/* ---------- normalize: remove inline guillemets inside <em> ---------- */
(function normalizeEmQuotes(){
  if (!dialogue) return;
  const strip = () => {
    dialogue.querySelectorAll('em').forEach(em => {
      const t = em.textContent || '';
      const nt = t.replace(/^«/, '').replace(/»$/, '');
      if (nt !== t) em.textContent = nt;
    });
  };
  const mo = new MutationObserver(() => strip());
  mo.observe(dialogue, { childList: true, subtree: true, characterData: true });
  // initial pass
  strip();
})();

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

// История выборов для аналитики
const choicePath = [];
let currentScene = '';

function addPoint(trait, choiceLabel) {
  if (trait in state) state[trait]++;
  
  // Сохраняем выбор в историю и отправляем в GA
  const choice = {
    scene: currentScene,
    trait: trait,
    label: choiceLabel || trait
  };
  choicePath.push(choice);
  
  // Отслеживание выбора в GA
  if (typeof trackEvent === 'function') {
    trackEvent('player_choice', {
      'event_category': 'choice',
      'event_label': `${currentScene}: ${choice.label}`,
      'scene': currentScene,
      'trait': trait,
      'choice_text': choiceLabel || trait
    });
  }
  
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

      // снимаем затемнение быстрее для мобильных
      setTimeout(() => dimmer.classList.remove('is-on'), 1200);
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
  // Двойной requestAnimationFrame для корректной CSS анимации
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      character.classList.add('visible');
    });
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
  if (typeof trackEvent === 'function') {
    trackEvent('scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_5',
      'scene_number': 5
    });
  }
  if (typeof hideDev === 'function') hideDev();
  if (typeof hideManager === 'function') hideManager();
  if (typeof hideIntern === 'function') hideIntern();
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
    showIntro('Оставляешь чат, допиваешь остывший кофе и снова втыкаешь в ноут');
  onNextClick(scene5Intro2);
}

function scene5Intro2() {
  showIntro('Что-то исправляешь, что-то комментируешь, кто-то что-то пишет');
  onNextClick(scene5Evening);
}

function scene5Evening() {
  // Смена фона в офис — вечер
  changeScene('assets/background-office.png');
  hideCapsule();
  hideCharacter();
  // Сразу показываем следующий интро-текст на этом же тапе
  intro.style.display = 'block';
  showIntro('Вечер. Голова тяжёлая. Ты просто сидишь, глядя в экран, где медленно крутится прелоадер');
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
  setDialogue('Всегда интересно, что получилось, но и немного страшно...');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
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
  currentScene = 'scene4_review';
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Начинаем...');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  showChoicesHTML(`
    <button class="choice" onclick="scene4ReviewEmpathy()">Пройдусь по всему</button>
    <button class="choice" onclick="scene4ReviewIndifference()">И так сойдёт</button>
  `);
}

function scene4ReviewEmpathy() {
  addPoint('empathy', 'Пройдусь по всему');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('В целом всё ок, есть пара мелких моментов. Соберу скрины, оформлю док');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  onNextClick(() => {
    setDialogue('Здесь норм, но шрифт съехал. Тут иконка фоткой. Переход дёргается. Мелочь, но видно');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
    onNextClick(() => {
      setDialogue('Лучше сказать сейчас, чем потом искать виноватых');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
      hideChoicesKeepSlot();
      onNextClick(scene4Finale);
    });
  });
}

// (deprecated duplicate of scene4Transition removed)

function scene4ReviewIndifference() {
  addPoint('indifference', 'И так сойдёт');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Выглядит норм, работает, не разваливается, а это уже победа');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  onNextClick(() => {
    setDialogue('Не всегда нужно влезать. Иногда можно просто пройти мимо');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
    hideChoicesKeepSlot();
    onNextClick(scene4Finale);
  });
}

function scene5Reflect1() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Кажется, это был норм день. Или нет?..');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5Approach);
}

function scene5Approach() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты уже почти закрываешь ноут, как вдруг к тебе подходит коллега с горящими глазами');
  onNextClick(scene5Pitch1);
}

function scene5Pitch1() {
  intro.style.display = 'none';
  showManager();
  setManager('assets/manager-surprise.png');
  showCapsule();
  setDialogue('Слушай, а давай уволимся и запилим свой стартап?');
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
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5ChoiceStart);
}

function scene5ChoiceStart() {
  setCharacter('assets/girl-default.png');
  setDialogue('Что ответить?');
  // Без кавычек и курсива — обычный текст
  dialogue.innerHTML = dialogue.textContent;
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
  showIntro('С фильтром "не обсирай, если бариста милый"');
  onNextClick(scene5PlanList3);
}

function scene5PlanList3() {
  showIntro('Подписка, NFT-карточки, пинты кофе за рефералы');
  onNextClick(scene5GirlReacts2);
}

function scene5GirlReacts2() {
  intro.style.display = 'none';
  showCharacter();
  showCapsule();
  setCharacter('assets/girl-surprise.png');
  setDialogue('Господи… Ну и дичь');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5GirlReacts3);
}

function scene5GirlReacts3() {
  setCharacter('assets/girl-smile.png');
  setDialogue('Но подано уверенно');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
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
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5Reflect4);
}

function scene5Reflect4() {
  setCharacter('assets/girl-default.png');
  setDialogue('На самом деле хорошо, что у людей есть мечты');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  hideChoicesKeepSlot();
  onNextClick(scene5Reflect5);
}

function scene5Reflect5() {
  setCharacter('assets/girl-default.png');
  setDialogue('А вдруг в этом что-то есть?');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
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
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  onNextClick(() => {
    setDialogue('Запишу на всякий случай');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
    onNextClick(scene5WrapUp);
  });
}

function scene5Toxic() {
  addPoint('toxicity');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Идея из вселенной, где люди платят криптой за капучино');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  onNextClick(() => {
    setDialogue('Хотя, кажется, люди и правда платят криптой за кофе…');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
    onNextClick(scene5WrapUp);
  });
}

function scene5WrapUp() {
  setCharacter('assets/girl-default.png');
  setDialogue('А теперь пора закрывать ноут');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  hideChoicesKeepSlot();
  onNextClick(() => {
    setDialogue('Хватит подвигов на сегодня');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
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
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  hideChoicesKeepSlot();
  onNextClick(finaleReflect2);
}

function finaleReflect2() {
  setDialogue('Спасибо, что был мной весь день. И респект, что дошёл до конца');
  // Без кавычек и курсива — обычный текст
  dialogue.innerHTML = dialogue.textContent;
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
  // Автоматический переход через 1.5 секунды
  setTimeout(finaleProcessing2, 1500);
}

function finaleProcessing2() {
  showIntro('Анализ поведения…');
  // Автоматический переход через 1.5 секунды
  setTimeout(finaleProcessing3, 1500);
}

function finaleProcessing3() {
  showIntro('Подбор архетипа…');
  // Автоматический переход через 1.5 секунды
  setTimeout(() => {
    intro.classList.remove('centered-text'); // Убираем центрирование после loading экранов
    showArchetype();
  }, 1500);
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
      'Пиксели — идеальны.\nКоллеги — в терапии',
      'Ты как ревью с огнемётом. Иконка Figma трясётся при входе',
    ]
  },
  {
    id: 'ninja',
    icon: 'assets/ninja.png',
    title: 'Корпоративный ниндзя',
    subtitle: '«Я чиню мир, пока вы созваниваетесь»',
    blocks: [
      'Ты не кричишь, не споришь, не давишь, но именно ты спасаешь проект, когда всё разваливается',
      'Знаешь все паттерны, но никому их не навязываешь',
      'Тебя не видно. Но если уйдёшь, все это почувствуют',
    ]
  },
  {
    id: 'punk',
    icon: 'assets/punk.png',
    title: 'Product-панк',
    subtitle: '«Я не срываю процесс. Я выражаюсь»',
    blocks: [
      'Ты называешь хаос «гибкостью». Врываешь дизайн-систему ради экспрессии',
      'Бесишь всех, но двигаешь продукт',
      'Ты не согласен с ТЗ, но согласен с собой. Этого достаточно',
    ]
  },
  {
    id: 'skull',
    icon: 'assets/skull.png',
    title: 'Фигма-гуру на грани',
    subtitle: '«Я все сделал и сейчас исчезну»',
    blocks: [
      'Если ты не выгорел в этом спринте — значит, не твой проект',
      'Ты оформляешь за троих, думаешь за пятерых, умираешь в одиночку',
      'Ты сделал красиво. Как всегда. Потому что не умеешь иначе',
    ]
  },
  {
    id: 'lips',
    icon: 'assets/lips.png',
    title: 'Старший Интроверт по макетам',
    subtitle: '«Я молчу, потому что уже сделал»',
    blocks: [
      'Ты не участвуешь в обсуждениях, ты их предотвращаешь',
      'Все уже работает, но никто ещё не понял, что это благодаря тебе',
      'Ты не интроверт. Ты просто уже видел, чем всё это заканчивается',
    ]
  },
  {
    id: 'bird',
    icon: 'assets/bird.png',
    title: 'Душнила с добрым сердцем',
    subtitle: '«Я объясню тебе, почему ты не прав»',
    blocks: [
      'Ты хочешь, чтобы всё было понятно. Даже если придётся всё объяснить трижды',
      'Ты не придираешься. Ты восстанавливаешь справедливость',
      'Всё просто, если сначала прочитать, а потом говорить',
    ]
  },
  {
    id: 'battery',
    icon: 'assets/battery.png',
    title: 'Креативный выгоревший',
    subtitle: '«Я всё ещё горю. Наверное...»',
    blocks: [
      'Идеи есть всегда. Просто теперь они лежат и не двигаются',
      'В команде тебя любят, но боятся однажды потерять',
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
      'Ты не против эмоций. Просто в регламенте их не было',
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
  // Resolve best format (WebP/PNG) for the icon (fast path: try .webp immediately, fallback to original)
  (function(){
    const src = data.icon || 'assets/aesthete.png';
    const webp = src.endsWith('.png') ? src.replace(/\.png$/i, '.webp') : src;
    img.src = webp;
    img.onerror = () => { img.src = src; };
  })();

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
    // Матрица: [E, I, Emp, Ind, Tox, Awa, Perf, Prag]
  { id: 0, name: 'aesthete', traits: [1, 2, 0, 3, 3, 0, 3, 0] },      // Эстет-террорист
  { id: 1, name: 'ninja',   traits: [0, 3, 3, 0, 0, 3, 2, 1] },       // Корп. ниндзя
  { id: 2, name: 'punk',    traits: [3, 0, 0, 2, 3, 0, 0, 3] },       // Product-панк
  { id: 3, name: 'skull',   traits: [2, 1, 0, 3, 1, 2, 3, 0] },       // Фигма-гуру
  { id: 4, name: 'lips',    traits: [0, 3, 0, 3, 0, 2, 3, 1] },       // Старший интроверт
  { id: 5, name: 'bird',    traits: [1, 2, 3, 0, 0, 3, 2, 0] },       // Душнила
  { id: 6, name: 'battery', traits: [2, 1, 1, 2, 1, 1, 1, 3] },       // Креативный выгоревший
  { id: 7, name: 'ice',     traits: [1, 2, 0, 3, 1, 1, 0, 3] }        // Методичный циник
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
  if (typeof trackEvent === 'function') {
    const archetypeName = archetypes[selectedArchetype].name;
    const archetypeTitles = {
      'aesthete': 'Эстет-террорист',
      'ninja': 'Корпоративный ниндзя',
      'punk': 'Product-панк',
      'skull': 'Фигма-гуру',
      'lips': 'Старший интроверт',
      'bird': 'Душнила',
      'battery': 'Креативный выгоревший',
      'ice': 'Методичный циник'
    };
    const archetypeTitle = archetypeTitles[archetypeName] || archetypeName;
    
    // Вычисляем время игры (в секундах)
    const gameTime = window.__gameStartTime ? Math.round((Date.now() - window.__gameStartTime) / 1000) : 0;
    const gameTimeMin = Math.floor(gameTime / 60);
    const gameTimeSec = gameTime % 60;
    
    // Формируем строку пути выборов (компактная версия)
    const pathString = choicePath.map(c => c.trait.substring(0,3)).join('-');
    
    // Основное событие завершения
    trackEvent('game_complete', {
      'event_category': 'game',
      'event_label': 'finished',
      'archetype': archetypeName,
      'archetype_id': selectedArchetype,
      'archetype_title': archetypeTitle,
      'game_duration_sec': gameTime,
      'game_duration_readable': `${gameTimeMin}:${gameTimeSec.toString().padStart(2, '0')}`,
      'choice_path': pathString,
      'total_choices': choicePath.length,
      'extroversion': state.extroversion,
      'introversion': state.introversion,
      'empathy': state.empathy,
      'indifference': state.indifference,
      'toxicity': state.toxicity,
      'awareness': state.awareness,
      'perfectionism': state.perfectionism,
      'pragmatism': state.pragmatism
    });
    
    // Событие для конкретного результата архетипа (для подсчета в GA)
    trackEvent('archetype_result', {
      'event_category': 'result',
      'event_label': archetypeTitle,
      'archetype_name': archetypeName,
      'archetype_id': selectedArchetype,
      'game_duration_sec': gameTime
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
  // Отслеживаем перепрохождение
  if (typeof trackEvent === 'function') {
    trackEvent('game_replay', {
      'event_category': 'engagement',
      'event_label': 'replay_clicked'
    });
  }
  
  // Перезагрузка страницы для нового прохождения
  setTimeout(() => window.location.reload(), 100);
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
// Отладка типографики: включается параметром ?typo=1
const __TYPO_DEBUG__ = (() => {
  try { return new URLSearchParams(location.search).get('typo') === '1'; } catch(_) { return false; }
})();
// Небольшой типографский форматтер для предотвращения некрасивных переносов
function formatTypography(text) {
  if (!text) return text;
  let t = String(text);
  // 0) Учитываем ручные маркеры неразрывного пробела, чтобы можно было ставить их вручную:
  //    - Option+Space (U+00A0)
  //    - Узкий NBSP (U+202F)
  //    - Литерал &nbsp; в строке
  t = t.replace(/\u202F/g, '\u00A0').replace(/&nbsp;/g, '\u00A0');
  // 1) После запятой перед союзами оставляем неразрывный пробел, чтобы союз не висел в начале строки
  t = t.replace(/,\s+(но|а|и|или|да)\b/gi, ',\u00A0$1');
  // 2) Предлоги склеиваем со следующим словом/числом через неразрывный пробел
  // Поддерживаем короткие и распространённые: в, к, с, у, о, на, по, из, за, до, от, со, об, во, при, про, для, без, над, под, через, между, перед, около
  const preps = [
    'в','к','с','у','о','и','а',
    'на','по','из','за','до','от','со','об','во','при','про','для','без','над','под','через','между','перед','около'
  ];
  const prepsRe = new RegExp('\\b(' + preps.join('|') + ')\\s+(?=[0-9A-Za-zА-Яа-яЁё«"\(\[])', 'gi');
  t = t.replace(prepsRe, '$1\u00A0');
  // 3) Не позволяем переносить короткие местоимения с дефисом (кто-то, что-то и т.п.)
  const NBH = '\u2011'; // неразрывный дефис
  const hyphenWords = [
    'кто-то','что-то','где-то','как-то','когда-то','куда-то',
    'какой-то','какая-то','какие-то','какое-то'
  ];
  hyphenWords.forEach((w) => {
    const re = new RegExp(w.replace('-', '\\-'), 'gi');
    // сохраняем регистр исходного совпадения
    t = t.replace(re, (m) => m.replace('-', NBH));
  });
  if (__TYPO_DEBUG__ && t !== text) {
    const vis = (s) => s.replace(/\u00A0/g, '⍽');
    console.log('[typo]', vis(text), '→', vis(t));
  }
  return t;
}

function setDialogue(text) {
  dialogue.textContent = formatTypography(text);
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
    // типографика для текста кнопок
    btn.textContent = formatTypography(btn.textContent);
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
let __globalActionLock = false;
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
    if (fired || __globalActionLock) return;
    fired = true;
    __globalActionLock = true;
    document.body.removeEventListener('click', handleClick, { passive: true });
    document.body.removeEventListener('keydown', handleKey);
    if (typeof cb === 'function') {
      cb();
      setTimeout(() => { __globalActionLock = false; }, 250);
    }
  }
  setTimeout(() => {
    document.body.addEventListener('click', handleClick, { passive: true });
    document.body.addEventListener('keydown', handleKey);
  }, 80);
}

/* ---------- сценарий ---------- */
const introDialogues = [
  'Привет, ты попал в симулятор продуктового дизайнера',
  'Проживи этот день с кайфом, но помни, что все твои действия влияют на ход игры'
];
let i = 0;

function showIntro(text) {
  intro.textContent = formatTypography(text);
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
  // Отслеживание начала игры + запоминаем время старта
  window.__gameStartTime = Date.now();
  
  if (typeof trackEvent === 'function') {
    trackEvent('game_start', {
      'event_category': 'game',
      'event_label': 'gameplay_started'
    });
  }

  hideIntro();

  showCharacter();
  setCharacter('assets/girl-default.png');

  showCapsule();
  setDialogue('Я Вика, сегодня ты — это я');
  hideChoicesKeepSlot();

  document.body.removeEventListener('click', nextIntro);
  document.body.removeEventListener('keydown', spaceHandler);

  onNextClick(() => {
    setDialogue('Мы проведем этот день вместе, а в конце узнаем к какому типу дизайнера ты относишься');
    hideChoicesKeepSlot();
    onNextClick(() => {
      setDialogue('Погнали!');
      hideChoicesKeepSlot();
      onNextClick(showWorkChoice);
    });
  });
}

function showWorkChoice() {
  setDialogue('Ну что, пора на работу, пойти ли в офис сегодня?');
  showChoicesHTML(`
    <button class="choice" onclick="workFromHome()">Работать удаленно</button>
    <button class="choice" onclick="goToOffice()">Пойти в офис</button>
  `);
}

function showOfficeResponse() {
  setCharacter('assets/girl-smile.png'); // мгновенная замена, без fade
  setDialogue('О, ты решил пойти в офис, как неожиданно и приятно, уверена, что коллеги соскучились по тебе');
  hideChoicesKeepSlot();
}

function workFromHome() {
  // Показываем отказ от удалёнки
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  
  // Устанавливаем текст напрямую в элемент
  const dialogueEl = document.getElementById('dialogue');
  if (dialogueEl) {
    dialogueEl.textContent = 'Прости, родной, тут нет бюджета на удалёнку';
    dialogueEl.innerHTML = dialogueEl.textContent; // без форматирования
  }
  
  onNextClick(transitionToOffice);
}

function goToOffice() {
  // Радостная реакция при выборе офиса
  hideChoicesKeepSlot();
  setCharacter('assets/girl-smile.png');
  
  // Устанавливаем текст напрямую в элемент
  const dialogueEl = document.getElementById('dialogue');
  if (dialogueEl) {
    dialogueEl.textContent = 'О, ты решил пойти в офис, как неожиданно и приятно, уверена, что коллеги соскучились по тебе';
  }
  
  onNextClick(transitionToOffice);
}

function transitionToOffice() {
  // Переход из дома в офис (как scene2Done)
  hideCapsule();
  hideCharacter();
  intro.style.display = 'none';
  startScene1();
}

function startScene1() {
  // Отслеживание прохождения сцены 1
  if (typeof trackEvent === 'function') {
    trackEvent('scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_1',
      'scene_number': 1
    });
  }

  changeScene('assets/background-office.png');
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Вот ты и оказался в любимом офисе');
  onNextClick(showScene1Part2);
}

function showScene1Part2() {
  intro.style.display = 'none';

  showCharacter();
  setCharacter('assets/girl-default.png');

  showCapsule();
  setDialogue('С чего начнёшь свой день?');
  showChoicesHTML(`
    <button class="choice" onclick="chatWithColleagues()">Поболтаю с коллегами на кухне</button>
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
  showIntro('Ты заходишь на кухню');
  onNextClick(coffeeIntro1b);
}

function coffeeIntro1b() {
  showIntro('Пахнет тостами, кто-то спорит у кофемашины');
  onNextClick(coffeeIntro2);
}

function coffeeIntro2() {
  showIntro('И вдруг ты слышишь знакомую фразу');
  onNextClick(coffeeIntro3);
}

function coffeeIntro3() {
  showIntro('«А у нас премии вообще ещё бывают или это миф?»');
  onNextClick(coffeeChoice1);
}

function coffeeChoice1() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-smile.png');
  showCapsule();
  setDialogue('Ты невольно усмехаешься — кажется, утро начинается как обычно');
  showChoicesHTML(`
    <button class="choice" onclick="coffeeSupportJoke()">Поддержать шутку</button>
    <button class="choice" onclick="coffeeBeToxic()">Бывают. Только не у нас</button>
  `);
}

function coffeeSupportJoke() {
  addPoint('awareness');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Конечно бывают. Просто их выдают в виде морального удовлетворения');
  onNextClick(coffeeSupportAfter);
}

function coffeeSupportAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Коллеги смеются, кто-то хлопает тебя по плечу');
  onNextClick(coffeeSupportAfter2);
}

function coffeeSupportAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ладно, хватит философии, кофе выпит — теперь можно и мир спасать');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(endOfCoffeeScene);
}

function coffeeBeToxic() {
  addPoint('toxicity');
  setCharacter('assets/girl-toxic.png');
  hideChoicesKeepSlot();
  setDialogue('Я вот жду уже третий год — думаю, может, это квест такой?');
  onNextClick(coffeeToxicAfter1);
}

function coffeeToxicAfter1() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Кто-то усмехается, кто-то кивает с сочувствием');
  onNextClick(coffeeToxicAfter2);
}

function coffeeToxicAfter2() {
  showIntro('Ты чувствуешь лёгкое облегчение — будто сказал вслух то, о чём все думают');
  onNextClick(coffeeToxicAfter3);
}

function coffeeToxicAfter3() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ну что ж… хотя бы поржали. Пойду посмотрю, какие ужасы прилетели');
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
  showIntro('После короткой разминки утро набирает обороты');
  onNextClick(function() {
    showIntro('На экране уже мигают задачи — день начинается по-настоящему');
    onNextClick(scene1Done);
  });
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
  if (typeof trackEvent === 'function') {
    trackEvent('scene_reached', {
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
  setDialogue('Горящие дедлайны, фигма в 10 вкладках и трекер, в котором порядок только снится');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene2Choice);
}

function scene2Choice() {
  setDialogue('С чего начать?');
  dialogue.innerHTML = dialogue.textContent;
// Исправление: "Как провести этот священный час?" без кавычек и курсива
function showSacredHour() {
  setDialogue('Как провести этот священный час?');
  dialogue.innerHTML = dialogue.textContent;
}
  showChoicesHTML(`
    <button class="choice" onclick="scene2Choice1()">Планирую приоритеты в трекере</button>
    <button class="choice" onclick="scene2Choice2()">Открываю Figma и в бой</button>
  `);
}

function scene2Choice1() {
  addPoint('perfectionism');
  hideChoicesKeepSlot();
  setDialogue('Так, дедлайны — на место, карточки — по цветам');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(() => {
    setDialogue('Если хаос снаружи, пусть хотя бы внутри будет порядок');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    onNextClick(scene2AfterChoice);
  });
}

function scene2Choice2() {
  addPoint('pragmatism');
  hideChoicesKeepSlot();
  setDialogue('Не тормозим. Новый фрейм, половина элементов уже откуда-то утащена — идеально');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene2AfterChoice);
}

function scene2AfterChoice() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты отхлёбываешь кофе, ловишь фокус — и видишь в календаре мигающее приглашение:');
  onNextClick(() => {
    showIntro('«Дизайн-синк 11:00 — обсуждаем новую фичу»');
    onNextClick(scene2BeforeMeeting);
  });
}

function scene2BeforeMeeting() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Всё, пора в переговорку. Мысленно надеваю броню');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(() => {
    changeScene('assets/background-meeting.png');
    hideCapsule();
    hideCharacter();
    
    // Интро-экран в переговорке перед репликой менеджера
    intro.style.display = 'block';
    showIntro('Ты заходишь, киваешь. Поехали');
    onNextClick(() => {
      intro.style.display = 'none';
      // Сразу показываем первый текст встречи
      showManager();
      setManager('assets/manager-default.png');
      showCapsule();
      setDialogue('Коллеги, время поджимает. Нужно быстро пройтись по вариантам и выбрать рабочий');
      hideChoicesKeepSlot();
      onNextClick(meetingIntro2);
    });
  });
}

function meetingIntro2() {
  hideCapsule();
  hideManager();
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ну конечно, "быстро определимся", а потом ещё месяц будем чинить баги');
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
  setDialogue('Ну конечно, "быстро определимся", а потом ещё месяц будем чинить баги');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingIntro3);
}

function meetingIntro3() {
  hideCharacter();
  hideCapsule();
  showManager();
  setManager('assets/manager-default.png');
  showCapsule();
  setDialogue('Сами понимаете, срок на носу. Бизнес уже ждёт апдейт');
  onNextClick(meetingIntro4);
}

function meetingIntro4() {
  hideManager();
  hideCapsule();
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Смотрю на аналитика — он делает вид, что изучает таблицу');
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
    <button class="choice" onclick="meetingEmpathy()">Давайте хотя бы проверим гипотезу</button>
    <button class="choice" onclick="meetingIndifference()">Лучше просто досидеть</button>
  `);
}

function meetingEmpathy() {
  addPoint('empathy');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Я понимаю, что времени мало, но если не протестим гипотезу на пользователях, снова будем переделывать');
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
  setDialogue('Лучше потратить пару дней сейчас, чем кучу денег после релиза, когда начнут приходить скрины в стиле "вы серьёзно?"');
  hideChoicesKeepSlot();
  onNextClick(meetingEmpathyAfter);
}

function meetingEmpathyAfter() {
  hideCapsule();
  hideCharacter();
  hideManager();
  intro.style.display = 'block';
  showIntro('Никто не перебивает. Менеджер кивает, аналитик записывает: «Проверить на пилоте»');
  onNextClick(meetingEmpathyAfter2);
}

function meetingEmpathyAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Вот и всё. Иногда, чтобы тебя услышали, надо просто не промолчать');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(meetingFinale);
}

function meetingIndifference() {
  addPoint('indifference');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Мир подождёт. Сегодня я просто не в ресурсе спасать проект');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingIndifferenceAfter);
}

function meetingIndifferenceAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты решаешь не тратить энергию');
  onNextClick(meetingIndifferenceAfter1b);
}

function meetingIndifferenceAfter1b() {
  showIntro('Слушаешь, как спорят менеджер и аналитик, открываешь ноутбук, делаешь вид, что ищешь файл');
  onNextClick(meetingIndifferenceAfter2);
}

function meetingIndifferenceAfter2() {
  showIntro('На самом деле просто считаешь минуты до конца встречи');
  onNextClick(meetingFinale);
}

function meetingFinale() {
  intro.style.display = 'none';
  hideCharacter();
  showManager();
  setManager('assets/manager-default.png');
  showCapsule();
  setDialogue('Хорошо, кажется, на сегодня всё ясно. Давайте просто возьмём этот вариант и закроем задачу');
  hideChoicesKeepSlot();
  onNextClick(meetingFinale2);
}

function meetingFinale2() {
  hideCapsule();
  hideManager();
  intro.style.display = 'block';
  showIntro('Все переглядываются, но никто не берёт на себя финальное слово');
  onNextClick(meetingFinale3);
}

function meetingFinale3() {
  showIntro('Менеджер смотрит в экран, разработчик уже закрыл ноут, аналитик делает вид, что пишет');
  onNextClick(meetingFinale4);
}

function meetingFinale4() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Окей, мы будто всё решили, но не совсем… Или просто все устали?');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(meetingFinalChoice);
}

function meetingFinalChoice() {
  setDialogue('Как закончить встречу?');
  dialogue.innerHTML = dialogue.textContent;
  showChoicesHTML(`
    <button class="choice" onclick="meetingPerfectionism()">Подведу итоги</button>
    <button class="choice" onclick="meetingPragmatism()">Ладно, всем спасибо, я пошла!</button>
  `);
}

function meetingPerfectionism() {
  addPoint('perfectionism');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
  setDialogue('Я всё зафиксирую и скину мемо встречи');
  onNextClick(meetingPerfectionismAfter);
}

function meetingPerfectionismAfter() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Менеджер благодарно кивает. Остальные тут же поднимаются. Внутри — ощущение, что ты закрыла гештальт');
  onNextClick(meetingPerfectionismAfter2);
}

function meetingPerfectionismAfter2() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Ну хоть будет что переслать тем, кто "не смог подключиться"');
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
  showIntro('Ты быстро встаёшь, остальные следом. Облегчение ощущается физически — встреча окончена');
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
  if (typeof trackEvent === 'function') {
    trackEvent('scene_reached', {
      'event_category': 'progress',
      'event_label': 'scene_3',
      'scene_number': 3
    });
  }

  changeScene('assets/background-office.png');
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Ты выходишь из переговорки и чувствуешь шум офиса — клавиатуры, звонки, шаги');
  onNextClick(scene3Intro2);
}

function scene3Intro2() {
  showIntro('Мир снова движется, а внутри тебя — тишина и лёгкое напряжение');
  onNextClick(scene3Intro3);
}

function scene3Intro3() {
  showIntro('Часы показывают почти час дня. Голова гудит от встреч. Календарь намекает на паузу');
  onNextClick(scene3LunchQuestion);
}

function scene3LunchQuestion() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Как провести этот священный час?');
  // Без курсива и кавычек для этого экрана
  dialogue.innerHTML = dialogue.textContent;
  showChoicesHTML(`
    <button class="choice" onclick="scene3StayWork()">Остаться и доделать макет</button>
    <button class="choice" onclick="scene3GoEat()">Если не поем — помру</button>
  `);
}

function scene3StayWork() {
  addPoint('perfectionism');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Планировала поесть — но взгляд зацепился за неровную сетку');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3StayWork2);
}

function scene3StayWork2() {
  setDialogue('Всего одна правка. Ну, или шесть. Но потом точно пойду');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(scene3StayWork3);
}

function scene3StayWork3() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Коллеги зовут в столовку — ты киваешь, не отрываясь от макета, но всё-таки идёшь');
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
  setDialogue('А то без еды я не дизайнер, а угроза экосистеме');
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
  showIntro('Кто-то рассказывает, как ездил в Сочи, кто-то спорит про сериал');
  onNextClick(scene3Cafeteria2);
}

function scene3Cafeteria2() {
  showIntro('Ты киваешь, ешь, ловишь паузы между шумом');
  onNextClick(() => {
    showIntro('Почти расслабилась — и тут появляется коллега');
    onNextClick(scene3InternAsk);
  });
}

function scene3InternAsk() {
  intro.style.display = 'none';
  hideCharacter();
  showIntern();
  setIntern('assets/intern-default.png');
  showCapsule();
  setDialogue('Слушай, у меня дедлайн горит, я не справляюсь. Можешь глянуть?');
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
  setDialogue('Да, конечно. Покажи, что не получается?');
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
  setDialogue('Окей, давай подумаем вместе. Сетка у тебя нестабильна из-за контейнера — его бы зафиксировать, а дальше всё сложится');
  onNextClick(scene3HelpIntern4);
}

function scene3HelpIntern4() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('Пятнадцать минут объяснений, пара советов — и Стажёр уже улыбается');
  onNextClick(() => {
    showIntro('Обед сгорает, но почему-то не жалко');
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
  setDialogue('Иногда одна встреча важнее трёх кнопок. И одной котлеты');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(scene3Reflect);
}

function scene3LaterIntern() {
  addPoint('indifference');
  hideChoicesKeepSlot();
  setCharacter('assets/girl-default.png');
  setDialogue('Сорри, я как раз в потоке. Может чуть позже?');
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
  showIntro('Стажёрик молча уходит. Ты ещё пару секунд смотришь в тарелку — но всё уже не так важно');
  onNextClick(scene3Reflect);
}

function scene3Reflect() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-sad.png');
  showCapsule();
  setDialogue('А ведь когда-то и я сидела так же — с кривой сеткой, в панике и с сгорающим дедлайном');
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
  setDialogue('О как');
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
  showIntro('Возвращаясь на рабочее место, ты чувствуешь себя чуть легче — будто внутри стало больше воздуха');
  // Сразу переходим к сцене 4 (Slack)
  onNextClick(startScene4);
}

function scene3WrapUpIntro2() {
  // Экран 2
  showIntro('На экране уже мигает уведомление:\n«Встреча по задачам на вторую половину дня»');
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
  setDialogue('Похоже, обед закончился. Вперёд, в следующие приключения');
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
  showIntro('Ты открываешь почту — двадцать непрочитанных, три "важных", и одно письмо с пометкой «Срочно»');
  onNextClick(desktopIntro2);
}

function desktopIntro2() {
  showIntro('«Всё супер, только можешь сделать кнопки побольше и убрать лишние отступы? Хочется, чтобы "дышало", но не слишком»');
  onNextClick(desktopIntro3);
}

function desktopIntro2() {
  showIntro('«Всё супер, только можешь сделать кнопки побольше и убрать лишние отступы? Хочется, чтобы "дышало", но не слишком»');
  onNextClick(desktopIntro3);
}

function desktopIntro3() {
  intro.style.display = 'none';
  showCharacter();
  setCharacter('assets/girl-default.png');
  showCapsule();
  setDialogue('Кнопки побольше, отступы поменьше, чтоб "дышало", но не сильно…');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(desktopChoice1);
}

function desktopChoice1() {
  setDialogue('Ты некоторое время просто смотришь на экран');
  showChoicesHTML(`
    <button class="choice" onclick="emailAnswer()">Ответить с аргументами</button>
    <button class="choice" onclick="emailDelete()">Удалить письмо</button>
  `);
}

function emailAnswer() {
  addPoint('awareness');
  setCharacter('assets/girl-smile.png');
  hideChoicesKeepSlot();
    setDialogue('«Спасибо! Только если увеличить кнопки, придётся передвинуть пол-интерфейса, а отступы как раз и дают дыхание. Иначе задохнёмся»');
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
    setDialogue('Тишина — лучший способ сохранить ментальное здоровье');
  onNextClick(emailDeleteAfter);
}

function emailDeleteAfter() {
  setCharacter('assets/girl-toxic.png');
    setDialogue('Если промолчать — никто не расстроится. А я сэкономлю себе минимально один нейрон');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(endOfDesktopScene);
}

function endOfDesktopScene() {
  hideCapsule();
  hideCharacter();
  intro.style.display = 'block';
  showIntro('После короткой разминки утро набирает обороты');
  onNextClick(function() {
    showIntro('На экране уже мигают задачи — день начинается по-настоящему');
    onNextClick(scene1Done);
  });
}

function chatWithColleagues() {
  addPoint('extroversion');
  hideChoicesKeepSlot();
  setDialogue('Отличное начало дня! Новости и сплетни помогают быть в курсе того, что происходит в компании');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  onNextClick(startCoffeeScene);
}

function checkEmail() {
  addPoint('introversion');
  hideChoicesKeepSlot();
  setDialogue('Так, никакой болтовни, только я и эти 1829110 писем');
  dialogue.innerHTML = '<em>«' + dialogue.textContent + '»</em>';
  onNextClick(startDesktopScene);
}

/* ---------- Сцена 4: разработчик и чат ---------- */
function startScene4() {
  // Отслеживание прохождения сцены 4
  if (typeof trackEvent === 'function') {
    trackEvent('scene_reached', {
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
  showIntro('Открываешь Slack. В чате уже кипит жизнь');
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
  setDialogue('А может, просто кинуть стикер с обезьяной и выйти из чата?');
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
  setDialogue('Если бы у нас был компонент, не пришлось бы придумывать');
  hideChoicesKeepSlot();
  onNextClick(() => {
    setDialogue('Это не просто хотелка, мы решаем конкретную проблему');
    onNextClick(() => {
      setDialogue('Мне бы тоже хотелось "не трогать, если работает", но оно не работает');
      onNextClick(() => {
        hideCapsule();
        hideCharacter();
        intro.style.display = 'block';
        showIntro('В чате становится тише');
        onNextClick(() => {
          showIntro('Через пару минут разработчик скидывает скрин и пишет:');
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
    setDialogue('Ну ты тоже не кипятись, просто уточняем…');
    hideChoicesKeepSlot();
    onNextClick(() => {
      hideDev();
      showCharacter();
      setCharacter('assets/girl-toxic.png');
      setDialogue('Уточняем, ага. Сначала хейт, потом "не кипятись". Классика');
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
    setDialogue('Люблю, когда можно проверить по факту, а не по ощущениям');
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
    setDialogue('Если оно живёт — может, не трогать судьбу?');
    dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
    hideChoicesKeepSlot();
    onNextClick(scene4Finale);
  });
}
function scene4Finale() {
  setCharacter('assets/girl-default.png');
  setDialogue('Как ни крути, а момент, когда фича уходит в прод — всегда немного магический');
  dialogue.innerHTML = '<em>' + dialogue.textContent + '</em>';
  hideChoicesKeepSlot();
  onNextClick(() => {
    setCharacter('assets/girl-smile.png');
    setDialogue('Никогда не знаешь, будет ли тихо… или бахнет');
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
  setDialogue('Вы красавцы. И правда всё работает гладко, спасибо!');
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

/* ---------- Фоновая загрузка ассетов (не блокирует старт) ---------- */
(function backgroundPreload() {
  const backgrounds = [
    'assets/background-office.png',
    'assets/background-coffeepoint.png',
    'assets/background-desktop.png',
    'assets/background-meeting.png',
    'assets/background-homenight.png'
  ];
  const sprites = [
    // main character
    'assets/girl-default.png',
    'assets/girl-smile.png',
    // manager variants
    'assets/manager-default.png',
    'assets/manager-surprise.png',
    // intern variants
    'assets/intern-default.png',
    'assets/intern-sad.png',
    // dev variants
    'assets/dev-default.png',
    'assets/dev-smile.png',
    'assets/dev-surprise.png'
  ];
  
  // Грузим в фоне после небольшой задержки, чтобы не мешать первому экрану
  setTimeout(() => {
    const preload = (list) => list.forEach(p => {
      resolveImageSrc(p).then(src => {
        const img = new Image();
        img.src = src;
        if (img.decode) img.decode().catch(() => {});
      });
    });
    preload(backgrounds);
    // Slightly stagger sprite preloads to not compete with backgrounds
    setTimeout(() => preload(sprites), 200);
  }, 100);
})();

/* ---------- Быстрый старт — показываем сразу ---------- */
window.addEventListener('load', () => {
  // Убираем loading screen сразу после загрузки DOM
  document.body.classList.add('loaded');
});
