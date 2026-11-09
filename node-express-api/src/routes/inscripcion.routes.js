const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/inscripcion.controller');
const v = require('../validators/gimnasio.validator');

const router = Router();
router.use(verificarToken);

// Una inscripción no se edita: se cancela (DELETE) y se crea otra
router.get('/', permitirRoles('ADMIN', 'RECEPCIONISTA'), ctrl.listar);
router.get('/mias', permitirRoles('SOCIO'), ctrl.mias);
router.post('/', permitirRoles('ADMIN', 'RECEPCIONISTA', 'SOCIO'), v.inscripcion, validar, ctrl.crear);
router.delete('/:id', permitirRoles('ADMIN', 'RECEPCIONISTA', 'SOCIO'), idParam(), validar, ctrl.eliminar);

module.exports = router;
