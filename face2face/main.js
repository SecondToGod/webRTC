;
var yourvideo = document.querySelector('#yours'),
    theirvideo = document.querySelector('#theirs');
function hasUserMedia() {
    return !!(navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia || navigator.webkitGetUserMedia);
};

function hasRTCPeerConnection() {
    return !!(window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection ||
        window.msRTCPeerConnection || window.webkitRTCPeerConnection);
};

function startPeerConnection(stream){
    let configuration = {
    //     'iceServers' : [{'url': "stun:127.0.0.1:9876"}]
    };
    yourConnection = new webkitRTCPeerConnection(configuration);
    theirConnection = new webkitRTCPeerConnection(configuration);
    //在对等连接中添加流
    yourConnection.addStream(stream);
    theirConnection.onaddstream = function(e){
        theirvideo.src = window.URL.createObjectURL(e.stream);
    };
    //传递ICE候选路径
    yourConnection.onicecandidate = function(e){
        if(e.candidate){
            theirConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
        }
    };
    theirConnection.onicecandidate = function(e){
        if(e.candidate){
            yourConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
        }
    };
    //建立SDP offer和answer
    yourConnection.createOffer((offer)=>{
		console.log(offer);
        yourConnection.setLocalDescription(offer);
        theirConnection.setRemoteDescription(offer);
		theirConnection.createAnswer((offer)=>{
			theirConnection.setLocalDescription(offer);
			yourConnection.setRemoteDescription(offer);
		},(error)=>{console.log(error)});
    },(error)=>{console.log(error)});
};
if (hasUserMedia()) {
    let options = {
            video: true,
            audio: false,
        };
    navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia || navigator.webkitGetUserMedia;
    navigator.getUserMedia(options, (stream) => {
        yourvideo.src = window.URL.createObjectURL(stream);
        if (hasRTCPeerConnection()) {
            startPeerConnection(stream);
        } else {
            console.log('您的浏览器不支持webRTC');
        }
    }, (error) => {
        console.log('不能捕获到媒体流');
    });
}else{
    console.log('未找到多媒体设备');
}