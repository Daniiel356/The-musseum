import { setScene, scenes } from "./scripts/visual/scenes.js";
import { Game } from "./scripts/engine/game.js";
import { initTutorial } from "./scripts/engine/tutorial.js";

window.isLoading=false;
window.setScene=setScene;
window.scenes=scenes;
window.game={
    engine: {
        input:{x:0, y:0}        
    },
    visual: {
        setScene: setScene,
        scenes
    }
};
const game=new Game();

window.initTutorial=async ()=>{
    console.log("tutorial");
    setScene(scenes.LOAD_SCREEN);
    await initTutorial();
    setScene(scenes.MENU);
};

window.initMultiplayer=async ()=>{
    setScene(scenes.LOAD_SCREEN)
    await game.initMultiPlayer();
};

window.addEventListener("wheel", (e)=>{
    if(e.ctrlKey){
        e.preventDefault();
    }
}, {passive: false});

await setScene(scenes.MENU);