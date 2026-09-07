export class Conn{
    #ws;
    out=()=>{};

    get state(){
        return this.#ws?.readyState || -1;
    }

    async init(){
        let intents=10;
        let error;

        while(intents>0){
            try{
                await new Promise((res, rej)=>{
                    this.#ws=new WebSocket(
                        "wss://testserver-h5lx.onrender.com"
                    );

                    this.#ws.onopen=()=>{
                        res();
                    };

                    this.#ws.onerror=(err)=>{
                        rej(err);
                    };
                });

                // La conexión funcionó
                break;

            }catch(err){
                intents--;
                error=err;

                console.log(`Intento fallido. Quedan ${intents} intentos`);
            }
        }

        if(intents==0){
            throw error;
        }

        this.#ws.onmessage=(msg)=>{
            this.out(msg);
        };
    }

    send(msg){
        this.#ws.send(msg);
    }
}