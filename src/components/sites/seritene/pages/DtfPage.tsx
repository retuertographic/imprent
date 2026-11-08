/* Página /dtf-x-metros/: presentación del Estudio DTF (la herramienta es una app externa). */
import { ArrowDown, ArrowUpRight, Check, Download, Grid3x3, Layers, Maximize2, MousePointer2, Move, MoveHorizontal, Plus, RotateCw, Upload } from "lucide-react";
import { Breadcrumbs } from "./common";
import { OrderActions } from "./OrderActions";

const STUDIO_URL = "https://seritene-dtf-studio.cesarfr.chatgpt.site";
const orderMessage =
  "Hola Seritene, quiero consultar un pedido de DTF por metros. Voy a preparar mi plancha en el estudio online. Cantidad y archivos a confirmar.";

/** Estrella de 12 puntas del sitio. */
function Star() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" fill="currentColor">
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="44" y="2" width="12" height="39" rx="2" transform={`rotate(${i * 30} 50 50)`} />
      ))}
    </svg>
  );
}

/** Ilustración del programa (ventana con la plancha de ejemplo). */
function DtfMockup() {
  return (
    <figure className="dtf-hero-graphic" aria-label="Vista ilustrativa del Estudio DTF: diseños con medidas reales organizados en una plancha transparente de 57 centímetros">
      <div className="dtf-graphic-orbit" aria-hidden="true" />
      <span className="dtf-floating-label">
        <span className="dtf-status-dot" />
        TU NUEVA MESA DE TRABAJO
      </span>
      <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer" className="dtf-app-window" aria-label="Abrir el programa para montar mis metros DTF">
        <div className="dtf-window-bar">
          <div>
            <i />
            <i />
            <i />
          </div>
          <span>
            ESTUDIO
            {" "}
            <b>DTF</b>
            {" "}
            / SERITENE
          </span>
          <ArrowUpRight size={14} />
        </div>
        <div className="dtf-mock-tabs">
          <span>
            <Layers size={12} />
            Montar plancha
          </span>
          <span>
            <Grid3x3 size={12} />
            Crear semitono
          </span>
          <small>ONLINE</small>
        </div>
        <div className="dtf-mock-workspace">
          <div className="dtf-mock-sidebar">
            <div className="dtf-mock-section">
              <span className="dtf-mock-step">01</span>
              <b>Tus diseños</b>
            </div>
            <div className="dtf-mock-upload">
              <Upload size={19} />
              <span>Sube tus archivos</span>
              <small>PNG · JPG · WebP</small>
            </div>
            <div className="dtf-mock-file">
              <span>
                <Star />
              </span>
              <div>
                <b>good-vibes.png</b>
                <small>3 copias en la plancha</small>
              </div>
              <Check size={11} />
            </div>
            <div className="dtf-mock-section">
              <span className="dtf-mock-step">02</span>
              <b>Tu plancha</b>
            </div>
            <div className="dtf-mock-measures">
              <span>
                Ancho
                <b>
                  57
                  <small>cm</small>
                </b>
              </span>
              <span>
                Largo
                <b>
                  100
                  <small>cm</small>
                </b>
              </span>
            </div>
            <span className="dtf-mock-auto">
              <Maximize2 size={10} />
              Distribuir automáticamente
            </span>
            <div className="dtf-mock-section">
              <span className="dtf-mock-step">03</span>
              <b>Ajusta tu diseño</b>
            </div>
            <div className="dtf-mock-measures">
              <span>
                Ancho
                <b>
                  24
                  <small>cm</small>
                </b>
              </span>
              <span>
                Alto
                <b>
                  20
                  <small>cm</small>
                </b>
              </span>
            </div>
            <span className="dtf-mock-ratio">
              <Check size={10} />
              Mantener proporciones
            </span>
          </div>
          <div className="dtf-mock-canvas-area">
            <div className="dtf-mock-tools">
              <b>MI PLANCHA</b>
              <span>57 × 100 cm</span>
              <RotateCw size={12} />
              <Plus size={12} />
            </div>
            <div className="dtf-mock-board">
              <div className="dtf-mock-ruler">
                <span>0</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
                <span>50</span>
              </div>
              <div className="dtf-mock-sheet">
                <div className="dtf-print dtf-print-one">
                  <span className="dtf-good-vibes">
                    <span className="dtf-vibes-rays" aria-hidden="true">
                      <Star />
                    </span>
                    <b>
                      GOOD
                      <br />
                      VIBES
                    </b>
                    <small>HECHO PARA DESTACAR</small>
                  </span>
                  <i />
                  <i />
                  <i />
                  <i />
                  <span className="dtf-size-tag">24 × 20 cm</span>
                </div>
                <div className="dtf-print dtf-print-two">
                  <span className="dtf-good-vibes dtf-good-vibes-small">
                    <span className="dtf-vibes-rays" aria-hidden="true">
                      <Star />
                    </span>
                    <b>
                      GOOD
                      <br />
                      VIBES
                    </b>
                    <small>HECHO PARA DESTACAR</small>
                  </span>
                </div>
                <div className="dtf-print dtf-print-three">
                  <span className="dtf-good-vibes dtf-good-vibes-small">
                    <span className="dtf-vibes-rays" aria-hidden="true">
                      <Star />
                    </span>
                    <b>
                      GOOD
                      <br />
                      VIBES
                    </b>
                    <small>HECHO PARA DESTACAR</small>
                  </span>
                </div>
                <div className="dtf-wild-type">
                  WILD
                  <br />
                  <span>IDEAS.</span>
                  <small>SERITENE®</small>
                </div>
                <MousePointer2 size={31} />
                <span className="dtf-cursor-label">Tu diseño, a tu medida</span>
              </div>
            </div>
            <div className="dtf-mock-export">
              <span>
                <Check size={11} />
                Fondo transparente
              </span>
              <b>
                Exportar PNG
                {" "}
                <Download size={11} />
              </b>
            </div>
          </div>
        </div>
      </a>
      <span className="dtf-width-sticker">
        <strong>
          57
          <span>cm</span>
        </strong>
        <small>PARA DARLO TODO</small>
      </span>
      <span className="dtf-export-float">
        <span>
          <Download size={20} />
        </span>
        <div>
          <strong>Tu plancha. Lista.</strong>
          <small>PNG transparente · 300 ppp</small>
        </div>
        <Check size={18} />
      </span>
      <figcaption>Vista ilustrativa del programa · Los diseños son de ejemplo</figcaption>
    </figure>
  );
}

