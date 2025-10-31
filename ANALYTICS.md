ну# Google Analytics — Инструкция

## ✅ Что уже сделано

Google Analytics 4 (GA4) подключен к вашей игре с ID: **G-C7BHS2F2DD**

### Отслеживаемые события:

#### 1. **game_start** — Начало игры
Срабатывает, когда игрок проходит интро и начинает играть.

#### 2. **scene_reached** — Прохождение сцен
Отслеживается достижение каждой сцены (1-5):
- Scene 1: Офис и первая встреча
- Scene 2: Встреча с менеджером
- Scene 3: Обед и стажёр
- Scene 4: Разработчик и чат
- Scene 5: Вечер и питч менеджера

#### 3. **game_complete** — Завершение игры
Срабатывает при получении результата. Содержит:
- **archetype** — название архетипа (aesthete, ninja, punk, skull, lips, bird, battery, ice)
- **archetype_id** — номер архетипа (0-7)
- Все параметры личности игрока:
  - extroversion, introversion
  - empathy, indifference
  - toxicity, awareness
  - perfectionism, pragmatism

---

## 📊 Как смотреть статистику

### Зайдите в Google Analytics:
1. Перейдите на [analytics.google.com](https://analytics.google.com)
2. Выберите ваш ресурс (Property) с ID **G-C7BHS2F2DD**

### Основные метрики:

#### **Пользователи и сессии**
- **Reports → Engagement → Events**
  - Здесь видно все события: `game_start`, `scene_reached`, `game_complete`

#### **Конверсия (воронка)**
- **Reports → Engagement → Conversions**
  - Сколько человек начало игру (`game_start`)
  - Сколько дошло до каждой сцены
  - Сколько завершило игру (`game_complete`)

#### **Популярность архетипов**
- **Reports → Engagement → Events → game_complete**
  - Кликните на событие `game_complete`
  - Добавьте параметр `archetype` через "View event parameter"
  - Увидите распределение по архетипам

#### **Детальный анализ прогресса**
- **Explore → Funnel exploration**
  - Создайте воронку:
    1. game_start
    2. scene_reached (scene_1)
    3. scene_reached (scene_2)
    4. scene_reached (scene_3)
    5. scene_reached (scene_4)
    6. scene_reached (scene_5)
    7. game_complete
  - Увидите, на каком этапе люди уходят

---

## 📈 Что вы узнаете

✅ **Сколько людей зашло на сайт** — общее количество пользователей  
✅ **Сколько начало игру** — событие `game_start`  
✅ **Сколько дошло до конца** — событие `game_complete`  
✅ **Какие архетипы самые популярные** — параметр `archetype` в событии `game_complete`  
✅ **На каком этапе теряются игроки** — сравнение количества событий `scene_reached`  
✅ **Откуда приходят пользователи** — Acquisition → Traffic acquisition  
✅ **Среднее время на сайте** — Engagement → Engagement overview  

---

## 🔧 Дополнительные настройки (опционально)

### Создать кастомные конверсии:
1. **Admin → Events → Create event**
2. Отметьте `game_start` и `game_complete` как конверсии
3. Они появятся в отчетах как ключевые метрики

### Настроить уведомления:
1. **Admin → Custom Insights**
2. Создайте алерт, если количество `game_complete` падает

### Дашборд с ключевыми метриками:
1. **Explore → Blank**
2. Добавьте виджеты:
   - Total users (всего пользователей)
   - game_start count (начали игру)
   - game_complete count (завершили)
   - Completion rate = `game_complete / game_start * 100%`
   - Архетипы (таблица с `archetype`)

---

## 🎯 Архетипы и их ID

| ID | Название | Описание |
|----|----------|----------|
| 0  | aesthete | Эстет-террорист |
| 1  | ninja    | Корпоративный ниндзя |
| 2  | punk     | Product-панк |
| 3  | skull    | Фигма-гуру на грани |
| 4  | lips     | Старший Интроверт по макетам |
| 5  | bird     | Душнила с добрым сердцем |
| 6  | battery  | Креативный выгоревший |
| 7  | ice      | Методичный циник |

---

## 🚀 Дальнейшее развитие

Можно добавить отслеживание:
- Конкретных выборов игрока (какие кнопки нажимают чаще)
- Время на каждой сцене
- Повторные прохождения (replay)
- A/B тесты разных вариантов текста

Если нужно — дайте знать, добавлю!
