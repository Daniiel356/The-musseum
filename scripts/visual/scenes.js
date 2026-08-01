let doc;
const cont=document.getElementById("ui");
const c=document.querySelector("canvas");
try{
    const respuesta=await fetch("./assets/other/menus.html");
    if(!respuesta.ok){
        throw new Error(`Error al cargar el archivo: ${respuesta.status}`);
    }
    
    const textoHTML=await respuesta.text();
    const parser=new DOMParser();
    const documentoClonado=parser.parseFromString(textoHTML, 'text/html');
    doc=documentoClonado;
}catch(error){
    console.error('Hubo un problema:', error.message);
}

const scenes={
    MENU: "main",
    PLAY_MENU: "initialPlay",
    LOAD_SCREEN: "loadSetting",
    GAME: "game"
};

async function setScene(scene){
    document.body.style.background="#fff";
    if(!doc)return;
    cont.innerHTML="";
    const template=doc.getElementById(scene);
    if(!template)return;

    if(scene==="game")document.body.style.background="#333";

    const clon=document.importNode(template.content, true);

    const script=clon.querySelector('script');
    if(script){
        const newScript=document.createElement('script');
        newScript.textContent=script.textContent;
        script.replaceWith(newScript);
    }

    cont.appendChild(clon);
}

export {setScene, scenes}