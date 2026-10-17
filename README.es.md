<!-- l10n-sync: source-file="README.md" -->
🌐 [English](README.md) | Español | [Português (Brasil)](README.pt_BR.md) | [한국어](README.ko.md)

# 🎮 Mona Mayhem

**Taller de VS Code y GitHub Copilot CLI** — Construye una Arena de Batalla de Contribuciones de GitHub

Una plantilla de taller para construir con Astro un sitio web de temática arcade retro que compara los gráficos de contribuciones de GitHub de dos usuarios. Este es el **punto de partida**: construirás la app paso a paso con GitHub Copilot.

![Mona Mayhem Screenshot](https://github.com/user-attachments/assets/5eca79e2-cb9f-4e93-aa0d-23666ebde3b7)
*Lo que habrás construido al final del taller*

## 📚 Taller

El taller ofrece dos pistas; sigue la que se ajuste a tu flujo de trabajo preferido:

- **Pista VS Code**: Chat, Plan Mode, Agent Mode, agentes en segundo plano y ciclos de revisión integrados en el editor
- **Pista CLI**: `copilot`, contexto con `@file`, `/plan`, ediciones autónomas, `/fleet`, `/delegate` y `/review`

| Parte | Título | Enfoque de Copilot |
|-------|--------|--------------------|
| [00](workshop/es/00-overview.md) | Visión General | Selección de pista y objetivos de aprendizaje |
| [01](workshop/es/01-setup.md) | Configuración e Ingeniería de Contexto | Instrucciones, permisos y configuración del entorno |
| [02](workshop/es/02-plan-and-scaffold.md) | Planificar y Estructurar | Planificación de la API y de la arquitectura de la página |
| [03](workshop/es/03-agent-mode.md) | Construir el Juego | Implementación agentic e iteración |
| [04](workshop/es/04-design-vibes.md) | Temas Design-First | Planificación e implementación del diseño visual |
| [05](workshop/es/05-polish.md) | Pulido y Trabajo Paralelo | Paralelismo, revisiones y pasadas de calidad |
| [06](workshop/es/06-bonus.md) | Bonus y Extensiones | Ideas de funcionalidades abiertas y experimentos adicionales con Copilot |

## 🚀 Inicio Rápido

1. **Crea primero tu propio repositorio** de una de estas formas:
   - haciendo clic en **Use this template** para crear un repositorio nuevo, o
   - creando una bifurcación (fork) de este repositorio.
2. Elige tu ruta del taller:
   - **VS Code:** clona tu repositorio y ábrelo en VS Code.
   - **GitHub Copilot CLI:** clona tu repositorio en local, instala `copilot` y trabaja desde la terminal.
3. Sigue la [guía del taller](workshop/es/00-overview.md)

## Requisitos Previos

### Comunes

- GitHub Copilot (Pro, Business o Enterprise)
- Git
- Node.js

### Pista VS Code

- VS Code v1.107+
- Extensión de GitHub Copilot con la sesión iniciada

### Pista CLI

- GitHub Copilot CLI (`copilot`)
- Node.js 22+ si piensas instalar la CLI con `npm install -g @github/copilot`
- O Homebrew / WinGet si prefieres instalarla con un gestor de paquetes nativo

## Stack Tecnológico

- **Framework**: [Astro](https://astro.build/) v6
- **Runtime**: Node.js con adaptador [@astrojs/node](https://docs.astro.build/en/guides/integrations-guide/node/)
- **Fuente**: Press Start 2P (fuente de juegos retro)
- **API**: API de gráfico de contribuciones de GitHub

## Búsqueda de Jugadores y Apariencia

Ambos campos de jugador sugieren hasta cinco nombres de usuario de GitHub a partir
de dos caracteres. Usa las flechas arriba/abajo e Intro, o haz clic en una
sugerencia. Las búsquedas se aplazan con debounce y los resultados recientes se
guardan en caché durante un minuto. Si la búsqueda de GitHub no está disponible o
se ha alcanzado su límite de solicitudes, escribir el nombre de usuario completo
sigue funcionando.

En **Settings**, elige Blue, Red, Purple, Green, Amber o Graphite, o selecciona un
color personalizado. La paleta se aplica a toda la interfaz y a la animación de
inicio, con el brillo ajustado para mantener la legibilidad. Las preferencias se
guardan en este navegador; **Restore blue theme** restablece el color sin cambiar
la configuración de sonido ni de inicio.

## Notas de Despliegue

### GitHub Pages

El flujo de trabajo de `.github/workflows/deploy.yml` prueba, compila y despliega
la aplicación Astro en cada push a `main`, o mediante ejecución manual. En
**Settings > Pages** del repositorio, selecciona **GitHub Actions** como origen de
la compilación. La URL prevista para este repositorio es
<https://takax170.github.io/my-mona-mayhem/>.

`npm run build:pages` genera archivos estáticos en `dist/`. La configuración usa
`GITHUB_REPOSITORY` (por defecto: `Takax170/my-mona-mayhem`) para establecer el
dominio de Pages y la ruta base del repositorio. A diferencia del despliegue
anterior, publica la app y no el sitio independiente del taller de `docs/`.

Pages no puede ejecutar rutas de API. Solo en esta compilación, el navegador llama
directamente a `https://github.com/{username}.contribs` aprovechando la
compatibilidad pública de GitHub con CORS. Reutiliza la misma validación de nombre
de usuario y de datos, el mismo tiempo de espera, la misma gestión de errores y la
misma caché en memoria que el servicio del servidor. No se necesita ningún token ni
proxy de terceros; sí se requieren la disponibilidad de GitHub y su compatibilidad
con CORS. Del mismo modo, las sugerencias de nombres de usuario llaman directamente
a `https://api.github.com/search/users` en Pages, sin token.

### Alojamiento con Node

`npm run dev`, `npm run build` y `npm run preview` mantienen la configuración del
servidor Node y los proxies del mismo origen `/api/contributions/:username` y
`/api/users/:query`. Tras la compilación, ejecuta `node dist/server/entry.mjs` en
un host con Node.

## Licencia

MIT
