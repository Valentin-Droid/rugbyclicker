require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./models/db');

const authRoutes = require('./routes/authRoutes');
const partieRoutes = require('./routes/partieRoutes');
const shopRoutes = require('./routes/shopRoutes');
const classementRoutes = require('./routes/classementRoutes');
const errorHandler = require('./middleware/errorHandler');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');

const app = express();

// Middleware globaux
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parties', partieRoutes);
app.use('/api/parties', shopRoutes);
app.use('/api/classement', classementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handler (toujours en dernier)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Exécute les migrations puis démarre le serveur
pool.runMigrations().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
});

module.exports = app;
