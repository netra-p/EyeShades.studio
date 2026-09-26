@echo off
echo ==================================================================
echo  BUILDING PRODUCTION EXECUTABLE JAR (THE EYESHADES STUDIO)
echo ==================================================================
mvn clean package -DskipTests
echo.
echo ==================================================================
echo  BUILD COMPLETE! Standalone JAR created in \target directory:
echo  target\eyeshades-backend-1.0.0.jar
echo.
echo  To run the production JAR:
echo  java -jar target\eyeshades-backend-1.0.0.jar
echo ==================================================================
pause
