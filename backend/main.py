import os
import json
import uuid
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# ==========================================
# 1. CONFIGURACIÓN DE ENTORNOS Y CLIENTES
# ==========================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY) if (SUPABASE_URL and SUPABASE_KEY) else None

app = FastAPI(
    title="OrthoAI Expert Pro API - CRD",
    description="Microservicio de Diagnóstico Cefalométrico y Biomecánica Ortodóntica con Gemini Vision y Supabase",
    version="2.6.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. ESQUEMA ESTRICTO DE SALIDA (PYDANTIC)
# ==========================================
class QuickSummary(BaseModel):
    skeletal_diagnosis: str = Field(description="Ej. Clase II Dolicofacial (Hiperdivergente)")
    skeletal_subtext: str = Field(description="Ej. Rotación mandibular horaria, perfil convexo.")
    vertical_problem: str = Field(description="Ej. Mordida Abierta Anterior (-4.5 mm)")
    vertical_subtext: str = Field(description="Ej. De OD 13 a 23 con interposición lingual activa.")
    dental_formula: str = Field(description="Ej. Ausencia previa de 14, 24, 34 y 44")
    dental_subtext: str = Field(description="Ej. Apiñamiento inf. (-5.5 mm) y 3ros molares presentes.")
    root_alert: str = Field(description="Ej. Acortamiento Radicular Anterior")
    root_subtext: str = Field(description="Ej. Prohibida extrusión anterior pura; usar intrusión molar.")

class TechnicalParameter(BaseModel):
    parameter: str = Field(description="Nombre del parámetro cefalométrico u oclusal")
    finding: str = Field(description="Hallazgo clínico medido o estimado en las imágenes")
    norm: str = Field(description="Norma clínica estándar")
    biomechanical_implication: str = Field(description="Impacto directo en el plan de tratamiento")

class RiskItem(BaseModel):
    title: str
    severity: str = Field(description="Alto, Medio-Alto, Moderado o Bajo")
    mitigation: str = Field(description="Protocolo biomecánico para evitar este riesgo")

class TreatmentOption(BaseModel):
    option_name: str = Field(description="Ej. Opción A (Gold Standard) o Opción B (Alineadores + Híbrido)")
    appliances: str = Field(description="Aparatología específica, prescripción, slot y anclaje")
    advantages: str
    limitations: str

class MonthlyStage(BaseModel):
    stage_group: str = Field(description="Debe ser 'fase1', 'fase2' o 'fase3' para los filtros de la UI")
    months_label: str = Field(description="Ej. MES 0 (PRE-FASE), MES 1 - 2, MES 7 - 9")
    archwire_or_focus: str = Field(description="Ej. Arcos .014 CuNiTi o .019x.025 SS + TADs")
    title: str = Field(description="Título corto de la etapa")
    clinical_action: str = Field(description="Instrucciones exactas en sillón para el ortodoncista")
    expected_movement: str = Field(description="Movimiento biológico y biomecánico esperado en esos meses")

class OrthoClinicalAnalysis(BaseModel):
    estimated_duration_months: int
    complexity_label: str = Field(description="Ej. Alta (Retratamiento)")
    anchorage_summary: str = Field(description="Ej. 2 TADs (IZC) + ATP")
    quick_summary: QuickSummary
    technical_table: List[TechnicalParameter]
    additional_treatments: List[str] = Field(description="Lista de interconsultas y procedimientos adicionales")
    clinical_risks: List[RiskItem]
    recommended_options: List[TreatmentOption] = Field(default_factory=list)
    monthly_roadmap: List[MonthlyStage]
    retention_protocol: str = Field(description="Protocolo detallado de retención fija y removible al finalizar")

# ==========================================
# 3. PROMPT DEL SISTEMA EXPERTO ORTODÓNTICO
# ==========================================
SYSTEM_PROMPT = """
Eres un Sistema Experto de Diagnóstico Ortodóntico y Biomecánica Avanzada diseñado para ortodoncistas expertos.
Analiza con rigor clínico la Radiografía Panorámica, la Radiografía Lateral de Cráneo y las Fotografías Intraorales adjuntas.

Reglas clínicas obligatorias:
1. Identifica ausencias dentales previas (ej. premolares extraídos), presencia de terceros molares, nivel de cresta ósea alveolar, proporción corona-raíz y morfología radicular (reabsorciones o raíces cortas/pipeta).
2. En la radiografía lateral, evalúa relación esquelética sagital (Clase I, II, III), biotipo vertical (braquifacial, mesofacial, dolicofacial/hiperdivergente), inclinación de incisivos (IMPA, 1-SN) y vías aéreas/tejidos blandos.
3. En las fotografías intraorales, evalúa relación molar y canina, overjet, overbite (mordida abierta o profunda en mm estimados), hábitos funcionales visibles (como interposición lingual), forma de arcadas, apiñamiento en mm, cálculo dental o recesiones gingivales.
4. Diseña una secuencia biomecánica MES A MES realista, segura para las raíces y el periodonto, especificando calibres y aleaciones de arcos (.014 CuNiTi, .016x.022, .019x.025 SS/TMA), uso de microtornillos (TADs) con gramos de fuerza, stripping (IPR) en milímetros y elásticos intermaxilares (diámetro y onzas).
5. Todo el contenido debe estar en español técnico ortodóntico de alto nivel.
"""

# ==========================================
# 4. HELPER PARA SUBIR ARCHIVOS A SUPABASE
# ==========================================
async def upload_to_supabase(file: UploadFile, folder: str) -> str:
    content = await file.read()
    ext = file.filename.split(".")[-1] if ("." in file.filename and file.filename) else "jpg"
    file_path = f"{folder}/{uuid.uuid4()}.{ext}"
    
    if supabase:
        supabase.storage.from_("ortho-media").upload(
            path=file_path,
            file=content,
            file_options={"content-type": file.content_type or "image/jpeg"}
        )
        public_url = supabase.storage.from_("ortho-media").get_public_url(file_path)
    else:
        # Fallback local simulado si Supabase no está configurado
        public_url = f"/ortho-media/{file_path}"

    await file.seek(0)
    return public_url

# ==========================================
# 5. ENDPOINTS
# ==========================================
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "supabase_configured": bool(supabase)
    }

