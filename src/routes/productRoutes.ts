import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getBrands,
  getCategories,
  toggleAvailability,
  updateComments
} from '../controllers/productController';

const router = Router();

// Rutas para productos
router.get('/products', getAllProducts);
router.get('/products/:id', getProductById);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Rutas para acciones específicas
router.patch('/products/:id/toggle-availability', toggleAvailability);
router.patch('/products/:id/comments', updateComments);

// Rutas para filtros
router.get('/brands', getBrands);
router.get('/categories', getCategories);

export default router;
