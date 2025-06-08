#!/bin/bash

echo "🧹 Начинаю полную зачистку Cursor..."

# 1. Удаляем основные папки с данными приложения
echo "🗑 Удаляю Application Support..."
rm -rf ~/Library/Application\ Support/Cursor

echo "🗑 Удаляю Caches..."
rm -rf ~/Library/Caches/com.cursor.cursor

echo "🗑 Удаляю Preferences plist..."
rm -rf ~/Library/Preferences/com.cursor.cursor.plist

echo "🗑 Удаляю Saved Application State..."
rm -rf ~/Library/Saved\ Application\ State/com.cursor.cursor.savedState

# 2. Удаляем логи (если есть)
echo "🗑 Удаляю логи..."
rm -rf ~/Library/Logs/Cursor

# 3. Удаляем возможные ключи из Keychain
echo "🗝 Проверяю Keychain..."
if security find-generic-password -s cursor &> /dev/null; then
    security delete-generic-password -s cursor
    echo "✅ Ключ 'cursor' удалён из Keychain."
else
    echo "ℹ️ Нет ключа 'cursor' в Keychain."
fi

# 4. Поиск возможных скрытых остатков (на всякий случай)
echo "🔍 Поиск возможных скрытых файлов..."

FOUND_FILES=$(find ~/Library -iname "*cursor*" -print)

if [ -n "$FOUND_FILES" ]; then
    echo "⚠️ Найдены дополнительные файлы:"
    echo "$FOUND_FILES"
    echo "👉 Проверьте вручную и при необходимости удалите их."
else
    echo "✅ Скрытых файлов не найдено."
fi

# 5. Доп. рекомендации
echo ""
echo "✅ Базовая зачистка завершена."
echo ""
echo "⚠️ Рекомендации:"
echo "1️⃣ Перезагрузите Mac (сбросим остаточные процессы)."
echo "2️⃣ Используйте VPN или смените IP для нового триала."
echo "3️⃣ Создайте новый аккаунт и активируйте триал."
echo ""
echo "🚀 Удачи!"