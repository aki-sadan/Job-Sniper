#!/bin/bash

# ============================================================
#  Career Sniper - Setup & Start
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${BLUE}🎯 Career Sniper – Setup & Start${NC}"
echo "========================================"

# ---------- 1. Node-Abhängigkeiten ----------
if [ ! -d node_modules ]; then
  echo ""
  echo "► Node-Abhängigkeiten installieren..."
  npm install --silent
  echo -e "${GREEN}✓ Fertig${NC}"
else
  echo -e "${GREEN}✓ Node-Abhängigkeiten vorhanden${NC}"
fi

# ---------- 2. Datenbank ----------
echo "► Datenbank einrichten..."
npx tsx src/db/migrate.ts 2>/dev/null
echo -e "${GREEN}✓ Datenbank bereit${NC}"

# ---------- 3. Python-JobSpy (LinkedIn, Indeed, Google Jobs) ----------
echo "► JobSpy installieren (LinkedIn, Indeed, Google Jobs)..."
if command -v pip3 &>/dev/null; then
  pip3 install python-jobspy --quiet
  echo -e "${GREEN}✓ LinkedIn, Indeed & Google Jobs aktiv${NC}"
elif command -v pip &>/dev/null; then
  pip install python-jobspy --quiet
  echo -e "${GREEN}✓ LinkedIn, Indeed & Google Jobs aktiv${NC}"
else
  echo -e "${RED}✗ Python3/pip nicht gefunden – bitte Python installieren: https://python.org${NC}"
  exit 1
fi

# ---------- 4. Lebenslauf-Vorlage ----------
if [ ! -f data/Master_CV.md ]; then
  mkdir -p data
  cat > data/Master_CV.md <<'CVEOF'
# Dein Name

**E-Mail:** deine@email.de | **LinkedIn:** linkedin.com/in/deinprofil | **Standort:** Stadt, Land

---

## Berufserfahrung

### Position | Unternehmen | 2022 – Heute
- Wichtigste Aufgabe oder Erfolg
- Weiterer relevanter Punkt

### Frühere Position | Unternehmen | 2020 – 2022
- Beschreibung deiner Tätigkeit
- Ergebnis oder Projekt

---

## Ausbildung

**Abschluss** | Hochschule/Universität | Jahr

---

## Fähigkeiten

**Technisch:** Skill 1, Skill 2, Skill 3
**Sprachen:** Deutsch (Muttersprache), Englisch (fließend)

CVEOF
fi

# ---------- 5. Server starten ----------
echo ""
echo -e "${GREEN}✅ Alles bereit! App startet...${NC}"
echo ""
echo "  Browser: http://localhost:3000"
echo "  Beenden: Strg + C"
echo ""

if command -v open &>/dev/null; then
  sleep 2 && open http://localhost:3000 &
fi

npm run dev
