#!/usr/bin/env python3
"""
Обфускация имен файлов в assets:
- Переименовываем файлы в хеши (a1b2c3.png)
- Создаем маппинг файл для game.js
- Генерируем код замены путей
"""
import hashlib
import json
from pathlib import Path

def generate_hash(filename):
    """Генерирует короткий хеш из имени файла"""
    return hashlib.md5(filename.encode()).hexdigest()[:8]

def create_asset_mapping(assets_dir):
    """Создает маппинг оригинальных имен на обфусцированные"""
    mapping = {}
    
    # Собираем все изображения
    for ext in ['*.png', '*.webp']:
        for file_path in Path(assets_dir).glob(ext):
            if file_path.stem == 'texture':  # texture.png оставляем как есть
                continue
            
            original_name = f"assets/{file_path.name}"
            obfuscated_name = generate_hash(file_path.stem) + file_path.suffix
            mapping[original_name] = f"assets/{obfuscated_name}"
    
    return mapping

def generate_js_code(mapping):
    """Генерирует JavaScript код с маппингом"""
    json_mapping = json.dumps(mapping, indent=2, ensure_ascii=False)
    
    code = f"""/* ---------- Asset mapping (obfuscated filenames) ---------- */
const __assetMap = {json_mapping};

function getAssetPath(originalPath) {{
  return __assetMap[originalPath] || originalPath;
}}
"""
    return code

if __name__ == "__main__":
    assets_dir = Path(__file__).parent.parent / "assets"
    
    if not assets_dir.exists():
        print(f"❌ Директория {assets_dir} не найдена")
        exit(1)
    
    print("🔒 Создание маппинга для обфускации...")
    mapping = create_asset_mapping(assets_dir)
    
    print(f"\n📋 Найдено {len(mapping)} файлов для обфускации")
    print("\nПримеры:")
    for i, (orig, obf) in enumerate(list(mapping.items())[:5]):
        print(f"  {orig} → {obf}")
    
    # Сохраняем JS код
    js_code = generate_js_code(mapping)
    output_file = Path(__file__).parent / "asset_mapping.js"
    output_file.write_text(js_code)
    
    print(f"\n✅ Маппинг сохранен в {output_file}")
    print("\n💡 Добавьте этот код в начало game.js и оберните все вызовы:")
    print("   changeScene(getAssetPath('assets/background-office.png'))")
