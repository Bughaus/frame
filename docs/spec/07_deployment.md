# Deployment-Strategie – VereinApp

**Version:** 0.1
**Datum:** 2026-03-27

---

## Übersicht der drei Ausbaustufen

```
Stufe 1: Lokal             Stufe 2: Mobil-fähig         Stufe 3: Self-Hosted
─────────────────          ─────────────────────         ────────────────────
Fester PC im Verein        Gleicher PC + Nginx            Eigener Server
LAN-Zugriff nur            Responsive UI                  Internet-Zugriff
Browser am selben PC       Zugriff via WLAN               Extern/Intern-Trennung
HTTP (lokal)               HTTPS (Let's Encrypt)          HTTPS Pflicht
Docker Compose             Docker Compose + Nginx         Docker Compose + Nginx
```

---

## Stufe 1: Lokale Installation

### Ziel
Betrieb auf einem festen Windows/Linux-PC im Vereinsraum. Zugriff ausschließlich über den lokalen Browser auf diesem Rechner.

### Voraussetzungen

| Software       | Version   | Hinweis                                    |
|----------------|-----------|--------------------------------------------|
| Docker Desktop | >= 4.20   | Für Windows: WSL2-Backend empfohlen         |
| Docker Compose | >= 2.20   | Im Docker Desktop enthalten                |
| Git            | beliebig  | Zum Klonen des Repositories                |

### Verzeichnisstruktur auf dem Host

```
C:\vereinapp\         (Windows)
/opt/vereinapp/       (Linux)
├── docker-compose.yml
├── .env
├── data/
│   ├── postgres/     # Datenbankdaten (Docker Volume)
│   └── uploads/      # Hochgeladene Dateien
└── backups/          # Datenbank-Backups
```

### `.env` Konfiguration (Stufe 1)

```env
NODE_ENV=production
PORT=3000

# Datenbank
POSTGRES_USER=vereinapp
POSTGRES_PASSWORD=<sicheres-passwort>
POSTGRES_DB=vereinapp
DATABASE_URL=postgresql://vereinapp:<passwort>@postgres:5432/vereinapp

# JWT
JWT_SECRET=<langer-zufaelliger-string-min-32-zeichen>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# App
FRONTEND_URL=http://localhost
APP_NAME=VereinApp
DEFAULT_LANGUAGE=de

# Uploads
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE_MB=20

# E-Mail (optional für Stufe 1)
SMTP_ENABLED=false
```

### `docker-compose.yml` (Stufe 1)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: vereinapp-backend:latest
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_ACCESS_EXPIRY=${JWT_ACCESS_EXPIRY}
      - JWT_REFRESH_EXPIRY=${JWT_REFRESH_EXPIRY}
      - UPLOAD_PATH=${UPLOAD_PATH}
      - NODE_ENV=${NODE_ENV}
    volumes:
      - ./data/uploads:/app/uploads
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: vereinapp-frontend:latest
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: http://localhost:3000
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
```

### Erstinstallation

```bash
# 1. Repository klonen
git clone https://github.com/verein/vereinapp.git
cd vereinapp

# 2. .env anpassen
cp .env.example .env
# .env editieren und Passwörter setzen

# 3. Container bauen und starten
docker compose up -d --build

# 4. Datenbank initialisieren
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed

# 5. Browser öffnen
# → http://localhost
# Admin-Login: admin / (aus .env oder Seed-Ausgabe)
```

### Update-Prozedur

```bash
git pull
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

### Backup (automatisch via Cron / Taskplaner)

```bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U vereinapp vereinapp \
  | gzip > ./backups/db_backup_${DATE}.sql.gz

# Backups älter als 30 Tage löschen
find ./backups -name "*.sql.gz" -mtime +30 -delete
```

Unter Windows: Dieses Skript als geplante Aufgabe täglich ausführen.

---

## Stufe 2: Mobile-Kompatibilität

