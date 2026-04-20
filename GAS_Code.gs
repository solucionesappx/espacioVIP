/**
 * @fileoverview Script de Google Apps para manejar la lógica de la aplicación de gestión de clientes.
 * Se encarga de la comunicación entre la hoja de cálculo de Google y la aplicación web.
 */

const SPREADSHEET_ID = '1amIGElsyLMqm9zz5rYsel_3LJGmLtKoqGF0pf3-i03g';
const SHEET_NAME = 'Tabla Registro Afiliados VIP';

/**
 * Maneja las peticiones POST, utilizadas para iniciar sesión.
 * @param {object} e El objeto de evento de la petición POST.
 * @returns {object} Un objeto JSON con el resultado de la operación.
 */
function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);
    const action = request.action;

    if (action === 'login') {
      return handleLogin(request.email, request.phone);
    } else {
      return createJsonResponse({ success: false, error: 'Acción no válida.' });
    }

  } catch (e) {
    return createJsonResponse({ success: false, error: 'Error al procesar la solicitud: ' + e.message });
  }
}

/**
 * Procesa la solicitud de inicio de sesión.
 * @param {string} email El correo electrónico proporcionado por el usuario.
 * @param {string} phone El teléfono proporcionado por el usuario.
 * @returns {object} Un objeto JSON con el resultado del inicio de sesión.
 */
function handleLogin(email, phone) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return createJsonResponse({ success: false, error: 'Hoja no encontrada.' });

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const loginCorreoColIndex = headers.indexOf('Login_Correo');
    const loginTelefonoColIndex = headers.indexOf('Login_Telefono');
    const nombreColIndex = headers.indexOf('Tabla_Cliente_Nombre');
    const fechaFinColIndex = headers.indexOf('Tabla_Fecha_Fin');
    const statusColIndex = headers.indexOf('Tabla_Renovacion_Status');
    // Mantenemos comentada o definimos para que no rompa el array.some()
    const notaColIndex = headers.indexOf('Tabla_Observacion'); 

    // VALIDACIÓN CORREGIDA: Eliminada la referencia a variables inexistentes
    const requiredIndices = [loginCorreoColIndex, loginTelefonoColIndex, nombreColIndex, fechaFinColIndex, statusColIndex];
    if (requiredIndices.some(index => index === -1)) {
      return createJsonResponse({ success: false, error: 'Faltan columnas requeridas en la hoja.' });
    }

    const foundUser = data.slice(2).find(row => {
        return String(row[loginCorreoColIndex]).trim().toLowerCase() === String(email).trim().toLowerCase() && 
               String(row[loginTelefonoColIndex]).trim().toLowerCase() === String(phone).trim().toLowerCase();
    });

    if (foundUser) {
        return createJsonResponse({
            success: true, // Es buena práctica devolver success: true
            role: 'user',
            Tabla_Cliente_Nombre: foundUser[nombreColIndex],
            Tabla_Cliente_Correo: foundUser[loginCorreoColIndex],
            Cliente_Telefono: foundUser[loginTelefonoColIndex],
            Tabla_Fecha_Fin: foundUser[fechaFinColIndex],
            Tabla_Renovacion_Status: foundUser[statusColIndex],
            Suscripcion_Nota: notaColIndex !== -1 ? foundUser[notaColIndex] : "" 
        });
    } else {
        return createJsonResponse({ success: false, error: 'Credenciales incorrectas.' });
    }
  } catch (e) {
    return createJsonResponse({ success: false, error: 'Error interno: ' + e.toString() });
  }
}

/**
 * Crea y formatea una respuesta JSON.
 * @param {object} data El objeto de datos a devolver.
 * @returns {object} Un objeto de respuesta formateado para el servicio de contenido.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