export function DtfPage() {
  return (
    <main id="contenido" className="brand-main dtf-main">
      <Breadcrumbs className="wrap breadcrumbs dtf-breadcrumbs" items={[{ label: "DTF x metros" }]} />
      <section className="dtf-hero wrap">
        <div className="dtf-hero-copy">
          <p className="dtf-eyebrow">
            <span>NUEVO</span>
            DTF X METROS · SERITENE
          </p>
          <h1>
            Tus diseños.
            <br />
            <em>Por metros.</em>
            <span className="dtf-heading-star" aria-hidden="true">
              <Star />
            </span>
          </h1>
          <p className="dtf-hero-lead">
            Tú montas la plancha.
            <br />
            <strong>Nosotros ponemos la impresión.</strong>
          </p>
          <p className="dtf-hero-description">
            Estrenamos programa para preparar tus metros DTF online. Sube tus diseños, dales su tamaño y aprovecha cada centímetro.
          </p>
          <div className="dtf-hero-actions">
            <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer" className="dtf-button">
              Montar mis metros
              {" "}
              <ArrowUpRight size={21} />
            </a>
            <a href="#como-funciona" className="dtf-how-link">
              Así funciona
              {" "}
              <ArrowDown size={16} />
            </a>
          </div>
          <div className="dtf-hero-note">
            <span>
              <Check size={14} />
              Sin instalar nada
            </span>
            <span>
              <Check size={14} />
              Desde tu navegador
            </span>
          </div>
        </div>
        <DtfMockup />
      </section>
      <div className="dtf-specs-band">
        <div className="wrap">
          <span>
            <strong>57 cm</strong>
            de ancho de plancha
          </span>
          <i />
          <span>
            <strong>A tu medida</strong>
            tamaños, copias y giros
          </span>
          <i />
          <span>
            <strong>300 ppp</strong>
            PNG con transparencia
          </span>
          <span className="dtf-band-star" aria-hidden="true">
            <Star />
          </span>
        </div>
      </div>
      <section id="como-funciona" className="wrap dtf-process">
        <div className="dtf-section-heading">
          <div>
            <p className="eyebrow">DEL ARCHIVO AL TALLER</p>
            <h2>
              Tu metro.
              <br />
              A tu manera.
            </h2>
          </div>
          <p>
            Un espacio para todos tus diseños.
            <br />
            Un archivo listo para enviarnos.
          </p>
        </div>
        <div className="dtf-steps">
          <article>
            <div className="dtf-step-top">
              <Upload size={26} />
              <span>01</span>
            </div>
            <h3>Sube lo que imaginas.</h3>
            <p>Añade tus PNG, JPG o WebP. Si ya tienes el diseño sin fondo, usa su PNG original.</p>
            <span className="dtf-step-detail">TUS ARCHIVOS, EN TU NAVEGADOR</span>
          </article>
          <article>
            <div className="dtf-step-top">
              <Move size={26} />
              <span>02</span>
            </div>
            <h3>Dale su sitio.</h3>
            <p>Define las medidas en centímetros. Duplica, gira y distribuye tus diseños en una plancha de 57 cm de ancho.</p>
            <span className="dtf-step-detail">LARGO CONFIGURABLE · DE 10 A 300 CM</span>
          </article>
          <article>
            <div className="dtf-step-top">
              <Download size={26} />
              <span>03</span>
            </div>
            <h3>Descarga. Y al taller.</h3>
            <p>Exporta el PNG a 300 ppp y envíanoslo como documento por WhatsApp o correo. Lo revisamos contigo antes de imprimir.</p>
            <span className="dtf-step-detail">EL ARCHIVO ORIGINAL. SIN HACER ESPEJO.</span>
          </article>
        </div>
      </section>
      <section className="dtf-tone-section">
        <div className="wrap dtf-tone-layout">
          <div className="dtf-tone-art" role="img" aria-label="Ejemplo gráfico de un diseño continuo y su versión con trama de semitonos">
            <div className="dtf-tone-disc" />
            <div className="dtf-tone-dots" />
            <span className="dtf-tone-text">
              MENOS
              <br />
              TINTA.
              <br />
              <em>MÁS TACTO.</em>
            </span>
            <div className="dtf-tone-split">
              <span>
                <MoveHorizontal size={18} />
              </span>
            </div>
            <div className="dtf-tone-labels">
              <span>ORIGINAL</span>
              <span>SEMITONO</span>
            </div>
          </div>
          <div className="dtf-tone-copy">
            <p className="eyebrow">TAMBIÉN TENEMOS SEMITONOS</p>
            <h2>
              De una masa
              <br />
              de tinta a
              <br />
              <em>un montón de puntos.</em>
            </h2>
            <p>
              Prepara el diseño para prendas claras u oscuras. Elimina blancos o negros, ajusta la trama y compara el resultado antes de llevarlo a tu plancha.
            </p>
            <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer" className="dtf-button dtf-button-light">
              Probar el estudio DTF
              {" "}
              <ArrowUpRight size={20} />
            </a>
            <span className="dtf-tone-note">Abre la pestaña «Crear semitono» dentro del programa.</span>
          </div>
        </div>
      </section>
      <section className="wrap dtf-ready">
        <div>
          <p className="eyebrow">UN BUEN ARCHIVO, UN BUEN COMIENZO</p>
          <h2>
            Antes de darle
            <br />
            a imprimir.
          </h2>
        </div>
        <ul>
          <li>
            <Check size={24} />
            <span>
              <strong>El fondo, transparente.</strong>
              El estudio no añade fondo. Si tu imagen lo tiene, tendrás que prepararla antes de exportar.
            </span>
          </li>
          <li>
            <Check size={24} />
            <span>
              <strong>El tamaño, bien pensado.</strong>
              Revisa las medidas y los avisos de resolución. Ampliar una imagen no crea detalle nuevo.
            </span>
          </li>
          <li>
            <Check size={24} />
            <span>
              <strong>Cada diseño, con su espacio.</strong>
              Comprueba los márgenes y la separación. El programa avisa si los diseños se superponen.
            </span>
          </li>
        </ul>
      </section>
      <section className="wrap dtf-faq">
        <div>
          <p className="eyebrow">DUDAS PEQUEÑAS. IDEAS GRANDES.</p>
          <h2>Vamos por partes.</h2>
        </div>
        <div>
          <details>
            <summary>
              ¿Qué archivos puedo subir?
              <Plus size={18} />
            </summary>
            <p>
              PNG, JPG o WebP, de hasta 30 MB por imagen y 32 megapíxeles. El PNG transparente es la mejor opción si tu diseño ya está preparado. Las imágenes opacas conservan su fondo; puedes eliminar blancos o negros desde la herramienta de semitonos.
            </p>
          </details>
          <details>
            <summary>
              ¿Qué tamaño tiene la plancha?
              <Plus size={18} />
            </summary>
            <p>
              El ancho es de 57 cm y puedes elegir un largo de 10 a 300 cm. Cada diseño tiene sus propias medidas en centímetros. Puedes duplicarlo, girarlo y distribuir las copias con separación y margen.
            </p>
          </details>
          <details>
            <summary>
              ¿El programa mejora la resolución de mis imágenes?
              <Plus size={18} />
            </summary>
            <p>
              La salida es un PNG a 300 ppp, pero ampliar una imagen pequeña no crea detalle nuevo. El estudio muestra la resolución de origen y avisa cuando es baja. Usa siempre el archivo de mayor calidad que tengas.
            </p>
          </details>
          <details>
            <summary>
              ¿Cómo os envío el archivo para imprimir?
              <Plus size={18} />
            </summary>
            <p>
              Descarga el PNG y adjúntalo como documento original por WhatsApp o correo a Seritene. No envíes una captura ni una imagen comprimida y no hagas espejo. Revisaremos contigo el archivo, el presupuesto y el plazo antes de producir.
            </p>
          </details>
          <details>
            <summary>
              ¿Puedo continuar el montaje más tarde?
              <Plus size={18} />
            </summary>
            <p>
              Sí. En «Guía rápida» encontrarás «Guardar proyecto editable». El archivo incluye tus diseños y sus posiciones; después puedes volver a abrirlo en el estudio. Cargar un archivo en el montador no lo envía automáticamente a Seritene.
            </p>
          </details>
        </div>
      </section>
      <section className="wrap dtf-final">
        <div className="dtf-final-cross" aria-hidden="true">
          <Star />
        </div>
        <div>
          <p className="eyebrow">ESPACIO PARA TU PRÓXIMA GRAN IDEA</p>
          <h2>
            ¿Montamos
            <br />
            <em>tus metros?</em>
          </h2>
          <p>Prepara tu archivo. Nosotros seguimos desde ahí.</p>
        </div>
        <div className="dtf-final-actions">
          <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer" className="dtf-button">
            Abrir el montador DTF
            {" "}
            <ArrowUpRight size={21} />
          </a>
          <OrderActions name="DTF por metros" message={orderMessage} />
          <small>Presupuesto y plazo a confirmar con Seritene.</small>
        </div>
      </section>
    </main>
  );
}
