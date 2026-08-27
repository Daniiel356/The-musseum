import { EntityManager } from "./entity.js";
import { ContentManager } from "./blocks.js";
import { context } from "./utils.js"

class World{
    _name="";
    #special={};

    #worldBlocks=[];
    #worldEntities=[];
    _size={w:0,h:0};

    #contManager=new ContentManager(this);
    #entityManager=new EntityManager(this);
    hitboxes=[];

    friction=8;
    frec=1000/50;

    getEntities(){ return this.#entityManager._entities }
    findEntity(id){ return this.#entityManager.find(id) }
    get cont(){ return this.#contManager._blocks }
    get blocksData(){ return this.#contManager._blocksData }
    get floor(){ return this.#contManager._floor }
    get floorData(){ return this.#contManager._floorData}

    constructor(data){
        this._name=data?.head?.name||"unnamed";
        this._size=data?.head?.size||{w:0,h:0};

        this.#special=data?.special||{};
        this.#contManager._blocks=data?.cont||[];
        this.#contManager._floor=data?.floor||[];

        this.#worldEntities=data?.entities||[];
        this.#worldBlocks=data?.blocks||[];
    }

    async init(){
        const blocksInfo=await this.#contManager.parse(this.#worldBlocks||[]);        
        const entityInfo=await this.#entityManager.parse(this.#worldEntities||[]);

        if(entityInfo.warn.length==0 && blocksInfo.warn.length==0){
            console.log("Parseo del mundo terminado con éxito. Logs:", [...entityInfo.log, ...blocksInfo.log]);
        }else{
            throw new Error("Error al cargar el mundo.\n"+entityInfo.warn.map(e=>e+"\n"));
        }
        context.world.size=this._size;
    }

    update(){
        this.#entityManager.update();
    }

    playerEvent(event){
        const p=this.#entityManager.find(event.id);
        const data=event.data;
        console.log(p)
        if(event.type="click"){
            console.log(p.input.hability)
            if(p.input.hability!=-1)return;
            console.log("interac")
            p.style.bg="0,255,0";
        }
    }

    spawnPlayer(){
        let list=[];

        this.#contManager.findBlocksIndexs((e)=>
            this.#special.players.spawnerBlocks.includes(e.id+'')
        ).forEach((i)=>{
            list.push({x: i%this._size.w, y:  Math.floor(i/this._size.w)})
        });
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