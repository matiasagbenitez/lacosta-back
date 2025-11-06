import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getCookieConfig } from '../utils/cookieConfig';

/**
 * Endpoint para verificar el código de acceso
 */
export const verifyAccessCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { access_code } = req.body;

    if (!access_code) {
      res.status(400).json({
        success: false,
        message: 'El código de acceso es requerido'
      });
      return;
    }

    const accessCodeHash = process.env.ACCESS_CODE_HASH;

    if (!accessCodeHash) {
      console.error('ACCESS_CODE_HASH no está configurado');
      res.status(500).json({
        success: false,
        message: 'Error de configuración del servidor'
      });
      return;
    }

    // Comparar el código de acceso con el hash almacenado
    bcrypt.compare(access_code, accessCodeHash, (err, isMatch) => {
      if (err) {
        console.error('Error al verificar código de acceso:', err);
        res.status(500).json({
          success: false,
          message: 'Error al verificar código de acceso'
        });
        return;
      }

      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Código de acceso incorrecto'
        });
        return;
      }

      // Si el código es correcto, establecer una cookie de sesión
      // Usamos el código de acceso hasheado como token de sesión
      const sessionToken = access_code;
      
      // Obtener configuración de cookies según el entorno
      const cookieConfig = getCookieConfig();
      
      // Log para debugging (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log('🍪 Configuración de cookie:', cookieConfig);
        console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
        console.log('🌐 Backend URL:', process.env.BACKEND_URL);
      }
      
      res.cookie('auth_session', sessionToken, cookieConfig);
      
      // Asegurar que los headers de CORS estén presentes
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');

      res.json({
        success: true,
        message: 'Autenticación exitosa'
      });
    });
  } catch (error) {
    console.error('Error en verifyAccessCode:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Endpoint para cerrar sesión
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtener configuración de cookies según el entorno
    const cookieConfig = getCookieConfig();
    
    res.clearCookie('auth_session', cookieConfig);
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Endpoint para verificar el estado de autenticación
 */
export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Asegurar headers CORS
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    
    const sessionToken = req.cookies?.auth_session;
    const accessCodeHash = process.env.ACCESS_CODE_HASH;
    
    // Log para debugging (también en producción para troubleshooting)
    console.log('🔍 CheckAuth - Cookies recibidas:', Object.keys(req.cookies || {}));
    console.log('🔍 CheckAuth - SessionToken:', sessionToken ? 'presente' : 'ausente');
    console.log('🔍 CheckAuth - Request origin:', req.headers.origin);
    console.log('🔍 CheckAuth - Request headers:', {
      cookie: req.headers.cookie ? 'presente' : 'ausente',
      'user-agent': req.headers['user-agent']
    });

    if (!sessionToken || !accessCodeHash) {
      console.log('❌ CheckAuth fallido: sin token o hash');
      res.json({
        success: false,
        authenticated: false
      });
      return;
    }

    bcrypt.compare(sessionToken, accessCodeHash, (err, isMatch) => {
      if (err) {
        console.error('Error al comparar token:', err);
        res.json({
          success: false,
          authenticated: false
        });
        return;
      }
      
      if (!isMatch) {
        console.log('❌ CheckAuth fallido: token no coincide');
        res.json({
          success: false,
          authenticated: false
        });
        return;
      }

      console.log('✅ CheckAuth exitoso: usuario autenticado');
      
      res.json({
        success: true,
        authenticated: true
      });
    });
  } catch (error) {
    console.error('Error en checkAuth:', error);
    res.json({
      success: false,
      authenticated: false
    });
  }
};

