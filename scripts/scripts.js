Hooks.on('renderActorSheet', (app, html, data) => {
    // Esta línea busca la ventana de la ficha y le pega tu clase "cyber"
    html[0].classList.add('sf-cyber-sheet');
    
    console.log("SF2E Cyber | Clase aplicada con éxito a la ficha.");
});