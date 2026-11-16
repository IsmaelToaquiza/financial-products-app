# Financial Products App

Aplicación web desarrollada con **Angular y TypeScript** como parte del reto técnico de **Devsu**.

Permite gestionar productos financieros mediante una interfaz responsive, con funcionalidades de listado, búsqueda, creación, edición y eliminación de productos.

## Tecnologías utilizadas

- Angular 22 y TypeScript
- SCSS
- Angular Reactive Forms
- RxJS y Signals
- Font Awesome
- Jest

## Requisitos previos

Para ejecutar el proyecto necesitas:

- **Node.js:** `26.13.1`
- **npm:** `11.20.0`
- El backend proporcionado para la prueba técnica.

## Instalación

**1. Clonar el repositorio**

```bash
git clone <URL_DEL_REPOSITORIO>
cd financial-products-app
```

**2. Configurar Node.js**

Si utilizas NVM:

```bash
nvm install
nvm use
npm install -g npm@11.20.0
```

**3. Instalar las dependencias**

```bash
npm ci
```

**4. Iniciar el backend**

Ejecuta el backend de la prueba técnica en:

`http://127.0.0.1:3002`

**5. Iniciar la aplicación**

```bash
npm start
```

Abre en el navegador:

**http://localhost:4200**

La aplicación utiliza un proxy para comunicarse con el backend local.

## Pruebas

Para ejecutar las pruebas unitarias:

```bash
npm test
```

## Compilación

Para generar la versión de producción:

```bash
npm run build
```

---

Desarrollado como parte del reto técnico de **Devsu**.