const { Router } = require('express');
const validar = require('../middlewares/validar');
const { verificarToken, permitirRoles } = require('../middlewares/auth');
const { idParam } = require('../validators/comunes');
const ctrl = require('../controllers/entrenador.controller');
const { entrenadorUpdate } = require('../validators/perfil.validator');

const router = Router();
router.use(verificarToken);

// Los entrenadores se crean con POST /api/auth/registro (rolSolicitado=ENTRENADOR)
router.get('/', ctrl.listar);
router.get('/me', permitirRoles('ENTRENADOR'), ctrl.miPerfil);
router.get('/:id', idParam(), validar, ctrl.buscarPorId);
router.put('/:id', permitirRoles('ADMIN', 'ENTRENADOR'), idParam(), entrenadorUpdate, validar, ctrl.actualizar);
router.delete('/:id', permitirRoles('ADMIN'), idParam(), validar, ctrl.eliminar);

module.exports = router;
