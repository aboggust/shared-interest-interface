import {main} from './ts/main'

import "!file-loader?name=index.html!./index.html";
import "./css/main.scss"


window.onload = () => {
    const app = document.getElementById("app")
    const app2 = document.getElementById("app2")
    main(app)
    main(app2, true, {caseStudy: "data_dogs", sortBy: -1, scoreFn: "iou_score", predictionFn: "correct_only", labelFilter: ""}, true)
    console.log("Done loading window");
}