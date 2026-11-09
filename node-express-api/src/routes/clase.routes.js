const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/clase.controller');
const v = require('../validators/gimnasio.validator');

const router = Router();
router.use(verificarToken);

// Todos con sesión ven las clases; las crean el ADMIN (indicando entrenadorId) o el ENTRENADOR
router.get('/', ctrl.listar);
router.get('/mias', permitirRoles('ENTRENADOR'), ctrl.mias);
router.get('/:id', idParam(), validar, ctrl.buscarPorId);
router.get('/:id/inscritos', permitirRoles('ADMIN', 'RECEPCIONISTA', 'ENTRENADOR'), idParam(), validar, ctrl.inscritos);
router.post('/', permitirRoles('ADMIN', 'ENTRENADOR'), v.clase, validar, ctrl.crear);
router.put('/:id', permitirRoles('ADMIN', 'ENTRENADOR'), idParam(), v.clase, validar, ctrl.actualizar);
router.delete('/:id', permitirRoles('ADMIN', 'ENTRENADOR'), idParam(), validar, ctrl.eliminar);

module.exports = router;
