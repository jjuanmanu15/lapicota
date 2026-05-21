const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const presosRoutes = require('./src/routes/presosRoutes');
const guardiasRoutes = require('./src/routes/guardiasRoutes');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());   // primero se parsea el body

app.use('/presos', presosRoutes); // después las rutas
app.use('/guardias', guardiasRoutes); // después las rutas

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Servidor de usuarios escuchando en el puerto ${PORT}`);
});

module.exports = app;