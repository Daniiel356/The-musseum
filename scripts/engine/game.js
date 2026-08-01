import { Connection } from "../connection/conection.js";
import { Render } from "../visual/render.js";
import { World, loadWorld } from "./world.js";

export class Game{
    #conection=new Connection();
    #render=new Render();
    #world;
    #inloop=false;
    _isHost=false;
    _connectionState=0;//0: desconectado, 1: tratando de conectar, 2: conectado, 3: desconectado (por error)
    #playerId=-1
    set playerId(v){this.#playerId=v; this.#render._playerId=v; }
    get playerId(){ return this.#playerId; }
    #lastTime=-1;
    #count=0;

    actControls=()=>{};

    async init(world){
        this.#world=new World(await loadWorld(world));
        await this.#world.init();
        this.#render._size=this.#world._size;
        this.start();
    }

    update(){
        if(this._isHost){
            this.loop=(t)=>{
                this.#count+=(t-this.#lastTime);
                this.#lastTime=t;
                this.actControls();
                if(this.#count>=this.#world.frec){
                    this.#world.update();
                    this.#count-=this.#world.frec;
                }
                this.#render.render();

                requestAnimationFrame((x)=>this.loop(x));
            };
            this.actControls=()=>{
                this.#world.entities.forEach(e=>{
                    if(e.id==this.#playerId)e.input=window.game.engine.input;
                });
            };
        }

        this.#render._blocks=this.#world.cont;
        this.#render._blocksSource=this.#world._blocksClass;
        this.#render._floor=this.#world.floor;
        this.#render._floorSource=this.#world._floorClass;        
        this.#render._entities=this.#world.entities;
    }

    async initMultiPlayer(){
        if(window.isLoading){
            await this.#conection.connectToServer();
        }
    }

    start(){
        this.#inloop=true;
        requestAnimationFrame((x)=>this.loop(x));
    }
    stop(){
        this.#inloop=false;
    }

    loop=(time)=>{
        this.#lastTime=time;
        this.update();
        if(this.#inloop)requestAnimationFrame((x)=>this.loop(x));
    }


    get world(){return this.#world};
}