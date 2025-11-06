/**
 * Helper para obtener la configuración de cookies según el entorno
 * Esto asegura que las cookies funcionen correctamente en producción
 * cuando el frontend y backend están en diferentes dominios
 */
export const getCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  
  // Extraer solo el dominio de las URLs para comparar
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };
  
  const frontendDomain = getDomain(frontendUrl);
  const backendDomain = getDomain(backendUrl);
  
  // En producción, si las URLs están configuradas y son diferentes, usar 'none'
  // Si no están configuradas pero estamos en producción, asumir diferentes dominios (Render)
  const areDifferentDomains = frontendDomain !== backendDomain;
  const useCrossSite = isProduction && (areDifferentDomains || (!frontendUrl.includes('localhost') && !backendUrl.includes('localhost')));
  
  // Si están en diferentes dominios en producción, usar 'none'
  const sameSiteValue = useCrossSite ? 'none' : 'lax';
  // Secure debe ser true cuando sameSite es 'none' (requerido por los navegadores)
  // También debe ser true en producción para HTTPS
  const secureValue = sameSiteValue === 'none' ? true : isProduction;
  
  const config = {
    httpOnly: true,
    secure: secureValue,
    sameSite: sameSiteValue as 'none' | 'lax' | 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  };
  
  // Log en producción para debugging
  if (isProduction) {
    console.log('🍪 Cookie config:', {
      sameSite: config.sameSite,
      secure: config.secure,
      frontendDomain,
      backendDomain,
      areDifferentDomains
    });
  }
  
  return config;
};

