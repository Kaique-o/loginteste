@echo off
REM garante que o servidor rode na pasta deste arquivo
cd /d "%~dp0"
py -m http.server 8080
