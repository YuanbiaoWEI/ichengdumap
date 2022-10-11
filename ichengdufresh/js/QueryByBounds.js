/* 创建地图 */
var centerpoint = [103.918276504945,30.757364097954];
var chengdubound = [102.7590,30.0510,105.0757,31.4650];
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


//绘制类型对象 2022.8.4
var typeSelect = document.getElementById('type');
//绘制对象
var draw;
//实例化一个矢量图层Vector作为绘制层
var source = null;
var vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0.5)'
        }),
        stroke: new ol.style.Stroke({
            color: '#63b400',
            width: 2
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: '#63b400'
            })
        })
    })
});
//将绘制层添加到地图容器中
map.addLayer(vector);
//搜索结果的图层和要素
var vectorfeature =null;
var vectorlayer =null;
//根据绘制类型进行交互绘制图形处理
function addInteraction() {
    //绘制类型
    var value = typeSelect.value;
    if (value !== 'Clear' && value !== 'None') {
        if (source == null) {
            source = new ol.source.Vector({ wrapX: false });
            //添加绘制层数据源
            vector.setSource(source);
        }
        var geometryFunction, maxPoints;
        if (value === 'Square') {
            value = 'Circle';
            //正方形图形（圆）
            geometryFunction = ol.interaction.Draw.createRegularPolygon(4);

        } else if (value === 'Box') {
            value = 'LineString';
            maxPoints = 2;
            geometryFunction = function (coordinates, geometry) {
                var start = coordinates[0];
                var end = coordinates[1];
                if (!geometry) {
                    //多边形
                    geometry = new ol.geom.Polygon([
                        [start, [start[0], end[1]], end, [end[0], start[1]], start]
                    ]);
                }
                geometry.setCoordinates([
                    [start, [start[0], end[1]], end, [end[0], start[1]], start]
                ]);
                return geometry;
            };
        }
        //实例化交互绘制类对象并添加到地图容器中
        draw = new ol.interaction.Draw({
            //绘制层数据源
            source: source,
            /** @type {ol.geom.GeometryType}几何图形类型 */
            type: value,
            //几何信息变更时调用函数
            geometryFunction: geometryFunction,
            //最大点数
            maxPoints: maxPoints
        });
        draw.on('drawend',function() {
            typeSelect.options[0].selected = true;
            map.removeInteraction(draw);
        })
        map.addInteraction(draw);
    }
    else if (value === 'Clear') {
        source = null;
        //清空绘制图形
        vector.setSource(source);
        //清除搜索结果
        ClearQuery();
    }
    else if (value === 'None'){
        map.removeInteraction(draw);
    }
}

//用户更改绘制类型触发的事件
typeSelect.onchange = function (e) {
    //移除绘制交互
    map.removeInteraction(draw);
    //清空绘制图形
    source = null;
    vector.setSource(source);
    //清除搜索结果
    ClearQuery();
    //添加交互绘制功能控件
    addInteraction();
};
//添加交互绘制功能控件
addInteraction();

var resultfeature;
function Query(){
    //停止绘制事件
    typeSelect.options[0].selected = true;
    map.removeInteraction(draw);

    if(source === null)
    {
        alert("请先绘制搜索区域!");
        return;
    }
    else{
        var areageom = (new ol.format.GeoJSON()).writeGeometryObject(source.getFeatures()[0].getGeometry());
        var areapolygon;
        if(source.getFeatures()[0].getGeometry().getType() !== 'Circle'){
            areapolygon = new ol.geom.Polygon(areageom.coordinates);
        }
        else {
            areapolygon = new ol.geom.Polygon.fromCircle(source.getFeatures()[0].getGeometry());
        }
        var dataurl = "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data";
        var getFeatureParams = new SuperMap.GetFeaturesByGeometryParameters({
            datasetNames: ["ChengduFresh:Shop"],
            geometry: areapolygon,
            spatialQueryMode: "INTERSECT",
            toIndex:200
        });
    }
    new ol.supermap.FeatureService(dataurl).getFeaturesByGeometry(getFeatureParams, function (serviceResult) {
        if(serviceResult.result.features.features.length === 0){
            alert("抱歉！该区域内没有店铺...");
            ClearQuery();
            return;
        }
        vectorfeature = (new ol.format.GeoJSON()).readFeatures(serviceResult.result.features);
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

        //地图鼠标移动事件
        map.on('pointermove',pointermoveListener);
        //地图鼠标点击事件
        map.on('click',clickListener);
    });
}

function ClearQuery(){
    map.removeLayer(vectorlayer);
    vectorlayer = null;
    vectorfeature = null;
    overlay.setPosition(undefined);
    map.removeOverlay(overlay);
    map.un("click",clickListener);
    source = null;
    //清空绘制图形
    vector.setSource(source);
}

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