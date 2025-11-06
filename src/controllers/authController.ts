import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

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
      
      res.cookie('auth_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

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
    res.clearCookie('auth_session');
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
    const sessionToken = req.cookies?.auth_session;
    const accessCodeHash = process.env.ACCESS_CODE_HASH;

    if (!sessionToken || !accessCodeHash) {
      res.json({
        success: false,
        authenticated: false
      });
      return;
    }

    bcrypt.compare(sessionToken, accessCodeHash, (err, isMatch) => {
      if (err || !isMatch) {
        res.json({
          success: false,
          authenticated: false
        });
        return;
      }

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

