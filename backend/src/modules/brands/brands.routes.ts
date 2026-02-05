import { Router } from 'express';
import * as brandsController from './brands.controller.js';

const router = Router();

router.get('/', brandsController.listBrands);
router.get('/all', brandsController.listAllBrands);

export default router;

