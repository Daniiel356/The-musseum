import { Connection } from "../connection/conection.js";
import { Render } from "../visual/render.js";
import { World, loadWorld } from "./world/world.js";

export class Game{
    #conection=new Connection();
    #render=new Render();
    #world;
    #inloop=false;
    _isHost=false;
    _connectionState=0;//0: desconectado, 1: tratando de conectar, 2: conectado, 3: desconectado (por error)
    #playerId=-1;
    #habilities=[];
    set playerId(v){this.#playerId=v; this.#render._playerId=v; }
    get playerId(){ return this.#playerId; }
    #lastTime=-1;
    #count=0;
    #actControls=()=>{};

    constructor(){
        this.#conection.on=(event, v)=>{
            this._isHost=v.host;
        };
    }

    async init(world){
        if(this._isHost){
            this.#world=new World(await loadWorld(world));
            await this.#world.init();
            this.#playerId=await this.#world.spawnPlayer();
        }
        await this.#render.init();
        this.#render._size=this.#world._size;
        this.update();
        this.start();
    }

    update(){
        if(this._isHost){
            this.loop=(t)=>{
                this.#count+=(t-this.#lastTime);
                this.#lastTime=t;
                this.#actControls();

                while(this.#count>=this.#world.frec){
                    this.#world.update();
                    this.#count-=this.#world.frec;
                }

                this.#render.render();

                requestAnimationFrame((x)=>this.loop(x));
            };

            this.#actControls=()=>{
                this.#world.actEntity(this.#playerId, e=>{
                    e.input=window.game.engine.input;
                });
            };
        }
        window.game.clickEvent=(x, y)=>this.#clickEvent(x, y);
        this.#habilities=this.#conection.request("habilities", this.#playerId);

        this.#render._blocks=this.#world.cont;
        this.#render._blocksSource=this.#world.blocksData;
        this.#render._floor=this.#world.floor;
        this.#render._floorSource=this.#world.floorData;        
        this.#render._entities=this.#world.getEntities();
        this.#render._playerId=this.#playerId;
    }

    setHost(){
        this.#conection._host=true;
        this._isHost=true;
    }
    async initMultiPlayer(){
        if(window.isLoading){
            try{
                await this.#conection.connectToServer();
                console.log("Conectado con exito");
            }catch(err){
                console.error("Error al conectar", err);
            }
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

    #clickEvent(x, y){
        const p=this.#world.findEntity(this.#playerId);
        x=this.#render.screenToWorldX(x); y=this.#render.screenToWorldY(y);
        const dx=x-(p.x+p.w/2);
        const dy=y-(p.y+p.h/2);

        this.#world.playerEvent({
            type: "click", id: this.#playerId, 
            data: {
                ang: Math.atan2(dy, dx),
                dis: Math.sqrt(dx**2+dy**2)
            }
        });
    }

    get world(){return this.#world};
}