const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/admin.controller');
const v = require('../validators/auth.validator');

const router = Router();

// Todas: token válido + rol ADMIN
router.use(verificarToken, permitirRoles('ADMIN'));

router.get('/usuarios', v.filtros, validar, ctrl.listar);
router.get('/usuarios/pendientes', ctrl.pendientes);
router.get('/usuarios/personal', ctrl.personal);
router.post('/usuarios', v.usuarioCrear, validar, ctrl.crear);
router.get('/usuarios/:id', idParam(), validar, ctrl.buscarPorId);
router.put('/usuarios/:id/revision', idParam(), v.revision, validar, ctrl.revisar); // codigo + decision (1 = aprobar, 2 = rechazar)
router.delete('/usuarios/:id', idParam(), validar, ctrl.eliminar);

module.exports = router;
