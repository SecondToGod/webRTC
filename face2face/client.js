var name,connectedUser;
var connection = new WebSocket('ws://localhost:8888');
var loginPage = document.querySelector('#login-page'),
    usernameInput = document.querySelector('#username'),
    loginButton = document.querySelector('#login'),
    callPage = document.querySelector('#call-page'),
    theirnameInput = document.querySelector('#their-username'),
    callButton = document.querySelector('#call'),
    hangUpButton = document.querySelector('#hang-up');
var yourvideo = document.querySelector('#yours'),
    theirvideo = document.querySelector('#theirs'),
    yourConnection,theirConnection,stream;

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
callPage.style.display = 'none';
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
        callPage.style.display = 'block';
        startConnection();//初始化媒体流和连接信息
    }
};
function onOffer(offer,name){
    connectedUser = name;
    yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
    yourConnection.createAnswer(function(answer){
        yourConnection.setLocalDescription(answer);
        send({
            type: 'answer',
            answer: answer
        });
    },function(err){
        console.log(err);
    });
};
function onAnswer(answer){
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};
function onCandidate(candidate){
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};
function onLeave(){
    connectedUser = null;
    theirvideo.src = null;
    yourConnection.close();
    yourConnection.onicecandidate = null;
    yourConnection.onaddstream = null;
    setupPeerConnection(stream);
};
function startConnection(){
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
                            || navigator.webkitGetUserMedia;
    if(navigator.getUserMedia){
        navigator.getUserMedia({
            video: true,
            audio: false,
        },(mystream)=>{
            stream = mystream;
            yourvideo.src = window.URL.createObjectURL(stream);
        },(err)=>{
            console.log(err);
        });
        window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection ||window.mozRTCPeerConnection
                                || window.msRTCPeerConnection;
        window.RTCSessionDescription = window.RTCSessionDescription || window.RTCSessionDescription ||window.mozRTCSessionDescription
                                || window.msRTCSessionDescription;
        window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate ||window.mozRTCIceCandidate
                                || window.msRTCIceCandidate;
        if(window.RTCPeerConnection){
            setupPeerConnection(stream);//初始化本地连接
        }else{
            alert('对你不起，你的浏览器不支持RTCPeerConnection');
        }
    }
};
function setupPeerConnection(stream){
    let configuration = null;
    //'iceServers': [{'url':'stun:stun.1.google.com:19302'}]
    yourConnection = new RTCPeerConnection(configuration);//初始化本地连接
    yourConnection.addStream(stream);
    yourConnection.onaddstream = (e)=>{
        theirvideo.src = window.URL.createObjectURL(e.stream);
    };
    yourConnection.onicecandidate = (e)=>{
        e.candidate && send({
            type: 'candidate',
            candidate: e.candidate
        });
    };
 };
callButton.addEventListener('click',(e)=>{
    let theirname = theirnameInput.value;
    if( theirname.length > 0 ){
        startPeerConnection(theirname);//开始一个对等连接
    }
});
function startPeerConnection(user){
    connectedUser = user;
    yourConnection.createOffer(function(offer){
        send({
            type: 'offer',
            offer: offer
        });
        yourConnection.setLocalDescription(offer);
    },(error)=>{
        console.log(error);
    });
};
hangUpButton.addEventListener('click',(e)=>{
    send({
        type: 'leave'
    });
    onLeave();
});

