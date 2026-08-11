const canvas=document.querySelector("canvas");
const gl=canvas.getContext("webgl2");
const buffer=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
let scale={w:1, h:1};
let glScale={w: 0, h:0};

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
    _camX=0; _camY=0;

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
        this.#engine.clear();
        this.#engine.scale(this._zoom.value*scale.w, this._zoom.value*scale.h);
        this.#calcCam();
        this.#renderWorld();
        for(const entity of this._entities){
            this.#renderEntity(entity);
        }
        this.#engine.draw();
        this.#engine.clearEffects();
    }

    #calcCam(){
        const w=canvas.width/scale.w/this._zoom.value;
        const h=canvas.height/scale.h/this._zoom.value;
        this._entities.forEach((e)=>{
            if(e.id==this._playerId){
                const x=(e.x+e.w/2)-w/2;
                const y=(e.y+e.h/2)-h/2;
                this.#engine.offset(
                    -Math.min(Math.max(0, x), (this._size.w*100-w)),
                    -Math.min(Math.max(0, y), (this._size.h*100-h))
                )
            }
        })
    }
    #renderWorld(){
        for(let i=0; i<this._floor.length; i++){
            const x=i%this._size.w;
            const y=Math.floor(i/this._size.w);
            const f=this._floor[y*(this._size.w)+x];
            const s=this._floorSource[f+''].style;
            this.#engine.setFliiColor(s.bg);
            this.#engine.fillRect(x*100, y*100, 100, 100);
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

        console.log(this.#programs, this.#actProgram)
        this.update();
    }

    update(){
        gl.useProgram(this.#actProgram.obj);
        if(gl.getAttribLocation(this.#actProgram.obj, "color")){}
    }

    #useProgram(p){
        if(!this.#programs[p])
            throw new Error("No existe el programa '"+p+"'");

        this.#actProgram.program = p;
        this.#actProgram.obj = this.#programs[p].obj;
        this.#actProgram.drawConfig=this.#programs[p].drawConfig;
    }

    //basic
    setFliiColor(color){
        const c=color.split(",").map(e =>Number(e)/255);
        if(c.length==3)c.push(1);
        this.#actProgram.color=c;
    }

    fillRect(x, y, w, h){
        const offX=this.#effect.offset.x, offY=this.#effect.offset.y;
        const 
            a=[(x+offX)*glScale.w -1, 1- (y+offY)*glScale.h], //TopLeft
            b=[(x+w+offX)*glScale.w -1, 1- (y+offY)*glScale.h],//TopRight
            c=[(x+w+offX)*glScale.w -1, 1- (y+h+offY)*glScale.h],//BottomRight
            d=[(x+offX)*glScale.w -1, 1- (y+h+offY)*glScale.h];//BotomLeft

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

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            this.#vertexs.length/6
        );
        this.#vertexs=[];
    }
    clear(){

    }

    //effects
    offset(x, y){
        this.#effect.offset.x=x;
        this.#effect.offset.y=y;
    }
    scale(w, h){}
    clearEffects(){

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

    scale.w=canvas.width/800;
    scale.h=canvas.height/400;

    glScale.w=2/canvas.width;
    glScale.h=2/canvas.height;
}



window.addEventListener("resize", ()=>{resizeCanvas()});
resizeCanvas();