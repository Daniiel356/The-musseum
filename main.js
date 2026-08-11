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

document.addEventListener("keypress", ()=>{
    console.log("Modo PC relativamente activado");
    const keys={};
    const act=()=>{
        const input={x:0, y:0};
        if(keys["KeyW"])input.y-=1;
        if(keys["KeyA"])input.x-=1;
        if(keys["KeyS"])input.y+=1;
        if(keys["KeyD"])input.x+=1;

        window.game.engine.input=input;
    };
    document.addEventListener("keydown", (e)=>{
        console.log(e.code);
        
        keys[e.code]=true;
        act();
    });
    document.addEventListener("keyup", (e)=>{
        keys[e.code]=false;
        act();
    });
}, {once: true});
await setScene(scenes.MENU);