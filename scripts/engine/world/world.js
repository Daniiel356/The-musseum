import { EntityManager } from "./entity.js";
import { parserBlocks } from "./blocks.js";
import { context } from "./utils.js"

class World{
    _name="";
    #special={};

    #worldBlocks=[];
    _size={w:0,h:0};

    #cont=[];
    _blocksClass=[];
    #floor=[];
    _floorClass=[];

    #entityManager=new EntityManager(this);
    #worldEntities=[];
    hitboxes=[];

    friction=8;
    frec=1000/50;

    get cont(){return this.#cont};
    get floor(){return this.#floor};
    getEntities(){ return this.#entityManager._entities }

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
        let blocksInfo={};

        [this._blocksClass, this._floorClass, blocksInfo]=await parserBlocks(this.#worldBlocks||[]);        
        const entityInfo=await this.#entityManager.parse(this.#worldEntities||[]);

        if(entityInfo.warn.length==0 && blocksInfo.warn.length==0){
            console.log("Parseo del mundo terminado con éxito. Logs:", [...entityInfo.log, ...blocksInfo.log]);
        }else{
            throw new Error("Error al cargar el mundo.\n"+entityInfo.warn.map(e=>e+"\n"));
        }
        context.world.size=this._size;
        context.blocks.data=this._blocksClass;
        context.blocks.cont=this.#cont;
    }

    update(){
        this.#entityManager.update();
    }

    playerEvent(event){
        const p=this.entities.find((e)=>e.id==event.id&&e.type=="player");
        const data=event.data;
        if(event.type="click"){
            if(!p.canHit)return;
            p.special.canHit=false;
            p.style.bg="0,255,0";
        }
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

        const pId=this.#entityManager.summon("player", x*100, y*100);
        const p=this.#entityManager.find(pId);
        p.tags.role=role;

        console.log("Jugador con la ID", pId, "generada");
        return pId;
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

            return this.#entityManager.summon(name, x, y);
        }
    }

    actEntity(id, fun){
        const e=this.#entityManager.find(id);
        if(e)fun(e);
        else throw new Error("No se encontro la entidad con la id "+id)
    }
}

async function loadWorld(name){
    const res=await fetch("./assets/worlds/"+name+".json");
    if(!res.ok)throw new Error("Error al cargar el mundo "+name);

    return await res.json();
}


export {World, loadWorld}