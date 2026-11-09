const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/plan.controller');
const v = require('../validators/gimnasio.validator');

const router = Router();

// Solo 3 planes fijos: no hay POST ni DELETE. Consultar es público.
router.get('/', ctrl.listar);
router.get('/:tipo', v.tipoParam, validar, ctrl.buscar);
router.put('/:tipo', verificarToken, permitirRoles('ADMIN'), v.tipoParam, v.planUpdate, validar, ctrl.actualizar);

module.exports = router;
