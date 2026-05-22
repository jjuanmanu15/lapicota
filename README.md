# Sistema Penitenciario Lapicota
## Proyecto de Microservicios con Docker Swarm + Análisis de Datos con Apache Spark
## (web1 y dns1 son los nombres de las maquinas donde se realizó el proyecto, ajustar los nombres acorde a los de cada maquina virtual donde se desee ejecutar el proyecto)
---

## Descripción general

Este proyecto implementa un sistema de gestión penitenciaria basado en microservicios desplegados en un cluster Docker Swarm con balanceo de carga HAProxy, y un módulo de análisis de datos distribuido usando Apache Spark con PySpark. Los resultados del análisis se visualizan en un dashboard de Power BI.

### Arquitectura del sistema

```
Capa 1 — Microservicios (Docker Swarm):
  Cliente/Navegador
       ↓
  HAProxy (Round Robin - Puerto 80)
       ↓
  Docker Swarm: web1 (192.168.100.3) + dns1 (192.168.100.2)
  ├── frontend          (2 réplicas) → Nginx
  ├── usuarios-service  (2 réplicas) → usuarios-db (MySQL)
  ├── visitas-service   (2 réplicas) → visitas-db  (MySQL)
  └── incidentes-service(2 réplicas) → incidentes-db (MySQL)

Capa 2 — Procesamiento distribuido (Spark Standalone):
  web1 → Spark Master
  dns1 → Spark Worker
       ↓
  Dataset CSV (10.000 registros)
       ↓
  8 análisis → CSVs de resultados
       ↓
  Dashboard Power BI
```

---

## Requisitos previos

