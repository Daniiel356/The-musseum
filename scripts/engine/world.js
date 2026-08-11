import { Entity, parserEntities } from "./entity.js";
import { parserBlocks } from "./blocks.js";

async function loadWorld(name){
    const res=await fetch("./assets/worlds/"+name+".json");
    if(!res.ok)throw new Error("Error al cargar el mundo "+name);

    return await res.json();
}

class World{
    frec=1000/50;

    _name="";
    #special={};

    #worldBlocks=[];
    _size={w:0,h:0};

    #cont=[];
    _blocksClass=[];
    #floor=[];
    _floorClass=[];

    entities=[];
    #worldEntities=[];
    _entityClass=[];

    get cont(){return this.#cont};
    get floor(){return this.#floor}

    constructor(data){
        this.#cont=data?.cont||[];
        this.#floor=data?.floor||[];
        this._name=data?.head?.name||"unnamed";
        this._size=data?.head?.size||{w:0,h:0};
        this.#special=data?.special||{};
        this.#worldEntities=data?.entities||[];
        this.#worldBlocks=data?.blocks||[];
    }

    async init(){
        console.log("iniciando parseo...");        
        [this._blocksClass, this._floorClass]=await parserBlocks(this.#worldBlocks||[]);        
        this._entityClass=await parserEntities(this.#worldEntities||[]);
        console.log("parseo terminado");
    }

    update(){
        this.entities.forEach(e=>{
            if(e.type=="player"){
                e.vx=e.input.x*e.v; e.vy=e.input.y*e.v;

                e.x+=e.vx; e.y+=e.vy;
            }
        });
    }
    spawnPlayer(){
        let list=[];
        let spawnerBlocks=[];
        for(let key of Object.keys(this._blocksClass)){            
            if(this.#special.players.spawnerBlocks.includes(key))spawnerBlocks.push(key);
        }

        for(let i=0; i<this.#cont.length; i++){
            const b=this.#cont[i];
            if(spawnerBlocks.includes(b+'')){
                list.push({x: i%this._size.w, y:  Math.floor(i/this._size.w)});
            }
        }
        if(list.length==0){
            throw new Error("[ERROR] Error al spawnear un jugador: no se encontro ningún bloque tipo generador.");
        }

        const blockI=Math.round(Math.random()*(list.length-1));
        let x=list[blockI].x;
        let y=list[blockI].y;

        let role={name: "unnamed"};
        const roleIndex=Math.random()*100;
        let acom=0;
        this.#special.players.roles.forEach((e)=>{
            acom+=e?.change;
            if(roleIndex<=acom){
                role=e;
                return;
            }
        });
        console.log(role);
        console.log(this.#special.players.roles[roleIndex]);

        return this.#summonEntity("player", x*100, y*100);
    }

    async executeCommand(command){
        const s=command.split(" ");
        if(s[0]=="spawn"){
            const name=s[1], xs=s[2], ys=s[3];
            let x=0, y=0;
            try{
                x=Number(xs);
                y=Number(ys);
            }catch{
                console.warn("No se puede transformar las coordenadas a numeros")
            }

            return this.#summonEntity(name, x, y);
        }
    }

    #summonEntity(identifier, x, y){
        const index=this._entityClass.findIndex((e)=>e.name==identifier);
        if(index==-1){
            console.warn(`No se encontro la entidad '${identifier}'`);
            return;
        }

        let id=0;
        while(this.entities.findIndex((e)=>e.id==id)!=-1)id++;
        const entity=new Entity(this._entityClass[index], id);
        entity.setPos(x, y);
        this.entities.push(entity);

        console.log("Entidad con la ID", id, "generada");
        return id;
    }
}

export {World, loadWorld}