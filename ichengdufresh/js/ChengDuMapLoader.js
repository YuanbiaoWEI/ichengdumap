/* 创建地图 */
var centerpoint = [104.32737,30.757364097954];
var chengdubound = [102.81561,30.0510,105.55776,31.4650];

var map = new ol.Map({
    target: "mapCon",
    view: new ol.View({
       projection: 'EPSG:4326',
       center: centerpoint,
       zoom: 9.2,
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
map.addControl(new ol.control.ScaleLine())

//商店数量图表
var chartshopnum = echarts.init(document.createElement('div'), 'wonderland', {
  width: 220,
  height: 200,
});
var optionshopnum = {
    title: {
      text: '五主城区生鲜门店总数'
    },
    tooltip: {
      trigger: 'axis',
    axisPointer: {
      // Use axis to trigger tooltip
      type: 'shadow' // 'shadow' as default; can also be 'line' or 'shadow'
    },
      formatter: function (params) {
        var relVal = params[0].name;
        for (var i = 0, l = params.length; i < l; i++) {
            relVal += '<br/>' + params[i].marker + params[i].seriesName + ' : ' + params[i].value + '家'
        }
        return relVal;
        }
    },
    xAxis: {
      data: ['成华', '金牛', '锦江', '青羊', '武侯']
    },
    yAxis: {},
    series: [
      {
        name: '数量',
        type: 'bar',
        data: [37, {
          value: 36,
          itemStyle: {
            color: 'rgb(237, 182, 207)'
          }
        }, {
          value: 18,
          itemStyle: {
            color: 'rgb(159, 200, 213)'
          }
        },  {
          value: 17,
          itemStyle: {
            color: 'rgb(157, 207, 122)'
          }
        }, 34]
      }
    ]
  };
chartshopnum.setOption(optionshopnum);
var control = new ol.control.Control({
    element: chartshopnum.getDom(),
    target: document.getElementById('chartcontrol')
});
map.addControl(control);


//得出所有商店点数组
var vectorSource,vectorLayer;
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
  vectorSource = new ol.source.Vector({
      features: vectorfeature,
      wrapX: false
  });
  vectorLayer = new ol.layer.Vector({
      name: "点矢量图层",
      source: vectorSource,
      style: new ol.style.Style({
          image: new ol.style.Icon(({
              src: '../img/locator/geolocation_marker.png'
          }))
      })
    })
    map.addLayer(vectorLayer);
});
map.on("moveend",function(e){
  var zoom = map.getView().getZoom();  //获取当前地图的缩放级别
  if(zoom > 12){
      vectorLayer.setVisible(true);
      //地图鼠标移动事件
      map.on('pointermove',pointermoveListener);
      //地图鼠标点击事件
      map.on('click',clickListener);
  }
  if(zoom <= 12){
      vectorLayer.setVisible(false);
  }
}); 

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
                        contentHTML = contentHTML+"<th></th><th></th></tr>";
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