const { spawn } = require('child_process');
const path = require('path');

/**
 * Llama a popola.py con un array de URLs o fuentes purificadas.
 * Retorna el JSON parseado o lanza un error.
 */
function runPopola(input) {
  return new Promise((resolve, reject) => {
    const pythonCmd  = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, '..', '..', 'agents', 'popola.py');

    let payload = null;
    if (Array.isArray(input)) {
      payload = { urls: input };
    } else if (input && Array.isArray(input.urls)) {
      payload = { urls: input.urls };
    } else if (input && Array.isArray(input.sources)) {
      payload = {
        sources: input.sources,
        fuentes_inaccesibles: input.fuentes_inaccesibles || [],
      };
    }

    if (!payload) {
      return reject(new Error('Input inválido para Popola.'));
    }

    console.log(`[POPOLA SERVICE] Iniciando Popola...`);
    console.log(`[POPOLA SERVICE] Script: ${scriptPath}`);
    console.log(`[POPOLA SERVICE] Payload: ${JSON.stringify(payload)}`);

    const python = spawn(pythonCmd, [scriptPath], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    // Enviar payload a Popola por stdin
    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();
    console.log(`[POPOLA SERVICE] Payload enviado a stdin.`);

    // stderr → logs de progreso de Popola
    python.stderr.on('data', (data) => {
      const log = data.toString().trim();
      console.log(`[POPOLA LOG] ${log}`);
    });

    // stdout → acumular JSON
    let stdoutBuffer = '';
    python.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();
      console.log(`[POPOLA SERVICE] Chunk stdout recibido (${data.length} bytes)`);
    });

    python.on('close', (code) => {
      console.log(`[POPOLA SERVICE] Proceso cerrado con código: ${code}`);

      if (code !== 0) {
        console.error(`[POPOLA SERVICE] Error: Popola terminó con código ${code}`);
        return reject(new Error(`Popola terminó con código ${code}`));
      }

      if (!stdoutBuffer.trim()) {
        console.error(`[POPOLA SERVICE] Error: stdout vacío.`);
        return reject(new Error('Popola no produjo output.'));
      }

      try {
        // Extracción defensiva del JSON (por si Popola agrega texto extra)
        const start = stdoutBuffer.indexOf('{');
        const end   = stdoutBuffer.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('No se encontró JSON en el output.');

        const jsonString = stdoutBuffer.slice(start, end + 1);
        const resultado  = JSON.parse(jsonString);

        console.log(`[POPOLA SERVICE] JSON parseado correctamente.`);
        console.log(`[POPOLA SERVICE] Titular sugerido: "${resultado.titular_sugerido}"`);
        resolve(resultado);
      } catch (e) {
        console.error(`[POPOLA SERVICE] Error parseando JSON: ${e.message}`);
        console.error(`[POPOLA SERVICE] Output recibido:\n${stdoutBuffer.slice(0, 500)}...`);
        reject(new Error(`Output de Popola no es JSON válido: ${e.message}`));
      }
    });

    python.on('error', (err) => {
      console.error(`[POPOLA SERVICE] Error al spawnear proceso: ${err.message}`);
      reject(err);
    });
  });
}

module.exports = { runPopola };
