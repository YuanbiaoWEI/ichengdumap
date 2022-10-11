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

//绘制起始点
var starpoint,pointlayer;
function DrawStarPoint(){
    //清楚原有绘点
    ClearQuery();

    map.un('click',clickListenerAfterQuery);
    map.getTargetElement().style.cursor = "pointer";
    map.once("click",clickListener);
}

function clickListener(e){
    starpoint = new ol.geom.Point(e.coordinate);
    map.getTargetElement().style.cursor = "";
    pointlayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [new ol.Feature({
                geometry: starpoint,
            })]
        }),
        style: new ol.style.Style({
            image: new ol.style.Icon(({
                anchor: [0.5, 0.9],
                src: '../img/locator/redIcon.png'
            }))
        })
    });
    map.addLayer(pointlayer);
}

var circlelayer,vectorlayer,pathLayer,pathstarpointLayer,pathendpointLayer,guideinfo;
function Query(){
    if(starpoint === null )
    {
        alert("请绘制起点");
    }
    else{
        //首先获取3000米内的点
        var metersPerUnit = map.getView().getProjection().getMetersPerUnit();
        var circleRadius = 3000.0 / metersPerUnit;
        var buffercircle = new ol.geom.Circle(starpoint.getCoordinates(), circleRadius);
        circlelayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [new ol.Feature({
                    geometry: buffercircle,
                })]
            }),
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
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
        map.addLayer(circlelayer);


        areapolygon = new ol.geom.Polygon.fromCircle(buffercircle);
        var dataurl = "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data";
        var getFeatureParams = new SuperMap.GetFeaturesByGeometryParameters({
            datasetNames: ["ChengduFresh:Shop"],
            geometry: areapolygon,
            spatialQueryMode: "INTERSECT",
            toIndex:200
        }); }
        new ol.supermap.FeatureService(dataurl).getFeaturesByGeometry(getFeatureParams, function (serviceResult) {
            if(serviceResult.result.features.features.length === 0){
                alert("抱歉！附近3公里没有店铺...");
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
            var shoppointarr = [];
            for(i=0;i<vectorfeature.length;i++){
                shoppointarr.push(new ol.geom.Point(vectorfeature[i].getGeometry().flatCoordinates))
            }

            //获取完成3000米范围内所有商铺后，做最短距离分析
            var resultSetting = new SuperMap.TransportationAnalystResultSetting({
            returnEdgeFeatures: true,
            //returnEdgeGeometry: true,
            //returnEdgeIDs: true,
            //returnNodeFeatures: true,
            //returnNodeGeometry: true,
            //returnNodeIDs: true,
            returnPathGuides: true,
            //returnRoutes: true
        });
        var analystParameter = new SuperMap.TransportationAnalystParameter({
            resultSetting: resultSetting,
            weightFieldName: "SmLength" 
        });
        var findClosetFacilitiesParameter = new SuperMap.FindClosestFacilitiesParameters({
            //事件点,必设参数
            event: starpoint,
            //要查找的设施点数量。默认值为1
            expectFacilityCount: 1,
            //设施点集合,必设
            facilities: shoppointarr,
            isAnalyzeById: false,
            maxWeight: 3000,
            parameter: analystParameter
        });
        //进行查找
        var serviceUrl = "http://localhost:8090/iserver/services/transportationAnalyst-ChengduFresh/rest/networkanalyst/Network@ChengduFresh";
        new ol.supermap.NetworkAnalystService(serviceUrl).findClosestFacilities(findClosetFacilitiesParameter, function (serviceResult) {
            serviceResult.result.facilityPathList.map(function (result) {
                console.log(result);
                //使用pathGuideItems绘制最短路径
                var vectorSource = new ol.source.Vector({
                    features: (new ol.format.GeoJSON()).readFeatures(result.pathGuideItems)
                });
                pathLayer = new ol.layer.Vector({
                    source: vectorSource,
                    style: new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: 'rgba(200, 0, 0, 20)',
                            width: 5
                        }),
                    })
                });

                var routestarpoint = new ol.source.Vector({
                    features: [new ol.Feature({
                        geometry: 
                        new ol.geom.Point(result.pathGuideItems.features[0].geometry.coordinates),
                    })]                                        
                });
                var routeendpoint = new ol.source.Vector({
                    features: [new ol.Feature({
                        geometry: 
                        new ol.geom.Point(result.pathGuideItems.features[result.pathGuideItems.features.length-1].geometry.coordinates),
                    })]
                });
                pathstarpointLayer = new ol.layer.Vector({
                    source: routestarpoint,
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            // 点半径
                            radius: 15,
                            // 点的边框，
                            stroke: new ol.style.Stroke({
                                color: 'rgba(200, 0, 0, 20)',
                                width: 3,
                            }),
                            // 缩放比
                            scale: 1,
                            //填充色
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 255, 20)',
                            })
                        })
                    })
                });
                pathendpointLayer = new ol.layer.Vector({
                    source: routeendpoint,
                    style: new ol.style.Style({
                        image: new ol.style.Circle({
                            // 点半径
                            radius: 15,
                            // 点的边框，
                            stroke: new ol.style.Stroke({
                                color: 'rgba(200, 0, 0, 20)',
                                width: 3,
                            }),
                            // 缩放比
                            scale: 1,
                            // 填充色
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 255, 20)',
                            })
                        })
                    })
                });
                //移动图层顺序并添加路径
                //vectorlayer是范围内商铺图层，pointlayer是起点图层
                map.removeLayer(vectorlayer);
                map.removeLayer(pointlayer);
                map.addLayer(pathLayer);
                map.addLayer(pathstarpointLayer);
                map.addLayer(pathendpointLayer);
                map.addLayer(vectorlayer);
                map.addLayer(pointlayer);

                //地图鼠标移动事件
                map.on('pointermove',pointermoveListener);
                //地图鼠标点击事件
                map.on('click',clickListenerAfterQuery);

                //获取起点商店店名
                var marketname = vectorfeature[result.facilityIndex].A.NAME;
                var dest = result.pathGuideItems.features[result.pathGuideItems.features.length-1].geometry.coordinates;
                //保存导航信息
                guideinfo = "1. 从店铺："+ marketname + " 出发\n"
                var j = 0;
                for(i=1;i<result.pathGuideItems.features.length-1;i++)
                {
                    if(result.pathGuideItems.features[i].properties.name === "")
                    {
                        guideinfo =guideinfo + (i+1).toString()+". "+result.pathGuideItems.features[i].properties.description;
                        if(result.pathGuideItems.features[i].properties.length !==0 )
                        {
                            guideinfo =guideinfo + result.pathGuideItems.features[i].properties.length.toFixed(0).toString() +"米\n";
                        }
                        else
                            guideinfo =guideinfo + "\n";
                    }
                    else
                    {
                        guideinfo =guideinfo + (i+1).toString()+". 在道路";
                        guideinfo =guideinfo + result.edgeFeatures.features[j].properties.NAME;
                        j = j+1
                        guideinfo =guideinfo + "上，";
                        var direction;
                        if(result.pathGuideItems.features[i].properties.directionType === "NORTH")
                            direction = "向北";
                        //服务器打成了SOURTH...
                        if(result.pathGuideItems.features[i].properties.directionType === "SOURTH")
                            direction = "向南";
                        if(result.pathGuideItems.features[i].properties.directionType === "WEST")
                            direction = "向西";
                        if(result.pathGuideItems.features[i].properties.directionType === "EAST")
                            direction = "向东";
                        guideinfo =guideinfo + direction + result.pathGuideItems.features[i].properties.length.toFixed(0).toString() +"米\n";
                    }
                }
                guideinfo =guideinfo + (result.pathGuideItems.features.length).toString()+". 到达目的地 东经：" + dest[0].toFixed(3).toString()+"；北纬："+dest[1].toFixed(3).toString();
            });
        });
        });
}

