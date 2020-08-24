import { main } from './ts/main'

window.onload = () => {

    const fullApp = document.getElementById("full-app")
    main(fullApp, true)

    // For Distill article
    const fig1 = [
        // a
        {
            caseStudy: "data_vehicle",
            scoreFn: 'iou_score',
            sortBy: -1,
            predictionFn: "correct_only",
            labelFilter: "jeep"
        },

        // b
        {
            caseStudy: "data_vehicle",
            scoreFn: 'iou_score',
            sortBy: 1,
            predictionFn: "correct_only",
            labelFilter: "jeep"
        },

        // c
        {
            caseStudy: "data_vehicle",
            scoreFn: 'iou_score',
            sortBy: 1,
            predictionFn: "incorrect_only",
            labelFilter: ""
        }

    ]

    const fig2 = [
        // a
        {
            caseStudy: "data_melanoma",
            scoreFn: 'iou_score',
            sortBy: -1,
            predictionFn: "correct_only",
            labelFilter: ""
        },

        // b
        {
            caseStudy: "data_melanoma",
            scoreFn: "bbox_proportion_score",
            sortBy: 1,
            predictionFn: "incorrect_only",
            labelFilter: "malignant"
        },

        // c
        {
            caseStudy: "data_melanoma",
            scoreFn: 'saliency_proportion_score',
            sortBy: 1,
            predictionFn: "correct_only",
            labelFilter: "benign"
        }
    ]

    fig1.forEach((p, i) => {
        const appId = `fig1-${i}`
        const app = document.getElementById(appId)
        main(app, true, p, true)
    })

    fig2.forEach((p, i) => {
        const appId = `fig2-${i}`
        const app = document.getElementById(appId)
        main(app, true, p, true)
    })

    console.log("Done loading window");
}