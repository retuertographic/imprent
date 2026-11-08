import type { ReactNode } from "react";
import { contact } from "../content";
import { SiteLink } from "../SiteLink";

const updated = "Actualizado el 30 de octubre de 2026.";

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="contenido" className="brand-main">
      <article className="article-body legal-copy">
        <p className="eyebrow">SERITENE · INFORMACIÓN LEGAL</p>
        <h1>{title}</h1>
        <p>{updated}</p>
        {children}
        <p>
          <SiteLink className="text-cta" href="/contacto/">
            Contactar con Seritene
          </SiteLink>
        </p>
      </article>
    </main>
  );
}

function Owner({ heading }: { heading: string }) {
  return (
    <section>
      <h2>{heading}</h2>
      <p>
        José Enrique Ferrera Torres
        <br />
        NIF: 43371946H
        <br />
        Calle Lordelos, 20, n.º 9 · 38315 La Orotava · Santa Cruz de Tenerife · España
      </p>
      <p>
        Correo: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        <br />
        Teléfono: <a href={`tel:${contact.phone}`}>{contact.displayPhone}</a>
      </p>
    </section>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** /aviso-legal/ */
export function AvisoLegal() {
  return (
    <LegalPage title="Aviso legal">
      <Owner heading="Titular del sitio web" />
      <section>
        <h2>Información y presupuestos</h2>
        <p>
          Esta web presenta los servicios de personalización textil, fullprint, merchandising e impresión de Seritene y
          permite preparar solicitudes de presupuesto. Los configuradores ofrecen una orientación según la selección
          realizada. La disponibilidad, la compatibilidad del diseño, el plazo y el presupuesto definitivo se confirman
          antes de producir.
        </p>
        <p>
          Las fichas indican los conceptos incluidos en sus precios. Cuando se señale que impuestos, transporte o diseño
          no están incluidos, se concretarán en la propuesta. Preparar una consulta o descargar un diseño no constituye
          por sí solo la aceptación de un pedido ni inicia su fabricación.
        </p>
      </section>
      <section>
        <h2>Diseños, imágenes y propiedad intelectual</h2>
        <p>
          Los textos, logotipos, fotografías y diseños de la web pertenecen a Seritene o a sus respectivos titulares. Las
          imágenes de producto y las marcas de proveedores se utilizan para identificar sus artículos. Los mockups y
          diseños ficticios identificados como ejemplos ilustran posibilidades de personalización.
        </p>
        <p>
          Para reproducir contenidos de la web fuera de los usos legalmente permitidos, solicita autorización al titular
          correspondiente. Al aportar un diseño para un pedido, asegúrate de contar con los derechos necesarios sobre sus
          imágenes, marcas y demás elementos.
        </p>
      </section>
      <section>
        <h2>Uso de la web y enlaces</h2>
        <p>
          Utiliza la web de forma lícita y sin interferir en su funcionamiento. Los enlaces a catálogos, redes sociales y
          aplicaciones externas permiten consultar esos servicios; sus contenidos y condiciones dependen de sus
          respectivos responsables.
        </p>
        <p>
          Si detectas un error en una ficha o un enlace, comunícalo a Seritene para revisarlo. La información se
          actualiza para reflejar las opciones disponibles. Estas indicaciones no limitan los derechos que correspondan a
          consumidores y usuarios conforme a la normativa aplicable.
        </p>
      </section>
      <section>
        <h2>Protección de datos</h2>
        <p>
          Consulta cómo se tratan tus datos al utilizar el formulario, los configuradores y los canales de contacto en
          nuestra <SiteLink href="/politica-privacidad/">política de privacidad</SiteLink>.
        </p>
      </section>
    </LegalPage>
  );
}

/** /politica-privacidad/ */
export function PoliticaPrivacidad() {
  return (
    <LegalPage title="Política de privacidad">
      <Owner heading="Responsable y contacto" />
      <section>
        <h2>Qué datos utilizamos y para qué</h2>
        <p>
          Tratamos los datos que nos facilitas al solicitar información o un presupuesto: nombre, datos de contacto,
          empresa o club si lo indicas, destino de entrega, características del pedido y los diseños o archivos que
          decidas enviarnos. Los utilizamos para atender tu consulta, preparar una propuesta y, si la aceptas, gestionar
          el pedido.
        </p>
        <p>
          Las consultas sobre presupuestos y pedidos se atienden para aplicar medidas precontractuales a petición tuya o
          ejecutar el contrato. La documentación que deba conservarse por obligaciones fiscales o comerciales se trata
          para cumplir esas obligaciones. Los datos técnicos necesarios para servir y proteger la web se utilizan para
          mantener su funcionamiento y prevenir abusos.
        </p>
        <p>
          Los campos obligatorios permiten preparar la consulta. Sin esa información puede que no podamos valorar el
          pedido. Evita incluir información sensible o datos de otras personas que no sean necesarios. El buscador y el
          asistente de productos orientan tu selección; no toman decisiones con efectos jurídicos sobre ti.
        </p>
      </section>
      <section>
        <h2>Solicitudes web y consultas por WhatsApp</h2>
        <p>
          El formulario de pedido prepara en tu navegador un mensaje con tus datos de contacto y la selección que hayas
          indicado. Al pulsar «Pedir por WhatsApp», esos datos pasan a WhatsApp para que revises el mensaje y decidas
          enviarlo. Seritene recibe la consulta cuando la envías por WhatsApp. El formulario no guarda una copia en una
          bandeja web ni la sincroniza con el programa de gestión. La solicitud no confirma una compra ni reserva
          existencias.
        </p>
        <p>
          El formulario general de contacto prepara un mensaje en tu navegador. Al pulsar «Revisar en WhatsApp», el texto
          pasa a WhatsApp para que puedas revisarlo y decidir si lo envías; Seritene recibe esa consulta cuando la envías.
          WhatsApp Ireland Limited gestiona su servicio conforme a su{" "}
          <Ext href="https://www.whatsapp.com/legal/privacy-policy-eea">política de privacidad</Ext>.
        </p>
      </section>
      <section>
        <h2>Archivos de medallas personalizadas</h2>
        <p>
          Al seleccionar un archivo en la ficha de medallas, se guarda en el almacenamiento de esta web para preparar tu
          solicitud. Su enlace se incorpora al mensaje de WhatsApp; cualquier persona que reciba ese enlace podrá
          descargarlo. Los enlaces caducan a los 30 días. Los archivos caducados se retiran durante las tareas de limpieza
          del almacenamiento. Puedes solicitar su eliminación antes escribiéndonos.
        </p>
        <p>
          La selección de cinta, acabado, cantidad, datos del evento, observaciones y referencias a los archivos se
          conservan en el navegador para recuperar el borrador en el mismo dispositivo. Se utilizan contadores temporales
          de subidas, asociados a una huella de la dirección IP que cambia cada día, para limitar abusos. Las imágenes
          identificadas como diseños de ejemplo no son archivos de clientes.
        </p>
      </section>
      <section>
        <h2>Configuradores y diseños</h2>
        <p>
          El configurador permite guardar una composición en el almacenamiento local del navegador para recuperarla en el
          mismo dispositivo. Puedes eliminarla desde los datos del sitio en tu navegador; si compartes dispositivo, evita
          dejar diseños personales guardados.
        </p>
        <p>
          El Estudio DTF permite preparar imágenes en el navegador y descargar un archivo o un proyecto editable.
          Seleccionar una imagen en esa herramienta no envía automáticamente el diseño a Seritene: debes adjuntarlo por el
          canal que elijas para solicitar la impresión.
        </p>
      </section>
      <section>
        <h2>Proveedores y servicios externos</h2>
        <p>
          El alojamiento y la entrega de esta web utilizan Sites de OpenAI e infraestructura de Cloudflare. Al conectarte,
          los servicios técnicos pueden procesar datos como la dirección IP, la URL solicitada y datos del navegador para
          servir el contenido y mantener la seguridad. Algunas imágenes y catálogos se cargan desde GOR Factory; esas
          conexiones también transmiten los datos técnicos necesarios para solicitar el recurso.
        </p>
        <p>
          Los servicios de alojamiento, comunicaciones y gestión que intervengan en tu consulta acceden a los datos
          necesarios para prestar su función. También podrán comunicarse datos cuando exista una obligación legal. No se
          incorporan tus consultas a campañas publicitarias por el mero hecho de pedir presupuesto.
        </p>
        <p>
          Los proveedores pueden operar internacionalmente. Puedes consultar la información de{" "}
          <Ext href="https://openai.com/policies/privacy-policy/">OpenAI</Ext>,{" "}
          <Ext href="https://www.cloudflare.com/privacypolicy/">Cloudflare</Ext> y WhatsApp y solicitar a Seritene
          información sobre los proveedores y garantías aplicables a tu consulta.
        </p>
      </section>
      <section>
        <h2>Conservación</h2>
        <p>
          Las consultas se conservan mientras sean necesarias para responder y dar seguimiento a tu solicitud. Si se
          formaliza un pedido, se conserva la información necesaria durante la relación comercial y los plazos legales
          aplicables a su documentación y a posibles responsabilidades. Los diseños guardados localmente permanecen en tu
          navegador hasta que los sustituyas o elimines los datos del sitio; los archivos descargados quedan bajo tu
          control.
        </p>
      </section>
      <section>
        <h2>Tus derechos</h2>
        <p>
          Puedes solicitar acceso a tus datos, corregirlos, pedir su supresión, limitar su tratamiento, oponerte cuando
          proceda o solicitar su portabilidad. Cuando un tratamiento se base en el consentimiento, puedes retirarlo sin
          afectar a lo realizado previamente.
        </p>
        <p>
          Escribe a <a href={`mailto:${contact.email}`}>{contact.email}</a> indicando tu solicitud. Si existen dudas
          razonables sobre tu identidad, se podrá pedir la información necesaria para verificarla. También puedes
          presentar una reclamación ante la{" "}
          <Ext href="https://www.aepd.es/">Agencia Española de Protección de Datos</Ext>.
        </p>
      </section>
      <section>
        <h2>Cookies y almacenamiento del navegador</h2>
        <p>
          La aplicación de Seritene no incorpora Google Analytics ni píxeles publicitarios en esta versión. El
          configurador utiliza almacenamiento local para recuperar diseños. El alojamiento y los servicios externos pueden
          utilizar mecanismos técnicos para prestar sus funciones y proteger las conexiones. Puedes consultar y eliminar
          cookies y datos del sitio desde los ajustes del navegador; algunas funciones podrían dejar de conservar tus
          preferencias.
        </p>
      </section>
    </LegalPage>
  );
}
