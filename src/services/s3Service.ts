import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configurar cliente S3
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || '';

/**
 * Genera una URL presignada para acceder a una imagen en S3
 * @param imageFilename Nombre del archivo de imagen
 * @param expiresIn Tiempo de expiración en segundos (default: 1 hora)
 * @returns URL presignada o null si hay error
 */
export const getPresignedImageUrl = async (
  imageFilename: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!imageFilename || !BUCKET_NAME) {
    return null;
  }

  try {
    // Construir la ruta completa en S3 (las imágenes están en el root/)
    const key = `${imageFilename}`;  

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // Generar URL presignada (solo requiere s3:GetObject, no s3:ListBucket)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error('Error al generar URL presignada para imagen:', imageFilename, error);
    console.error('Detalles del error:', error instanceof Error ? error.message : error);
    return null;
  }
};

/**
 * Genera URLs presignadas para múltiples imágenes
 */
export const getPresignedImageUrls = async (
  imageFilenames: (string | null | undefined)[],
  expiresIn: number = 3600
): Promise<Record<string, string | null>> => {
  const urls: Record<string, string | null> = {};
  
  await Promise.all(
    imageFilenames.map(async (filename) => {
      if (filename) {
        urls[filename] = await getPresignedImageUrl(filename, expiresIn);
      }
    })
  );

  return urls;
};

