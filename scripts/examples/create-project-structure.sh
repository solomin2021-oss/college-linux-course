
### **📄 scripts/examples/create-project-structure.sh**
```bash
#!/bin/bash

# Скрипт для создания учебной структуры проекта
# Урок 2: Пользователи и права доступа

echo "🐧 Создание структуры проекта для Урока 2"
echo "=========================================="

# Создаем папки
sudo mkdir -p /var/www/college-project/{public,private,shared,logs,backups}

# Настраиваем владельца и группу
sudo chown -R developer1:webdev /var/www/college-project

# Настраиваем разные права для разных папок
sudo chmod 755 /var/www/college-project/public     # rwxr-xr-x
sudo chmod 700 /var/www/college-project/private    # rwx------
sudo chmod 775 /var/www/college-project/shared     # rwxrwxr-x  
sudo chmod 750 /var/www/college-project/logs       # rwxr-x---
sudo chmod 700 /var/www/college-project/backups    # rwx------

# Создаем тестовые файлы
sudo -u developer1 touch /var/www/college-project/public/index.html
sudo -u developer1 touch /var/www/college-project/private/config.txt
sudo -u developer1 touch /var/www/college-project/shared/collaborate.txt
sudo -u developer1 touch /var/www/college-project/logs/app.log

# Заполняем файлы содержимым
sudo -u developer1 echo "Public HTML file" > /var/www/college-project/public/index.html
sudo -u developer1 echo "Secret configuration" > /var/www/college-project/private/config.txt
sudo -u developer1 echo "Team collaboration" > /var/www/college-project/shared/collaborate.txt

echo "✅ Структура проекта создана!"
echo "📁 Проверка прав:"
ls -la /var/www/college-project/