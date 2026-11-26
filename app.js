/* =========================================================================
   NEXCARGO HUB v3 — app.js
   SPA en JavaScript vanilla, sin compilación.

   Módulos:
1. Base de conocimiento (marca, etapas, categorías, copy, prompts, guiones)
2. Utilidades (storage, fechas, moneda, texto, toasts, modal)
3. Inicialización limpia (sin datos de ejemplo quemados)
4. Garantía (semáforo + cálculo del 10%)
5. Navegación y modos (plataforma / portal del cliente)
6. Dashboard
7. Pedidos y guías
8. Admin (bloqueo del módulo contable)
9. Contabilidad
10. Asistente 01 — Copy
11. Asistente 02 — Diseño
12. Asistente 03 — Comercial
13. Configuración, integraciones (n8n) e IA (Gemini)
14. Portal público de rastreo
========================================================================= */
(() => {
  'use strict';

  /* =======================================================================
1. BASE DE CONOCIMIENTO
  ======================================================================= */
  const KEYS = {
    pedidos: 'nexcargo_pedidos',
    contabilidad: 'nexcargo_contabilidad',
    config: 'nexcargo_config',
    biblioteca: 'nexcargo_biblioteca',
    stats: 'nexcargo_stats',
    actividad: 'nexcargo_actividad',
    secuencia: 'nexcargo_guia_secuencia',
    semilla: 'nexcargo_semilla_v3',
    sesionAdmin: 'nexcargo_sesion_admin' // sessionStorage: se borra al cerrar la pestaña
  };

  const MINUTOS_AUTOBLOQUEO = 15;

  const PROHIBIDAS = [
    'lideres en el mercado', 'soluciones integrales', 'en el mundo actual', 'calidad garantizada',
    'tu mejor aliado estrategico', 'revolucionando la logistica', 'estamos a su entera disposicion'
  ];

  const ETAPAS = [
    { id: 1, nombre: 'En Bodega / Estiba Segura', corto: 'En bodega', icono: 'bi-box-seam' },
    { id: 2, nombre: 'En Ruta (Camión Turbo)', corto: 'En ruta', icono: 'bi-truck' },
    { id: 3, nombre: 'Ingresando a Zona Rural / Destino', corto: 'Llegando a destino', icono: 'bi-signpost-split' },
    { id: 4, nombre: 'Entregado sin Novedades', corto: 'Entregado', icono: 'bi-house-check' }
  ];

  const CATEGORIAS = {
    'Egreso Operativo': ['Combustible ACPM', 'Peajes Nacionales/Rurales', 'Nómina / Viáticos Conductor', 'Mantenimiento Camión Turbo', 'Material de Embalaje / Estiba', 'Seguros', 'Otro'],
    'Ingreso Adicional': ['Servicio adicional de cargue/descargue', 'Seguro de carga cobrado', 'Otro ingreso']
  };
  const CAT_FLETE = 'Flete de transporte';
  const CAT_DESCUENTO = 'Garantía 10% por retraso';

  const VISTAS = {
    dashboard: { titulo: 'Vista General', sub: 'Operación, garantías y marketing de Nexcargo en un solo lugar' },
    pedidos: { titulo: 'Pedidos y Guías', sub: 'Registro directo, guía automática, etapas de entrega y semáforo de garantía' },
    contabilidad: { titulo: 'Contabilidad', sub: 'Ingresos por fletes, descuentos por garantía, gastos de flota y utilidad' },
    copy: { titulo: 'Estrategia y Copywriting', sub: 'Asistente 01 · 3 variaciones con PAS o AIDA para cada canal' },
    diseno: { titulo: 'Diseño Gráfico y Prompts', sub: 'Asistente 02 · Regla de 3 colores, zona segura y prompts en inglés' },
    comercial: { titulo: 'Comercial y Objeciones', sub: 'Asistente 03 · Guiones oficiales personalizados con tienda y guía' },
    config: { titulo: 'Configuración', sub: 'Webhooks de n8n, Google Sheets, contraseña de administrador e IA' }
  };

  /* --- Copy: bloques por ángulo (fuente: documentos de marca 01, 02, 03 y 04) --- */
  const ANGULOS = {
    dolor: {
      nombre: 'Opción 1 · Dolor / Seguridad', icono: 'bi-shield-check', accent: 'azul', enfoque: 'cuidado',
      hook: '¿Cuántas devoluciones te ha costado un mueble rayado este año?',
      problema: 'Despachas una sala nueva y llega con un raspón en el brazo. O una nevera con la puerta hundida porque le montaron carga encima.',
      agitacion: 'Tu cliente no culpa a la transportadora: te culpa a ti. Devolución, reclamo, margen perdido y un comprador que no vuelve.',
      solucion: 'En Nexcargo trabajamos con estiba segura: nada pesado encima de lo delicado, protección dentro del camión turbo y un equipo con disposición para entregar con cuidado hasta la puerta.',
      atencion: 'Cero rayones no es un eslogan: es la forma en que cargamos.',
      interes: 'Cada sala, colchón o nevera se ubica según su peso y fragilidad dentro de un camión turbo protegido. Nada pesado va encima de lo delicado.',
      deseo: 'Despacha sin cruzar los dedos: sigues tu pedido con su número de guía y tu cliente recibe el producto como salió de tu tienda.',
      vinetas: ['Estiba segura: nada pesado encima de lo delicado', 'Rastreo con número de guía de principio a fin', '10% de descuento en el flete si nos retrasamos'],
      captionCorto: 'Estiba segura y rastreo con número de guía en cada despacho.',
      hashtags: '#Nexcargo #CeroRayones #Mueblerías #Electrodomésticos #TransporteDeCarga',
      titularAd: 'Tus muebles llegan sin rayones', descAd: 'Estiba segura · Rastreo por guía',
      asunto: '¿Cuánto te costó el último mueble rayado?', preheader: 'Así cargamos para que no vuelva a pasar.'
    },
    cobertura: {
      nombre: 'Opción 2 · Cobertura / Agilidad', icono: 'bi-geo-alt', accent: 'verde', enfoque: 'rural',
      hook: '¿Tu cliente vive en una vereda y la transportadora no quiere entrar?',
      problema: 'Vendes un comedor a un cliente en un corregimiento y la transportadora lo deja en la cabecera municipal, o ni siquiera acepta la ruta.',
      agitacion: 'Tu cliente tiene que buscar cómo subirlo, se molesta y la venta que cerraste termina en reclamo. Y cada vez que dices "allá no llegamos", pierdes la siguiente.',
      solucion: 'Nexcargo opera con camiones turbo: capacidad para paquetería grande y agilidad para entrar a municipios, corregimientos y zonas rurales donde las tractomulas no caben.',
      atencion: 'Llegamos hasta donde otros no entran.',
      interes: 'Nuestros camiones turbo combinan capacidad de carga y maniobra para rutas nacionales y vías rurales de Colombia.',
      deseo: 'Vende sin limitarte por el mapa: ofrece entrega en zona rural, con rastreo por guía y sin pagar sobrecostos de carga masiva.',
      vinetas: ['Camiones turbo hasta municipios, corregimientos y veredas', 'Rastreo con número de guía durante todo el trayecto', '10% de descuento en el flete si nos retrasamos'],
      captionCorto: 'Camiones turbo hasta la vereda, sin dejar tu mercancía en la cabecera.',
      hashtags: '#Nexcargo #CoberturaRural #CamionesTurbo #Mueblerías #Colombia',
      titularAd: 'Llegamos hasta la zona rural', descAd: 'Camiones turbo · Cobertura nacional',
      asunto: 'Tus clientes rurales también reciben a tiempo', preheader: 'Camiones turbo donde las tractomulas no entran.'
    },
    garantia: {
      nombre: 'Opción 3 · Garantía / Confianza', icono: 'bi-stopwatch', accent: 'violeta', enfoque: 'garantia',
      hook: 'Si llegamos tarde, te descontamos el 10% del flete. Así de simple.',
      problema: 'Le prometes a tu cliente una fecha de entrega y la transportadora no cumple. Ni siquiera avisa.',
      agitacion: 'Tú das la cara, tú recibes las llamadas y tú pierdes la confianza de un cliente que ya pagó. Mientras tanto, la transportadora cobra lo mismo.',
      solucion: 'En Nexcargo consultas el estado de tu despacho con su número de guía. Y si la entrega llega aunque sea un día después de lo pactado, te descontamos el 10% del flete.',
      atencion: 'No prometemos puntualidad: la respaldamos con nuestra plata.',
      interes: 'Cada despacho tiene número de guía y fecha pactada desde el primer día, sin tener que llamar a preguntar.',
      deseo: 'Fecha acordada, estado visible y un 10% de descuento automático en el flete si no cumplimos. Tranquilidad para tu tienda.',
      vinetas: ['Fecha de entrega acordada desde el despacho', 'Estado del pedido con número de guía', '10% de descuento en el flete desde el primer día de retraso'],
      captionCorto: 'Si llegamos tarde, 10% de descuento en el flete.',
      hashtags: '#Nexcargo #EntregaATiempo #GarantíaReal #Mueblerías #Colombia',
      titularAd: '¿Llegamos tarde? 10% menos de flete', descAd: 'Rastreo por guía · Garantía real',
      asunto: 'Si llegamos tarde, pagas 10% menos de flete', preheader: 'La puntualidad respaldada con dinero, no con promesas.'
    }
  };

  const CTA = {
    instagram: 'Escríbenos por WhatsApp y cotiza tu próximo despacho hoy.',
    reel: 'Cotiza por WhatsApp: link en el perfil.',
    facebook: 'Envíanos un mensaje y cotiza tu próximo despacho.',
    correo: 'Responde este correo con origen, destino, mercancía y fecha, y te enviamos la tarifa.',
    whatsapp: 'Pásame origen, destino, mercancía y fecha, y te cotizo de una vez.'
  };

  const CANALES = {
    instagram: { nombre: 'Instagram Post', ia: 'Caption de Instagram: gancho, cuerpo en párrafos cortos, CTA y 5 hashtags.' },
    reel: { nombre: 'Reel / TikTok', ia: 'Guion de 15 a 20 segundos con escenas y tiempos ([0–3 s], etc.), texto en pantalla y caption corto.' },
    facebook: { nombre: 'Facebook Ads', ia: 'Anuncio con TEXTO PRINCIPAL, TITULAR (máx. 40 caracteres), DESCRIPCIÓN y BOTÓN.' },
    correo: { nombre: 'Correo B2B', ia: 'Correo con ASUNTO, PREHEADER, saludo "Hola, [Nombre]:", cuerpo y firma "Equipo comercial Nexcargo".' },
    whatsapp: { nombre: 'WhatsApp', ia: 'Mensaje corto y escaneable (máx. 70 palabras), saludo con [Nombre], viñetas y CTA.' }
  };

  /* --- Diseño: escenas y formatos --- */
  const ESCENAS = {
    cuidado: {
      nombre: 'Cuidado de muebles', hex: '#1B4F88', color: 'institutional blue',
      sujeto: 'two professional movers in clean navy-blue uniforms carefully loading a blanket-wrapped modern sofa into the cargo box of a clean white medium-duty Colombian "turbo" truck (two-axle, cab-over-engine, enclosed box body, no visible branding); inside, furniture and boxed appliances are neatly strapped and nothing heavy is stacked on delicate items',
      entorno: 'tidy loading dock of a modern furniture store in a Colombian city, clean concrete floor, organized space',
      luz: 'soft natural daylight with gentle fill light, warm and trustworthy atmosphere',
      camara: 'eye-level three-quarter angle, 35mm lens, f/4, sharp focus on the hands and the sofa',
      mood: 'care, order, safety, professionalism',
      imagenES: 'Operarios cargando con cuidado un sofá protegido en un camión turbo limpio, carga bien asegurada.'
    },
    rural: {
      nombre: 'Cobertura rural', hex: '#228161', color: 'institutional green',
      sujeto: 'a single clean white medium-duty Colombian "turbo" truck (two-axle, cab-over-engine, enclosed box body, no visible branding) driving on a well-maintained rural road',
      entorno: 'lush green Andean mountains of Colombia, coffee-region landscape with small farms and a rural village in the distance',
      luz: 'golden early-morning light, light mist in the valleys, natural greens',
      camara: 'elevated three-quarter drone shot, 24mm lens, truck placed on the lower third of the frame',
      mood: 'reach, agility, reliability',
      imagenES: 'Camión turbo blanco en vía rural bien transitable entre montañas verdes andinas, luz de amanecer.'
    },
    garantia: {
      nombre: 'Garantía 10%', hex: '#5F3A88', color: 'institutional violet',
      sujeto: 'a confident Colombian furniture store owner in their 40s, smart-casual clothing, checking a delivery status on a tablet (abstract screen, no readable text), a clean white turbo truck visible through the showroom window',
      entorno: 'bright, organized modern furniture and home-appliance showroom, sofas and refrigerators softly blurred in the background',
      luz: 'bright soft window light, natural skin tones',
      camara: 'medium shot at eye level, 50mm lens, shallow depth of field',
      mood: 'control, peace of mind, punctuality',
      imagenES: 'Dueño de mueblería revisando en una tablet el estado de su despacho; camión turbo visible por la ventana.'
    }
  };

  const FORMATOS = {
    '1:1': { px: '1080 × 1080 px', zona: '80 px en todos los bordes', espacio: 'keep the upper 40% of the frame as clean, uncluttered negative space for headline text; main subject in the lower half' },
    '4:5': { px: '1080 × 1350 px', zona: '80 px en todos los bordes', espacio: 'keep the top 35% as clean negative space (soft sky or plain wall) for headline and logo; subject in the lower-middle area' },
    '9:16': { px: '1080 × 1920 px', zona: '250 px arriba, 400 px abajo y 80 px a los lados', espacio: 'vertical composition; keep the top 25% clean for the headline and the bottom 25% free of important details (app interface area); subject centered' },
    '16:9': { px: '1920 × 1080 px', zona: '60 px en todos los bordes', espacio: 'subject placed on the right third; left half kept as clean, softly blurred negative space for text' }
  };

  const NEGATIVO_BASE = [
    'tractor-trailer', 'semi truck', '18-wheeler', 'American long-nose truck', 'dirty truck', 'rusty vehicle',
    'crushed boxes', 'damaged boxes', 'unsecured cargo', 'heavy items stacked on furniture', 'scratched furniture',
    'messy warehouse', 'clutter', 'muddy road', 'landslide', 'accident',
    'text', 'letters', 'words', 'watermark', 'logo', 'readable license plate',
    'deformed hands', 'extra fingers', 'distorted faces', 'warped wheels', 'duplicated vehicles', 'floating objects',
    'oversaturated colors', 'heavy filters', 'cartoon', 'illustration', 'CGI look', 'low resolution', 'blurry'
  ];

  /* --- Guiones oficiales (03_CRM_Cotizaciones/04_Guiones_WhatsApp_y_Objeciones.txt) --- */
  const OBJECIONES = {
    miedo: {
      boton: 'Me da miedo que rayen los muebles', icono: 'bi-shield-exclamation', asunto: 'Así cuidamos tus muebles en cada despacho',
      texto: n => `Te entiendo perfectamente, ${n}. Es el dolor número uno cuando se mueven muebles o electrodomésticos.\n\nPor eso en **Nexcargo** trabajamos con protocolo de estiba segura:\n• No apilamos carga pesada encima de mercancía delicada\n• Usamos protección en el camión turbo\n• Nuestro equipo entrega con cuidado hasta la puerta, incluso en zonas rurales\n\nAdemás, sigues tu despacho con su número de guía y, si quieres respaldo adicional, puedes tomar nuestro **seguro de carga**.\n\n**¿Me pasas los datos de tu próximo despacho y te lo cotizo con estas condiciones?**`
    },
    precio: {
      boton: 'Otra transportadora cobra más barato', icono: 'bi-cash-coin', asunto: 'Lo que te ahorras con Nexcargo',
      texto: n => `Totalmente válido revisar números, ${n}. La diferencia con **Nexcargo** es lo que te ahorras en dolores de cabeza y devoluciones:\n\n• Llegamos directo a zonas rurales donde otros dejan la mercancía en la cabecera.\n• Tratamos cada mueble o electrodoméstico sin malas prácticas para que llegue impecable a tu cliente.\n• Y respaldamos el tiempo de entrega: **si nos retrasamos desde el primer día frente a lo acordado, te descontamos el 10% del flete**.\n\n**¿Te parece si probamos con este primer despacho para que veas cómo trabajamos?**`
    },
    rural: {
      boton: '¿Llegan hasta zona rural?', icono: 'bi-geo-alt', asunto: 'Sí, llegamos hasta la zona rural',
      texto: n => `¡Claro que sí, ${n}! Llegamos a municipios, corregimientos y zonas rurales con **camiones turbo**: tienen capacidad para paquetería grande y la agilidad para entrar donde las tractomulas no caben.\n\nPara confirmarte ruta y tarifa, cuéntame:\n1. **Municipio y vereda o corregimiento** de destino\n2. **Qué mercancía envías** y cuántas unidades\n3. **Medidas aproximadas o peso estimado**\n4. **Fecha** en que necesitas despachar\n\n**¿Me pasas los datos y te cotizo de una vez?**`
    },
    guia: {
      boton: 'Enviar código de seguimiento de guía', icono: 'bi-upc-scan', asunto: 'Tu número de guía Nexcargo',
      texto: (n, p) => `¡Hola, ${n}! Tu despacho ya quedó registrado con **Nexcargo**.\n\n📦 **Guía:** ${p ? p.numeroGuia : '[número de guía]'}\n📍 **Ruta:** ${p ? p.ruta : '[origen → destino]'}\n📅 **Entrega pactada:** ${p ? fechaLarga(p.fechaPactada) : '[fecha]'}\n🚚 **Etapa actual:** ${p ? etapaDe(p).nombre : '[etapa]'}\n\nPuedes consultar el estado con tu número de guía en nuestro portal de rastreo: [enlace del portal].\n\nRecuerda: si llegamos después de la fecha pactada, te descontamos el **10% del flete**.`
    },
    danio: {
      boton: '¿Y si se daña o se pierde?', icono: 'bi-box-seam', asunto: 'Seguro de carga para tu despacho',
      texto: n => `Pregunta clave, ${n}. Primero, trabajamos para que eso no pase:\n• Estiba segura: nada pesado encima de lo delicado\n• Protección dentro del camión turbo\n• Seguimiento con número de guía de principio a fin\n\nY si quieres un respaldo extra, tenemos **seguro de carga**:\n• Cubre **hasta el 50%** del valor que declares de tu mercancía\n• Es un adicional que se cobra aparte del flete\n• Si algo pasa, la reclamación se hace por **PQR** y le hacemos seguimiento contigo\n\n**¿Te incluyo el seguro en la cotización de tu próximo despacho?**`
    },
    garantia: {
      boton: '¿Cómo funciona el 10%?', icono: 'bi-stopwatch', asunto: 'Así funciona nuestra garantía del 10%',
      texto: n => `Muy sencillo, ${n}:\n• Al confirmar el despacho acordamos contigo la **fecha de entrega**.\n• Si la carga llega **aunque sea 1 día después** de esa fecha, te descontamos el **10% del flete**.\n• La única excepción son los **paros** u otras situaciones que se salen de nuestras manos.\n\nNo es una promesa en el aire: respaldamos la puntualidad con nuestra propia plata. **¿Te armo la cotización?**`
    }
  };

  /* =======================================================================
2. UTILIDADES
  ======================================================================= */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const Store = {
    get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.warn('[Nexcargo] localStorage', e); return false; } }
  };

  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalizar = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const renderMarcado = s => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  /** WhatsApp usa *un asterisco*; el resto de canales, texto plano */
  const paraCanal = (s, canal) => canal === 'whatsapp' ? s.replace(/\*\*(.+?)\*\*/g, '*$1*') : s.replace(/\*\*(.+?)\*\*/g, '$1');
  const detectarProhibidas = t => { const n = normalizar(t); return PROHIBIDAS.filter(p => n.includes(p)); };
  const contarPalabras = s => String(s).trim().split(/\s+/).filter(Boolean).length;
  const primerNombre = tienda => String(tienda || '').split(/[·\-|,]/)[0].trim() || 'cliente';

  /* --- Fechas (siempre en hora local de Colombia del equipo) --- */
  const fechaISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hoyISO = () => fechaISO();
  const sumarDias = n => { const d = new Date(); d.setDate(d.getDate() + n); return fechaISO(d); };
  const aFecha = iso => new Date(`${iso}T12:00:00`);
  const diasEntre = (desde, hasta) => Math.round((aFecha(hasta) - aFecha(desde)) / 86400000);
  const fechaCorta = iso => iso ? aFecha(iso.slice(0, 10)).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—';
  const fechaLarga = iso => iso ? aFecha(iso.slice(0, 10)).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }) : '—';
  const nombreMes = ym => { const [y, m] = ym.split('-'); const t = new Date(+y, +m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); };
  const haceCuanto = iso => {
    const min = Math.round((Date.now() - new Date(iso)) / 60000);
    if (min < 1) return 'Hace un momento';
    if (min < 60) return `Hace ${min} min`;
    if (min < 1440) return `Hace ${Math.round(min / 60)} h`;
    return fechaCorta(fechaISO(new Date(iso)));
  };

  /* --- Moneda --- */
  const COP = n => (n < 0 ? '−' : '') + '$' + Math.abs(Math.round(n || 0)).toLocaleString('es-CO');
  const porcentaje = (a, b) => b ? `${Math.round((a / b) * 1000) / 10}%` : '—';

  const normalizarWhatsapp = n => { const d = String(n || '').replace(/\D/g, ''); return d.length === 10 && d.startsWith('3') ? '57' + d : d; };

  async function copiar(texto, mensaje = 'Copiado al portapapeles') {
    try { await navigator.clipboard.writeText(texto); }
    catch {
      const ta = Object.assign(document.createElement('textarea'), { value: texto });
      ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast(mensaje, 'bi-clipboard-check');
  }

  function toast(mensaje, icono = 'bi-check-circle-fill', accent = 'verde') {
    const el = document.createElement('div');
    el.className = 'toast'; el.setAttribute('role', 'status'); el.dataset.accent = accent;
    el.innerHTML = `<div class="toast-body"><i class="bi ${icono}"></i><span>${escapeHtml(mensaje)}</span>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>`;
    $('#toastZona').appendChild(el);
    const t = new bootstrap.Toast(el, { delay: 3400 });
    el.addEventListener('hidden.bs.toast', () => el.remove());
    t.show();
  }

  function confirmar(titulo, cuerpoHtml, textoOk = 'Confirmar') {
    return new Promise(resolve => {
      const modalEl = $('#modalConfirmar');
      $('#modalConfirmarTitulo').textContent = titulo;
      $('#modalConfirmarCuerpo').innerHTML = cuerpoHtml;
      const ok = $('#modalConfirmarOk'); ok.textContent = textoOk;
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      let aceptado = false;
      const alAceptar = () => { aceptado = true; modal.hide(); };
      ok.addEventListener('click', alAceptar, { once: true });
      modalEl.addEventListener('hidden.bs.modal', () => { ok.removeEventListener('click', alAceptar); resolve(aceptado); }, { once: true });
      modal.show();
    });
  }

  function grupoSeleccion(cont, alCambiar) {
    cont.addEventListener('click', e => {
      const b = e.target.closest('button[data-value]');
      if (!b) return;
      $$('button[data-value]', cont).forEach(x => x.classList.toggle('active', x === b));
      alCambiar && alCambiar(b.dataset.value);
    });
  }
  const valorGrupo = c => $('button.active', c)?.dataset.value;
  const fijarGrupo = (c, v) => $$('button[data-value]', c).forEach(b => b.classList.toggle('active', b.dataset.value === v));

  function descargarCSV(nombre, columnas, filas) {
    const celda = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = '\uFEFF' + [columnas.map(c => c.titulo).join(';'), ...filas.map(f => columnas.map(c => celda(f[c.clave])).join(';'))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function validarCampos(form) {
    let ok = true;
    $$('[required]', form).forEach(i => {
      const v = i.value.trim();
      const valido = v && (i.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) && (i.type !== 'number' || (+v >= (+i.min || 0)));
      i.classList.toggle('is-invalid', !valido);
      if (!valido) ok = false;
    });
    if (!ok) { toast('Revisa los campos marcados en rojo', 'bi-exclamation-triangle', 'violeta'); $('.is-invalid', form)?.focus(); }
    return ok;
  }

  const Stats = {
    get: () => Store.get(KEYS.stats, { copys: 0, briefs: 0 }),
    sumar(c, n = 1) { const s = this.get(); s[c] = (s[c] || 0) + n; Store.set(KEYS.stats, s); }
  };
  function registrarActividad(texto, icono = 'bi-dot', accent = 'profundo') {
    const l = Store.get(KEYS.actividad, []);
    l.unshift({ texto, icono, accent, fecha: new Date().toISOString() });
    Store.set(KEYS.actividad, l.slice(0, 20));
  }

  /* =======================================================================
3. INICIALIZACIÓN LIMPIA (sin datos ficticios quemados)
  ======================================================================= */
  function sembrarDatos(forzar = false) {
    if (forzar) {
      Store.set(KEYS.pedidos, []);
      Store.set(KEYS.contabilidad, []);
    } else {
      const pedidos = Store.get(KEYS.pedidos, null);
      if (!Array.isArray(pedidos)) Store.set(KEYS.pedidos, []);
      else {
        const reales = pedidos.filter(p => p && !p.ejemplo &&
          !/^NX-PRUEBA-/i.test(p.numeroGuia || ''));
        if (reales.length !== pedidos.length) Store.set(KEYS.pedidos, reales);
      }

      const movimientos = Store.get(KEYS.contabilidad, null);
      if (!Array.isArray(movimientos)) Store.set(KEYS.contabilidad, []);
      else {
        const reales = movimientos.filter(m => m && !m.ejemplo && !/^MOV-PRUEBA-/i.test(m.id || ''));
        if (reales.length !== movimientos.length) Store.set(KEYS.contabilidad, reales);
      }
      if (localStorage.getItem(KEYS.semilla)) return;
    }
    localStorage.setItem(KEYS.semilla, '1');
  }

  /* =======================================================================
4. GARANTÍA: SEMÁFORO + CÁLCULO DEL 10%
  ======================================================================= */
  const etapaDe = p => ETAPAS[(p.etapa || 1) - 1] || ETAPAS[0];

  function garantia(p) {
    const flete = Number(p.valorFlete) || 0;
    const entregado = p.etapa === 4;
    const referencia = entregado ? (p.fechaEntrega || hoyISO()) : hoyISO();
    const dias = diasEntre(p.fechaPactada, referencia);
    const r = { flete, dias: Math.max(0, dias), descuento: 0, fleteFinal: flete, entregado, definitivo: entregado };

    if (dias > 0 && p.retrasoParo) return { ...r, estado: 'paro', clase: 'sem-paro', icono: 'bi-cone-striped', texto: `Retraso por paro (${dias} d) — No aplica 10%` };
    if (dias > 0) {
      const descuento = Math.round(flete * 0.10);
      return {
        ...r, estado: 'retraso', clase: 'sem-retraso', icono: 'bi-patch-exclamation-fill', descuento, fleteFinal: flete - descuento,
        texto: entregado ? `Entregado con retraso (${dias} d) — 10% aplicado` : `Retraso Detectado — Aplicar 10% Descuento`
      };
    }
    if (entregado) return { ...r, estado: 'cumplido', clase: 'sem-cumplido', icono: 'bi-check2-circle', texto: 'Entregado a tiempo' };
    if (dias === 0) return { ...r, estado: 'hoy', clase: 'sem-hoy', icono: 'bi-alarm', texto: 'Entrega Hoy — Prioritario' };
    return { ...r, estado: 'atiempo', clase: 'sem-atiempo', icono: 'bi-clock', texto: 'A Tiempo' };
  }

  const badgeGarantia = (g, pulso = false) => `<span class="semaforo ${g.clase} ${pulso && g.estado === 'retraso' && !g.entregado ? 'pulso' : ''}"><i class="bi ${g.icono}"></i>${escapeHtml(g.texto)}</span>`;

  /* =======================================================================
5. NAVEGACIÓN Y MODOS
  ======================================================================= */
  let vistaActual = 'dashboard';

  function irA(vista) {
    if (!VISTAS[vista]) return;
    vistaActual = vista;
    $$('.vista').forEach(v => v.classList.toggle('active', v.id === `vista-${vista}`));
    $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === vista));
    $('#vistaTitulo').textContent = VISTAS[vista].titulo;
    $('#vistaSubtitulo').textContent = VISTAS[vista].sub;
    cerrarSidebar();
    ({ dashboard: () => Dashboard.render(), pedidos: () => Pedidos.render(), contabilidad: () => Contabilidad.render(),
       diseno: () => Diseno.actualizarLienzo(), comercial: () => Comercial.renderSelector() })[vista]?.();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', `#${vista}`);
  }
  const abrirSidebar = () => { $('#sidebar').classList.add('abierto'); $('#sidebarBackdrop').classList.add('visible'); };
  const cerrarSidebar = () => { $('#sidebar').classList.remove('abierto'); $('#sidebarBackdrop').classList.remove('visible'); };

  function cambiarModo(modo) {
    const portal = modo === 'portal';
    document.body.classList.toggle('modo-portal', portal);
    $('#portal').hidden = !portal;
    $$('.modo-switch [data-modo-btn]').forEach(b => b.classList.toggle('active', b.dataset.modoBtn === modo));
    cerrarSidebar();
    window.scrollTo({ top: 0 });
    if (portal) setTimeout(() => $('#portalGuia').focus(), 50);
  }

  function initNavegacion() {
    $$('.nav-item').forEach(n => n.addEventListener('click', () => irA(n.dataset.view)));
    $$('[data-goto]').forEach(b => b.addEventListener('click', () => irA(b.dataset.goto)));
    $$('[data-modo-btn]').forEach(b => b.addEventListener('click', () => cambiarModo(b.dataset.modoBtn)));
    $('#btnMenu').addEventListener('click', abrirSidebar);
    $('#sidebarBackdrop').addEventListener('click', cerrarSidebar);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarSidebar(); });
    const inicial = location.hash.slice(1);
    irA(VISTAS[inicial] ? inicial : 'dashboard');
  }

  /* =======================================================================
6. DASHBOARD
  ======================================================================= */
  const Dashboard = {
    init() {
      $('#formDashGuia').addEventListener('submit', e => { e.preventDefault(); this.buscar(); });
      $('#alertasGarantia').addEventListener('click', e => {
        const a = e.target.closest('[data-guia]');
        if (a) { Pedidos.seleccionar(a.dataset.guia); irA('pedidos'); }
      });
      $('#dashGuiaResultado').addEventListener('click', e => {
        const b = e.target.closest('[data-guia]');
        if (b) { Pedidos.seleccionar(b.dataset.guia); irA('pedidos'); }
      });
    },
    render() {
      const pedidos = Pedidos.lista();
      const gs = pedidos.map(p => ({ p, g: garantia(p) }));
      const activos = pedidos.filter(p => p.etapa < 4);
      const entregados = gs.filter(x => x.g.entregado);
      const cumplidos = entregados.filter(x => x.g.estado === 'cumplido').length;
      const alertas = gs.filter(x => x.g.estado === 'retraso');
      const stats = Stats.get();

      $('#mActivos').textContent = activos.length;
      $('#mActivosSub').textContent = `${activos.filter(p => p.zona === 'Rural').length} hacia zona rural`;
      $('#mATiempo').textContent = cumplidos;
      $('#mATiempoSub').textContent = entregados.length ? `Cumplimiento: ${porcentaje(cumplidos, entregados.length)} de ${entregados.length} entregas` : 'Sin entregas registradas';
      $('#mAlertas').textContent = alertas.length;
      $('#mAlertasSub').textContent = alertas.length ? `${alertas.filter(x => !x.g.entregado).length} en curso · ${alertas.filter(x => x.g.entregado).length} entregados` : 'Sin retrasos';
      $('#mCopys').textContent = stats.copys;
      $('#mCopysSub').textContent = `${stats.briefs} briefs de diseño`;
      $('#navBadgePedidos').textContent = activos.length;

      const act = Store.get(KEYS.actividad, []);
      $('#actividadLista').innerHTML = act.length
        ? act.slice(0, 8).map(a => `<li data-accent="${a.accent}"><i class="bi ${a.icono}"></i><div>${escapeHtml(a.texto)}<time>${haceCuanto(a.fecha)}</time></div></li>`).join('')
        : `<li class="border-0 w-100"><div class="vacio-mini w-100"><i class="bi bi-clock-history"></i>Sin actividad todavía.</div></li>`;

      $('#alertasGarantia').innerHTML = alertas.length
        ? alertas.map(({ p, g }) => `<div class="alerta-garantia" data-guia="${p.numeroGuia}" role="button" tabindex="0">
            <b class="guia">${p.numeroGuia}</b> · ${escapeHtml(primerNombre(p.tienda.split('·')[1] || p.tienda))}<br>
            ${g.dias} día(s) de retraso · ${g.entregado ? '10% aplicado' : 'Aplicar 10% al facturar'}</div>`).join('')
        : `<div class="vacio-mini"><i class="bi bi-patch-check"></i>Todos los pedidos van dentro del plazo pactado.</div>`;
    },
    buscar() {
      const q = $('#dashGuia').value.trim();
      const box = $('#dashGuiaResultado');
      if (!q) { box.innerHTML = ''; return; }
      const res = Pedidos.filtrar(q).slice(0, 4);
      box.innerHTML = res.length ? res.map(p => {
        const g = garantia(p);
        return `<div class="d-flex justify-content-between align-items-center gap-2 py-2 border-bottom">
          <div><span class="guia fw-semibold">${p.numeroGuia}</span> · ${escapeHtml(p.tienda)}<div class="celda-sub">${escapeHtml(etapaDe(p).nombre)}</div></div>
          <div class="d-flex align-items-center gap-2">${badgeGarantia(g)}<button class="btn btn-sm btn-outline-secondary" data-guia="${p.numeroGuia}">Ver</button></div>
        </div>`;
      }).join('') : `<div class="vacio-mini"><i class="bi bi-search"></i>No hay pedidos que coincidan con "${escapeHtml(q)}".</div>`;
    }
  };

  /* =======================================================================
7. PEDIDOS Y GUÍAS
  ======================================================================= */
  const Pedidos = {
    seleccionada: null,
    lista: () => Store.get(KEYS.pedidos, []),
    guardarLista: l => Store.set(KEYS.pedidos, l),
    buscarGuia(g) { return this.lista().find(p => p.numeroGuia.toUpperCase() === String(g).trim().toUpperCase()); },
    filtrar(q) {
      const n = normalizar(q);
      return this.lista().filter(p => normalizar(`${p.numeroGuia} ${p.tienda} ${p.ruta}`).includes(n));
    },

    siguienteGuia() {
      const anio = String(new Date().getFullYear());
      const sec = Store.get(KEYS.secuencia, {});
      const maxExistente = this.lista().reduce((m, p) => {
        const r = p.numeroGuia.match(/^NX-(\d{4})-(\d+)$/);
        return r && r[1] === anio ? Math.max(m, +r[2]) : m;
      }, 0);
      const n = Math.max(sec[anio] || 0, maxExistente) + 1;
      sec[anio] = n; Store.set(KEYS.secuencia, sec);
      return `NX-${anio}-${String(n).padStart(3, '0')}`;
    },

    init() {
      $('#pedFecha').min = hoyISO();
      grupoSeleccion($('#pedZona'));
      $('#formPedido').addEventListener('input', e => e.target.classList.remove('is-invalid'));
      $('#formPedido').addEventListener('submit', e => { e.preventDefault(); this.crear(); });
      $('#pedidosBuscar').addEventListener('input', () => this.renderTabla());
      $('#btnCSVPedidos').addEventListener('click', () => this.exportarCSV());
      $('#btnSheetsPedidos').addEventListener('click', () => abrirSheets('sheetsPedidos', '#cfgSheetsPedidos'));

      $('#tablaPedidos').addEventListener('click', e => {
        const accion = e.target.closest('[data-accion]');
        const fila = e.target.closest('tr[data-guia]');
        if (!fila) return;
        const guia = fila.dataset.guia;
        if (accion?.dataset.accion === 'copiar') return copiar(guia, `Guía ${guia} copiada`);
        if (accion?.dataset.accion === 'reintentar') return this.reintentarSync(guia);
        if (accion?.dataset.accion === 'borrar') return this.borrar(guia);
        this.seleccionar(guia);
        $('#detallePedido').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      $('#detallePedido').addEventListener('click', e => {
        const step = e.target.closest('[data-etapa]');
        if (step) return this.cambiarEtapa(+step.dataset.etapa);
        if (e.target.closest('[data-copiar-guia]')) copiar(this.seleccionada, `Guía ${this.seleccionada} copiada`);
        if (e.target.closest('[data-reintentar-sync]')) return this.reintentarSync(this.seleccionada);
        if (e.target.closest('[data-ir-comercial]')) { Comercial.preparar(this.seleccionada, 'guia'); irA('comercial'); }
      });
      $('#detallePedido').addEventListener('change', e => { if (e.target.id === 'chkParo') this.marcarParo(e.target.checked); });

      this.seleccionada = this.lista()[0]?.numeroGuia || null;
    },

    async crear() {
      const form = $('#formPedido');
      if (!validarCampos(form)) return;
      const v = id => $(id).value.trim();
      if (v('#pedFecha') < hoyISO()) { toast('La fecha pactada no puede ser anterior a hoy', 'bi-calendar-x', 'violeta'); $('#pedFecha').classList.add('is-invalid'); return; }
      const zona = valorGrupo($('#pedZona'));
      if (!zona) { toast('Selecciona la zona de destino', 'bi-geo-alt', 'violeta'); return; }

      const btn = $('button[type="submit"]', form);
      if (btn.disabled) return;
      const textoBtn = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando y ejecutando automatizaciones…';

      try {
        const pedido = {
          numeroGuia: this.siguienteGuia(),
          tienda: v('#pedTienda'), email: v('#pedEmail'), whatsapp: v('#pedWhatsapp'),
          origen: v('#pedOrigen'), destino: v('#pedDestino'), ruta: `${v('#pedOrigen')} → ${v('#pedDestino')}`,
          zona,
          mercancia: v('#pedMercancia'), medidas: v('#pedMedidas'),
          valorFlete: Math.round(+v('#pedFlete')), fechaPactada: v('#pedFecha'),
          etapa: 1, retrasoParo: false, fechaRegistro: new Date().toISOString(),
          sincronizado: false, sincronizadoContable: false
        };
        const lista = this.lista(); lista.unshift(pedido); this.guardarLista(lista);
        this.seleccionada = pedido.numeroGuia;
        form.reset(); fijarGrupo($('#pedZona'), null);
        registrarActividad(`Pedido ${pedido.numeroGuia} · ${pedido.tienda}`, 'bi-truck', 'verde');

        // Actualiza vistas locales de inmediato (Pedidos, Dashboard, Comercial y Contabilidad si está desbloqueada)
        this.render();
        Comercial.renderSelector();
        if (Admin.abierto) Contabilidad.render();
        toast(`Guía ${pedido.numeroGuia} generada y registrada en contabilidad`, 'bi-qr-code');

        await this.ejecutarAutomatizaciones(pedido);
      } finally {
        btn.disabled = false;
        btn.innerHTML = textoBtn;
      }
    },

    async ejecutarAutomatizaciones(pedido) {
      const cfg = Config.get();
      const payloadPedido = {
        evento: 'nuevo_pedido',
        numeroGuia: pedido.numeroGuia,
        tienda: pedido.tienda,
        email: pedido.email,
        whatsapp: pedido.whatsapp,
        origen: pedido.origen,
        destino: pedido.destino,
        ruta: pedido.ruta,
        zona: pedido.zona,
        mercancia: pedido.mercancia,
        medidas: pedido.medidas,
        valorFlete: pedido.valorFlete,
        fechaPactada: pedido.fechaPactada,
        nombreEtapa: etapaDe(pedido).nombre,
        fechaRegistro: pedido.fechaRegistro
      };
      const payloadContable = {
        evento: 'ingreso_flete',
        id: `F-${pedido.numeroGuia}`,
        fecha: fechaISO(new Date(pedido.fechaRegistro)),
        tipo: 'Ingreso Flete',
        categoria: CAT_FLETE,
        numeroGuia: pedido.numeroGuia,
        numeroGuiaAsociada: pedido.numeroGuia,
        tienda: pedido.tienda,
        ruta: pedido.ruta,
        descripcion: `Flete ${pedido.tienda} · ${pedido.ruta}`,
        metodoPago: '—',
        monto: pedido.valorFlete,
        montoFirmado: pedido.valorFlete
      };

      const [rp, rc] = await Promise.all([
        pedido.sincronizado ? Promise.resolve({ ok: true }) : Integraciones.enviar(cfg.webhook, payloadPedido, false),
        pedido.sincronizadoContable ? Promise.resolve({ ok: true }) : Integraciones.enviar(cfg.webhookContable, payloadContable)
      ]);

      this.actualizar(pedido.numeroGuia, { sincronizado: rp.ok, sincronizadoContable: rc.ok });
      this.render();

      if (rp.ok && rc.ok) {
        toast('Automatizaciones completas: Pedidos (Sheets + Gmail) y Contabilidad sincronizados', 'bi-cloud-check', 'verde');
      } else if (rp.motivo === 'sin-webhook' && rc.motivo === 'sin-webhook') {
        toast('Guardado localmente. Configura los webhooks en Configuración para enviar a Sheets y Gmail.', 'bi-hdd', 'azul');
      } else {
        const fallos = [];
        if (!rp.ok) fallos.push(`Pedidos (${rp.motivo})`);
        if (!rc.ok) fallos.push(`Contabilidad (${rc.motivo})`);
        toast(`Guardado localmente. Pendiente: ${fallos.join(' y ')}. Usa Reintentar.`, 'bi-cloud-slash', 'violeta');
      }
    },

    async reintentarSync(guia) {
      const p = this.buscarGuia(guia);
      if (!p) return;
      toast(`Reintentando automatizaciones para ${guia}…`, 'bi-arrow-repeat', 'azul');
      await this.ejecutarAutomatizaciones(p);
    },

    payload(p) {
      const g = garantia(p);
      const { sincronizado, ejemplo, ...datos } = p;
      return { ...datos, nombreEtapa: etapaDe(p).nombre, estadoGarantia: g.texto, diasRetraso: g.dias, descuentoGarantia: g.descuento, fleteFinal: g.fleteFinal };
    },

    actualizar(guia, cambios) {
      const lista = this.lista();
      const p = lista.find(x => x.numeroGuia === guia);
      if (!p) return null;
      Object.assign(p, cambios);
      this.guardarLista(lista);
      return p;
    },

    seleccionar(guia) { this.seleccionada = guia; this.render(); },

    async cambiarEtapa(etapa) {
      const actual = this.buscarGuia(this.seleccionada);
      if (!actual || actual.etapa === etapa) return;
      const cambios = { etapa };
      if (etapa === 4) cambios.fechaEntrega = hoyISO();
      else cambios.fechaEntrega = null;
      const p = this.actualizar(actual.numeroGuia, cambios);
      const g = garantia(p);
      registrarActividad(`${p.numeroGuia}: ${etapaDe(p).nombre}`, etapaDe(p).icono, etapa === 4 ? 'verde' : 'azul');
      this.render();
      toast(`${p.numeroGuia} → ${etapaDe(p).nombre}`, etapaDe(p).icono, etapa === 4 ? 'verde' : 'azul');
      if (etapa === 4 && g.estado === 'retraso') toast(`Entregado con ${g.dias} día(s) de retraso: se aplicó 10% (${COP(g.descuento)})`, 'bi-patch-exclamation-fill', 'violeta');

      const cfg = Config.get();
      if (etapa === 4 && g.estado === 'retraso' && !p.descuentoReportado) {
        const r = await Integraciones.enviar(cfg.webhookContable, { evento: 'descuento_garantia', fecha: hoyISO(), tipo: 'Descuento Garantía', categoria: CAT_DESCUENTO, numeroGuia: p.numeroGuia, descripcion: `${g.dias} día(s) de retraso`, monto: -g.descuento });
        if (r.ok) this.actualizar(p.numeroGuia, { descuentoReportado: true });
      }
    },

    marcarParo(valor) {
      const p = this.actualizar(this.seleccionada, { retrasoParo: valor });
      registrarActividad(`${p.numeroGuia}: ${valor ? 'retraso marcado por paro' : 'se quitó la marca de paro'}`, 'bi-cone-striped', 'violeta');
      this.render();
      toast(valor ? 'Marcado como retraso por paro: no aplica el 10%' : 'Se vuelve a aplicar la garantía del 10%', 'bi-cone-striped', 'violeta');
    },

    async borrar(guia) {
      const ok = await confirmar('Eliminar pedido', `¿Eliminar la guía <b>${escapeHtml(guia)}</b> de la base local?<br><small class="text-secundario">Su ingreso de flete también sale del libro contable. No se borra de Google Sheets.</small>`, 'Eliminar');
      if (!ok) return;
      this.guardarLista(this.lista().filter(p => p.numeroGuia !== guia));
      if (this.seleccionada === guia) this.seleccionada = this.lista()[0]?.numeroGuia || null;
      registrarActividad(`Pedido ${guia} eliminado`, 'bi-trash3', 'violeta');
      this.render();
      toast(`Guía ${guia} eliminada`, 'bi-trash3', 'violeta');
    },

    render() { this.renderDetalle(); this.renderTabla(); Dashboard.render(); },

    renderDetalle() {
      const box = $('#detallePedido');
      const p = this.buscarGuia(this.seleccionada);
      if (!p) { box.innerHTML = `<div class="vacio-mini"><i class="bi bi-truck"></i>Registra un pedido o selecciónalo en la tabla para ver su seguimiento.</div>`; return; }
      const g = garantia(p);
      const pasos = ETAPAS.map(e => {
        const estado = e.id < p.etapa || (e.id === 4 && p.etapa === 4) ? 'completo' : e.id === p.etapa ? 'actual' : '';
        return `<button type="button" class="step ${estado}" data-etapa="${e.id}" aria-label="Cambiar a ${e.nombre}">
          <span class="step-circulo"><i class="bi ${e.icono}"></i></span><span class="step-label">${e.nombre}</span></button>`;
      }).join('');

      box.innerHTML = `
        <div class="detalle-header">
          <div>
            <span class="guia-chip"><span class="guia">${p.numeroGuia}</span><button type="button" data-copiar-guia title="Copiar guía"><i class="bi bi-clipboard m-0"></i></button></span>
            <h3 class="detalle-tienda">${escapeHtml(p.tienda)}</h3>
            <div class="celda-sub">${escapeHtml(p.email)}${p.whatsapp ? ` · ${escapeHtml(p.whatsapp)}` : ''}</div>
          </div>
          <div class="text-end">
            ${badgeGarantia(g, true)}
            <div class="celda-sub mt-1">Pactada: ${fechaLarga(p.fechaPactada)}${p.fechaEntrega ? ` · Entregado: ${fechaCorta(p.fechaEntrega)}` : ''}</div>
          </div>
        </div>
        <div class="detalle-datos">
          <div><small>Ruta</small><b>${escapeHtml(p.ruta)}</b><span class="badge-zona ${p.zona === 'Rural' ? 'rural' : ''}">${p.zona}</span></div>
          <div><small>Mercancía</small><b>${escapeHtml(p.mercancia)}</b></div>
          <div><small>Medidas / peso</small><b>${escapeHtml(p.medidas)}</b></div>
          <div><small>Flete</small><b class="cifra">${COP(g.fleteFinal)}</b></div>
        </div>
        ${g.estado === 'retraso' ? `
        <div class="calculo-garantia">
          <div><b>Garantía de cumplimiento</b><div class="celda-sub">${g.dias} día(s) de retraso · ${g.entregado ? 'descuento definitivo' : 'descuento proyectado mientras siga en curso'}</div></div>
          <div class="text-end"><span class="tachado cifra">${COP(g.flete)}</span> → <span class="final">${COP(g.fleteFinal)}</span><div class="celda-sub">Descuento: ${COP(g.descuento)}</div></div>
        </div>` : ''}
        <div class="stepper">${pasos}</div>
        <p class="stepper-ayuda">Haz clic en una etapa para actualizar el seguimiento.</p>
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2 border-top">
          ${g.dias > 0 ? `<div class="form-check form-switch m-0">
            <input class="form-check-input" type="checkbox" id="chkParo" ${p.retrasoParo ? 'checked' : ''}>
            <label class="form-check-label small" for="chkParo">El retraso se debe a un paro (no aplica el 10%)</label></div>` : '<span class="celda-sub"><i class="bi bi-info-circle"></i> El 10% se activa solo si la entrega pasa de la fecha pactada.</span>'}
          <div class="d-flex flex-wrap gap-2">
            ${(!p.sincronizado || !p.sincronizadoContable) ? `<button class="btn btn-sm btn-outline-warning" data-reintentar-sync><i class="bi bi-cloud-arrow-up"></i> Sincronizar (${!p.sincronizado && !p.sincronizadoContable ? 'Pedidos y Contab.' : !p.sincronizado ? 'Pedidos' : 'Contabilidad'})</button>` : '<span class="celda-sub align-self-center"><i class="bi bi-cloud-check-fill text-success"></i> Automatizaciones al día</span>'}
            <button class="btn btn-sm btn-violeta" data-ir-comercial><i class="bi bi-whatsapp"></i> Enviar guía al cliente</button>
          </div>
        </div>`;
    },

    renderTabla() {
      const todos = this.lista();
      const q = $('#pedidosBuscar').value.trim();
      const lista = q ? this.filtrar(q) : todos;
      $('#pedidosResumen').textContent = `${todos.length} pedidos · ${todos.filter(p => p.etapa < 4).length} activos${q ? ` · ${lista.length} coinciden` : ''}`;
      $('#tablaPedidos').innerHTML = lista.length ? lista.map(p => {
        const g = garantia(p); const e = etapaDe(p);
        return `<tr class="clicable ${p.numeroGuia === this.seleccionada ? 'seleccionado' : ''}" data-guia="${p.numeroGuia}">
          <td><span class="guia fw-semibold">${p.numeroGuia}</span><div class="celda-sub">${fechaCorta(fechaISO(new Date(p.fechaRegistro)))}</div></td>
          <td><div class="celda-tienda">${escapeHtml(p.tienda)}</div><div class="celda-sub">${escapeHtml(p.mercancia)}</div></td>
          <td>${escapeHtml(p.ruta)}<span class="badge-zona ${p.zona === 'Rural' ? 'rural' : ''}">${p.zona}</span></td>
          <td><span class="etapa-mini"><i class="bi ${e.icono}"></i>${e.corto}</span><div class="celda-sub">Pactada ${fechaCorta(p.fechaPactada)}</div></td>
          <td>${badgeGarantia(g)}</td>
          <td class="text-end cifra">${g.descuento ? `<span class="precio-tachado">${COP(g.flete)}</span><span class="precio-final-violeta">${COP(g.fleteFinal)}</span>` : COP(g.flete)}</td>
          <td class="text-end text-nowrap">
            ${p.sincronizado && p.sincronizadoContable
              ? '<i class="bi bi-cloud-check-fill sync-icono ok me-1" title="Pedidos y Contabilidad sincronizados"></i>'
              : '<button class="btn btn-mini btn-outline-warning me-1" data-accion="reintentar" title="Reintentar automatizaciones (Sheets / Gmail / Contabilidad)"><i class="bi bi-cloud-arrow-up"></i></button>'}
            <button class="btn btn-mini btn-outline-secondary" data-accion="copiar" title="Copiar guía"><i class="bi bi-clipboard"></i></button>
            <button class="btn btn-mini btn-outline-danger" data-accion="borrar" title="Eliminar"><i class="bi bi-trash3"></i></button>
          </td></tr>`;
      }).join('') : `<tr><td colspan="7"><div class="vacio-mini"><i class="bi bi-inbox"></i>${q ? 'Ningún pedido coincide con la búsqueda.' : 'Aún no hay pedidos.'}</div></td></tr>`;
    },

    exportarCSV() {
      const lista = this.lista();
      if (!lista.length) return toast('No hay pedidos para exportar', 'bi-inbox', 'azul');
      const filas = lista.map(p => ({ ...this.payload(p), fechaRegistro: fechaISO(new Date(p.fechaRegistro)), fechaEntrega: p.fechaEntrega || '', retrasoParo: p.retrasoParo ? 'Sí' : 'No' }));
      descargarCSV(`CRM_Pedidos_Nexcargo_${hoyISO()}.csv`, [
        { clave: 'numeroGuia', titulo: 'Guía' }, { clave: 'fechaRegistro', titulo: 'Fecha registro' }, { clave: 'tienda', titulo: 'Tienda' },
        { clave: 'email', titulo: 'Correo' }, { clave: 'whatsapp', titulo: 'WhatsApp' }, { clave: 'origen', titulo: 'Origen' },
        { clave: 'destino', titulo: 'Destino' }, { clave: 'zona', titulo: 'Zona' }, { clave: 'mercancia', titulo: 'Mercancía' },
        { clave: 'medidas', titulo: 'Medidas' }, { clave: 'valorFlete', titulo: 'Flete (COP)' }, { clave: 'fechaPactada', titulo: 'Fecha pactada' },
        { clave: 'fechaEntrega', titulo: 'Fecha entrega' }, { clave: 'nombreEtapa', titulo: 'Etapa' }, { clave: 'estadoGarantia', titulo: 'Garantía' },
        { clave: 'diasRetraso', titulo: 'Días de retraso' }, { clave: 'retrasoParo', titulo: 'Retraso por paro' },
        { clave: 'descuentoGarantia', titulo: 'Descuento 10% (COP)' }, { clave: 'fleteFinal', titulo: 'Flete final (COP)' }
      ], filas);
      toast(`CSV descargado (${lista.length} pedidos)`, 'bi-filetype-csv', 'azul');
    }
  };

  function abrirSheets(claveConfig, campo) {
    const url = Config.get()[claveConfig];
    if (!url) { toast('Configura primero el enlace de Google Sheets', 'bi-gear', 'violeta'); irA('config'); $(campo).focus(); return; }
    window.open(url, '_blank', 'noopener');
  }

  /* =======================================================================
8. ADMIN — BLOQUEO DEL MÓDULO CONTABLE
  ======================================================================= */
  const Admin = {
    intentos: 0, esperaHasta: 0, temporizador: null,
    get abierto() { return sessionStorage.getItem(KEYS.sesionAdmin) === '1'; },

    async hash(texto) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return 'sha256:' + [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
      } catch {
        let h = 5381; for (const c of texto) h = ((h << 5) + h + c.codePointAt(0)) >>> 0;
        return 'djb2:' + h.toString(16);
      }
    },
    async verificar(pw) {
      const guardado = Config.get().adminHash;
      return !!guardado && (await this.hash(pw)) === guardado;
    },

    init() {
      $('#formLock').addEventListener('submit', e => { e.preventDefault(); this.intentar(); });
      $('#btnBloquear').addEventListener('click', () => this.bloquear('Sesión contable bloqueada'));
      ['click', 'keydown', 'mousemove', 'touchstart'].forEach(ev => document.addEventListener(ev, () => this.reiniciarTemporizador(), { passive: true }));
      if (this.abierto) this.reiniciarTemporizador();
      this.actualizarBloqueo();
      this.actualizarIcono();
    },

    actualizarBloqueo() {
      const passwordConfigurada = !!Config.get().adminHash;
      $('#contaLock p').textContent = passwordConfigurada
        ? 'Ingresa la contraseña de administrador para ver ingresos, gastos y utilidades.'
        : 'Configura una contraseña en Configuración para habilitar el módulo contable.';
      $('#formLock button[type="submit"]').disabled = !passwordConfigurada;
    },

    async intentar() {
      const input = $('#lockPassword');
      const error = $('#lockError');
      if (!Config.get().adminHash) { error.textContent = 'Configura una contraseña en Configuración.'; return; }
      if (Date.now() < this.esperaHasta) { error.textContent = `Demasiados intentos. Espera ${Math.ceil((this.esperaHasta - Date.now()) / 1000)} s.`; return; }
      if (await this.verificar(input.value)) {
        this.intentos = 0; input.value = ''; error.textContent = '';
        sessionStorage.setItem(KEYS.sesionAdmin, '1');
        this.reiniciarTemporizador(); this.actualizarIcono();
        registrarActividad('Sesión contable desbloqueada', 'bi-unlock', 'azul');
        Contabilidad.render();
        toast('Módulo contable desbloqueado', 'bi-unlock-fill', 'azul');
      } else {
        this.intentos++;
        if (this.intentos >= 5) { this.esperaHasta = Date.now() + 30000; this.intentos = 0; error.textContent = 'Demasiados intentos. Espera 30 segundos.'; }
        else error.textContent = `Contraseña incorrecta (${this.intentos}/5).`;
        const card = $('.lock-card'); card.classList.remove('sacudir'); void card.offsetWidth; card.classList.add('sacudir');
        input.select();
      }
    },

    bloquear(mensaje) {
      if (!this.abierto) return;
      sessionStorage.removeItem(KEYS.sesionAdmin);
      clearTimeout(this.temporizador);
      Contabilidad.limpiar();
      this.actualizarIcono();
      if (mensaje) toast(mensaje, 'bi-lock-fill', 'profundo');
    },

    reiniciarTemporizador() {
      if (!this.abierto) return;
      clearTimeout(this.temporizador);
      this.temporizador = setTimeout(() => this.bloquear(`Bloqueo automático tras ${MINUTOS_AUTOBLOQUEO} min sin actividad`), MINUTOS_AUTOBLOQUEO * 60000);
    },

    actualizarIcono() {
      const i = $('#navLock');
      i.className = `bi ${this.abierto ? 'bi-unlock-fill abierto' : 'bi-lock-fill'} nav-lock`;
    }
  };

  /* =======================================================================
9. CONTABILIDAD
  ======================================================================= */
  const Contabilidad = {
    movimientos: () => Store.get(KEYS.contabilidad, []),
    guardarMovimientos: l => Store.set(KEYS.contabilidad, l),

    init() {
      grupoSeleccion($('#movTipo'), () => this.llenarCategoriasForm());
      $('#formMovimiento').addEventListener('input', e => e.target.classList.remove('is-invalid'));
      $('#formMovimiento').addEventListener('submit', e => { e.preventDefault(); this.guardar(); });
      $('#contaPeriodo').addEventListener('change', () => this.render());
      $('#contaCategoria').addEventListener('change', () => this.renderLibro(this.libroPeriodo()));
      $('#btnCSVConta').addEventListener('click', () => this.exportarCSV());
      $('#btnSheetsConta').addEventListener('click', () => abrirSheets('sheetsContable', '#cfgSheetsConta'));
      $('#tablaLibro').addEventListener('click', e => {
        const b = e.target.closest('[data-mov]');
        if (!b) return;
        if (b.dataset.accion === 'borrar') this.borrar(b.dataset.mov);
        if (b.dataset.accion === 'reintentar') this.reintentar(b.dataset.mov);
      });
    },

    libro() {
      const auto = Pedidos.lista().flatMap(p => {
        const g = garantia(p);
        const asientos = [{
          id: `F-${p.numeroGuia}`, fecha: fechaISO(new Date(p.fechaRegistro)), tipo: 'Ingreso Flete', categoria: CAT_FLETE,
          numeroGuiaAsociada: p.numeroGuia, descripcion: `Flete ${p.tienda} · ${p.ruta}`, metodoPago: '—', monto: g.flete, auto: true
        }];
        if (g.descuento) asientos.push({
          id: `D-${p.numeroGuia}`, fecha: p.fechaEntrega || hoyISO(), tipo: 'Descuento Garantía', categoria: CAT_DESCUENTO,
          numeroGuiaAsociada: p.numeroGuia, descripcion: `${g.dias} día(s) de retraso · ${p.tienda}`, metodoPago: '—',
          monto: -g.descuento, auto: true, proyectado: !g.entregado
        });
        return asientos;
      });
      const manuales = this.movimientos().map(m => ({ ...m, monto: m.tipo === 'Egreso Operativo' ? -Math.abs(m.monto) : Math.abs(m.monto), auto: false }));
      return [...auto, ...manuales].sort((a, b) => b.fecha.localeCompare(a.fecha));
    },
    libroPeriodo() {
      const per = $('#contaPeriodo').value;
      const l = this.libro();
      return per && per !== 'todo' ? l.filter(a => a.fecha.startsWith(per)) : l;
    },

    render() {
      const abierto = Admin.abierto;
      $('#contaLock').hidden = abierto;
      $('#contaContenido').hidden = !abierto;
      if (!abierto) { if (vistaActual === 'contabilidad') setTimeout(() => $('#lockPassword').focus(), 50); return; }
      this.llenarPeriodos(); this.llenarCategoriasFiltro(); this.llenarCategoriasForm(); this.llenarGuias();
      if (!$('#movFecha').value) $('#movFecha').value = hoyISO();
      const libro = this.libroPeriodo();
      this.renderKPIs(libro); this.renderLibro(libro); this.renderRentabilidad(libro); this.renderGastosCategoria(libro);
    },

    limpiar() {
      ['#tablaLibro', '#tablaRentabilidad', '#gastosCategoria', '#libroResumen'].forEach(s => { $(s).innerHTML = ''; });
      ['#kIngresos', '#kDescuentos', '#kGastos', '#kUtilidad'].forEach(s => { $(s).textContent = '$0'; $(s + 'Sub').textContent = ''; });
      $('#formMovimiento').reset();
      this.render();
    },

    llenarPeriodos() {
      const sel = $('#contaPeriodo'); const actual = sel.value || 'todo';
      const meses = [...new Set(this.libro().map(a => a.fecha.slice(0, 7)))].sort().reverse();
      sel.innerHTML = `<option value="todo">Todo el historial</option>` + meses.map(m => `<option value="${m}">${nombreMes(m)}</option>`).join('');
      sel.value = [...sel.options].some(o => o.value === actual) ? actual : 'todo';
    },
    llenarCategoriasFiltro() {
      const sel = $('#contaCategoria'); const actual = sel.value;
      const cats = [CAT_FLETE, CAT_DESCUENTO, ...CATEGORIAS['Egreso Operativo'], ...CATEGORIAS['Ingreso Adicional']];
      sel.innerHTML = `<option value="">Todas las categorías</option>` + cats.map(c => `<option>${c}</option>`).join('');
      sel.value = actual;
    },
    llenarCategoriasForm() {
      const tipo = valorGrupo($('#movTipo'));
      $('#movCategoria').innerHTML = CATEGORIAS[tipo].map(c => `<option>${c}</option>`).join('');
    },
    llenarGuias() {
      const sel = $('#movGuia'); const actual = sel.value;
      sel.innerHTML = `<option value="">Sin guía (gasto general)</option>` + Pedidos.lista().map(p => `<option value="${p.numeroGuia}">${p.numeroGuia} · ${escapeHtml(p.ruta)}</option>`).join('');
      sel.value = actual;
    },

    renderKPIs(libro) {
      const suma = f => libro.filter(f).reduce((s, a) => s + a.monto, 0);
      const fletes = libro.filter(a => a.tipo === 'Ingreso Flete');
      const desc = libro.filter(a => a.tipo === 'Descuento Garantía');
      const adic = libro.filter(a => a.tipo === 'Ingreso Adicional');
      const egr = libro.filter(a => a.tipo === 'Egreso Operativo');
      const bruto = suma(a => a.tipo === 'Ingreso Flete');
      const descuentos = -suma(a => a.tipo === 'Descuento Garantía');
      const adicionales = suma(a => a.tipo === 'Ingreso Adicional');
      const gastos = -suma(a => a.tipo === 'Egreso Operativo');
      const netos = bruto - descuentos + adicionales;
      const utilidad = netos - gastos;

      $('#kIngresos').textContent = COP(bruto);
      $('#kIngresosSub').textContent = `${fletes.length} fletes${adicionales ? ` · + ${COP(adicionales)} adicionales` : ''}`;
      $('#kDescuentos').textContent = COP(-descuentos);
      const proy = desc.filter(a => a.proyectado).length;
      $('#kDescuentosSub').textContent = desc.length ? `${desc.length} pedido(s) con retraso${proy ? ` · ${proy} proyectado(s)` : ''}` : 'Sin retrasos en el periodo';
      $('#kGastos').textContent = COP(-gastos);
      $('#kGastosSub').textContent = `${egr.length} egresos registrados`;
      $('#kUtilidad').textContent = COP(utilidad);
      $('#kUtilidad').classList.toggle('negativo', utilidad < 0);
      $('#kUtilidadSub').textContent = `Margen ${porcentaje(utilidad, netos)} sobre ingresos netos de ${COP(netos)}`;
    },

    renderLibro(libro) {
      const cat = $('#contaCategoria').value;
      const filas = cat ? libro.filter(a => a.categoria === cat) : libro;
      const total = filas.reduce((s, a) => s + a.monto, 0);
      $('#libroResumen').textContent = `${filas.length} asientos · saldo ${COP(total)}`;
      $('#tablaLibro').innerHTML = filas.length ? filas.map(a => {
        const clase = a.tipo === 'Descuento Garantía' ? 'monto-desc' : a.monto >= 0 ? 'monto-pos' : 'monto-neg';
        const acciones = a.auto ? '' : `${a.sincronizado ? '<i class="bi bi-cloud-check-fill sync-icono ok me-1" title="En Google Sheets"></i>'
          : `<button class="btn btn-mini btn-outline-warning" data-mov="${a.id}" data-accion="reintentar" title="Enviar a Google Sheets"><i class="bi bi-cloud-arrow-up"></i></button>`}
          <button class="btn btn-mini btn-outline-danger" data-mov="${a.id}" data-accion="borrar" title="Eliminar"><i class="bi bi-trash3"></i></button>`;
        return `<tr>
          <td class="text-nowrap">${fechaCorta(a.fecha)}</td>
          <td><div>${escapeHtml(a.descripcion)}${a.auto ? `<span class="tag-auto ${a.proyectado ? 'tag-proyectado' : ''}">${a.proyectado ? 'Proyectado' : 'Auto'}</span>` : ''}</div><div class="celda-sub">${escapeHtml(a.tipo)}${a.metodoPago && a.metodoPago !== '—' ? ` · ${escapeHtml(a.metodoPago)}` : ''}</div></td>
          <td class="small">${escapeHtml(a.categoria)}</td>
          <td>${a.numeroGuiaAsociada ? `<span class="guia small">${a.numeroGuiaAsociada}</span>` : '<span class="celda-sub">General</span>'}</td>
          <td class="text-end cifra ${clase}">${COP(a.monto)}</td>
          <td class="text-end text-nowrap">${acciones}</td></tr>`;
      }).join('') : `<tr><td colspan="6"><div class="vacio-mini"><i class="bi bi-journal"></i>No hay asientos para este filtro.</div></td></tr>`;
    },

    renderRentabilidad(libro) {
      const porGuia = {};
      libro.forEach(a => {
        const k = a.numeroGuiaAsociada || '__general';
        porGuia[k] = porGuia[k] || { neto: 0, gastos: 0, adicionales: 0 };
        if (a.tipo === 'Ingreso Flete' || a.tipo === 'Descuento Garantía') porGuia[k].neto += a.monto;
        else if (a.tipo === 'Egreso Operativo') porGuia[k].gastos += -a.monto;
        else porGuia[k].adicionales += a.monto;
      });
      const pedidos = Pedidos.lista();
      const filas = Object.entries(porGuia).filter(([k]) => k !== '__general').map(([guia, v]) => {
        const p = pedidos.find(x => x.numeroGuia === guia);
        const ingresos = v.neto + v.adicionales;
        const utilidad = ingresos - v.gastos;
        return { guia, ruta: p ? p.ruta : 'Pedido eliminado', ingresos, gastos: v.gastos, utilidad, margen: porcentaje(utilidad, ingresos) };
      }).sort((a, b) => b.utilidad - a.utilidad);
      const general = porGuia.__general;
      const totalUtil = filas.reduce((s, f) => s + f.utilidad, 0) + (general ? general.adicionales - general.gastos : 0);

      $('#tablaRentabilidad').innerHTML = (filas.length ? filas.map(f => `<tr>
          <td><span class="guia fw-semibold">${f.guia}</span></td><td class="small">${escapeHtml(f.ruta)}</td>
          <td class="text-end cifra">${COP(f.ingresos)}</td><td class="text-end cifra">${COP(-f.gastos)}</td>
          <td class="text-end cifra ${f.utilidad >= 0 ? 'monto-pos' : 'text-danger'}">${COP(f.utilidad)}</td><td class="text-end cifra">${f.margen}</td></tr>`).join('')
        : `<tr><td colspan="6"><div class="vacio-mini"><i class="bi bi-signpost-2"></i>Sin pedidos en el periodo.</div></td></tr>`)
        + (general ? `<tr><td colspan="2"><span class="celda-sub">Gastos e ingresos generales (sin guía)</span></td>
          <td class="text-end cifra">${COP(general.adicionales)}</td><td class="text-end cifra">${COP(-general.gastos)}</td>
          <td class="text-end cifra">${COP(general.adicionales - general.gastos)}</td><td></td></tr>` : '')
        + `<tr class="table-light"><td colspan="4"><b>Utilidad neta del periodo</b></td><td class="text-end cifra ${totalUtil >= 0 ? 'monto-pos' : 'text-danger'}"><b>${COP(totalUtil)}</b></td><td></td></tr>`;
    },

    renderGastosCategoria(libro) {
      const cats = {};
      libro.filter(a => a.tipo === 'Egreso Operativo').forEach(a => { cats[a.categoria] = (cats[a.categoria] || 0) - a.monto; });
      const total = Object.values(cats).reduce((s, v) => s + v, 0);
      $('#gastosCategoria').innerHTML = total ? Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([c, v]) => `
        <div class="barra-cat"><div class="barra-cat-top"><span>${escapeHtml(c)}</span><b>${COP(v)}</b></div>
        <div class="barra-cat-fondo"><div class="barra-cat-relleno" style="width:${(v / total * 100).toFixed(1)}%"></div></div></div>`).join('')
        : `<div class="vacio-mini"><i class="bi bi-pie-chart"></i>Sin egresos en el periodo.</div>`;
    },

    async guardar() {
      if (!Admin.abierto) return Contabilidad.render();
      const form = $('#formMovimiento');
      if (!validarCampos(form)) return;
      const mov = {
        id: `MOV-${Date.now()}`, fecha: $('#movFecha').value, tipo: valorGrupo($('#movTipo')),
        categoria: $('#movCategoria').value, numeroGuiaAsociada: $('#movGuia').value,
        descripcion: $('#movDescripcion').value.trim(), metodoPago: $('#movMetodo').value,
        monto: Math.round(Math.abs(+$('#movMonto').value)), fechaRegistro: new Date().toISOString(), sincronizado: false
      };
      const lista = this.movimientos(); lista.unshift(mov); this.guardarMovimientos(lista);
      form.reset(); $('#movFecha').value = hoyISO(); this.llenarCategoriasForm();
      registrarActividad(`Movimiento contable registrado (${mov.categoria})`, 'bi-journal-plus', 'azul');
      this.render();
      const r = await Integraciones.enviar(Config.get().webhookContable, { evento: 'movimiento_contable', ...this.payloadMov(mov) });
      if (r.ok) { this.marcarSync(mov.id); toast('Movimiento guardado y enviado a Contabilidad_Nexcargo', 'bi-cloud-check', 'azul'); }
      else toast(r.motivo === 'sin-webhook' ? 'Movimiento guardado localmente. Configura el webhook contable.' : `Guardado localmente. n8n no respondió (${r.motivo}).`, 'bi-hdd', 'azul');
    },
    payloadMov(m) { const { sincronizado, ejemplo, ...d } = m; return { ...d, montoFirmado: m.tipo === 'Egreso Operativo' ? -m.monto : m.monto }; },
    marcarSync(id) {
      const l = this.movimientos(); const m = l.find(x => x.id === id);
      if (m) { m.sincronizado = true; this.guardarMovimientos(l); }
      if (Admin.abierto) this.renderLibro(this.libroPeriodo());
    },
    async reintentar(id) {
      const m = this.movimientos().find(x => x.id === id);
      if (!m) return;
      const r = await Integraciones.enviar(Config.get().webhookContable, { evento: 'movimiento_contable', ...this.payloadMov(m) });
      if (r.ok) { this.marcarSync(id); toast('Movimiento enviado a Google Sheets', 'bi-cloud-check', 'azul'); }
      else toast(`No se pudo enviar (${r.motivo})`, 'bi-cloud-slash', 'violeta');
    },
    async borrar(id) {
      const m = this.movimientos().find(x => x.id === id);
      if (!m) return;
      const ok = await confirmar('Eliminar movimiento', `¿Eliminar <b>${escapeHtml(m.descripcion)}</b> por <b>${COP(m.monto)}</b>?<br><small class="text-secundario">No se borra de Google Sheets.</small>`, 'Eliminar');
      if (!ok || !Admin.abierto) return;
      this.guardarMovimientos(this.movimientos().filter(x => x.id !== id));
      registrarActividad('Movimiento contable eliminado', 'bi-trash3', 'violeta');
      this.render();
      toast('Movimiento eliminado', 'bi-trash3', 'violeta');
    },
    exportarCSV() {
      if (!Admin.abierto) return;
      const libro = this.libroPeriodo();
      if (!libro.length) return toast('No hay asientos para exportar', 'bi-inbox', 'azul');
      descargarCSV(`Contabilidad_Nexcargo_${$('#contaPeriodo').value}_${hoyISO()}.csv`, [
        { clave: 'fecha', titulo: 'Fecha' }, { clave: 'tipo', titulo: 'Tipo' }, { clave: 'categoria', titulo: 'Categoría' },
        { clave: 'numeroGuiaAsociada', titulo: 'Guía' }, { clave: 'descripcion', titulo: 'Descripción' }, { clave: 'metodoPago', titulo: 'Método de pago' },
        { clave: 'monto', titulo: 'Monto (COP)' }, { clave: 'origen', titulo: 'Origen' }
      ], libro.map(a => ({ ...a, origen: a.auto ? (a.proyectado ? 'Automático (proyectado)' : 'Automático') : 'Manual' })));
      toast(`Libro contable descargado (${libro.length} asientos)`, 'bi-filetype-csv', 'azul');
    }
  };

  /* =======================================================================
10. ASISTENTE 01 — COPY
  ======================================================================= */
  const Copy = {
    ultimo: [],
    init() {
      grupoSeleccion($('#copyCanal')); grupoSeleccion($('#copyFormula')); grupoSeleccion($('#copyAngulo'));
      $('#copyDetalles').addEventListener('input', e => {
        const p = detectarProhibidas(e.target.value); const a = $('#copyAvisoDetalles');
        a.classList.toggle('d-none', !p.length);
        a.innerHTML = p.length ? `<i class="bi bi-exclamation-octagon"></i> Frase prohibida por la marca: <b>${p.map(escapeHtml).join(', ')}</b>` : '';
      });
      $('#btnGenerarCopy').addEventListener('click', () => this.generar());
      $('#copyResultados').addEventListener('click', e => this.accion(e));
      $('#bibliotecaLista').addEventListener('click', e => this.accionBiblioteca(e));
      this.renderBiblioteca();
    },

    construir(canal, formula, key, detalles) {
      const a = ANGULOS[key];
      const hook = formula === 'PAS' ? a.hook : a.atencion;
      const cuerpo = formula === 'PAS' ? [a.problema, a.agitacion, a.solucion] : [a.interes, a.deseo];
      const det = detalles ? `📌 ${detalles}` : '';
      const partes = {
        instagram: () => [`**${hook}**`, ...cuerpo, det, `**👉 ${CTA.instagram}**`, a.hashtags],
        reel: () => {
          const t = cuerpo.length === 3 ? ['3–7 s', '7–12 s', '12–17 s'] : ['3–8 s', '8–14 s'];
          return [`🎬 GUION REEL / TIKTOK · ${formula} · 15–20 s`, `[0–3 s] TEXTO EN PANTALLA: **${hook}**`, ...cuerpo.map((c, i) => `[${t[i]}] ${c}`), det,
            '[Cierre] Plano del camión turbo + sello "10% de descuento por retraso" + logo.', `**CTA en pantalla: ${CTA.reel}**`, `📝 CAPTION: ${hook} ${a.captionCorto} ${a.hashtags}`];
        },
        facebook: () => [`TEXTO PRINCIPAL:\n**${hook}**`, ...cuerpo, det, `**👉 ${CTA.facebook}**`, `TITULAR: ${a.titularAd}\nDESCRIPCIÓN: ${a.descAd}\nBOTÓN: Enviar mensaje`],
        correo: () => [`ASUNTO: ${a.asunto}\nPREHEADER: ${a.preheader}`, 'Hola, [Nombre]:', `**${hook}**`, ...cuerpo, det, `**${CTA.correo}**`, 'Un saludo,\n[Tu nombre]\nEquipo comercial Nexcargo'],
        whatsapp: () => ['Hola, [Nombre] 👋', `**${hook}**`, cuerpo[cuerpo.length - 1], a.vinetas.map(v => `• ${v}`).join('\n'), det, `**${CTA.whatsapp}**`]
      };
      return { angulo: key, gancho: hook, texto: partes[canal]().filter(Boolean).join('\n\n') };
    },

    async generar() {
      const canal = valorGrupo($('#copyCanal')), formula = valorGrupo($('#copyFormula')), angulo = valorGrupo($('#copyAngulo'));
      const detalles = $('#copyDetalles').value.trim();
      if (detectarProhibidas(detalles).length) return toast('Quita las frases prohibidas de los detalles', 'bi-exclamation-octagon', 'violeta');
      const btn = $('#btnGenerarCopy'); btn.disabled = true;
      $('#copyResultados').innerHTML = `<div class="cargando"><div class="spinner-border mb-2"></div><p>Redactando 3 variaciones…</p></div>`;
      let vars, fuente = 'Plantillas oficiales';
      if (Config.iaActiva()) {
        try { vars = await IA.generarCopy({ canal, formula, angulo, detalles }); fuente = `Gemini (${Config.get().geminiModelo})`; }
        catch (err) { console.warn('[Nexcargo IA]', err); toast('La IA no respondió. Usé las plantillas oficiales.', 'bi-wifi-off', 'violeta'); }
      }
      if (!vars) vars = ['dolor', 'cobertura', 'garantia'].map(k => this.construir(canal, formula, k, detalles));
      this.ultimo = vars.map(v => ({ ...v, canal, formula, recomendado: v.angulo === angulo }));
      this.render(fuente);
      Stats.sumar('copys', 3);
      registrarActividad(`3 copys para ${CANALES[canal].nombre} (${formula})`, 'bi-pen', 'azul');
      btn.disabled = false;
    },

    render(fuente) {
      $('#copyResultados').innerHTML = `<p class="small text-secundario mb-2"><i class="bi bi-info-circle"></i> Fuente: <b>${escapeHtml(fuente)}</b> · Las negritas se adaptan al canal al copiar.</p>` +
        this.ultimo.map((v, i) => {
          const a = ANGULOS[v.angulo]; const pr = detectarProhibidas(v.texto);
          return `<article class="variacion" data-accent="${a.accent}">
            <header class="variacion-header"><h4><i class="bi ${a.icono}"></i> ${a.nombre}</h4>${v.recomendado ? '<span class="badge-recomendada">Ángulo principal</span>' : ''}</header>
            <div class="variacion-cuerpo">${renderMarcado(v.texto)}</div>
            ${pr.length ? `<div class="aviso-prohibidas"><i class="bi bi-exclamation-octagon"></i> Contiene frases prohibidas: <b>${pr.map(escapeHtml).join(', ')}</b>.</div>` : ''}
            <footer class="variacion-acciones">
              <button class="btn btn-outline-secondary" data-act="copiar" data-i="${i}"><i class="bi bi-clipboard"></i> Copiar texto</button>
              <button class="btn btn-azul" data-act="guardar" data-i="${i}"><i class="bi bi-bookmark-plus"></i> Guardar en biblioteca</button>
              <button class="btn btn-verde" data-act="diseno" data-i="${i}"><i class="bi bi-send"></i> Enviar a Diseño Gráfico</button>
            </footer></article>`;
        }).join('');
    },

    accion(e) {
      const b = e.target.closest('button[data-act]'); if (!b) return;
      const v = this.ultimo[+b.dataset.i]; if (!v) return;
      if (b.dataset.act === 'copiar') copiar(paraCanal(v.texto, v.canal));
      if (b.dataset.act === 'guardar') this.guardar(v);
      if (b.dataset.act === 'diseno') { Diseno.recibirCopy(v); irA('diseno'); toast('Copy enviado al Estudio de Diseño', 'bi-send-check'); }
    },
    guardar(v) {
      const l = Store.get(KEYS.biblioteca, []);
      if (l.some(x => x.texto === v.texto)) return toast('Este copy ya está en la biblioteca', 'bi-bookmark-check', 'azul');
      l.unshift({ id: Date.now(), angulo: v.angulo, canal: v.canal, formula: v.formula, gancho: v.gancho, texto: v.texto, fecha: new Date().toISOString() });
      Store.set(KEYS.biblioteca, l); this.renderBiblioteca();
      toast('Guardado en la biblioteca', 'bi-bookmark-check', 'azul');
    },
    renderBiblioteca() {
      const l = Store.get(KEYS.biblioteca, []);
      $('#bibliotecaContador').textContent = l.length;
      $('#bibliotecaLista').innerHTML = l.length ? l.map(x => `
        <div class="biblio-item" data-accent="${ANGULOS[x.angulo]?.accent || 'azul'}"><span class="punto-color"></span>
          <div class="contenido"><div class="meta">${escapeHtml(CANALES[x.canal]?.nombre || x.canal)} · ${x.formula} · ${haceCuanto(x.fecha)}</div>
          <div class="extracto">${escapeHtml(paraCanal(x.gancho || x.texto, 'plano'))}</div></div>
          <button class="btn btn-mini btn-outline-secondary" data-bact="copiar" data-id="${x.id}" title="Copiar"><i class="bi bi-clipboard"></i></button>
          <button class="btn btn-mini btn-outline-success" data-bact="diseno" data-id="${x.id}" title="Enviar a diseño"><i class="bi bi-send"></i></button>
          <button class="btn btn-mini btn-outline-danger" data-bact="borrar" data-id="${x.id}" title="Eliminar"><i class="bi bi-trash3"></i></button>
        </div>`).join('') : `<div class="vacio-mini"><i class="bi bi-bookmark"></i>Guarda aquí los copys que mejor funcionen.</div>`;
    },
    accionBiblioteca(e) {
      const b = e.target.closest('button[data-bact]'); if (!b) return;
      const l = Store.get(KEYS.biblioteca, []); const it = l.find(x => String(x.id) === b.dataset.id); if (!it) return;
      if (b.dataset.bact === 'copiar') copiar(paraCanal(it.texto, it.canal));
      if (b.dataset.bact === 'diseno') { Diseno.recibirCopy(it); irA('diseno'); }
      if (b.dataset.bact === 'borrar') { Store.set(KEYS.biblioteca, l.filter(x => x !== it)); this.renderBiblioteca(); toast('Copy eliminado', 'bi-trash3', 'azul'); }
    }
  };

  /* =======================================================================
11. ASISTENTE 02 — DISEÑO
  ======================================================================= */
  const Diseno = {
    init() {
      ['#disFormato', '#disEnfoque', '#disFondo'].forEach(s => grupoSeleccion($(s), () => this.actualizarLienzo()));
      ['#disTitular', '#disSubtitulo', '#disCta'].forEach(s => $(s).addEventListener('input', () => this.actualizarLienzo()));
      $('#disZonaSegura').addEventListener('change', () => this.actualizarLienzo());
      $('#btnGenerarPrompt').addEventListener('click', () => this.generarBrief());
      $('#btnLimpiarCopyRecibido').addEventListener('click', () => $('#copyRecibido').classList.add('d-none'));
      $('#disResultados').addEventListener('click', e => { const b = e.target.closest('[data-copiar]'); if (b) copiar($(b.dataset.copiar).textContent, 'Prompt copiado'); });
      this.actualizarLienzo();
    },
    estado() {
      return { formato: valorGrupo($('#disFormato')), enfoque: valorGrupo($('#disEnfoque')), fondo: valorGrupo($('#disFondo')),
        titular: $('#disTitular').value.trim(), subtitulo: $('#disSubtitulo').value.trim(), cta: $('#disCta').value.trim() };
    },
    recibirCopy(v) {
      const g = paraCanal(v.gancho || '', 'plano').replace(/^👉\s*/, '');
      $('#copyRecibidoTexto').textContent = paraCanal(v.texto, 'plano').slice(0, 260) + (v.texto.length > 260 ? '…' : '');
      $('#copyRecibido').classList.remove('d-none');
      if (g) $('#disTitular').value = g.slice(0, 80);
      fijarGrupo($('#disEnfoque'), ANGULOS[v.angulo]?.enfoque || 'cuidado');
      const f = { instagram: '4:5', reel: '9:16', facebook: '1:1', correo: '16:9', whatsapp: '9:16' }[v.canal];
      if (f) fijarGrupo($('#disFormato'), f);
      this.actualizarLienzo();
    },
    paleta(fondo, enfoque) {
      const acc = ESCENAS[enfoque];
      const base = fondo === 'oscuro'
        ? [{ hex: '#0D2855', nombre: 'Base azul profundo' }, { hex: '#FFFFFF', nombre: 'Texto blanco' }]
        : [{ hex: fondo === 'gris' ? '#F2F4F7' : '#FFFFFF', nombre: fondo === 'gris' ? 'Base gris claro' : 'Base blanca' }, { hex: '#0D2855', nombre: 'Texto azul profundo' }];
      return [...base, { hex: acc.hex, nombre: `Acento ${acc.nombre.toLowerCase()}` }];
    },
    actualizarLienzo() {
      const s = this.estado(); const lz = $('#lienzo');
      Object.assign(lz.dataset, { formato: s.formato, fondo: s.fondo, enfoque: s.enfoque });
      lz.classList.toggle('sin-guias', !$('#disZonaSegura').checked);
      $('#lzLogo').src = s.fondo === 'oscuro' ? 'assets/img/Logo_Nexcargo_Definitivo.svg' : 'assets/img/nexcargo-sin fondo.png';
      $('#lzTitular').textContent = s.titular || 'Tu titular aquí';
      $('#lzSubtitulo').textContent = s.subtitulo;
      $('#lzCta').textContent = s.cta || 'Cotiza ya';
      $('#disFormatoInfo').textContent = FORMATOS[s.formato].px;
      $('#paletaActiva').innerHTML = `<span class="regla"><i class="bi bi-check2-circle"></i> Regla de 3 colores</span>` +
        this.paleta(s.fondo, s.enfoque).map(c => `<span class="swatch"><i style="background:${c.hex}"></i>${c.nombre} <b>${c.hex}</b></span>`).join('') +
        `<span class="swatch"><i style="background:#5F3A88"></i>Sello de garantía <b>#5F3A88</b></span>`;
      const n = contarPalabras(s.titular); $('#disTitularContador').textContent = `${n}/8 palabras`;
      const val = [n && n <= 8 ? ['ok', `Titular de ${n} palabras (regla de 3 segundos)`] : ['alerta', `Titular de ${n} palabras: ideal entre 6 y 8`]];
      const pr = detectarProhibidas(`${s.titular} ${s.subtitulo} ${s.cta}`);
      if (pr.length) val.push(['error', `Frase prohibida: ${pr.join(', ')}`]);
      val.push(['ok', s.fondo === 'oscuro' ? 'Logo: SVG blanco sobre fondo oscuro' : 'Logo: PNG a color sobre fondo claro']);
      val.push(['ok', `Zona segura: ${FORMATOS[s.formato].zona}`]);
      $('#disValidaciones').innerHTML = val.map(([t, m]) => `<span class="validacion ${t === 'ok' ? '' : t}"><i class="bi ${t === 'ok' ? 'bi-check2' : 'bi-exclamation-triangle'}"></i> ${escapeHtml(m)}</span>`).join('');
    },
    generarBrief() {
      const s = this.estado();
      if (!s.titular) { toast('Escribe un titular para la pieza', 'bi-exclamation-triangle', 'violeta'); return $('#disTitular').focus(); }
      if (detectarProhibidas(`${s.titular} ${s.subtitulo} ${s.cta}`).length) return toast('Quita las frases prohibidas antes de generar', 'bi-exclamation-octagon', 'violeta');
      const e = ESCENAS[s.enfoque], f = FORMATOS[s.formato], pal = this.paleta(s.fondo, s.enfoque);
      const tono = s.fondo === 'oscuro' ? 'cool, slightly deep tones that blend into a deep navy blue (#0D2855) layout' : 'bright, clean, airy tones that blend into a white or light-gray layout';
      const prompt = [
        `Photorealistic commercial advertising photograph of ${e.sujeto}.`, `Setting: ${e.entorno}.`, `Lighting: ${e.luz}.`, `Camera: ${e.camara}.`,
        `Composition: ${f.espacio}.`, `Color: natural colors with subtle grading, ${tono}, small ${e.color} (${e.hex}) accents; no heavy filters.`,
        `Mood: ${e.mood}.`, 'Editorial quality, high resolution, crisp details, realistic proportions and mechanics. No text, no logos, no watermarks.', `Aspect ratio ${s.formato}.`
      ].join('\n');
      const extra = { garantia: ['readable screen text', 'fake UI labels'], rural: ['multiple trucks', 'dangerous unpaved road'], cuidado: ['people throwing boxes', 'items on the floor'] }[s.enfoque];
      const negativo = [...NEGATIVO_BASE, ...extra].join(', ');
      const pos = s.formato === '16:9' ? { texto: 'mitad izquierda', imagen: 'mitad derecha', pie: 'inferior izquierda' } : { texto: 'tercio superior', imagen: 'centro', pie: 'franja inferior' };
      const concepto = [
        `<b>Formato:</b> ${s.formato} · ${f.px}. Zona segura: ${f.zona}.`,
        `<b>Paleta (3 colores):</b> ${pal.map(c => `${c.nombre} ${c.hex}`).join(' + ')}.`,
        `<b>Logo:</b> ${s.fondo === 'oscuro' ? 'SVG monocromático en blanco' : 'PNG a color sin fondo'}, esquina superior izquierda, con margen libre igual a la altura de la "x".`,
        `<b>Titular (${pos.texto}):</b> "${escapeHtml(s.titular)}" en Montserrat Bold.`,
        s.subtitulo ? `<b>Subtítulo:</b> "${escapeHtml(s.subtitulo)}" en Montserrat Medium.` : '',
        `<b>Imagen (${pos.imagen}):</b> ${e.imagenES}`,
        `<b>Sello (${pos.pie}):</b> "10% de descuento por retraso" en violeta #5F3A88, texto blanco y cifra en Inter SemiBold.`,
        `<b>CTA (${pos.pie}, derecha):</b> "${escapeHtml(s.cta)}" en el acento ${e.hex}.`,
        '<b>Montaje:</b> genera la imagen sin texto y monta titular, sello, CTA y logo en Illustrator o Canva. Deja al menos 30% de espacio negativo.'
      ].filter(Boolean);
      $('#disResultados').innerHTML = `
        <div class="bloque-brief" data-accent="verde"><div class="bloque-brief-header"><h4><span class="num">1</span> Concepto y jerarquía visual (Illustrator / Canva)</h4></div>
          <div class="bloque-brief-cuerpo"><ul>${concepto.map(c => `<li>${c}</li>`).join('')}</ul></div></div>
        <div class="bloque-brief" data-accent="verde"><div class="bloque-brief-header"><h4><span class="num">2</span> Prompt optimizado (inglés)</h4>
          <button class="btn btn-sm btn-verde" data-copiar="#promptPositivo"><i class="bi bi-clipboard"></i> Copiar</button></div>
          <div class="bloque-brief-cuerpo"><pre class="prompt-texto" id="promptPositivo">${escapeHtml(prompt)}</pre></div></div>
        <div class="bloque-brief" data-accent="verde"><div class="bloque-brief-header"><h4><span class="num">3</span> Negative prompt (inglés)</h4>
          <button class="btn btn-sm btn-outline-danger" data-copiar="#promptNegativo"><i class="bi bi-clipboard"></i> Copiar</button></div>
          <div class="bloque-brief-cuerpo"><pre class="prompt-texto negativo" id="promptNegativo">${escapeHtml(negativo)}</pre></div></div>`;
      Stats.sumar('briefs');
      registrarActividad(`Brief ${s.formato} · ${e.nombre}`, 'bi-image', 'verde');
      toast('Brief y prompts generados', 'bi-magic');
      $('#disResultados').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* =======================================================================
12. ASISTENTE 03 — COMERCIAL
  ======================================================================= */
  const Comercial = {
    actual: 'miedo',
    init() {
      $('#objBotones').innerHTML = Object.entries(OBJECIONES).map(([k, o]) =>
        `<button class="chip ${k === this.actual ? 'active' : ''}" data-obj="${k}"><i class="bi ${o.icono}"></i> ${o.boton}</button>`).join('');
      $('#objBotones').addEventListener('click', e => { const b = e.target.closest('[data-obj]'); if (b) { this.actual = b.dataset.obj; this.marcarBoton(); this.render(); } });
      $('#objPedido').addEventListener('change', () => this.render());
      grupoSeleccion($('#objCanal'), () => this.render());
      $('#btnCopiarObj').addEventListener('click', () => copiar(this.textoFinal(), 'Respuesta copiada'));
      this.renderSelector();
    },
    marcarBoton() { $$('#objBotones .chip').forEach(c => c.classList.toggle('active', c.dataset.obj === this.actual)); },
    preparar(guia, objecion) { this.renderSelector(); $('#objPedido').value = guia; this.actual = objecion; this.marcarBoton(); this.render(); },
    renderSelector() {
      const sel = $('#objPedido'); const actual = sel.value;
      sel.innerHTML = `<option value="">Cliente genérico</option>` + Pedidos.lista().map(p => `<option value="${p.numeroGuia}">${p.numeroGuia} · ${escapeHtml(p.tienda)}</option>`).join('');
      sel.value = [...sel.options].some(o => o.value === actual) ? actual : '';
      this.render();
    },
    pedido() { return Pedidos.buscarGuia($('#objPedido').value); },
    texto() { const p = this.pedido(); return OBJECIONES[this.actual].texto(p ? primerNombre(p.tienda) : '[Nombre]', p); },
    textoFinal() {
      const canal = valorGrupo($('#objCanal'));
      if (canal === 'whatsapp') return paraCanal(this.texto(), 'whatsapp');
      return `ASUNTO: ${OBJECIONES[this.actual].asunto}\n\n${paraCanal(this.texto(), 'plano')}\n\nUn saludo,\n[Tu nombre]\nEquipo comercial Nexcargo`;
    },
    render() {
      const canal = valorGrupo($('#objCanal'));
      const box = $('#objTexto');
      box.classList.toggle('correo', canal === 'correo');
      box.innerHTML = canal === 'whatsapp' ? renderMarcado(this.texto()) : escapeHtml(this.textoFinal());
      const p = this.pedido(); const wa = normalizarWhatsapp(p?.whatsapp); const link = $('#btnAbrirWA');
      link.classList.toggle('d-none', !(wa && canal === 'whatsapp'));
      if (wa) link.href = `https://wa.me/${wa}?text=${encodeURIComponent(paraCanal(this.texto(), 'whatsapp'))}`;
    }
  };

  /* =======================================================================
13. CONFIGURACIÓN, INTEGRACIONES E IA
  ======================================================================= */
  const CONFIG_BASE = {
    webhook: 'https://mdrsproyect.app.n8n.cloud/webhook/nexcargo-pedidos',
    sheetsPedidos: 'https://docs.google.com/spreadsheets/d/1rosa9KgRys8ni8iWWlSbGIAGdHcHkddYGUzbqJ3riz4/edit?gid=0#gid=0',
    webhookContable: 'https://mdrsproyect.app.n8n.cloud/webhook/nexcargo-contabilidad',
    sheetsContable: 'https://docs.google.com/spreadsheets/d/1P7lKvQzDXLEIUDj29VSwgtaebLiQdt_xq-KacVseKyY/edit?gid=0#gid=0',
    whatsapp: '',
    geminiKey: '',
    geminiModelo: 'gemini-3.8-flash',
    adminHash: ''
  };

  const Config = {
    get() {
      const guardado = Store.get(KEYS.config, {});
      return {
        ...CONFIG_BASE,
        ...guardado,
        webhook: CONFIG_BASE.webhook,
        sheetsPedidos: guardado.sheetsPedidos || CONFIG_BASE.sheetsPedidos,
        webhookContable: CONFIG_BASE.webhookContable,
        sheetsContable: guardado.sheetsContable || CONFIG_BASE.sheetsContable
      };
    },
    set(c) { Store.set(KEYS.config, { ...c, webhook: CONFIG_BASE.webhook, webhookContable: CONFIG_BASE.webhookContable }); },
    iaActiva() { return !!this.get().geminiKey; },

    init() {
      const c = this.get();
      this.set(c);
      const campos = { cfgWebhook: 'webhook', cfgSheetsPedidos: 'sheetsPedidos', cfgWebhookConta: 'webhookContable', cfgSheetsConta: 'sheetsContable', cfgWhatsapp: 'whatsapp', cfgGemini: 'geminiKey', cfgModelo: 'geminiModelo' };
      Object.entries(campos).forEach(([id, k]) => { $('#' + id).value = c[k] || ''; });
      $('#formConfig').addEventListener('submit', e => { e.preventDefault(); this.guardar(); });
      $('#btnVerKey').addEventListener('click', () => {
        const i = $('#cfgGemini'); i.type = i.type === 'password' ? 'text' : 'password';
        $('#btnVerKey i').className = `bi ${i.type === 'password' ? 'bi-eye' : 'bi-eye-slash'}`;
      });
      $('#btnProbarIA').addEventListener('click', () => this.probarIA());
      $('#formPassword').addEventListener('submit', e => { e.preventDefault(); this.cambiarPassword(); });
      $('#btnLimpiarDatosLocales').addEventListener('click', () => this.restaurar());
      $('#btnBorrarOperacion').addEventListener('click', () => this.borrarOperacion());
      const passwordConfigurada = !!c.adminHash;
      $('#pwActual').previousElementSibling.hidden = !passwordConfigurada;
      $('#pwActual').hidden = !passwordConfigurada;
      $('#pwActual').required = passwordConfigurada;
      $('#pwAviso').textContent = passwordConfigurada
        ? 'Contraseña personalizada activa. Este bloqueo solo protege la interfaz en este navegador.'
        : 'No hay contraseña configurada. Crea una aquí para habilitar el módulo contable.';
      this.actualizarEstadoIA();
    },

    guardar() {
      const urls = { webhook: CONFIG_BASE.webhook, sheetsPedidos: $('#cfgSheetsPedidos').value.trim(), webhookContable: CONFIG_BASE.webhookContable, sheetsContable: $('#cfgSheetsConta').value.trim() };
      if (Object.values(urls).some(u => u && !/^https:\/\/\S+$/i.test(u))) { toast('Las URL deben empezar por https://', 'bi-exclamation-triangle', 'violeta'); return false; }
      const c = { ...this.get(), ...urls, whatsapp: normalizarWhatsapp($('#cfgWhatsapp').value), geminiKey: $('#cfgGemini').value.trim(), geminiModelo: $('#cfgModelo').value.trim() || 'gemini-3.8-flash' };
      delete c.sheets;
      this.set(c);
      $('#cfgWhatsapp').value = c.whatsapp;
      this.actualizarEstadoIA();
      registrarActividad('Configuración de integraciones actualizada', 'bi-gear');
      toast('Configuración guardada en este navegador', 'bi-floppy-fill');
      return true;
    },

    actualizarEstadoIA() {
      const on = this.iaActiva();
      $('#estadoIA').classList.toggle('online', on);
      $('#estadoIA .texto').textContent = on ? 'IA en vivo (Gemini)' : 'Modo offline (plantillas)';
      $('#copyModo').textContent = on ? 'IA en vivo' : 'Offline';
      $('#copyModo').classList.toggle('online', on);
    },

    async probarIA() {
      if (!this.guardar()) return;
      if (!this.iaActiva()) return toast('Pega primero tu GEMINI_API_KEY', 'bi-key', 'violeta');
      const b = $('#btnProbarIA'); b.disabled = true;
      try { await IA.llamar('Responde únicamente con la palabra OK.', 'Eres un verificador de conexión.', false); toast('Gemini conectado: los generadores usarán IA en vivo', 'bi-cpu'); }
      catch (e) { toast(`Gemini no respondió: ${e.message}`, 'bi-x-octagon', 'violeta'); }
      finally { b.disabled = false; }
    },

    async cambiarPassword() {
      const actual = $('#pwActual').value, nueva = $('#pwNueva').value, conf = $('#pwConfirmar').value;
      const primera = !this.get().adminHash;
      if (!primera && !(await Admin.verificar(actual))) { $('#pwActual').classList.add('is-invalid'); return toast('La contraseña actual no es correcta', 'bi-shield-x', 'violeta'); }
      if (nueva.length < 8) { $('#pwNueva').classList.add('is-invalid'); return toast('La nueva contraseña debe tener al menos 8 caracteres', 'bi-exclamation-triangle', 'violeta'); }
      if (nueva !== conf) { $('#pwConfirmar').classList.add('is-invalid'); return toast('La confirmación no coincide', 'bi-exclamation-triangle', 'violeta'); }
      this.set({ ...this.get(), adminHash: await Admin.hash(nueva) });
      $('#formPassword').reset(); $$('#formPassword .is-invalid').forEach(i => i.classList.remove('is-invalid'));
      $('#pwActual').previousElementSibling.hidden = false;
      $('#pwActual').hidden = false;
      $('#pwActual').required = true;
      $('#pwAviso').textContent = 'Contraseña personalizada activa. Este bloqueo solo protege la interfaz en este navegador.';
      Admin.actualizarBloqueo();
      registrarActividad(primera ? 'Contraseña de administrador configurada' : 'Contraseña de administrador actualizada', 'bi-key', 'profundo');
      Admin.bloquear();
      toast(primera ? 'Contraseña de administrador configurada.' : 'Contraseña actualizada. La sesión contable se bloqueó.', 'bi-shield-check', 'profundo');
    },

    async restaurar() {
      const ok = await confirmar('Limpiar datos locales', 'Se vacían los pedidos y movimientos locales para iniciar en limpio.', 'Limpiar');
      if (!ok) return;
      sembrarDatos(true);
      Pedidos.seleccionada = null;
      Pedidos.render(); Comercial.renderSelector(); Contabilidad.render();
      toast('Base local iniciada en limpio', 'bi-arrow-counterclockwise');
    },

    async borrarOperacion() {
      const ok = await confirmar('Borrar pedidos y marketing', 'Se eliminan pedidos, biblioteca de copys, métricas y actividad de este navegador. <b>La configuración y la contabilidad se conservan.</b>', 'Borrar');
      if (!ok) return;
      [KEYS.pedidos, KEYS.biblioteca, KEYS.stats, KEYS.actividad].forEach(k => localStorage.removeItem(k));
      Store.set(KEYS.pedidos, []);
      Pedidos.seleccionada = null;
      Pedidos.render(); Copy.renderBiblioteca(); Comercial.renderSelector();
      toast('Datos operativos eliminados', 'bi-trash3', 'violeta');
    }
  };

  /** Envío a webhooks de n8n con tiempo límite */
  const Integraciones = {
    async enviar(url, payload, incluirMetadatos = true) {
      if (!url) return { ok: false, motivo: 'sin-webhook' };
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
      try {
        const datos = incluirMetadatos ? { ...payload, origen: 'Nexcargo Hub', enviadoEn: new Date().toISOString() } : payload;
        const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos), signal: ctrl.signal });
        return r.ok ? { ok: true } : { ok: false, motivo: `HTTP ${r.status}` };
      } catch (e) {
        console.warn('[Nexcargo n8n]', e);
        return { ok: false, motivo: e.name === 'AbortError' ? 'tiempo agotado' : 'sin conexión o CORS' };
      } finally { clearTimeout(t); }
    }
  };

  /** Conector Gemini (Google AI Studio) con respaldo automático */
  const IA = {
    contexto: `Eres el Director de Marketing Estratégico y Copywriter Senior de Nexcargo, empresa colombiana de transporte de carga en camiones turbo especializada en paquetería grande (muebles, colchones y electrodomésticos), con rutas nacionales y cobertura en municipios, corregimientos y zonas rurales donde las tractomulas no entran.
Cliente ideal: dueños y jefes de logística de mueblerías, colchonerías y almacenes de electrodomésticos.
Dolores: golpes y rayones por malas prácticas de estiba, daños sin respuesta, transportadoras que no entran a zona rural, retrasos sin aviso que dañan la reputación de la tienda.
Diferenciales (úsalos con exactitud): 1) Estiba segura: nada pesado encima de lo delicado, protección dentro del camión turbo y disposición para entregar hasta la puerta. 2) Camiones turbo con cobertura nacional y rural. 3) Seguimiento del despacho con número de guía. 4) Garantía: 10% de descuento en el flete desde el primer día de retraso frente a la fecha pactada (excepción: paros).
Seguro de carga: opcional, se cobra aparte, cubre hasta el 50% del valor declarado; reclamaciones por PQR.
Tono: confiable, ágil, resolutivo, directo y cercano, de empresario a empresario. No inventes cifras, clientes, testimonios, GPS ni procesos.
PROHIBIDO usar: "líderes en el mercado", "soluciones integrales", "en el mundo actual", "calidad garantizada", "tu mejor aliado estratégico", "revolucionando la logística", "estamos a su entera disposición".`,

    async llamar(prompt, sistema, json = true) {
      const { geminiKey, geminiModelo } = Config.get();
      const candidatos = [...new Set([geminiModelo, 'gemini-3.8-flash-lite', 'gemini-3.8-pro'])];
      let ultimoError = new Error('Sin modelos disponibles');

      for (const modelo of candidatos) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 30000);
        try {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
            signal: ctrl.signal,
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sistema }] },
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, ...(json ? { responseMimeType: 'application/json' } : {}) }
            })
          });
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            ultimoError = new Error(data?.error?.message || `HTTP ${r.status}`);
            continue;
          }
          const texto = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
          if (!texto) {
            ultimoError = new Error('Respuesta vacía');
            continue;
          }
          return texto;
        } catch (e) {
          ultimoError = e.name === 'AbortError' ? new Error('tiempo agotado') : e;
        } finally {
          clearTimeout(t);
        }
      }
      throw ultimoError;
    },

    async generarCopy({ canal, formula, angulo, detalles }) {
      const prompt = `Canal: ${CANALES[canal].nombre}. Formato requerido: ${CANALES[canal].ia}
Fórmula: ${formula === 'PAS' ? 'PAS (Problema - Agitación - Solución)' : 'AIDA (Atención - Interés - Deseo - Acción)'}.
Ángulo principal: ${angulo}. Detalles de la campaña: ${detalles || 'ninguno'}.
Escribe 3 variaciones en español de Colombia: "dolor" (evitar daños y rayones), "cobertura" (zonas rurales con camiones turbo) y "garantia" (seguimiento por guía y 10% de descuento por retraso).
Resalta el gancho y el CTA con **doble asterisco**. Usa saltos de línea reales.
Devuelve SOLO este JSON: {"variaciones":[{"angulo":"dolor","gancho":"...","texto":"..."},{"angulo":"cobertura","gancho":"...","texto":"..."},{"angulo":"garantia","gancho":"...","texto":"..."}]}`;
      const crudo = await this.llamar(prompt, this.contexto, true);
      const json = JSON.parse(crudo.replace(/^```(json)?|```$/g, '').trim());
      const vars = ['dolor', 'cobertura', 'garantia'].map(k => json.variaciones?.find(v => v.angulo === k)).filter(v => v && v.texto);
      if (vars.length !== 3) throw new Error('Respuesta incompleta');
      return vars.map(v => ({ angulo: v.angulo, gancho: String(v.gancho || ''), texto: String(v.texto) }));
    }
  };

  /* =======================================================================
14. PORTAL PÚBLICO DE RASTREO (sin datos internos ni contables)
  ======================================================================= */
  const Portal = {
    init() { $('#formPortal').addEventListener('submit', e => { e.preventDefault(); this.buscar($('#portalGuia').value); }); },
    buscar(valor) {
      const codigo = valor.trim().toUpperCase();
      const box = $('#portalResultado');
      if (!codigo) { box.innerHTML = ''; return; }
      const p = Pedidos.buscarGuia(codigo);
      if (!p) {
        box.innerHTML = `<div class="portal-card text-center"><i class="bi bi-search fs-1 text-secundario"></i>
          <h3 class="h5 mt-2">No encontramos la guía ${escapeHtml(codigo)}</h3>
          <p class="text-secundario mb-0">Revisa que tenga el formato <b class="guia">NX-2026-001</b> o comunícate con la tienda que hizo el despacho.</p></div>`;
        return;
      }
      const g = garantia(p);
      const mensajeCliente = {
        atiempo: ['sem-atiempo', 'bi-clock', 'Tu despacho va a tiempo'],
        hoy: ['sem-hoy', 'bi-alarm', 'Tu entrega está programada para hoy'],
        cumplido: ['sem-cumplido', 'bi-check2-circle', 'Entregado a tiempo'],
        retraso: ['sem-retraso', 'bi-patch-check-fill', g.entregado ? 'Entregado con retraso: aplicamos 10% de descuento en tu flete' : 'Tu despacho presenta retraso: aplica 10% de descuento en tu flete'],
        paro: ['sem-paro', 'bi-cone-striped', 'Retraso por una situación externa (paro)']
      }[g.estado];
      const pasos = ETAPAS.map(e => {
        const estado = e.id < p.etapa || (e.id === 4 && p.etapa === 4) ? 'completo' : e.id === p.etapa ? 'actual' : '';
        return `<div class="step ${estado}"><span class="step-circulo"><i class="bi ${e.icono}"></i></span><span class="step-label">${e.nombre}</span></div>`;
      }).join('');
      const wa = Config.get().whatsapp;
      box.innerHTML = `<div class="portal-card">
        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
          <div><small class="text-secundario">Guía</small><h2 class="h3 m-0 guia">${p.numeroGuia}</h2>
            <div class="celda-sub">${escapeHtml(p.destino)}${p.zona === 'Rural' ? ' · Zona rural' : ''}</div></div>
          <div class="text-end"><span class="semaforo ${mensajeCliente[0]}"><i class="bi ${mensajeCliente[1]}"></i>${mensajeCliente[2]}</span>
            <div class="celda-sub mt-1">Entrega pactada: ${fechaLarga(p.fechaPactada)}</div></div>
        </div>
        <div class="stepper">${pasos}</div>
        <div class="detalle-datos"><div><small>Etapa actual</small><b>${etapaDe(p).nombre}</b></div>
          <div><small>Mercancía</small><b>${escapeHtml(p.mercancia)}</b></div>
          ${p.fechaEntrega ? `<div><small>Entregado</small><b>${fechaLarga(p.fechaEntrega)}</b></div>` : ''}</div>
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span class="celda-sub"><i class="bi bi-shield-check"></i> Tu mercancía viaja con protocolo de estiba segura en camión turbo.</span>
          ${wa ? `<a class="btn btn-sm btn-whatsapp" target="_blank" rel="noopener" href="https://wa.me/${wa}?text=${encodeURIComponent(`Hola Nexcargo, consulto por mi guía ${p.numeroGuia}`)}"><i class="bi bi-whatsapp"></i> Escríbenos</a>` : ''}
        </div></div>`;
    }
  };

  /* =======================================================================
     ARRANQUE
  ======================================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    sembrarDatos();
    Dashboard.init();
    Pedidos.init();
    Admin.init();
    Contabilidad.init();
    Copy.init();
    Diseno.init();
    Comercial.init();
    Config.init();
    Portal.init();
    initNavegacion();
  });
})();