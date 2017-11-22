var name,connectedUser;
var connection = new WebSocket('ws://localhost:8888');
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
connection.onerror = (err)=>{
    console.log('got error',err);
};
function send(message){
    if(connectedUser){
        message.name = connectedUser;
    }
    connection.send(JSON.stringify(message));
};
let loginPage = document.querySelector('#login-page'),
    usernameInput = document.querySelector('#username'),
    loginButton = document.querySelector('#login'),
    sharePage = document.querySelector('#share-page'),
    theirUsernameInput = document.querySelector('#their-username'),
    connectButton = document.querySelector('#connect'),
    sendButton = document.querySelector('#send'),
    readyText = document.querySelector('#ready'),
    statusText = document.querySelector('#status');

loginButton.addEventListener('click',(e)=>{
    name = usernameInput.value;
    if(name.length > 0){
        send({
            type: 'login',
            name: name
        });
    }
});
function onLogin(success){
    if(success === false){
        alert('登录失败，请使用另一个名字');
    }else{
        loginPage.style.display = 'none';
        sharePage.style.display = 'block';
        startConnection();//初始化媒体流和连接信息
    }
};
let yourConnection,dataChannel,currentFile,currentFileSize,currentFileMeta;
function startConnection(){
        window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection ||window.mozRTCPeerConnection
                                || window.msRTCPeerConnection;
        window.RTCSessionDescription = window.RTCSessionDescription || window.RTCSessionDescription ||window.mozRTCSessionDescription
                                || window.msRTCSessionDescription;
        window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate ||window.mozRTCIceCandidate
                                || window.msRTCIceCandidate;
        if(!!window.RTCPeerConnection){
            setupPeerConnection();//初始化本地连接
        }else{
            alert('对你不起，你的浏览器不支持RTCPeerConnection');
        }
 }
function setupPeerConnection(){
    let configuration = null;
    //'iceServers': [{'url':'stun:stun.1.google.com:19302'}]
    yourConnection = new RTCPeerConnection(configuration);//初始化本地连接
    yourConnection.onicecandidate = (e)=>{
        e.candidate && send({
            type: 'candidate',
            candidate: e.candidate
        });
    };
    openDataChannel();
 };