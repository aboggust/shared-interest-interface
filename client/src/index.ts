import { main } from './ts/main'

import "./css/main.scss"

function loadDeployApp() {
    const app = document.getElementById("app")
    main(app)
    console.log("Done loading window");
}

window.onload = () => {
    loadDeployApp()
    console.log("Done loading window");
}