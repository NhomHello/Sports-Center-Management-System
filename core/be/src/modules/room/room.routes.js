import { PERMISSIONS as P } from '@scms/shared';
import { createCatalogRouter } from '../catalog/catalog.routes.js';
import { roomBody } from '../catalog/catalog.validation.js';
import { roomService } from './room.service.js';
export default createCatalogRouter({
  service: roomService,
  body: roomBody,
  permissions: {
    read: P.ROOM_READ,
    create: P.ROOM_CREATE,
    update: P.ROOM_UPDATE,
    delete: P.ROOM_DELETE,
  },
});
