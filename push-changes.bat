cd /d "C:\Users\Liqui\Documents\dinnerhack"

echo === Removing git lock files ===
del /f .git\HEAD.lock 2>nul
del /f .git\index.lock 2>nul

echo === Fetching from GitHub ===
git fetch origin

echo === Pulling latest from GitHub ===
git pull origin main:master --rebase

echo === Staging files ===
git add -A

echo === Committing ===
git commit -m "chore: push latest changes"

echo === Pushing to GitHub ===
git push origin master:main

echo === DONE ===
pause
