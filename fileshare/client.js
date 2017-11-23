let name,connectedUser;
let connection = new WebSocket('ws://localhost:8888');
let yourConnection,dataChannel,currentFile,currentFileSize,currentFileMeta;

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
 function openDataChannel(){
     let dataChannelOptions = {
        ordered: true,
        reliable: true,
        negotiated: true,
        id: 'mychannel'
     };
     dataChannel = yourConnection.createDataChannel('myLabel',dataChannelOptions);
     dataChannel.onerror = (err)=>{
         console.log('error:' ,err);
     };
     dataChannel.onmessage = (e)=>{
        //接收数据处理.组合数据分片
        try{
            let message = JSON.parse(e.data);
            switch(message.type){
                case 'start':
                    currentFile = [];
                    currentFileMeta = message.data;
                    console.log('receiving file',currentFileMeta);
                    break;
                case 'end':
                    saveFile(currentFileMeta,currentFile);
                    break;
            }
        }catch(err){//接收文件数据
            currentFile.push(atob(e.data));
            currentFileSize += currentFile[currentFile.length-1].length;
            let percentage = Math.floor(currentFileSize/currentFileMeta.size*100);
            statusText.innerHTML = 'receiving ...'+ percentage +'%' ;
        }
     };
     dataChannel.onopen = ()=>{
        readyText.style.display = 'block';
     };
     dataChannel.onclose = ()=>{
         readyText.style.display = 'none';
     }
 };
 function hasFileApi(){
     return !!window.Blob && window.File && window.FileReader && window.FileList;
 }
 connectButton.addEventListener('click',(e)=>{
     let theirUsername = theirUsernameInput.value();
     if(theirUsername.length > 0){
         startPeerConnection(theirUsername);
     }
 });
 function startPeerConnection(user){
    connectedUser = user;
    yourConnection.createOffer(function(offer){
        sned({
            type: 'offer',
            offer: offer
        });
        yourConnection.setLocalDescription(offer);
    },(err)=>{
        console.log(err);
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
};
function onAnswer(answer){
    yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
};
function onCandidate(candidate){
    yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
};
function onLeave(){
    connectedUser = null;
    yourConnection.close();
    yourConnection.onicecandidate = null;
};
sendButton.addEventListener('click',(e)=>{
    let files = document.querySelector('#files').files;
    if(files.length > 0){//通过数据通道发送文件
        dataChannel.send({
            type: "start",
            data: files[0]
        });
        sendFile(files[0]);
    }
});
//定义转码函数
function arrayBufferToBase64(buffer){
    let binary = '';
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for(let i=0;i<len;i++){
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);//unicode->string->base64
};
function base64toBlob(b64Data,contentType){
    contentType = contentType || '';
    let byteArrays = [], byteNumbers , slice;
    let len = b64Data.length;
    for(let i=0;i<len;i++){
        slice = b64Data[i];
        let slen = slice.length;
        byteNumbers = new Array(slen);
        for(let n=0;n<slen;n++){
            byteNumbers[n] = slice.charCodeAt(n);//字符->unicode
        }
        let byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    let blob = new Blob(byteArrays,{type:contentType});
    return blob;
};//base64->unicode
function sendFile(file){
    let CHUNK_SIZE = 16000;
    let reader = new FileReader();
    reader.onloaded = (e)=>{
        if(e.target.readyState == FileReader.DONE){
            let buffer = reader.result,
                start = 0,
                end = 0,
                last = false;
            function sendChunk(){
                end = start + CHUNK_SIZE;
                if(end > file.size){
                    end = file.size;
                    last = true;
                }
                dataChannel.send(arrayBufferToBase64(buffer.slice(start,end)));
                if(last == true ){
                    dataChannel.send({
                        type: 'end'
                    });
                }else{
                    start = end;
                    setTimeout(()=>{
                        sendChunk();
                    },200);
                }
                let percentage = Math.floor((end/file.size)*100);
                statusText.innerHTML = 'sending ...'+ percentage +'%'; 
            };
        }
    }
    reader.readAsArrayBuffer(file);//读入文件
};
//通过创建链接来伪保存文件到本地
function saveFile(meta,data){
    let blob = base64toBlob(data,meta.type);
    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = meta.name;
    link.click();
}
