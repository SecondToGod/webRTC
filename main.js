; function hasUserMedia(){
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUsermedia || navigator.msgetUserMedia);
}
if(hasUserMedia()){
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUsermedia || navigator.msgetUserMedia;
    navigator.getUserMedia(constraints,(stream)=>{
        let video = document.querySelector('video');
        video.src = window.URL.createObjectURL(stream);
    },(err)=>{
        console.log(err);
    });
}
let constraints = {
    video:{
        mandatory: {
            minWidth: 300,
            minHeight: 300
        }
    },
    audio:false
};
if(/Android|webOS|iPhone|iPad|iPod|Blackberry|IEMobile|Opera|Mini/i.test(navigator.userAgent)){
    constraints = {
        video:{
            minWidth: 250,
            minHeight: 250,
            maxWidth: 300,
            maxHeight: 300
        }
    }
}