/**
 * Convierte una estructura JSON de plantilla (bloques, capítulos, tablas, etc.)
 * nuevamente a HTML legible, con numeración jerárquica y anclas.
 */

export function generarHtmlDesdePlantilla(estructura: any): string {
  if (!estructura) return '';

  if (estructura.tipo === 'documento' && Array.isArray(estructura.bloques)) {
    return renderBloques(estructura.bloques, []);
  }

  // Si el objeto raíz no tiene tipo "documento", tratamos como bloque único
  return renderBloques([estructura], []);
}

/**
 * Renderiza una lista de bloques con numeración jerárquica.
 */
function renderBloques(bloques: any[], indicePadre: number[]): string {
  return bloques
    .map((bloque, i) => renderBloque(bloque, [...indicePadre, i + 1]))
    .join('\n');
}

/**
 * Renderiza un bloque individual.
 */
function renderBloque(bloque: any, indice: number[]): string {
  const numeracion = indice.join('.');

  switch (bloque.tipo) {
    case 'capitulo':
      return `
        <ol>
          <li>
            <a id="cap-${numeracion.replace(/\./g, '-')}"></a>
            <strong>${numeracion}. ${escapeHtml(bloque.titulo || '')}</strong>
          </li>
        </ol>
        ${bloque.bloques ? renderBloques(bloque.bloques, indice) : ''}
      `;

    case 'subcapitulo':
      return `
        <ul>
          <li>
            <a id="sub-${numeracion.replace(/\./g, '-')}"></a>
            <strong>${numeracion}. ${escapeHtml(bloque.titulo || '')}</strong>
          </li>
        </ul>
        ${bloque.bloques ? renderBloques(bloque.bloques, indice) : ''}
      `;

    case 'parrafo':
      return `<p>${bloque.texto_html || escapeHtml(bloque.texto || '')}</p>`;

    case 'lista_ul':
      return `
        <ul>
          ${(bloque.items || [])
            .map((item: any) => `<li>${item.texto_html || escapeHtml(item.texto || '')}</li>`)
            .join('\n')}
        </ul>
      `;

    case 'lista_ol':
      return `
        <ol>
          ${(bloque.items || [])
            .map((item: any, idx: number) => 
              `<li>${numeracion}.${idx + 1} ${item.texto_html || escapeHtml(item.texto || '')}</li>`
            )
            .join('\n')}
        </ol>
      `;

    case 'tabla':
      return renderTable(bloque, numeracion);

    case 'html':
      return bloque.contenido || '';

    default:
      return `<p>${escapeHtml(JSON.stringify(bloque))}</p>`;
  }
}

/**
 * Renderiza una tabla HTML con un título opcional y numeración.
 */
function renderTable(tabla: any, numeracion: string): string {
  if (!tabla || !tabla.encabezados) return '';

  const headers = tabla.encabezados.map((h: string) => `<th>${escapeHtml(h)}</th>`).join('');
  const rows = (tabla.filas || [])
    .map(
      (fila: string[]) =>
        `<tr>${fila.map((v) => `<td>${escapeHtml(v)}</td>`).join('')}</tr>`
    )
    .join('\n');

  return `
    <p><strong>Tabla ${numeracion}</strong></p>
    <table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse;">
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/**
 * Escapa caracteres HTML básicos.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
