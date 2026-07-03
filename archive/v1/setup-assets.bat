@echo off
REM ============================================
REM Portfolio Asset Setup Script
REM Copies media from source folders into the portfolio asset structure
REM ============================================

echo Setting up portfolio assets...

REM Create directory structure
mkdir "assets\images\flexcell" 2>nul
mkdir "assets\images\flps" 2>nul
mkdir "assets\images\nike" 2>nul
mkdir "assets\images\automation" 2>nul
mkdir "assets\videos\nike" 2>nul
mkdir "assets\models" 2>nul
mkdir "assets\resume" 2>nul

echo.
echo --- Copying FlexCell images ---
copy "..\Amazon\FlexCell\Pics\*.jpg" "assets\images\flexcell\" /Y

echo.
echo --- Copying FLPS images ---
copy "..\Amazon\FLPS\*.jpg" "assets\images\flps\" /Y

echo.
echo --- Copying FLPS 3D model ---
copy "..\Amazon\FLPS\Roller Module.glb" "assets\models\" /Y

echo.
echo --- Copying FlexCell 3D model ---
copy "..\Amazon\FlexCell\700-02855.glb" "assets\models\flexcell.glb" /Y

echo.
echo --- Copying Nike images ---
copy "..\Amazon\Nike\*.jpg" "assets\images\nike\" /Y
copy "..\Amazon\Nike\*.png" "assets\images\nike\" /Y

echo.
echo --- Copying Nike videos ---
copy "..\Amazon\Nike\1mm Detents - compressed.m4v" "assets\videos\nike\" /Y
copy "..\Amazon\Nike\2mm Detents - compressed.m4v" "assets\videos\nike\" /Y
copy "..\Amazon\Nike\Bracket Rigidity - compressed.m4v" "assets\videos\nike\" /Y

echo.
echo ============================================
echo Asset setup complete!
echo.
echo REMAINING MANUAL STEPS:
echo 1. Add a thumbnail image for each project card:
echo    - assets/images/flexcell/flexcell-thumb.jpg
echo    - assets/images/flps/flps-thumb.jpg
echo    - assets/images/nike/nike-thumb.jpg
echo    - assets/images/automation/automation-thumb.jpg
echo    (You can copy/rename any of the photos above as thumbnails)
echo.
echo 2. Add your resume PDF:
echo    - assets/resume/resume.pdf
echo.
echo 3. (Optional) Add .glb models to assets/models/:
echo    - nike-autorack.glb
echo    - automation-tools.glb
echo ============================================
pause
