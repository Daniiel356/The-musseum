import { Conn } from "./wsConnection.js";

export class Connection{
    #context;
    #conn=new Conn();
    _host=false;
    _state=-1;
    _id=-1;
    on=()=>{};

    constructor(context){
        this.#context=context;
        fetch("https://testserver-h5lx.onrender.com").catch((e)=>{
            console.log("ERROR al conectar")
        });
    }

    async connectToServer(){
        console.log("Conectando al server...");
        return new Promise((res, rej)=>{
            try{
                await this.#conn.init();
                console.log("Conectado con exito!, esperando primer mensaje..");
                const data=await new Promise((res, rej)=>{
                    setTimeout(()=>this._id!=-1&&rej("Id Timeout exception"), 5000);
                    #this.#conn.out=(e)=>{
                        const msg=JSON.parse(msg);
                        if(msg.first){
                            res([msg.id, msg.host]);
                        }
                    }
                });
                this._id=data[0];
                this._host=data[1];
                this.#conn.out=(e)=>this.#onMsg(e);
                this.#update();
                res(data);
            }catch(err){
                rej(err);
            }
        });
    }

    postInput(id, input){
        console.log("redireccionando input")
        this.#context.setInput(id, input);
    }

    #update(){
        this._state=this.#conn.state;
    }

    #onMsg(e){
        const msg=JSON.parse(e.data);
    }
}