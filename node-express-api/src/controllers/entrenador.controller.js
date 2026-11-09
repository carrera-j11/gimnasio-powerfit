const { Entrenador, Usuario, Clase } = require('../models');
const AppError = require('../utils/AppError');
const { validarCelularDisponible } = require('../utils/cuentas');
const { entrenadorResponse } = require('../utils/mappers');

const INCLUIR = [{ model: Usuario, as: 'usuario' }];

const respuesta = async (e) => entrenadorResponse(e, await Clase.count({ where: { entrenadorId: e.id } }));

async function obtenerEntrenador(id) {
  const entrenador = await Entrenador.findByPk(id, { include: INCLUIR });
  if (!entrenador) throw AppError.notFound(`Entrenador con id ${id} no encontrado`);
  return entrenador;
}

async function obtenerEntrenadorDeUsuario(usuario) {
  const entrenador = await Entrenador.findOne({ where: { usuarioId: usuario.id }, include: INCLUIR });
  if (!entrenador) throw AppError.notFound('El usuario actual no tiene un perfil de entrenador');
  return entrenador;
}

async function listar(req, res) {
  const lista = await Entrenador.findAll({
    include: [{ model: Usuario, as: 'usuario', where: { estado: 'APROBADA' } }], order: [['id', 'ASC']]
  });
  res.json(await Promise.all(lista.map(respuesta)));
}

async function miPerfil(req, res) {
  res.json(await respuesta(await obtenerEntrenadorDeUsuario(req.usuario)));
}

async function buscarPorId(req, res) {
  res.json(await respuesta(await obtenerEntrenador(req.params.id)));
}

/** ADMIN edita cualquiera; un ENTRENADOR solo sus propios datos. */
async function actualizar(req, res) {
  const entrenador = await obtenerEntrenador(req.params.id);
  if (req.usuario.rol === 'ENTRENADOR' && entrenador.usuario.id !== req.usuario.id) {
    throw AppError.forbidden('Un entrenador solo puede editar sus propios datos');
  }
  const { nombres, apellidos, celular, especialidad } = req.body;
  await validarCelularDisponible(celular, entrenador.usuario.id);
  await entrenador.usuario.update({ nombres, apellidos, celular });
  await entrenador.update({ especialidad });
  res.json(await respuesta(entrenador));
}

async function eliminar(req, res) {
  const entrenador = await obtenerEntrenador(req.params.id);
  if (await Clase.count({ where: { entrenadorId: entrenador.id } })) {
    throw AppError.badRequest('No se puede eliminar el entrenador porque tiene clases creadas');
  }
  const usuario = entrenador.usuario;
  await entrenador.destroy();
  await usuario.destroy();
  res.status(204).end();
}

module.exports = { obtenerEntrenadorDeUsuario, listar, miPerfil, buscarPorId, actualizar, eliminar };
