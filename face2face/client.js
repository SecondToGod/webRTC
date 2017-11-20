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
        startConnection();//开始一个对等连接
    }
}
let yourvideo = document.querySelector('#yours'),
    theirvideo = document.querySelector('#theirs'),
    yourConnection,theirConnection,stream;
function startConnection(){
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
                            || navigator.webkitGetUserMedia;
    if(navigator.getUserMedia){
        navigator.getUserMedia({
            video: true,
            audio: false,
        },(mystream)=>{
            stream = mystream;
            yourvideo .src = window.URL.createObjectURL(stream);
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
            setupPeerConnection(stream);
        }else{
            alert('对你不起，你的浏览器不支持RTCPeerConnection');
        }
    }
}
function setupPeerConnection(stream){
    let configuration = {
        //'iceServers': [{'url':'stun:stun.1.google.com:19302'}]
    };
    yourConnection = new RTCPeerConnection(configuration);
    yourConnection.addStream(stream);
    yourConnection.onaddstream = function(e){
        theirvideo.src = window.URL.createObjectURL(e.stream);
    };
    yourConnection.onicecandidate = function(e){
        e.candidate && send({
            type: 'candidate',
            candidate: e.candidate
        });
    };
}
callButton.addEventListener('click',(e)=>{
    let theirname = theirnameInput.value;
    if( theirname.length > 0 ){
        startPeerConnection(theirname);
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
    },function(error){
        console.log(error);
    });
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
}
function onAnswer(answer){
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
}
function onCandidate(candidate){
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
}
