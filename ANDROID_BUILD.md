# Guía de Construcción y Despliegue en Android (Cifra APK)

Esta guía documenta los pasos necesarios para compilar y empaquetar la aplicación Next.js estática en un APK Android utilizando Capacitor.

## 1. Requisitos Previos

Asegúrate de tener instalados en tu sistema:
- **Node.js** (v18+)
- **Android Studio** (Koala o versión más reciente)
- **Java Development Kit (JDK 17)**: Capacitor en Android 14 requiere JDK 17 (puedes instalarlo directamente desde Android Studio en *Settings > Build, Execution, Deployment > Build Tools > Gradle*).

## 2. Preparación del Proyecto

Cada vez que realices cambios en el código de Next.js (`.tsx`, `.css`), debes generar los binarios estáticos y sincronizarlos con Android. Para ello, corre este comando desde la raíz del proyecto:

```bash
npm run android:build
```
*Este comando ejecuta internamente `next build` (generando la carpeta `out`) y luego `npx cap sync android` (copiando `out` al proyecto nativo de Android).*

## 3. Pruebas en Dispositivo o Emulador

Para abrir el proyecto en Android Studio y probarlo:
```bash
npm run android:open
```
Esto abrirá Android Studio. Desde allí:
1. Espera a que Gradle termine de sincronizar (verás una barra de carga en la parte inferior).
2. Conecta tu teléfono Android mediante USB (con "Depuración USB" activada) o selecciona un emulador.
3. Presiona el botón verde de "Play" (Run 'app') en la barra superior.

## 4. Generar el APK de Prueba (Debug)

Para instalar la aplicación en teléfonos sin subirla a Google Play, puedes crear un APK de Debug:
1. En Android Studio, ve al menú superior **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Al finalizar, aparecerá una notificación abajo a la derecha. Haz clic en "locate".
3. El archivo `app-debug.apk` estará en `android/app/build/outputs/apk/debug/`.
4. Transfiere este archivo a cualquier teléfono Android e instálalo (debes permitir "Orígenes desconocidos" en tu teléfono).

## 5. Próximos pasos (Release para Google Play)

Cuando desees publicar en la Play Store, requerirás un APK firmado:
1. En Android Studio, ve a **Build > Generate Signed Bundle / APK**.
2. Selecciona **Android App Bundle** (para Google Play) o **APK** (para distribución propia externa).
3. Haz clic en *Create new...* en "Key store path" y guarda tu contraseña de Keystore de forma extremadamente segura (si la pierdes, no podrás actualizar tu app en el futuro).
4. El archivo generado estará en `android/app/build/outputs/apk/release/app-release.apk`.
