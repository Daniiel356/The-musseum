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
    fakeGame._isHost=true;
    await fakeGame.init("test");

    fakeGame.playerId=await fakeGame.world.executeCommand("spawn player 5 5");
};