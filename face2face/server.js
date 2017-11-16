const webSocketServer = require('ws').Server();

let users={};
function sentTo(con,obj){
    con.send(JSON.stringify(obj));
}
const wss = new webSocketServer({port:8888});
wss.on('connection',(connection)=>{
    console.log('connected.');
    connection.on('message',(message)=>{
        let data = {};
        try{
            data = JSON.parse(message);
        }catch(e){
            console.log("unknown message object.");
        }
        switch(data.type){
            case 'login':{
                if(users[data.name]){
                    console.log("already login.");
                    sendTo(connection,{
                        success: false,
                    });
                }else{
                    users[data.name] = connection;
                    connection.name = data.name;
                    sentTo(connection,{
                        success: true,
                    });
                }
            } break;
            case 'offer':{
                let con = data.con;
                connection.othername = con;
                if(users[con]){
                    sendTo(con,{
                        type: 'offer',
                        offer: data.offer,
                    });
                }else{
                    console.log('no such connection'+ data.con);
                }
            } break;
            case 'answer':{
                let con = data.con;
                if(users[con]){
                    sendTo(con,{
                        type: 'answer',
                        answer: data.answer,
                    });
                }else{
                    console.log('no such connection'+ data.con);
                }
            } break;
            case 'candidate':{
                let con = data.con;
                if(users[con]){
                    sendTo(con,{
                        type: 'candidate',
                        candidate: data.candidate,
                    });
                }else{
                    console.log('no such connection'+ data.con);
                }
            } break;
            case 'leave':{
                if(users[connection.name]){
                    connection.othername = null;
                    delete users[connection.name];
                    console.log('you have disconnected.');
                }
                else{
                    console.log("you haven't login .");
                }
            }
            default:{
                console.log('unknown message type');
            }
        }
    });
});
wss.on('close',()=>{
    console.log('you have left.')
});