#!/bin/bash
# Pornește site-ul Auto ZM SRL local
# Utilizare: ./start.sh  (apoi deschide http://localhost:8000 în browser)
cd "$(dirname "$0")"
PORT=8000
echo "=============================================="
echo "  Auto ZM SRL — site pornit"
echo "  Site public : http://localhost:$PORT"
echo "  Admin       : http://localhost:$PORT/admin/"
echo "  Login admin : utilizator 'admin' / parola 'autozm123'"
echo "  Oprire      : CTRL+C"
echo "=============================================="
python3 -m http.server $PORT
