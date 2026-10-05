import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth.middleware.js';
import { authorize } from '../../common/middlewares/authorize.middleware.js';
import { validate } from '../../common/middlewares/validate.middleware.js';
import { createCatalogController } from './catalog.controller.js';
import { catalogBodySchema, catalogIdSchema, listCatalogSchema } from './catalog.validation.js';

/** Factory route danh mục, truyền permission cụ thể từ từng module. */
export const createCatalogRouter = ({ service, body, permissions }) => {
  const router = Router();
  const controller = createCatalogController(service);
  router.use(authenticate);
  router.get('/', authorize(permissions.read), validate(listCatalogSchema), controller.list);
  router.post(
    '/',
    authorize(permissions.create),
    validate(catalogBodySchema(body)),
    controller.create,
  );
  router.put(
    '/:id',
    authorize(permissions.update),
    validate(catalogBodySchema(body, true)),
    controller.update,
  );
  router.delete(
    '/:id',
    authorize(permissions.delete),
    validate(catalogIdSchema),
    controller.remove,
  );
  return router;
};
