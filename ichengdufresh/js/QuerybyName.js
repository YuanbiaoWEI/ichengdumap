/* 创建地图 */
var centerpoint = [103.918276504945,30.757364097954];
var chengdubound = [102.7590,30.0510,105.0757,31.4650];

var map = new ol.Map({
    target: "mapCon",
    view: new ol.View({
       projection: 'EPSG:4326',
       center: centerpoint,
       zoom: 9.3
    }),
    controls: 
        ol.control.defaults({
            attributionOptions: ({
                collapsible: true
            })
          }).extend([
      new ol.control.ZoomToExtent({
          extent: chengdubound
      }),
      new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.createStringXY(5),
        placeholder: false,
        target:"coordinates"
      }),
      new ol.control.ScaleLine()
    ])
  });  

var Chengdutile= new ol.layer.Tile({
    name: "ChengduMap",
    projection:'EPSG:4326',
    source: new ol.source.TileSuperMapRest({
      url: 'http://localhost:8090/iserver/services/map-ChengduFresh/rest/maps/ChengduMap',
      wrapX: true,
    })
  });

var TiandiMap_vec = new ol.layer.Tile({
    name: "天地图矢量图层",
    source: new ol.source.XYZ({
        url: "http://t0.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=3bc6874f2b919aa581635abab7759a3f",
        wrapX: false
    })
});
var TiandiMap_cva = new ol.layer.Tile({
    name: "注记图层",
    source: new ol.source.XYZ({
        url: "http://t0.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}&tk=3bc6874f2b919aa581635abab7759a3f",
        wrapX: false
    })
});
map.addLayer(TiandiMap_vec);
map.addLayer(TiandiMap_cva);
map.addLayer(Chengdutile);

//实例化ZoomSlider控件并加载到地图容器中
var zoomslider = new ol.control.ZoomSlider();
  map.addControl(zoomslider);


//input监听enter键
$('#inputtext').on('keypress', Query);

var vectorlayer;
function Query(){

    //清楚原有搜索结果
    map.removeLayer(vectorlayer);
    vectorlayer = null;
    overlay.setPosition(undefined);
    map.removeOverlay(overlay);

    //处理输入的字符
    var inputtetx = document.getElementById('inputtext').value;
    if(inputtetx === ""){
        return;
    }
    var textarr = inputtetx.split("");
    var finalstring = "\'%";
    for(i=0;i<textarr.length;i++){
        finalstring = finalstring + textarr[i]+"%";
    }
    finalstring = finalstring +"\'";

    //使用SQL查询
    var url = "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data";
    var sqlParam = new SuperMap.GetFeaturesBySQLParameters({
        queryParameter: {
            name: "Shop@ChengduFresh",
            attributeFilter: "Name like "+ finalstring,
        },
        datasetNames: ["ChengduFresh:Shop"]
    });
    new ol.supermap.FeatureService(url).getFeaturesBySQL(sqlParam, function (serviceResult) {
        if(serviceResult.result.features.features.length === 0){
            alert("抱歉！找不到您要找的店铺...");
            ClearQuery();
            return;
        }
        var vectorfeature = (new ol.format.GeoJSON()).readFeatures(serviceResult.result.features);
        var vectorSource = new ol.source.Vector({
            features: vectorfeature,
            wrapX: false
        });
        vectorlayer = new ol.layer.Vector({
            name: "点矢量图层",
            source: vectorSource,
            style: new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 0.9],
                    src: '../img/locator/greenIcon.png'
                }))
            })
        });
        map.addLayer(vectorlayer);
        var tmpview = new ol.View({
            projection: 'EPSG:4326',
            center: serviceResult.result.features.features[0].geometry.coordinates,
            zoom: 14,
         });
         map.setView(tmpview);

        //地图鼠标移动事件
        map.on('pointermove',pointermoveListener);
        //地图鼠标点击事件
        map.on('click',clickListener);
    });
} 

//弹窗
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var overlay = new ol.Overlay(({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            },
            offset: [0, -20]
        }));
//监听鼠标移动事件
function pointermoveListener(e) {
    var select = false;
    map.forEachFeatureAtPixel(e.pixel, function (feature) {
        if (feature.getProperties().NAME) {
            map.getTargetElement().style.cursor = 'pointer';
            select = true
        }
    }, {
        hitTolerance: 5
    });
    if (!select) {
        map.getTargetElement().style.cursor = '';
    }
}
//监听鼠标点击事件
function clickListener(e) {
    var select = false;
    var tmpview = new ol.View({
        projection: 'EPSG:4326',
        center: e.coordinate,
        zoom: 14,
     });
    map.forEachFeatureAtPixel(e.pixel, function (feature) {
        if (feature.getProperties().NAME) {
            var marketid = feature.getProperties().超市ID;
            var url = "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data";

            var sqlParam = new SuperMap.GetFeaturesBySQLParameters({
                queryParameter: {
                    name: "Price@ChengduFresh",
                    attributeFilter: "超市ID = "+ marketid,
                },
                datasetNames: ["ChengduFresh:Price"]
            });
            new ol.supermap.FeatureService(url).getFeaturesBySQL(sqlParam, function (serviceResult) {
                var contentHTML = "<h5>&nbsp;&nbsp;店铺："+feature.getProperties().NAME+"</h5>";
                contentHTML = contentHTML+"<table width=\"300\" style=\"font-size: 4px;\"><tr><th>品类</th><th>价格（元/KG）</th><th>品类</th><th>价格（元/KG）</th></tr>"
                var features = serviceResult.result.features.features;
                for(i=0; i<features.length; i=i+2)
                {
                    contentHTML = contentHTML+"<tr><th>"+features[i].properties.品类+"</th><th>"+features[i].properties.价格元KG+"</th>";
                    if(i+1<features.length){
                        contentHTML = contentHTML+"<th>"+features[i+1].properties.品类+"</th><th>"+features[i+1].properties.价格元KG+"</th></tr>";
                    }
                    else{
                        contentHTML = contentHTML+"</tr>";
                    }
                }
                contentHTML = contentHTML+"</table>";
                content.innerHTML = contentHTML;
                overlay.setPosition(feature.getGeometry().getCoordinates());
                map.addOverlay(overlay);

                //map.setView(tmpview);

                select = true;
            });
        }
    }, {
        hitTolerance: 5
    });
    if (!select) {
        overlay.setPosition(undefined);
        map.removeOverlay(overlay);
    }
}

function ClearQuery(){
    map.removeLayer(vectorlayer);
    vectorlayer = null;
    overlay.setPosition(undefined);
    map.removeOverlay(overlay);
    var inputtetx = document.getElementById("inputtext");
    inputtetx.value = "";
    map.un("click",clickListener);
}