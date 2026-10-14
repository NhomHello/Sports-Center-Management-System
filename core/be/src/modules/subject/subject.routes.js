import { PERMISSIONS as P } from '@scms/shared';
import { createCatalogRouter } from '../catalog/catalog.routes.js';
import { subjectBody } from '../catalog/catalog.validation.js';
import { subjectService } from './subject.service.js';
export default createCatalogRouter({
  service: subjectService,
  body: subjectBody,
  permissions: {
    read: P.SUBJECT_READ,
    create: P.SUBJECT_CREATE,
    update: P.SUBJECT_UPDATE,
    delete: P.SUBJECT_DELETE,
  },
});
