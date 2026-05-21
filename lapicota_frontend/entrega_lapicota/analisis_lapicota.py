from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col, count, month, year, concat_ws, desc, when
)
import os

# ─────────────────────────────────────────
# INICIAR SPARK CONECTADO AL CLUSTER
# ─────────────────────────────────────────
spark = SparkSession.builder \
    .appName("Analisis_Lapicota") \
    .master("spark://192.168.100.3:7077") \
    .config("spark.executor.memory", "600m") \
    .config("spark.driver.memory", "512m") \
    .config("spark.executor.cores", "1") \
    .getOrCreate()

spark.sparkContext.setLogLevel("WARN")

print("=" * 55)
print("  SISTEMA PENITENCIARIO LAPICOTA - ANALISIS PYSPARK")
print("=" * 55)

# ─────────────────────────────────────────
# CARGAR DATASET
# ─────────────────────────────────────────
DATASET = os.path.expanduser("~/labSpark/datasetpicota.csv")
SALIDA  = "/vagrant/resultados"
os.makedirs(SALIDA, exist_ok=True)

df = spark.read.csv(
    DATASET,
    header=True,
    inferSchema=True,
    nullValue=""
)

print(f"\nDataset cargado: {df.count()} filas | {len(df.columns)} columnas")
print(f"Periodo: 2023-2024 | Presos: 150 | Guardias: 20\n")

def guardar(df_resultado, nombre):
    ruta = f"{SALIDA}/{nombre}.csv"
    df_resultado.toPandas().to_csv(ruta, index=False, encoding="utf-8-sig")
    print(f"  [OK] {nombre} guardado")

# ─────────────────────────────────────────
# 1. TOP 10 PRESOS CON MAS INCIDENTES
# ─────────────────────────────────────────
print(">> 1. Top 10 presos con mas incidentes")
top_presos = df.filter(col("hubo_incidente") == "SI") \
    .groupBy("preso_id", "preso_nombres", "preso_apellidos", "preso_delito") \
    .agg(count("*").alias("total_incidentes")) \
    .orderBy(desc("total_incidentes")) \
    .limit(10)
top_presos.show(truncate=False)
guardar(top_presos, "01_top_presos_incidentes")

# ─────────────────────────────────────────
# 2. INCIDENTES POR TIPO
# ─────────────────────────────────────────
print(">> 2. Incidentes por tipo")
por_tipo = df.filter(col("hubo_incidente") == "SI") \
    .groupBy("incidente_tipo") \
    .agg(count("*").alias("total")) \
    .orderBy(desc("total"))
por_tipo.show(truncate=False)
guardar(por_tipo, "02_incidentes_por_tipo")

# ─────────────────────────────────────────
# 3. INCIDENTES POR PATIO
# ─────────────────────────────────────────
print(">> 3. Incidentes por patio")
por_patio = df.filter(col("hubo_incidente") == "SI") \
    .groupBy("preso_patio") \
    .agg(count("*").alias("total_incidentes")) \
    .orderBy(desc("total_incidentes"))
por_patio.show(truncate=False)
guardar(por_patio, "03_incidentes_por_patio")

# ─────────────────────────────────────────
# 4. VISITAS POR ESTADO
# ─────────────────────────────────────────
print(">> 4. Visitas por estado")
por_estado = df.groupBy("visita_estado") \
    .agg(count("*").alias("total")) \
    .orderBy(desc("total"))
por_estado.show(truncate=False)
guardar(por_estado, "04_visitas_por_estado")

# ─────────────────────────────────────────
# 5. INCIDENTES POR TURNO DE GUARDIA
# ─────────────────────────────────────────
print(">> 5. Incidentes por turno de guardia")
por_turno = df.filter(col("hubo_incidente") == "SI") \
    .groupBy("guardia_turno") \
    .agg(count("*").alias("total_incidentes")) \
    .orderBy(desc("total_incidentes"))
por_turno.show(truncate=False)
guardar(por_turno, "05_incidentes_por_turno")

# ─────────────────────────────────────────
# 6. EVOLUCION MENSUAL DE VISITAS E INCIDENTES
# ─────────────────────────────────────────
print(">> 6. Evolucion mensual")
df_fecha = df.withColumn("anio", year(col("visita_fecha"))) \
             .withColumn("mes", month(col("visita_fecha"))) \
             .withColumn("periodo", concat_ws("-", col("anio"), col("mes")))

evolucion = df_fecha.groupBy("anio", "mes", "periodo") \
    .agg(
        count("*").alias("total_visitas"),
        count(when(col("hubo_incidente") == "SI", True)).alias("total_incidentes")
    ) \
    .orderBy("anio", "mes")
evolucion.show(24, truncate=False)
guardar(evolucion, "06_evolucion_mensual")

# ─────────────────────────────────────────
# 7. TOP 5 GUARDIAS CON MAS INCIDENTES
# ─────────────────────────────────────────
print(">> 7. Top 5 guardias con mas incidentes")
top_guardias = df.filter(col("hubo_incidente") == "SI") \
    .groupBy("guardia_id", "guardia_nombres", "guardia_apellidos",
             "guardia_rango", "guardia_turno") \
    .agg(count("*").alias("total_incidentes")) \
    .orderBy(desc("total_incidentes")) \
    .limit(5)
top_guardias.show(truncate=False)
guardar(top_guardias, "07_top_guardias_incidentes")

# ─────────────────────────────────────────
# 8. DELITOS CON MAS INCIDENTES
# ─────────────────────────────────────────
print(">> 8. Delitos con mas incidentes asociados")
por_delito = df.filter(col("hubo_incidente") == "SI") \
    .groupBy("preso_delito") \
    .agg(count("*").alias("total_incidentes")) \
    .orderBy(desc("total_incidentes"))
por_delito.show(truncate=False)
guardar(por_delito, "08_incidentes_por_delito")

# ─────────────────────────────────────────
# RESUMEN FINAL
# ─────────────────────────────────────────
total        = df.count()
con_inc      = df.filter(col("hubo_incidente") == "SI").count()
realizadas   = df.filter(col("visita_estado").isin(
                    "APROBADA","PERMITIDA","FINALIZADA")).count()

print("\n" + "=" * 55)
print("  RESUMEN GENERAL")
print("=" * 55)
print(f"  Total registros analizados : {total:,}")
print(f"  Visitas realizadas         : {realizadas:,}")
print(f"  Total incidentes           : {con_inc:,}")
print(f"  Tasa de incidentes         : {con_inc/realizadas*100:.1f}%")
print(f"  Resultados guardados en    : {SALIDA}")
print("=" * 55)

spark.stop()
