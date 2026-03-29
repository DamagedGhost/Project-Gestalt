const { spawn } = require('child_process');
const path = require('path');

/**
 * Llama a popola.py con un array de URLs.
 * Retorna el JSON parseado o lanza un error.
 */
function runPopola(urls) {
  return new Promise((resolve, reject) => {
    const pythonCmd  = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, '..', '..', 'agents', 'popola.py');

    console.log(`[POPOLA SERVICE] Iniciando Popola...`);
    console.log(`[POPOLA SERVICE] Script: ${scriptPath}`);
    console.log(`[POPOLA SERVICE] URLs recibidas: ${JSON.stringify(urls)}`);

    const python = spawn(pythonCmd, [scriptPath], {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    // Enviar URLs a Popola por stdin
    python.stdin.write(JSON.stringify({ urls }));
    python.stdin.end();
    console.log(`[POPOLA SERVICE] URLs enviadas a stdin.`);

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
