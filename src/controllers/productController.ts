import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Product from '../models/Product';
import { getPresignedImageUrl } from '../services/s3Service';

// Obtener todos los productos
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { brand, category, search, available, page, limit } = req.query;
    
    // Construir filtros dinámicos
    const whereClause: any = {};
    
    if (brand && brand !== 'all') {
      whereClause.brand = brand;
    }
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    if (available !== undefined && available !== 'all') {
      // Convertir string 'true'/'false' a boolean
      const availableValue = typeof available === 'string' ? available : String(available);
      whereClause.available = availableValue === 'true';
    }
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { original_name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { ean: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Paginación opcional
    const pageNumber = page ? parseInt(page as string, 10) : undefined;
    const limitNumber = limit ? parseInt(limit as string, 10) : undefined;
    
    const queryOptions: any = {
      where: whereClause,
      order: [['brand', 'ASC'], ['name', 'ASC']],
    };

    // Si se especifica paginación, aplicarla
    if (pageNumber !== undefined && limitNumber !== undefined) {
      const offset = (pageNumber - 1) * limitNumber;
      queryOptions.limit = limitNumber;
      queryOptions.offset = offset;
    }

    // Obtener total de productos (antes de aplicar limit/offset)
    const totalCount = await Product.count({ where: whereClause });

    const products = await Product.findAll(queryOptions);

    // Generar URLs presignadas para las imágenes
    const productsWithUrls = await Promise.all(
      products.map(async (product) => {
        const productData: any = product.toJSON();
        // Si tiene imagen, usar esa, sino usar placeholder.webp
        const imageToUse = productData.image_filename || 'placeholder.webp';
        productData.image_url = await getPresignedImageUrl(imageToUse);
        return productData;
      })
    );

    // Si hay paginación, incluir información de paginación en la respuesta
    if (pageNumber !== undefined && limitNumber !== undefined) {
      const totalPages = Math.ceil(totalCount / limitNumber);
      res.json({
        success: true,
        data: productsWithUrls,
        count: productsWithUrls.length,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalCount,
          totalPages: totalPages,
        }
      });
    } else {
      res.json({
        success: true,
        data: productsWithUrls,
        count: productsWithUrls.length
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener un producto por ID
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id);
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    // Generar URL presignada para la imagen (usar placeholder.webp si no tiene imagen)
    const productData: any = product.toJSON();
    const imageToUse = productData.image_filename || 'placeholder.webp';
    productData.image_url = await getPresignedImageUrl(imageToUse);

    res.json({
      success: true,
      data: productData
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Crear un nuevo producto
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const productData = req.body;
    
    // Validar campos requeridos
    if (!productData.ean || !productData.name || !productData.brand) {
      res.status(400).json({
        success: false,
        message: 'EAN, nombre y marca son campos requeridos'
      });
      return;
    }

    const product = await Product.create(productData);

    // Generar URL presignada para la imagen (usar placeholder.webp si no tiene imagen)
    const productDataWithUrl: any = product.toJSON();
    const imageToUse = productDataWithUrl.image_filename || 'placeholder.webp';
    productDataWithUrl.image_url = await getPresignedImageUrl(imageToUse);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: productDataWithUrl
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Manejar error de EAN duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese EAN'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Actualizar un producto
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productData = req.body;

    const product = await Product.findByPk(id);
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    await product.update(productData);

    // Generar URL presignada para la imagen (usar placeholder.webp si no tiene imagen)
    const productDataWithUrl: any = product.toJSON();
    const imageToUse = productDataWithUrl.image_filename || 'placeholder.webp';
    productDataWithUrl.image_url = await getPresignedImageUrl(imageToUse);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: productDataWithUrl
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    // Manejar error de EAN duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({
        success: false,
        message: 'Ya existe un producto con ese EAN'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Eliminar un producto
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener marcas únicas
export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await Product.findAll({
      attributes: ['brand'],
      group: ['brand'],
      order: [['brand', 'ASC']],
    });

    const brandList = brands.map(product => product.brand);

    res.json({
      success: true,
      data: brandList
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener marcas',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Obtener categorías únicas
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Product.findAll({
      attributes: ['category'],
      group: ['category'],
      order: [['category', 'ASC']],
    });

    const categoryList = categories.map(product => product.category).filter(Boolean);

    res.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Toggle disponibilidad del producto
export const toggleAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    // Cambiar el estado de disponibilidad
    const newAvailability = !product.available;
    await product.update({ available: newAvailability });

    // Generar URL presignada para la imagen (usar placeholder.webp si no tiene imagen)
    const productData: any = product.toJSON();
    const imageToUse = productData.image_filename || 'placeholder.webp';
    productData.image_url = await getPresignedImageUrl(imageToUse);

    res.json({
      success: true,
      message: `Producto ${newAvailability ? 'disponible' : 'no disponible'}`,
      data: productData
    });
  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar disponibilidad',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Actualizar comentarios del producto
export const updateComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const product = await Product.findByPk(id);
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
      return;
    }

    await product.update({ comments: comments || null });

    // Generar URL presignada para la imagen (usar placeholder.webp si no tiene imagen)
    const productData: any = product.toJSON();
    const imageToUse = productData.image_filename || 'placeholder.webp';
    productData.image_url = await getPresignedImageUrl(imageToUse);

    res.json({
      success: true,
      message: 'Comentarios actualizados exitosamente',
      data: productData
    });
  } catch (error) {
    console.error('Error updating comments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar comentarios',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
