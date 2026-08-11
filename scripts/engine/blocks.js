export async function parserBlocks(rawBlocksSource){
    const Blocks=[];
    const Floors=[];

    //BLOCKS
    for(const blocksGroup of rawBlocksSource.blocks){
        const res=await fetch("assets/blocks/blocks/"+blocksGroup.src+".json");
        const blocksBase=await res.json();

        for(const [identifier, src] of Object.entries(blocksGroup.import)){
            const i=blocksBase.findIndex((e)=>e.name==src);
            if(i==-1){
                console.warn("Error al cargar el bloque", identifier, ", no se encontró", src, "en", blocksGroup.src);
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
            console.log(`Bloque ${identifier} cargado desde ${blocksGroup.src}/${src}`);
        }
    }

    //FLOOR
    for(const floorsGroup of rawBlocksSource.floors){
        const res=await fetch("assets/blocks/floors/"+floorsGroup.src+".json");
        const floorsBase=await res.json();

        for(const [identifier, src] of Object.entries(floorsGroup.import)){
            const i=floorsBase.findIndex((e)=>e.name==src);
            if(i==-1){
                console.warn("Error al cargar el suelo", identifier, ", no se encontró", src, "en", floorsGroup.src);
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
            console.log(`Suelo ${identifier} cargado desde ${floorsGroup.src}/${src}`);
        }
    }

    const finallyBlocks={};
    const finallyFloors={};
    for(const b of Blocks){
        finallyBlocks[b.id]=b;
    }
    for(const f of Floors){
        finallyFloors[f.id]=f;
    }
    return [finallyBlocks, finallyFloors];
}