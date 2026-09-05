const context={
    blocks:{cont: [], data: {}},
    world:{size: {w:0, h:0}},
    tile: 32
}

function colidesBlock(a, fun){
    const sX=Math.floor(a.x/context.tile)-1, eX=Math.ceil(a.x/context.tile)+1;
    const sY=Math.floor(a.y/context.tile)-1, eY=Math.ceil(a.y/context.tile)+1;

    for(let x=Math.max(sX, 0); x<Math.min(eX, context.world.size.w); x++){
        for(let y=Math.max(sY, 0); y<Math.min(eY, context.world.size.h); y++){
            let b=context.blocks.cont[y*context.world.size.w+x];
            if(b==0)continue;
            
            b=context.blocks.data[b+''].logic;

            if(b.solid &&
                a.x+a.w>x*context.tile+b.x && a.x<x*context.tile+b.x+b.w &&
                a.y+a.h>y*context.tile+b.y && a.y<y*context.tile+b.y+b.h
            ){
                fun({x: x*context.tile+b.x, y:y*context.tile+b.y, w: b.w, h:b.h});
                return;
            }
        }
    }
}

export { context, colidesBlock }