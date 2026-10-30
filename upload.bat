@echo off
chcp 65001 >nul
setlocal

rem ============================================================
rem  upload.bat - day app "STOP-4P Healthcare Staff - DUNG 5" len GitHub Pages
rem  Cach dung: bam dup file nay. Moi lan chay = mot lan cap nhat.
rem  Co the truyen loi commit:  upload.bat "Sua mau nut"
rem  Repo: https://github.com/ditruyenhungvuong/STOP-4P-Healthcare-Staff-V2
rem  Web:  https://ditruyenhungvuong.github.io/STOP-4P-Healthcare-Staff-V2/
rem  Ban Ubuntu tuong duong: upload.sh
rem ============================================================

rem Luon chay dung thu muc chua file nay, du bam dup tu dau
cd /d "%~dp0"

set "REPO=ditruyenhungvuong/STOP-4P-Healthcare-Staff-V2"
set "BRANCH=main"
set "PAGES=https://ditruyenhungvuong.github.io/STOP-4P-Healthcare-Staff-V2/"
set "MSG=Cap nhat app STOP-4P Healthcare Staff"
if not "%~1"=="" set "MSG=%~1"

echo.
echo ======== DANG TAI CODE LEN GITHUB: %REPO% ========
echo Thu muc: %CD%
echo.

rem ---------- [0/4] Soat cau hinh truoc khi day ----------
rem OTP gia (dev-mock) chi duoc bat tu dong o may local (T-01).
rem Lo gan cung OTP_MODE: 'dev-mock' thi ban cong khai co dang nhap gia -> khong day.
findstr /R /C:"^ *OTP_MODE: *'dev-mock'" "js\config.js" >nul 2>&1
if %errorlevel% equ 0 goto :otpmock

rem ---------- Kiem tra da cai Git chua ----------
git --version >nul 2>&1
if %errorlevel% neq 0 goto :nogit

rem ---------- [1/4] Khoi tao Git trong thu muc app ----------
if exist ".git\" goto :hasgit
echo [1/4] Khoi tao Git lan dau...
git init >nul
git branch -M %BRANCH%
git remote add origin https://github.com/%REPO%.git
goto :identity

:hasgit
echo [1/4] Git da co san, cap nhat dia chi repo...
git remote set-url origin https://github.com/%REPO%.git 2>nul || git remote add origin https://github.com/%REPO%.git
git branch -M %BRANCH%

:identity
rem Git can biet ten + email nguoi commit. Chua co thi hoi mot lan, luu rieng cho thu muc nay.
set "GITNAME="
set "GITEMAIL="
for /f "delims=" %%n in ('git config user.name 2^>nul') do set "GITNAME=%%n"
for /f "delims=" %%e in ('git config user.email 2^>nul') do set "GITEMAIL=%%e"
if not defined GITNAME call :askname
if not defined GITEMAIL call :askemail

rem ---------- [2/4] Gom file ----------
echo [2/4] Dang gom toan bo file...
git add -A
rem Giu quyen chay cho upload.sh de may Ubuntu clone ve van ./upload.sh duoc
git update-index --chmod=+x upload.sh >nul 2>&1

rem Chot an toan: lan nay co XOA file nao tren GitHub khong
set "HASDEL="
for /f "delims=" %%f in ('git diff --cached --diff-filter=D --name-only') do set "HASDEL=1"
if not defined HASDEL goto :commit
echo.
echo [!] Lan day nay se XOA cac file sau khoi GitHub va khoi trang web:
for /f "delims=" %%f in ('git diff --cached --diff-filter=D --name-only') do echo       - %%f
set "OK="
set /p "OK=    Go  co  de dong y xoa, Enter de dung lai: "
if /i not "%OK%"=="co" goto :stopdel

:commit
rem ---------- [3/4] Commit ----------
echo [3/4] Dang tao ban commit...
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo       Khong co thay doi moi so voi lan truoc, chi day lai ban hien tai.
    goto :push
)
git commit -m "%MSG%" >nul
if %errorlevel% neq 0 (
    echo [!] Tao commit that bai. Chay lai upload.bat de xem loi chi tiet o tren.
    goto :end
)
echo       Da tao commit: %MSG%

rem ---------- [4/4] Push ----------
:push
echo [4/4] Dang day code len GitHub ^(co the hien cua so dang nhap GitHub^)...
git push -u origin %BRANCH%
if %errorlevel% neq 0 goto :pushfail

echo.
echo [V] HOAN THANH.
echo     Ma nguon:  https://github.com/%REPO%
echo     Trang web: %PAGES%
echo     ^(Lan dau can bat GitHub Pages: Settings ^> Pages ^> Branch: main / root ^> Save.
echo      Sau do doi 1-2 phut roi mo link tren. Cac lan sau tu cap nhat.^)
goto :end

rem ============================================================
rem  Cac nhanh dung lai
rem ============================================================
:otpmock
echo.
echo [!] KHONG DAY. js\config.js dang gan cung OTP_MODE: 'dev-mock' - dang nhap gia.
echo     Tra lai doan tu chon theo may: chi localhost moi dung dev-mock,
echo     luu lai, roi bam dup upload.bat lan nua.
echo.
goto :end

:stopdel
git reset -q
echo     Da dung, chua day gi. Chep lai cac file thieu vao thu muc roi chay lai.
goto :end

:nogit
echo [!] May nay chua cai Git, nen chua day code len duoc.
echo.
echo     Cach cai ^(lam mot lan^):
echo       1. Mo trang: https://git-scm.com/download/win
echo       2. Tai ban "64-bit Git for Windows Setup" va chay, bam Next het.
echo       3. Cai xong, DONG cua so nay, roi bam dup upload.bat lai.
echo.
goto :end

:pushfail
echo.
echo [!] KHONG DAY DUOC. Thuong do mot trong ba ly do:
echo.
echo     1. Repo chua ton tai tren GitHub:
echo        Mo https://github.com/new , dat ten "STOP-4P-Healthcare-Staff-V2", chon Public,
echo        KHONG tick "Add a README", bam Create repository, roi chay lai.
echo.
echo     2. Tai khoan Git tren may chua co quyen voi repo %REPO%:
echo        Mo https://github.com/%REPO%/settings/access
echo        bam "Add people", them tai khoan GitHub dang dung tren may nay, roi chay lai.
echo.
echo     3. Tren GitHub co thay doi ma may chua co ^(sua truc tiep tren web^):
echo        Chay lenh:  git pull --rebase origin %BRANCH%   roi bam dup upload.bat lai.
echo.
goto :end

rem ============================================================
rem  Chuong trinh con: hoi ten / email neu Git chua biet
rem ============================================================
:askname
set /p "GITNAME=Nhap ten cua anh de ghi vao lich su (vi du: BS Thong): "
if not defined GITNAME set "GITNAME=ditruyenhungvuong"
git config user.name "%GITNAME%"
goto :eof

:askemail
set /p "GITEMAIL=Nhap email GitHub cua anh (Enter de bo qua): "
if not defined GITEMAIL set "GITEMAIL=ditruyenhungvuong@users.noreply.github.com"
git config user.email "%GITEMAIL%"
goto :eof

:end
echo.
pause
endlocal
