import {main} from './ts/main'

import "!file-loader?name=index.html!./index.html";
import "./css/main.scss"


window.onload = () => {
    const app = document.getElementById("app")
    main(app)
    console.log("Done loading window");
}