import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import sequelize from './config/database'; 
import productRoutes from './routes/productRoutes';
import authRoutes from './routes/authRoutes';
import { requireAuth } from './middleware/auth';

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Configuración de CORS
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://lacosta-front.onrender.com',
      'http://localhost:3000'
    ];
    
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origin no permitido: ${origin}`);
      callback(null, true); // Permitir temporalmente para debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200 // Algunos navegadores antiguos (IE11) requieren esto
};

app.use(cors(corsOptions));

// Manejar preflight requests explícitamente
app.options('*', cors(corsOptions));

// Middlewares de logging y parsing
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas públicas de autenticación (sin protección)
app.use('/api', authRoutes);

// Rutas protegidas de la API (requieren autenticación)
app.use('/api', requireAuth, productRoutes);

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Products API is running',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo global de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    
    // Verificar y convertir la columna 'available' de INTEGER a BOOLEAN si es necesario
    try {
      const [results] = await sequelize.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'available'
      `) as any[];
      
      if (results && results.length > 0 && results[0].data_type === 'integer') {
        console.log('🔄 Convirtiendo columna "available" de INTEGER a BOOLEAN...');
        
        // Convertir INTEGER a BOOLEAN: 0 -> false, cualquier otro valor -> true
        await sequelize.query(`
          ALTER TABLE "products" 
          ALTER COLUMN "available" TYPE BOOLEAN 
          USING CASE WHEN "available" = 0 THEN false ELSE true END;
        `);
        
        // Establecer NOT NULL y DEFAULT después de la conversión
        await sequelize.query(`
          ALTER TABLE "products" 
          ALTER COLUMN "available" SET NOT NULL,
          ALTER COLUMN "available" SET DEFAULT true;
        `);
        
        console.log('✅ Columna "available" convertida correctamente.');
      }
    } catch (migrationError: any) {
      // Si la tabla no existe o la columna no existe, continuar con la sincronización normal
      if (migrationError.message && !migrationError.message.includes('does not exist')) {
        console.warn('⚠️ Advertencia al verificar columna "available":', migrationError.message);
      }
    }
    
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados con la base de datos.');
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    process.exit(1);
  }
}

// Iniciar servidor
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
      console.log(`🔗 API disponible en http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 Cerrando servidor...');
  await sequelize.close();
  process.exit(0);
});

// Iniciar la aplicación
startServer();
