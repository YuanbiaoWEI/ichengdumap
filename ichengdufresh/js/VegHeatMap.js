/* 创建地图 */
var centerpoint = [104.09553,30.66810];
var chengdubound = [103.93734,30.58983,104.25255,30.74889];

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


//品类分布图
var chartgroup = echarts.init(document.createElement('div'), 'wonderland', {
    width: 300,
    height: 585,
  });
  var option2 = {
    title: {
      text: '29类生鲜销售分布'
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
    legend:{
      top:27,
      type: 'scroll',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['巴沙鱼', '白菜', '菠菜', '草莓', '车厘子', '带鱼', '鸡翅', '鸡柳', '鸡胸肉', '鸡爪', '苦瓜', '冷鲜肉', '芦笋', '萝卜', '牛里脊', '牛排', '皮皮虾', '水蜜桃', '松花蛋', '汤圆', '土豆', '西红柿', '西兰花', '香菜', '鳕鱼', '鸭舌', '鸭掌', '羊肉片', '猪肋排']
    },
    series: [
      {
        name: '成华区',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [21, 14, 19, 13, 16, 16, 13, 16, 22, 19, 18, 18, 23, 19, 19, 18, 22, 16, 17, 15, 26, 16, 21, 17, 18, 17, 23, 13, 20]
      },
      {
        name: '金牛区',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [ 14, 18, 13, 19, 25, 18, 13, 18, 17, 23, 20, 18, 18, 22, 16, 16, 15, 18, 18, 22, 15, 18, 19, 16, 20, 14, 21, 18, 20]
      },
      {
        name: '锦江区',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [12, 12, 8, 6, 10, 12, 9, 9, 10, 12, 10, 11, 7, 9, 8, 11, 7, 12, 9, 12, 11, 8, 7, 10, 9, 9, 5, 5, 6]
      },
      {
        name: '青羊区',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data:[ 8, 10, 3, 8, 10, 8, 9, 9, 8, 7, 6, 9, 11, 9, 8, 7, 6, 9, 8, 9, 9, 9, 9, 14, 9, 6, 7, 7, 5]
      },
      {
        name: '武侯区',
        type: 'bar',
        stack: 'total',
        label: {
          show: true
        },
        emphasis: {
          focus: 'series'
        },
        data: [ 16, 12, 17, 18, 12, 18, 20, 15, 17, 19, 13, 17, 17, 16, 20, 13, 15, 13, 22, 15, 19, 14, 20, 17, 19, 17, 13, 21, 14]
      }
    ]
  };
  chartgroup.setOption(option2);
  var control2 = new ol.control.Control({
      element: chartgroup.getDom(),
      target: document.getElementById('chartcontrol2')
  });
  map.addControl(control2);

//获取用户选项
var shopSource,shopLayer;
var typeSelect = document.getElementById("type");
typeSelect.onchange = function (e) {
  var value = typeSelect.value;
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
      for(i=0;i<serviceResult.result.features.features.length;i++)
      {
          shopidarr.push(Number(serviceResult.result.features.features[i].properties.超市ID));
      }
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
          shopLayer =null;
        }
        shopLayer = new ol.layer.Heatmap({
          source: shopSource,
          blur: 40,
          radius: 25
        });
        map.addLayer(shopLayer);
      })
  });
};