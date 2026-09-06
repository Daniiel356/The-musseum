import { Connection } from "../connection/conection.js";
import { Render } from "../visual/render.js";
import { World, loadWorld } from "./world/world.js";
import { context } from "./world/utils.js";

export class Game{
    #players={};
    #conection=new Connection({
        setInput: (id, x)=>{
            this.#world.actEntity(this.#players[id+""], (e)=>e.input=x);
            console.log(x)
        }
    });
    #render=new Render();
    #world;
    #inloop=false;
    _isHost=false;
    _connectionState=0;//0: desconectado, 1: tratando de conectar, 2: conectado, 3: desconectado (por error)
    #playerId=-1;
    #connId=-1;
    #habilities=[];
    set playerId(v){ this.#playerId=v; this.#render._playerId=v; }
    get playerId(){ return this.#playerId; }
    #lastTime=-1;
    #count=0;
    _tile=32;

    constructor(){
        this.#conection.on=(event, v)=>{
            this._isHost=v.host;
        };
        window.game.engine.input=(x)=>this.#actControls(x);
    }

    async init(world){
        if(this._isHost){
            this.#world=new World(await loadWorld(world));
            this.#world._tile=this._tile;
            await this.#world.init();
            this.#playerId=await this.#world.spawnPlayer();
            if(this.#connId==-1){
                let id=0;
                for(let key of Object.keys(this.#players)){
                    if(id+""!=key)return;
                    id++;
                };
                this.#connId=id;
                this.#players[id+""]=this.#playerId;
            }
        }
        
        await this.#render.init();
        
        this.#render._size=this.#world._size;
        this.#render._tile=this._tile;
        context.tile=this._tile;
        this.update();
        this.start();
    }

    #actControls(input){
        this.#conection.postInput(this.#connId, input);
    }
    update(){
        if(this._isHost){
            this.loop=(t)=>{
                this.#count+=(t-this.#lastTime);
                this.#lastTime=t;

                while(this.#count>=this.#world.frec){
                    this.#world.update();
                    this.#count-=this.#world.frec;
                }

                this.#render.render();

                requestAnimationFrame((x)=>this.loop(x));
            };
        };
        window.game.clickEvent=(x, y)=>this.#clickEvent(x, y);

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
                [this.#connId, this._isHost]=await this.#conection.connectToServer();
                console.log("Conectado con exito");
                console.log(`id: ${this.#connId}, isHost: ${this._isHost}`);
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