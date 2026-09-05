const canvas=document.querySelector("canvas");
const gl=canvas.getContext("webgl2");
const buffer=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.clearColor(0, 0, 0, 0.005);
let scale={w:1, h:1};
let glScale={w: 0, h:0, rw:0, rh:0};
const tile=100;

export class Render{
    #engine=new RenderEngine();
    _size={w:0, h:0};
    _blocks=[];
    _blocksSource=[];
    _floor=[];
    _floorSource=[];
    _entities=[];
    _playerId=-1;
    _zoom={value: 1, step: 0.01, max: 1.25, min:0.95};
    _cam={
        x:0, y:0, w:0, h:0
    }

    constructor(){
        window.addEventListener("wheel", (e)=>{
            const dir=Math.sign(e.deltaY);
            this._zoom.value=Math.max(this._zoom.min, Math.min(this._zoom.value+this._zoom.step*dir, this._zoom.max));
        });
    }

    async init(){
        await this.#engine.init();
    }

    render(){
        this.#engine.scale(this._zoom.value*scale.w, this._zoom.value*scale.h);
        this.#calcCam();
        this.#renderWorld();
        for(const entity of this._entities){
            this.#renderEntity(entity);
        }
        this.#engine.draw();
    }

    screenToWorldX(x){
        const rect=canvas.getBoundingClientRect();
        const canvasX=(x-rect.left)*(canvas.width/rect.width);
        return canvasX/(this._zoom.value*scale.w)+this._cam.x;
    }
    screenToWorldY(y){
        const rect=canvas.getBoundingClientRect();
        const canvasY=(y-rect.top)*(canvas.height/rect.height);

        return canvasY/(this._zoom.value*scale.h)+this._cam.y;
    }

    #calcCam(){
        const w=canvas.width/scale.w/this._zoom.value;
        const h=canvas.height/scale.h/this._zoom.value;
        const p=this._entities.find(e=>e.id==this._playerId);
        if(!p)return;

        const maxX=Math.max(0,this._size.w*tile-w);
        const maxY=Math.max(0,this._size.h*tile-h);

        this._cam.x=Math.min(
            Math.max(0,(p.x+p.w/2)-w/2),
            maxX
        );

        this._cam.y=Math.min(
            Math.max(0,(p.y+p.h/2)-h/2),
            maxY
        );
        this._cam.w=w;
        this._cam.h=h;

        this.#engine.offset(
            -this._cam.x,
            -this._cam.y
        )
    }
    #renderWorld(){
        const 
            sX=Math.max(Math.floor(this._cam.x/tile), 0), 
            eX=Math.min(Math.ceil((this._cam.x+this._cam.w)/tile), this._size.w),
            sY=Math.max(Math.floor(this._cam.y/tile), 0),
            eY=Math.min(Math.ceil((this._cam.y+this._cam.h)/tile), this._size.h);

        for(let x=sX; x<eX; x++){
            for(let y=sY; y<eY; y++){
                const i=y*(this._size.w)+x;

                const floor=this._floorSource[this._floor[i]+''].style;
                const block=this._blocksSource[this._blocks[i]+''];

                this.#engine.setFliiColor(floor.bg);
                this.#engine.fillRect(
                    x*tile,
                    y*tile,
                    tile,
                    tile
                );

                if(this._blocks[i]=='0' || block.style.hidden)continue;
                this.#engine.setFliiColor(block.style.bg);
                this.#engine.fillRect(
                    x*tile+block.logic.x,
                    y*tile+block.logic.y,
                    block.logic.w,
                    block.logic.h
                );
            }
        }
    }

    #renderEntity(entity){
        this.#engine.setFliiColor(entity.style.bg);
        this.#engine.fillRect(entity.x, entity.y, entity.w, entity.h);
    }
}

