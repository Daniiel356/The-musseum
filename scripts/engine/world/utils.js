const context={
    blocks:{cont: [], data: []},
    world:{size: {w:0, h:0}}
}

function colidesBlock(a, fun){
    const sX=Math.floor(a.x/100)-1, eX=Math.ceil(a.x/100)+1;
    const sY=Math.floor(a.y/100)-1, eY=Math.ceil(a.y/100)+1;

    for(let x=Math.max(sX, 0); x<Math.min(eX, context.world.size.w); x++){
        for(let y=Math.max(sY, 0); y<Math.min(eY, context.world.size.h); y++){
            let b=context.blocks.cont[y*context.world.size.w+x];
            if(b==0)continue;
            b=context.blocks.data[b+''].logic;

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

export { context, colidesBlock }