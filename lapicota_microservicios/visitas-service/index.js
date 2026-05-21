const express = require('express');
const visitasController = require('./src/controllers/visitasController');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
const PORT = 3002;
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(visitasController);
app.listen(PORT, () => {
    console.log(`Microservicio de visitas ejecutándose en el puerto ${PORT}`);
});