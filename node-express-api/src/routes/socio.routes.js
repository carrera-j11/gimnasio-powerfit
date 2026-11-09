const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/socio.controller');
const { socioUpdate } = require('../validators/perfil.validator');

const router = Router();
router.use(verificarToken);

// Los socios se crean con POST /api/auth/registro (rolSolicitado=SOCIO)
router.get('/', permitirRoles('ADMIN', 'RECEPCIONISTA'), ctrl.listar);
router.get('/me', permitirRoles('SOCIO'), ctrl.miPerfil);
router.get('/cedula/:cedula', permitirRoles('ADMIN', 'RECEPCIONISTA'), ctrl.buscarPorCedula);
router.get('/:id', permitirRoles('ADMIN', 'RECEPCIONISTA', 'SOCIO'), idParam(), validar, ctrl.buscarPorId);
router.put('/:id', permitirRoles('ADMIN', 'RECEPCIONISTA', 'SOCIO'), idParam(), socioUpdate, validar, ctrl.actualizar);
router.delete('/:id', permitirRoles('ADMIN'), idParam(), validar, ctrl.eliminar);

module.exports = router;
