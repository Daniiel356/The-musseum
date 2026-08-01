import { Conn } from "./wsConnection.js";

export class Connection{
    #conn;
    constructor(){
        fetch("https://testserver-h5lx.onrender.com").catch((e)=>{
            console.log("ERROR al conectar")
        });
    }
    async connectToServer(){
        this.#conn=new Conn();
    }
}