### Zusätzliche Voraussetzungen
- Feste lokale IP-Adresse für den Vereins-PC (z.B. `192.168.1.100`)
- Nginx als Reverse Proxy (im selben Docker Compose)
- HTTPS-Zertifikat (Self-Signed oder Let's Encrypt, falls Domain vorhanden)

### Änderungen gegenüber Stufe 1

1. **Nginx-Container** hinzufügen
2. **Responsive UI** im Frontend (Mobile Breakpoints)
3. **HTTPS**-Konfiguration (mindestens Self-Signed)
4. Firewall-Regel: Port 443 im LAN freigeben

### `docker-compose.yml` Ergänzung (Stufe 2)

```yaml
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
```

### `nginx/nginx.conf` (Stufe 2 – Self-Signed)

```nginx
events { worker_connections 1024; }

http {
    # HTTP → HTTPS Redirect
    server {
        listen 80;
        server_name 192.168.1.100;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name 192.168.1.100;

        ssl_certificate     /etc/nginx/ssl/vereinapp.crt;
        ssl_certificate_key /etc/nginx/ssl/vereinapp.key;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # Frontend
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            client_max_body_size 25M;
        }
    }
}
```

### Self-Signed Zertifikat erstellen

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/vereinapp.key \
  -out nginx/ssl/vereinapp.crt \
  -subj "/C=DE/ST=Bayern/L=Musterstadt/O=Sportverein/CN=192.168.1.100"
```

---

## Stufe 3: Self-Hosted Server (Internet-Betrieb)

### Ziel
Vollständiges Deployment auf einem eigenen Server (z.B. VPS bei Hetzner/Strato) mit Internetzugriff und Unterscheidung zwischen intern und extern verfügbaren Funktionen.

### Voraussetzungen
- Linux-Server (Ubuntu 22.04 LTS empfohlen), min. 2 vCPU / 4 GB RAM
- Eigene Domain (z.B. `mitglieder.meinverein.de`)
- DNS-A-Eintrag zeigt auf Server-IP
- Ports 80 und 443 im Firewall freigegeben
- Port 22 (SSH) für Administration

### Sicherheitshärtung des Servers

```bash
# UFW Firewall
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Fail2ban gegen SSH-Brute-Force
apt install fail2ban -y
```

### Let's Encrypt via Certbot

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d mitglieder.meinverein.de
# Automatische Erneuerung via systemd-Timer (bereits konfiguriert)
```

### `nginx/nginx.conf` (Stufe 3 – intern/extern Trennung)

```nginx
# Interne IPs definieren
geo $is_internal {
    default 0;
    192.168.1.0/24 1;  # Vereinsnetz
    10.0.0.0/8     1;  # Optionales VPN
}

server {
    listen 80;
    server_name mitglieder.meinverein.de;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name mitglieder.meinverein.de;

    ssl_certificate     /etc/letsencrypt/live/mitglieder.meinverein.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mitglieder.meinverein.de/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Frontend (extern + intern)
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API: Öffentlich zugänglich (Login, eigene Daten, Kalender, Dokumente)
    location ~ ^/api/v1/(auth|me|calendar|documents)/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API: Nur intern (Admin, Kassensystem, Mitgliederverwaltung)
    location /api/v1/ {
        if ($is_internal = 0) {
            return 403 '{"message":"Nur aus dem Vereinsnetz zugänglich"}';
        }
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 25M;
    }
}
```

### Deployment via CI/CD (optional, Stufe 3)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/vereinapp
            git pull
            docker compose up -d --build
            docker compose exec -T backend npx prisma migrate deploy
```

### Monitoring (Stufe 3)

- **Uptime-Monitoring:** UptimeRobot (kostenlos, benachrichtigt bei Ausfall)
- **Log-Aggregation:** Docker Logs via `docker compose logs -f`
- **Disk-Monitoring:** Cron-Job warnt bei < 10 GB freiem Speicher
- **Backup-Monitoring:** Backup-Logs prüfen, ob tägliche Sicherung erfolgreich war

---

## Backup-Strategie (alle Stufen)

| Typ                  | Häufigkeit | Aufbewahrung | Speicherort              |
|----------------------|------------|--------------|--------------------------|
| Datenbank-Dump       | Täglich    | 30 Tage      | Lokal + optional extern  |
| Uploads-Verzeichnis  | Wöchentlich | 4 Wochen    | Lokal + optional extern  |
| Konfigurationsdateien | Bei Änderung | Unbegrenzt | Git-Repository           |

**Externe Backup-Option (Stufe 3):** Rclone + Nextcloud/Backblaze B2 (Ende-zu-Ende verschlüsselt)

```bash
# Externes Backup mit rclone
rclone copy ./backups remote:vereinapp-backups --min-age 1h
```

---

## Schnellreferenz: Wichtige Befehle

```bash
# Status aller Container
docker compose ps

# Logs anzeigen (live)
docker compose logs -f backend

# Backup manuell ausführen
./backup.sh

# Dienste neu starten
docker compose restart backend

# Vollständiger Neustart
docker compose down && docker compose up -d

# Datenbankmigrationen prüfen
docker compose exec backend npx prisma migrate status

# In DB-Shell
docker compose exec postgres psql -U vereinapp vereinapp
```
