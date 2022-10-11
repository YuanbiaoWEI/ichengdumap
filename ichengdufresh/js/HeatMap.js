/* 创建地图 */
var centerpoint = [103.918276504945,30.757364097954];
var chengdubound = [102.7590,30.0510,105.0757,31.4650];

var map = new ol.Map({
    target: "mapCon",
    view: new ol.View({
       projection: 'EPSG:4326',
       center: centerpoint,
       zoom: 9
    }),
    controls: 
        ol.control.defaults({
            attributionOptions: ({
                collapsible: true
            })
          }).extend([
      new ol.control.ZoomToExtent({
          extent: [103.95231,30.60868,104.17478,30.72088]
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
  var pointfeatures = (new ol.format.GeoJSON()).readFeatures(serviceResult.result.features);
  var pointSource = new ol.source.Vector({
      features: pointfeatures,
      wrapX: false
  });
  vectorlayer = new ol.layer.Vector({
      name: "点矢量图层",
      source: pointSource,
      style: new ol.style.Style({
          image: new ol.style.Icon(({
              anchor: [0.5, 0.9],
              src: '../img/locator/greenIcon.png'
          }))
      })
  });
  //创建热力图
  var radius = 25;
  var blur = 40;
  var heatMap = new ol.layer.Heatmap({
      source: new ol.source.Vector({
          features: pointfeatures,
          wrapX: false
      }),
      blur: blur,
      radius: radius
  });
  var tmpview = new ol.View({
    projection: 'EPSG:4326',
    center: [104.06430,30.66334],
    zoom: 12.5
    });
map.setView(tmpview);
map.addLayer(heatMap);
  
})