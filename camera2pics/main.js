; function hasUserMedia(){
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUsermedia || navigator.msgetUserMedia);
}
//已弃用
// MediaStreamTrack.getSources(function(sources){
//     let audioSource = null,
//         videoSource = null;
//     for(let i=0,j=sources.length;i<j;i++){
//         let source = sources[i];
//         if(source.kind === 'audio'){
//             console.log('audio founded',source.id,source.label);
//             audioSource = source.id;
//         }
//         else if(source.kind === 'video'){
//             console.log('video founded',source.id,source.label);
//             videoSource = source.id;
//         }
//         else{
//             console.log("unknown device");
//         }  
//     }
// });
let constraints = {
    video:{
        mandatory: {
            minWidth: 300,
            minHeight: 300
        }
    },
    audio:false
};
//移动端限制大小
if(/Android|webOS|iPhone|iPad|iPod|Blackberry|IEMobile|Opera|Mini/i.test(navigator.userAgent)){
    constraints = {
        video:{
            minWidth: 250,
            minHeight: 250,
            maxWidth: 480,
            maxHeight: 320
        },
        audio:false
    }
}
let video = document.querySelector('video');
let photo = document.querySelector('canvas');
let capture = document.getElementById('capture');
let filters = ['grayscale','sepia','invert'];
let currentFilter = 0;

if(hasUserMedia()){
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUsermedia || navigator.msgetUserMedia;
    navigator.getUserMedia(constraints,(stream)=>{
        video.src = window.URL.createObjectURL(stream);
    },(err)=>{
        console.log(err);
    });
    
    capture.addEventListener('click',(e)=>{
        photo.width = video.getBoundingClientRect().width;
        photo.height = video.getBoundingClientRect().height;
        let ctx = photo.getContext('2d');
        ctx.drawImage(video,0,0,photo.width,photo.height);
        currentFilter++;
        currentFilter %= (filters.length);
        photo.className = filters[currentFilter];
    },false);
}