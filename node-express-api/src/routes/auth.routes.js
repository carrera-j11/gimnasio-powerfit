const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');
const v = require('../validators/auth.validator');
const validar = require('../middlewares/validar');
const { verificarToken } = require('../middlewares/auth');

const router = Router();

// Públicos: registro -> (el ADMIN valida el código y aprueba) -> login
router.post('/registro', v.registro, validar, ctrl.registro);
router.post('/reenviar-codigo', v.soloEmail, validar, ctrl.reenviarCodigo);
router.post('/login', v.login, validar, ctrl.login);

// Requiere token
router.get('/perfil', verificarToken, ctrl.perfil);

module.exports = router;
