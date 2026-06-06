#!/usr/bin/env bash
# garante que o servidor rode na pasta deste arquivo
cd "$(dirname "$0")"
python3 -m http.server 8080
