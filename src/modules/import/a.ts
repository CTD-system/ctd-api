// private eliminarSubcapitulosDuplicadosPorContenido(capitulos: any[]): void {
  //   console.log('=== ELIMINANDO SUBCAPÍTULOS DUPLICADOS POR CONTENIDO ===');

  //   let subcapitulosEliminados = 0;

  //   // Recorrer todos los capítulos
  //   capitulos.forEach((capitulo) => {
  //     // Crear lista de nombres de subcapítulos y contenido relevante del capítulo
  //     const nombresSubcapitulos = new Set<string>();
  //     const contenidoCapitulo = capitulo.contenido?.toLowerCase() || '';

  //     // Primera pasada: recolectar todos los nombres de subcapítulos
  //     capitulo.subCapitulos.forEach((subcapitulo: any) => {
  //       const nombreSubcapitulo = this.extraerNombrePrincipal(
  //         subcapitulo.titulo,
  //       ).toLowerCase();
  //       if (nombreSubcapitulo) {
  //         nombresSubcapitulos.add(nombreSubcapitulo);
  //       }
  //     });

  //     // Segunda pasada: eliminar subcapítulos cuyo nombre aparece al inicio del contenido de otro
  //     const subcapitulosAEliminar: number[] = [];

  //     capitulo.subCapitulos.forEach((subcapitulo: any, index: number) => {
  //       const nombreSubcapitulo = this.extraerNombrePrincipal(
  //         subcapitulo.titulo,
  //       ).toLowerCase();

  //       if (!nombreSubcapitulo) return;

  //       // Verificar si este nombre aparece al inicio del contenido de otros subcapítulos
  //       let esDuplicado = false;

  //       capitulo.subCapitulos.forEach(
  //         (otroSubcapitulo: any, otroIndex: number) => {
  //           if (index === otroIndex) return; // No comparar consigo mismo

  //           const contenidoOtro =
  //             otroSubcapitulo.contenido?.toLowerCase() || '';
  //           if (contenidoOtro.startsWith(nombreSubcapitulo)) {
  //             console.log(
  //               `❌ Eliminando subcapítulo "${subcapitulo.titulo}" - aparece en contenido de "${otroSubcapitulo.titulo}"`,
  //             );
  //             esDuplicado = true;
  //           }
  //         },
  //       );

  //       // Verificar si aparece al inicio del contenido del capítulo principal
  //       if (!esDuplicado && contenidoCapitulo.startsWith(nombreSubcapitulo)) {
  //         console.log(
  //           `❌ Eliminando subcapítulo "${subcapitulo.titulo}" - aparece en contenido del capítulo principal`,
  //         );
  //         esDuplicado = true;
  //       }

  //       if (esDuplicado) {
  //         subcapitulosAEliminar.push(index);
  //       }
  //     });

  //     // Eliminar los subcapítulos identificados (en orden inverso para evitar problemas de índices)
  //     subcapitulosAEliminar
  //       .sort((a, b) => b - a)
  //       .forEach((index) => {
  //         const subcapituloEliminado = capitulo.subCapitulos.splice(
  //           index,
  //           1,
  //         )[0];
  //         console.log(`✓ Eliminado: ${subcapituloEliminado.titulo}`);
  //         subcapitulosEliminados++;
  //       });
  //   });

  //   console.log(
  //     `Total subcapítulos eliminados por duplicación en contenido: ${subcapitulosEliminados}`,
  //   );
  // }

  // private extraerNombrePrincipal(tituloCompleto: string): string {
  //   if (!tituloCompleto) return '';

  //   // Eliminar la numeración del principio (ej: "9.1 ", "6.3 ", etc.)
  //   const tituloSinNumeracion = tituloCompleto.replace(
  //     /^\d+\.\d+\s*[:-]?\s*/,
  //     '',
  //   );

  //   // Eliminar viñetas y caracteres especiales del principio
  //   const tituloLimpio = tituloSinNumeracion.replace(/^[•\-\*]\s*/, '').trim();

  //   // Extraer solo la primera parte relevante (hasta cierto límite o caracteres especiales)
  //   const match = tituloLimpio.match(/^([^.•\-:]{5,50}?)(?=[.•\-:]|$)/);

  //   if (match && match[1]) {
  //     return match[1].trim();
  //   }

  //   return tituloLimpio;
  // }

  // private eliminarSubcapitulosConContenidoRepetido(capitulos: any[]): void {
  //   console.log('=== ELIMINANDO SUBCAPÍTULOS CON CONTENIDO REPETIDO ===');

  //   let eliminados = 0;

  //   capitulos.forEach((capitulo) => {
  //     const subcapitulosAEliminar: number[] = [];

  //     capitulo.subCapitulos.forEach((subcapitulo: any, index: number) => {
  //       const nombreSubcapitulo = this.extraerNombrePrincipal(
  //         subcapitulo.titulo,
  //       ).toLowerCase();

  //       if (!nombreSubcapitulo) return;

  //       // Buscar en todos los contenidos del capítulo
  //       let contenidoEncontrado = false;

  //       // Buscar en el contenido del capítulo principal
  //       if (capitulo.contenido?.toLowerCase().includes(nombreSubcapitulo)) {
  //         contenidoEncontrado = true;
  //       }

  //       // Buscar en el contenido de otros subcapítulos
  //       if (!contenidoEncontrado) {
  //         capitulo.subCapitulos.forEach(
  //           (otroSubcapitulo: any, otroIndex: number) => {
  //             if (
  //               index !== otroIndex &&
  //               otroSubcapitulo.contenido
  //                 ?.toLowerCase()
  //                 .includes(nombreSubcapitulo)
  //             ) {
  //               contenidoEncontrado = true;
  //             }
  //           },
  //         );
  //       }

  //       // Si el nombre aparece en algún contenido y este subcapítulo tiene poco contenido propio
  //       if (contenidoEncontrado && this.tienePocoContenidoPropio(subcapitulo)) {
  //         console.log(
  //           `❌ Eliminando subcapítulo redundante: "${subcapitulo.titulo}"`,
  //         );
  //         subcapitulosAEliminar.push(index);
  //       }
  //     });

  //     // Eliminar subcapítulos identificados
  //     subcapitulosAEliminar
  //       .sort((a, b) => b - a)
  //       .forEach((index) => {
  //         capitulo.subCapitulos.splice(index, 1);
  //         eliminados++;
  //       });
  //   });

  //   console.log(`Subcapítulos redundantes eliminados: ${eliminados}`);
  // }

  // private tienePocoContenidoPropio(subcapitulo: any): boolean {
  //   if (!subcapitulo.contenido) return true;

  //   const contenido = subcapitulo.contenido.trim();
  //   const longitud = contenido.length;

  //   // Considerar "poco contenido" si tiene menos de 50 caracteres
  //   // o si es muy similar al título
  //   const tituloPrincipal = this.extraerNombrePrincipal(
  //     subcapitulo.titulo,
  //   ).toLowerCase();
  //   const contenidoLower = contenido.toLowerCase();

  //   return longitud < 50 || contenidoLower.startsWith(tituloPrincipal);
  // }

  // private procesarPorNumeracion(html: string, capitulos: any[]): void {
  //   console.log('Buscando capítulos en formato <ol><li>...');

  //   // Buscar capítulos principales en listas ordenadas
  //   const capitulosPrincipales = this.buscarCapitulosPrincipales(html);

  //   if (capitulosPrincipales.length === 0) {
  //     console.log('No se encontraron capítulos principales');
  //     return;
  //   }

  //   // Buscar subcapítulos
  //   const subcapitulos = this.buscarSubcapitulos(html);

  //   // Construir la estructura jerárquica
  //   this.construirEstructuraJerarquica(
  //     capitulosPrincipales,
  //     subcapitulos,
  //     capitulos,
  //     html,
  //   );

  //   // NUEVO: Eliminar subcapítulos duplicados
  //   this.eliminarSubcapitulosDuplicadosPorContenido(capitulos);
  //   this.eliminarSubcapitulosConContenidoRepetido(capitulos);

  //   console.log(
  //     `Estructura final: ${capitulos.length} capítulos principales con ${subcapitulos.length} subcapítulos`,
  //   );
  // }

  // private buscarCapitulosPrincipales(html: string): any[] {
  //   const matches: any[] = [];

  //   // Primero, identificar todas las zonas de subcapítulos anidados
  //   const zonasExcluidas = this.identificarZonasSubcapitulos(html);

  //   // Buscar listas ordenadas con items que son capítulos
  //   const regexOl = /<ol[^>]*>(.*?)<\/ol>/gi;
  //   let matchOl;
  //   let contadorCapítulo = 1;

  //   while ((matchOl = regexOl.exec(html)) !== null) {
  //     const contenidoOl = matchOl[1];
  //     const posicionOl = matchOl.index;
  //     const finOl = posicionOl + matchOl[0].length;

  //     // VERIFICAR: Excluir si está dentro de una zona de subcapítulos
  //     if (this.estaEnZonaExcluida(posicionOl, finOl, zonasExcluidas)) {
  //       console.log(
  //         `Excluyendo OL en zona de subcapítulos: posición ${posicionOl}`,
  //       );
  //       continue;
  //     }

  //     // VERIFICAR: Excluir si es un subcapítulo (basado en estructura)
  //     if (this.esEstructuraDeSubcapitulo(contenidoOl, html, posicionOl)) {
  //       console.log(
  //         `Excluyendo OL que es estructura de subcapítulo: posición ${posicionOl}`,
  //       );
  //       continue;
  //     }

  //     // Extraer todos los <li> dentro de esta lista ordenada
  //     const regexLi = /<li[^>]*>(.*?)<\/li>/gi;
  //     let matchLi;

  //     while ((matchLi = regexLi.exec(contenidoOl)) !== null) {
  //       let titulo = matchLi[1].trim();
  //       const tituloOriginal = titulo;
  //       titulo = titulo.replace(/<[^>]+>/g, '').trim();

  //       // VERIFICAR: Excluir si el título tiene estructura de subcapítulo
  //       if (
  //         this.esTituloConEstructuraDeSubcapitulo(
  //           tituloOriginal,
  //           titulo,
  //           html,
  //           posicionOl,
  //         )
  //       ) {
  //         console.log(
  //           `Excluyendo título con estructura de subcapítulo: "${titulo}"`,
  //         );
  //         continue;
  //       }

  //       if (
  //         titulo.length > 1 &&
  //         this.esProbableCapituloPrincipal(titulo, html, posicionOl)
  //       ) {
  //         matches.push({
  //           numero: contadorCapítulo,
  //           titulo: titulo,
  //           startIndex: posicionOl,
  //           endIndex: finOl,
  //           tipo: 'principal',
  //         });
  //         contadorCapítulo++;
  //         // Solo un capítulo por lista ordenada (el primer <li> válido)
  //         break;
  //       }
  //     }
  //   }

  //   // Buscar capítulos en formato de párrafo (solo si son probables capítulos principales)
  //   const regexCapitulosParrafo =
  //     /<p[^>]*>\s*(\d+)(?:\.)?\s+([^<]+?)\s*<\/p>/gi;
  //   let matchParrafo;

  //   while ((matchParrafo = regexCapitulosParrafo.exec(html)) !== null) {
  //     const numero = parseInt(matchParrafo[1]);
  //     let titulo = matchParrafo[2].trim();
  //     titulo = titulo.replace(/<[^>]+>/g, '').trim();

  //     // Verificar que sea un capítulo válido y no un subcapítulo
  //     const esSubcapitulo = titulo.match(/^\d+\.\d/);
  //     const esNumeroValido = numero >= 1 && numero <= 50;
  //     const esProbableCapitulo = this.esProbableCapituloPrincipal(
  //       titulo,
  //       html,
  //       matchParrafo.index,
  //     );

  //     if (!esSubcapitulo && esNumeroValido && esProbableCapitulo) {
  //       // Verificar que no esté en una zona excluida
  //       const posicionParrafo = matchParrafo.index;
  //       const finParrafo = posicionParrafo + matchParrafo[0].length;

  //       if (
  //         !this.estaEnZonaExcluida(posicionParrafo, finParrafo, zonasExcluidas)
  //       ) {
  //         // Verificar que no sea un duplicado de un capítulo ya detectado
  //         const esDuplicado = matches.some((m) => m.numero === numero);

  //         if (!esDuplicado) {
  //           matches.push({
  //             numero: numero,
  //             titulo: titulo,
  //             startIndex: posicionParrafo,
  //             endIndex: finParrafo,
  //             tipo: 'parrafo',
  //           });
  //           console.log(`Capítulo en párrafo detectado: ${numero}. ${titulo}`);
  //         }
  //       }
  //     }
  //   }

  //   // Ordenar todos los capítulos por número
  //   matches.sort((a, b) => a.numero - b.numero);

  //   console.log(`Capítulos principales detectados: ${matches.length}`);
  //   matches.forEach((match) => {
  //     console.log(`- ${match.numero}. ${match.titulo} [${match.tipo}]`);
  //   });

  //   return matches;
  // }

  // private esEstructuraDeSubcapitulo(
  //   contenidoOl: string,
  //   html: string,
  //   posicion: number,
  // ): boolean {
  //   // EXCLUIR: CUALQUIER lista NO ORDENADA (<ul>) es contenido, no subcapítulo
  //   const esListaNoOrdenada = /<ul[^>]*>/i.test(contenidoOl);
  //   if (esListaNoOrdenada) {
  //     console.log(
  //       `Excluyendo lista no ordenada (<ul>): ${contenidoOl.substring(0, 50)}...`,
  //     );
  //     return true;
  //   }
  //   // 1. EXCLUIR: CUALQUIER lista que contenga <li><strong> es subcapítulo
  //   const tieneLiConStrong =
  //     /<li[^>]*>.*?<strong[^>]*>.*?<\/strong>.*?<\/li>/i.test(contenidoOl);
  //   if (tieneLiConStrong) {
  //     console.log(
  //       `Excluyendo por estructura <li><strong>: ${contenidoOl.substring(0, 50)}...`,
  //     );
  //     return true;
  //   }

  //   // 2. EXCLUIR: Listas con <li><a><strong> son subcapítulos
  //   const tieneLiConLinkYStrong =
  //     /<li[^>]*>.*?<a[^>]*>.*?<strong[^>]*>.*?<\/strong>.*?<\/a>.*?<\/li>/i.test(
  //       contenidoOl,
  //     );
  //   if (tieneLiConLinkYStrong) {
  //     console.log(
  //       `Excluyendo por estructura <li><a><strong>: ${contenidoOl.substring(0, 50)}...`,
  //     );
  //     return true;
  //   }

  //   // 3. Verificar si contiene elementos <strong> (común en subcapítulos)
  //   const tieneStrong = /<strong[^>]*>/i.test(contenidoOl);

  //   // 4. Verificar si contiene elementos <a> con id (común en subcapítulos)
  //   const tieneLinkConId = /<a[^>]*id[^>]*>/i.test(contenidoOl);

  //   // 5. Verificar si está después de un capítulo principal
  //   const esDespuesDeCapitulo = this.estaDespuesDeCapituloPrincipal(
  //     html,
  //     posicion,
  //   );

  //   // 6. Verificar si el contenido del OL tiene múltiples <li> (común en listas de subcapítulos)
  //   const cantidadLi = (contenidoOl.match(/<li[^>]*>/gi) || []).length;
  //   const tieneMultiplesLi = cantidadLi > 1;

  //   // 7. Verificar si el contenido es muy corto o instruccional
  //   const contenidoLimpio = contenidoOl.replace(/<[^>]+>/g, '').trim();
  //   const esContenidoCorto = contenidoLimpio.length < 150;
  //   const esInstruccional = /(evite|verifique|asegúrese|utilice|realice)/i.test(
  //     contenidoLimpio,
  //   );

  //   // Es probable subcapítulo si:
  //   // - Tiene estructura <li><strong> O <li><a><strong> (EXCLUSIÓN ABSOLUTA)
  //   // - O tiene strong/link con id Y está después de capítulo
  //   // - O tiene múltiples li Y es contenido corto/instruccional
  //   // - O es instruccional Y está después de capítulo
  //   return (
  //     tieneLiConStrong ||
  //     tieneLiConLinkYStrong ||
  //     ((tieneStrong || tieneLinkConId) && esDespuesDeCapitulo) ||
  //     (tieneMultiplesLi && esContenidoCorto) ||
  //     (esInstruccional && esDespuesDeCapitulo)
  //   );
  // }

  // private esTituloConEstructuraDeSubcapitulo(
  //   tituloOriginal: string,
  //   tituloLimpio: string,
  //   html: string,
  //   posicion: number,
  // ): boolean {
  //   // 1. EXCLUIR: CUALQUIER título que tenga <strong> en el original es subcapítulo
  //   const tieneStrong = /<strong[^>]*>/i.test(tituloOriginal);
  //   if (tieneStrong) {
  //     console.log(`Excluyendo título con <strong>: "${tituloLimpio}"`);
  //     return true;
  //   }

  //   // 2. EXCLUIR: Títulos con <a><strong> son subcapítulos
  //   const tieneLinkYStrong =
  //     /<a[^>]*>.*?<strong[^>]*>.*?<\/strong>.*?<\/a>/i.test(tituloOriginal);
  //   if (tieneLinkYStrong) {
  //     console.log(`Excluyendo título con <a><strong>: "${tituloLimpio}"`);
  //     return true;
  //   }

  //   // 3. Verificar si el título limpio es instruccional o muy específico
  //   const esInstruccional =
  //     /(evite|verifique|asegúrese|utilice|realice|volumen|identificación|características|organolépticas|bulbo)/i.test(
  //       tituloLimpio,
  //     );
  //   const esTituloEspecifico = tituloLimpio.length < 60;

  //   // 4. Verificar si está después de un capítulo principal
  //   const esDespuesDeCapitulo = this.estaDespuesDeCapituloPrincipal(
  //     html,
  //     posicion,
  //   );

  //   // Es probable subcapítulo si:
  //   // - Tiene estructura específica (strong/link) Y está después de capítulo
  //   // - O es instruccional/específico Y está después de capítulo
  //   return (
  //     (tieneStrong || tieneLinkYStrong || esInstruccional) &&
  //     esDespuesDeCapitulo &&
  //     esTituloEspecifico
  //   );
  // }

  // private estaDespuesDeCapituloPrincipal(
  //   html: string,
  //   posicion: number,
  // ): boolean {
  //   // Buscar si hay algún capítulo principal antes de esta posición
  //   const htmlAntes = html.substring(0, posicion);

  //   // Buscar capítulos principales (listas ordenadas con numeración)
  //   const tieneCapituloAntes =
  //     /<ol[^>]*>.*?<li[^>]*>\s*\d+\./i.test(htmlAntes) ||
  //     /<p[^>]*>\s*\d+\.\s+[^<]+<\/p>/i.test(htmlAntes);

  //   return tieneCapituloAntes;
  // }

  // private esProbableCapituloPrincipal(
  //   titulo: string,
  //   html: string,
  //   posicion: number,
  // ): boolean {
  //   // 1. Capítulos principales suelen ser más largos y descriptivos
  //   const esTituloLargo = titulo.length > 10;

  //   // 2. Capítulos principales suelen tener palabras clave comunes
  //   const palabrasClave = [
  //     'objetivo',
  //     'alcance',
  //     'responsabilidad',
  //     'equipamiento',
  //     'procedimiento',
  //     'cálculo',
  //     'documentación',
  //     'aprobación',
  //     'evolución',
  //     'estabilidad',
  //     'información',
  //     'composición',
  //     'identificación',
  //     'manipulación',
  //     'control',
  //   ];
  //   const tienePalabraClave = palabrasClave.some((palabra) =>
  //     titulo.toLowerCase().includes(palabra.toLowerCase()),
  //   );

  //   // 3. Verificar si está al inicio del documento o después de pocos contenidos
  //   const esAlInicio = posicion < html.length * 0.3; // En el 30% inicial del documento

  //   return esTituloLargo || tienePalabraClave || esAlInicio;
  // }

  // private identificarZonasSubcapitulos(
  //   html: string,
  // ): { start: number; end: number }[] {
  //   const zonas: { start: number; end: number }[] = [];

  //   // Buscar todas las estructuras <ul><li><ol> que contienen subcapítulos
  //   const regexSubcapitulos =
  //     /<ul[^>]*>.*?<li[^>]*>.*?<ol[^>]*>.*?<\/ol>.*?<\/li>.*?<\/ul>/gi;
  //   let match;

  //   while ((match = regexSubcapitulos.exec(html)) !== null) {
  //     zonas.push({
  //       start: match.index,
  //       end: match.index + match[0].length,
  //     });
  //     console.log(
  //       `Zona de subcapítulos identificada: ${match.index} - ${match.index + match[0].length}`,
  //     );
  //   }

  //   return zonas;
  // }

  // private estaEnZonaExcluida(
  //   start: number,
  //   end: number,
  //   zonasExcluidas: { start: number; end: number }[],
  // ): boolean {
  //   for (const zona of zonasExcluidas) {
  //     // Si se superpone con alguna zona excluida
  //     if (start < zona.end && end > zona.start) {
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  // private buscarSubcapitulos(html: string): any[] {
  //   const matches: any[] = [];

  //   // 1. PRIMERO: Buscar subcapítulos en formato fuerte (máxima prioridad)
  //   const subcapitulosFuerte = this.buscarSubcapitulosFormatoFuerte(html);

  //   // 2. SEGUNDO: Buscar subcapítulos anidados
  //   const subcapitulosAnidados = this.buscarSubcapitulosAnidados(html, matches);

  //   // 3. TERCERO: Buscar subcapítulos numerados (menor prioridad)
  //   const subcapitulosNumerados = this.buscarSubcapitulosNumerados(html);

  //   // Combinar con prioridad y eliminar duplicados
  //   this.combinarSubcapitulosConPrioridad(
  //     matches,
  //     subcapitulosFuerte,
  //     subcapitulosAnidados,
  //     subcapitulosNumerados,
  //   );

  //   console.log(`Subcapítulos detectados: ${matches.length}`);
  //   matches.forEach((match) => {
  //     console.log(`- ${match.numeroCompleto} ${match.titulo} [${match.tipo}]`);
  //   });

  //   return matches;
  // }

  // private combinarSubcapitulosConPrioridad(
  //   matches: any[],
  //   subcapitulosFuerte: any[],
  //   subcapitulosAnidados: any[],
  //   subcapitulosNumerados: any[],
  // ): void {
  //   const titulosUsados = new Set<string>();

  //   // 1. Agregar subcapítulos FUERTE (máxima prioridad) - SOLO de <ol>
  //   subcapitulosFuerte.forEach((sub) => {
  //     const clave = `${sub.capituloPrincipal}-${sub.titulo.toLowerCase().trim()}`;
  //     if (!titulosUsados.has(clave)) {
  //       matches.push(sub);
  //       titulosUsados.add(clave);
  //       console.log(
  //         `✓ Agregado formato fuerte: ${sub.numeroCompleto} ${sub.titulo}`,
  //       );
  //     }
  //   });

  //   // 2. Agregar subcapítulos ANIDADOS (segunda prioridad) - SOLO de <ol> dentro de <ul>
  //   subcapitulosAnidados.forEach((sub) => {
  //     const clave = `${sub.capituloPrincipal}-${sub.titulo.toLowerCase().trim()}`;
  //     if (!titulosUsados.has(clave)) {
  //       matches.push(sub);
  //       titulosUsados.add(clave);
  //       console.log(`✓ Agregado anidado: ${sub.numeroCompleto} ${sub.titulo}`);
  //     } else {
  //       console.log(`✗ Duplicado eliminado (anidado): ${sub.titulo}`);
  //     }
  //   });

  //   // 3. Agregar subcapítulos NUMERADOS (tercera prioridad) - SOLO de <p>
  //   subcapitulosNumerados.forEach((sub) => {
  //     const clave = `${sub.capituloPrincipal}-${sub.titulo.toLowerCase().trim()}`;
  //     if (!titulosUsados.has(clave)) {
  //       matches.push(sub);
  //       titulosUsados.add(clave);
  //       console.log(`✓ Agregado numerado: ${sub.numeroCompleto} ${sub.titulo}`);
  //     } else {
  //       console.log(`✗ Duplicado eliminado (numerado): ${sub.titulo}`);
  //     }
  //   });

  //   // Re-numerar todos los subcapítulos por capítulo padre
  //   this.renumerarSubcapitulosPorCapitulo(matches);
  // }

  // private renumerarSubcapitulosPorCapitulo(matches: any[]): void {
  //   // Agrupar por capítulo padre
  //   const porCapitulo = new Map<number, any[]>();

  //   matches.forEach((sub) => {
  //     if (!porCapitulo.has(sub.capituloPrincipal)) {
  //       porCapitulo.set(sub.capituloPrincipal, []);
  //     }
  //     porCapitulo.get(sub.capituloPrincipal)!.push(sub);
  //   });

  //   // Renumerar cada grupo
  //   porCapitulo.forEach((subs, capituloPadre) => {
  //     // Ordenar por posición en el documento
  //     subs.sort((a, b) => a.startIndex - b.startIndex);

  //     // Renumerar secuencialmente empezando desde 1
  //     subs.forEach((sub, index) => {
  //       const nuevoNumero = index + 1;
  //       sub.numero = nuevoNumero;
  //       sub.numeroCompleto = `${capituloPadre}.${nuevoNumero}`;
  //     });

  //     console.log(
  //       `Capítulo ${capituloPadre}: ${subs.length} subcapítulos renumerados`,
  //     );
  //   });
  // }

  // private buscarSubcapitulosFormatoFuerte(html: string): any[] {
  //   const matches: any[] = [];

  //   // Buscar SOLO en listas ORDENADAS (<ol>), excluir listas no ordenadas (<ul>)
  //   const regexFuerte =
  //     /<ol[^>]*>.*?<li[^>]*>.*?<strong[^>]*>(.*?)<\/strong>.*?<\/li>.*?<\/ol>/gi;
  //   let matchFuerte;

  //   while ((matchFuerte = regexFuerte.exec(html)) !== null) {
  //     let titulo = matchFuerte[1].trim();
  //     titulo = titulo.replace(/<[^>]+>/g, '').trim();

  //     if (titulo.length > 1) {
  //       // Determinar el capítulo padre
  //       const capituloPadre = this.determinarCapituloPadreParaSubcapituloFuerte(
  //         html,
  //         matchFuerte.index,
  //       );
  //       if (capituloPadre) {
  //         // Numeración temporal, se corregirá después
  //         matches.push({
  //           capituloPrincipal: capituloPadre,
  //           numero: 1, // Temporal
  //           titulo: titulo,
  //           startIndex: matchFuerte.index,
  //           endIndex: matchFuerte.index + matchFuerte[0].length,
  //           numeroCompleto: `${capituloPadre}.1`, // Temporal
  //           tipo: 'formato-fuerte',
  //         });

  //         console.log(
  //           `Subcapítulo formato fuerte detectado: ${capituloPadre}.? ${titulo}`,
  //         );
  //       }
  //     }
  //   }

  //   return matches;
  // }

  // private buscarSubcapitulosAnidados(
  //   html: string,
  //   matchesExistentes: any[],
  // ): any[] {
  //   const matches: any[] = [];

  //   // Buscar subcapítulos anidados: <ul><li><ol><li>Texto</li></ol></li></ul>
  //   const regexAnidado =
  //     /<ul[^>]*>.*?<li[^>]*>.*?<ol[^>]*>(.*?)<\/ol>.*?<\/li>.*?<\/ul>/gi;
  //   let matchAnidado;

  //   while ((matchAnidado = regexAnidado.exec(html)) !== null) {
  //     const contenidoOl = matchAnidado[1];
  //     const posicionBase = matchAnidado.index;

  //     // Determinar el capítulo padre
  //     const capituloPadre = this.determinarCapituloPadreParaSubcapituloFuerte(
  //       html,
  //       posicionBase,
  //     );
  //     if (!capituloPadre) continue;

  //     // Extraer todos los <li> dentro de este OL anidado
  //     const regexLi = /<li[^>]*>(.*?)<\/li>/gi;
  //     let matchLi;

  //     while ((matchLi = regexLi.exec(contenidoOl)) !== null) {
  //       let titulo = matchLi[1].trim();
  //       titulo = titulo.replace(/<[^>]+>/g, '').trim();

  //       if (titulo.length > 1) {
  //         // Numeración temporal, se corregirá después
  //         matches.push({
  //           capituloPrincipal: capituloPadre,
  //           numero: 1, // Temporal
  //           titulo: titulo,
  //           startIndex: posicionBase,
  //           endIndex: posicionBase + matchAnidado[0].length,
  //           numeroCompleto: `${capituloPadre}.1`, // Temporal
  //           tipo: 'anidado',
  //         });
  //       }
  //     }
  //   }

  //   return matches;
  // }

  // private determinarCapituloPadreParaSubcapituloFuerte(
  //   html: string,
  //   posicion: number,
  // ): number {
  //   // Buscar el capítulo principal más cercano antes de esta posición
  //   const regexCapitulo = /<ol[^>]*>.*?<li[^>]*>(.*?)<\/li>.*?<\/ol>/gi;
  //   let ultimoCapitulo = 0;
  //   let match;

  //   regexCapitulo.lastIndex = 0;

  //   while ((match = regexCapitulo.exec(html)) !== null) {
  //     if (match.index < posicion) {
  //       const titulo = match[1].replace(/<[^>]+>/g, '').trim();
  //       const numeroMatch = titulo.match(/^(\d+)\./);
  //       if (numeroMatch) {
  //         ultimoCapitulo = parseInt(numeroMatch[1]);
  //       } else {
  //         const capitulosAntes =
  //           html.substring(0, posicion).match(/<ol[^>]*>/gi) || [];
  //         ultimoCapitulo = capitulosAntes.length;
  //       }
  //     } else {
  //       break;
  //     }
  //   }

  //   return ultimoCapitulo;
  // }

  // private buscarSubcapitulosNumerados(html: string): any[] {
  //   const matches: any[] = [];

  //   // Buscar SOLO en párrafos (<p>), excluir listas (<ul>, <ol>)
  //   const regexConPunto = /<p[^>]*>\s*(\d+)\.(\d+)\.\s+([^<]+?)\s*<\/p>/gi;
  //   let matchConPunto;

  //   while ((matchConPunto = regexConPunto.exec(html)) !== null) {
  //     const capituloPrincipal = parseInt(matchConPunto[1]);
  //     const subcapituloNum = parseInt(matchConPunto[2]);
  //     let titulo = matchConPunto[3].trim();

  //     titulo = titulo.replace(/<[^>]+>/g, '').trim();

  //     if (this.esSubcapituloValido(capituloPrincipal, subcapituloNum, titulo)) {
  //       matches.push({
  //         capituloPrincipal: capituloPrincipal,
  //         numero: subcapituloNum,
  //         titulo: titulo,
  //         startIndex: matchConPunto.index,
  //         endIndex: matchConPunto.index + matchConPunto[0].length,
  //         numeroCompleto: `${capituloPrincipal}.${subcapituloNum}`,
  //         tipo: 'numerado',
  //       });

  //       console.log(
  //         `Subcapítulo numerado detectado: ${capituloPrincipal}.${subcapituloNum} ${titulo}`,
  //       );
  //     }
  //   }

  //   // Buscar subcapítulos con formato: <p>5.1 Texto</p> o <p>3.2 Texto</p> (sin punto final)
  //   const regexSimple = /<p[^>]*>\s*(\d+)\.(\d+)\s+([^<]+?)\s*<\/p>/gi;
  //   let matchSimple;

  //   while ((matchSimple = regexSimple.exec(html)) !== null) {
  //     const capituloPrincipal = parseInt(matchSimple[1]);
  //     const subcapituloNum = parseInt(matchSimple[2]);
  //     let titulo = matchSimple[3].trim();

  //     titulo = titulo.replace(/<[^>]+>/g, '').trim();

  //     if (this.esSubcapituloValido(capituloPrincipal, subcapituloNum, titulo)) {
  //       matches.push({
  //         capituloPrincipal: capituloPrincipal,
  //         numero: subcapituloNum,
  //         titulo: titulo,
  //         startIndex: matchSimple.index,
  //         endIndex: matchSimple.index + matchSimple[0].length,
  //         numeroCompleto: `${capituloPrincipal}.${subcapituloNum}`,
  //         tipo: 'numerado',
  //       });

  //       console.log(
  //         `Subcapítulo numerado detectado: ${capituloPrincipal}.${subcapituloNum} ${titulo}`,
  //       );
  //     }
  //   }

  //   return matches;
  // }

  // private determinarCapituloPadreCorrecto(
  //   html: string,
  //   posicion: number,
  // ): number {
  //   // Buscar todos los subcapítulos numerados con formato 5.8, 5.8.1, 5.8.2, etc.
  //   const regexSubcapitulo =
  //     /<p[^>]*>\s*(\d+)\.(\d+(?:\.\d+)*)\s+([^<]+?)\s*<\/p>/gi;
  //   const subcapitulos: { capituloPadre: number; endIndex: number }[] = [];
  //   let match;

  //   // Reiniciar el regex para buscar desde el inicio
  //   regexSubcapitulo.lastIndex = 0;

  //   // Recopilar todos los subcapítulos numerados junto con su capítulo padre y su posición de fin
  //   while ((match = regexSubcapitulo.exec(html)) !== null) {
  //     const capituloPadre = parseInt(match[1]); // Capítulo principal (por ejemplo, 5)

  //     subcapitulos.push({
  //       capituloPadre: capituloPadre,
  //       endIndex: match.index + match[0].length,
  //     });
  //   }

  //   // Filtrar subcapítulos antes de la posición
  //   const subcapitulosAntes = subcapitulos.filter((s) => s.endIndex < posicion);
  //   if (subcapitulosAntes.length === 0) {
  //     // Si no hay subcapítulos antes, buscar el capítulo principal más cercano
  //     return this.determinarCapituloPadrePorCapitulos(html, posicion);
  //   }

  //   // Agrupar por capítulo padre y encontrar el que tenga más subcapítulos cercanos
  //   const capitulosCount = new Map<number, number>();

  //   subcapitulosAntes.forEach((s) => {
  //     const count = capitulosCount.get(s.capituloPadre) || 0;
  //     capitulosCount.set(s.capituloPadre, count + 1);
  //   });

  //   // Encontrar el capítulo con más subcapítulos antes de la posición
  //   let capituloPadreMasComun = 0;
  //   let maxCount = 0;

  //   for (const [capituloPadre, count] of capitulosCount) {
  //     if (count > maxCount) {
  //       maxCount = count;
  //       capituloPadreMasComun = capituloPadre;
  //     }
  //   }

  //   console.log(
  //     `Para posición ${posicion}, capítulo padre determinado: ${capituloPadreMasComun} (con ${maxCount} subcapítulos antes)`,
  //   );

  //   return capituloPadreMasComun;
  // }

  // private determinarCapituloPadrePorCapitulos(
  //   html: string,
  //   posicion: number,
  // ): number {
  //   // Método de respaldo: buscar por capítulos principales
  //   const regexCapitulo = /<ol[^>]*>.*?<li[^>]*>(.*?)<\/li>.*?<\/ol>/gi;
  //   const capitulos: { numero: number; endIndex: number }[] = [];
  //   let match;

  //   regexCapitulo.lastIndex = 0;

  //   while ((match = regexCapitulo.exec(html)) !== null) {
  //     const titulo = match[1].replace(/<[^>]+>/g, '').trim();
  //     const numeroMatch = titulo.match(/^(\d+)\./);
  //     let numero = 0;

  //     if (numeroMatch) {
  //       numero = parseInt(numeroMatch[1]);
  //     } else {
  //       const capitulosAntes =
  //         html.substring(0, match.index).match(/<ol[^>]*>/gi) || [];
  //       numero = capitulosAntes.length;
  //     }

  //     capitulos.push({
  //       numero: numero,
  //       endIndex: match.index + match[0].length,
  //     });
  //   }

  //   const capitulosAntes = capitulos.filter((c) => c.endIndex < posicion);
  //   if (capitulosAntes.length === 0) {
  //     return 0;
  //   }

  //   capitulosAntes.sort(
  //     (a, b) =>
  //       Math.abs(posicion - a.endIndex) - Math.abs(posicion - b.endIndex),
  //   );

  //   const capituloPadre = capitulosAntes[0].numero;
  //   console.log(
  //     `Para posición ${posicion}, capítulo padre determinado por capítulo cercano: ${capituloPadre}`,
  //   );
  //   return capituloPadre;
  // }

  // private esSubcapituloValido(
  //   capituloPrincipal: number,
  //   subcapituloNum: number,
  //   titulo: string,
  // ): boolean {
  //   return (
  //     capituloPrincipal >= 1 &&
  //     capituloPrincipal <= 30 &&
  //     subcapituloNum >= 1 &&
  //     subcapituloNum <= 50 &&
  //     titulo.length > 1
  //   );
  // }

  // private crearSubcapituloMatch(
  //   capituloPrincipal: number,
  //   subcapituloNum: number,
  //   titulo: string,
  //   match: RegExpExecArray,
  //   tipo: string = 'simple',
  // ): any {
  //   return {
  //     capituloPrincipal: capituloPrincipal,
  //     numero: subcapituloNum,
  //     titulo: titulo,
  //     startIndex: match.index,
  //     endIndex: match.index + match[0].length,
  //     numeroCompleto: `${capituloPrincipal}.${subcapituloNum}`,
  //     tipo: tipo,
  //   };
  // }
  // private limpiarContenidoHTML(html: string): string {
  //   if (!html) return '';

  //   let contenido = html;

  //   // Primero, preservar saltos de línea importantes
  //   contenido = contenido
  //     .replace(/<p[^>]*>/gi, '\n') // Párrafos a saltos de línea
  //     .replace(/<\/p>/gi, '\n') // Cierre de párrafos
  //     .replace(/<br[^>]*>/gi, '\n') // <br> a saltos de línea
  //     .replace(/<div[^>]*>/gi, '\n') // Divs a saltos de línea
  //     .replace(/<\/div>/gi, '\n'); // Cierre de divs

  //   // Preservar listas pero con formato legible
  //   contenido = contenido
  //     .replace(/<li[^>]*>/gi, '\n• ') // Items de lista con viñetas
  //     .replace(/<\/li>/gi, '\n') // Cierre de items de lista
  //     .replace(/<ul[^>]*>/gi, '\n') // Listas no ordenadas
  //     .replace(/<\/ul>/gi, '\n')
  //     .replace(/<ol[^>]*>/gi, '\n') // Listas ordenadas
  //     .replace(/<\/ol>/gi, '\n');

  //   // Preservar elementos de texto importantes
  //   contenido = contenido
  //     .replace(/<strong[^>]*>/gi, '**') // Negrita
  //     .replace(/<\/strong>/gi, '**')
  //     .replace(/<b[^>]*>/gi, '**') // Negrita alternativa
  //     .replace(/<\/b>/gi, '**')
  //     .replace(/<em[^>]*>/gi, '*') // Cursiva
  //     .replace(/<\/em>/gi, '*')
  //     .replace(/<i[^>]*>/gi, '*') // Cursiva alternativa
  //     .replace(/<\/i>/gi, '*');

  //   // Eliminar todas las demás etiquetas HTML
  //   contenido = contenido.replace(/<[^>]+>/g, '');

  //   // Limpiar y normalizar espacios y saltos de línea
  //   contenido = contenido
  //     .replace(/\s+/g, ' ') // Normalizar espacios múltiples
  //     .replace(/\n\s+/g, '\n') // Limpiar espacios después de saltos
  //     .replace(/\s+\n/g, '\n') // Limpiar espacios antes de saltos
  //     .replace(/\n{3,}/g, '\n\n') // Máximo 2 saltos consecutivos
  //     .trim();

  //   // Preservar caracteres especiales importantes
  //   contenido = contenido
  //     .replace(/&nbsp;/g, ' ') // Espacios no breaking
  //     .replace(/&amp;/g, '&') // Ampersand
  //     .replace(/&lt;/g, '<') // Menor que
  //     .replace(/&gt;/g, '>') // Mayor que
  //     .replace(/&quot;/g, '"') // Comillas
  //     .replace(/&#39;/g, "'"); // Apóstrofe

  //   return contenido;
  // }

  // private detectarElementosEnContenido(elemento: any, contenido: string): void {
  //   // Detectar placeholders
  //   const placeholders = contenido.match(/\{\{.*?\}\}/g);
  //   if (placeholders?.length) {
  //     elemento.placeholders.push(...placeholders);
  //   }

  //   // Detectar anexos
  //   const anexos = contenido.match(/Anexo\s+\d+/gi);
  //   if (anexos?.length) {
  //     elemento.anexos.push(...anexos);
  //   }
  // }

  // private construirEstructuraJerarquica(
  //   capitulosPrincipales: any[],
  //   subcapitulos: any[],
  //   capitulos: any[],
  //   html: string,
  // ): void {
  //   // Ordenar capítulos principales por posición en el documento
  //   capitulosPrincipales.sort((a, b) => a.startIndex - b.startIndex);

  //   // Crear todos los capítulos principales
  //   capitulosPrincipales.forEach((capituloMatch, index) => {
  //     const capitulo = this.crearCapitulo(
  //       `${capituloMatch.numero}. ${capituloMatch.titulo}`,
  //     );

  //     // Asignar propiedades adicionales para referencia
  //     capitulo._matchData = capituloMatch;
  //     capitulo._index = index;

  //     capitulos.push(capitulo);
  //   });

  //   console.log(`Creados ${capitulos.length} capítulos principales`);

  //   // Asignar subcapítulos a sus capítulos principales correspondientes
  //   if (subcapitulos.length > 0) {
  //     this.asignarSubcapitulosACapitulos(subcapitulos, capitulos);
  //   }

  //   // Asignar contenido a capítulos y subcapítulos
  //   this.asignarContenidoEstructuraCompleta(
  //     html,
  //     capitulosPrincipales,
  //     subcapitulos,
  //     capitulos,
  //   );

  //   // Limpiar datos temporales
  //   this.limpiarDatosTemporales(capitulos);
  // }

  // private asignarSubcapitulosACapitulos(
  //   subcapitulos: any[],
  //   capitulos: any[],
  // ): void {
  //   let subcapitulosAsignados = 0;

  //   // Ordenar subcapítulos por posición en el documento
  //   subcapitulos.sort((a, b) => a.startIndex - b.startIndex);

  //   // Agrupar subcapítulos por capítulo padre
  //   const subcapitulosPorCapitulo = new Map<number, any[]>();

  //   subcapitulos.forEach((subcapitulo) => {
  //     if (!subcapitulosPorCapitulo.has(subcapitulo.capituloPrincipal)) {
  //       subcapitulosPorCapitulo.set(subcapitulo.capituloPrincipal, []);
  //     }
  //     subcapitulosPorCapitulo
  //       .get(subcapitulo.capituloPrincipal)!
  //       .push(subcapitulo);
  //   });

  //   // Asignar subcapítulos a sus capítulos padres
  //   subcapitulosPorCapitulo.forEach((subsDelCapitulo, numeroCapitulo) => {
  //     const capituloPadre = capitulos.find((c) => {
  //       const num = parseInt(c.titulo.split('.')[0]);
  //       return num === numeroCapitulo;
  //     });

  //     if (capituloPadre) {
  //       // Ordenar subcapítulos por número
  //       subsDelCapitulo.sort((a, b) => a.numero - b.numero);

  //       subsDelCapitulo.forEach((subcapituloMatch) => {
  //         // Verificar si ya existe un subcapítulo con este número
  //         const subcapituloExistente = capituloPadre.subCapitulos.find(
  //           (s: any) => s.titulo.startsWith(subcapituloMatch.numeroCompleto),
  //         );

  //         if (!subcapituloExistente) {
  //           const subcapitulo = this.crearSubCapitulo(
  //             `${subcapituloMatch.numeroCompleto} ${subcapituloMatch.titulo}`,
  //           );

  //           subcapitulo._matchData = subcapituloMatch;
  //           subcapitulo._capituloPadre = capituloPadre.titulo;

  //           capituloPadre.subCapitulos.push(subcapitulo);
  //           subcapitulosAsignados++;

  //           console.log(
  //             `Subcapítulo ${subcapituloMatch.numeroCompleto} asignado a capítulo ${subcapituloMatch.capituloPrincipal}`,
  //           );
  //         }
  //       });
  //     } else {
  //       console.warn(
  //         `No se encontró capítulo padre ${numeroCapitulo} para ${subsDelCapitulo.length} subcapítulos`,
  //       );
  //     }
  //   });

  //   console.log(
  //     `Subcapítulos asignados: ${subcapitulosAsignados} de ${subcapitulos.length}`,
  //   );
  // }

  // private asignarContenidoEstructuraCompleta(
  //   html: string,
  //   capitulosPrincipales: any[],
  //   subcapitulos: any[],
  //   capitulos: any[],
  // ): void {
  //   console.log('=== ASIGNANDO CONTENIDO A CAPÍTULOS Y SUBCAPÍTULOS ===');

  //   // Ordenar capítulos por posición
  //   const todosLosCapitulos = [...capitulosPrincipales];
  //   todosLosCapitulos.sort((a, b) => a.startIndex - b.startIndex);

  //   // Calcular rangos de contenido para cada capítulo
  //   const rangosCapitulos = this.calcularRangosContenidoCapitulos(
  //     html,
  //     todosLosCapitulos,
  //     subcapitulos,
  //   );

  //   // Primero extraer todas las tablas para poder filtrar su contenido
  //   const todasLasTablas = this.extraerTodasLasTablasConContenido(html);

  //   // Asignar contenido a cada capítulo principal
  //   rangosCapitulos.forEach((rango, index) => {
  //     const capitulo = capitulos[index];
  //     if (!capitulo) return;

  //     const contenidoHtml = html.substring(
  //       rango.inicioContenido,
  //       rango.finContenido,
  //     );

  //     // Filtrar subcapítulos del contenido del capítulo principal
  //     let contenidoFiltrado = this.filtrarSubcapitulosDelContenido(
  //       contenidoHtml,
  //       subcapitulos,
  //     );

  //     // Filtrar contenido que pertenece a las tablas de este capítulo
  //     contenidoFiltrado = this.filtrarContenidoDeTablas(
  //       contenidoFiltrado,
  //       todasLasTablas,
  //       rango.inicioContenido,
  //     );

  //     const contenidoLimpio = this.limpiarContenidoHTML(contenidoFiltrado);

  //     if (contenidoLimpio.length > 10) {
  //       capitulo.contenido = contenidoLimpio;
  //       this.detectarElementosEnContenido(capitulo, contenidoLimpio);

  //       console.log(
  //         `✓ Capítulo ${capitulo.titulo}: ${contenidoLimpio.substring(0, 100)}...`,
  //       );
  //     } else {
  //       console.log(`⚠ Capítulo ${capitulo.titulo}: contenido insuficiente`);
  //       capitulo.contenido = '';
  //     }
  //   });

  //   // Ahora asignar contenido a los subcapítulos
  //   this.asignarContenidoSubcapitulos(
  //     html,
  //     subcapitulos,
  //     capitulos,
  //     todasLasTablas,
  //   );

  //   // Procesar tablas
  //   this.procesarTablasEnEstructuraCompleta(html, capitulos);
  // }

  // private obtenerFinContenidoSubcapitulo(
  //   html: string,
  //   subcapitulos: any[],
  //   indexActual: number,
  // ): number {
  //   const subcapituloActual = subcapitulos[indexActual];

  //   // 1. Si hay siguiente subcapítulo del MISMO capítulo, el contenido termina ahí
  //   const siguienteSubcapituloMismoCapitulo = subcapitulos
  //     .slice(indexActual + 1)
  //     .find(
  //       (sub) => sub.capituloPrincipal === subcapituloActual.capituloPrincipal,
  //     );

  //   if (siguienteSubcapituloMismoCapitulo) {
  //     return siguienteSubcapituloMismoCapitulo.startIndex;
  //   }

  //   // 2. Si hay siguiente subcapítulo de OTRO capítulo, el contenido termina ahí
  //   const siguienteSubcapituloOtroCapitulo = subcapitulos
  //     .slice(indexActual + 1)
  //     .find(
  //       (sub) => sub.capituloPrincipal > subcapituloActual.capituloPrincipal,
  //     );

  //   if (siguienteSubcapituloOtroCapitulo) {
  //     return siguienteSubcapituloOtroCapitulo.startIndex;
  //   }

  //   // 3. Buscar siguiente capítulo principal
  //   const regexCapitulo =
  //     /<ol[^>]*>.*?<li[^>]*>.*?<\/li>.*?<\/ol>|<p[^>]*>\s*\d+\.\s+[^<]+<\/p>/gi;
  //   let match;
  //   let siguienteCapituloPos = Infinity;

  //   regexCapitulo.lastIndex = subcapituloActual.startIndex;

  //   while ((match = regexCapitulo.exec(html)) !== null) {
  //     if (match.index > subcapituloActual.startIndex) {
  //       siguienteCapituloPos = match.index;
  //       break;
  //     }
  //   }

  //   if (siguienteCapituloPos < Infinity) {
  //     return siguienteCapituloPos;
  //   }

  //   // 4. Si no hay más subcapítulos ni capítulos, hasta el final del documento
  //   return html.length;
  // }

  // private asignarContenidoSubcapitulos(
  //   html: string,
  //   subcapitulos: any[],
  //   capitulos: any[],
  //   todasLasTablas: any[],
  // ): void {
  //   console.log('=== ASIGNANDO CONTENIDO A SUBCAPÍTULOS ===');

  //   subcapitulos.forEach((subcapituloMatch, index) => {
  //     const capituloPadre = capitulos.find((c) => {
  //       const numeroCapitulo = parseInt(c.titulo.split('.')[0]);
  //       return numeroCapitulo === subcapituloMatch.capituloPrincipal;
  //     });

  //     if (!capituloPadre) return;

  //     const subcapitulo = capituloPadre.subCapitulos.find((s: any) =>
  //       s.titulo.startsWith(subcapituloMatch.numeroCompleto),
  //     );

  //     if (!subcapitulo) return;

  //     const startContent = subcapituloMatch.endIndex;
  //     const endContent = this.obtenerFinContenidoSubcapitulo(
  //       html,
  //       subcapitulos,
  //       index,
  //     );

  //     if (startContent < endContent) {
  //       const contenidoHtml = html.substring(startContent, endContent);

  //       // Filtrar contenido que pertenece a las tablas de este subcapítulo
  //       const contenidoFiltrado = this.filtrarContenidoDeTablas(
  //         contenidoHtml,
  //         todasLasTablas,
  //         startContent,
  //       );
  //       const contenidoLimpio = this.limpiarContenidoHTML(contenidoFiltrado);

  //       if (contenidoLimpio.length > 5) {
  //         subcapitulo.contenido = contenidoLimpio;
  //         this.detectarElementosEnContenido(subcapitulo, contenidoLimpio);

  //         console.log(
  //           `✓ Subcapítulo ${subcapituloMatch.numeroCompleto}: ${contenidoLimpio.substring(0, 50)}...`,
  //         );
  //       } else {
  //         console.log(
  //           `⚠ Subcapítulo ${subcapituloMatch.numeroCompleto}: contenido insuficiente`,
  //         );
  //         subcapitulo.contenido = '';
  //       }
  //     }
  //   });
  // }

  // private filtrarContenidoDeTablas(
  //   contenidoHtml: string,
  //   todasLasTablas: any[],
  //   inicioContenido: number,
  // ): string {
  //   let contenidoFiltrado = contenidoHtml;

  //   // Para cada tabla, eliminar su contenido textual del contenido del capítulo
  //   todasLasTablas.forEach((tabla) => {
  //     // Verificar si esta tabla está dentro del rango de este capítulo
  //     if (tabla.position >= inicioContenido) {
  //       // Extraer todos los encabezados y filas de la tabla
  //       const elementosTabla = this.extraerElementosTabla(tabla.tablaHtml);

  //       // Eliminar cada elemento de la tabla del contenido
  //       elementosTabla.forEach((elemento) => {
  //         if (elemento.length > 3) {
  //           const patron = this.crearPatronEscape(elemento);
  //           contenidoFiltrado = contenidoFiltrado.replace(patron, '');
  //         }
  //       });
  //     }
  //   });

  //   return contenidoFiltrado;
  // }

  // private extraerElementosTabla(tablaHtml: string): string[] {
  //   const elementos: string[] = [];

  //   // Extraer encabezados (<th>)
  //   const regexTh = /<th[^>]*>(.*?)<\/th>/gi;
  //   let matchTh;
  //   while ((matchTh = regexTh.exec(tablaHtml)) !== null) {
  //     const texto = this.limpiarTextoElemento(matchTh[1]);
  //     if (texto.length > 0) {
  //       elementos.push(texto);
  //     }
  //   }

  //   // Extraer celdas de datos (<td>)
  //   const regexTd = /<td[^>]*>(.*?)<\/td>/gi;
  //   let matchTd;
  //   while ((matchTd = regexTd.exec(tablaHtml)) !== null) {
  //     const texto = this.limpiarTextoElemento(matchTd[1]);
  //     if (texto.length > 0) {
  //       elementos.push(texto);
  //     }
  //   }

  //   // También extraer texto de párrafos dentro de las celdas
  //   const regexP = /<p[^>]*>(.*?)<\/p>/gi;
  //   let matchP;
  //   while ((matchP = regexP.exec(tablaHtml)) !== null) {
  //     const texto = this.limpiarTextoElemento(matchP[1]);
  //     if (texto.length > 0 && !elementos.includes(texto)) {
  //       elementos.push(texto);
  //     }
  //   }

  //   return elementos;
  // }

  // private limpiarTextoElemento(texto: string): string {
  //   return texto
  //     .replace(/<[^>]+>/g, '') // Eliminar etiquetas HTML
  //     .replace(/\s+/g, ' ') // Normalizar espacios
  //     .trim(); // Eliminar espacios al inicio/fin
  // }

  // private crearPatronEscape(texto: string): RegExp {
  //   // Escapar caracteres especiales para regex
  //   const textoEscapado = texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  //   // Crear patrón que coincida con el texto en cualquier contexto
  //   return new RegExp(textoEscapado, 'gi');
  // }

  // private extraerTodasLasTablasConContenido(
  //   html: string,
  // ): { tablaHtml: string; elementos: string[]; position: number }[] {
  //   const tables: {
  //     tablaHtml: string;
  //     elementos: string[];
  //     position: number;
  //   }[] = [];
  //   const tableRegex = /<table[^>]*>(.*?)<\/table>/gi;
  //   let tableMatch;

  //   while ((tableMatch = tableRegex.exec(html)) !== null) {
  //     const tablaHtml = tableMatch[0];
  //     const elementos = this.extraerElementosTabla(tablaHtml);

  //     tables.push({
  //       tablaHtml: tablaHtml,
  //       elementos: elementos,
  //       position: tableMatch.index,
  //     });
  //   }

  //   return tables;
  // }

  // private crearPatronEliminacion(textoTabla: string): RegExp | null {
  //   if (!textoTabla || textoTabla.length < 10) return null;

  //   // Tomar las primeras palabras significativas del texto de la tabla
  //   const palabras = textoTabla
  //     .split(/\s+/)
  //     .filter((palabra) => palabra.length > 3 && !palabra.match(/^\d+$/));

  //   if (palabras.length < 2) return null;

  //   // Crear un patrón con las primeras 3-5 palabras significativas
  //   const palabrasClave = palabras.slice(0, Math.min(5, palabras.length));
  //   const patron = palabrasClave.join('.*?');

  //   return new RegExp(patron, 'gi');
  // }

  // private esSoloTabla(contenidoHtml: string): boolean {
  //   if (!contenidoHtml) return true;

  //   // Eliminar espacios y saltos de línea para el análisis
  //   const contenidoCompacto = contenidoHtml.replace(/\s+/g, ' ').trim();

  //   // Verificar si el contenido es básicamente solo una tabla
  //   const tieneTabla = /<table[^>]*>.*?<\/table>/i.test(contenidoCompacto);
  //   const tieneTextoSignificativo =
  //     this.tieneTextoSignificativo(contenidoCompacto);

  //   // Si tiene tabla pero no tiene texto significativo, es solo tabla
  //   return tieneTabla && !tieneTextoSignificativo;
  // }

  // private tieneTextoSignificativo(contenido: string): boolean {
  //   // Eliminar etiquetas HTML para analizar solo el texto
  //   const textoSinEtiquetas = contenido.replace(/<[^>]+>/g, ' ').trim();

  //   // Eliminar espacios múltiples y contar caracteres alfabéticos
  //   const textoLimpio = textoSinEtiquetas.replace(/\s+/g, ' ');
  //   const caracteresAlfabeticos = textoLimpio.replace(
  //     /[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g,
  //     '',
  //   ).length;

  //   // Considerar significativo si tiene más de 20 caracteres alfabéticos
  //   return caracteresAlfabeticos > 20;
  // }

  // private filtrarSubcapitulosDelContenido(
  //   contenidoHtml: string,
  //   subcapitulos: any[],
  // ): string {
  //   if (!contenidoHtml) return '';

  //   // Crear una copia del contenido para filtrar
  //   let contenidoFiltrado = contenidoHtml;

  //   // Eliminar las líneas que contengan subcapítulos numerados
  //   subcapitulos.forEach((sub) => {
  //     const patronSubcapitulo = new RegExp(
  //       `(<p[^>]*>\\s*${sub.capituloPrincipal}\\.${sub.numero}(?:\\.\\d+)*\\s+[^<]*<\\/p>)`,
  //       'gi',
  //     );
  //     contenidoFiltrado = contenidoFiltrado.replace(patronSubcapitulo, '');
  //   });

  //   // También eliminar subcapítulos anidados
  //   const patronSubcapituloAnidado =
  //     /<ul[^>]*>.*?<li[^>]*>.*?<ol[^>]*>.*?<\/ol>.*?<\/li>.*?<\/ul>/gi;
  //   contenidoFiltrado = contenidoFiltrado.replace(patronSubcapituloAnidado, '');

  //   return contenidoFiltrado;
  // }

  // private calcularRangosContenidoCapitulos(
  //   html: string,
  //   capitulos: any[],
  //   subcapitulos: any[],
  // ): { inicioContenido: number; finContenido: number }[] {
  //   const rangos: any[] = [];

  //   for (let i = 0; i < capitulos.length; i++) {
  //     const capituloActual = capitulos[i];

  //     // INICIO: Después del cierre del capítulo (</ol> o fin del párrafo)
  //     let inicioContenido = this.obtenerInicioContenidoCapitulo(
  //       html,
  //       capituloActual,
  //     );

  //     // FIN: Antes del siguiente capítulo o subcapítulo de otro capítulo
  //     let finContenido = html.length;

  //     // Buscar siguiente capítulo
  //     if (i < capitulos.length - 1) {
  //       finContenido = capitulos[i + 1].startIndex;
  //     }

  //     // Buscar subcapítulos de otros capítulos que puedan estar antes del siguiente capítulo
  //     const subcapitulosIntermedios = subcapitulos.filter((sub) => {
  //       return (
  //         sub.capituloPrincipal > capituloActual.numero &&
  //         sub.startIndex > inicioContenido &&
  //         sub.startIndex < finContenido
  //       );
  //     });

  //     if (subcapitulosIntermedios.length > 0) {
  //       finContenido = Math.min(
  //         ...subcapitulosIntermedios.map((s) => s.startIndex),
  //       );
  //     }

  //     // Asegurar que el rango sea válido
  //     if (inicioContenido < finContenido) {
  //       rangos.push({
  //         inicioContenido: inicioContenido,
  //         finContenido: finContenido,
  //       });

  //       console.log(
  //         `Rango capítulo ${capituloActual.numero}: ${inicioContenido}-${finContenido}`,
  //       );
  //     } else {
  //       console.log(
  //         `❌ Rango inválido para capítulo ${capituloActual.numero}: ${inicioContenido}-${finContenido}`,
  //       );
  //       rangos.push({
  //         inicioContenido: inicioContenido,
  //         finContenido: inicioContenido + 1,
  //       });
  //     }
  //   }

  //   return rangos;
  // }

  // private obtenerInicioContenidoCapitulo(html: string, capitulo: any): number {
  //   if (capitulo.tipo === 'parrafo') {
  //     // Para capítulos en párrafos: después del </p>
  //     return capitulo.endIndex;
  //   } else {
  //     // Para capítulos en listas: después del </ol>
  //     const cierreOl = html.indexOf('</ol>', capitulo.startIndex);
  //     return cierreOl !== -1 ? cierreOl + 5 : capitulo.endIndex;
  //   }
  // }

  // private buscarCapitulosEnParrafos(html: string): any[] {
  //   const matches: any[] = [];

  //   // Buscar capítulos en formato <p>10. Estabilidad y reactividad.</p>
  //   const regexCapituloParrafo = /<p[^>]*>\s*(\d+)\.\s+([^<]+?)\s*<\/p>/gi;
  //   let match;
  //   let contador = 1;

  //   while ((match = regexCapituloParrafo.exec(html)) !== null) {
  //     const numero = parseInt(match[1]);
  //     const titulo = match[2].trim();

  //     // Verificar que no sea un subcapítulo (no debe tener . después del número)
  //     if (!match[2].includes('.') && titulo.length > 3) {
  //       matches.push({
  //         numero: numero,
  //         titulo: titulo,
  //         startIndex: match.index,
  //         endIndex: match.index + match[0].length,
  //         tipo: 'parrafo',
  //       });
  //       contador++;
  //     }
  //   }

  //   console.log(`Capítulos en párrafos detectados: ${matches.length}`);
  //   return matches;
  // }

  // private encontrarCapituloQueContieneTabla(
  //   html: string,
  //   posicionTabla: number,
  //   capitulos: any[],
  // ): any {
  //   // Ordenar capítulos por posición de inicio
  //   const capitulosOrdenados = [...capitulos].sort(
  //     (a, b) => a._matchData.startIndex - b._matchData.startIndex,
  //   );

  //   // Primero, calcular los rangos reales de contenido de cada capítulo
  //   const rangosCapitulos = this.calcularRangosCapitulos(
  //     html,
  //     capitulosOrdenados,
  //   );

  //   // Encontrar el capítulo cuyo rango de CONTENIDO contiene la posición de la tabla
  //   for (let i = 0; i < rangosCapitulos.length; i++) {
  //     const { capitulo, inicioContenido, finContenido } = rangosCapitulos[i];

  //     // Verificar si la tabla está dentro del contenido de este capítulo
  //     if (posicionTabla >= inicioContenido && posicionTabla < finContenido) {
  //       console.log(
  //         `Tabla en posición ${posicionTabla} contenida en capítulo: ${capitulo.titulo} (rango contenido: ${inicioContenido}-${finContenido})`,
  //       );
  //       return capitulo;
  //     }
  //   }

  //   console.log(
  //     `Tabla en posición ${posicionTabla} no está contenida en ningún capítulo`,
  //   );
  //   return null;
  // }

  // private calcularRangosCapitulos(
  //   html: string,
  //   capitulosOrdenados: any[],
  // ): { capitulo: any; inicioContenido: number; finContenido: number }[] {
  //   const rangos: any[] = [];

  //   for (let i = 0; i < capitulosOrdenados.length; i++) {
  //     const capituloActual = capitulosOrdenados[i];
  //     const inicioCapitulo = capituloActual._matchData.startIndex;

  //     // El contenido del capítulo comienza después del cierre del </ol>
  //     const inicioContenido = html.indexOf('</ol>', inicioCapitulo);
  //     const inicioContenidoReal =
  //       inicioContenido !== -1 ? inicioContenido + 5 : inicioCapitulo;

  //     // El contenido termina al inicio del siguiente capítulo o al final del documento
  //     let finContenido = html.length;
  //     if (i < capitulosOrdenados.length - 1) {
  //       finContenido = capitulosOrdenados[i + 1]._matchData.startIndex;
  //     }

  //     rangos.push({
  //       capitulo: capituloActual,
  //       inicioContenido: inicioContenidoReal,
  //       finContenido: finContenido,
  //     });

  //     console.log(
  //       `Capítulo ${capituloActual.titulo}: contenido en rango ${inicioContenidoReal}-${finContenido}`,
  //     );
  //   }

  //   return rangos;
  // }

  // private procesarTablasEnEstructuraCompleta(
  //   html: string,
  //   capitulos: any[],
  // ): void {
  //   const tableRegex = /<table[^>]*>(.*?)<\/table>/gi;
  //   const tables: any[] = [];
  //   let tableMatch;

  //   // Extraer todas las tablas con sus posiciones
  //   while ((tableMatch = tableRegex.exec(html)) !== null) {
  //     const tableHtml = tableMatch[1];
  //     const tabla = this.extractTableFromHtml(tableHtml);
  //     tables.push({
  //       tabla: tabla,
  //       position: tableMatch.index,
  //     });
  //   }

  //   console.log(`=== PROCESANDO ${tables.length} TABLAS ===`);

  //   // Asignar tablas a los capítulos que las contienen
  //   tables.forEach((tableInfo, index) => {
  //     const capituloContenedor = this.encontrarCapituloQueContieneTabla(
  //       html,
  //       tableInfo.position,
  //       capitulos,
  //     );
  //     if (capituloContenedor) {
  //       capituloContenedor.tablas.push(tableInfo.tabla);
  //       console.log(
  //         `✓ Tabla ${index + 1} (pos ${tableInfo.position}) asignada a: ${capituloContenedor.titulo}`,
  //       );
  //     } else {
  //       // Si no encuentra contenedor, usar lógica de proximidad como fallback
  //       const capituloMasCercano = this.encontrarCapituloMasCercano(
  //         html,
  //         tableInfo.position,
  //         capitulos,
  //       );
  //       if (capituloMasCercano) {
  //         capituloMasCercano.tablas.push(tableInfo.tabla);
  //         console.log(
  //           `⚠ Tabla ${index + 1} asignada por proximidad a: ${capituloMasCercano.titulo}`,
  //         );
  //       } else {
  //         console.log(`✗ Tabla ${index + 1} no pudo ser asignada`);
  //       }
  //     }
  //   });
  // }

  // private encontrarCapituloMasCercano(
  //   html: string,
  //   posicionTabla: number,
  //   capitulos: any[],
  // ): any {
  //   let capituloMasCercano = null;
  //   let menorDistancia = Infinity;

  //   for (const capitulo of capitulos) {
  //     const inicioCapitulo = capitulo._matchData.startIndex;
  //     if (inicioCapitulo < posicionTabla) {
  //       const distancia = posicionTabla - inicioCapitulo;
  //       if (distancia < menorDistancia) {
  //         menorDistancia = distancia;
  //         capituloMasCercano = capitulo;
  //       }
  //     }
  //   }

  //   return capituloMasCercano;
  // }

  // private obtenerSubcapitulosDespuesDeCapitulo(
  //   html: string,
  //   numeroCapitulo: number,
  // ): any[] {
  //   const subcapitulos: any[] = [];
  //   const regex = /<p[^>]*>\s*(\d+)\.(\d+)\s+([^<]+?)\s*<\/p>/gi;
  //   let match;

  //   while ((match = regex.exec(html)) !== null) {
  //     const capituloPrincipal = parseInt(match[1]);
  //     if (capituloPrincipal > numeroCapitulo) {
  //       const subcapituloNum = parseInt(match[2]);
  //       let titulo = match[3].trim();
  //       titulo = titulo.replace(/<[^>]+>/g, '').trim();

  //       subcapitulos.push({
  //         capituloPrincipal: capituloPrincipal,
  //         numero: subcapituloNum,
  //         titulo: titulo,
  //         startIndex: match.index,
  //         endIndex: match.index + match[0].length,
  //         numeroCompleto: `${capituloPrincipal}.${subcapituloNum}`,
  //       });
  //     }
  //   }

  //   return subcapitulos;
  // }

  // private encontrarElementoMasCercano(
  //   html: string,
  //   posicionTabla: number,
  //   capitulos: any[],
  // ): any {
  //   let elementoMasCercano = null;
  //   let menorDistancia = Infinity;

  //   // Buscar en capítulos principales y sus subcapítulos
  //   for (const capitulo of capitulos) {
  //     const posicionCapitulo = html.indexOf(capitulo.titulo);
  //     if (posicionCapitulo !== -1 && posicionCapitulo < posicionTabla) {
  //       const distancia = posicionTabla - posicionCapitulo;
  //       if (distancia < menorDistancia) {
  //         menorDistancia = distancia;
  //         elementoMasCercano = capitulo;
  //       }
  //     }

  //     // Buscar en subcapítulos
  //     for (const subcapitulo of capitulo.subCapitulos) {
  //       const posicionSubcapitulo = html.indexOf(subcapitulo.titulo);
  //       if (posicionSubcapitulo !== -1 && posicionSubcapitulo < posicionTabla) {
  //         const distancia = posicionTabla - posicionSubcapitulo;
  //         if (distancia < menorDistancia) {
  //           menorDistancia = distancia;
  //           elementoMasCercano = subcapitulo;
  //         }
  //       }
  //     }
  //   }

  //   return elementoMasCercano;
  // }

  // private limpiarDatosTemporales(capitulos: any[]): void {
  //   capitulos.forEach((capitulo) => {
  //     delete capitulo._matchData;
  //     delete capitulo._index;

  //     capitulo.subCapitulos.forEach((subcapitulo: any) => {
  //       delete subcapitulo._matchData;
  //       delete subcapitulo._capituloPadre;
  //     });
  //   });
  // }

  // private procesarComoCapituloUnico(html: string, capitulos: any[]): void {
  //   // Crear un único capítulo "General" con todo el contenido
  //   const capituloGeneral = this.crearCapitulo('General');
  //   capitulos.push(capituloGeneral);

  //   // Procesar todo el contenido en este único capítulo
  //   this.asignarContenidoAEstructura(html, capitulos);
  // }

  // private asignarContenidoAEstructura(html: string, capitulos: any[]): void {
  //   const nodeRegex = /<(p|table)[^>]*>(.*?)<\/\1>/gi;

  //   // Para estructuras con numeración, asignamos el contenido al último elemento creado
  //   let lastElement: any = null;

  //   // Determinar el último elemento de la estructura
  //   if (capitulos.length > 0) {
  //     const lastCapitulo = capitulos[capitulos.length - 1];
  //     if (lastCapitulo.subCapitulos.length > 0) {
  //       lastElement =
  //         lastCapitulo.subCapitulos[lastCapitulo.subCapitulos.length - 1];
  //     } else {
  //       lastElement = lastCapitulo;
  //     }
  //   }

  //   let match;
  //   while ((match = nodeRegex.exec(html)) !== null) {
  //     const [fullMatch, tag, content] = match;
  //     const trimmedContent = content.trim();

  //     if (tag.toLowerCase() === 'p') {
  //       if (lastElement) {
  //         this.procesarParrafo(
  //           trimmedContent,
  //           lastElement.subCapitulos ? null : lastElement, // Si es subcapítulo o capítulo
  //           lastElement.subCapitulos ? lastElement : null, // Si es capítulo con subcapítulos
  //         );
  //       } else if (capitulos.length > 0) {
  //         // Si no hay último elemento pero sí hay capítulos, usar el último capítulo
  //         const lastCapitulo = capitulos[capitulos.length - 1];
  //         this.procesarParrafo(trimmedContent, null, lastCapitulo);
  //       }
  //     } else if (tag.toLowerCase() === 'table') {
  //       if (lastElement) {
  //         this.procesarTabla(
  //           trimmedContent,
  //           lastElement.subCapitulos ? null : lastElement,
  //           lastElement.subCapitulos ? lastElement : null,
  //         );
  //       } else if (capitulos.length > 0) {
  //         const lastCapitulo = capitulos[capitulos.length - 1];
  //         this.procesarTabla(trimmedContent, null, lastCapitulo);
  //       }
  //     }
  //   }
  // }

  // // Métodos auxiliares (se mantienen igual)
  // private crearCapitulo(titulo: string): any {
  //   return {
  //     titulo,
  //     contenido: '',
  //     subCapitulos: [],
  //     tablas: [],
  //     placeholders: [],
  //     anexos: [],
  //   };
  // }

  // private crearSubCapitulo(titulo: string): any {
  //   return {
  //     titulo,
  //     contenido: '',
  //     tablas: [],
  //     placeholders: [],
  //     anexos: [],
  //   };
  // }

  // private procesarParrafo(
  //   content: string,
  //   subCapitulo: any,
  //   capitulo: any,
  // ): void {
  //   const target = subCapitulo || capitulo;
  //   if (!target) return;

  //   target.contenido += content + '\n';

  //   // Detectar placeholders
  //   const placeholders = content.match(/\{\{.*?\}\}/g);
  //   if (placeholders?.length) {
  //     target.placeholders.push(...placeholders);
  //   }

  //   // Detectar anexos
  //   const anexos = content.match(/Anexo\s+\d+/gi);
  //   if (anexos?.length) {
  //     target.anexos.push(...anexos);
  //   }
  // }

  // private procesarTabla(
  //   tableHtml: string,
  //   subCapitulo: any,
  //   capitulo: any,
  // ): void {
  //   const target = subCapitulo || capitulo;
  //   if (!target) return;

  //   const tabla = this.extractTableFromHtml(tableHtml);
  //   target.tablas.push(tabla);
  // }

  // private procesarTablasEnCapitulos(html: string, capitulos: any[]): void {
  //   const tableRegex = /<table[^>]*>(.*?)<\/table>/gi;
  //   interface Tabla {
  //     encabezados: string[];
  //     filas: string[][];
  //   }
  //   interface TablaConPosicion {
  //     tabla: Tabla;
  //     position: number;
  //   }
  //   const tables: TablaConPosicion[] = [];
  //   let tableMatch;

  //   // Extraer todas las tablas con sus posiciones
  //   while ((tableMatch = tableRegex.exec(html)) !== null) {
  //     const tableHtml = tableMatch[1];
  //     const tabla = this.extractTableFromHtml(tableHtml);
  //     tables.push({
  //       tabla: tabla,
  //       position: tableMatch.index,
  //     });
  //   }

  //   // Asignar cada tabla al capítulo más cercano
  //   tables.forEach((tableInfo) => {
  //     let capituloMasCercano: number = 0;
  //     let menorDistancia = Infinity;

  //     // Encontrar el capítulo cuya posición sea anterior más cercana a la tabla
  //     for (let i = 0; i < capitulos.length; i++) {
  //       // Buscar la posición del título del capítulo en el HTML
  //       const tituloCapitulo = `${capitulos[i].titulo}`;
  //       const posicionCapitulo = html.indexOf(tituloCapitulo);

  //       if (posicionCapitulo !== -1 && posicionCapitulo < tableInfo.position) {
  //         const distancia = tableInfo.position - posicionCapitulo;
  //         if (distancia < menorDistancia) {
  //           menorDistancia = distancia;
  //           capituloMasCercano = i;
  //         }
  //       }
  //     }

  //     // Asignar la tabla al capítulo más cercano encontrado
  //     if (capituloMasCercano !== 0) {
  //       capitulos[capituloMasCercano].tablas.push(tableInfo.tabla);
  //     } else if (capitulos.length > 0) {
  //       // Si no se encuentra, asignar al primer capítulo
  //       capitulos[0].tablas.push(tableInfo.tabla);
  //     }
  //   });
  // }

  // private extractTableFromHtml(tableHtml: string): any {
  //   const rows = [...tableHtml.matchAll(/<tr[^>]*>(.*?)<\/tr>/gi)].map(
  //     (rowMatch) => {
  //       const cells = [
  //         ...rowMatch[1].matchAll(/<t[dh][^>]*>(.*?)<\/t[dh]>/gi),
  //       ].map((c) => c[1].trim());
  //       return cells;
  //     },
  //   );
  //   return { encabezados: rows[0] || [], filas: rows.slice(1) };
  // }