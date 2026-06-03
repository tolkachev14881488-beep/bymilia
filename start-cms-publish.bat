@echo off
cd /d "%~dp0"
title By Milia CMS Publish
echo.
echo  Сервер публикации By Milia
echo  Не закрывайте это окно. Сохраняйте в админке — сайт обновится сам.
echo.
node scripts\cms-publish-server.mjs
pause
