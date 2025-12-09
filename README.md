# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
finanzas-frontend/
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── public/
│   └── vite.svg
└── src/
    ├── App.css
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── assets/
    │   └── react.svg
    ├── components/
    │   ├── common/
    │   │   ├── Layout/
    │   │   │   ├── Header.jsx
    │   │   │   ├── Layout.jsx
    │   │   │   └── Sidebar.jsx
    │   │   └── UI/
    │   │       ├── Button.jsx
    │   │       ├── Input.jsx
    │   │       ├── Modal.jsx
    │   │       ├── PDFButton.jsx
    │   │       └── Select.jsx
    │   ├── dashboard/
    │   │   ├── CalendarioTrabajo.jsx
    │   │   ├── RegistroRapido.jsx
    │   │   └── StatsCards.jsx
    │   ├── gastos/
    │   │   └── GastoForm.jsx
    │   └── ingresos/
    │       └── IngresoForm.jsx
    ├── hooks/
    │   ├── useGastos.js
    │   └── useIngresos.js
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── GastosPage.jsx
    │   └── IngresosPage.jsx
    ├── services/
    │   ├── api.js
    │   ├── gastosService.js
    │   ├── ingresosService.js
    │   └── pdfService.js
    ├── stores/
    └── utils/