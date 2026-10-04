# 🏎️ Cloud Racing - Szerver Telepítés & Futtatás

## 📋 Fájlok

Ezek a fájlok szükségesek a GitHub repóban:

```
Aut-szerver/
├── server.js           ← Szerver logika
├── package.json        ← Node.js függőségek
├── .env                ← Konfigurációs fájl
├── index.html          ← Frontend kliens
├── README.md           ← Dokumentáció
└── .gitignore          ← (opcionális)
```

---

## 🚀 LOCAL FUTTATÁS (Saját gépeden)

### 1️⃣ **Elő a fájlok a repo-ba**

```bash
# Klónozd a repót
git clone https://github.com/mamakati2026/Aut-szerver.git
cd Aut-szerver

# Másold be a szerver fájlokat
# server.js
# package.json
# .env
# index.html
```

### 2️⃣ **Telepítsd a függőségeket**

```bash
npm install
```

**Automatikusan telepíti:**
- Express (webszerver)
- Socket.io (valós idejű kommunikáció)
- CORS (cross-origin kérések)
- Dotenv (environment variables)

### 3️⃣ **Szerver indítása**

```bash
npm start
```

**Output:**
```
╔════════════════════════════════════════╗
║   🏎️  CLOUD RACING SZERVER AKTÍV  🏎️   ║
╠════════════════════════════════════════╣
║  📍 Port: 3000
║  🌐 URL: http://localhost:3000
║  👥 Játékosok: 0
║  🤖 AI Autók: 3
╚════════════════════════════════════════╝
```

### 4️⃣ **Játék megnyitása**

Böngészőben:
```
http://localhost:3000
```

**Vagy** másold meg az `index.html` tartalmát és nyisd meg közvetlenül.

---

## ☁️ ONLINE FUTTATÁS (Railway / Render)

### **RAILWAY (ajánlott - legegyszerűbb)**

#### 1️⃣ Railway fiók létrehozása
- https://railway.app
- GitHub-bal bejelentkezés

#### 2️⃣ Új projekt
- **+ New Project** → **Deploy from GitHub**
- Válaszd ki: `mamakati2026/Aut-szerver`

#### 3️⃣ Konfigurációs
- **Variables** → Add `PORT` = `3000`
- **Deploy** gomb

#### 4️⃣ Kész!
Railway automatikusan:
- ✅ `npm install` fut
- ✅ `npm start` indítás
- ✅ URL generálódik (pl: `https://cloud-racing-prod.railway.app`)

---

### **RENDER.COM (alternatíva)**

#### 1️⃣ Render fiók
- https://render.com
- GitHub bejelentkezés

#### 2️⃣ New Web Service
- **GitHub-ból Deploy**
- Válaszd ki: `mamakati2026/Aut-szerver`

#### 3️⃣ Build & Deploy
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Deploy**

---

## 📝 GitHub Feltöltés (Git parancsok)

Ha nincs git, először telepítsd: https://git-scm.com/download

### 1️⃣ **Git beállítása**

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### 2️⃣ **Szerver mappában**

```bash
# Lépj be a repó mappájába
cd Aut-szerver

# Git inicializálása
git init

# Fájlok hozzáadása
git add .

# Commit
git commit -m "🎮 Cloud Racing szerver - Socket.io + AI"

# GitHub push
git branch -M main
git remote add origin https://github.com/mamakati2026/Aut-szerver.git
git push -u origin main
```

### 3️⃣ **GitHub-on**

Vizsgáld meg: https://github.com/mamakati2026/Aut-szerver

Legyen:
- ✅ `server.js`
- ✅ `package.json`
- ✅ `.env`
- ✅ `index.html`

---

## 🎮 KLIENS (index.html) BEÁLLÍTÁSA

Ha **local** szerverrel játszol:
```javascript
// index.html - 35. sor körül
document.getElementById('serverUrl').value = "http://localhost:3000"
```

Ha **online** szerverrel (Railway):
```javascript
// index.html - 35. sor körül
document.getElementById('serverUrl').value = "https://cloud-racing-prod.railway.app"
```

---

## 🧪 TESZTELÉS

### Local tesztelés (több lapon)

1. Nyisd meg: `http://localhost:3000`
2. Csatlakozz: "Játékos1"
3. Nyisd meg új lapon: `http://localhost:3000`
4. Csatlakozz: "Játékos2"

**Látnod kell:**
- ✅ Mindkét autó a pályán
- ✅ 3 AI autó versenyez
- ✅ Leaderboard frissül
- ✅ Chat működik

---

## 🔧 TROUBLESHOOTING

### "ERR_CONNECTION_REFUSED"
**Megoldás:** Szerver fut-e? `npm start` terminálban

### "Cannot find module 'socket.io'"
**Megoldás:** `npm install` első!

### PORT már használatban
**Megoldás:** `.env`-ben módosítsd a PORTot: `PORT=3001`

### Szerver elérhető, de kliens nem jön létre
**Megoldás:** CORS engedélyezve? (szerver.js már beállított)

---

## 📊 SZERVER LOGIKA

**Socket.io Events:**

- `join_game` ← Játékos csatlakozik
- `player_update` ← Position, speed, lap frissítés
- `autopilot_toggle` ← AI vezérlés bekapcsol
- `chat_message` ← Üzenet küldés
- `player_joined` ← Valaki csatlakozás közleménye
- `game_state` ← Leaderboard frissítés
- `player_left` ← Kilépés
- `disconnect` ← Szerver bontás

---

## ✅ KÉSZ!

**A szerver működik, amikor:**
- ✅ `npm start` fut
- ✅ "CLOUD RACING SZERVER AKTÍV" üzenet jól látszik
- ✅ Kliens URL helyesen mutat
- ✅ Több játékos lehet egyszerre

🎮 **Játssz!** 🏁

---

## 📞 Support

Hiba? Ellenőrizd:
1. `node --version` (kell v18+)
2. `npm --version` (kell npm 9+)
3. `.env` fájl létezik?
4. `npm install` sikeres?
5. Szerver URL helyes az index.html-ben?

**Sokkal több kérdés?** Írd meg! 💬