class RenderEngine{
    #vertexs=[];
    #programs={};
    #actProgram={
        obj:null,
        program:null,
        color: [0,0,0,0],
        drawConfig: ()=>{}
    };
    #effect={
        offset:{x:0,y:0},
        scale: {w:1,h:1}
    }

    async init(){
        const bv=await this.#compileShader("basicVertex", gl.VERTEX_SHADER);
        const bf=await this.#compileShader("basicFragment", gl.FRAGMENT_SHADER);

        this.#programs.basic={
            obj:this.#createProgram(bv, bf),
            drawConfig:()=>{
                const pos=gl.getAttribLocation(this.#actProgram.obj, "pos");
                const col=gl.getAttribLocation(this.#actProgram.obj, "iColor");

                gl.enableVertexAttribArray(pos);
                gl.enableVertexAttribArray(col);

                gl.vertexAttribPointer(
                    pos,
                    2,
                    gl.FLOAT,
                    false,
                    24,
                    0
                );

                gl.vertexAttribPointer(
                    col,
                    4,
                    gl.FLOAT,
                    false,
                    24,
                    8
                );
            }
        };
        this.#useProgram("basic");
    }

    //basic
    setFliiColor(color){
        const c=color.split(",").map(e =>Number(e)/255);
        if(c.length==3)c.push(1);
        this.#actProgram.color=c;
    }

    fillRect(x, y, w, h){
        const offX=this.#effect.offset.x, offY=this.#effect.offset.y;
        const sW=this.#effect.scale.w, sH=this.#effect.scale.h;
        const 
            a=[(x+offX)*sW*glScale.w -1, 1- (y+offY)*sH*glScale.h], //TopLeft
            b=[(x+w+offX)*sW*glScale.w -1, 1- (y+offY)*sH*glScale.h],//TopRight
            c=[(x+w+offX)*sW*glScale.w -1, 1- (y+h+offY)*sH*glScale.h],//BottomRight
            d=[(x+offX)*sW*glScale.w -1, 1- (y+h+offY)*sH*glScale.h];//BotomLeft

        this.#vertexs.push(
            ...a, ...this.#actProgram.color,
            ...b, ...this.#actProgram.color,
            ...c, ...this.#actProgram.color,

            ...a, ...this.#actProgram.color,
            ...d, ...this.#actProgram.color,
            ...c, ...this.#actProgram.color
        );
    }

    draw(){
        this.#actProgram.drawConfig();
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(this.#vertexs),
            gl.STATIC_DRAW
        );
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            this.#vertexs.length/6
        );
        this.#vertexs=[];
    }

    //effects
    offset(x, y){
        this.#effect.offset.x=x;
        this.#effect.offset.y=y;
    }
    scale(w, h){
        this.#effect.scale.w=w;
        this.#effect.scale.h=h;
    }

    #createProgram(...shaders){
        const program=gl.createProgram();

        shaders.forEach((e)=>gl.attachShader(program, e));
        gl.linkProgram(program);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
            throw new Error("Error al linkear el programa");
        }
        return program;
    }

    async #compileShader(src, type){
        const res=await fetch("./assets/shaders/"+src+".glsl");
        const source=await res.text();

        const shader=gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            const info=gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Error al compilar el shader '"+src+"':\n"+info);
        }
        return shader;
    }
    #useProgram(p){
        if(!this.#programs[p])
            throw new Error("No existe el programa '"+p+"'");

        this.#actProgram.program = p;
        this.#actProgram.obj = this.#programs[p].obj;
        this.#actProgram.drawConfig=this.#programs[p].drawConfig;
        gl.useProgram(this.#actProgram.obj);
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
    gl.viewport(0, 0, canvas.width, canvas.height);
    canvas.style.width=canvas.width+"px";
    canvas.style.height=canvas.height+"px";

    scale.w=canvas.width/(tile*8);
    scale.h=canvas.height/(tile*4);

    glScale.w=2/canvas.width;
    glScale.h=2/canvas.height;
}

window.addEventListener("resize", ()=>{resizeCanvas()});
resizeCanvas();