import { setScene, scenes } from "./scripts/visual/scenes.js";
import { Game } from "./scripts/engine/game.js";
import { initTutorial } from "./scripts/engine/tutorial.js";


//window vars support
window.isLoading=false;
window.setScene=setScene;
window.scenes=scenes;
window.game={
    engine: {
        input:(x)=>{}     
    },
    visual: {
        setScene: setScene,
        scenes
    }
};

window.initTutorial=async ()=>{
    setScene(scenes.LOAD_SCREEN);
    await initTutorial();
    setScene(scenes.MENU);
};

window.initMultiplayer=async ()=>{
    setScene(scenes.LOAD_SCREEN)
    await game.initMultiPlayer();
};


//PC support
const keys={};
const userAgent=navigator.userAgent.toLowerCase();
const isMobile=/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

window.addEventListener("wheel", (e)=>{
    if(e.ctrlKey){
        e.preventDefault();
    }
}, {passive: false});


function PCMode(){
    console.log("PC mode")
    document.documentElement.style.setProperty('--mobile', 'none');
}

function actKeys(){
    const input={x:0, y:0};
    if(keys["KeyW"]||keys["ArrowUp"])input.y-=1;
    if(keys["KeyA"]||keys["ArrowLeft"])input.x-=1;
    if(keys["KeyS"]||keys["ArrowDown"])input.y+=1;
    if(keys["KeyD"]||keys["ArrowRight"])input.x+=1;

    window.game.engine.input=input;
}
document.addEventListener("keydown", (e)=>{
    keys[e.code]=true;
    actKeys();
});
document.addEventListener("keyup", (e)=>{
    keys[e.code]=false;
    actKeys();
});

if(!isMobile)PCMode();
document.addEventListener("keypress", PCMode, {once: true});

await setScene(scenes.MENU); //Init