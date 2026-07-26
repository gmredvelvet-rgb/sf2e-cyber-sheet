# SF2E Cyber Sheet — Starfinder 2e Cyberpunk UI

Módulo de estética cyberpunk para **Starfinder 2e** en Foundry VTT.  
Transforma la ficha de personaje en una interfaz holográfica con animaciones, efectos visuales y audio ambiental.

---

## Características

- **Interfaz holográfica** — CSS cyberpunk completo sobre la ficha de personaje SF2e
- **Animador holográfico** — secuencia de apertura y cierre con vídeo del brazo (open / idle / close)
- **Efectos de ficha** — paneles con scanlines, glitch de texto, pulso de nombre y efectos de crítico/fumble
- **Audio ambiental** — música de fondo con fade-in/out al abrir y cerrar fichas
- **Autenticación Patreon** — el módulo solo se activa con licencia válida de Patreon

---

## Configuración

### Ajustes del módulo

Accede desde **Configurar Ajustes → SF2E Cyber Sheet**.

| Ajuste | Alcance | Descripción |
|--------|---------|-------------|
| **Arm Animation** | Por cliente | Activa o desactiva los vídeos del brazo holográfico (open, idle, close). No afecta al resto de efectos de la ficha. |

> El toggle de animación del brazo es por jugador — cada uno puede activarlo o desactivarlo de forma independiente.

---

## Instalación

1. En Foundry VTT, ve a **Módulos → Instalar módulo**
2. Pega la URL del manifiesto:

```
https://github.com/gmredvelvet-rgb/sf2e-cyber-sheet/releases/latest/download/module.json
```

3. Activa el módulo en tu mundo
4. El GM deberá autenticarse con Patreon al primer inicio

---

## Requisitos

| Requisito | Detalle |
|---|---|
| Foundry VTT | **v12** mínimo, **v13** verificada. |
| Sistema | **Starfinder 2e** (`sf2e`) o **Pathfinder 2e** (`pf2e`). |
| Suscripción | Una suscripción **activa y vigente** en [Patreon de GM RedVelvet](https://www.patreon.com/gmredvelvet), durante todo el tiempo que uses el módulo — ver [Licencia](#licencia). Solo el **GM** se autentica; los jugadores nunca ven ningún aviso. |
| Internet | Necesaria mientras juegas. La licencia se verifica periódicamente contra un servidor. |

---

## Licencia

SF2E Cyber Sheet requiere una suscripción **activa y vigente** en [el Patreon de GM RedVelvet](https://www.patreon.com/gmredvelvet).

**Solo el GM se autentica.** En su primera carga se le pide conectar su cuenta de Patreon, y eso desbloquea el módulo para todos los del mundo. Los jugadores nunca ven un aviso ni necesitan cuenta propia. Si el navegador bloquea las ventanas emergentes — habitual en móviles — usa el flujo de **código de autenticación**: conecta desde cualquier dispositivo, copia el código y pégalo.

### Qué pasa si la suscripción caduca

**Léelo antes de suscribirte.** Esto es una suscripción, no una compra única, y el módulo la vuelve a comprobar periódicamente contra un servidor de licencias. Dicho claro:

- **Si la suscripción caduca, el módulo deja de funcionar.** Se desactiva y la interfaz cyberpunk ya no se aplica.
- **No pierdes nada más.** Foundry, tu mundo, tus actores, tus objetos y tus ajustes quedan intactos. Las fichas vuelven a mostrarse con el aspecto normal del sistema y puedes seguir jugando al momento. No se altera, retiene ni pierde ningún dato, y ningún contenido se vuelve inaccesible. Al volver a suscribirte se reactiva sin más.
- **Hace falta conexión a internet mientras juegas.** La verificación es periódica, así que un cliente que no alcance el servidor de licencias se desactiva hasta que pueda. No se admiten partidas totalmente sin conexión.

Si lo que necesitas es una licencia perpetua, hoy por hoy esto no lo es. Prefiero decirlo aquí a que alguien lo descubra a mitad de campaña.

---

## Changelog

### v1.1.0
- Añadido toggle **Arm Animation** en los ajustes del módulo (por cliente)  
  Permite desactivar los vídeos del brazo holográfico (open, idle, close) sin afectar otros efectos

### v1.0.0
- Lanzamiento inicial: autenticación Patreon, animador holográfico, CSS cyberpunk completo

---

## Autor

**Julio Cesar Ojeda (GM Red Velvet)**  
[Patreon](https://www.patreon.com/gmredvelvet) · [GitHub](https://github.com/gmredvelvet-rgb/sf2e-cyber-sheet)
