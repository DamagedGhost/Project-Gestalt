require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Nota = require('./models/Nota');

async function insertSimulatedPopolaNote() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('No DB_URL');
    process.exit(1);
  }

  await mongoose.connect(dbUrl);
  console.log('Conectado a Mongo Atlas...');

  const popolaPayload = {
    titular_sugerido: "Crisis en La Moneda por denuncia contra Monsalve impacta agenda de seguridad y sello feminista",
    noticia_final: "El Gobierno del Presidente Gabriel Boric enfrenta una severa crisis política e institucional tras la denuncia por abuso sexual y presunta violación presentada en contra del exsubsecretario del Interior, Manuel Monsalve [2][3]. La investigación penal, liderada por el fiscal regional Xavier Armendáriz de la Fiscalía Metropolitana Centro Norte, indaga hechos que habrían ocurrido el domingo 22 de septiembre de 2024 en un hotel del centro de Santiago, luego de que Monsalve cenara y consumiera alcohol junto a una asesora de su gabinete [3].\n\nEl manejo gubernamental del caso ha concentrado severos cuestionamientos debido a la cronología de las decisiones adoptadas en el Palacio de La Moneda [1][2][3]. Tanto el Presidente Gabriel Boric como la ministra del Interior, Carolina Tohá, tomaron conocimiento de la acusación el martes 15 de octubre por la noche [2][3]. No obstante, el entonces subsecretario permaneció en sus funciones durante 48 horas e incluso viajó a la Región del Biobío antes de concretar su renuncia [2][3], la cual se oficializó el jueves 17 de octubre, dos horas después de que el diario La Segunda hiciera pública la investigación judicial [3]. Posteriormente, la ministra Camila Vallejo aseguró que Monsalve incurrió en un desacato respecto de una instrucción directa del Mandatario [2].\n\nLa gestión comunicacional del Ejecutivo complejizó el control de daños tras la extensa conferencia de prensa de 53 minutos ofrecida por el Presidente Boric [1][3]. Desde distintos sectores del oficialismo y la oposición surgieron críticas a la secuencia de errores en el manejo de crisis [1][4]. El gobernador metropolitano Claudio Orrego comparó la magnitud de la controversia con el caso Caval del mandato de Michelle Bachelet, destacando que el actual episodio compromete uno de los atributos doctrinarios centrales del gobierno: su compromiso con la agenda feminista y la erradicación de la violencia de género [1]. Asimismo, la ministra de la Mujer y Equidad de Género, Antonia Orellana, reconoció que solo fue informada formalmente de la situación el mismo día en que Monsalve dejó el cargo, tras retornar de una exposición oficial ante la ONU en Ginebra [3].\n\nEn paralelo, el oficialismo desplegó una estrategia de respaldo y blindaje político hacia la ministra del Interior, Carolina Tohá, frente a emplazamientos de renuncia y eventuales advertencias de acusaciones constitucionales por parte de bancadas opositoras [4]. Desde el Gobierno, autoridades como Camila Vallejo y la dirigenta Constanza Martínez cuestionaron que el debate político trasladara el foco de responsabilidad a ministras mujeres en lugar de centrarse en la investigación penal contra el presunto autor [4]. En tanto, analistas políticos advierten riesgos de parálisis en la agenda legislativa de seguridad pública mientras la permanencia de la jefa de gabinete continúe en el centro de la controversia [4].",
    linea_de_tiempo_extraida: [
      "2024-09-22 noche - Presuntos hechos de agresión sexual en hotel céntrico de Santiago tras cena con asesora (Fuente: El País)",
      "2024-10-14 - Presentación formal de denuncia por violación contra Manuel Monsalve ante Fiscalía (Fuente: El País, La Tercera)",
      "2024-10-15 noche - Presidente Boric y ministra Tohá son notificados de la denuncia; reunión con Monsalve en La Moneda (Fuente: La Tercera, El País)",
      "2024-10-16 - Monsalve viaja a Región del Biobío con autorización para informar a familiares (Fuente: La Tercera, El País)",
      "2024-10-17 12:00 - Diario La Segunda publica existencia de indagatoria penal contra subsecretario del Interior (Fuente: El País)",
      "2024-10-17 14:00 - Manuel Monsalve presenta su renuncia en punto de prensa en La Moneda; ministra Orellana es notificada (Fuente: La Tercera, El País)",
      "2024-10-18 - Presidente Gabriel Boric realiza conferencia de prensa de 53 minutos para detallar cronología (Fuente: El País, BioBioChile)",
      "2024-10-23 - Ministra Camila Vallejo afirma que exsubsecretario incurrió en desacato de orden presidencial (Fuente: La Tercera)",
      "2024-11-05 - La Moneda y mujeres de centroizquierda despliegan blindaje a ministra Carolina Tohá (Fuente: Emol)",
      "2024-11-21 - Claudio Orrego califica crisis por caso Monsalve como más grave que caso Caval (Fuente: BioBioChile)"
    ],
    hechos_verificados: [
      "Manuel Monsalve fue denunciado formalmente ante el Ministerio Público por abuso sexual y presunta violación por una funcionaria de su gabinete.",
      "El Presidente Gabriel Boric y la ministra Carolina Tohá conocían la existencia de la denuncia el martes 15 de octubre de 2024, dos días antes de la renuncia.",
      "La renuncia de Monsalve se concretó el jueves 17 de octubre de 2024 tras la divulgación del caso por el vespertino La Segunda.",
      "El Ministerio Público designó al fiscal regional Xavier Armendáriz para encabezar la investigación criminal.",
      "Monsalve contó con autorización para viajar a la Región del Biobío antes de formalizar su salida de la Subsecretaría del Interior.",
      "El Presidente Gabriel Boric ofreció un punto de prensa de 53 minutos para explicar las acciones del Ejecutivo ante la denuncia."
    ],
    hechos_fuente_unica: [
      {
        hecho: "La ministra de la Segegob, Camila Vallejo, aseguró que Manuel Monsalve desacató una instrucción directa del Presidente Boric previa a su dimisión.",
        fuente: "La Tercera"
      },
      {
        hecho: "La ministra de la Mujer, Antonia Orellana, no fue notificada de los hechos hasta el jueves 17 de octubre tras regresar de Ginebra.",
        fuente: "El País"
      },
      {
        hecho: "El gobernador Claudio Orrego comparó la controversia con el caso Caval y consideró que su gravedad es superior por comprometer el atributo feminista del Ejecutivo.",
        fuente: "BioBioChile"
      },
      {
        hecho: "Más de mil mujeres de partidos del Socialismo Democrático y la DC entregaron una carta de apoyo a Carolina Tohá para frenar ofensiva opositora.",
        fuente: "Emol"
      }
    ],
    rumores_confirmados: [
      {
        declaracion: "El gobernador Claudio Orrego afirmó que en La Moneda 'no se le tomó el peso a la gravedad de la denuncia desde el día 1' y calificó el punto de prensa como generador de dudas.",
        quien: "Claudio Orrego",
        medio: "BioBioChile (vía CNN Chile)"
      },
      {
        declaracion: "Camila Vallejo denunció que el debate y la exigencia de renuncia se concentró de forma desproporcionada en dos ministras mujeres en lugar del imputado.",
        quien: "Camila Vallejo",
        medio: "Emol"
      }
    ],
    contradicciones: [
      {
        punto: "Duración y balance comunicacional del punto de prensa de Gabriel Boric",
        version_a: "Claudio Orrego (vía BioBioChile) señala que fue 'una conferencia de una hora' que generó dudas y evidenció falta de comité de crisis.",
        version_b: "El País precisa que la rueda de prensa duró 53 minutos e intentó transparentar las 48 horas en reserva, abriendo flancos internos."
      },
      {
        punto: "Razones de la permanencia de Monsalve entre martes 15 y jueves 17",
        version_a: "Explicación inicial de Palacio: tiempo requerido para recopilar antecedentes formales y permitir a la autoridad hablar con su familia.",
        version_b: "Versión posterior del comité político (Vallejo en La Tercera): el médico desacató una orden presidencial antes de su salida."
      }
    ],
    sesgo_por_fuente: [
      {
        fuente: "BioBioChile",
        sesgo_detectado: "Encuadre crítico enfocado en la comparación con el escándalo Caval y el impacto en la coherencia ideológica del oficialismo en contexto electoral.",
        tipo_sesgo: "fiscalización política y confrontación electoral",
        hechos_omitidos: "No profundiza en los antecedentes jurídicos de la denuncia ni en las diligencias del fiscal Armendáriz."
      },
      {
        fuente: "La Tercera",
        sesgo_detectado: "Foco en los roces de poder al interior de La Moneda, contradicciones en el control de daños y la noción de 'desacato' atribuida a Monsalve.",
        tipo_sesgo: "crónica de desgaste institucional y filtración de gabinete",
        hechos_omitidos: "Omitió el ángulo de género y la defensa corporativa de ministras frente a acusaciones de oposición."
      },
      {
        fuente: "El País",
        sesgo_detectado: "Análisis estructural sobre el choque entre el relato feminista de la administración Boric y la acusación por delitos sexuales al encargado de seguridad nacional.",
        tipo_sesgo: "periodismo analítico y contextual de impacto institucional",
        hechos_omitidos: "No incluye las amenazas parlamentarias de juicio político o acusación constitucional."
      },
      {
        fuente: "Emol",
        sesgo_detectado: "Enfasis en la debilidad política de la ministra Tohá y la posibilidad de acusaciones constitucionales, amplificando voces de centros de estudio críticos.",
        tipo_sesgo: "encuadre de gobernabilidad y presión opositora",
        hechos_omitidos: "Omite los argumentos jurídicos que justificaron la reserva inicial de la investigación fiscal."
      }
    ],
    citas: [
      {
        indice: 1,
        medio: "BioBioChile",
        url: "https://www.biobiochile.cl/noticias/nacional/chile/2024/11/21/claudio-orrego-asegura-que-crisis-en-la-moneda-por-monsalve-es-aun-mas-grave-que-el-bullado-caso-caval.shtml",
        fragmento_relevante: "Orrego aseguró que en La Moneda 'no se le tomó el peso a la gravedad de la denuncia' y la comparó con el caso Caval."
      },
      {
        indice: 2,
        medio: "La Tercera",
        url: "https://www.latercera.com/la-tercera-pm/noticia/como-la-moneda-termino-de-soltar-a-manuel-monsalve/QJU6KNBLTJAGLPUMLLOKR6H5MI/",
        fragmento_relevante: "Boric se reunió el martes 15 en la noche con Monsalve; Vallejo aseguró que desacató una orden del Mandatario."
      },
      {
        indice: 3,
        medio: "El País",
        url: "https://elpais.com/chile/2024-10-23/el-caso-monsalve-la-acusacion-por-violacion-que-impacta-a-chile-y-golpea-a-la-moneda.html",
        fragmento_relevante: "La denuncia por presunto abuso y violación ocurrió el 22 de septiembre en un hotel de Santiago; rueda de prensa de 53 minutos de Boric."
      },
      {
        indice: 4,
        medio: "Emol",
        url: "https://www.emol.com/noticias/Nacional/2024/11/05/1147492/riesgos-mantener-toha.html",
        fragmento_relevante: "Semana arrancó con blindaje a Tohá; Vallejo cuestionó que el debate se traslade a dos ministras mujeres."
      }
    ],
    devola_checklist: [
      {
        hecho: "Verificar documento o acta que acredite la instrucción presidencial desacatada por Monsalve referida por ministra Vallejo.",
        tipo: "fuente_unica",
        url_respaldo: "https://www.latercera.com/la-tercera-pm/noticia/como-la-moneda-termino-de-soltar-a-manuel-monsalve/QJU6KNBLTJAGLPUMLLOKR6H5MI/",
        fragmento_clave: "Vallejo aseguró que el médico PS desacató una orden",
        estado: "pendiente"
      },
      {
        hecho: "Corroborar la condición administrativa del viaje de Monsalve al Biobío (comisión de servicio o permiso personal).",
        tipo: "fuente_unica",
        url_respaldo: "https://elpais.com/chile/2024-10-23/el-caso-monsalve-la-acusacion-por-violacion-que-impacta-a-chile-y-golpea-a-la-moneda.html",
        fragmento_clave: "Monsalve viajara al sur del país para hablar con su familia",
        estado: "pendiente"
      },
      {
        hecho: "Resolver discrepancia sobre la duración e impacto del punto de prensa (una hora vs 53 minutos).",
        tipo: "contradiccion",
        url_respaldo: "https://www.biobiochile.cl/noticias/nacional/chile/2024/11/21/claudio-orrego-asegura-que-crisis-en-la-moneda-por-monsalve-es-aun-mas-grave-que-el-bullado-caso-caval.shtml",
        fragmento_clave: "conferencia de prensa del Presidente, de una hora",
        estado: "pendiente"
      }
    ],
    evaluacion_verificacion: {
      nivel: "alto",
      justificacion: "Alto grado de consenso fáctico entre las 4 fuentes sobre las fechas críticas (22 de septiembre, 15 de octubre y 17 de octubre), el conocimiento previo de La Moneda y la apertura de investigación por Fiscalía. Las discrepancias son netamente interpretativas y comunicacionales."
    },
    tags: ["POLÍTICA", "SEGURIDAD", "PODER JUDICIAL", "CASO MONSALVE"],
    metadata: {
      fuentes_analizadas: 4,
      fuentes_inaccesibles: [
        "https://www.meganoticias.cl/nacional/462759-crisis-la-moneda-gobierno-investigacion-denuncia-violacion-manuel-monsalve-brk-21-10-2024.html"
      ],
      protocolo: "GESTALT v0.5.0 - Popola Unit Simulation"
    },
    status: "pendiente_revision" // Para que Devola la revise y la apruebe en la UI!
  };

  const nuevaNota = new Nota(popolaPayload);
  const guardada = await nuevaNota.save();
  console.log(`✓ Nota creada exitosamente en MongoDB! ID: ${guardada._id}`);
  console.log(`Estado: ${guardada.status}`);

  // Opcional: También creamos una copia ya aprobada para que esté visible de inmediato en La Biblioteca si el usuario la quiere ver ya publicada
  const notaPublicada = new Nota({
    ...popolaPayload,
    status: 'publicada',
    titular_final: popolaPayload.titular_sugerido,
    fecha_aprobacion: new Date(),
    fecha_publicacion: new Date(),
    notas_devola: "Aprobada por Protocolo Simulado Gestalt (Popola Unit)"
  });
  const pubGuardada = await notaPublicada.save();
  console.log(`✓ Nota publicada creada en La Biblioteca! ID: ${pubGuardada._id}`);

  await mongoose.disconnect();
  console.log('Desconectado de MongoDB.');
}

insertSimulatedPopolaNote().catch(err => {
  console.error(err);
  process.exit(1);
});
