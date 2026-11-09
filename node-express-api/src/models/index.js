/**
 * Reúne los modelos y define las RELACIONES (equivale a @OneToOne / @ManyToOne en JPA).
 * onDelete RESTRICT: MySQL impide borrar un registro que tenga hijos.
 */
const { sequelize } = require('../config/database');
const { Usuario } = require('./Usuario');
const Socio = require('./Socio');
const Entrenador = require('./Entrenador');
const { PlanMembresia } = require('./PlanMembresia');
const { Membresia } = require('./Membresia');
const { Pago } = require('./Pago');
const { Clase } = require('./Clase');
const Inscripcion = require('./Inscripcion');

function unoAMuchos(padre, hijo, foreignKey, alias) {
  const opciones = { foreignKey: { name: foreignKey, allowNull: false }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' };
  padre.hasMany(hijo, opciones);
  hijo.belongsTo(padre, { ...opciones, as: alias });
}

function unoAUno(padre, hijo, foreignKey, alias) {
  const opciones = { foreignKey: { name: foreignKey, allowNull: false, unique: true }, onDelete: 'RESTRICT', onUpdate: 'CASCADE' };
  padre.hasOne(hijo, opciones);
  hijo.belongsTo(padre, { ...opciones, as: alias });
}

unoAUno(Usuario, Socio, 'usuarioId', 'usuario');            // Usuario 1 --- 1 Socio
unoAUno(Usuario, Entrenador, 'usuarioId', 'usuario');       // Usuario 1 --- 1 Entrenador
unoAMuchos(Socio, Membresia, 'socioId', 'socio');           // Socio 1 --- N Membresia
unoAMuchos(PlanMembresia, Membresia, 'planId', 'plan');     // Plan 1 --- N Membresia
unoAMuchos(Membresia, Pago, 'membresiaId', 'membresia');    // Membresia 1 --- N Pago
unoAMuchos(Entrenador, Clase, 'entrenadorId', 'entrenador');// Entrenador 1 --- N Clase
unoAMuchos(Socio, Inscripcion, 'socioId', 'socio');         // Socio N --- M Clase
unoAMuchos(Clase, Inscripcion, 'claseId', 'clase');         //   (a través de Inscripcion)

// "include" reutilizables para traer los datos relacionados
const INC = {
  socio: { model: Socio, as: 'socio', include: [{ model: Usuario, as: 'usuario' }] },
  entrenador: { model: Entrenador, as: 'entrenador', include: [{ model: Usuario, as: 'usuario' }] },
  plan: { model: PlanMembresia, as: 'plan' }
};
INC.membresia = { model: Membresia, as: 'membresia', include: [INC.socio, INC.plan] };
INC.clase = { model: Clase, as: 'clase', include: [INC.entrenador] };

module.exports = { sequelize, Usuario, Socio, Entrenador, PlanMembresia, Membresia, Pago, Clase, Inscripcion, INC };
