class Entity{
    id=-1;
    w=0; h=0;
    x=0; y=0;
    v=5;
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
    }

    setPos(x, y){
        this.x=x; this.y=y;
    }
}

async function parserEntities(rawEntitiesSource){
    const logs=[];
    const warns=[];
    const finallyEntities=[];
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

                finallyEntities.push(newEntity);

                logs.push(`Entidad ${identifier} cargada.`);
            }else{
                warns.push(`[ERROR] Error al cargar la entidad '${identifier}' del mundo no se encontro dentro de '${rawEntitiesSource}'`)
            }
        }
    }
    return [finallyEntities, {log: logs, warn: warns}];
}

export { Entity, parserEntities}