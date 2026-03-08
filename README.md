# Project-Gestalt
Agente de extracción de datos geopolíticos y arquitectura de microservicios.

## 📜 Origen y Filosofía del Proyecto
Inspirado conceptualmente en el *lore* de la saga *NieR* (específicamente en el "Proyecto Gestalt"), este sistema nace de un desafío de ingeniería y arquitectura de software: separar la "esencia" del "ruido". En un ecosistema digital saturado de desinformación, la premisa es construir una infraestructura robusta donde la información en bruto es ingerida, purificada de sesgos mediante inteligencia artificial y preservada sistemáticamente bajo estricta supervisión humana. *Glory to mankind.*

## ⚙️ Arquitectura de Microservicios (Los Actores)
El ecosistema completo está diseñado bajo un modelo de separación de responsabilidades, donde cada servicio cumple un rol vital:

* **Unidad Popola (IA Worker):** Este módulo actúa como el procesador cognitivo principal (Agente IA). Su directiva técnica es ingerir datos externos contaminados (noticias con sesgo), ejecutar el protocolo de aislamiento lógico y extraer exclusivamente hechos objetivos puros.
* **Unidad Devola (Backend Server & Admin Dashboard):** La capa de orquestación y validación. Implementa el patrón *Human-in-the-Loop*. Las inteligencias artificiales actúan solo como herramientas de transcripción y análisis; es un operador humano autenticado quien debe revisar, corregir y dar la autorización final.
* **La Biblioteca (Frontend & Database Cluster):** El destino final y seguro de los datos. Un hub centralizado de información geopolítica de solo lectura para el público, con un sistema de "Notas de la Comunidad" para auditoría y correcciones colectivas.

## 🎯 Visión del Proyecto
El objetivo central es demostrar el despliegue de una plataforma compleja end-to-end. Se utiliza la IA no como un generador de contenido libre, sino bajo un protocolo estricto ("Protocolo Grimoire Verum") que fuerza al modelo a ignorar su comportamiento conversacional y actuar estrictamente como un *parser* de datos estructurados. 

## 🛠️ Stack Tecnológico Esperado
Para lograr una orquestación escalable, el proyecto integrará las siguientes tecnologías:

* **Infraestructura y DevOps:** Contenedorización con Docker y despliegues orquestados en Kubernetes (K8s). CI/CD automatizado.
* **Extracción IA (Popola):** Microservicio en Python utilizando el SDK de Google GenAI (Modelos Gemini).
* **Core Backend (Devola):** Node.js (Express/NestJS) para el manejo de APIs RESTful y control de accesos (RBAC).
* **Bases de Datos (La Biblioteca):** Arquitectura híbrida utilizando PostgreSQL para relaciones complejas (usuarios, notas, permisos) y MongoDB para almacenamiento flexible de documentos (artículos en Markdown).
* **Frontend Web:** Framework moderno con Next.js (React) y TailwindCSS para un rendimiento óptimo.

## 🛡️ Seguridad
El proyecto prioriza la ciberseguridad desde el inicio del ciclo de vida del desarrollo. Los archivos de entorno y las credenciales (confidencial) están estrictamente ignorados en el control de versiones local e intencionalmente excluidos de la red pública. Nunca se debe exponer la `GENAI_API_KEY` o credenciales de bases de datos.

## 📄 Licencia
Este software se distribuye bajo la licencia MIT. Copyright (c) 2026 DamagedGhost. Se concede permiso sin cargo para usar, copiar, modificar y distribuir este software, sujeto a las condiciones de inclusión del aviso de derechos de autor. El software se proporciona "tal cual", sin garantía de ningún tipo. En ningún caso los autores o titulares de los derechos de autor serán responsables de reclamaciones o daños derivados del uso del software.
