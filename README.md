<div align="center">

<img src="assets/logo.png" width="96" alt="Farm Client logo">

# Farm Client

**Minecraft launcher + Fabric QoL mod, built as one product.**
**Лаунчер Minecraft и QoL-мод на Fabric — единым продуктом.**

[![Release](https://img.shields.io/github/v/release/R2D27829/Farm-Client?color=e8b04a&label=release)](https://github.com/R2D27829/Farm-Client/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/R2D27829/Farm-Client/total?color=6fd36f)](https://github.com/R2D27829/Farm-Client/releases)
![Platform](https://img.shields.io/badge/platform-Windows-0078d4)
![Electron](https://img.shields.io/badge/Electron-44-47848f)
![Fabric](https://img.shields.io/badge/Fabric-1.16.5%20→%2026.3-dbd0b4)

[**Сайт / Website**](https://r2d27829.github.io/Farm-Client/) · [**Скачать / Download**](https://github.com/R2D27829/Farm-Client/releases/latest) · [Changelog](CHANGELOG.md)

[Русский](#-русский) · [English](#-english)

</div>

---

## 🇷🇺 Русский

### О проекте
Farm Client — это Electron-лаунчер и клиентский Fabric-мод, которые разрабатываются вместе и общаются друг с другом. Лаунчер ставит Minecraft, загрузчик, Java и моды; мод получает от лаунчера аккаунт, Discord, друзей и настройки и отдаёт обратно события из игры.

Текущие версии: **лаунчер 1.17.0**, **мод 1.32.0**.

### Возможности

**Лаунчер**
- **Версии и загрузчики** — Vanilla (включая снапшоты), Fabric, Quilt, Forge, NeoForge. Готовые профили Fabric 1.16.5 / 1.21.4 / 1.21.11 / 26.3 с Farm Client и оптимизацией (Sodium, Lithium, FerriteCore, ModernFix, ImmediatelyFast, Krypton и др.).
- **Java** скачивается автоматически (официальные сборки Mojang, 17 / 21 / 25).
- **Аккаунты** — Microsoft, Ely.by (с 2FA) и офлайн; свой скин для Microsoft.
- **Каталоги Modrinth и CurseForge** — моды, ресурспаки, шейдеры, модпаки (`.mrpack` и CurseForge). Проверка обновлений и «Обновить всё».
- **Обмен сборками** — код `FARMPACK:` или файл `.farmpack` (манифест + конфиги, `options.txt`, локальные jar). Импорт «От друга».
- **Управление сборкой** в стиле Prism Launcher: память, JVM-аргументы, разрешение, версия загрузчика.
- **Главная** — новости (из `docs/news.json`), избранные серверы с пингом (SLP + SRV) и кнопкой «Зайти», статистика игры по дням и серверам.
- **Сеть** — друзья по Radmin VPN / ZeroTier / Hamachi / LAN: видно, кто в сети и какой мир открыт, «Зайти к нему», общие метки.
- **Discord** — Rich Presence (лаунчер / одиночная игра / сервер), кнопка «Присоединиться», привязка аккаунта через OAuth2, вебхук: скриншоты, краш-репорты, вход и выход с сервера.
- **Интерфейс** — темы (включая «Яблочный» Liquid Glass и «Минимализм»), свой CSS, масштаб, шрифты, мини-плеер и «Сейчас играет» (Spotify / Яндекс Музыка / любой медиаплеер Windows), трей, автообновление, свой установщик.
- **Локализация** — русский и английский (лаунчер, установщик, мод).

**Мод (Fabric)**
- ClickGUI в трёх стилях, свои вкладки, редактор HUD с раскладками (слоты 1–3, `Ctrl+C/V` — код `FARMHUD:`, выравнивание `L/R`).
- **Профили серверов** — набор модулей и биндов запоминается для каждого сервера.
- Метки (Waypoints) с обменом между друзьями, Mini Player, PvP Stats, Aim Trainer, TNT Timer, Хитбоксы, 4:3, Auction Helper, SMP Helper и десятки других модулей.
- Клавиша «Скрин в Discord» — снимок окна уходит в канал через лаунчер.

### Быстрый старт
1. Скачай `FarmClient-Setup-<версия>.exe` из [Releases](https://github.com/R2D27829/Farm-Client/releases/latest).
2. Войди (Microsoft / Ely.by / офлайн).
3. Выбери версию → **Играть**. Всё остальное скачается само.

> SmartScreen может предупредить о неподписанном файле: «Подробнее» → «Выполнить в любом случае».

### Сборка из исходников
Требуется Windows, **Node.js 20+**, **JDK 25**.

~~~bat
build.bat > build-log.txt 2>&1
~~~

Скрипт собирает мод (`gradlew buildAll`), копирует jar в `mods/` и собирает установщик в `dist/`. Для разработки лаунчера: `npm install` → `npm start`.

### Архитектура
| Путь | Назначение |
|---|---|
| `src/main.js`, `src/launcher.js` | Главный процесс Electron: окно, настройки, IPC, запуск игры |
| `src/preload.js` | Безопасный мост `window.api` для интерфейса |
| `src/renderer/` | Интерфейс лаунчера (HTML/CSS/JS) |
| `src/core/game.js`, `loaders.js`, `instance.js` | Установка Minecraft, загрузчиков, Java; сборки |
| `src/core/auth.js`, `discord*.js` | Microsoft / Ely.by, Discord RPC и OAuth2 |
| `src/core/mods.js`, `curseforge.js`, `mrpack.js` | Моды, Modrinth, CurseForge, модпаки, обновления |
| `src/core/share.js` | Экспорт/импорт сборок (`FARMPACK`, `.farmpack`) |
| `src/core/lan.js`, `slp.js` | Друзья по сети, общие метки, пинг серверов |
| `src/setup/` | Собственный установщик и деинсталлятор |
| `mod-source/` | Исходники Fabric-мода (Gradle, multi-version) |
| `docs/` | Сайт на GitHub Pages и `news.json` |

**Связь лаунчер ↔ мод**: системные свойства JVM (`-Dfarmclient.*`) при запуске и файловый мост `fc-out.txt` / `fc-in.txt` в `userData` (события `shot`, `wp` и т. д.).

### Где лежат данные
- Игра: `%APPDATA%\.farmclient` (меняется в настройках), сборки — `instances\<id>`
- Настройки лаунчера: `%APPDATA%\Farm Client\settings.json`

### Настройка Discord (для форков)
1. [Developer Portal](https://discord.com/developers/applications) → New Application.
2. Rich Presence → Art Assets → `assets/logo.png` с ключом `logo`.
3. OAuth2 → Redirects → `https://github.com/R2D27829/Farm-Client`.
4. Application ID, redirect и вебхук — в `src/config.js` (`discordClientId`, `discordRedirect`, `dsWebhook`).

### Новости и сайт
Сайт — `docs/index.html` (GitHub Pages, ветка `main`, папка `/docs`). Новости редактируются в `docs/news.json` и показываются и на сайте, и в лаунчере.

---

## 🇬🇧 English

### About
Farm Client is an Electron launcher and a client-side Fabric mod developed together and talking to each other. The launcher installs Minecraft, the mod loader, Java and mods; the mod receives the account, Discord, friends and settings from the launcher and reports in-game events back.

Current versions: **launcher 1.17.0**, **mod 1.32.0**.

### Features

**Launcher**
- **Versions & loaders** — Vanilla (incl. snapshots), Fabric, Quilt, Forge, NeoForge. Ready Fabric profiles for 1.16.5 / 1.21.4 / 1.21.11 / 26.3 with Farm Client and a performance stack (Sodium, Lithium, FerriteCore, ModernFix, ImmediatelyFast, Krypton, etc.).
- **Java** is downloaded automatically (official Mojang runtimes 17 / 21 / 25).
- **Accounts** — Microsoft, Ely.by (2FA supported) and offline; custom skin upload for Microsoft.
- **Modrinth & CurseForge** — mods, resource packs, shaders, modpacks (`.mrpack` and CurseForge). Update checks and one-click "Update all".
- **Pack sharing** — a `FARMPACK:` code or a `.farmpack` file (manifest + configs, `options.txt`, local jars). "From a friend" import.
- **Per-instance management** à la Prism Launcher: memory, JVM args, resolution, loader version.
- **Home** — news (from `docs/news.json`), favourite servers with live ping (SLP + SRV) and "Join", playtime stats by day and server.
- **Network** — friends over Radmin VPN / ZeroTier / Hamachi / LAN: who is online, open worlds, "Join them", shared waypoints.
- **Discord** — Rich Presence (launcher / singleplayer / server), "Join" button, OAuth2 account linking, webhook for screenshots, crash reports, server join/leave.
- **UI** — themes (incl. "Apple" Liquid Glass and "Minimal"), custom CSS, scaling, fonts, mini player and Now Playing (Spotify / Yandex Music / any Windows media session), tray, auto-updates, custom installer.
- **Localization** — Russian and English (launcher, installer, mod).

**Mod (Fabric)**
- ClickGUI in three styles, custom tabs, HUD editor with layouts (slots 1–3, `Ctrl+C/V` as a `FARMHUD:` code, `L/R` stacking).
- **Server profiles** — module and keybind sets remembered per server.
- Waypoints with friend sharing, Mini Player, PvP Stats, Aim Trainer, TNT Timer, Hitboxes, 4:3, Auction Helper, SMP Helper and dozens more modules.
- "Screenshot to Discord" key — the window capture is posted through the launcher.

### Quick start
1. Download `FarmClient-Setup-<version>.exe` from [Releases](https://github.com/R2D27829/Farm-Client/releases/latest).
2. Sign in (Microsoft / Ely.by / offline).
3. Pick a version → **Play**. Everything else is downloaded automatically.

> SmartScreen may warn about an unsigned binary: "More info" → "Run anyway".

### Building from source
Requires Windows, **Node.js 20+**, **JDK 25**.

~~~bat
build.bat > build-log.txt 2>&1
~~~

The script builds the mod (`gradlew buildAll`), copies the jars into `mods/` and packages the installer into `dist/`. For launcher development: `npm install` → `npm start`.

### Architecture
| Path | Purpose |
|---|---|
| `src/main.js`, `src/launcher.js` | Electron main process: window, settings, IPC, game launch |
| `src/preload.js` | Safe `window.api` bridge for the UI |
| `src/renderer/` | Launcher UI (HTML/CSS/JS) |
| `src/core/game.js`, `loaders.js`, `instance.js` | Minecraft, loaders, Java; instances |
| `src/core/auth.js`, `discord*.js` | Microsoft / Ely.by, Discord RPC and OAuth2 |
| `src/core/mods.js`, `curseforge.js`, `mrpack.js` | Mods, Modrinth, CurseForge, modpacks, updates |
| `src/core/share.js` | Pack export/import (`FARMPACK`, `.farmpack`) |
| `src/core/lan.js`, `slp.js` | LAN friends, shared waypoints, server ping |
| `src/setup/` | Custom installer and uninstaller |
| `mod-source/` | Fabric mod sources (Gradle, multi-version) |
| `docs/` | GitHub Pages website and `news.json` |

**Launcher ↔ mod IPC**: JVM system properties (`-Dfarmclient.*`) at launch plus a file bridge `fc-out.txt` / `fc-in.txt` in `userData` (`shot`, `wp`, … events).

### Data locations
- Game: `%APPDATA%\.farmclient` (configurable), instances in `instances\<id>`
- Launcher settings: `%APPDATA%\Farm Client\settings.json`

### Discord setup (for forks)
1. [Developer Portal](https://discord.com/developers/applications) → New Application.
2. Rich Presence → Art Assets → `assets/logo.png` with key `logo`.
3. OAuth2 → Redirects → `https://github.com/R2D27829/Farm-Client`.
4. Put the Application ID, redirect and webhook into `src/config.js` (`discordClientId`, `discordRedirect`, `dsWebhook`).

### News & website
The site is `docs/index.html` (GitHub Pages, branch `main`, folder `/docs`). News live in `docs/news.json` and are shown both on the site and in the launcher.

---

<div align="center"><sub>Farm Client is not affiliated with Mojang Studios or Microsoft. Minecraft is a trademark of Mojang Synergies AB.</sub></div>
