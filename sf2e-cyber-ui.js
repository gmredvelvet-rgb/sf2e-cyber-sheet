// Registra la hoja personalizada y desregistra la del sistema base
export function registerSheetOverride() {
    // Espera a que el sistema esté cargado
    Hooks.once('setup', () => {
        // El sistema base es 'sf2e', la hoja base suele ser 'CharacterSheetPF2e'
        const systemId = 'sf2e';
        const actorType = 'character';
        const sheetClass = 'sf2e-cyber-sheet';

        // Desregistra la hoja base
        const system = game.systems.get(systemId);
        if (system?.entityTypes?.Actor) {
            // Para Foundry VTT v10+
            Actors.unregisterSheet(systemId, system.sheets.Actor[actorType]);
        } else {
            // Fallback para versiones anteriores
            Actors.unregisterSheet(systemId, Actor.sheetClasses[actorType]);
        }

        // Registra la hoja personalizada
        Actors.registerSheet(systemId, class extends ActorSheet {
            static get defaultOptions() {
                return mergeObject(super.defaultOptions, {
                    classes: [sheetClass, ...super.defaultOptions.classes],
                    template: 'modules/sf2e-cyber-sheet/templates/actors/character/sheet.hbs',
                    width: 800,
                    height: 800
                });
            }
        }, { types: [actorType], makeDefault: true });
    });
}
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
