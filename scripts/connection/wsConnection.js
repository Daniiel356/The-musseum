export class Conn {
    #ws;
    out=()=>{};
    get state(){return this.#ws?.readyState || -1};

    async init(){
        this.#ws=new WebSocket("wss://testserver-h5lx.onrender.com");
        let resolve=()=>{
            console.log("Ejem...");
        };
        let reject=()=>{
            console.error("Error de conexion");
        }

        this.#ws.onopen=()=>{
            resolve();
        };

        this.#ws.onmessage=(msg)=>{
            this.out(msg);
        };

        this.#ws.onerror=(err)=>{
            reject(err);
        };
        return new Promise((res, rej)=>{
            resolve=res;
            reject=rej;
        });
    }
    send(msg){
        this.#ws.send(msg);
    }
}