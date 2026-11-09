/**
 * Envío de correos de PowerFit con Gmail mediante Google Apps Script.
 * Railway bloquea SMTP en los planes gratuitos; la API llama a este script por HTTPS.
 *
 * Instalación:
 * 1. https://script.google.com > Nuevo proyecto > pegar este código > Guardar.
 * 2. Configuración del proyecto (engranaje) > Propiedades del script > Añadir:
 *      TOKEN = <una clave larga aleatoria>   (la misma que MAIL_RELAY_TOKEN en Railway)
 * 3. Ejecutar la función "autorizar" una vez y aceptar los permisos de Gmail.
 * 4. Implementar > Nueva implementación > Tipo: Aplicación web
 *      Ejecutar como: Yo   |   Quién tiene acceso: Cualquier usuario
 *    Copiar la URL (https://script.google.com/macros/s/.../exec) en MAIL_RELAY_URL de Railway.
 */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty('TOKEN');
    if (!token || d.token !== token) return respuesta({ ok: false, error: 'token inválido' });
    if (!d.to || !d.subject || !d.html) return respuesta({ ok: false, error: 'faltan datos' });
    GmailApp.sendEmail(d.to, d.subject, 'Su cliente de correo no muestra HTML.', {
      htmlBody: d.html,
      name: d.nombre || 'Gimnasio PowerFit',
    });
    return respuesta({ ok: true });
  } catch (err) {
    return respuesta({ ok: false, error: String(err) });
  }
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutar una vez desde el editor para conceder el permiso de enviar correos. */
function autorizar() {
  Logger.log('Correos restantes hoy: ' + MailApp.getRemainingDailyQuota());
  GmailApp.getInboxUnreadCount();
}
