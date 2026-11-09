const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/pago.controller');
const v = require('../validators/gimnasio.validator');

const router = Router();
router.use(verificarToken);

const GESTION = permitirRoles('ADMIN', 'RECEPCIONISTA');

router.get('/', GESTION, ctrl.listar);
router.get('/mios', permitirRoles('SOCIO'), ctrl.mios);
router.get('/membresia/:membresiaId', GESTION, idParam('membresiaId'), validar, ctrl.listarPorMembresia);
router.get('/:id', permitirRoles('ADMIN', 'RECEPCIONISTA', 'SOCIO'), idParam(), validar, ctrl.buscarPorId);
router.post('/', GESTION, v.pago, validar, ctrl.crear);
router.put('/:id', GESTION, idParam(), v.pago, validar, ctrl.actualizar);
router.delete('/:id', permitirRoles('ADMIN'), idParam(), validar, ctrl.eliminar);

module.exports = router;
