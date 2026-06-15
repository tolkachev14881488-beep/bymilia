@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Сборка архива для by-milia.by...
node scripts/make-hosting-zip.mjs
echo.
echo ========================================
echo  Архив готов: by-milia-site.zip
echo ========================================
echo.
echo Загрузка в hoster.by (ISPmanager):
echo   1. hoster.by -^> Мои услуги -^> Хостинг -^> ISPmanager
echo   2. Файлы -^> www -^> by-milia.by -^> data
echo   3. Загрузить by-milia-site.zip
echo   4. Распаковать архив в эту папку
echo   5. Откройте https://by-milia.by
echo.
pause
