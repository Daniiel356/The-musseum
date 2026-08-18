@echo off
cd /d "%~dp0"

git config --local --add safe.directory "%cd%"

git add .

git commit -m "Auto-commit %date% %time%: %1"

git push origin "main"

echo ¡Cambios subidos correctamente!
pause
