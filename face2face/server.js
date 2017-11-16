const ws = require('ws');
const webSocketServer =  ws.Server;
const wss = new webSocketServer({port:8888});

function sendTo(con,obj){
    con.send(JSON.stringify(obj));
}
let users={};
wss.on('connection',(connection)=>{
    console.log('connected.');
    connection.on('message',(message)=>{
        let data;
        try{
            data = JSON.parse(message);
        }catch(e){
            data = {};
            console.log('parsing error.');
        }
        switch(data.type){
            case 'login':{
                if(users[data.name]){
                    console.log("already login.");
                    sendTo(connection,{
                        type: 'login',
                        success: false,
                    });
                }else{
                    users[data.name] = connection;
                    connection.name = data.name;
                    sendTo(connection,{
                        type: 'login',
                        success: true,
                    });
                }
            } break;
            case 'offer':{
                let con = users[data.name];
                if(con){
                    connection.othername = data.name;
                    sendTo(con,{
                        type: 'offer',
                        offer: data.offer,
                        name: connection.name, 
                    });
                }
                else{
                    console.log('no such user'+ data.name);
                }
            } break;
            case 'answer':{
                let con = users[data.name];
                if(con){
                    sendTo(con,{
                        type: 'answer',
                        answer: data.answer,
                    });
                }else{
                    console.log('no such user'+ data.name);
                }
            } break;
            case 'candidate':{
                let con = users[data.name];
                if(con){
                    sendTo(con,{
                        type: 'candidate',
                        candidate: data.candidate,
                    });
                }else{
                    console.log('no such user'+ data.name);
                }
            } break;
            case 'leave':{
                let con = users[data.name];
                con.othername = null;
                if(con){
                    sendTo(con,{
                        type: 'leave',
                    });
                }
            } break;
            default:{
                sendTo(connection,{
                    type: 'error',
                    message: 'unknown message type',
                });
            } break;
        }
    });
    connection.on('close',()=>{
        if(connection.name){
            delete users[connection.name];
            if(connection.othername){
                let con = users[connection.othername];
                con.othername = null;
                if(con){
                    sendTo(con,{
                        type: 'leave',
                    });
                }
            }
        }
    });
});

wss.on('listening',()=>{
    console.log('server started ...');
})