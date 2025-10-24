# 🚀 PlutStudio - Инструкция по установке

## 📋 Что нужно сделать для запуска проекта

### 1. Настройка базы данных

1. Создай PostgreSQL базу данных на любом хостинге (например: Supabase, Railway, Render)

2. Скопируй файл `.env.example` в `.env`:
   ```bash
   cp .env.example .env
   ```

3. Заполни `.env` своими данными:
   ```
   DB_HOST=your_postgres_host.com
   DB_PORT=5432
   DB_NAME=plutstudio_db
   DB_USER=your_username
   DB_PASSWORD=your_password
   DATABASE_URL=postgresql://your_username:your_password@your_postgres_host.com:5432/plutstudio_db
   JWT_SECRET=some_random_secret_key_12345
   ADMIN_EMAIL=CatStudio
   ADMIN_PASSWORD=1488
   ```

4. Примени SQL схему из файла `database.sql`:
   - Открой pgAdmin или любой SQL клиент
   - Подключись к своей базе
   - Выполни весь SQL из файла `database.sql`

### 2. Деплой backend функций

Backend функции нужно задеплоить на любой serverless платформе:
- **Vercel** (рекомендуется)
- **Netlify Functions**
- **AWS Lambda**
- **Google Cloud Functions**

Структура backend:
```
backend/
├── auth/          # Регистрация и вход
│   ├── index.py
│   ├── requirements.txt
│   └── tests.json
└── admin/         # Админ-панель
    ├── index.py
    ├── requirements.txt
    └── tests.json
```

Каждая функция - отдельный endpoint. После деплоя получишь URL вида:
- `https://your-project.vercel.app/api/auth`
- `https://your-project.vercel.app/api/admin`

### 3. Обновление URL в коде

Замени заглушки в frontend файлах на реальные URL:

**src/pages/Login.tsx:**
```typescript
const AUTH_API = 'https://your-project.vercel.app/api/auth';
```

**src/pages/Admin.tsx:**
```typescript
const ADMIN_API = 'https://your-project.vercel.app/api/admin';
```

### 4. Установка зависимостей и запуск

```bash
# Установка зависимостей
npm install

# Запуск проекта локально
npm run dev

# Билд для продакшена
npm run build
```

## 📊 Структура базы данных

- **users** - пользователи с email, nickname, паролем, энергией
- **sessions** - активные сессии пользователей
- **projects** - проекты пользователей
- **user_logs** - логи всех действий (кроме админ-действий без прогресса)
- **energy_transactions** - история начисления/списания энергии

## 🔐 Админ-доступ

Админ создаётся автоматически при первом запуске backend:
- **Email:** CatStudio
- **Пароль:** 1488

Админ может:
- ✅ Видеть всех пользователей
- ✅ Начислять энергию по email/nickname
- ✅ Смотреть логи действий
- ✅ Удалять пользователей

## ⚡ Система энергии

- Новый пользователь получает **500 энергии** при регистрации
- Админ может начислять энергию любому пользователю
- Все транзакции записываются в базу

## 📝 Логирование

Все действия пользователей логируются:
- Регистрация
- Вход
- Создание проекта
- Публикация проекта
- Получение энергии

Админские действия **НЕ связанные с прогрессом пользователей** - не логируются.

## 🛠️ Технологии

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python 3.11 (Serverless Functions)
- **Database:** PostgreSQL
- **Auth:** JWT + bcrypt
- **UI:** shadcn/ui components

## 🎯 После установки

1. Открой сайт
2. Зарегистрируйся или войди как админ (CatStudio / 1488)
3. Админ может зайти в `/admin` и управлять пользователями
4. Обычные пользователи видят свою энергию в шапке

---

**Важно:** Не забудь добавить `.env` в `.gitignore` чтобы не закоммитить секреты!
