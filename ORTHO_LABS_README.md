# Ortho Labs — Suite Clínica OrthoAI Expert Pro
**Clínica Dra. Liseth Guevara (Mérida, Yucatán)**

Este módulo agrega a la plataforma de la Dra. Liseth Guevara una suite experta de diagnóstico ortodóntico y planificación biomecánica asistida por Inteligencia Artificial multimodal (**Gemini 2.5 Pro Vision** + **Supabase**).

---

## 📂 Archivos y Estructura Creada

```
/Users/adalloya/Desktop/APPS/
├── ortho-labs.html               # Suite clínica interactiva completa (HTML5 + Tailwind CSS + JS)
├── index.html                    # Landing page con enlace en Navbar y nueva sección Ortho Labs
├── ortho-media/                  # Carpeta de imágenes clínicas reales del caso demo
│   ├── rx_panoramica_demo.jpg    # Ortopantomografía IDI
│   ├── rx_lateral_demo.jpg       # Cefalometría lateral de cráneo
│   ├── foto_frontal_demo.jpg     # Foto intraoral frontal (mordida abierta)
│   └── foto_lateral_demo.jpg     # Foto intraoral lateral (oclusión)
└── backend/                      # Microservicio FastAPI para producción
    ├── main.py                   # API con Gemini Vision, Pydantic Structured Outputs y Supabase
    ├── schema.sql                # Script SQL para crear la tabla 'ortho_cases'
    ├── requirements.txt          # Dependencias de Python
    └── .env.example              # Plantilla de variables de entorno
```

---

## 🚀 Funcionalidades Implementadas al 100%

1. **Expediente Clínico Real Demo:**
   - Paciente: **Martha Gabriela Zúñiga Núñez** (40 años).
   - Patrón esquelético Clase II Dolicofacial, mordida abierta anterior (-4.5 mm), alerta de acortamiento radicular y ausencias previas (14, 24, 34, 44).
   - Tabla técnica cefalométrica (Overbite, FMA, IMPA, Discrepancia ósea, Proporción corona-raíz).
   - Matriz de riesgos clínicos con mitigación específica.
   - Secuencia biomecánica **mes a mes (Mes 0 al 18)** con filtros interactivos (*Alineación*, *Intrusión TADs*, *Cierre y Detalle*).
   - Protocolo de retención definitiva antirrecidiva.

2. **Galería Fotográfica y Radiográfica Interactiva:**
   - Visualización de las 4 imágenes reales del paciente en alta resolución con **modal Lightbox** al hacer clic.

3. **Exportación a PDF Limpia:**
   - El botón **"Exportar PDF Expediente"** ejecuta `window.print()` con estilos optimizados que ocultan menús, botones y adaptan bordes y firmas legales de la Dra. Liseth y del paciente para anexar directo al expediente físico o digital.

4. **Modal para Cargar y Analizar Nuevos Casos:**
   - Formulario para nombre, edad, Rx Panorámica, Rx Lateral y fotografías intraorales múltiples.
   - Conectado a la API `POST /api/v1/analyze-case` con fallback demostrativo instantáneo.

5. **Integración en la Landing Page Principal (`index.html`):**
   - Enlace destacado en el menú de navegación con insignia IA.
   - Sección dedicada e inmersiva que explica a los pacientes y doctores el respaldo de **Ortho Labs** con fotos del caso demo y enlace directo a la suite.

---

## 🛠️ Cómo poner en marcha el Backend de Producción (Opcional)

Si deseas procesar nuevos casos reales en vivo con tu propia API Key de Gemini y Supabase:

1. **Supabase:**
   - Ve al *SQL Editor* de tu proyecto Supabase y ejecuta el archivo [`backend/schema.sql`](file:///Users/adalloya/Desktop/APPS/backend/schema.sql).
   - En *Storage*, crea un bucket público llamado `ortho-media`.

2. **Instalar dependencias y levantar API:**
   ```bash
   cd /Users/adalloya/Desktop/APPS/backend
   pip install -r requirements.txt
   cp .env.example .env  # y coloca tu GEMINI_API_KEY y llaves de Supabase
   uvicorn main:app --reload --port 8000
   ```
