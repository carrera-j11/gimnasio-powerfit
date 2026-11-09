const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/membresia.controller');
const v = require('../validators/gimnasio.validator');

const router = Router();
router.use(verificarToken);

const GESTION = permitirRoles('ADMIN', 'RECEPCIONISTA');

router.get('/', GESTION, ctrl.listar);
router.get('/mias', permitirRoles('SOCIO'), ctrl.mias);
router.get('/socio/:socioId', GESTION, idParam('socioId'), validar, ctrl.listarPorSocio);
router.get('/:id', permitirRoles('ADMIN', 'RECEPCIONISTA', 'SOCIO'), idParam(), validar, ctrl.buscarPorId);
router.post('/', GESTION, v.membresiaCrear, validar, ctrl.crear);
router.put('/:id', GESTION, idParam(), v.membresiaActualizar, validar, ctrl.actualizar);
router.patch('/:id/cancelar', GESTION, idParam(), validar, ctrl.cancelar);
router.delete('/:id', permitirRoles('ADMIN'), idParam(), validar, ctrl.eliminar);

module.exports = router;
