#!/usr/bin/env python3
"""
Оптимизация PNG изображений для игры:
1. Сжатие PNG с качеством 80-85%
2. Конвертация в WebP (если доступно)
3. Опциональная обфускация имен файлов
"""
import os
import sys
from pathlib import Path

def optimize_with_pngquant(assets_dir):
    """Оптимизация PNG через pngquant (если установлен)"""
    import subprocess
    
    png_files = list(Path(assets_dir).glob("*.png"))
    print(f"Найдено {len(png_files)} PNG файлов")
    
    # Проверяем наличие pngquant
    try:
        subprocess.run(["pngquant", "--version"], capture_output=True, check=True)
        has_pngquant = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        has_pngquant = False
        print("⚠️  pngquant не установлен. Установите: brew install pngquant")
        return False
    
    if has_pngquant:
        for png_file in png_files:
            output = str(png_file).replace('.png', '-optimized.png')
            cmd = [
                "pngquant",
                "--quality=75-90",
                "--speed=1",
                "--force",
                "--output", output,
                str(png_file)
            ]
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                # Заменяем оригинал оптимизированной версией
                os.replace(output, png_file)
                print(f"✅ {png_file.name}")
            except subprocess.CalledProcessError as e:
                print(f"❌ Ошибка при обработке {png_file.name}: {e}")
        return True
    return False

def optimize_with_pillow(assets_dir):
    """Оптимизация PNG через Pillow"""
    try:
        from PIL import Image
    except ImportError:
        print("⚠️  Pillow не установлен. Установите: pip3 install Pillow")
        return False
    
    png_files = list(Path(assets_dir).glob("*.png"))
    print(f"Найдено {len(png_files)} PNG файлов")
    
    for png_file in png_files:
        try:
            img = Image.open(png_file)
            # Конвертируем в RGB если есть альфа-канал
            if img.mode in ('RGBA', 'LA', 'P'):
                # Сохраняем прозрачность для PNG
                img.save(png_file, "PNG", optimize=True, quality=85)
            else:
                img.save(png_file, "PNG", optimize=True)
            print(f"✅ {png_file.name}")
        except Exception as e:
            print(f"❌ Ошибка при обработке {png_file.name}: {e}")
    
    return True

def create_webp_versions(assets_dir):
    """Создание WebP версий для всех PNG"""
    try:
        from PIL import Image
    except ImportError:
        print("⚠️  Pillow не установлен для WebP конвертации")
        return False
    
    png_files = list(Path(assets_dir).glob("*.png"))
    print(f"\nСоздание WebP версий для {len(png_files)} файлов...")
    
    for png_file in png_files:
        webp_file = png_file.with_suffix('.webp')
        try:
            img = Image.open(png_file)
            img.save(webp_file, "WEBP", quality=80, method=6)
            print(f"✅ {webp_file.name}")
        except Exception as e:
            print(f"❌ Ошибка при создании {webp_file.name}: {e}")
    
    return True

if __name__ == "__main__":
    assets_dir = Path(__file__).parent.parent / "assets"
    
    if not assets_dir.exists():
        print(f"❌ Директория {assets_dir} не найдена")
        sys.exit(1)
    
    print("🔧 Оптимизация изображений...")
    print("=" * 50)
    
    # Сначала пробуем pngquant (лучшее сжатие)
    if not optimize_with_pngquant(assets_dir):
        # Fallback на Pillow
        if not optimize_with_pillow(assets_dir):
            print("\n❌ Не удалось оптимизировать изображения")
            sys.exit(1)
    
    # Создаем WebP версии
    create_webp_versions(assets_dir)
    
    print("\n✨ Готово!")
