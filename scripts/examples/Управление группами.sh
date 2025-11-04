# Создать группу
sudo groupadd groupname

# Удалить группу
sudo groupdel groupname

# Добавить пользователя в группу
sudo usermod -aG groupname username

# Удалить пользователя из группы
sudo gpasswd -d username groupname

# Показать группы пользователя
groups username
id username

# Список групп
cat /etc/group
getent group