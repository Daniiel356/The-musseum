async function loadWorld(name){
    const res=await fetch("./assets/worlds/"+name+".json");
    if(!res.ok)throw new Error("Error al cargar el mundo "+name);

    return await res.json();
}

export {loadWorld}