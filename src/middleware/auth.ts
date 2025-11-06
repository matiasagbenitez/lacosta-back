import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

export interface AuthRequest extends Request {
  isAuthenticated?: boolean;
}

/**
 * Middleware para verificar si el usuario está autenticado
 * Verifica la sesión almacenada en las cookies
 */
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Verificar si existe la cookie de sesión
  const sessionToken = req.cookies?.auth_session;
  
  if (!sessionToken) {
    res.status(401).json({
      success: false,
      message: 'No autorizado. Por favor, inicia sesión.'
    });
    return;
  }

  // Verificar que el token coincida con el hash almacenado
  const accessCodeHash = process.env.ACCESS_CODE_HASH;
  
  if (!accessCodeHash) {
    console.error('ACCESS_CODE_HASH no está configurado');
    res.status(500).json({
      success: false,
      message: 'Error de configuración del servidor'
    });
    return;
  }

  // Comparar el token de sesión (código de acceso) con el hash almacenado
  bcrypt.compare(sessionToken, accessCodeHash, (err, isMatch) => {
    if (err) {
      console.error('Error al verificar autenticación:', err);
      res.status(500).json({
        success: false,
        message: 'Error al verificar autenticación'
      });
      return;
    }

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Sesión inválida. Por favor, inicia sesión nuevamente.'
      });
      return;
    }

    req.isAuthenticated = true;
    next();
  });
};

