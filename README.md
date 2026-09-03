# ADEX Frontend

Aplicación web desarrollada en **Angular 22** para la gestión y visualización de alumnos, conectada al API ADEX Backend.

## 🚀 Tecnologías
- Angular 22
- TypeScript
- Angular Material
- RxJS (debounce)
- Bootstrap
- SheetJS (exportación Excel)
- jsPDF + jspdf-autotable (exportación PDF)

## ✨ Funcionalidades
- Listado paginado de alumnos (10 por página)
- Búsqueda por nombre con debounce automático (400ms)
- Modal de detalle y edición de alumno
- Botón de anulación de alumno
- Indicadores de estado (Atendido / No Atendido)
- Indicador de anulación (Sí / No)
- **Exportación a Excel** de la página actual
- **Exportación a PDF** de la página actual

## ⚙️ Cómo ejecutarlo
1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Ejecutar: `ng serve`
4. Abrir: `http://localhost:4200`

> ⚠️ Requiere el API ADEX Backend corriendo en `http://localhost:5103`



Notas:

## 📦 Dependencias adicionales instaladas para Exportación Excel/PDF
```bash
npm install xlsx file-saver
npm install jspdf jspdf-autotable
npm install @types/file-saver --save-dev

Paquetes NPM instalados:
-npm install @angular/material
-npm install @angular/cdk

Módulos de Angular Material usados:
-MatFormFieldModule
-MatInputModule
-MatDatepickerModule
-provideNativeDateAdapter

Librerías ya incluidas en Angular:
-FormsModule — para ngModel y two-way binding
-HttpClient con withFetch() — para llamadas al API
-RxJS — para el debounce (Subject, debounceTime, distinctUntilChanged, takeUntil)


Configuraciones aplicadas:
En app.config.ts:
provideHttpClient(withFetch())
