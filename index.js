import React from 'react'
import ReactDOM from 'react-dom'
import Modal, {closeStyle} from 'simple-react-modal'
import { Button, ButtonToolbar } from 'react-bootstrap'; // This is newly added
import * as tf from '@tensorflow/tfjs'
import myStyles from './styles.css'
import {alertPopUp} from './components/alertPopUp.js'



//import {capture-video-frame} from 'capture-video-frame'
const MODEL_URL = process.env.PUBLIC_URL + '/model_web/'
const LABELS_URL = MODEL_URL + 'labels.json'
const MODEL_JSON = MODEL_URL + 'model.json'


const TFWrapper = model => {
  const calculateMaxScores = (scores, numBoxes, numClasses) => {
    const maxes = []
    const classes = []
    for (let i = 0; i < numBoxes; i++) {
      let max = Number.MIN_VALUE
      let index = -1
      for (let j = 0; j < numClasses; j++) {
        if (scores[i * numClasses + j] > max) {
          max = scores[i * numClasses + j]
          index = j
        }
      }
      maxes[i] = max
      classes[i] = index
    }
    return [maxes, classes]
  }

  const buildDetectedObjects = (
    width,
    height,
    boxes,
    scores,
    indexes,
    classes
  ) => {
    const count = indexes.length
    const objects = []
    for (let i = 0; i < count; i++) {
      const bbox = []
      for (let j = 0; j < 4; j++) {
        bbox[j] = boxes[indexes[i] * 4 + j]
      }
      const minY = bbox[0] * height
      const minX = bbox[1] * width
      const maxY = bbox[2] * height
      const maxX = bbox[3] * width
      bbox[0] = minX
      bbox[1] = minY
      bbox[2] = maxX - minX
      bbox[3] = maxY - minY
      objects.push({
        bbox: bbox,
        class: classes[indexes[i]],
        score: scores[indexes[i]]
      })
    }
    return objects
  }

  const detect = input => {
    const batched = tf.tidy(() => {
      const img = tf.browser.fromPixels(input)
      // Reshape to a single-element batch so we can pass it to executeAsync.
      return img.expandDims(0)
    })

    const height = batched.shape[1]
    const width = batched.shape[2]

    return model.executeAsync(batched).then(result => {
      const scores = result[0].dataSync()
      const boxes = result[1].dataSync()

      // clean the webgl tensors
      batched.dispose()
      tf.dispose(result)

      const [maxScores, classes] = calculateMaxScores(
        scores,
        result[0].shape[1],
        result[0].shape[2]
      )

      const prevBackend = tf.getBackend()
      // run post process in cpu
      tf.setBackend('cpu')
      const indexTensor = tf.tidy(() => {
        const boxes2 = tf.tensor2d(boxes, [
          result[1].shape[1],
          result[1].shape[3]
        ])
        return tf.image.nonMaxSuppression(
          boxes2,
          maxScores,
          20, // maxNumBoxes
          0.5, // iou_threshold
          0.5 // score_threshold
        )
      })
      const indexes = indexTensor.dataSync()
      indexTensor.dispose()
      // restore previous backend
      tf.setBackend(prevBackend)

      return buildDetectedObjects(
        width,
        height,
        boxes,
        maxScores,
        indexes,
        classes
      )
    })
  }
  return {
    detect: detect
  }
}

class App extends React.Component {
  constructor(props){
    super(props);
    //this.getPHP = this.getPHP.bind(this);
    this.state = {alertPopUpShow : false}
    this.prevlabels = [];
    this.new_object_entered = 0;
  }


  show(){  
    window["takeSnapshot"]();
    //window["uploadObjectImage"]();
  }

  close(){
    this.setState({show:false});
  }

  videoRef = React.createRef()
  canvasRef = React.createRef()