@app.post("/api/v1/analyze-case")
async def analyze_ortho_case(
    patient_name: str = Form(...),
    patient_age: int = Form(...),
    referring_doctor: str = Form("Dra. Liseth Guevara Muñoz"),
    rx_panoramic: UploadFile = File(...),
    rx_lateral: UploadFile = File(...),
    intraoral_photos: List[UploadFile] = File(...)
):
    try:
        if not ai_client:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY no está configurada en las variables de entorno del servidor."
            )

        # 1. Preparar partes multimodales para Gemini Vision
        contents = [
            f"Paciente: {patient_name}, Edad: {patient_age} años, Ortodoncista: {referring_doctor}.",
            "Imagen 1: Radiografía Panorámica (Ortopantomografía):"
        ]
        
        pan_bytes = await rx_panoramic.read()
        contents.append(types.Part.from_bytes(data=pan_bytes, mime_type=rx_panoramic.content_type or "image/jpeg"))
        await rx_panoramic.seek(0)

        contents.append("Imagen 2: Radiografía Lateral de Cráneo:")
        lat_bytes = await rx_lateral.read()
        contents.append(types.Part.from_bytes(data=lat_bytes, mime_type=rx_lateral.content_type or "image/jpeg"))
        await rx_lateral.seek(0)

        contents.append("Fotografías Intraorales del caso:")
        for idx, photo in enumerate(intraoral_photos):
            p_bytes = await photo.read()
            contents.append(types.Part.from_bytes(data=p_bytes, mime_type=photo.content_type or "image/jpeg"))
            await photo.seek(0)

        # 2. Llamar a Gemini con Structured Outputs
        # Usa gemini-2.5-pro o fallback si se requiere
        response = ai_client.models.generate_content(
            model="gemini-2.5-pro",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=OrthoClinicalAnalysis,
                temperature=0.15,
            ),
        )

        analysis_dict = json.loads(response.text)

        # 3. Subir imágenes a Storage
        panoramic_url = await upload_to_supabase(rx_panoramic, "radiographs")
        lateral_url = await upload_to_supabase(rx_lateral, "radiographs")
        photo_urls = []
        for photo in intraoral_photos:
            url = await upload_to_supabase(photo, "intraoral")
            photo_urls.append(url)

        # 4. Guardar expediente en PostgreSQL (Supabase)
        case_id = str(uuid.uuid4())
        db_payload = {
            "id": case_id,
            "patient_name": patient_name,
            "patient_age": patient_age,
            "referring_doctor": referring_doctor,
            "rx_panoramic_url": panoramic_url,
            "rx_lateral_url": lateral_url,
            "intraoral_photos_urls": photo_urls,
            "clinical_analysis": analysis_dict,
            "status": "active"
        }

        if supabase:
            db_res = supabase.table("ortho_cases").insert(db_payload).execute()
            saved_case = db_res.data[0] if db_res.data else db_payload
        else:
            saved_case = db_payload

        return {
            "success": True,
            "case": saved_case
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el análisis clínico: {str(e)}")


@app.get("/api/v1/cases/{case_id}")
async def get_case(case_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase no está configurado en el servidor.")
    res = supabase.table("ortho_cases").select("*").eq("id", case_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Caso no encontrado")
    return res.data
