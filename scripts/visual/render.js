const canvas=document.querySelector("canvas");
const ctx=canvas.getContext("2d");
let scale={w:1, h:1}

export class Render{
    _size={w:0, h:0};
    _blocks=[];
    _blocksSource=[];
    _floor=[];
    _floorSource=[];
    _entities=[];
    _playerId=-1;
    _zoom={value: 1, step: 0.01, max: 1.25, min:0.95};

    _camX=0; _camY=0;

    constructor(){
        window.addEventListener("wheel", (e)=>{
            const dir=Math.sign(e.deltaY);
            this._zoom.value=Math.max(this._zoom.min, Math.min(this._zoom.value+this._zoom.step*dir, this._zoom.max));
        });
    }

    render(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(this._zoom.value, this._zoom.value);
        ctx.scale(scale.w, scale.h);
        this.#calcCam();
        this.#renderWorld();
        for(const entity of this._entities){
            this.#renderEntity(entity);
        }
        ctx.restore();
    }

    #calcCam(){
        const w=canvas.width/scale.w/this._zoom.value;
        const h=canvas.height/scale.h/this._zoom.value;
        this._entities.forEach((e)=>{
            if(e.id==this._playerId){
                const x=(e.x+e.w/2)-w/2;
                const y=(e.y+e.h/2)-h/2;
                ctx.translate(
                    -Math.min(Math.max(0, x), (this._size.w*100-w)),
                    -Math.min(Math.max(0, y), (this._size.h*100-h))
                )
            }
        })
    }
    #renderWorld(){
        for(let x=0; x<this._size.w; x++){
            for(let y=0; y<this._size.h; y++){
                const f=this._floor[y*(this._size.w)+x];
                const s=this._floorSource[f+''].style;
                ctx.fillStyle=s.bg;
                ctx.fillRect(x*100, y*100, 100, 100);
            }
        }
    }
    #renderEntity(entity){
        ctx.fillStyle=entity.style.bg;
        ctx.fillRect(entity.x, entity.y, entity.w, entity.h);
    }
}

function resizeCanvas(){
    const h=document.body.clientHeight;
    const w=document.body.clientWidth;
    if(h<=w/2){
        canvas.height=h;
        canvas.width=2*h;
    }else{
        canvas.width=w;
        canvas.height=w/2;
    }
    canvas.style.width=canvas.width+"px";
    canvas.style.height=canvas.height+"px";

    scale.w=canvas.width/800;
    scale.h=canvas.height/400;
}
window.addEventListener("resize", ()=>{resizeCanvas()});
resizeCanvas();