  componentDidMount() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const webCamPromise = navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            facingMode: 'user'
          }
        })
        .then(stream => {
          window.stream = stream
          this.videoRef.current.srcObject = stream
          return new Promise((resolve, _) => {
            this.videoRef.current.onloadedmetadata = () => {
              resolve()
            }
          })
        })

      const modelPromise = tf.loadGraphModel(MODEL_JSON)
      const labelsPromise = fetch(LABELS_URL).then(data => data.json())
      Promise.all([modelPromise, labelsPromise, webCamPromise])
        .then(values => {
          const [model, labels] = values
          this.detectFrame(this.videoRef.current, model, labels)
        })
        .catch(error => {
          console.error(error)
        })
    }
  }

  detectFrame = (video, model, labels) => {
   
    TFWrapper(model)
      .detect(video)
      .then(predictions => {
        this.renderPredictions(predictions, labels)
        
        requestAnimationFrame(() => {
          this.detectFrame(video, model, labels)
        })
        
      })
      
      
  }


  renderPredictions = (predictions, labels) => {
    var final_label = '' //added by me
    const ctx = this.canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    // Font options.
    const font = '16px sans-serif'
    ctx.font = font
    ctx.textBaseline = 'top'
    predictions.forEach(prediction => {
      const x = prediction.bbox[0]
      const y = prediction.bbox[1]
      const width = prediction.bbox[2]
      const height = prediction.bbox[3]
      const label = labels[parseInt(prediction.class)]
      // Draw the bounding box.
      ctx.strokeStyle = '#00FFFF'
      ctx.lineWidth = 4
      ctx.strokeRect(x, y, width, height)
      // Draw the label background.
      ctx.fillStyle = '#00FFFF'
      const textWidth = ctx.measureText(label).width
      const textHeight = parseInt(font, 10) // base 10
      ctx.fillRect(x, y, textWidth + 4, textHeight + 4)
    })

    predictions.forEach(prediction => {
      const x = prediction.bbox[0]
      const y = prediction.bbox[1]
      const label = labels[parseInt(prediction.class)]


      // Draw the text last to ensure it's on top. // commented by me
      //ctx.fillStyle = '#000000'
      //ctx.fillText(label, x, y)
      if(label == "Calculator"){
        ctx.fillStyle = '#000000'
      ctx.fillText(label, x, y)
       
        this.setState({alertPopUpShow : true})
        var audioTune = document.getElementById("myAudio");
       
      }
    })
    

    if(predictions.size == 0){
      alert('Yes it is here');
      this.prevlabels = []
      return;
      this.new_object_entered = 1;

    }else{
      this.new_object_entered = 0;
      //alert('this is the wrong logic');
    }
    var i = 0;

    predictions.forEach(prediction => {
      const label = labels[parseInt(prediction.class)]
      if(this.new_object_entered == 1 && label == "Cellphone"){

        this.show();
        document.getElementById("detectionAlertBtn").click();
        this.setState({alertPopUpShow : true})
        var audioTune = document.getElementById("myAudio");
        audioTune.play();

      }else if(this.new_object_entered == 0 && label == "Calculator" && label != this.prevlabels[i]){
        //send alert to LEU
        this.show();
        //document.getElementById("detectionAlertBtn").click();
        this.setState({alertPopUpShow : true})
        var audioTune = document.getElementById("myAudio");
        audioTune.play();
        //this.show();
        final_label = label
      }
      
      this.prevlabels[i] = label
      i++;
    })
    return final_label;
  }


  

  render() {
    let alertPopUpClose = () => this.setState({alertPopUpShow:false})
    return (

      <div id="">
      <script src="capture-video-frame.js"></script>
      
      
      

        <video
        id="myVideo"
          className="size"
          autoPlay
          //playsInline
          muted
          ref={this.videoRef}
          width="250"
          height="200"
          
        />
        

        
        <canvas
          className="size"
          ref={this.canvasRef}
          width="250"
          height="200"
          
        />

      <audio id="myAudio">
          
          <source src="ObjectAlarm.mp3" type="audio/wav" />
          Your browser does not support the audio element.
        </audio>


      </div>



    )
  }
}


const rootElement = document.getElementById('div_live_video_feed')
ReactDOM.render(<App />, rootElement)
