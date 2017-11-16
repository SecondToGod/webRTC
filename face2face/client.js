let name,connectedUser;
const connection = new WebSocket('ws://localhost:8888');
connection.onopen = ()=>{
    console.log('connected .');
};
connection.onmessage = (message)=>{
    console.log('got message',message.data);
    let data = JSON.parse(message.data);
    switch (data.type){
        case 'login':{
            onLogin(data.success);
        } break;
        case 'offer':{
            onOffer(data.offer,data.name);
        } break;
        case 'answer':{
            onAnswer(data.answer);
        } break;
        case 'leave':{
            onLeave();
        } break;
        default: break;
    }
};
connection.onerror = (error)=>{
    console.log('got error',error);
};
function send(message){
    if(connectedUser){
        message.name = connectedUser;
    }
    connection.send(JSON.stringify(message));
}