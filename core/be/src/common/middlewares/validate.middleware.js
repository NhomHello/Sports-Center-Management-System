import { ApiError } from '../errors/api-error.js';

const TARGETS = ['body', 'query', 'params'];

/**
 * Chuyen ZodError thanh danh sach { field, message } de FE hien thi.
 * @param {import('zod').ZodError} error
 */
export const formatZodIssues = (error) =>
  error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));

/**
 * Middleware validate request bang zod. Ket qua da parse (co default, coerce) nam o
 * req.validated.{body,query,params}. Controller PHAI doc tu req.validated, khong doc req.body.
 * (Express 5: req.query la getter, khong gan lai duoc, nen dung req.validated cho thong nhat.)
 *
 * Dung: router.post('/', validate(createRoleSchema), controller.create)
 * @param {{ body?: import('zod').ZodType, query?: import('zod').ZodType, params?: import('zod').ZodType }} schemas
 * @returns {import('express').RequestHandler}
 */
export const validate = (schemas) => (req, _res, next) => {
  const validated = {};
  for (const target of TARGETS) {
    const schema = schemas[target];
    if (!schema) continue;
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw ApiError.badRequest('Dữ liệu không hợp lệ', formatZodIssues(result.error));
    }
    validated[target] = result.data;
  }
  req.validated = validated;
  next();
};
