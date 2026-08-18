import { Entity, parserEntities } from "../entity.js";
import { parserBlocks } from "../blocks.js";

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
    hitboxes=[];

    friction=8;

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
        let entityInfo={};
        let blocksInfo={};

        [this._blocksClass, this._floorClass, blocksInfo]=await parserBlocks(this.#worldBlocks||[]);        
        [this._entityClass, entityInfo]=await parserEntities(this.#worldEntities||[]);

        if(entityInfo.warn.length==0 && blocksInfo.warn.length==0){
            console.log("Parseo del mundo terminado con éxito. Logs:", [...entityInfo.log, ...blocksInfo.log]);
        }
    }

    update(){
        this.entities.forEach(e=>{
            if(e.type=="player"){
                const dif={x:0, y:0};
                e.vx+=e.input.x*e.v;
                e.vy+=e.input.y*e.v;

                this.#colidesBlock({...e, x:e.x+e.vx}, (b)=>{
                    dif.x=e.vx>0? b.x-(e.x+e.w) : (b.x+b.w)-e.x;
                    e.vx=0;
                });
                e.x=Math.max(Math.min(e.x+e.vx+dif.x, this._size.w*100), 0);

                this.#colidesBlock({...e, y:e.y+e.vy}, (b)=>{
                    dif.y=e.vy>0? b.y-(e.y+e.h) : (b.y+b.h)-e.y;
                    e.vy=0;
                });
                e.y=Math.max(Math.min(e.y+e.vy+dif.y, this._size.h*100-e.h), 0);

                e.vx=Math.abs(e.vx)<=this.friction? 0:e.vx+(Math.sign(e.vx)*this.friction);
                e.vy=Math.abs(e.vy)<=this.friction? 0:e.vy+(Math.sign(e.vy)*this.friction);
            }
        });
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

        const pId=this.#summonEntity("player", x*100, y*100);
        this.entities.forEach((e)=>{
            if(e.id==pId){
                e.tags.role=role;
                return;
            }
        });
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
        return id;
    }

    #colidesBlock(a, fun){
        const sX=Math.floor(a.x/100)-1, eX=Math.ceil(a.x/100)+1;
        const sY=Math.floor(a.y/100)-1, eY=Math.ceil(a.y/100)+1;

        for(let x=Math.max(sX, 0); x<Math.min(eX, this._size.w); x++){
            for(let y=Math.max(sY, 0); y<Math.min(eY, this._size.h); y++){
                let b=this.#cont[y*this._size.w+x];
                if(b==0)continue;
                b=this._blocksClass[b+''].logic;

                if(b.solid &&
                    a.x+a.w>x*100+b.x && a.x<x*100+b.x+b.w &&
                    a.y+a.h>y*100+b.y && a.y<y*100+b.y+b.h
                ){
                    fun({x: x*100+b.x, y:y*100+b.y, w: b.w, h:b.h});
                    return;
                }
            }
        }
    }
}

export {World}