### Software necesario
- [VirtualBox](https://www.virtualbox.org/wiki/Downloads) — última versión
- [Vagrant](https://developer.hashicorp.com/vagrant/downloads) — última versión
- [Power BI Desktop](https://powerbi.microsoft.com/es-es/downloads/) — gratuito
- Docker Hub account (para subir/bajar imágenes)

### Recursos mínimos de la máquina host
- RAM: 8GB (las VMs usan 3GB en total)
- Disco: 20GB libres
- CPU: 4 cores

---

## Estructura del repositorio

```
lapicota/
├── README.md
├── docker-stack.yml
├── analisis_lapicota/
│   ├── data/
│   │   └── datasetpicota.csv
│   ├── results/
│   │   ├── 01_top_presos_incidentes.csv
│   │   ├── 02_incidentes_por_tipo.csv
│   │   ├── 03_incidentes_por_patio.csv
│   │   ├── 04_visitas_por_estado.csv
│   │   ├── 05_incidentes_por_turno.csv
│   │   ├── 06_evolucion_mensual.csv
│   │   ├── 07_top_guardias_incidentes.csv
│   │   └── 08_incidentes_por_delito.csv
│   └── analisis_lapicota.py
├── documents/
│   └── informe_final.pdf
    └── presentacion_final.pdf
├── jmeter/
│   ├── data/
│   ├── results/
│   ├── GUIA_JMETER.md
│   └── lapicota_load_test.jmx
├── lapicota_frontend/
│   ├── css/
│   ├── js/
│   ├── pages/
│   ├── entrega_lapicota/
│   ├── index.html
│   └── login.html
└── lapicota_microservicios/
    ├── incidentes-service/
    ├── usuarios-service/
    ├── visitas-service/
    ├── node_modules/
    ├── package.json
    ├── package-lock.json
```

---

## PARTE 1 — Levantar las VMs

Coloca el `Vagrantfile` en una carpeta de tu máquina y ejecuta desde esa carpeta:

```bash
vagrant up web dns
```

Esto levanta dos VMs:
- **web1** → IP `192.168.100.3` | 2GB RAM | 3 CPUs → Spark Master + Docker Swarm Manager
- **dns1** → IP `192.168.100.2` | 1GB RAM | 1 CPU  → Spark Worker + Docker Swarm Worker

---

## PARTE 2 — Instalar Docker en ambas VMs

### En web1:
```bash
vagrant ssh web

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

### En dns1 (en otra terminal):
```bash
vagrant ssh dns
# Mismos comandos de instalación de Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

---

## PARTE 3 — Configurar Docker Swarm

### En web1 (Manager):
```bash
docker swarm init --advertise-addr 192.168.100.3
```

Copia el comando `docker swarm join --token ...` que aparece.

### En dns1 (Worker):
```bash
# Pegar aquí el comando copiado del paso anterior
docker swarm join --token SWMTKN-1-xxxx 192.168.100.3:2377
```

### Verificar en web1:
```bash
docker node ls
# Debe mostrar web1 (Leader) y dns1 (Ready)
```

---

## PARTE 4 — Desplegar el Stack de microservicios

Copia el `docker-stack.yml` a web1 (puede ir en `/vagrant/` si compartes la carpeta):

```bash
# En web1
docker login  # con tu usuario de Docker Hub

# IMPORTANTE: edita docker-stack.yml y reemplaza el usuario de Docker Hub
# si vas a usar tus propias imágenes:
# Busca "jjuanmanu15" y reemplázalo con tu usuario

docker stack deploy -c /vagrant/docker-stack.yml lapicota --with-registry-auth
```

Verifica que todos los servicios estén corriendo:
```bash
docker stack services lapicota
# Todos deben mostrar REPLICAS en X/X (ej: 2/2)
```

### URLs de acceso
| Servicio | URL |
|---|---|
| Frontend | http://192.168.100.3 |
| HAProxy Stats | http://192.168.100.3:5080 |
| API Usuarios | http://192.168.100.3:3001/presos |
| API Visitas | http://192.168.100.3:3002/api/visitas |
| API Incidentes | http://192.168.100.3:3003/incidentes |

---

## PARTE 5 — Instalar Apache Spark

### Descargar Spark en ambas VMs:
```bash
# En web1 y dns1
mkdir -p ~/labSpark
cd ~/labSpark
wget https://archive.apache.org/dist/spark/spark-3.5.8/spark-3.5.8-bin-hadoop3.tgz
tar -xzf spark-3.5.8-bin-hadoop3.tgz
```

### Configurar variables de entorno (en ambas VMs):
```bash
echo 'export SPARK_HOME=~/labSpark/spark-3.5.8-bin-hadoop3' >> ~/.bashrc
echo 'export PATH=$PATH:$SPARK_HOME/bin:$SPARK_HOME/sbin' >> ~/.bashrc
echo 'export PYSPARK_PYTHON=python3' >> ~/.bashrc
source ~/.bashrc
```

### Configurar spark-env.sh en web1 (Master):
```bash
cd ~/labSpark/spark-3.5.8-bin-hadoop3
cp conf/spark-env.sh.template conf/spark-env.sh
echo 'SPARK_MASTER_HOST=192.168.100.3' >> conf/spark-env.sh
echo 'SPARK_WORKER_MEMORY=700m' >> conf/spark-env.sh
echo 'SPARK_WORKER_CORES=1' >> conf/spark-env.sh
echo 'SPARK_DAEMON_MEMORY=128m' >> conf/spark-env.sh
echo 'PYSPARK_PYTHON=python3' >> conf/spark-env.sh
```

### Configurar workers en web1:
```bash
echo '192.168.100.2' > conf/workers
```

### Configurar spark-env.sh en dns1 (Worker):
```bash
cd ~/labSpark/spark-3.5.8-bin-hadoop3
cp conf/spark-env.sh.template conf/spark-env.sh
echo 'SPARK_MASTER_HOST=192.168.100.3' >> conf/spark-env.sh
echo 'SPARK_WORKER_MEMORY=700m' >> conf/spark-env.sh
echo 'SPARK_WORKER_CORES=1' >> conf/spark-env.sh
echo 'SPARK_DAEMON_MEMORY=128m' >> conf/spark-env.sh
```

### Configurar SSH entre web1 y dns1:
```bash
# En dns1: habilitar autenticación por contraseña
sudo nano /etc/ssh/sshd_config.d/60-cloudimg-settings.conf
# Cambiar: PasswordAuthentication no → PasswordAuthentication yes
sudo systemctl restart sshd

# En web1: generar y copiar clave SSH
ssh-keygen -t ed25519  # Enter en todo
ssh-copy-id vagrant@192.168.100.2  # contraseña: vagrant
ssh vagrant@192.168.100.2 "echo conexion exitosa"  # verificar
```

### Instalar dependencias Python en web1:
```bash
sudo apt-get install python3-pandas -y
```

---

## PARTE 6 — Ejecutar el análisis con PySpark

### Cada vez que quieras correr el análisis:

**1. Verificar que Hadoop no esté consumiendo RAM:**
```bash
docker ps | grep -E "namenode|datanode|resourcemanager"
# Si aparecen, apagarlos:
docker stop namenode datanode nodemanager resourcemanager historyserver
```

**2. Copiar el dataset y el script:**
```bash
cp /vagrant/datasetpicota.csv ~/labSpark/datasetpicota.csv
cp /vagrant/analisis_lapicota.py ~/analisis_lapicota.py
```

**3. Levantar el cluster Spark:**
```bash
cd ~/labSpark/spark-3.5.8-bin-hadoop3
sbin/start-all.sh
jps  # debe aparecer Master
ssh vagrant@192.168.100.2 "jps"  # debe aparecer Worker
```

**4. Ejecutar el análisis:**
```bash
SPARK_LOCAL_IP=192.168.100.3 bin/spark-submit \
  --master spark://192.168.100.3:7077 \
  --driver-memory 512m \
  --executor-memory 600m \
  ~/analisis_lapicota.py
```

**5. Los resultados quedan en:**
```
/vagrant/resultados/
```
Que en Windows corresponde a la carpeta donde está el Vagrantfile.

---

## PARTE 7 — Ver el dashboard en Power BI

1. Abre Power BI Desktop
2. **Archivo** → **Abrir** → selecciona `lapicota_dashboard.pbix`
3. El dashboard tiene 3 páginas:
   - **Página 1 — Incidentes**: Top presos, tipos de incidente, incidentes por patio y por turno
   - **Página 2 — Visitas y Guardias**: Estado de visitas, top guardias, delitos con más incidentes
   - **Página 3 — Evolución Temporal**: Línea de tiempo mensual 2023-2024

Si quieres actualizar los datos con nuevos resultados de Spark:
- **Inicio** → **Actualizar** (si los CSVs están en la misma ruta)
- O **Transformar datos** → actualizar la ruta de cada CSV

---

## Dataset

El dataset `datasetpicota.csv` es sintético y simula 2 años de operación (2023-2024) del sistema penitenciario con:

| Campo | Descripción |
|---|---|
| 10.000 filas | Una por cada visita registrada |
| 150 presos | Distintos internos con diferentes delitos |
| 20 guardias | Con distintos rangos, turnos y zonas |
| 1.970 incidentes | 29.5% de las visitas realizadas generaron incidente |
| 32 columnas | Datos de preso, visitante, guardia, visita e incidente |

---

## Análisis realizados con PySpark

| # | Análisis | Descripción |
|---|---|---|
| 1 | Top 10 presos con más incidentes | Identifica internos de alto riesgo |
| 2 | Incidentes por tipo | Frecuencia de cada tipo de incidente |
| 3 | Incidentes por patio | Zonas más conflictivas |
| 4 | Visitas por estado | Distribución de aprobadas, rechazadas, etc. |
| 5 | Incidentes por turno | Turno con más incidentes registrados |
| 6 | Evolución mensual | Tendencia de visitas e incidentes en 2 años |
| 7 | Top 5 guardias con más incidentes | Guardias con más registros de incidentes |
| 8 | Delitos con más incidentes | Correlación entre delito del preso e incidentes |

---

## Tecnologías utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| Docker | 24+ | Contenedores de microservicios |
| Docker Swarm | - | Orquestación del cluster |
| HAProxy | 2.9 | Balanceo de carga Round Robin |
| Node.js | 20 | Runtime de microservicios |
| MySQL | 8.0 | Base de datos por microservicio |
| Nginx | Alpine | Servidor del frontend |
| Apache Spark | 3.5.8 | Procesamiento distribuido |
| PySpark | 3.5.8 | API Python para Spark |
| Python | 3.10 | Scripts de análisis |
| Power BI Desktop | - | Visualización de resultados |
| Vagrant | - | Gestión de VMs |
| VirtualBox | - | Hipervisor |

---


Proyecto desarrollado para la asignatura de Redes e Infraestrcutura, Universidad Autonoma de Occidente.
Cali — 2026
