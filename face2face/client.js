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
//登录
let loginPage = document.querySelector('#login-page'),
    usernameInput = document.querySelector('#username'),
    loginButton = document.querySelector('#login'),
    callPage = document.querySelector('#call-page'),
    theirnameInput = document.querySelector('#their-username'),
    callButton = document.querySelector('#call'),
    hangUpButton = document.querySelector('#hang-up');

callPage.style.display = 'none';
loginButton.addEventListener('click',(e)=>{
    name = usernameInput.value;
    if(name.length>0){
        send({
            type: 'login',
            name: name,
        });
    }
});
function onLogin(success){
    if(success === false){
        alert('登录失败，请使用另一个名字');
    }else{
        loginPage.style.display = 'none';
        callPage.style.display = 'block';
        startConnection();
    }
}