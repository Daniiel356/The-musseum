import { colidesBlock, context } from "./utils.js"
class Entity{
    id=-1;
    w=0; h=0;
    x=0; y=0;
    v=0;
    vx=0; vy=0;
    input={};
    type="solid";
    style={
        bg:"0,0,0"
    };
    tags={};
    special={};

    constructor(data, id){
        this.id=id;
        this.type=data.type||"solid";
        Object.assign(this, data.logic);
        this.style=data.style;
        this.input.hability=-1;
    }

    setPos(x, y){
        this.x=x; this.y=y;
    }
}


class EntityManager{
    #world;
    _data=[];
    _entities=[];
    _tile=32;

    constructor(world){
        this.#world=world;
    }

    find(id){
        return this._entities.find(e=>e.id==id);
    }
    
    summon(identifier, x, y){
        const index=this._data.findIndex((e)=>e.name==identifier);
        if(index==-1){
            console.warn(`No se encontro la entidad '${identifier}'`);
            return;
        }

        let id=0;
        while(this._entities.findIndex((e)=>e.id==id)!=-1)id++;
        const entity=new Entity(this._data[index], id);
        entity.setPos(x, y);
        this._entities.push(entity);
        return id;
    }

    update(){        
        this._entities.forEach(e=>{
            if(e.type=="player"){
                const dif={x:0, y:0};
                e.vx+=e.input.x*e.v;
                e.vy+=e.input.y*e.v;

                colidesBlock({...e, x:e.x+e.vx}, (b)=>{
                    dif.x=e.vx>0? b.x-(e.x+e.w) : (b.x+b.w)-e.x;
                    e.vx=0;
                });
                e.x=Math.max(Math.min(e.x+e.vx+dif.x, this.#world._size.w*this._tile), 0);

                colidesBlock({...e, y:e.y+e.vy}, (b)=>{
                    dif.y=e.vy>0? b.y-(e.y+e.h) : (b.y+b.h)-e.y;
                    e.vy=0;
                });
                e.y=Math.max(Math.min(e.y+e.vy+dif.y, this.#world._size.h*this._tile-e.h), 0);

                e.vx=Math.abs(e.vx)<=this.#world.friction? 0:e.vx+(Math.sign(e.vx)*this.friction);
                e.vy=Math.abs(e.vy)<=this.#world.friction? 0:e.vy+(Math.sign(e.vy)*this.friction);
            }
        });
    }

    async parse(rawEntitiesSource){
        const logs=[];
        const warns=[];
        for(const entities of rawEntitiesSource){
            const res=await fetch("assets/entities/"+entities.src+".json");
            const entitiesBase=await res.json();
            
            const entitiesImport=entities.import;
            for(const identifier of Object.keys(entitiesImport)){
                const newEntity={name: identifier, style: {bg:"0,0,0"}, logic:{w:0,h:0}, habilities:[]};

                const index=entitiesBase.findIndex((e)=>e.name==entitiesImport[identifier]);
                if(index!==-1){
                    const entityBase=entitiesBase[index];
                    newEntity.logic=entityBase.logic;
                    newEntity.style=entityBase.style;
                    newEntity.type=entityBase.type;
                    newEntity.habilities=entityBase.habilities;

                    this._data.push(newEntity);

                    logs.push(`Entidad ${identifier} cargada.`);
                }else{
                    warns.push(`[ERROR] Error al cargar la entidad '${identifier}' del mundo no se encontro dentro de '${rawEntitiesSource}'`)
                }
            }
        }
        return {warn: warns, log: logs}
    }
}
export { Entity, EntityManager}