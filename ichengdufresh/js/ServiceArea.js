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
          extent: [103.81113,30.54342,104.29543,30.78572]
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

//得出所有商店点数组
var dataurl = "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data";
//[102.7590,30.0510,105.0757,31.4650]
var chengdupolygon = new ol.geom.Polygon([[[102.7590,31.4650],[102.7590,30.0510],[105.0757,30.0510],[105.0757,31.4650],[102.7590,31.4650]]]);
var getFeatureParams = new SuperMap.GetFeaturesByBoundsParameters({
    datasetNames: ["ChengduFresh:Shop"],
    bounds: chengdupolygon.getExtent(),
    toIndex:200
});
new ol.supermap.FeatureService(dataurl).getFeaturesByBounds(getFeatureParams, function (serviceResult) {
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
              src: '../img/locator/geolocation_marker.png'
          }))
      })
  });
  //得出所有商店点数组
  var shoppointarr = [];
  var shopweight = [];
  for(i=0;i<vectorfeature.length;i++){
      shoppointarr.push(new ol.geom.Point(vectorfeature[i].getGeometry().flatCoordinates));
      shopweight.push(3000);
  }
  //交通查询参数
  var resultSetting = new SuperMap.TransportationAnalystResultSetting({
    returnEdgeFeatures: true,
    returnEdgeGeometry: true,
    returnEdgeIDs: true,
    returnNodeFeatures: true,
    returnNodeGeometry: true,
    returnNodeIDs: true,
    returnPathGuides: true,
    returnRoutes: true
  });
  var analystParameter = new SuperMap.TransportationAnalystParameter({
    resultSetting: resultSetting,
    weightFieldName: "SmLength" 
  });
  var parameter = new SuperMap.FindServiceAreasParameters({
    centers: shoppointarr,
    isAnalyzeById: false,
    parameter: analystParameter,
    weights: shopweight,
    isCenterMutuallyExclusive: false,
    isFromCenter: true,
  });
  //进行服务区分析
  var serviceUrl = "http://localhost:8090/iserver/services/transportationAnalyst-ChengduFresh/rest/networkanalyst/Network@ChengduFresh";
  new ol.supermap.NetworkAnalystService(serviceUrl).findServiceAreas(parameter, function (serviceResult) 
    {
      console.log(serviceResult.result);
      serviceAreaList = serviceResult.result.serviceAreaList;
      var serviceAreaArr = []
      for(i=1;i<serviceAreaList.length;i++)
      {
        serviceAreaArr.push((new ol.format.GeoJSON()).readFeature(serviceResult.result.serviceAreaList[i].serviceRegion));
      }
      var areaSource = new ol.source.Vector({
        features: serviceAreaArr,
        wrapX: false
      });
      arealayer = new ol.layer.Vector({
          source: areaSource,
          opacity:0.2,
          style: new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgb(0, 100, 0)'
            }),
        })
      });

      var tmpview = new ol.View({
        projection: 'EPSG:4326',
        center: [104.06430,30.66334],
        zoom: 12
        });
      map.setView(tmpview);
      map.addLayer(arealayer);
      map.addLayer(vectorlayer);

      //地图鼠标移动事件
      map.on('pointermove',pointermoveListener);
      //地图鼠标点击事件
      var routeSource,routelayer,singleAreaSource,singleAreaLayer;
      var isOverlayRemove = false;
      map.on('click',function(e)
      {
        var select = false;
        map.forEachFeatureAtPixel(e.pixel, function (feature) {
            if (feature.getProperties().NAME) {
              if(routelayer !== undefined)
              {
                routelayer.getSource().clear();
                map.removeLayer(routelayer);
                singleAreaLayer.getSource().clear();
                map.removeLayer(singleAreaLayer);
              }
                
                var marketid = feature.getProperties().超市ID;
                var marketroute = (new ol.format.GeoJSON()).readFeatures(serviceAreaList[Number(marketid)-1].routes);
                var marketregion = (new ol.format.GeoJSON()).readFeatures(serviceAreaList[Number(marketid)-1].serviceRegion);
                routeSource = new ol.source.Vector({
                  features: marketroute,
                  wrapX: false
                });
                routelayer = new ol.layer.Vector({
                    source: routeSource,
                    style: new ol.style.Style({
                      stroke: new ol.style.Stroke({
                          color: 'rgba(0, 100, 0, 20)',
                          width: 2
                      }),
                  })
                });
                singleAreaSource = new ol.source.Vector({
                  features: marketregion,
                  wrapX: false
                });
                singleAreaLayer = new ol.layer.Vector({
                  source: singleAreaSource,
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
                map.removeLayer(vectorlayer);
                map.addLayer(singleAreaLayer);
                map.addLayer(routelayer);
                map.addLayer(vectorlayer);
    
                var contentHTML = "<h5>&nbsp;&nbsp;店铺："+feature.getProperties().NAME+"</h5>";
                //contentHTML = contentHTML + "<h5>&nbsp;&nbsp;服务面积："+areaoutput+"</h5>";
                content.innerHTML = contentHTML;
                overlay.setPosition(feature.getGeometry().getCoordinates());
                map.addOverlay(overlay);
                select = true;
                isOverlayRemove = false;
            }
        }, {
            hitTolerance: 5
        });
        if (!select) {
          if(!isOverlayRemove){
            overlay.setPosition(undefined);
            map.removeOverlay(overlay);
            isOverlayRemove = true;
          }
          else{
            routelayer.getSource().clear();
            map.removeLayer(routelayer);
            singleAreaLayer.getSource().clear();
            map.removeLayer(singleAreaLayer);
          } 
        }
    }
      );
      
    });
})

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
//function clickListenerAfterQuery(e) 

