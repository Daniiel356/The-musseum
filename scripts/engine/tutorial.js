import { scenes, setScene } from "../visual/scenes.js";
import { Game } from "./game.js";
let end;
export async function initTutorial(){
    await prepTuto();
    setScene(scenes.GAME);
    
    return new Promise((resolve)=>{
        end=resolve;
    });
} 

async function prepTuto(){
    const fakeGame=new Game();
    fakeGame.setHost();
    await fakeGame.init("test");
};