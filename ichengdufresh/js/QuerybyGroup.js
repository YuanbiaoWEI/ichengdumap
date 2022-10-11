/* 创建地图 */
var centerpoint = [104.06430,30.66334];
var chengdubound = [103.95231,30.60868,104.17478,30.72088];

var map = new ol.Map({
    target: "mapCon",
    view: new ol.View({
       projection: 'EPSG:4326',
       center: centerpoint,
       zoom: 12.5
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

//获取用户选项
var shopSource,shopLayer;
var typeSelect = document.getElementById("type");
typeSelect.onchange = function (e) {
  var value = typeSelect.value;
  if(value !== '清除'){
    var dataurl = "http://localhost:8090/iserver/services/data-ChengduFresh/rest/data";
    var sqlParam = new SuperMap.GetFeaturesBySQLParameters({
      queryParameter: {
          name: "Price@ChengduFresh",
          attributeFilter: "品类 like \'"+ value +"\'",
      },
      datasetNames: ["ChengduFresh:Price"],
      toIndex: 200,
    });
    new ol.supermap.FeatureService(dataurl).getFeaturesBySQL(sqlParam, function (serviceResult) {
        var shopidarr =[];
        var lowestprice = 1000;
        var higestprice = 0;
        var totalprice = 0.0; 
        for(i=0;i<serviceResult.result.features.features.length;i++)
        {
            shopidarr.push(Number(serviceResult.result.features.features[i].properties.超市ID));
            var price = serviceResult.result.features.features[i].properties.价格元KG
            if( price >= higestprice)
                higestprice = price;
            if( price <= lowestprice)
                lowestprice = price;
            totalprice += Number(price);
        }
        var avgprice = (totalprice/serviceResult.result.features.features.length).toFixed(2);
        var idParam = new SuperMap.GetFeaturesByIDsParameters({
          IDs: shopidarr,
          datasetNames: ["ChengduFresh:Shop"],
          toIndex: 200,
        });
        new ol.supermap.FeatureService(dataurl).getFeaturesByIDs(idParam, function (serviceResult) {
          console.log(serviceResult.result);
  
          shopSource = new ol.source.Vector({
            features:(new ol.format.GeoJSON()).readFeatures(serviceResult.result.features),
            wrapX: false,
          });
  
          if(shopLayer!==undefined)
          {
            map.removeLayer(shopLayer);
            shopLayer.getSource().clear;
            shopLayer =undefined;
            overlay.setPosition(undefined);
            map.removeOverlay(overlay);
          }
          shopLayer = new ol.layer.Vector({
            source: shopSource,
            style: new ol.style.Style({
                image: new ol.style.Icon(({
                    anchor: [0.5, 0.9],
                    src: '../img/locator/greenIcon.png'
                }))
            })
          });
          map.addLayer(shopLayer);

          //地图鼠标移动事件
        map.on('pointermove',pointermoveListener);
        //地图鼠标点击事件
        map.on('click',function(e){
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
                            if(features[i].properties.品类!==value)
                                contentHTML = contentHTML+"<tr><th>"+features[i].properties.品类+"</th><th>"+features[i].properties.价格元KG+"</th>";
                            else{
                                contentHTML = contentHTML+"<tr><th style=\"background-color: yellow;\">"+features[i].properties.品类+"</th><th style=\"background-color: yellow;\">"+features[i].properties.价格元KG+"</th>";
                            }
                            if(i+1<features.length){
                                if(features[i+1].properties.品类!==value)
                                    contentHTML = contentHTML+"<th>"+features[i+1].properties.品类+"</th><th>"+features[i+1].properties.价格元KG+"</th></tr>";
                                else{
                                    contentHTML = contentHTML+"<th style=\"background-color: yellow;\">"+features[i+1].properties.品类+"</th><th style=\"background-color: yellow;\">"+features[i+1].properties.价格元KG+"</th></tr>";
                                }    
                            }
                            else{
                                contentHTML = contentHTML+"</tr>";
                            }
                        }
                        contentHTML = contentHTML+"</table>";
                        contentHTML = contentHTML+"<p style=\"font-size: 4px;\">"+value+"价目信息：(kg/元)</p>";
                        contentHTML = contentHTML+"<p style=\"font-size: 4px;\">最低："+lowestprice+"；平均："+avgprice+"；最高："+higestprice+"</p>";
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
        });
        })
    });
  }
  else{
    if(shopLayer!==undefined)
          {
            map.removeLayer(shopLayer);
            shopLayer.getSource().clear;
            shopLayer = undefined;
    }
    overlay.setPosition(undefined);
    map.removeOverlay(overlay);
  }
};

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