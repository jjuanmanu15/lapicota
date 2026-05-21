const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const incidentesRoutes = require('./src/routes/incidenteRoutes');

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.use('/incidentes', incidentesRoutes);

const PORT = 3003;

app.listen(PORT, () => {
    console.log(`Incidentes service corriendo en puerto ${PORT}`);
});