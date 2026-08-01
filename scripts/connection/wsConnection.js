export class Conn {
    #ws=new WebSocket("wss://testserver-h5lx.onrender.com");

    constructor(){
        this.#ws.onopen=()=>{
            console.log("Conectado al Server")
        }

        this.#ws.onmessage=(msg)=>{
            const data=JSON.parse(msg.data);
            if(data.id)console.log("id:", data.id);
            if(data.host)console.log("Eres host");

        }
    }
}