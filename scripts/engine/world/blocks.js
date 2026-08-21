import { context } from "./utils.js";

export class ContentManager{
    #world;
    _blocks=[];
    _blocksData={};
    _floor=[];
    _floorData={};

    constructor(world){
        this.#world=world;
    }

    findBlocksIndexs(e){
        const res=[];
        this._blocks.forEach((b, i)=>{
            if(b!==0 && e({id: b, data: this._blocksData[b+'']}))res.push(i);
        });
        return res;
    }

    async parse(rawBlocksSource){
    console.log("parser")
        const blocksInfoLog=[];
        const blocksWarnLog=[];
        const Blocks=[];

        //BLOCKS
        for(const blocksGroup of rawBlocksSource.blocks){
            const res=await fetch("assets/blocks/blocks/"+blocksGroup.src+".json");
            const blocksBase=await res.json();

            for(const [identifier, src] of Object.entries(blocksGroup.import)){
                const i=blocksBase.findIndex((e)=>e.name==src);
                if(i==-1){
                    blocksWarnLog.push(`Error al cargar el bloque '${identifier}', no se encontró '${src}' en '${blocksGroup.src}'.`);
                    continue;
                }

                const base=blocksBase[i];

                const newBlock={
                    id: identifier,
                    name: base.name,
                    logic: base.logic,
                    style: base.style
                };

                Blocks.push(newBlock);
                blocksInfoLog.push(`Bloque ${identifier} cargado desde ${blocksGroup.src}/${src}`);
            }
        }

        //FLOOR
        const Floors=[];
        const floorInfoLog=[];
        const floorWarnLog=[];

        for(const floorsGroup of rawBlocksSource.floors){
            const res=await fetch("assets/blocks/floors/"+floorsGroup.src+".json");
            const floorsBase=await res.json();

            for(const [identifier, src] of Object.entries(floorsGroup.import)){
                const i=floorsBase.findIndex((e)=>e.name==src);
                if(i==-1){
                    floorWarnLog.push(`Error al cargar el suelo '${identifier}', no se encontró '${src}' en '${floorsGroup.src}'`);
                    continue;
                }

                const base=floorsBase[i];

                const newFloor={
                    id: identifier,
                    name: base.name,
                    logic: base.logic,
                    style: base.style
                };
                Floors.push(newFloor);
                floorInfoLog.push(`Suelo ${identifier} cargado desde ${floorsGroup.src}/${src}`);
            }
        }

        for(const b of Blocks){
            this._blocksData[b.id]=b;
        }
        for(const f of Floors){
            this._floorData[f.id]=f;
        }

        context.blocks.cont=[...this._blocks];
        context.blocks.data={...this._blocksData};        

        return {log: [...blocksInfoLog, ...floorInfoLog], warn: [...blocksWarnLog, ...floorWarnLog]};
    }
}