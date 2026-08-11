import { Conn } from "./wsConnection.js";

export class Connection{
    #conn=new Conn();
    #initResolve=()=>{};
    #initReject=()=>{};
    _host=false;
    _state=-1;
    _id=-1;
    on=()=>{};


    constructor(){
        fetch("https://testserver-h5lx.onrender.com").catch((e)=>{
            console.log("ERROR al conectar")
        });
        this.#conn.out=(e)=>this.#onMsg(e);
    }

    async connectToServer(){
        console.log("Conectando al server...");
        try{
            await this.#conn.init();
            console.log("Conectado con exito!, esperando primer mensaje..");
            this.#update();
            return new Promise((res, rej)=>{
                this.#initResolve=res;
                this.#initReject=rej;
            });
        }catch(err){
            this.#initReject(err);
        }
    }

    #update(){
        this._state=this.#conn.state;
    }

    #onMsg(e){
        const msg=JSON.parse(e.data);
        if(msg.first){
            this._host=msg?.host||false;
            this._id=msg?.id||-1;
            this.#initResolve();
            console.log("host:",msg.host," id:",msg.id);
        }
    }
}