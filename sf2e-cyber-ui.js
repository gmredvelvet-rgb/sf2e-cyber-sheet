console.log("SF2e Cyber Sheet | Cargando módulo...");

Hooks.once('ready', () => {
    console.log("SF2e Cyber Sheet | Inicializando interfaz global...");
    // Añade una clase al cuerpo de Foundry para permitir estilos globales
    document.body.classList.add('sf-cyber-ui');
});

Hooks.on('renderActorSheet', (app, html, data) => {
    console.log("SF2e Cyber Sheet | Inyectando estilos a la hoja de personaje");
    // Esto le dice a la ficha: "usa los estilos de mi módulo"
    if (html && html[0]) {
        html[0].classList.add('sf-cyber-sheet');
    }
});
