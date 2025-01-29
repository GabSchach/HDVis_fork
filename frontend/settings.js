const settings = {

    graph: {
        placeHolderForMissingEdgeName: "",
        defaultShape : "ribosite",
        defaultShapeColor : "#808080",
        colorConsistency : false,
        groupingVariable : "institution",
        nodeColoringAttribute : "institution",
        colorSet : d3['schemeSet3'],
        showNodes : true,
    },

    ui: {
        infoboxEdgeColors: {
            transfers: '#ffd73d',
            produces: 'rebeccapurple',
            conditional: '#4D81BF',
        },
        showDetailsOpen : false,
        showDefaultTooltip : true
    },

    overviewNeatoSettings: {
        graphSettings: {
            layout: "neato",
            normalize: 0,
            fontsize: 90,
            bgcolor: '#262626'
        },
        nodeSettings: {
            fontname: "Helvetica,Arial,sans-serif",
            shape: 'cirlce',
            color: 'yellow',
            width: 2.5,
            style: "filled"
        },
        edgeSettings: {
            len: 3.7,
            color: "#00000088",
            penwidth: 3
        }
    },

    scenarioDotSettings: {
        graphSettings: {
            ranksep: 1,
            //nodesep: 1,
            rankdir: 'LR',
            fontname: 'Helvetica,Arial,sans-serif',
            splines: "polyline",
            //splines:"ortho",
            bgcolor: '#262626'
        },
        nodeSettings: {
            fontname: "Helvetica,Arial,sans-serif",
            shape: 'box',
            color: 'transparent',
            style: 'rounded'
        },
        edgeSettings: {
            fontname: "Helvetica,Arial,sans-serif",
            color: '#969696',
            style: 'bold',
            penwidth: 7
        }
    },

    groupColors: {
        origin: "#bc80bd",
        KA: "#fdb462",
        BMSGPK: "#ffed6f",
        'Gemeinde/Magistrat': "#ff4e41",
        //International:"#fdb462",
        //EMS:"#ffed6f",
        ELGA: "#80b1d3",
        GÖG: "#fb8072",
        default: "#bc80bd",
        Landesgesundheitsfonds: "#d9d9d9",
        SV: "#b3de69",
        StatistikAT: "#fb9a99",
    },

    database: {
        springURI: "http://localhost:8081"
    }


}