function ClearQuery(){
    starpoint = null;
    map.removeLayer(pointlayer);
    pointlayer = null;
    map.removeLayer(circlelayer);
    circlelayer = null;
    map.removeLayer(vectorlayer);
    vectorlayer = null;
    map.removeLayer(pathLayer);
    pathLayer = null;
    map.removeLayer(pathstarpointLayer);
    pathstarpointLayer = null;
    map.removeLayer(pathendpointLayer);
    pathendpointLayer = null;
    overlay.setPosition(undefined);
    map.removeOverlay(overlay);
    guideinfo = null;
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
        if (feature.getProperties().description) {
            map.getTargetElement().style.cursor = 'pointer';
            select = true;
        }
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
function clickListenerAfterQuery(e) {
    var select = false;
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
                select = true;
            });
        }
        if (feature.getProperties().description) {
            var contentHTML
            if(feature.getProperties().length !== 0)
            {
                var direction;
                if(feature.getProperties().directionType === "NORTH")
                    direction = "向北";
                //服务器打错成SOURTH...
                if(feature.getProperties().directionType === "SOURTH")
                    direction = "向南";
                if(feature.getProperties().directionType === "WEST")
                    direction = "向西";
                if(feature.getProperties().directionType === "EAST")
                    direction = "向东";
                contentHTML = direction + feature.getProperties().length.toFixed(0).toString() +"米";
            }
            else
                contentHTML = feature.getProperties().description;
            content.innerHTML = contentHTML;
            overlay.setPosition(e.coordinate);
            map.addOverlay(overlay);
            select = true;
        }
    }, {
        hitTolerance: 5
    });
    if (!select) {
        overlay.setPosition(undefined);
        map.removeOverlay(overlay);
    }
}

function AlertInfo(){
    if(guideinfo !== undefined && guideinfo !== null)
    {
        confirm(guideinfo);
    }
}