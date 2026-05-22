# Guía completa de JMeter — Sistema Lapicota
## Cómo ejecutar pruebas de carga en Windows y leer los resultados

---

## Requisitos previos

### 1. Instalar Java

Abre PowerShell y ejecuta:

```powershell
java -version
```

Si dice `'java' is not recognized` o no está instalado:

1. Ve a [https://adoptium.net](https://adoptium.net)
2. Descarga **JDK 17** para Windows x64
3. Instala con todas las opciones por defecto
4. Cierra y vuelve a abrir PowerShell
5. Ejecuta `java -version` de nuevo — debe mostrar la versión

### 2. Instalar JMeter

1. Ve a [https://jmeter.apache.org/download_jmeter.cgi](https://jmeter.apache.org/download_jmeter.cgi)
2. Bajo **"Binaries"** descarga: `apache-jmeter-5.6.3.zip`
3. Descomprime el zip en `C:\jmeter\`
4. La estructura debe quedar:

```
C:\jmeter\
  ├── bin\
  │    └── jmeter.bat   ← este archivo vas a ejecutar
  ├── lib\
  └── extras\
```

### 3. Verificar que las VMs están corriendo

Abre PowerShell en la carpeta del proyecto y ejecuta:

```powershell
cd C:\Users\andre\Documents\proyecto_final
vagrant status
```

Debes ver `web1` y `dns1` en estado `running`. Si no:

```powershell
vagrant up
```

Espera a que levanten (puede tardar 2-3 minutos) y verifica que el stack está activo:

```powershell
vagrant ssh web1 -c "docker stack services lapicota"
```

Todos los servicios deben mostrar `2/2` o `1/1` en la columna REPLICAS.

---

## Parte 1 — Abrir JMeter

Navega a `C:\jmeter\bin\` y haz doble clic en `jmeter.bat`.

Se abre una ventana negra de consola (no la cierres) y luego la interfaz gráfica de JMeter.

La interfaz tiene tres zonas:

```
┌─────────────────────────────────────────────────────────────┐
│  [Menú: File / Edit / Run / Options / Help]                 │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│   PANEL IZQUIERDO    │         PANEL DERECHO                │
│   (árbol del plan)   │   (configuración del elemento        │
│                      │    seleccionado en el árbol)         │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
│  [Barra de estado: threads activos / tiempo transcurrido]   │
└─────────────────────────────────────────────────────────────┘
```

---

## Parte 2 — Importar el plan de pruebas

1. En el menú superior: **File → Open**
2. Navega a:
   ```
   C:\Users\andre\Documents\proyecto_final\jmeter\lapicota_load_test.jmx
   ```
3. Click en **Abrir**

El panel izquierdo ahora muestra el árbol completo:

```
📋 Lapicota - Plan de Pruebas de Carga
 ├── 🔧 HTTP Headers - JSON
 ├── 🔧 HTTP Request Defaults
 ├── 👥 [TG1] SMOKE TEST - Verificacion Basica         ← texto negro (ACTIVO)
 ├── 👥 [TG2] CARGA - Lectura Masiva (50u / 5min)      ← texto gris (inactivo)
 ├── 👥 [TG3] CARGA - Escritura (20u / 5min)           ← texto gris (inactivo)
 ├── 👥 [TG4] STRESS TEST - Limite (200u / 10min)      ← texto gris (inactivo)
 ├── 📊 Summary Report
 ├── 📊 Aggregate Report
 └── 📊 Response Times Graph
```

> Los elementos en **texto gris** están desactivados — JMeter los ignora al correr.

---

## Parte 3 — Configurar la IP de las máquinas virtuales

**Este paso es crítico.** Si la IP es incorrecta, JMeter no puede llegar a los microservicios.

1. Haz click en la raíz del árbol:
   ```
   📋 Lapicota - Plan de Pruebas de Carga
   ```

2. En el panel derecho aparece una tabla de variables. Verifica:

   | Nombre | Valor | ¿Correcto? |
   |--------|-------|------------|
   | HOST | 192.168.100.3 | IP del manager (web1) |
   | PORT_USUARIOS | 3001 | Puerto del servicio de usuarios |
   | PORT_VISITAS | 3002 | Puerto del servicio de visitas |
   | PORT_INCIDENTES | 3003 | Puerto del servicio de incidentes |
   | PROTOCOLO | http | No cambiar |

3. Para confirmar la IP real de tu web1, abre PowerShell y ejecuta:
   ```powershell
   vagrant ssh web1 -c "hostname -I"
   ```
   Si la IP devuelta es diferente a `192.168.100.3`, haz doble click sobre el valor en la tabla y cámbiala.

4. Guarda los cambios: **Ctrl + S**

---

## Parte 4 — Configurar dónde se guardan los resultados

Cada listener (Summary Report, Aggregate Report) guarda un archivo CSV con los datos.

### Para Summary Report:
1. Click en **Summary Report** en el árbol izquierdo
2. En el panel derecho, busca el campo **Filename**
3. Cambia el valor a ruta absoluta:
   ```
   D:\UAO\Cuarto Semestre\Redes e Infraestructura\proyecto_final\jmeter\results\summary_report.csv
   


   C:\Users\andre\Documents\proyecto_final\jmeter\results\summary_report.csv
   ```

### Para Aggregate Report:
1. Click en **Aggregate Report** en el árbol
2. Cambia **Filename** a:
   ```
   D:\UAO\Cuarto Semestre\Redes e Infraestructura\proyecto_final\jmeter\results\aggregate_report.csv
   ```

### Para Response Times Graph:
1. Click en **Response Times Graph** en el árbol
2. Cambia **Filename** a:
   ```
   D:\UAO\Cuarto Semestre\Redes e Infraestructura\proyecto_final\jmeter\results\response_times.csv
   ```

Guarda: **Ctrl + S**

---

## Parte 5 — PRUEBA 1: Smoke Test

**Objetivo:** verificar que todos los microservicios responden antes de meter carga real.

### Configuración actual (no cambiar nada):
- TG1 activo, TG2/TG3/TG4 inactivos
- 5 usuarios, 1 sola iteración

### Cómo correrlo:

Presiona el botón **▶** (verde) en la barra de herramientas, o usa el menú **Run → Start**.

La barra de estado abajo muestra:
```
0/5   ← threads activos / threads totales
```

### Dónde ver los resultados mientras corre:

Haz click en **Summary Report** en el árbol izquierdo. La tabla se llena en tiempo real:

```
┌─────────────────────┬────────┬────────┬───────┬──────────┬────────┬──────────────┐
│ Label               │Samples │Average │ Min   │  Max     │ Error% │ Throughput   │
├─────────────────────┼────────┼────────┼───────┼──────────┼────────┼──────────────┤
│ GET /presos         │   5    │  198ms │  45ms │  420ms   │  0.00% │   2.5/sec    │
│ GET /guardias       │   5    │  165ms │  38ms │  310ms   │  0.00% │   2.5/sec    │
│ GET /api/visitas    │   5    │  287ms │  90ms │  650ms   │  0.00% │   2.5/sec    │
│ GET /incidentes     │   5    │  312ms │ 110ms │  780ms   │  0.00% │   2.5/sec    │
│ TOTAL               │  20    │  241ms │  38ms │  780ms   │  0.00% │  10.0/sec    │
└─────────────────────┴────────┴────────┴───────┴──────────┴────────┴──────────────┘
```

### Qué significa cada columna del Summary Report:

| Columna | Qué es | Valor aceptable |
|---------|--------|-----------------|
| **Samples** | Cuántas peticiones se enviaron | 5 en smoke |
| **Average** | Tiempo promedio de respuesta en ms | < 500ms |
| **Min** | La petición más rápida | Referencia |
| **Max** | La petición más lenta | No > 3000ms |
| **Error%** | Porcentaje de peticiones fallidas | **0% en smoke** |
| **Throughput** | Peticiones por segundo que procesa | Mayor = mejor |
| **Received KB/sec** | Datos que llegan por segundo | Referencia de red |

### Resultado esperado del Smoke Test:

- `Error% = 0.00%` en **todas** las filas → el sistema está vivo y funciona correctamente
- Si alguna fila muestra error, hay un problema antes de continuar

### Si hay errores en el smoke test:

Haz click en **[SMOKE] View Results Tree** dentro del TG1 en el árbol.
Verás cada petición listada con un ícono:
- ✅ verde → exitosa
- ❌ rojo → falló

Haz click en la petición que falló. En el panel derecho verás tres pestañas:
- **Sampler result** → muestra el código de error (404, 500, etc.)
- **Request** → qué exactamente envió JMeter
- **Response data** → qué respondió el servidor (el mensaje de error)

Errores comunes y solución:

| Error que ves | Causa | Solución |
|---|---|---|
| `Connection refused` | El servicio no está corriendo | Verificar `docker stack services lapicota` |
| `Connection timed out` | IP incorrecta o VM apagada | Verificar IP en variables y `vagrant status` |
| `404 Not Found` | La ruta del endpoint es incorrecta | Revisar que HAProxy esté corriendo |
| `500 Internal Server Error` | La BD no está lista | Esperar 1 minuto y volver a correr |

### Limpiar resultados antes de la siguiente prueba:

Antes de cada prueba nueva, borra los datos anteriores del listener:
```
Menú Run → Clear All   (o Ctrl + E)
```

---

## Parte 6 — PRUEBA 2: Carga de Lectura (50 usuarios)

**Objetivo:** simular 50 personas consultando el sistema al mismo tiempo durante 5 minutos.

### Activar TG2 y desactivar TG1:

1. Click derecho sobre **[TG1] SMOKE TEST** en el árbol → **Disable**
   - El texto del TG1 se pone gris
2. Click derecho sobre **[TG2] CARGA - Lectura Masiva** → **Enable**
   - El texto del TG2 se pone negro

### Ver la configuración de TG2 (solo para entender):

Click en **[TG2] CARGA - Lectura Masiva** en el árbol. En el panel derecho ves:

```
Number of Threads (users): 50       ← 50 usuarios virtuales
Ramp-up period (seconds):  60       ← tarda 60 segundos en llegar a 50 usuarios
Loop Count:                Forever  ← repite hasta que termine la duración
Duration (seconds):        300      ← corre durante 5 minutos (300 segundos)
```

El **ramp-up** significa que JMeter no lanza los 50 usuarios de golpe. Los agrega gradualmente: 1 usuario cada 1.2 segundos durante el primer minuto. Esto simula mejor la realidad.

### Correr la prueba:

Presiona **▶**. La barra de estado muestra el avance:
```
23/50   ← usuarios activos (sube durante el ramp-up)
```

### Qué mirar mientras corre:

#### En Summary Report:

La tabla se actualiza cada pocos segundos. Observa:

1. **Error%** — si sube por encima de 1%, uno de los servicios está fallando
2. **Average** — si crece con el tiempo, el sistema se está degradando
3. **Throughput** — cuántas peticiones por segundo procesa el sistema total

#### En Aggregate Report:

Click en **Aggregate Report** en el árbol. Esta tabla es más detallada:

```
┌──────────────────────┬───────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┐
│ Label                │  #    │ Avg  │ Min  │ Max  │ p90  │ p95  │ p99  │  KO%  │
├──────────────────────┼───────┼──────┼──────┼──────┼──────┼──────┼──────┼───────┤
│ GET /presos          │ 2,840 │ 198ms│ 45ms │420ms │380ms │480ms │890ms │  0.0% │
│ GET /guardias        │ 2,710 │ 165ms│ 38ms │310ms │290ms │350ms │620ms │  0.0% │
│ GET /api/visitas     │ 2,650 │ 312ms│ 90ms │9999ms│650ms │980ms │4200ms│  1.2% │
│ GET /incidentes      │ 2,580 │ 287ms│ 55ms │2100ms│520ms │780ms │1800ms│  0.3% │
└──────────────────────┴───────┴──────┴──────┴──────┴──────┴──────┴──────┴───────┘
```

### Qué significa p90, p95, p99:

Imagina que tienes 100 usuarios usando el sistema al mismo tiempo:

| Métrica | Significa |
|---------|-----------|
| **p90 = 380ms** | 90 de esos 100 usuarios reciben respuesta en menos de 380ms |
| **p95 = 480ms** | 95 de esos 100 usuarios reciben respuesta en menos de 480ms |
| **p99 = 890ms** | 99 de esos 100 usuarios reciben respuesta en menos de 890ms |

El p90 es el más usado para definir si el sistema está bien. Referencia:

| p90 | Evaluación |
|-----|------------|
| < 500ms | Excelente |
| 500ms - 1000ms | Bueno |
| 1000ms - 2000ms | Regular |
| > 2000ms | Malo, los usuarios se quejan |

### Señales de alarma durante la prueba:

**El Average sube continuamente:**
```
min 1: Average = 200ms
min 2: Average = 350ms
min 3: Average = 580ms
min 4: Average = 940ms   ← el sistema se está degradando
```
Significa que las peticiones se acumulan más rápido de lo que el sistema las procesa.

**El Error% sube:**
```
Inicio: Error% = 0.0%
A los 2 min: Error% = 0.5%
A los 4 min: Error% = 3.2%   ← algún servicio está colapsando
```
Detén la prueba (menú **Run → Stop**), revisa qué servicio falla.

**Throughput se estanca aunque usuarios suben:**
```
50 usuarios → 45 req/s     ← este es el límite real del sistema
```

### Limpiar antes de la siguiente prueba:
```
Menú Run → Clear All
```

---

## Parte 7 — PRUEBA 3: Carga de Escritura (20 usuarios)

**Objetivo:** probar qué pasa cuando 20 personas crean registros al mismo tiempo (POST).

### Activar TG3:

1. Click derecho sobre **[TG2]** → **Disable**
2. Click derecho sobre **[TG3] CARGA - Escritura** → **Enable**

### Por qué esta prueba es diferente:

Las escrituras (POST) son más lentas que las lecturas porque:
- El servidor valida los datos recibidos
- MySQL hace un INSERT en la base de datos
- El servicio de visitas además llama al servicio de usuarios para validar que el preso existe

Espera tiempos de respuesta más altos que en TG2. El Average de 400-600ms para POSTs es normal.

### Qué endpoint crear con cuidado — POST /api/visitas:

Este endpoint hace una llamada interna:
```
JMeter → visitas-service → usuarios-service (valida que el preso existe)
                         → MySQL (guarda la visita)
```
Si `usuarios-service` está lento, el tiempo de `POST /api/visitas` sube también.
Si ves que el p90 de visitas es muy alto, el cuello de botella puede estar en usuarios.

### Qué mirar en el Aggregate Report:

Compara el Average de escritura vs lectura:

| Endpoint | Lectura (TG2) | Escritura (TG3) | Diferencia normal |
|---|---|---|---|
| /presos | 198ms | 420ms | ~2x más lento, normal |
| /api/visitas | 312ms | 680ms | ~2x más lento, normal |
| /incidentes | 287ms | 390ms | ~1.5x más lento, normal |

Si la escritura es **más de 5x más lenta** que la lectura, hay un problema con la base de datos (pool de conexiones agotado, queries lentos, etc.).

---

## Parte 8 — PRUEBA 4: Stress Test (200 usuarios)

**Objetivo:** empujar el sistema hasta encontrar su límite máximo.

> ⚠️ Esta prueba está diseñada para que el sistema eventualmente falle. Eso es normal y es el objetivo.

### Activar TG4:

1. Click derecho sobre **[TG3]** → **Disable**
2. Click derecho sobre **[TG4] STRESS TEST** → **Enable**

### Configuración de TG4:

```
Usuarios: 200
Ramp-up:  120 segundos (2 minutos para llegar a 200 usuarios)
Duración: 600 segundos (10 minutos)
```

### Qué buscar en el Stress Test:

El sistema tiene un **punto de quiebre**. Lo reconoces cuando ves esto al mismo tiempo:
- Error% empieza a subir (de 0% a 1%, luego a 5%, luego a 20%+)
- Average sube drásticamente
- Throughput se estanca o baja aunque siguen entrando usuarios

```
Usuarios: 0 ──── 50 ──── 100 ──── 150 ──── 200
Error%:   0%     0%      0.5%     4%       22%
Avg:      200ms  220ms   450ms    1200ms   5000ms
                          ↑
                    PUNTO DE QUIEBRE (aprox. 100-120 usuarios)
```

El número de usuarios donde empieza a romperse es la **capacidad máxima actual** del sistema.

### Cómo parar la prueba si el sistema se cae:

```
Menú Run → Stop   (para inmediatamente)
o
Menú Run → Shutdown   (espera que terminen las peticiones en vuelo)
```

---

## Parte 9 — Generar el Reporte HTML

El reporte HTML es la forma visual de ver todos los resultados. Se genera al terminar cada prueba.

### Cómo generarlo:

1. Menú superior: **Tools → Generate HTML report**

2. Se abre un diálogo con tres campos:

   **Results file (CSV):**
   ```
   C:\Users\andre\Documents\proyecto_final\jmeter\results\summary_report.csv
   ```

   **user.properties file:** (dejar vacío, no tocar)

   **Output directory:**
   ```
   C:\Users\andre\Documents\proyecto_final\jmeter\results\html_report
   ```
   > Si la carpeta `html_report` ya existe de una prueba anterior, bórrala primero o usa un nombre diferente como `html_report_carga`.

3. Click en **Generate report**

4. Si dice "Report generated successfully", abre el explorador de Windows y navega a:
   ```
   C:\Users\andre\Documents\proyecto_final\jmeter\results\html_report\
   ```
   Doble click en **index.html**

---

## Parte 10 — Navegar el Reporte HTML

### Página principal — Dashboard

Lo primero que ves son 6 bloques de resumen:

```
┌──────────────┬──────────────┬──────────────┐
│    APDEX     │   Requests   │    Errors    │
│    0.92      │   15,420     │    0.80%     │
├──────────────┼──────────────┼──────────────┤
│  Avg Response│  Throughput  │   Network    │
│    223ms     │   43.8/s     │  1.2 MB/s    │
└──────────────┴──────────────┴──────────────┘
```

**APDEX** es el índice de satisfacción del usuario (0 a 1):

| Valor | Color | Interpretación |
|-------|-------|----------------|
| 0.94 - 1.00 | Verde | Excelente, todos satisfechos |
| 0.85 - 0.93 | Verde claro | Bueno |
| 0.70 - 0.84 | Amarillo | Regular, algunos usuarios tienen problemas |
| 0.50 - 0.69 | Naranja | Malo |
| < 0.50 | Rojo | El sistema está fallando |

---

### Sección: Statistics

Click en **Statistics** en el menú lateral izquierdo del reporte.

Es la tabla más importante. Tiene una fila por cada endpoint probado.

**Columnas y qué significan:**

| Columna | Qué es | Qué buscar |
|---------|--------|------------|
| **Samples** | Total de peticiones enviadas | Información |
| **KO** | Cantidad de errores | Debe ser 0 o muy bajo |
| **Error%** | Porcentaje de errores | < 1% |
| **Average** | Promedio de tiempo | < 500ms |
| **Min** | Petición más rápida | Referencia |
| **Max** | Petición más lenta | No > 5000ms |
| **Median (p50)** | La mitad respondió en menos de esto | Parecido al Average |
| **90th pct (p90)** | El 90% respondió en menos de esto | < 1000ms |
| **95th pct (p95)** | El 95% respondió en menos de esto | < 1500ms |
| **99th pct (p99)** | El 99% respondió en menos de esto | < 3000ms |
| **Throughput** | Peticiones/segundo de ese endpoint | Mayor = mejor |
| **Received** | KB/s que llegaron | Referencia |
| **Sent** | KB/s enviados | Referencia |

**Ejemplo de lectura:**

```
GET /api/visitas  →  Samples: 2,650  |  Error%: 1.2%  |  p90: 980ms  |  p99: 4200ms
```

Interpretación: el servicio de visitas tuvo 1.2% de errores. El p90 de 980ms es aceptable pero
el p99 de 4200ms indica que el 1% de las peticiones tardó más de 4 segundos — hay peticiones
que se cuelgan bajo carga.

---

### Sección: Charts — Response Times Over Time

Click en **Charts** en el menú lateral, luego en la pestaña **Response Times Over Time**.

El eje X es el tiempo de la prueba. El eje Y es milisegundos. Cada endpoint tiene su color.

**Patrones y qué significan:**

**Línea plana horizontal** → el servicio es estable bajo carga sostenida ✅
```
ms |─────────────────────────────────────────────
300|   ══════════════════════════════════════════
   └────────────────────────────────────────────── tiempo
```

**Línea que sube en los primeros 60s y luego se estabiliza** → normal, es el ramp-up ✅
```
ms |
500|             ══════════════════════════════════
300|   ══════════
   └────────────────────────────────────────────── tiempo
     ↑ ramp-up ↑
```

**Línea que sube continuamente sin estabilizarse** → el sistema se degrada, no aguanta ❌
```
ms |                                        /
1200|                               _______/
 600|                   ___________/
 300|   ────────────────
   └────────────────────────────────────────────── tiempo
```

**Línea con picos bruscos** → contención intermitente (probable problema de BD) ⚠️
```
ms |        │                    │
2000|        │                    │
 300|  ──────    ─────────────────    ────────────
   └────────────────────────────────────────────── tiempo
```

---

### Sección: Charts — Active Threads Over Time

Muestra cuántos usuarios virtuales estaban activos en cada momento.

**Forma esperada (ramp-up normal):**
```
Usuarios
  50 │          ┌──────────────────────┐
  30 │        ╱                         ╲
  10 │      ╱                             (fin de prueba)
   0 │────╱
     └────────────────────────────────────── tiempo
          ↑ 60s ramp-up
```

**Señal de problema — usuarios que caen solos:**
```
Usuarios
  50 │     ┌─────────────╗
  30 │   ╱               ╚════
  10 │  ╱                      (threads cayeron por errores)
   0 │╱
   └───────────────────────────── tiempo
```
Si los usuarios bajan antes de que termine la prueba, JMeter está recibiendo demasiados errores y los threads se cierran.

---

### Sección: Charts — Transactions per Second

Muestra cuántas peticiones por segundo procesó el sistema en cada momento.

**Bueno — throughput estable:**
```
req/s
  80 │         ┌──────────────────────────┐
  40 │       ╱                              (fin)
   0 │─────╱
     └────────────────────────────────────── tiempo
```

**Señal de saturación — throughput se estanca mientras usuarios siguen subiendo:**
```
req/s
  80 │               ┌────────────────────
  40 │             ╱
   0 │─────────────
     └────────────────────────────────────── tiempo
                  ↑
          el throughput llegó al límite aunque los usuarios
          siguieron subiendo después de este punto
```

---

### Sección: Charts — Response Time Percentiles

Muestra los percentiles p50, p75, p90, p95, p99 en un solo gráfico de barras.

**Cómo leerlo:**

Cada barra representa un endpoint. Las barras están divididas en colores por percentil.

- Barras **cortas y uniformes** → el servicio es consistente ✅
- Barras **con la parte de p99 mucho más alta que p90** → hay peticiones que se cuelgan ⚠️

```
ms
2000 │                    ██ p99
1200 │              ██    ██ p95
 800 │        ██    ██    ██ p90
 400 │  ██    ██    ██    ██ p50
      GET     GET   POST  POST
     /presos /guard /pres /visit
```

En este ejemplo, `POST /api/visitas` tiene p99 muy alto en comparación con p90 — hay peticiones que tardan mucho más que las demás.

---

### Sección: Errors

Solo aparece si hubo errores. Click en **Errors** en el menú lateral.

Muestra una tabla con los tipos de error y cuántos hubo:

```
┌────────────────────────────────────────┬───────┬────────┐
│ Type of error                          │ Count │   %    │
├────────────────────────────────────────┼───────┼────────┤
│ 503/Service Unavailable                │   85  │  62%   │
│ Non HTTP response/Connection refused   │   32  │  23%   │
│ 500/Internal Server Error              │   21  │  15%   │
└────────────────────────────────────────┴───────┴────────┘
```

**Qué significa cada error en el contexto de Lapicota:**

| Error | Causa probable | Qué hacer |
|-------|---------------|-----------|
| `503 Service Unavailable` | HAProxy no tiene réplica disponible, el contenedor se cayó | Aumentar réplicas en docker-stack.yml |
| `500 Internal Server Error` | MySQL rechazó conexiones (pool agotado) o bug en el código | Revisar logs: `docker service logs lapicota_usuarios-service` |
| `Connection refused` | El servicio o HAProxy se cayó completamente | Reiniciar el stack |
| `Non HTTP response / Read timed out` | La petición tardó más de 15 segundos | El servicio está saturado, reducir carga |
| `400 Bad Request` | El JSON del CSV tiene un campo inválido | Revisar los archivos en `jmeter/data/` |
| `404 Not Found` | El ID en la URL no existe en la BD | Normal en smoke si la BD está vacía |

---

## Resumen: el orden de cada prueba

```
ANTES DE CADA PRUEBA:
  1. Menú Run → Clear All  (borrar datos anteriores)
  2. Verificar que solo el TG correcto está activo (negro)
  3. Guardar con Ctrl+S

DURANTE LA PRUEBA:
  4. Presionar ▶
  5. Click en Summary Report → vigilar Error%
  6. Click en Aggregate Report → vigilar p90

AL TERMINAR:
  7. Tools → Generate HTML report
  8. Abrir html_report/index.html en el navegador
  9. Navegar: Statistics → Charts → Errors
```

---

## Tabla de referencia rápida — ¿está bien o mal?

| Métrica | Excelente | Aceptable | Problema | Crítico |
|---------|-----------|-----------|----------|---------|
| Error% | 0% | < 1% | 1% - 5% | > 5% |
| Average | < 200ms | < 500ms | < 2000ms | > 2000ms |
| p90 | < 400ms | < 1000ms | < 2000ms | > 2000ms |
| p99 | < 1000ms | < 2000ms | < 5000ms | > 5000ms |
| APDEX | > 0.94 | > 0.85 | > 0.70 | < 0.70 |
| Throughput | Estable | Creciente | Estancado | Decreciente |
