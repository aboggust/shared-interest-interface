import { main } from './ts/main'
import { ResultTable } from "./ts/vis/ResultTable"

window.onload = () => {

    const resultTable = document.getElementById("result-table")
    const resultTableViz = new ResultTable(resultTable)
    resultTableViz.update(null)

    // Distill article figure data
    const fig2 = {
        caseStudy: "data_vehicle",
        scoreFn: 'iou_score',
        sortBy: -1,
        predictionFn: "correct_only",
        labelFilter: "jeep"
    }
    const app2 = document.getElementById('fig2')
    main(app2, true, fig2, true, true)

    const fig3 = {
        caseStudy: "data_vehicle",
        scoreFn: 'iou_score',
        sortBy: 1,
        predictionFn: "correct_only",
        labelFilter: "jeep"
    }
    const app3 = document.getElementById('fig3')
    main(app3, true, fig3, true, true)

    const fig4 = {
        caseStudy: "data_vehicle",
        scoreFn: 'saliency_proportion_score',
        sortBy: 1,
        predictionFn: "incorrect_only",
        labelFilter: ""
    }
    const app4 = document.getElementById('fig4')
    main(app4, true, fig4, true, true)

    const fig5 = {
        caseStudy: "data_melanoma",
        scoreFn: 'iou_score',
        sortBy: -1,
        predictionFn: "correct_only",
        labelFilter: ""
    }
    const app5 = document.getElementById('fig5')
    main(app5, true, fig5, true, true)

    const fig6 = {
        caseStudy: "data_melanoma",
        scoreFn: "bbox_proportion_score",
        sortBy: 1,
        predictionFn: "incorrect_only",
        labelFilter: "malignant"
    }
    const app6 = document.getElementById('fig6')
    main(app6, true, fig6, true, true)

    const fig7 = {
        caseStudy: "data_melanoma",
        scoreFn: 'saliency_proportion_score',
        sortBy: 1,
        predictionFn: "correct_only",
        labelFilter: "benign"
    }
    const app7 = document.getElementById('fig7')
    main(app7, true, fig7, true, true)

}