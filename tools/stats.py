 #!/usr/bin/env python3
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
js_path = root / 'game.js'

def read_text(p: Path) -> str:
    return p.read_text(encoding='utf-8')

code = read_text(js_path)

# Normalize NBSP and newlines for counting
norm = code.replace('\u00A0', ' ')

# 1) introDialogues array entries
intro_entries = []
intro_array_re = re.compile(r"const\s+introDialogues\s*=\s*\[(.*?)\];", re.S)
ma = intro_array_re.search(norm)
if ma:
    arr = ma.group(1)
    # match JS string literals '...' or "..."
    str_re = re.compile(r"(['\"])((?:\\\1|.)*?)\1")
    for m in str_re.finditer(arr):
        s = m.group(2)
        s = s.encode('utf-8').decode('unicode_escape')
        intro_entries.append(s)

# 2) showIntroScreen calls (first arg string literal)
show_intro_screen_args = []
for m in re.finditer(r"(?<!function\s)showIntroScreen\(\s*(['\"])((?:\\\1|.)*?)\1", norm):
    s = m.group(2)
    s = s.encode('utf-8').decode('unicode_escape')
    show_intro_screen_args.append(s)

# 3) showIntro calls with literal args (exclude those within function showIntroScreen body)
# We'll extract string literals passed directly; ignore introDialogues[i]-style
show_intro_args = []
for m in re.finditer(r"showIntro\(\s*(['\"])((?:\\\1|.)*?)\1\s*\)", norm):
    # Skip the call inside function showIntroScreen (definition)
    # Heuristic: look back a small window; if 'function showIntroScreen' appears nearby preceding '{', skip.
    start = m.start()
    window = norm[max(0, start-120):start]
    if re.search(r"function\s+showIntroScreen\s*\(", window):
        continue
    # Also skip introDialogues literal in helper? We want literal-only; keep.
    s = m.group(2)
    s = s.encode('utf-8').decode('unicode_escape')
    show_intro_args.append(s)

# 4) setDialogue calls with literal args
set_dialogue_args = []
for m in re.finditer(r"setDialogue\(\s*(['\"])((?:\\\1|.)*?)\1\s*\)", norm):
    s = m.group(2)
    s = s.encode('utf-8').decode('unicode_escape')
    set_dialogue_args.append(s)

# 5) showChoicesHTML button texts
choice_texts = []
for m in re.finditer(r"showChoicesHTML\(\s*`([\s\S]*?)`\s*\)", norm):
    html = m.group(1)
    for b in re.finditer(r"<button[^>]*>([\s\S]*?)</button>", html):
        t = b.group(1)
        # collapse whitespace and strip
        t = re.sub(r"\s+", " ", t)
        choice_texts.append(t.strip())

# Screen count: intro array entries + showIntroScreen + showIntro (literal) + setDialogue
screen_count = len(intro_entries) + len(show_intro_screen_args) + len(show_intro_args) + len(set_dialogue_args)

# Word count function: split on letters/digits boundaries; keep Cyrillic
word_re = re.compile(r"[\w\u0400-\u04FF]+", re.UNICODE)

def count_words(texts):
    total = 0
    for s in texts:
        # normalize non-breaking spaces and newlines
        s = s.replace('\u00A0', ' ')
        words = word_re.findall(s)
        total += len(words)
    return total

word_count = count_words(intro_entries + show_intro_screen_args + show_intro_args + set_dialogue_args + choice_texts)

print(f"SCREENS: {screen_count}")
print(f"WORDS: {word_count}")

# Optional breakdown (commented out)
# print("Intro entries:", len(intro_entries))
# print("showIntroScreen:", len(show_intro_screen_args))
# print("showIntro (literal):", len(show_intro_args))
# print("setDialogue:", len(set_dialogue_args))
# print("Choices labels:", len(choice_texts))
