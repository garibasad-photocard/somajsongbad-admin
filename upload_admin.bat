@echo off
cd /d "D:\Karim Vai\Somaj Songbad\omh-cms\frontend"
echo Initializing Git...
git init
git add .
git commit -m "Initial commit of admin panel"
git branch -M main
git remote add origin https://github.com/garibasad-photocard/somajsongbad-admin.git
echo Uploading to GitHub...
git push -u origin main
echo Done!
pause
