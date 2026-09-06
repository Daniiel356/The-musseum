export class Conn {
    #ws;
    out=()=>{};
    get state(){return this.#ws?.readyState || -1};

    async init(){
        return new Promise((res, rej)=>{
            let intents=10;
            let error;

            while(intents>0){
                this.#ws=new WebSocket("wss://testserver-h5lx.onrender.com");
        
                this.#ws.onopen=()=>{
                    break;
                };
    
                this.#ws.onerror=(err)=>{
                    intents--;
                    error=err;
                    continue;
                };
            }
            if(intents==0){
                rej(error);
            }
            
            this.#ws.onmessage=(msg)=>{
                this.out(msg);
            };
            res();
        });
    }
    
    send(msg){
        this.#ws.send(msg);
    }
}